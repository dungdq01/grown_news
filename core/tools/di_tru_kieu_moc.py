#!/usr/bin/env python3
"""Di trú CHECK của `media.kieu_moc` — thêm `la_thumbnail` (WO-071).

VÌ SAO CẦN MỘT CÔNG CỤ RIÊNG: sửa `kho.schema.sql` chỉ áp cho DB DỰNG MỚI. DB
đang chạy giữ CHECK cũ, nên `INSERT`/`UPDATE` một `kieu_moc` mới trả
`CHECK constraint failed` — đo được trên job thật 2026-09-09, sau khi mọi cổng
đã xanh (cổng dùng DB TẠM, dựng từ DDL mới, nên chúng không bao giờ thấy).

VÌ SAO KHÔNG `dung_lai_db.py`: nó dựng lại từ **export file**, mà
`xuat_kho.py` chỉ ghi ra `la_dan_xuat = 0`. Ngày nào kho có hiện vật DẪN XUẤT
thì dựng lại là XOÁ SẠCH chúng. Hôm nay đếm được 0 nên nó vô hại — nhưng một
công cụ chỉ an toàn nhờ hoàn cảnh là một công cụ sẽ hỏng lúc hoàn cảnh đổi.

SQLite không `ALTER` được một CHECK. Đây là phép 12 bước chính thức: bảng mới,
chép, xoá, đổi tên — trong MỘT giao dịch, và có bản lùi trước khi bắt đầu.

Chạy:  python core/tools/di_tru_kieu_moc.py [--that]
       (không cờ ⇒ chỉ BÁO, không sửa)
"""
from __future__ import annotations

import shutil
import sqlite3
import sys
import time
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
DB = Path(__file__).resolve().parent.parent.parent / "kb" / "_kho.sqlite"
MOI = "('la_asr', 'nguoi_sua', 'la_thumbnail')"


def can_di_tru(c: sqlite3.Connection) -> bool:
    sql = c.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='media'"
    ).fetchone()
    return bool(sql) and "la_thumbnail" not in sql[0]


def main() -> int:
    that = "--that" in sys.argv
    if not DB.exists():
        print(f"KHÔNG có {DB} — DB dựng mới sẽ lấy DDL mới, không cần di trú.")
        return 0
    c = sqlite3.connect(DB)
    try:
        if not can_di_tru(c):
            print("Đã có `la_thumbnail` trong CHECK — không phải làm gì.")
            return 0
        n = c.execute("SELECT COUNT(*) FROM media").fetchone()[0]
        print(f"CẦN di trú · bảng `media` có {n} hàng.")
        if not that:
            print("Chạy lại với `--that` để thực hiện. Sẽ sao lưu trước.")
            return 0

        lui = DB.with_suffix(f".sqlite.truoc-di-tru-{int(time.time())}")
        c.close()
        shutil.copy2(DB, lui)
        print(f"bản lùi: {lui.name}")

        c = sqlite3.connect(DB)
        cu = c.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='media'"
        ).fetchone()[0]
        # Đổi ĐÚNG mệnh đề CHECK, giữ nguyên mọi thứ khác của DDL gốc — chép
        # tay một DDL mới là chép một bản thứ hai, và bản thứ hai sẽ lệch.
        moi = cu.replace("('la_asr', 'nguoi_sua')", MOI)
        if moi == cu:
            print("KHÔNG tìm thấy mệnh đề CHECK để đổi — DỪNG, không đoán.")
            return 1
        moi = moi.replace("CREATE TABLE media", "CREATE TABLE media_moi", 1)

        cot = [r[1] for r in c.execute("PRAGMA table_info(media)")
               if not r[1].startswith("so_byte")]      # GENERATED — không chép
        ds = ", ".join(f'"{x}"' for x in cot)
        c.execute("PRAGMA foreign_keys = OFF")
        with c:
            c.execute(moi)
            c.execute(f"INSERT INTO media_moi ({ds}) SELECT {ds} FROM media")
            c.execute("DROP TABLE media")
            c.execute("ALTER TABLE media_moi RENAME TO media")
        sau = c.execute("SELECT COUNT(*) FROM media").fetchone()[0]
        print(f"xong · {sau}/{n} hàng còn nguyên")
        if sau != n:
            print("SỐ HÀNG LỆCH — khôi phục từ bản lùi rồi tìm nguyên nhân.")
            return 1
        return 0
    finally:
        try:
            c.close()
        except Exception:                                # noqa: BLE001
            pass


if __name__ == "__main__":
    sys.exit(main())
