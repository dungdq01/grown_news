#!/usr/bin/env node
/**
 * T08-22 — năm cửa NHÁP cho TRÌNH DUYỆT. Sở hữu: `T03-91` (glob `loi-*`).
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * Bảng nháp là chỗ **CHƯA vào kho** (`FR-046`), và năm cửa này là đường duy
 * nhất người chạm vào nó. Bốn tính chất dễ cài sai theo cách không ai thấy:
 *
 *   1  KHÔNG KHOÁ DỊCH VỤ. Người gọi là trình duyệt. `loi-cua.mjs` là bảy cửa
 *      của MÁY và `quaCong` của nó ĐÒI khoá — đặt năm cửa này ở đó là 403 mọi
 *      lời gọi thật. Cổng đo bằng cách gọi **KHÔNG mang khoá nào**.
 *   2  DUYỆT = `validate --strict` PASS mới ghi FILE. Trượt ⇒ **nháp GIỮ
 *      NGUYÊN trạng thái** — một cửa đổi trạng thái rồi mới validate sẽ để lại
 *      hàng `da_duyet` mà kho không có file, và đó là hai nguồn chân lý.
 *   3  SỬA chỉ đụng `ban_hien_tai`. `ban_goc_ai` bất biến (trigger T08-19) —
 *      nó là thứ tốn token model để tạo, và là thứ trả lời "người đã sửa gì".
 *   4  TRẢ LẠI bắt kèm `ly_do`. Không lý do thì cùng loại nháp sẽ quay lại,
 *      và người trả lại lần sau không biết lần trước vì sao.
 *
 * ĐỎ_KHI  cửa đòi khoá dịch vụ · validate trượt mà nháp đã đổi trạng thái ·
 *         SỬA đụng `ban_goc_ai` · TRẢ LẠI qua được khi thiếu `ly_do` ·
 *         `review_status` nhận giá trị từ payload · chi tiết KHÔNG trả cả hai
 *         bản (FE phải gọi lần thứ hai để dựng diff)
 * XANH_KHI năm cửa mở cho trình duyệt, và mỗi phép chặn nằm ở tầng không quên được
 */
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const tmp = mkdtempSync(join(tmpdir(), "loinhap-"))
/*
 * PHẢI DESTRUCTURE `dungKho()` — nó trả `{ kho, rac, don }`, không trả một
 * đường dẫn. `loi-cua-http.test.js` truyền cả object và VẪN chạy, vì nó không
 * bao giờ GHI vào kho; cổng này thì có (cửa DUYỆT ghi file), và triệu chứng là
 * server CHẾT với `unable to open database file` — client chỉ thấy
 * `fetch failed`, một câu không nói vì sao.
 *
 * Đó là lý do `batServer` nay trả thêm `loi()`: một cổng không đọc được stderr
 * của server chỉ báo được "không kết nối được", và đi tìm nguyên nhân ở sai chỗ.
 */
const { kho, rac } = dungKho("loinhap")
const schema = dungSchema("loinhap")

const sv = await batServer({
  kho, rac, schema,
  loi: { LOI_DB: join(tmp, "_loi.sqlite"), LOI_LUU: join(tmp, "_luu"),
    KHOA_DICH_VU: "khoa-dich-vu-cho-cong-t0822",
    KHOA_PHIEN: "khoa-phien-khac-han-t0822" },
})

/*
 * Bản nháp HỢP LỆ — đủ để `validate --strict` cho qua.
 *
 * ⚠️ HÌNH DẠNG LẤY TỪ MỘT BẢN GHI THẬT (`kb/docs/xgboost-taylor-bac-hai.md`),
 * không tự nghĩ. Bản đầu của fixture này khai bảy trường và một mục — validate
 * đòi thêm `url` · `protocol_version` · `analyzed_at` · `one_liner` ·
 * `conformance`, cùng **chín mục** (1–5 và 3.1–3.4). Cổng đỏ, và mã thì ĐÚNG:
 * lần thứ ba trong phiên fixture sai mà mã đúng.
 *
 * `citations_sampled/verified` = 0 và `unverifiable_citations: true`: bản nháp
 * thử không có trích dẫn thật, và khai 0 là nói thật — khai một số dương là
 * bịa đúng thứ `AC-3.3` của M12 sinh ra để chặn.
 */
const banHopLe = (slug) => [
  "---",
  "id: src_t0822a",
  `slug: ${slug}`,
  "source_type: article",
  "url: https://example.com/t0822",
  "protocol_version: '2.0'",
  "analyzed_at: '2026-09-04'",
  "title: Bản nháp thử của cổng T08-22",
  "one_liner: Một câu tóm ý đủ dài để không bị coi là rỗng bởi validate",
  "credibility_max: plausible",
  "conformance: B",
  "citations_sampled: 0",
  "citations_verified: 0",
  "unverifiable_citations: true",
  "word_count: 0",
  "origin: manual",
  "review_status: draft",
  "---",
  "",
  "## 1. Overview",
  "",
  "Bản nháp dùng cho cổng T08-22 [§II.4].",
  "",
  "## 2. Bối cảnh",
  "",
  "Cổng cần một bản đi qua `validate --strict` [§II.4].",
  "",
  "## 3. Nội dung",
  "",
  "### 3.1 Đầu vào",
  "",
  "Một bản nháp trong bảng nhap_chung_cat, ghi bởi worker M12 qua cửa C2, và",
  "bản gốc của nó bất biến từ giây được ghi [§II.4]. Mục này dài hơn phần dẫn",
  "nhập vì validate đòi mục 1+2 chiếm dưới 25% toàn bài — một bài mà phần dẫn",
  "nhập chiếm quá một phần tư là dấu hiệu đang viết lại lời mở thay vì đọc",
  "nguồn thật.",
  "",
  "### 3.2 Process",
  "",
  "Cửa duyệt tách frontmatter, kiểm source_type với slug, rồi gọi",
  "ghiSauValidate — đúng một cửa ghi cho kho [§II.4]. Thứ tự hai bước cuối là",
  "cả luật: validate chạy TRƯỚC khi trạng thái đổi, nên không bao giờ có một",
  "hàng nói đã duyệt trong khi kho chưa có file.",
  "",
  "### 3.3 Output",
  "",
  "Một file trong kho, và từ giây đó file là chân lý [§II.4]. Bảng nháp còn",
  "lại chỉ để trả lời câu người đã sửa những gì so với bản máy — đó là lý do",
  "ban_goc_ai bất biến, cưỡng chế bằng trigger chứ không bằng lời hứa.",
  "",
  "### 3.4 Tinh túy",
  "",
  "Validate trước, đổi trạng thái sau [§II.4]. Đảo hai bước đó tạo ra hai",
  "nguồn chân lý, và nguồn sai là nguồn người đọc trước.",
  "",
  "## 4. Ý nghĩa thực tế",
  "",
  "Người duyệt không bao giờ thấy một hàng da_duyet mà kho không có file",
  "[§II.4]. Khi validate trượt, họ nhận nguyên văn từng dòng cổng đỏ thay vì",
  "một mã 422 trần — và nháp giữ nguyên trạng thái để họ sửa rồi duyệt lại.",
  "",
  "## 5. Rủi ro và tầm nhìn",
  "",
  "Nếu ai đổi thứ tự hai bước đó, sẽ có hai nguồn chân lý [§II.4]. Rủi ro thứ",
  "hai là một cửa ghi thứ hai cho kho — chỗ luật --strict bị bỏ quên.",
  "",
].join("\n")

try {
  console.log("\n1 · Cửa mở cho TRÌNH DUYỆT — KHÔNG đòi khoá dịch vụ\n")

  // Gieo một nháp qua cửa của MÁY (C2) — đó là đường worker M12 dùng.
  const tao = await goi(sv.cong, "POST", "/api/nhap-chung-cat", {
    headers: { "x-khoa-dich-vu": "khoa-dich-vu-cho-cong-t0822", "x-aud": "loi" },
    body: { ban_goc_ai: banHopLe("nhap-cua-t0822") },
  })
  ok(tao.ma === 201, "gieo nháp qua cửa MÁY (C2) ⇒ 201", `trả ${tao.ma} ${JSON.stringify(tao.json)}`)
  const job = tao.json?.job_ulid
  ok(typeof job === "string" && job.length > 0, "có `job_ulid`")

  // Và giờ đọc bằng lời gọi KHÔNG mang khoá nào — đúng thứ trình duyệt gửi.
  const ds = await goi(sv.cong, "GET", "/api/nhap-chung-cat")
  ok(ds.ma === 200, "`GET` danh sách KHÔNG khoá ⇒ 200 (cửa của NGƯỜI)",
    `trả ${ds.ma} — nếu 403 thì mã đã đặt sau \`quaCong\` của loi-cua.mjs`)
  ok(Array.isArray(ds.json?.dong) && ds.json.dong.length === 1, "danh sách có một hàng")

  console.log("\n2 · Danh sách trả đủ thứ màn triage cần, KHÔNG trả thân bài\n")

  const d0 = ds.json?.dong?.[0] ?? {}
  for (const k of ["job_ulid", "trang_thai", "khang_dinh_bi_tia", "ly_do", "cap_nhat_luc"]) {
    ok(k in d0, `danh sách có \`${k}\``)
  }
  // Phép PHỦ ĐỊNH chỉ có nghĩa khi danh sách CÓ hàng: `!("x" in {})` đúng
  // ngay cả khi cửa trả 404 và `d0` là object rỗng — một cổng xanh RỖNG.
  ok(Object.keys(d0).length > 0 && !("ban_goc_ai" in d0) && !("ban_hien_tai" in d0),
    "danh sách KHÔNG cõng hai bản toàn văn — chúng là thân bài, và một danh " +
    "sách 200 hàng sẽ nặng gấp trăm lần thứ nó cần hiện",
    Object.keys(d0).length === 0 ? "danh sách rỗng ⇒ chưa đo được" : "")

  console.log("\n3 · Chi tiết trả CẢ HAI bản — FE dựng diff không cần gọi lần hai\n")

  const ct = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${job}`)
  ok(ct.ma === 200, "`GET` chi tiết ⇒ 200", `trả ${ct.ma}`)
  ok(typeof ct.json?.ban_goc_ai === "string" && ct.json.ban_goc_ai.length > 0,
    "trả `ban_goc_ai`")
  ok(typeof ct.json?.ban_hien_tai === "string" && ct.json.ban_hien_tai.length > 0,
    "trả `ban_hien_tai` — hai bản trong MỘT lời gọi (AC1)")
  ok(typeof ct.json?.ban_goc_ai === "string"
    && ct.json.ban_goc_ai === ct.json.ban_hien_tai,
    "nháp chưa ai sửa ⇒ hai bản TRÙNG — FE nói 'trùng bản AI gốc', không im lặng",
    "hai `undefined` cũng bằng nhau, nên phép so PHẢI đòi chuỗi thật trước")
  const thieu = await goi(sv.cong, "GET", "/api/nhap-chung-cat/khong-co-that")
  ok(thieu.ma === 404, "ulid không có ⇒ 404", `trả ${thieu.ma}`)

  console.log("\n4 · SỬA chỉ đụng `ban_hien_tai`\n")

  const sua = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${job}/sua`, {
    body: { ban_hien_tai: banHopLe("nhap-cua-t0822") + "\nNgười đã thêm dòng này.\n" },
  })
  ok(sua.ma === 200, "SỬA ⇒ 200", `trả ${sua.ma} ${JSON.stringify(sua.json)}`)
  const ct2 = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${job}`)
  ok(ct2.json?.ban_goc_ai === ct.json.ban_goc_ai, "`ban_goc_ai` KHÔNG đổi")
  ok(ct2.json?.ban_hien_tai?.includes("Người đã thêm dòng này"), "`ban_hien_tai` đã đổi")
  ok(ct2.json?.trang_thai === "da_sua",
    "trạng thái sang `da_sua` — màn triage phân biệt nháp chưa ai chạm với nháp đã biên tập",
    `là ${ct2.json?.trang_thai}`)

  // Payload đòi trạng thái/`review_status` ⇒ BỊ BỎ, không phải bị từ chối.
  const sua2 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${job}/sua`, {
    body: { ban_hien_tai: banHopLe("nhap-cua-t0822"), trang_thai: "da_duyet",
      review_status: "approved", ban_goc_ai: "NGƯỜI CỐ GHI ĐÈ BẢN GỐC" },
  })
  ok(sua2.ma === 200, "SỬA kèm trường lạ vẫn 200 (BỎ, không từ chối)", `trả ${sua2.ma}`)
  const ct3 = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${job}`)
  ok(ct3.json?.ban_goc_ai === ct.json.ban_goc_ai,
    "payload đòi ghi `ban_goc_ai` ⇒ bản gốc VẪN nguyên")
  ok(ct3.json?.review_status === "draft", "payload đòi `approved` ⇒ vẫn `draft`")
  ok(ct3.json?.trang_thai === "da_sua",
    "payload đòi `da_duyet` ⇒ vẫn `da_sua` (trạng thái do CỬA đặt, không do payload)")

  console.log("\n5 · TRẢ LẠI bắt kèm `ly_do`\n")

  const tra0 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${job}/tra-lai`, { body: {} })
  ok(tra0.ma === 422, "thiếu `ly_do` ⇒ 422", `trả ${tra0.ma}`)
  ok(/lý do|ly_do/.test(JSON.stringify(tra0.json ?? {})), "và nói RÕ thiếu gì")
  const tra1 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${job}/tra-lai`, {
    body: { ly_do: "abc" },
  })
  ok(tra1.ma === 422,
    "`ly_do` quá ngắn ⇒ 422 — một chữ 'sai' không nói được vì sao sai",
    `trả ${tra1.ma}`)
  const tra2 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${job}/tra-lai`, {
    body: { ly_do: "thiếu địa chỉ cho hai khẳng định ở mục 2" },
  })
  ok(tra2.ma === 200, "có `ly_do` đủ dài ⇒ 200", `trả ${tra2.ma}`)
  const ct4 = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${job}`)
  ok(ct4.json?.trang_thai === "tra_lai", "trạng thái sang `tra_lai`")
  ok(ct4.json?.ly_do === "thiếu địa chỉ cho hai khẳng định ở mục 2",
    "`ly_do` đọc lại được — nó phải hiện lại trên item (T03-94 AC4)")

  console.log("\n6 · DUYỆT — validate PASS mới ghi FILE; trượt thì nháp GIỮ NGUYÊN\n")

  // Nháp HỎNG: thiếu `id` ⇒ validate --strict phải chặn.
  const taoHong = await goi(sv.cong, "POST", "/api/nhap-chung-cat", {
    headers: { "x-khoa-dich-vu": "khoa-dich-vu-cho-cong-t0822", "x-aud": "loi" },
    body: { ban_goc_ai: "---\nslug: nhap-hong-t0822\nsource_type: article\n---\n\nthân\n" },
  })
  const jobHong = taoHong.json?.job_ulid
  const duyetHong = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobHong}/duyet`, { body: {} })
  ok(duyetHong.ma === 422, "nháp không qua validate ⇒ 422", `trả ${duyetHong.ma}`)
  ok(JSON.stringify(duyetHong.json ?? {}).length > 20,
    "trả NGUYÊN VĂN lỗi của validate, không một mã trần",
    JSON.stringify(duyetHong.json ?? {}).slice(0, 160))
  const ctHong = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${jobHong}`)
  ok(ctHong.json?.trang_thai === "nhap",
    "validate TRƯỢT ⇒ nháp GIỮ NGUYÊN `nhap` — một cửa đổi trạng thái rồi mới " +
    "validate sẽ để lại hàng `da_duyet` mà kho không có file",
    `là ${ctHong.json?.trang_thai}`)

  // Nháp HỢP LỆ ⇒ file vào kho, trạng thái sang `da_duyet`.
  const taoTot = await goi(sv.cong, "POST", "/api/nhap-chung-cat", {
    headers: { "x-khoa-dich-vu": "khoa-dich-vu-cho-cong-t0822", "x-aud": "loi" },
    body: { ban_goc_ai: banHopLe("nhap-duyet-t0822") },
  })
  const jobTot = taoTot.json?.job_ulid
  const duyet = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobTot}/duyet`, { body: {} })
  ok(duyet.ma === 200 || duyet.ma === 201, "nháp hợp lệ ⇒ 2xx", `trả ${duyet.ma} ${JSON.stringify(duyet.json)}`)
  ok(/nhap-duyet-t0822/.test(JSON.stringify(duyet.json ?? {})),
    "trả về đường file đã ghi — người biết bài giờ ở đâu")
  const ctTot = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${jobTot}`)
  ok(ctTot.json?.trang_thai === "da_duyet", "trạng thái sang `da_duyet`",
    `là ${ctTot.json?.trang_thai}`)
  ok(ctTot.json?.review_status === "draft",
    "`review_status` VẪN `draft` — `da_duyet` nói vòng đời NHÁP, không nói kho. " +
    "Từ giây ghi file, FILE là chân lý (FR-046 §1 · B-C1)")

  console.log("\n6b · WO-044 · DB ĐÃ TỒN TẠI với schema CŨ — `CREATE TABLE IF NOT EXISTS` là no-op\n")

  /*
   * VÌ SAO PHÉP ĐO NÀY PHẢI TỒN TẠI — nó là bug WO-044, và 2785 phép đo khác
   * đều xanh trong khi cửa đầu tiên trả 500 trên máy đang chạy.
   *
   * Mọi cổng trỏ `LOI_DB` vào thư mục tạm ⇒ chúng luôn chạy trên DB **mới
   * toanh**, nơi `CREATE TABLE` chạy thật. Tức bộ cổng đo *"schema đúng khi
   * dựng từ đầu"*, và KHÔNG AI đo *"schema đúng khi DB đã có"* — hai câu khác
   * nhau, và câu thứ hai là câu người dùng gặp.
   *
   * Cách đo: dựng một DB theo schema CŨ (bảng nháp 9 cột, `CHECK` ba giá trị
   * của trước T08-27), trỏ server vào đó, rồi gọi cửa. Nếu mã không có đường
   * di trú thì đây là 500 `no such column` — ĐÚNG thứ đã xảy ra thật.
   */
  const tmpCu = mkdtempSync(join(tmpdir(), "loinhap-cu-"))
  const dbCu = join(tmpCu, "_loi.sqlite")
  {
    const { DatabaseSync } = await import("node:sqlite")
    const db = new DatabaseSync(dbCu)
    // Schema CŨ, nguyên văn trước T08-27: 9 cột, `CHECK` ba giá trị.
    db.exec(`CREATE TABLE nhap_chung_cat (
      job_ulid TEXT PRIMARY KEY, nguoi_dung_id INTEGER,
      ban_goc_ai TEXT NOT NULL, ban_hien_tai TEXT NOT NULL,
      trang_thai TEXT NOT NULL DEFAULT 'nhap'
        CHECK (trang_thai IN ('nhap', 'da_gui', 'bo')),
      review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status = 'draft'),
      lan_gui_duyet INTEGER NOT NULL DEFAULT 0,
      tao_luc TEXT NOT NULL DEFAULT (datetime('now')),
      cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')))`)
    db.close()
  }
  const svCu = await batServer({
    kho, rac, schema,
    loi: { LOI_DB: dbCu, LOI_LUU: join(tmpCu, "_luu"),
      KHOA_DICH_VU: "khoa-dich-vu-cho-cong-t0822",
      KHOA_PHIEN: "khoa-phien-khac-han-t0822" },
  })
  try {
    const dsCu = await goi(svCu.cong, "GET", "/api/nhap-chung-cat")
    ok(dsCu.ma === 200,
      "DB schema CŨ ⇒ cửa VẪN trả 200 — có đường di trú, không 500 `no such column`",
      `trả ${dsCu.ma} ${JSON.stringify(dsCu.json)} — đây là WO-044: ` +
      "`CREATE TABLE IF NOT EXISTS` KHÔNG sửa bảng đã tồn tại, và mọi cổng khác " +
      "chạy trên DB mới toanh nên không thấy")
  } finally {
    svCu.dung()
  }

  console.log("\n6c · BỎ một bản nháp — FR-057 · `da_bo`, KHÔNG xoá hàng\n")

  /*
   * `T03-94` đòi bốn hành động; `T08-22` làm ba rồi DỪNG ở Xoá vì `FR-046 §1`
   * không có trạng thái nào nghĩa *"đã bỏ"*. `FR-057` (2026-09-04, lối a của
   * chủ dự án) mở giá trị thứ năm.
   *
   * ⚠️ Cổng này đo cả vế PHỦ ĐỊNH quan trọng nhất: **hàng vẫn còn**. Một cửa
   * `DELETE` cũng làm "danh sách không còn nó" — hai thứ nhìn giống nhau ở
   * danh sách và khác nhau ở chỗ `ban_goc_ai` còn hay mất.
   */
  const taoBo = await goi(sv.cong, "POST", "/api/nhap-chung-cat", {
    headers: { "x-khoa-dich-vu": "khoa-dich-vu-cho-cong-t0822", "x-aud": "loi" },
    body: { ban_goc_ai: banHopLe("nhap-bo-t0829") },
  })
  const jobBo = taoBo.json?.job_ulid

  const bo0 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobBo}/bo`, { body: {} })
  ok(bo0.ma === 422, "thiếu `ly_do` ⇒ 422 — bỏ mà không nói vì sao là mất câu "
    + "duy nhất người sau cần đọc", `trả ${bo0.ma}`)
  const bo1 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobBo}/bo`, {
    body: { ly_do: "abc" },
  })
  ok(bo1.ma === 422, "`ly_do` quá ngắn ⇒ 422", `trả ${bo1.ma}`)

  const bo2 = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobBo}/bo`, {
    body: { ly_do: "nguồn không dùng được, bản khác đã thay" },
  })
  ok(bo2.ma === 200, "có `ly_do` đủ dài ⇒ 200", `trả ${bo2.ma} ${JSON.stringify(bo2.json)}`)

  const ctBo = await goi(sv.cong, "GET", `/api/nhap-chung-cat/${jobBo}`)
  ok(ctBo.ma === 200, "hàng VẪN ĐỌC ĐƯỢC sau khi bỏ — bỏ ≠ xoá", `trả ${ctBo.ma}`)
  ok(ctBo.json?.trang_thai === "da_bo", "trạng thái sang `da_bo`",
    `là ${ctBo.json?.trang_thai}`)
  ok(ctBo.json?.ly_do === "nguồn không dùng được, bản khác đã thay",
    "`ly_do` đọc lại được")
  ok(typeof ctBo.json?.ban_goc_ai === "string" && ctBo.json.ban_goc_ai.length > 0,
    "`ban_goc_ai` CÒN NGUYÊN — thứ tốn token model để tạo, và là thứ duy nhất "
    + "trả lời *người đã sửa những gì*")

  // MỘT CHIỀU: `da_bo` không đi tiếp. Muốn dùng lại là một quyết định mới, và
  // nó cần một FR nói ra — không phải một nút.
  const boLai = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobBo}/bo`, {
    body: { ly_do: "bỏ lần hai xem có qua không" },
  })
  ok(boLai.ma === 409, "bỏ LẦN HAI ⇒ 409", `trả ${boLai.ma}`)
  const suaSauBo = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobBo}/sua`, {
    body: { ban_hien_tai: banHopLe("nhap-bo-t0829") + "\nsửa sau khi bỏ\n" },
  })
  ok(suaSauBo.ma === 409, "SỬA một bản đã bỏ ⇒ 409 — `da_bo` là một chiều",
    `trả ${suaSauBo.ma}`)

  // `da_duyet` KHÔNG bỏ được: file đã nằm trong `kb/`, bỏ hàng nháp không gỡ
  // file ra, và để hai thứ lệch nhau là dựng hai nguồn chân lý (`B-C1`).
  const boDaDuyet = await goi(sv.cong, "POST", `/api/nhap-chung-cat/${jobTot}/bo`, {
    body: { ly_do: "thử bỏ một bản đã duyệt" },
  })
  ok(boDaDuyet.ma === 409, "bỏ một bản `da_duyet` ⇒ 409 — file đã trong kho",
    `trả ${boDaDuyet.ma}`)

  console.log("\n6d · Hàng đợi triage KHÔNG hiện bản đã bỏ, trừ khi lọc tường minh\n")

  const dsMd = await goi(sv.cong, "GET", "/api/nhap-chung-cat")
  const idMd = (dsMd.json?.dong ?? []).map((x) => x.job_ulid)
  ok(idMd.length > 0, "danh sách mặc định có hàng — phép phủ định dưới mới có nghĩa")
  ok(!idMd.includes(jobBo),
    "bản đã bỏ VẮNG ở danh sách mặc định — nó là hàng đợi VIỆC PHẢI LÀM",
    idMd.join(" "))
  const dsBo = await goi(sv.cong, "GET", "/api/nhap-chung-cat?trang_thai=da_bo")
  ok((dsBo.json?.dong ?? []).some((x) => x.job_ulid === jobBo),
    "lọc tường minh `?trang_thai=da_bo` thì CÓ — dữ liệu không biến mất")

  console.log("\n7 · Cửa của MÁY vẫn ĐÒI khoá — mở cửa NGƯỜI không được nới cửa MÁY\n")

  const may = await goi(sv.cong, "POST", "/api/nhap-chung-cat", {
    body: { ban_goc_ai: banHopLe("khong-khoa-t0822") },
  })
  ok(may.ma === 401 || may.ma === 403,
    "`POST /api/nhap-chung-cat` (cửa MÁY) KHÔNG khoá ⇒ vẫn bị chặn",
    `trả ${may.ma} — nếu 201 thì việc mở cửa NGƯỜI đã nới cả cửa MÁY`)
} catch (e) {
  // Server chet ⇒ in stderr cua NO, khong chi in loi cua client. `fetch
  // failed` noi "khong ket noi duoc", khong noi VI SAO — va vi sao nam o
  // dau ra cua tien trinh server.
  console.log("\n[cổng] lỗi:", String(e?.message ?? e))
  if (sv.loi) console.log("[server stderr]\n" + sv.loi())
  throw e
} finally {
  sv.dung()
}

chot("năm cửa nháp: mở cho người, chặn ở tầng không quên được, validate trước khi ghi")
