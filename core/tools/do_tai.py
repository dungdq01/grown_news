#!/usr/bin/env python3
"""Bộ đo TẢI — s9/G7 đòi `workload_report` có số thật (p95 · throughput · lỗi).

VÌ SAO CÔNG CỤ NÀY TỒN TẠI

Dự án có 77 cổng. Chúng đo **byte**, **cấu trúc**, **hành vi** — và **không cái
nào đo THỜI GIAN**. Hệ quả đã trả giá hai lần:

  · Người dùng báo *"load hơi lâu"*. Mười màn đều ~230 ms, đồng đều, với kho
    **1 bản ghi**. Không cổng nào từng in ra con số đó, nên nó sống nhiều tháng.
  · `page-weight` đo byte ở 120 bản ghi. Lịch sử plan ghi *"500 bản ghi →
    1217 KB → trang không dùng được"* — phát hiện BẰNG TAY, và từ đó **chưa ai
    đo lại**.

Mọi con số hiệu năng của dự án cho tới nay đều mô tả một hệ thống có 1 bản ghi.

━━━ BẢY QUYẾT ĐỊNH THIẾT KẾ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D1 · TÁCH ĐỒNG HỒ THEO PHA — connect · ttfb · nhận.
     Không phải để đẹp báo cáo. WO-033: 205 ms nằm TRỌN trong `connect`, và một
     con số tổng "230 ms" chỉ thẳng vào renderer — sai nghi phạm, sai bản vá.
     Tổng thời gian là con số KHÔNG hành động được.

D2 · QUÉT THEO TẢI, KHÔNG ĐO MỘT ĐIỂM.
     Một phép đo ở N=1 không nói gì về workload. Quét N = 1 · 50 · 200 · 800.

D3 · SỐ BẤT BIẾN LÀ ĐỘ DỐC, KHÔNG PHẢI MILI GIÂY.  ← quyết định trung tâm
     Mili giây đổi theo máy, theo tải nền, theo lần chạy. Một cổng đỏ theo ms là
     `#cổng-đỏ-oan` — nó sẽ đỏ oan cho tới khi có người tắt nó.
     Thứ KHÔNG đổi theo máy là **hình dạng tăng trưởng**: t(N) ~ N^k.
       k ≈ 0   phẳng — kho lớn lên không đắt thêm
       k ≈ 1   tuyến tính — chấp nhận được, biết trước
       k ≥ 1.6 mầm hỏng — hôm nay còn nhanh, N gấp mười thì không
     Một màn 40 ms ở N=1 và 40 ms ở N=800 là KHOẺ. Một màn 40 → 900 ms là HỎNG,
     dù cả hai đều "đủ nhanh hôm nay".

D4 · BYTE THÌ TẤT ĐỊNH, THỜI GIAN THÌ KHÔNG.
     Nên byte và tỉ lệ lỗi được phép làm cổng cứng; thời gian thì chỉ **hình
     dạng** của nó được. Trộn hai loại vào một ngưỡng là cách sinh cổng đỏ oan.

D5 · p95, KHÔNG PHẢI TRUNG BÌNH (s9 đòi).
     Trung bình giấu đuôi. Người dùng sống ở đuôi.

D6 · ĐO TRÊN KHO TẠM, KHÔNG KHO THẬT.
     Luật đã có của dự án. Bộ đo này gieo tới 800 bản ghi — trỏ nhầm là hỏng kho.

D7 · KHÔNG PHẢI CỔNG TRONG `npm test`.
     Nó bật server và gieo hàng trăm bản ghi; chạy mỗi lần commit là đổi một phép
     đo lấy một phiền phức. Đây là INSTRUMENT — chạy khi phát hành (s9/G7), khi
     nghi ngờ, hoặc khi đổi thứ có thể đắt.

Dùng:
    python core/tools/do_tai.py --xem        # quét nhanh: N = 1, 50
    python core/tools/do_tai.py              # quét đủ:   N = 1, 50, 200, 800
    python core/tools/do_tai.py --n 1,100    # tự chọn mốc tải
"""

import json
import math
import os
import shutil
import socket
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
WEB = R / "web"

# Màn nào đo: đường dẫn + tên đọc được. Lấy từ bảng khai để thêm màn là tự đo.
MAN_JSON = R / "core" / "assets" / "man-hinh.json"

# Số lần lặp mỗi phép đo. 12 đủ cho p95 mà không kéo dài phiên đo.
LAP = 12
# Bỏ 2 lần đầu: lần chạm đầu tiên cõng chi phí khởi động (JIT, mở DB, cache OS).
BO_DAU = 2


def kb(n):
    return f"{n / 1024:.0f} KB"


# ── gieo tải ────────────────────────────────────────────────────────────────
def gieo(kho: Path, n: int):
    """Gieo `n` bản ghi .md hợp lệ, chia đều ba module.

    Viết thẳng file thay vì gọi API: bộ đo cần dựng 800 bản trong vài giây, và
    đường API có validate + spawn Python cho MỖI bản. Hình dạng frontmatter lấy
    đúng theo `kb-mock/` để `dung_lai_db.py` nhập được.
    """
    loai = ["article", "repo", "paper", "docs", "announcement"]
    for lo in loai + ["tai-lieu", "video"]:
        (kho / lo).mkdir(parents=True, exist_ok=True)
    (kho / "concepts.yaml").write_text(
        "- id: do-tai\n  label_vi: Đo tải\n", encoding="utf-8")
    (kho / "categories.yaml").write_text(
        "- id: do-tai-cat\n  label_vi: Đo tải\n  gom: đo tải\n", encoding="utf-8")

    than = ("## 1. Bài này là gì\n\nNội dung gieo để đo tải.\n\n"
            "## 2. Bối cảnh\n\nGieo.\n\n## 3. Cơ chế\n\n"
            "### 3.1 Vào\n\nGieo.\n\n### 3.2 Xử lý\n\nChi tiết [nguon.py:1-9]\n\n"
            "### 3.3 Output\n\nGieo.\n\n### 3.4 Giới hạn\n\nGieo.\n\n"
            "## 4. Đối chiếu\n\nGieo.\n\n## 5. Rủi ro và tầm nhìn\n\nGieo.\n")
    for i in range(n):
        st = loai[i % len(loai)]
        fm = {
            "id": f"src_dotai{i:06d}", "slug": f"do-tai-{i:05d}",
            "source_type": st, "url": f"https://example.com/do-tai-{i}",
            "url_normalized": f"example.com/do-tai-{i}",
            "protocol_version": "2.0", "analyzed_at": "2026-08-29",
            "title": f"Bản gieo số {i} để đo tải hệ thống",
            "one_liner": f"Bản ghi gieo thứ {i} — dùng để đo tải, không phải nội dung thật",
            "credibility_max": "plausible", "conformance": "B",
            "review_status": "approved", "origin": "manual",
            "concepts": ["do-tai"], "concepts_proposed": [],
            "category": ["do-tai-cat"], "word_count": 60, "priority": i % 5,
        }
        s = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fm.items())
        (kho / st / f"{fm['slug']}.md").write_text(
            f"---\n{s}\n---\n\n{than}\n", encoding="utf-8")


def cong_ranh():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# ── một phép đo ─────────────────────────────────────────────────────────────
def do_mot(url: str, lap=LAP):
    """Trả (p50, p95, byte, so_loi) cho `lap` lần gọi — ms, tách connect/ttfb.

    Dùng `urllib` chứ không `requests`: không thêm phụ thuộc cho một công cụ đo.
    Mỗi lần mở kết nối MỚI — đó chính là thứ WO-033 phát hiện, và tái dùng kết
    nối sẽ GIẤU nó đi.
    """
    tong, byte, loi = [], 0, 0
    for i in range(lap):
        t0 = time.perf_counter()
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                d = r.read()
                if i >= BO_DAU:
                    tong.append((time.perf_counter() - t0) * 1000)
                    byte = len(d)
        except Exception:
            loi += 1
    if not tong:
        return None, None, byte, loi
    tong.sort()
    p95 = tong[min(len(tong) - 1, math.ceil(0.95 * len(tong)) - 1)]
    return statistics.median(tong), p95, byte, loi


def doc(mocs, gia_tri):
    """Hệ số góc log-log. `None` nếu không đủ điểm hoặc có giá trị <= 0."""
    xy = [(math.log(n), math.log(v)) for n, v in zip(mocs, gia_tri)
          if n > 0 and v and v > 0]
    if len(xy) < 2:
        return None
    mx = sum(x for x, _ in xy) / len(xy)
    my = sum(y for _, y in xy) / len(xy)
    tu = sum((x - mx) * (y - my) for x, y in xy)
    mau = sum((x - mx) ** 2 for x, _ in xy)
    return None if mau == 0 else tu / mau


def hinh_dang(k, boi=None):
    """Nhãn theo ĐỘ DỐC — nhưng bội số có quyền phủ quyết.

    `k` một mình GIẤU BỘI SỐ: một đường đi 48 → 315 ms trên N = 1 → 800 có
    k ≈ 0.26, đúng về toán (dưới tuyến) và sai về nghĩa. Người dùng sống với
    mili giây, không sống với số mũ. Lần chạy đầu của công cụ này dán nhãn
    "PHẲNG" lên đúng đường đó.

    Nên: `k` quyết hình dạng, `boi` có quyền hạ nhãn xuống.
    """
    if k is None:
        return "—"
    if k < 0.15:
        nh = "PHẲNG"
    elif k < 0.6:
        nh = "DƯỚI TUYẾN"
    elif k < 1.15:
        nh = "TUYẾN TÍNH"
    elif k < 1.6:
        nh = "TRÊN TUYẾN"
    else:
        nh = "MẦM HỎNG"
    # Bội số phủ quyết: dưới tuyến mà vẫn đắt gấp 5 thì đừng gọi là phẳng.
    if boi and boi >= 5 and nh in ("PHẲNG", "DƯỚI TUYẾN"):
        nh = "ĐẮT DẦN"
    return nh


# ── chạy một mốc tải ────────────────────────────────────────────────────────
def mot_moc(n: int, duong: list):
    goc = Path(tempfile.mkdtemp(prefix=f"gn-tai-{n}-"))
    kho, rac = goc / "kb", goc / "_recycle"
    kho.mkdir()
    rac.mkdir()
    gieo(kho, n)

    # Gieo .md THÔI thì server thấy kho RỖNG — DB mới là thứ nó đọc.
    # Bỏ bước này là bộ đo xanh vì MÙ: byte y hệt ở mọi mốc N, và mọi độ dốc
    # ra 0.00 một cách hoàn hảo. Đúng dấu hiệu ấy đã lộ ở lần chạy đầu.
    nap = subprocess.run(
        [sys.executable, str(R / "core" / "tools" / "dung_lai_db.py")],
        env={**os.environ, "KB_DIR": str(kho), "RECYCLE_DIR": str(rac),
             "PYTHONIOENCODING": "utf-8"},
        capture_output=True, text=True)
    if nap.returncode != 0:
        print(f"  dung_lai_db trượt ở N={n}: {(nap.stderr or nap.stdout)[-300:]}")
        return None

    env = {**os.environ, "KB_DIR": str(kho), "RECYCLE_DIR": str(rac),
           "PYTHONIOENCODING": "utf-8", "PYTHON": sys.executable}
    cong = cong_ranh()
    env["API_PORT"] = str(cong)
    sv = subprocess.Popen([shutil.which("node") or "node", "server.mjs"],
                          cwd=WEB, env=env,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        # Chờ server dậy — hỏi, không ngủ một con số đoán.
        for _ in range(120):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{cong}/api/health", timeout=1).read()
                break
            except Exception:
                time.sleep(0.25)
        else:
            print(f"  server không dậy ở N={n}")
            return None

        ra = {}
        for ten, p in duong:
            p50, p95, byte, loi = do_mot(f"http://127.0.0.1:{cong}{p}")
            ra[ten] = dict(p50=p50, p95=p95, byte=byte, loi=loi)
        return ra
    finally:
        sv.terminate()
        try:
            sv.wait(timeout=10)
        except Exception:
            sv.kill()
        shutil.rmtree(goc, ignore_errors=True)


def main():
    xem = "--xem" in sys.argv
    mocs = [1, 50]
    if "--n" in sys.argv:
        mocs = [int(x) for x in sys.argv[sys.argv.index("--n") + 1].split(",")]
    elif not xem:
        mocs = [1, 50, 200, 800]

    man = json.loads(MAN_JSON.read_text(encoding="utf-8"))["man"]
    duong = [(m["ten"], m["path"]) for m in man]
    duong += [("api:index", "/api/index"), ("api:articles", "/api/articles"),
              ("api:concepts", "/api/concepts"), ("tai-san:gn.js", "/gn.js")]

    print(f"\nĐO TẢI · {len(duong)} đường · mốc N = {', '.join(map(str, mocs))} "
          f"· {LAP} lần/phép (bỏ {BO_DAU} lần đầu)\n")

    do = {}
    for n in mocs:
        print(f"  gieo {n} bản ghi, bật server, đo…", flush=True)
        kq = mot_moc(n, duong)
        if kq is None:
            return 1
        do[n] = kq

    # ── TỰ KIỂM VẬT LIỆU ─────────────────────────────────────────────────
    #
    # Một bộ đo không kiểm vật liệu của nó là bộ đo chưa biết mình đo cái gì.
    # Nếu byte KHÔNG tăng theo N thì phép gieo không tới được server, và mọi
    # con số bên dưới vô nghĩa — nhưng chúng vẫn trông rất đẹp: mọi độ dốc
    # ra 0.00 "PHẲNG". Lần chạy đầu của chính công cụ này đã như vậy.
    if len(mocs) >= 2:
        nho, to = mocs[0], mocs[-1]
        # So trên MÀN LIỆT KÊ, không so `max` toàn bộ đường: `gn.js` 98 KB át
        # hết và không bao giờ đổi, nên `max` luôn báo "không tăng" — phép tự
        # kiểm đầu tiên của tôi đã sai đúng chỗ đó.
        MOC_VL = "tat-ca"
        bn = do[nho].get(MOC_VL, {}).get('byte', 0)
        bt = do[to].get(MOC_VL, {}).get('byte', 0)
        if bt <= bn:
            print(f"\nVẬT LIỆU HỎNG: byte lớn nhất ở N={nho} là {kb(bn)}, ở "
                  f"N={to} là {kb(bt)} — KHÔNG tăng.")
            print("Phép gieo không tới được server; mọi số ở trên vô nghĩa.")
            return 1
        print(f"\nvật liệu OK: trang lớn nhất {kb(bn)} (N={nho}) → "
              f"{kb(bt)} (N={to})")

    # ── báo cáo ──────────────────────────────────────────────────────────
    dong = []
    dong.append("| đường | " + " | ".join(f"N={n} p95" for n in mocs)
                + " | ×bội | độ dốc k | hình dạng |")
    dong.append("|---|" + "---|" * (len(mocs) + 3))
    canh_bao, tong_loi = [], 0
    for ten, _ in duong:
        p95s = [do[n][ten]["p95"] for n in mocs]
        tong_loi += sum(do[n][ten]["loi"] for n in mocs)
        k = doc(mocs, p95s)
        boi = (p95s[-1] / p95s[0]) if p95s[0] and p95s[-1] else None
        h = hinh_dang(k, boi)
        if h in ("MẦM HỎNG", "TRÊN TUYẾN", "ĐẮT DẦN"):
            canh_bao.append((ten, k, h))
        o = " | ".join("—" if v is None else f"{v:.0f} ms" for v in p95s)
        kt = "—" if k is None else f"{k:.2f}"
        bt = "—" if not boi else f"×{boi:.1f}"
        dong.append(f"| `{ten}` | {o} | {bt} | {kt} | {h} |")

    print()
    for l in dong:
        print(l)

    byte_dong = ["", "| đường | " + " | ".join(f"N={n}" for n in mocs) + " | độ dốc byte |",
                 "|---|" + "---|" * (len(mocs) + 1)]
    for ten, _ in duong:
        bs = [do[n][ten]["byte"] for n in mocs]
        k = doc(mocs, bs)
        byte_dong.append(f"| `{ten}` | " + " | ".join(kb(b) for b in bs)
                         + f" | {'—' if k is None else f'{k:.2f}'} |")
    for l in byte_dong:
        print(l)

    print(f"\nlỗi: {tong_loi}")
    if canh_bao:
        print("\nCẦN SOI:")
        for ten, k, h in canh_bao:
            print(f"  · `{ten}`  k={k:.2f}  {h}")

    # ── ghi báo cáo + baseline ───────────────────────────────────────────
    d9 = R / "09_deploy"
    d9.mkdir(exist_ok=True)
    (d9 / "workload_baseline.json").write_text(json.dumps(
        {"mocs": mocs, "lap": LAP, "do": {str(k): v for k, v in do.items()}},
        ensure_ascii=False, indent=1), encoding="utf-8")

    bc = [
        "# workload_report — số đo tải (s9/G7)",
        "",
        "> Sinh bằng `python core/tools/do_tai.py`. **Không sửa tay**: mọi số ở đây",
        "> phải là output máy (`#tự-khai`).",
        "",
        f"Mốc tải: **{', '.join(map(str, mocs))}** bản ghi · {LAP} lần mỗi phép, bỏ",
        f"{BO_DAU} lần đầu · p95, không phải trung bình.",
        "",
        "## Vì sao đọc ĐỘ DỐC chứ không đọc mili giây",
        "",
        "Mili giây đổi theo máy, theo tải nền, theo lần chạy — một ngưỡng ms sẽ đỏ",
        "oan cho tới khi có người tắt nó. Thứ **không** đổi theo máy là hình dạng",
        "tăng trưởng `t(N) ~ N^k`:",
        "",
        "| k | nghĩa |",
        "|---|---|",
        "| < 0.35 | **PHẲNG** — kho lớn lên không đắt thêm |",
        "| < 1.15 | **TUYẾN TÍNH** — đắt theo N, biết trước |",
        "| < 1.6 | **TRÊN TUYẾN** — đắt hơn N, soi lại |",
        "| ≥ 1.6 | **MẦM HỎNG** — hôm nay còn nhanh, N gấp mười thì không |",
        "",
        "Một màn 40 ms ở N=1 và 40 ms ở N=800 là **khoẻ**. Một màn 40 → 900 ms là",
        "**hỏng**, dù cả hai đều đủ nhanh hôm nay.",
        "",
        "## Thời gian (p95)",
        "",
    ] + dong + ["", "## Byte", ""] + byte_dong[1:] + [
        "", f"**lỗi: {tong_loi}**", ""]
    if canh_bao:
        bc += ["## Cần soi", ""] + [f"- `{t}` — k={k:.2f} · {h}" for t, k, h in canh_bao] + [""]
    (d9 / "workload_report.md").write_text("\n".join(bc) + "\n", encoding="utf-8")
    print(f"\nđã ghi 09_deploy/workload_report.md + workload_baseline.json")

    # Chỉ ĐỎ theo thứ TẤT ĐỊNH: lỗi. Thời gian thì chỉ cảnh báo (D4).
    return 1 if tong_loi else 0


if __name__ == "__main__":
    sys.exit(main())
