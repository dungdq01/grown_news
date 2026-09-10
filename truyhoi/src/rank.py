"""Truy hồi — MỘT câu SQL: MATCH + phạm vi facet + tập nguồn, đếm cùng lời gọi (spec §4 · §5 · T13-4/T13-5).

`ORDER BY bm25(chunks_fts, w_title, 1.0)` — rank càng ÂM càng khớp; `w_title` là THAM SỐ BIND đọc từ
`truyhoi/assets/nguong.json` (hai số: `vi_en` · `zh` — chọn theo `co_han(cau_hoi)`), không gõ trong SQL
(AC-4.2). `snippet()` KHÔNG xuất hiện: bằng chứng là `body` đầy đủ lấy qua rowid (M13-R4).

Phạm vi là control HIỂN THỊ (B-C2 · AC-5.1 · AC-5.2): `pham_vi` (khoá TANG nguyên văn) và `nguon`
(tập nguồn Knowledge — danh sách slug do M14 giải từ bot, AC-5.3) đều là vị từ TRONG CÙNG câu với
MATCH — không lọc sau top-k; `so_ban_ghi_trong_pham_vi` đếm trên đúng tập đó, cùng request.

`chuan_hoa_tim` gọi ở đây cho câu hỏi — chỗ gọi THỨ HAI và cuối cùng (M13-R1; chỗ kia là indexer).
Token FTS luôn được quote `"…"` — cú pháp FTS5 không lộ ra hợp đồng (ui_flow §3).
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from chuan_hoa import chuan_hoa_tim, co_han

R = Path(__file__).resolve().parents[2]
NGUONG = R / "truyhoi" / "assets" / "nguong.json"
TANG = ("cat", "loai", "cpt", "pl", "nguon")
KHOA_PHAM_VI = TANG + ("space",)
MUOI = ("doc_id", "file", "anchor", "line_start", "line_end", "dia_chi", "heading_path", "body", "nguon_van_ban", "bm25")


def doc_nguong() -> dict:
    return json.loads(NGUONG.read_text(encoding="utf-8"))


def doc_w_title() -> dict:
    """{vi_en, zh} từ cấu hình; env `TRUYHOI_W_TITLE_VI_EN` / `_ZH` ghi đè (để test đo 'đổi số ⇒ hạng đổi')."""
    w = dict(doc_nguong()["w_title"])
    for k, bien in (("vi_en", "TRUYHOI_W_TITLE_VI_EN"), ("zh", "TRUYHOI_W_TITLE_ZH")):
        if bien in os.environ:
            w[k] = float(os.environ[bien])
        if not isinstance(w.get(k), (int, float)):
            raise KeyError(f"nguong.json thiếu w_title.{k}")
    return w


def chon_w_title(cau_hoi: str) -> float:
    w = doc_w_title()
    return float(w["zh"] if co_han(cau_hoi) else w["vi_en"])


def cau_match(cau_hoi: str) -> str:
    """Câu hỏi → biểu thức FTS5: chuẩn hoá bằng CÙNG hàm của cột index, mỗi token quote, nối OR."""
    tok = [t for t in chuan_hoa_tim(cau_hoi).split() if any(ch.isalnum() for ch in t)]
    return " OR ".join('"' + t.replace('"', '""') + '"' for t in tok)


def _vi_tu(pham_vi: dict | None, nguon: list[str] | None) -> tuple[str, list]:
    dk, tham = [], []
    if nguon is not None:
        if nguon:
            dk.append(f"t.doc_id IN ({','.join('?' * len(nguon))})")
            tham += [str(x) for x in nguon]
        else:
            dk.append("0")           # tập nguồn RỖNG ⇒ không bản ghi nào (khác null = cả kho)
    for kh, gt in (pham_vi or {}).items():
        gt = [gt] if isinstance(gt, str) else [str(x) for x in (gt or [])]
        if not gt:
            continue
        dk.append(f"EXISTS (SELECT 1 FROM facet f WHERE f.doc_id = t.doc_id AND f.khoa = ? AND f.gia_tri IN ({','.join('?' * len(gt))}))")
        tham += [kh, *gt]
    return ((" WHERE " + " AND ".join(dk)) if dk else ""), tham


SQL = """
WITH pham_vi AS (
  SELECT t.doc_id FROM tai_lieu t{where}
), khop AS (
  SELECT c.id AS id, bm25(chunks_fts, ?, 1.0) AS diem
  FROM chunks_fts JOIN chunks c ON c.id = chunks_fts.rowid
  WHERE chunks_fts MATCH ? AND c.doc_id IN (SELECT doc_id FROM pham_vi)
  ORDER BY diem, c.file, c.line_start, c.thu_tu
  LIMIT ?
), dem AS (SELECT count(*) AS n FROM pham_vi)
SELECT dem.n, k.diem, c.doc_id, c.file, c.anchor, c.line_start, c.line_end, c.dia_chi,
       c.heading_path, c.body, c.nguon_van_ban
FROM dem LEFT JOIN khop k ON 1 = 1 LEFT JOIN chunks c ON c.id = k.id
ORDER BY k.diem, c.file, c.line_start, c.thu_tu
"""


def truy_hoi(con, *, cau_hoi: str, pham_vi: dict | None, nguon: list[str] | None, k: int) -> dict:
    match = cau_match(cau_hoi)
    if not match:
        raise ValueError("câu hỏi không có token nào để tìm")
    where, tham = _vi_tu(pham_vi, nguon)
    rows = con.execute(SQL.format(where=where), [*tham, chon_w_title(cau_hoi), match, int(k)]).fetchall()
    so_ban_ghi = rows[0][0] if rows else 0
    ket_qua = []
    for r in rows:
        if r[1] is None:
            continue
        ket_qua.append({
            "doc_id": r[2], "file": r[3], "anchor": r[4], "line_start": r[5], "line_end": r[6],
            "dia_chi": r[7], "heading_path": r[8], "body": r[9], "nguon_van_ban": r[10],
            "bm25": round(float(r[1]), 2),
        })
    return {"ket_qua": ket_qua, "so_ban_ghi_trong_pham_vi": int(so_ban_ghi), "tong": len(ket_qua)}
