#!/usr/bin/env node
/**
 * RETIRED — FR-034 (2026-08-26).
 *
 * Test này canh "hai đường đọc (index SQLite / quét đĩa) trả dữ liệu y hệt"
 * — răng của kiến trúc FR-023 GĐ 3. FR-034 đảo nguồn chân lý sang
 * kb/_kho.sqlite: chỉ còn MỘT đường đọc (SELECT), không còn hai đường để so.
 *
 * AC thay thế: `python core/tests/check_export_dan_xuat.py` (round-trip
 * DB↔file) — đã sửa ở M08 spec §2.1 AC-2.1.2. File này chờ xoá vật lý ở
 * giai đoạn C5 (di trú test); đã gỡ khỏi chuỗi `npm test`.
 */
console.log("retired · FR-034 — xem check_export_dan_xuat.py")
process.exit(0)
