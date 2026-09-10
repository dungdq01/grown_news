#!/usr/bin/env python3
r"""AC-2.5 · AC-2.6 · FR-072 T4 · T13-7 AC1 — chunk HIỆN VẬT VĂN BẢN.

· `.vtt` ⇒ cắt theo CUE; `dia_chi` = `<slug>:t=mm:ss` (dạng `slug-moc` đã khai) và mốc NẰM
  TRONG thời lượng thật của transcript; ba khoá `anchor` · `line_start` · `line_end` = `null`
  CÓ MẶT trong JSON (khoá vắng ⇒ đỏ); `nguon_van_ban = hien-vat:text/vtt`.
· `.srt` cùng nội dung ⇒ CÙNG danh sách mốc như `.vtt` (một hàm, đảo của vttSangSrt).
· `.md` người tải ⇒ chunk theo ##/### như `than`, CÓ ba khoá neo dòng; `nguon_van_ban = hien-vat:text/plain`.
· `than` ⇒ `nguon_van_ban = than`. Chunk lấy từ hiện vật mà khai `than` ⇒ đỏ, NÊU doc_id.
· bản ghi KHÔNG có hiện vật ⇒ chỉ index than, 0 lỗi.
· mốc cue vượt thời lượng ⇒ hàm chunk cue phải TỪ CHỐI, nêu mốc + thời lượng.

ĐỎ_KHI  một điều trên sai
XANH_KHI tất cả đúng
--tu-kiem: phép kiểm chunk trên các dict cố-tình-hỏng (khoá vắng · mốc vượt · nguon_van_ban sai) phải đỏ.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_chunk_hien_vat.py"
BA_KHOA = ("anchor", "line_start", "line_end")


def giay(moc: str) -> float:
    p = [float(x) for x in moc.split(":")]
    return p[0] * 60 + p[1] if len(p) == 2 else p[0] * 3600 + p[1] * 60 + p[2]


def kiem_chunk_cue(ch: dict, thoi_luong: float) -> list[str]:
    loi = [f"khoá `{k}` VẮNG (phải có, giá trị null)" for k in BA_KHOA if k not in ch]
    loi += [f"khoá `{k}` phải null cho chunk cue, đang {ch[k]!r}" for k in BA_KHOA if k in ch and ch[k] is not None]
    dc = str(ch.get("dia_chi", ""))
    if K.khop_dang(dc) != "slug-moc":
        loi.append(f"dia_chi `{dc}` không phải dạng slug-moc")
    else:
        t = giay(dc.split(":t=")[1])
        if t > thoi_luong:
            loi.append(f"mốc {dc.split(':t=')[1]} vượt thời lượng {thoi_luong:.0f}s")
    if ch.get("nguon_van_ban") != "hien-vat:text/vtt":
        loi.append(f"nguon_van_ban `{ch.get('nguon_van_ban')}` — chunk transcript phải `hien-vat:text/vtt`")
    return loi


if K.TU_KIEM:
    print("\ntu-kiem · phép kiểm chunk cue phải ĐỎ ĐƯỢC\n")
    tot = {"anchor": None, "line_start": None, "line_end": None, "dia_chi": "thien-duong:t=03:15", "nguon_van_ban": "hien-vat:text/vtt"}
    K.kiem(kiem_chunk_cue(tot, 240) == [], "chunk cue đúng ⇒ 0 lỗi")
    thieu = {k: v for k, v in tot.items() if k != "anchor"}
    K.kiem(any("VẮNG" in x for x in kiem_chunk_cue(thieu, 240)), "bỏ hẳn khoá `anchor` ⇒ đỏ (khoá vắng ≠ null)")
    K.kiem(any("vượt thời lượng" in x for x in kiem_chunk_cue({**tot, "dia_chi": "thien-duong:t=99:59"}, 240)), "mốc 99:59 trên video 4 phút ⇒ đỏ nêu mốc + thời lượng")
    K.kiem(any("nguon_van_ban" in x for x in kiem_chunk_cue({**tot, "nguon_van_ban": "than"}, 240)), "chunk transcript khai `than` ⇒ đỏ")
    K.tu_kiem_xong(CONG, 4)

try:
    indexer, db, hien_vat = _nap.nap("indexer", "db", "hien_vat")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-7")

print("\n1 · hàm cue: .vtt và .srt cùng nội dung ⇒ cùng mốc; mốc vượt thời lượng ⇒ từ chối\n")
cues_vtt = hien_vat.doc_cue(_loi_gia.VTT_MAU)
SRT = "1\n00:00:01,000 --> 00:00:04,000\nHôm nay ta nói về đường ống dữ liệu.\n\n2\n00:00:04,500 --> 00:00:09,000\nMột pipeline tốt phải tái tạo được từ đầu.\n\n3\n00:03:15,000 --> 00:03:20,000\nLời tiên tri nằm ở cấu trúc xã hội, không ở nguồn lực.\n"
cues_srt = hien_vat.doc_cue(SRT)
K.kiem([c["tu"] for c in cues_vtt] == [c["tu"] for c in cues_srt] == [1.0, 4.5, 195.0], ".vtt và .srt ⇒ CÙNG danh sách mốc [1.0, 4.5, 195.0]", f"{[c['tu'] for c in cues_vtt]} vs {[c['tu'] for c in cues_srt]}")
K.kiem(hien_vat.moc(195.0) == "03:15" and hien_vat.moc(4.5) == "00:04", "moc(): 195s ⇒ 03:15 · 4.5s ⇒ 00:04 (khớp mẫu slug-moc)")
try:
    hien_vat.chunk_cue([{"tu": 5999.0, "den": 6000.0, "text": "x"}], doc_id="v", file="kb/video/v.md", title="V", thoi_luong=240.0)
    K.kiem(False, "cue 99:59 trên video 240s ⇒ phải TỪ CHỐI")
except Exception as e:  # noqa: BLE001
    K.kiem("240" in str(e) or "thời lượng" in str(e), "từ chối cue vượt thời lượng, nêu mốc + thời lượng", str(e)[:120])

print("\n2 · dựng trên kho mẫu — ba nguồn văn bản, ba nhãn đúng\n")
with K.tam("gn_m13_hv_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            rows = con.execute("SELECT doc_id, anchor, line_start, line_end, dia_chi, nguon_van_ban FROM chunks").fetchall()
            cues = [dict(zip(("doc_id", "anchor", "line_start", "line_end", "dia_chi", "nguon_van_ban"), r)) for r in rows if r[0] == "thien-duong-chuot" and r[5] != "than"]
            K.kiem(cues, "video có transcript ⇒ có chunk cue", str([r for r in rows if r[0] == "thien-duong-chuot"]))
            thoi_luong = max(c["den"] for c in cues_vtt)
            loi_cue = [f"{c['doc_id']}: {x}" for c in cues for x in kiem_chunk_cue(c, thoi_luong)]
            K.kiem(not loi_cue, f"{len(cues)} chunk cue: slug-moc trong thời lượng · ba khoá null · hien-vat:text/vtt", " · ".join(loi_cue[:3]))
            md = [r for r in rows if r[0] == "ghi-chu-hoi-thao-rag" and r[5] == "hien-vat:text/plain"]
            K.kiem(md and all(r[1] is not None and r[2] is not None and r[3] is not None for r in md) and all(K.khop_dang(r[4]) == "file-dong" for r in md),
                   ".md tải lên ⇒ chunk theo heading, CÓ anchor/line_*, dia_chi file-dong, nhãn hien-vat:text/plain", str(md[:2]))
            K.kiem(any(r[1] == "ba-cau-hoi-con-lai" for r in md), "anchor `ba-cau-hoi-con-lai` sinh từ heading của hiện vật .md", str([r[1] for r in md]))
            than = [r for r in rows if r[5] == "than"]
            K.kiem(than and all(r[0] in loi.kho for r in than), "chunk từ `than` mang nhãn `than`")
            sai_nhan = [r[0] for r in rows if r[5] == "than" and r[2] is None]
            K.kiem(not sai_nhan, "không chunk cue nào đeo nhãn `than` (mượn hạng bài viết) — nêu doc_id nếu có", str(sai_nhan))
            K.kiem(any(r[0] == "pipeline-basics" for r in rows) and not any(r[0] == "pipeline-basics" and r[5] != "than" for r in rows),
                   "bản ghi không hiện vật ⇒ chỉ than, 0 lỗi")
            K.kiem(any("/api/articles/media/" in x["duong"] for x in loi.nhan) and not any("dang=txt" in x["duong"] for x in loi.nhan),
                   "hiện vật đọc qua GET /api/articles/media/<sha> (byte gốc, giữ mốc) — không qua ?dang=txt (mất mốc)")
        finally:
            con.close()

K.chot("cue ⇒ slug-moc trong thời lượng, ba khoá null có mặt · .srt = .vtt · .md ⇒ heading · nhãn đúng từng chunk")
