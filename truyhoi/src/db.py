"""`index.sqlite` — chỉ mục DẪN XUẤT của M13 (spec §1 · §2 · T13-2/T13-5).

Mất chỉ mục không mất gì: xoá sạch và dựng lại từ kho bất cứ lúc nào (AC-1.1). Nên không có
migration, không có backup; một chỉ mục lệch kho là BUG ĐO ĐƯỢC (AC-1.2), không phải trạng thái
cần hoà giải.

Ba bảng thường + một bảng ảo FTS5 (external content — không nhân đôi `body`):
  tai_lieu  một dòng / bản ghi kho: file · sha_than · updated_at · checksum (mọi byte đã fetch) · space
  facet     (doc_id, khoa, gia_tri) — khoá là khoá `TANG` của FE nguyên văn (`cat` · `loai` · `cpt` ·
            `pl` · `nguon`) + `space`; 0 bảng đổi tên (AC-5.2)
  chunks    một dòng / đoạn: địa chỉ (`file` · `anchor` · `line_start` · `line_end` · `dia_chi`),
            `body` ĐẦY ĐỦ (bằng chứng — M13-R4), `title`/`tim` = chuan_hoa_tim(...) CHỈ để tìm,
            `nguon_van_ban`, `thu_tu` (thứ tự trong bài — để dựng lại là điểm bất động)
  chunks_fts fts5(title, tim, content='chunks', content_rowid='id',
            tokenize='unicode61 remove_diacritics 2')  — KHÔNG `porter` (phá tiếng Việt)

Ba trigger `_ai/_ad/_au` đồng bộ FTS theo lệnh 'delete' của external content. Không bao giờ chạm
`chunks_fts` trực tiếp — xoá sai cách là FTS lệch bảng thường IM LẶNG (AC-2.4 edge 3).

Đường file đọc từ env `TRUYHOI_INDEX` (test trỏ thư mục tạm — rule.md 16), mặc định
`truyhoi/index.sqlite`; TỪ CHỐI mọi đường nằm dưới `kb/` (M13-R3).
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

R = Path(__file__).resolve().parents[2]

DDL = """
CREATE TABLE IF NOT EXISTS tai_lieu(
  doc_id     TEXT PRIMARY KEY,
  loai       TEXT NOT NULL,
  space      TEXT NOT NULL,
  title      TEXT NOT NULL,
  file       TEXT NOT NULL,
  updated_at TEXT,
  sha_than   TEXT NOT NULL,
  checksum   TEXT NOT NULL,
  indexed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS facet(
  doc_id  TEXT NOT NULL REFERENCES tai_lieu(doc_id) ON DELETE CASCADE,
  khoa    TEXT NOT NULL,
  gia_tri TEXT NOT NULL,
  PRIMARY KEY(doc_id, khoa, gia_tri)
);
CREATE TABLE IF NOT EXISTS chunks(
  id            INTEGER PRIMARY KEY,
  doc_id        TEXT NOT NULL REFERENCES tai_lieu(doc_id) ON DELETE CASCADE,
  file          TEXT NOT NULL,
  anchor        TEXT,
  line_start    INTEGER,
  line_end      INTEGER,
  dia_chi       TEXT NOT NULL,
  heading_path  TEXT NOT NULL,
  body          TEXT NOT NULL,
  nguon_van_ban TEXT NOT NULL CHECK(nguon_van_ban IN ('than','hien-vat:text/vtt','hien-vat:text/plain')),
  title         TEXT NOT NULL,
  tim           TEXT NOT NULL,
  thu_tu        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_doc ON chunks(doc_id, thu_tu);
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  title, tim, content='chunks', content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, title, tim) VALUES (new.id, new.title, new.tim);
END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, title, tim) VALUES ('delete', old.id, old.title, old.tim);
END;
CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, title, tim) VALUES ('delete', old.id, old.title, old.tim);
  INSERT INTO chunks_fts(rowid, title, tim) VALUES (new.id, new.title, new.tim);
END;
"""

COT_CHUNK = ("doc_id", "file", "anchor", "line_start", "line_end", "dia_chi",
             "heading_path", "body", "nguon_van_ban", "title", "tim", "thu_tu")


def duong_index() -> Path:
    p = Path(os.environ.get("TRUYHOI_INDEX") or (R / "truyhoi" / "index.sqlite")).resolve()
    if "kb" in p.parts:
        raise ValueError(f"index.sqlite không được nằm dưới kb/ (M13-R3): {p}")
    return p


def bay_gio() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _kiem_tokenizer(con: sqlite3.Connection) -> None:
    """`remove_diacritics 2` phải fold được `hướng` và `phần` — đo thật, không tin số phiên bản (AC-3.3)."""
    con.execute("CREATE VIRTUAL TABLE IF NOT EXISTS temp.tk_probe USING fts5(x, tokenize='unicode61 remove_diacritics 2')")
    con.execute("DELETE FROM temp.tk_probe")
    con.execute("INSERT INTO temp.tk_probe VALUES ('hướng phần')")
    for tu in ("huong", "phan"):
        if con.execute("SELECT count(*) FROM temp.tk_probe WHERE tk_probe MATCH ?", (tu,)).fetchone()[0] != 1:
            raise RuntimeError(f"SQLite {sqlite3.sqlite_version}: remove_diacritics 2 không fold `{tu}` — cần SQLite ≥ 3.45")
    con.execute("DROP TABLE temp.tk_probe")


def mo(duong: Path | None = None, *, ghi: bool = False) -> sqlite3.Connection:
    """Mở (tạo nếu chưa có) chỉ mục, áp DDL idempotent, kiểm tokenizer. Một kết nối / một luồng."""
    p = Path(duong) if duong else duong_index()
    p.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(p), timeout=10, check_same_thread=False)
    con.execute("PRAGMA journal_mode = WAL")
    con.execute("PRAGMA foreign_keys = ON")
    con.execute("PRAGMA busy_timeout = 5000")
    con.executescript(DDL)
    _kiem_tokenizer(con)
    return con


def thay_tai_lieu(con: sqlite3.Connection, tl: dict, facet: list[tuple[str, str]], chunks: list[dict]) -> None:
    """Đơn vị thay là BÀI (doc_id): DELETE chunks/facet của bài + ghi lại, MỘT transaction (AC-2.4).
    Bảng FTS đi theo trigger — không chạm trực tiếp."""
    with con:
        con.execute("DELETE FROM chunks WHERE doc_id = ?", (tl["doc_id"],))
        con.execute("DELETE FROM facet WHERE doc_id = ?", (tl["doc_id"],))
        con.execute(
            "INSERT OR REPLACE INTO tai_lieu(doc_id, loai, space, title, file, updated_at, sha_than, checksum, indexed_at)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (tl["doc_id"], tl["loai"], tl["space"], tl["title"], tl["file"], tl.get("updated_at"),
             tl["sha_than"], tl["checksum"], bay_gio()))
        con.executemany("INSERT OR IGNORE INTO facet(doc_id, khoa, gia_tri) VALUES (?,?,?)",
                        [(tl["doc_id"], k, v) for k, v in facet])
        con.executemany(
            f"INSERT INTO chunks({', '.join(COT_CHUNK)}) VALUES ({', '.join('?' * len(COT_CHUNK))})",
            [tuple(c[k] for k in COT_CHUNK) for c in chunks])


def cap_nhat_moc(con: sqlite3.Connection, doc_id: str, updated_at, sha_than: str) -> None:
    """Chỉ metadata đổi (thân y hệt): một dòng UPDATE, 0 dòng chunk (AC-2.4 edge: không tin mtime một mình)."""
    with con:
        con.execute("UPDATE tai_lieu SET updated_at = ?, sha_than = ? WHERE doc_id = ?", (updated_at, sha_than, doc_id))


def xoa_tai_lieu(con: sqlite3.Connection, doc_id: str) -> None:
    with con:
        con.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
        con.execute("DELETE FROM facet WHERE doc_id = ?", (doc_id,))
        con.execute("DELETE FROM tai_lieu WHERE doc_id = ?", (doc_id,))


def xoa_sach(con: sqlite3.Connection) -> None:
    with con:
        con.execute("DELETE FROM chunks")
        con.execute("DELETE FROM facet")
        con.execute("DELETE FROM tai_lieu")


def kiem_toan_ven(con: sqlite3.Connection) -> None:
    """FTS phải khớp bảng thường — đo, không đọc mã. Lệch ⇒ ném (workflow §4: DỪNG)."""
    n1 = con.execute("SELECT count(*) FROM chunks").fetchone()[0]
    n2 = con.execute("SELECT count(*) FROM chunks_fts").fetchone()[0]
    if n1 != n2:
        raise RuntimeError(f"chunks ({n1}) ≠ chunks_fts ({n2}) — FTS lệch bảng thường")
    con.execute("INSERT INTO chunks_fts(chunks_fts) VALUES ('integrity-check')")


def moc_gan_nhat(con: sqlite3.Connection) -> str | None:
    r = con.execute("SELECT max(indexed_at) FROM tai_lieu").fetchone()
    return r[0] if r else None
