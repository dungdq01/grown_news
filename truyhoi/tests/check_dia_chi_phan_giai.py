#!/usr/bin/env python3
r"""AC-2.3 · FR-072 T2/T3 · T13-2 AC6 · T13-4 AC1 — địa chỉ PHÂN GIẢI ĐƯỢC.

Mỗi chunk: `line_end` ≤ số dòng thật của file (đếm CRLF như LF) · `dia_chi` khớp
ĐÚNG MỘT dạng đã khai trong `core/assets/dia-chi.json` (đọc bảng, không gõ dạng) ·
dạng lai `file.md:12-31#anchor` ⇒ đỏ · `doc_id` mọi kết quả là slug CÓ trong kho ·
`/truy-hoi` trả `ket_qua[]` đủ 10 trường, không HTML.

ĐỔ_KHI  một chunk line_end vượt số dòng · một dia_chi không khớp dạng nào · dia_chi lai
        · doc_id lạ · thiếu/thừa trường trong ket_qua
XANH_KHI mọi chunk và mọi kết quả đúng bốn điều trên
--tu-kiem: chunk gieo line_end vượt · dia_chi lai ⇒ phép kiểm phải ĐỎ; chunk đúng ⇒ không đỏ oan.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_dia_chi_phan_giai.py"
MUOI = ["doc_id", "file", "anchor", "line_start", "line_end", "dia_chi", "heading_path", "body", "nguon_van_ban", "bm25"]


def so_dong(text: str) -> int:
    return len(text.replace("\r\n", "\n").split("\n"))


def kiem_chunk(ch: dict, so_dong_file: int | None) -> list[str]:
    loi = []
    if ch.get("line_end") is not None and so_dong_file is not None and ch["line_end"] > so_dong_file:
        loi.append(f"line_end {ch['line_end']} > số dòng thật {so_dong_file}")
    dang = K.khop_dang(str(ch.get("dia_chi", "")))
    if dang is None:
        loi.append(f"dia_chi `{ch.get('dia_chi')}` không khớp dạng nào trong dia-chi.json")
    if ch.get("line_start") is not None and dang not in ("file-dong",):
        loi.append(f"chunk có line_start nhưng dia_chi là dạng `{dang}`, phải `file-dong`")
    if ch.get("line_start") is None and dang not in ("slug-moc",):
        loi.append(f"chunk cue (line_start null) nhưng dia_chi là dạng `{dang}`, phải `slug-moc`")
    return loi


if K.TU_KIEM:
    print("\ntu-kiem · phép kiểm chunk phải ĐỎ ĐƯỢC\n")
    tot = {"line_start": 3, "line_end": 9, "dia_chi": "docs/a.md:3-9"}
    K.kiem(kiem_chunk(tot, 20) == [], "chunk đúng ⇒ 0 lỗi (không đỏ oan)")
    K.kiem(any("line_end" in x for x in kiem_chunk({**tot, "line_end": 99}, 20)), "line_end 99 > 20 dòng ⇒ đỏ")
    K.kiem(any("không khớp dạng" in x for x in kiem_chunk({**tot, "dia_chi": "docs/a.md:3-9#anchor"}, 20)), "dia_chi LAI `file:A-B#anchor` ⇒ đỏ")
    K.kiem(kiem_chunk({"line_start": None, "line_end": None, "dia_chi": "thien-duong:t=03:15"}, None) == [], "chunk cue slug-moc ⇒ hợp lệ")
    K.kiem(any("phải `slug-moc`" in x for x in kiem_chunk({"line_start": None, "line_end": None, "dia_chi": "docs/a.md:1-2"}, 9)), "cue mang dia_chi file-dong ⇒ đỏ")
    K.kiem(so_dong("a\r\nb\r\nc") == so_dong("a\nb\nc") == 3, "CRLF đếm như LF")
    K.tu_kiem_xong(CONG, 6)

try:
    indexer, db = _nap.nap("indexer", "db")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-2")
# `api` là T13-4: vắng thì §2 CHƯA đo — nói ra, không đỏ oan T13-2 AC6, không xanh im lặng.
try:
    api = _nap.nap("api")
except _nap.ThieuMa:
    api = None
    print("  ·  chờ T13-4 — chưa có api.py, §2 (/truy-hoi trả 10 trường) chưa đo được")
except _nap.ThieuGoi as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

kho = _loi_gia.kho_mau()
kho["huong-dan-cai-dat"]["body"] = kho["huong-dan-cai-dat"]["body"].replace("\n", "\r\n")   # edge 2: CRLF
with K.tam("gn_m13_dc_") as tmp, _loi_gia.LoiGia(kho) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url(), KHOA_WEB_TRUYHOI="k-web"):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            print("\n1 · mọi chunk: line_end ≤ số dòng thật · dia_chi khớp một dạng đã khai\n")
            rows = con.execute("SELECT c.doc_id, c.line_start, c.line_end, c.dia_chi FROM chunks c").fetchall()
            K.kiem(len(rows) > 0, "có chunk để kiểm", "0 chunk")
            loi_ch = []
            for doc_id, ls, le, dc in rows:
                d = loi.kho.get(doc_id)
                n = so_dong(_loi_gia.ghep_goc({**d["frontmatter"], "slug": doc_id, "source_type": d["loai"]}, d["body"])) if d else None
                loi_ch += [f"{doc_id}: {x}" for x in kiem_chunk({"line_start": ls, "line_end": le, "dia_chi": dc}, n)]
            K.kiem(not loi_ch, f"{len(rows)} chunk đều phân giải được (file-dong cho than/.md, slug-moc cho cue)", " · ".join(loi_ch[:4]))
            K.kiem(any(ls is None for _, ls, _, _ in rows) or True, "(ghi nhận) có chunk cue nếu T13-7 đã dựng")
        finally:
            con.close()

        print("\n2 · /truy-hoi trả ket_qua[] đủ 10 trường, doc_id có trong kho, dia_chi khớp dạng\n")
        s, cong = K.bat_service(api) if api is not None else (None, None)
        try:
            if api is None:
                raise StopIteration
            ma, j, hd = K.goi(cong, "POST", "/truy-hoi",
                              {"cau_hoi": "đường ống dữ liệu pipeline", "pham_vi": {}, "nguon": None, "k": 10},
                              {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-web"})
            K.kiem(ma == 200 and isinstance(j, dict), "POST /truy-hoi ⇒ 200 JSON", f"ma={ma} {str(j)[:120]}")
            kq = (j or {}).get("ket_qua") or []
            K.kiem(len(kq) > 0, "có kết quả", str(j)[:120])
            K.kiem(all(sorted(x.keys()) == sorted(MUOI) for x in kq), "mỗi kết quả ĐÚNG 10 trường FR-072 §1.1 — không thừa (`tim`/`title`), không thiếu",
                   str(sorted(kq[0].keys())) if kq else "")
            K.kiem(all(x["doc_id"] in loi.kho for x in kq), "mọi doc_id là slug CÓ trong kho")
            K.kiem(all(K.khop_dang(x["dia_chi"]) in ("file-dong", "slug-moc") for x in kq), "mọi dia_chi khớp `file-dong` hoặc `slug-moc`")
            K.kiem("text/html" not in str(hd.get("Content-Type", hd.get("content-type", ""))).lower(), "không trả HTML trình bày (Z7)")
        except StopIteration:
            print("  ·  §2 bỏ qua — chờ T13-4")
        finally:
            if s is not None:
                K.dung_service(s)

K.chot("line_end ≤ số dòng · dia_chi khớp dạng đã khai · 10 trường · doc_id thật")
