#!/usr/bin/env python3
r"""AC-6.1 · AC-6.2 · AC-6.3 — golden set EXPECT ĐỊA CHỈ, không expect điểm.

· AC-6.1 `golden.yaml` phủ đủ 7 ca Việt (tên ca cố định — thiếu ca nào NÊU TÊN) + 4 ca zh
  CÓ MẶT trong file; một entry có `expect_diem` ⇒ ĐỎ ngay lúc khai (workflow §4).
· AC-6.2 đổi `w_title` KHÔNG làm golden đỏ: chạy 7 ca Việt với hai w_title khác nhau ⇒ cùng
  kết quả đạt/trượt.
· AC-6.3 (soft) bốn ca zh chỉ đo trên KHO THẬT. Điều kiện lật là MỘT SỐ: kho có ≥2 bản ghi
  chữ Hán (đếm qua `GET /api/kho-delta` + `GET /api/xuat/<loai>/<slug>?dang=goc` của LÕI THẬT
  `127.0.0.1:8787`, bằng dải `core/assets/dai-han.json`, phồn HOẶC giản đều tính). N < 2 ⇒
  in `soft — kho có N < 2 bài tiếng Trung, vế zh chưa đo được` rồi exit 0 — KHÔNG xanh im lặng,
  KHÔNG đỏ oan, KHÔNG xanh bằng fixture bịa.

Bảy ca Việt chạy trên kho THẬT (địa chỉ trong golden là heading thật của kho). LÕI thật
không chạy ⇒ vế 7 ca in "chưa đo được — LÕI :8787 không trả lời" và đỏ (đó là điều kiện
bàn giao T13-6, không phải trạng thái hợp lệ).

ĐỎ_KHI  thiếu ca Việt (nêu tên) · entry expect điểm · 7 ca Việt trượt trên kho thật · w_title đổi làm đạt/trượt đổi
XANH_KHI 7 ca Việt đạt ở cả hai w_title; zh: soft nói số thật (N<2) hoặc 4 ca đạt (N≥2)
--tu-kiem: golden thiếu một ca ⇒ nêu đúng tên; entry expect_diem ⇒ đỏ; đếm bài Hán trên 3 bản ghi giả ⇒ đúng số.
"""
import os
import sys
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _nap  # noqa: E402

try:
    import yaml
except ImportError:
    print("ĐỎ SAI LÝ DO · THIẾU PACKAGE `pyyaml` — cài + pin ở truyhoi/pyproject.toml")
    sys.exit(3)

CONG = "check_golden_du_ca.py"
GOLDEN = K.TESTS / "golden.yaml"
BAY_CA = ["co-dau-sang-khong-dau", "khong-dau-sang-co-dau", "nfd", "chu-d-thuong", "chu-d-hoa", "hon-hop-dau", "viet-hoa"]
BON_ZH = ["zh-mot-chu", "zh-hai-chu", "zh-bon-chu", "zh-tron-viet"]
# LÕI THẬT: mặc định :8787 (server của chủ dự án); CI/worktree trỏ bằng env `TRUYHOI_LOI_URL` tới một
# `web/server.mjs` chạy trên KB_DIR=kb/ (export thật của kho) — vẫn là KHO THẬT, không phải fixture.
import os as _os  # noqa: E402
LOI_THAT = (_os.environ.get("TRUYHOI_LOI_URL") or "http://127.0.0.1:8787").rstrip("/")
CONG_THAT = int(LOI_THAT.rsplit(":", 1)[1])


def soi_golden(g: dict) -> list[str]:
    loi = []
    co_v = {c.get("ten") for c in g.get("ca_viet", [])}
    co_z = {c.get("ten") for c in g.get("ca_trung", [])}
    loi += [f"thiếu ca Việt `{t}`" for t in BAY_CA if t not in co_v]
    loi += [f"thiếu ca Trung `{t}`" for t in BON_ZH if t not in co_z]
    for c in g.get("ca_viet", []) + g.get("ca_trung", []):
        if "expect_diem" in c or "expect_bm25" in c:
            loi.append(f"ca `{c.get('ten')}` expect ĐIỂM — golden chỉ expect ĐỊA CHỈ")
        if c in g.get("ca_viet", []) and not c.get("expect_trong_top_k"):
            loi.append(f"ca Việt `{c.get('ten')}` không có địa chỉ mong đợi")
    return loi


def dem_bai_han(cac_than: list[str]) -> int:
    d = K.dai_han()
    return sum(1 for t in cac_than if K.co_han(t, d))


def dat(ket_qua: list[dict], mong: list[str]) -> bool:
    co = {f"{x['file']}#{x['anchor']}" for x in ket_qua} | {x["dia_chi"] for x in ket_qua}
    return any(m in co for m in mong)


if K.TU_KIEM:
    print("\ntu-kiem · soi golden và đếm bài Hán phải ĐỎ ĐƯỢC\n")
    g = yaml.safe_load(GOLDEN.read_text(encoding="utf-8"))
    K.kiem(soi_golden(g) == [], "golden.yaml hiện tại sạch (đủ 7 + 4, không expect điểm)", " · ".join(soi_golden(g)))
    thieu = {"ca_viet": [c for c in g["ca_viet"] if c["ten"] != "chu-d-hoa"], "ca_trung": g["ca_trung"]}
    K.kiem(soi_golden(thieu) == ["thiếu ca Việt `chu-d-hoa`"], "bỏ một ca ⇒ NÊU ĐÚNG TÊN ca thiếu", str(soi_golden(thieu)))
    diem = {"ca_viet": g["ca_viet"][:6] + [{**g["ca_viet"][6], "expect_diem": -7.4}], "ca_trung": g["ca_trung"]}
    K.kiem(any("expect ĐIỂM" in x for x in soi_golden(diem)), "entry expect điểm ⇒ đỏ ngay lúc khai")
    K.kiem(dem_bai_han(["資料管線", "数据", "không Hán", "ひらがな"]) == 2, "đếm bài Hán bằng dải dai-han.json: phồn + giản = 2, kana không tính")
    K.kiem(dat([{"file": "kb/a.md", "anchor": "x", "dia_chi": "a.md:1-2"}], ["kb/a.md#x"]) and not dat([], ["kb/a.md#x"]), "phép đạt/trượt theo địa chỉ")
    # T13-8 AC2 · ba mã HTTP từ LÕI (422 · 500 · 404) ⇒ CHÍNH CỔNG NÀY chạy con, phải kết luận ĐỖ, 0 traceback.
    import subprocess
    import _loi_gia
    for ma_gieo, cach in ((422, "khong_file_goc"), (500, "goc"), (404, "bai")):
        kho = _loi_gia.kho_mau()
        if cach == "khong_file_goc":
            for d in kho.values():
                d["khong_file_goc"] = True          # MỌI bản ghi 422 — indexer chưa fallback thì chết ngay
        with _loi_gia.LoiGia(kho) as loi:
            if cach in ("goc", "bai"):
                loi.loi_cua[(cach, "pipeline-basics")] = ma_gieo
            r = subprocess.run([sys.executable, __file__], capture_output=True, text=True, encoding="utf-8",
                               env={**os.environ, "TRUYHOI_LOI_URL": loi.url(), "PYTHONIOENCODING": "utf-8"}, timeout=180)
        ra = (r.stdout or "") + (r.stderr or "")
        K.kiem("Traceback" not in ra, f"LÕI gieo {ma_gieo} ({cach}) ⇒ cổng KHÔNG traceback", ra[-300:])
        K.kiem(r.returncode != 0 and ("FAIL" in ra or "ĐỔ" in ra or "ĐỎ" in ra), f"LÕI gieo {ma_gieo} ⇒ cổng ĐỎ vì kết luận (exit {r.returncode})", ra[-200:])
    K.tu_kiem_xong(CONG, 11)

print("\n1 · golden.yaml — đủ 7 ca Việt + 4 ca Trung, expect địa chỉ\n")
g = yaml.safe_load(GOLDEN.read_text(encoding="utf-8"))
vp = soi_golden(g)
K.kiem(not vp, "đủ ca, không entry nào expect điểm", " · ".join(vp))

try:
    indexer, db, rank, chuan_hoa = _nap.nap("indexer", "db", "rank", "chuan_hoa")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-6")

print("\n2 · kho THẬT qua LÕI :8787 — đếm bài chữ Hán (AC-6.3) và chạy 7 ca Việt\n")
try:
    ma, delta, _ = K.goi(CONG_THAT, "GET", "/api/kho-delta", timeout=5)
except OSError as e:
    ma, delta = 0, {"loi": str(e)}
if ma != 200 or not isinstance(delta, dict):
    # CI không có kho thật (đo 2026-09-10: `dung_lai_db.py` từ export đã commit ⇒ "kho thiếu byte" — export không
    # tự đủ để dựng DB). Nên CI KHAI TƯỚNG MINH bằng env rằng vế này đo TAY trên máy có LÕI thật (khuôn
    # `check_e2e_chung_cat --mock` của M12: vế `--that` chạy tay, ghi worklog). Không đặt env ⇒ ĐỎ như thường.
    if os.environ.get("TRUYHOI_KHONG_CO_LOI") == "1":
        print(f"  ·  BỎ QUA CÓ KHAI (TRUYHOI_KHONG_CO_LOI=1) — LÕI {LOI_THAT} không trả lời: 7 ca Việt + vế zh CHƯA ĐO ở đây; "
              "chạy tay trên máy có LÕI thật rồi ghi worklog (điều kiện bàn giao T13-6). Không phải xanh.")
        print("\n" + "-" * 62 + "\nCHƯA ĐO · golden.yaml đủ ca, vế chạy thật để lại cho máy có kho")
        sys.exit(0)
    K.kiem(False, f"LÕI thật {LOI_THAT} trả /api/kho-delta", f"ma={ma} — không đo được golden trên kho thật (điều kiện bàn giao T13-6)")
    K.chot("")
than = []
for it in delta.get("items", []):
    m2, _j, _h = K.goi(CONG_THAT, "GET", f"/api/articles/{it['loai']}/{it['slug']}", timeout=5)
    if m2 == 200 and _j:
        than.append(str(_j.get("body", "")) + " " + str((_j.get("frontmatter") or {}).get("title", "")))
n_han = dem_bai_han(than)
print(f"  ·  kho thật: {len(than)} bản ghi · {n_han} bản ghi có chữ Hán (dải dai-han.json, phồn hoặc giản)")

with K.tam("gn_m13_golden_") as tmp:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=LOI_THAT):
        con = db.mo(ghi=True)
        try:
            # WO-099 vế B · mọi mã HTTP từ LÕI phải thành KẾT LUẬN ĐỎ (cửa + mã), không traceback.
            try:
                ri = indexer.reindex(con, day_du=True)
            except urllib.error.HTTPError as e:
                K.kiem(False, "reindex trên kho thật không ném", f"LÕI {e.url} · mã {e.code} — indexer chưa chịu được (WO-099)")
                K.chot("")
            except (urllib.error.URLError, OSError) as e:
                K.kiem(False, "reindex trên kho thật không ném", f"LÕI {LOI_THAT} không trả lời: {e}")
                K.chot("")
            hong = ri.get("hong") or []
            K.kiem(not hong, f"reindex {ri.get('xem')}/{ri.get('xem')} bản ghi, 0 bản ghi hỏng",
                   " · ".join(f"{h.get('slug')} ← {h.get('cua')} mã {h.get('ma')}" for h in hong))
            print(f"  ·  reindex: {ri}")
            kq = {}
            for w in (5.0, 10.0):
                with K.env_tam(TRUYHOI_W_TITLE_VI_EN=str(w)):
                    kq[w] = {}
                    for c in g["ca_viet"]:
                        q = c["query"]
                        if c.get("nfd"):
                            import unicodedata
                            q = unicodedata.normalize("NFD", q)
                        r = rank.truy_hoi(con, cau_hoi=q, pham_vi={}, nguon=None, k=int(c.get("k", g.get("k_mac_dinh", 10))))
                        kq[w][c["ten"]] = dat(r["ket_qua"], c["expect_trong_top_k"])
            truot = [t for t, ok in kq[5.0].items() if not ok]
            K.kiem(not truot, f"7 ca Việt đạt trên kho thật (w_title=5) — trượt: {truot or 'không'}")
            K.kiem(kq[5.0] == kq[10.0], "AC-6.2 · đổi w_title 5→10 KHÔNG đổi đạt/trượt (golden expect địa chỉ)", str({t: (kq[5.0][t], kq[10.0][t]) for t in kq[5.0] if kq[5.0][t] != kq[10.0][t]}))

            print("\n3 · AC-6.3 · bốn ca tiếng Trung — chỉ trên kho thật\n")
            if n_han < 2:
                print(f"  ·  soft — kho có {n_han} < 2 bài tiếng Trung, vế zh chưa đo được (điền expect khi đủ; phồn hoặc giản đều tính)")
            else:
                for c in g["ca_trung"]:
                    mong = c.get("expect_trong_top_k")
                    if not mong:
                        K.kiem(False, f"ca zh `{c['ten']}`: kho đã có {n_han} bài Hán nhưng golden chưa điền địa chỉ mong đợi — lật sang hard, điền ngay")
                        continue
                    r = rank.truy_hoi(con, cau_hoi=c["query"], pham_vi={}, nguon=None, k=int(c.get("k", 10)))
                    ok = dat(r["ket_qua"], mong)
                    he = c.get("he_chu", "?")
                    K.kiem(ok, f"ca zh `{c['ten']}` (hệ chữ {he}) đạt",
                           f"trượt — nếu kho chỉ có hệ chữ khác `{he}` thì đây là TRƯỢT VÌ HỆ CHỮ (fold OpenCC chưa quyết), không phải không tìm thấy")
        finally:
            con.close()

K.chot(f"golden đủ ca · 7 ca Việt đạt, w_title không đổi kết quả · zh: {'soft ' + str(n_han) + '/2' if n_han < 2 else 'đo trên kho thật'}")
