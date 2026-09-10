#!/usr/bin/env python3
r"""Cổng địa chỉ — `B-A5` (phân giải được) + `B-A6` (`citations_*` do máy đếm).

VÌ SAO CỔNG NÀY TỒN TẠI
`LOCATOR_RE = \[[^\]]{2,80}\]` khớp MỌI thứ trong ngoặc vuông. Đo trên bản
`phan-tich` duy nhất của kho: cùng với 15 địa chỉ `[§...]` thật, một dãy số
`[2, 1, 0.5, -0.5, -1, -2]` và một công thức Taylor cũng đang được tính là
"có địa chỉ". Và `citations_sampled`/`citations_verified` đọc bằng `fm.get()` —
bản ghi có 15 địa chỉ mà khai `3/3`, không dòng nào đối chiếu.

⇒ Một agent ghi `sampled: 5 / verified: 5` rồi rải `[§II.4]` là qua sạch toàn
bộ bộ máy chống bịa. Đó là `G-6` + `G-7`.

Nguyên lý: **địa chỉ phân giải được = trỏ vào thứ KHO CÓ**, không trỏ ra
Internet mở.

ĐỎ_KHI  mục chỉ có dãy số/công thức mà vẫn qua · số khai ≠ số máy đếm mà vẫn
        qua · công thức toán bị BÁO LỖI (đỏ oan) · 0 địa chỉ phân giải được mà
        `unverifiable_citations` không bị ép
XANH_KHI cả bốn chiều đúng, và cổng TẮT khi không truyền kho
"""

import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "core" / "src"))

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


# ── 1 · bảng khai phải tồn tại và phải khai ĐỦ ────────────────────────────
print("\n1 · bảng khai `core/assets/dia-chi.json`\n")

BANG = R / "core" / "assets" / "dia-chi.json"
dang = {}
if not BANG.exists():
    kiem(False, "bảng khai tồn tại", f"chưa có {BANG.relative_to(R)}")
else:
    d = json.loads(BANG.read_text(encoding="utf-8"))
    dang = {x["ten"]: x for x in d.get("dang", [])}
    kiem(len(dang) >= 5, "khai ≥5 dạng địa chỉ", f"mới có {len(dang)}")
    for ten in ("slug", "slug-trang", "slug-moc", "file-dong", "muc"):
        kiem(ten in dang, f"có dạng `{ten}`")
    for ten, x in dang.items():
        co_neo = str(x.get("mau", "")).startswith("^") and str(x.get("mau", "")).endswith("$")
        kiem(co_neo, f"`{ten}`.mau có neo ^...$",
             "thiếu neo thì regex khớp phần GIỮA một chuỗi khác")
        kiem(bool(x.get("phan_giai")), f"`{ten}`.phan_giai khai rõ")
        kiem(x.get("manh") in ("day_du", "mot_phan", "khong"),
             f"`{ten}`.manh ∈ day_du|mot_phan|khong", f"đang là {x.get('manh')!r}")
        kiem(bool(x.get("vi_du")), f"`{ten}`.vi_du có ví dụ")

# ── 2 · validate.py KHÔNG được gõ tay dạng nào ────────────────────────────
print("\n2 · luật đọc từ bảng khai, không gõ tay\n")

V = R / "core" / "src" / "source_distiller" / "validate.py"
src = V.read_text(encoding="utf-8")
than = "\n".join(l for l in src.splitlines() if not l.strip().startswith("#"))
kiem("dia-chi.json" in src, "validate.py đọc `dia-chi.json`")
kiem("LOCATOR_RE" not in than or "dia-chi" in src,
     "`LOCATOR_RE` vô nghĩa cũ đã bị thay",
     r"regex `\[[^\]]{2,80}\]` khớp mọi ngoặc vuông")

# ── 3 · bốn chiều, chạy THẬT trên kho giả ở thư mục tạm ───────────────────
print("\n3 · bốn chiều — kho giả ở thư mục tạm, KHÔNG chạm kb/ thật\n")

try:
    from source_distiller.validate import check  # noqa: E402
    import inspect
    ky = inspect.signature(check).parameters
    kiem("kho" in ky, "`check()` nhận tham số `kho`",
         f"chữ ký hiện tại: {list(ky)}")
    kiem(ky["kho"].default is None if "kho" in ky else False,
         "`kho=None` ⇒ cổng TẮT (giữ 42 test cũ gọi 3 tham số)")
except Exception as e:
    kiem(False, "import được `check()`", f"{type(e).__name__}: {e}")
    ky = {}

if "kho" in ky and dang:
    tmp = Path(tempfile.mkdtemp(prefix="gn_diachi_"))
    try:
        kb = tmp / "kb"
        (kb / "docs").mkdir(parents=True)
        (kb / "tai-lieu").mkdir()
        (kb / "_media").mkdir()

        # hiện vật thật: PDF 3 trang, để `p.2` xanh và `p.9` đỏ
        import pypdf
        w = pypdf.PdfWriter()
        for _ in range(3):
            w.add_blank_page(width=200, height=200)
        sha = "a" * 64
        with open(kb / "_media" / f"{sha}.pdf", "wb") as f:
            w.write(f)

        (kb / "tai-lieu" / "nguon-that.md").write_text(
            "---\nslug: nguon-that\nsource_type: tai-lieu\nho_so: thu-vien\n"
            f"media:\n  sha256: {sha}\n  mime: application/pdf\n---\n\nnội dung\n",
            encoding="utf-8")

        schema = json.loads((R / "core" / "assets" / "frontmatter.schema.json")
                            .read_text(encoding="utf-8"))

        def thu(ten, than_bai, them_fm=""):
            p = kb / "docs" / f"{ten}.md"
            # `## 3.` phai co thi `sub_sections` moi cat duoc `### 3.2`.
            p.write_text(
                f"---\nslug: {ten}\nsource_type: docs\nho_so: phan-tich\n"
                f"origin: external\n{them_fm}---\n{than_bai}",
                encoding="utf-8")
            try:
                return check(p, schema, None, None, kb)
            except Exception as e:      # cổng chưa cài — đỏ, đúng ý
                return [f"{type(e).__name__}: {e}"]

        # A · chỉ dãy số + công thức ⇒ phải ĐỎ
        r = thu("chi-cong-thuc", "## 3. Nội dung\n### 3.2 Process\nGiá trị [2, 1, 0.5] và [ a + b² ] thôi.\n")
        kiem(any("địa chỉ" in str(x) or "locator" in str(x) for x in r),
             "A · mục chỉ có dãy số/công thức ⇒ ĐỎ", f"trả về: {r}")

        # C · có 1 địa chỉ hợp dạng + 1 công thức ⇒ XANH, công thức im lặng
        r = thu("co-dia-chi", "## 3. Nội dung\n### 3.2 Process\nTheo [nguon-that] thì [ a + b² ] đúng.\n")
        kiem(not any("a + b" in str(x) for x in r),
             "C · công thức toán KHÔNG bị báo lỗi (B-A5: bỏ qua, không báo)",
             f"đỏ oan: {r}")

        # B · số khai ≠ số máy đếm ⇒ ĐỎ, thông báo nêu CẢ hai số
        r = thu("so-khai-lech", "## 3. Nội dung\n### 3.2 Process\nTheo [nguon-that] và [nguon-that:p.2].\n",
                "citations_sampled: 9\ncitations_verified: 9\n")
        kiem(any("9" in str(x) and "2" in str(x) for x in r),
             "B · `citations_*` khai lệch máy đếm ⇒ ĐỎ, nêu cả hai số",
             f"trả về: {r}")

        # D · 0 địa chỉ phân giải được ⇒ ép `unverifiable_citations`
        r = thu("khong-phan-giai", "## 3. Nội dung\n### 3.2 Process\nTheo [§II.4] và [§III].\n",
                "unverifiable_citations: false\n")
        kiem(any("unverifiable" in str(x) for x in r),
             "D · 0 địa chỉ phân giải được mà khai `false` ⇒ ĐỎ", f"trả về: {r}")

        # p.N — đo bằng GỌI HÀM, không dò chuỗi thông báo. Dò chuỗi thì cổng
        # xanh/đỏ theo cách viết câu tiếng Việt, không theo hành vi.
        from source_distiller.validate import tach_dia_chi, phan_giai
        def giai(chuoi):
            ds = tach_dia_chi(chuoi)
            return [(t, phan_giai(t, m, k, kb)) for _, t, m, k in ds]
        kiem(giai("[nguon-that:p.2]") == [("slug-trang", True)],
             "p.2 trên PDF 3 trang ⇒ phân giải ĐƯỢC", f"{giai(chr(91)+chr(110))}")
        kiem(giai("[nguon-that:p.9]") == [("slug-trang", False)],
             "p.9 trên PDF 3 trang ⇒ KHÔNG phân giải được")
        kiem(giai("[nguon-that]") == [("slug", True)],
             "slug có thật ⇒ phân giải được")
        kiem(giai("[khong-ton-tai-dau]") == [("slug", False)],
             "slug không có trong kho ⇒ không phân giải được")
        kiem(giai("[§II.4]") == [("muc", False)],
             "§II.4 nhận dạng được nhưng KHÔNG phân giải được")
        kiem(giai("[ a + b² ]") == [],
             "công thức toán: không nhận dạng ⇒ bỏ qua hẳn")
        # E · luật §8 CŨ phải CÒN RĂNG cho ca gốc của nó (T01-44).
        # Khi `kho` TẮT, `citations_*` trong file là thứ duy nhất đọc được. Bản
        # khai `sampled > verified` mà KHÔNG khai `unverifiable_citations` là ca
        # luật cũ sinh ra để bắt — sửa T01-44 không được làm mất nó.
        pe = kb / "docs" / "khai-lech-khong-co-co.md"
        pe.write_text(
            "---" + chr(10) + "slug: khai-lech-khong-co-co" + chr(10)
            + "source_type: docs" + chr(10) + "ho_so: phan-tich" + chr(10)
            + "origin: external" + chr(10) + "citations_sampled: 5" + chr(10)
            + "citations_verified: 2" + chr(10) + "---" + chr(10)
            + "## 3. Nội dung" + chr(10) + "### 3.2 Process" + chr(10)
            + "Theo [nguon-that] thì đúng." + chr(10),
            encoding="utf-8")
        re_tat = check(pe, schema, None, None, None)   # kho=None ⇒ cổng địa chỉ TẮT
        kiem(any("Spot-check" in str(x) for x in re_tat),
             "E · khai sampled>verified KHÔNG kèm cờ ⇒ vẫn bị loại (luật cũ còn răng)",
             f"trả về: {re_tat}")

        # F · nhưng bản ĐÃ KHAI cờ thì `verified < sampled` là điều đã nói ra,
        # không phải điều bị phát hiện — không được loại (đây là ca `phucHoi`).
        pf = kb / "docs" / "khai-lech-co-co.md"
        pf.write_text(pe.read_text(encoding="utf-8").replace(
            "citations_sampled: 5",
            "unverifiable_citations: true" + chr(10) + "citations_sampled: 5"),
            encoding="utf-8")
        re_co = check(pf, schema, None, None, None)
        kiem(not any("Spot-check" in str(x) for x in re_co),
             "F · đã khai `unverifiable_citations: true` ⇒ KHÔNG bị loại",
             f"trả về: {re_co}")

        kiem(giai("[nhãn](https://vd.com)") == [],
             "link markdown KHÔNG bị coi là địa chỉ")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
else:
    kiem(False, "chạy được bốn chiều", "thiếu bảng khai hoặc thiếu tham số `kho`")

# ── 4 · dạng `file-anchor` — FR-073 A1 · A2 · A4 (T01-52: cổng đi TRƯỚC T01-51) ──
# Ba vế này ĐỎ cho tới khi T01-51 áp FR-073 §1 vào `dia-chi.json` và cài
# `anchor_fold` + `anchor_cua_file` trong validate.py. Đỏ phải vì LUẬT (bảng khai
# chưa có dạng), không vì ImportError — nên hàm thiếu ghi thành MỘT vế FAIL, không
# làm chết cổng. A3 (BA bản khớp) KHÔNG ở đây: bản thứ ba — `id` trên heading
# render — là C3 của M03 (`06_modules/M03_web/backlog.md`), viết bây giờ là một
# cổng xanh rỗng.
print("\n4 · dạng `file-anchor` — FR-073 A1 · A2 · A4, kho giả ở thư mục tạm\n")

kiem("file-anchor" in dang, "bảng khai có dạng `file-anchor`",
     "FR-073 §1 chưa áp vào dia-chi.json — T01-51")
try:
    from source_distiller.validate import (  # noqa: E402
        anchor_cua_file, anchor_fold, phan_giai, tach_dia_chi)
    co_ham = True
except ImportError as e:
    kiem(False, "validate.py có `anchor_fold` + `anchor_cua_file`",
         f"T01-51 chưa cài — {type(e).__name__}: {e}")
    co_ham = False

if "kho" in ky:
    tmp4 = Path(tempfile.mkdtemp(prefix="gn_anchor_"))
    try:
        kb4 = tmp4 / "kb"
        (kb4 / "docs").mkdir(parents=True)
        # Sáu heading: hai trùng nhau (dedup -1), một ca `đ`, và bộ `Foo 1 · Foo ·
        # Foo` mà github-slugger cho `foo-1 · foo · foo-2` — THỨ TỰ quyết định hậu tố.
        THAN4 = ("## Hướng dẫn cài đặt\nmột\n### Đường ống dữ liệu\nhai\n"
                 "## Hướng dẫn cài đặt\nba\n## Foo 1\nbốn\n## Foo\nnăm\n## Foo\nsáu\n")
        (kb4 / "docs" / "huong-dan.md").write_text(
            "---\nslug: huong-dan\nsource_type: docs\n---\n" + THAN4, encoding="utf-8")
        (kb4 / "docs" / "khac.md").write_text(
            "---\nslug: khac\nsource_type: docs\n---\n## Hướng dẫn cài đặt\nx\n",
            encoding="utf-8")

        def giai4(chuoi):
            # Đo bằng GỌI HÀM, không dò chuỗi thông báo (cùng lý do với §3).
            if not co_ham:
                return None
            return [(t, phan_giai(t, m, k, kb4)) for _, t, m, k in tach_dia_chi(chuoi)]

        # A1 — nhận dạng: có `#`, anchor theo luật slug ⇒ dạng `file-anchor`.
        kiem(giai4("[docs/huong-dan.md#huong-dan-cai-dat]") == [("file-anchor", True)],
             "A1 · `[docs/x.md#anchor]` nhận dạng là `file-anchor` và phân giải được",
             f"trả về {giai4('[docs/huong-dan.md#huong-dan-cai-dat]')}")
        kiem(giai4("[docs/huong-dan.md#Huong_Dan]") == [],
             "A1 · anchor sai luật slug (chữ hoa, gạch dưới) ⇒ KHÔNG nhận dạng",
             f"trả về {giai4('[docs/huong-dan.md#Huong_Dan]')}")

        # A2 — phân giải: file tồn tại ∧ MỘT heading fold ra đúng anchor.
        kiem(giai4("[docs/huong-dan.md#duong-ong-du-lieu]") == [("file-anchor", True)],
             "A2 · ca `đ` — `### Đường ống dữ liệu` ⇒ #duong-ong-du-lieu phân giải được",
             f"trả về {giai4('[docs/huong-dan.md#duong-ong-du-lieu]')}")
        kiem(giai4("[docs/huong-dan.md#huong-dan-cai-dat-1]") == [("file-anchor", True)],
             "A2 · heading trùng lần hai ⇒ hậu tố -1 phân giải được",
             f"trả về {giai4('[docs/huong-dan.md#huong-dan-cai-dat-1]')}")
        kiem(giai4("[docs/huong-dan.md#khong-co-heading-nay]") == [("file-anchor", False)],
             "A2 · anchor không thuộc heading nào ⇒ nhận dạng nhưng KHÔNG phân giải",
             f"trả về {giai4('[docs/huong-dan.md#khong-co-heading-nay]')}")
        kiem(giai4("[docs/khong-ton-tai.md#huong-dan-cai-dat]") == [("file-anchor", False)],
             "A2 · file không tồn tại ⇒ KHÔNG phân giải",
             f"trả về {giai4('[docs/khong-ton-tai.md#huong-dan-cai-dat]')}")

        # A1/A2 qua `check()` — `citations_*` do máy đếm: hai #anchor đều ĐẾM vào
        # sampled; cái không thuộc heading nào KHÔNG tăng verified.
        schema4 = json.loads((R / "core" / "assets" / "frontmatter.schema.json")
                             .read_text(encoding="utf-8"))
        p4 = kb4 / "docs" / "dem-anchor.md"
        p4.write_text(
            "---\nslug: dem-anchor\nsource_type: docs\nho_so: phan-tich\norigin: external\n"
            "citations_sampled: 2\ncitations_verified: 2\n---\n"
            "## 3. Nội dung\n### 3.2 Process\nTheo [docs/huong-dan.md#huong-dan-cai-dat] "
            "và [docs/huong-dan.md#khong-co-heading-nay].\n", encoding="utf-8")
        try:
            r4 = check(p4, schema4, None, None, kb4)
        except Exception as e:      # cổng chưa cài — đỏ, đúng ý
            r4 = [f"{type(e).__name__}: {e}"]
        kiem(not any("citations_sampled" in str(x) for x in r4),
             "A1 · cả hai `#anchor` ĐẾM vào citations_sampled (khai 2 = máy đếm 2)",
             f"trả về: {r4}")
        kiem(any("citations_verified" in str(x) and "máy đếm 1" in str(x) for x in r4),
             "A2 · một anchor không thuộc heading nào ⇒ citations_verified máy đếm 1 ≠ khai 2 ⇒ ĐỎ nêu số",
             f"trả về: {r4}")

        # A4 — dedup -1/-2 kiểu github-slugger: ổn định qua hai lần, state theo FILE.
        if co_ham:
            t1 = (kb4 / "docs" / "huong-dan.md").read_text(encoding="utf-8")
            a, b = anchor_cua_file(t1), anchor_cua_file(t1)
            kiem(a == b, "A4 · dựng hai lần ⇒ cùng danh sách anchor (điểm bất động)",
                 f"{a} ≠ {b}")
            mong = ["huong-dan-cai-dat", "duong-ong-du-lieu", "huong-dan-cai-dat-1",
                    "foo-1", "foo", "foo-2"]
            kiem(a == mong,
                 "A4 · dedup vòng while: `Foo 1 · Foo · Foo` ⇒ foo-1 · foo · foo-2",
                 f"được {a}")
            dao = anchor_cua_file("## Foo\n## Foo\n## Foo 1\n")
            kiem(dao == ["foo", "foo-1", "foo-1-1"],
                 "A4 · đổi thứ tự heading ⇒ hậu tố đổi theo: `Foo · Foo · Foo 1` ⇒ foo · foo-1 · foo-1-1",
                 f"được {dao}")
            kiem(anchor_cua_file((kb4 / "docs" / "khac.md").read_text(encoding="utf-8"))
                 == ["huong-dan-cai-dat"],
                 "A4 · state theo FILE, reset mỗi file — file khác KHÔNG mang hậu tố")
            kiem(anchor_fold("Hướng dẫn cài đặt") == "huong-dan-cai-dat"
                 and anchor_fold("Đường ống dữ liệu") == "duong-ong-du-lieu",
                 "luật fold = slugGoiY: lower → NFD → bỏ dấu → đ→d → [^a-z0-9]+→-")
            dai = anchor_fold("Hướng " * 40)
            kiem(len(dai) == 60,
                 "luật fold cắt ở 60 SAU khi bỏ `-` đầu/cuối — đúng thứ tự của bản JS",
                 f"dài {len(dai)}")
        else:
            for chu in ("A4 · dựng hai lần ⇒ cùng danh sách anchor (điểm bất động)",
                        "A4 · dedup vòng while: `Foo 1 · Foo · Foo` ⇒ foo-1 · foo · foo-2",
                        "A4 · đổi thứ tự heading ⇒ hậu tố đổi theo",
                        "A4 · state theo FILE, reset mỗi file"):
                kiem(False, chu, "T01-51 chưa cài `anchor_cua_file`")
    finally:
        shutil.rmtree(tmp4, ignore_errors=True)
else:
    kiem(False, "chạy được A1 · A2 · A4", "thiếu tham số `kho`")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — B-A5/B-A6 chưa có răng")
print("địa chỉ phân giải được · citations_* do máy đếm · công thức không bị đỏ oan")
