#!/usr/bin/env node
/**
 * RETIRED — FR-034 (2026-08-26, C5).
 *
 * Test này canh "chỉ `approved` có TRANG BÀI TĨNH trên site; draft/rejected và
 * bản lưu trữ `*.v<n>.md` KHÔNG ra file .html" — răng của M03-R1 bản đầy đủ
 * (AC-2.1.1 + AC-2.2.1), đo bằng cách quét cây file output build Quartz.
 *
 * FR-034 bỏ đường build: KHÔNG còn trang bài tĩnh nào để đếm — bài mở trong
 * cửa sổ đọc client-side, thân bài đi theo chỉ mục/API. M03-R1 đã THU HẸP
 * thành S2 trong 06_modules/M03_web/rules.md (đường công bố tĩnh không còn),
 * nên phép kiểm này mất vật đo chứ không mất lý do sống:
 *
 * Răng thay thế còn sống ở chỗ khác:
 *   · bản lưu trữ `.v<n>` vô hình với mọi endpoint — api-crud/api-guard canh
 *     (M02 §2.5), và khoDoc()/docTuDia đều lọc `/\.v\d+\.md$/`.
 *   · draft/rejected phân biệt được với approved trên MỌI màn —
 *     bon-trang-thai + open-card canh (st-* + chỉ mục gom mọi trạng thái,
 *     màn quản lý phải đọc được cả draft: FR-024/FR-026).
 *
 * File chờ xoá vật lý ở C6; GIỮ trong chuỗi `npm test` vì meta-test của
 * nut-song §5 đòi mọi file .test.js đều được gọi.
 */
console.log("retired · FR-034 C5 — M03-R1 thu hẹp thành S2, không còn trang bài tĩnh")
process.exit(0)
