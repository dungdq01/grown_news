#!/usr/bin/env node
/**
 * FR-019 + FR-021 — thêm/sửa/xoá nhãn qua web: mọi răng phải có thật.
 *
 * FR-021 nắn M02-R3: cấm ĐỔI `id` và XOÁ nhãn đang có bài dùng, thay vì cấm mọi
 * sửa/xoá. Lý do: `validate.py:194-198` so `id`, không so `label_vi`/`gom` —
 * nhãn hiển thị không xuất hiện trong bất kỳ phép kiểm nào.
 *
 * VÌ SAO TEST NÀY QUAN TRỌNG HƠN VẺ NGOÀI:
 *
 * FR-019 GIẢM một lớp — server tự chạy `check_frozen --ky` nên hash luôn khớp,
 * `check_frozen` thôi là rào tuyệt đối cho `concepts.yaml`. Đổi lại là 5 răng ở
 * đây. Răng nào rụng thì endpoint trở về đúng thứ M02-R3 chống: máy thêm nhãn.
 *
 * CHỈ dùng kho TẠM: không phép kiểm nào được sửa `kb/` hay schema thật.
 *
 * Đường ghi CHỦ ĐỀ đụng `enum` trong hai bản schema, nên FR-021 thêm
 * `SCHEMA_DIR` — test copy schema sang thư mục tạm rồi trỏ vào đó. Trước khi có
 * nó, nhánh POST/DELETE categories KHÔNG có test đường-thành-công (nợ FR-021 tự
 * khai). Kho và schema phải CÙNG PHÍA; lệch phía → 409 (khối 11).
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { banGhi, batServer, CAT_FX, dungKho, goi, napLaiDb, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-api-danhmuc-kb")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

const CY = join(kho, "concepts.yaml")
const truoc = readFileSync(CY, "utf8")

// ĐẾM LÚC BẮT ĐẦU, không gõ cứng con số.
//
// Ba phép kiểm dưới từng gõ "22 mục". `kb/concepts.yaml` là danh mục SỐNG —
// người dùng thêm nhãn qua web là việc bình thường (FR-019), và hôm nay nó
// thành 24. Test gõ cứng thì mỗi lần người dùng dùng đúng tính năng là một test
// đỏ vì LÝ DO SAI. Điều cần khẳng định là DELTA (+1 khi thêm, về 0 khi xoá),
// không phải con số tuyệt đối.
const demMuc = (s) => (s.match(/^- id:/gm) ?? []).length
const SO_DAU = demMuc(truoc)

try {
  console.log("\n1 · Ranh giới method — FR-021 mở PATCH/DELETE, PUT vẫn đóng\n")

  // FR-019 đòi CẢ BA method → 404. FR-021 nắn lại: `PUT` là "thay toàn bộ", tức
  // đường đổi `id` — thứ bài viết trỏ vào ⇒ VẪN 404. `PATCH` là "sửa một phần"
  // nên sửa được label_vi/gom. Hai method na ná nhau, hệ quả khác hẳn.
  for (const d of ["/api/concepts", "/api/categories"]) {
    const r = await goi(CONG, "PUT", d, { body: { id: "x" } })
    ok(r.ma === 404, `PUT ${d} → 404 (thay toàn bộ = đổi id, không mở) — được ${r.ma}`)
  }
  // Không có :id thì PATCH/DELETE cũng không có nhánh nào.
  for (const m of ["PATCH", "DELETE"]) {
    const r = await goi(CONG, m, "/api/concepts", { body: {} })
    ok(r.ma === 404, `${m} /api/concepts (thiếu :id) → 404 — được ${r.ma}`)
  }

  console.log("\n2 · Không default trường người (M08-R3)\n")

  let r = await goi(CONG, "POST", "/api/concepts", { body: { id: "semantic-caching" } })
  ok(r.ma === 422 && String(r.json.thieu ?? "").includes("label_vi"),
    "thiếu label_vi → 422, trả lại ĐÚNG trường thiếu (máy không đặt nhãn hộ)")

  r = await goi(CONG, "POST", "/api/concepts", { body: { id: "KHONG_PHAI_SLUG", label_vi: "X" } })
  ok(r.ma === 422, "id không phải kebab-case → 422")

  console.log("\n3 · FR-028 · khai TỰ DO — không bài nào đề xuất vẫn vào được\n")

  // Mục này TRƯỚC ĐÂY canh chiều ngược lại: 0 bài đề xuất ⇒ 422. FR-028 gỡ răng
  // đó vì người dùng cần khai key liên tục. Đổi test theo là CÓ CHỦ ĐÍCH — R3:
  // tiêu chí đổi thì phải đổi ở FR trước, và FR-028 §AC-1 là chỗ nó được khai.
  //
  // Ca này chọn nhãn KHÔNG bài nào nhắc tới, tức đúng ca cũ chặn.
  const nhacToi = readdirSync(join(kho, "article"))
    .filter((t) => readFileSync(join(kho, "article", t), "utf8").includes("semantic-caching"))
  ok(nhacToi.length === 0,
    `chưa bài nào nhắc \`semantic-caching\` — đúng ca cổng cũ chặn (thấy ${nhacToi.length})`)

  r = await goi(CONG, "POST", "/api/concepts", {
    body: { id: "semantic-caching", label_vi: "Cache theo ngữ nghĩa", aliases: ["prompt-cache"] },
  })
  ok(r.ma === 200, `0 bài đề xuất → 200 — được ${r.ma} ${JSON.stringify(r.json).slice(0, 120)}`)
  ok(r.json?.nguong === undefined && r.json?.dang_co === undefined,
    "không còn trường `nguong`/`dang_co` — cổng gỡ hẳn, không chuyển sang cảnh báo mềm")

  // Nhật ký là lớp bảo vệ DUY NHẤT còn lại của concepts.yaml sau FR-028, nên
  // nó phải có dòng — và phải nói đúng thứ đã xảy ra, không phải "N bài đề xuất".
  const fNk = join(kho, "_nhat-ky-danh-muc.md")
  const dongNk = existsSync(fNk) ? readFileSync(fNk, "utf8") : ""
  ok(dongNk.includes("semantic-caching"), "nhật ký có dòng cho nhãn vừa thêm")
  // FR-034: nhật ký render từ bảng audit_log (chỉ-nối-thêm, trigger cấm sửa) —
  // căn cứ giờ là hành động THEM + label trong chi_tiet, không còn câu văn tự do.
  ok(dongNk.includes("THEM") && dongNk.includes("Cache theo ngữ nghĩa"),
    "nhật ký ghi ĐÚNG căn cứ: hành động THEM + nhãn người khai")

  console.log("\n4 · Ba răng còn lại KHÔNG được nới theo\n")

  ok(readFileSync(CY, "utf8") !== truoc, "file đã đổi sau lần thêm hợp lệ ở mục 3")

  // Trùng id — răng của themVaoDanhMuc, phải còn.
  r = await goi(CONG, "POST", "/api/concepts",
    { body: { id: "semantic-caching", label_vi: "Trùng" } })
  ok(r.ma === 409, `thêm lại cùng id → 409 — được ${r.ma}`)

  // Trùng ALIAS — ca dễ lọt hơn, vì id khác nhau.
  r = await goi(CONG, "POST", "/api/concepts",
    { body: { id: "prompt-cache", label_vi: "Cache prompt" } })
  ok(r.ma === 409,
    `id mới nhưng trùng ALIAS của mục đã có → 409 — được ${r.ma}`,
    "đây là răng chống 'rag/RAG/retrieval-augmented', và nó là răng cuối sau FR-028")

  const sau = readFileSync(CY, "utf8")
  ok(sau.startsWith(truoc.replace(/\n+$/, "")),
    `${SO_DAU} mục cũ + comment còn NGUYÊN VĂN — chỉ nối vào cuối, không round-trip qua parser`)
  ok(sau.includes("label_vi: Cache theo ngữ nghĩa"),
    "dấu tiếng Việt nguyên vẹn (YAML.stringify của lib thật, không tự chế)")
  ok(demMuc(sau) === SO_DAU + 1, `${SO_DAU} mục + 1 sau khi thêm — được ${demMuc(sau)}`)
  ok(/aliases:\s*\n\s+- rolling-origin/.test(sau) || sau.includes("rolling-origin"),
    "aliases của mục CŨ không bị mất")

  console.log("\n5 · Không trùng — id và alias\n")

  r = await goi(CONG, "POST", "/api/concepts",
    { body: { id: "semantic-caching", label_vi: "Lần hai" } })
  ok(r.ma === 409, `trùng id → 409 — được ${r.ma}`)

  // Trùng ALIAS của mục đã có: đây là ca "bốn tên một thứ" mà M02-R3 nói tới,
  // và sau FR-028 nó là RĂNG CUỐI CÙNG chống chuyện đó.
  //
  // Trước đây chỗ này phải gieo hai bài `concepts_proposed: rolling-origin` để
  // vượt cổng bằng chứng rồi mới chạm được tới phép kiểm alias. Cổng đó đã gỡ ⇒
  // hai file gieo là mồ côi do chính thay đổi này tạo ra, bỏ đi.
  r = await goi(CONG, "POST", "/api/concepts",
    { body: { id: "rolling-origin", label_vi: "Trùng alias" } })
  ok(r.ma === 409 && String(r.json.loi).includes("walk-forward-validation"),
    "trùng alias → 409 và CHỈ RA id chính — đúng thứ M02-R3 chống")

  console.log("\n6 · Chủ đề — xác nhận 2 bước\n")

  /*
   * FR-033 · cờ `xac_nhan` ĐÃ BỎ — người dùng: *"bỏ duyệt các concept /
   * category tạo mới → user tạo là lên chính thức luôn"*.
   *
   * Nó là một BƯỚC HAI, không phải một phép kiểm: không hỏi thêm dữ liệu nào,
   * chỉ bắt bấm lần nữa.
   *
   * Phép kiểm đổi sang thứ CÒN LÀ RĂNG: `label_vi` và `gom` vẫn bắt buộc, và đó
   * mới là thứ chặn một chủ đề rỗng nghĩa lọt vào enum của schema.
   */
  r = await goi(CONG, "POST", "/api/categories",
    { body: { id: "security" } })
  ok(r.ma === 422 && String(r.json.thieu ?? "").includes("label_vi"),
    `thiếu label_vi → 422 — được ${r.ma}`)
  r = await goi(CONG, "POST", "/api/categories",
    { body: { id: "security", label_vi: "An ninh" } })
  ok(r.ma === 422 && String(r.json.thieu ?? "").includes("gom"),
    `thiếu gom → 422 — được ${r.ma}`)
  ok(!String(JSON.stringify(r.json)).includes("xac_nhan"),
    "KHÔNG còn đòi `xac_nhan` — bước hai đã bỏ")

  console.log("\n7 · Nhật ký — bù cho việc --ky chạy tự động\n")

  const nk = readFileSync(join(kho, "_nhat-ky-danh-muc.md"), "utf8")
  ok(nk.includes("semantic-caching") && nk.includes("THEM")
    && nk.includes("Cache theo ngữ nghĩa"),
    "mỗi mục thêm có dòng: id, hành động, và nhãn người khai (audit_log — FR-034)")
  ok(!nk.includes("rolling-origin"), "mục bị từ chối KHÔNG vào nhật ký")

  console.log("\n8 · FR-021 · SỬA nhãn hiển thị — không đổi được id\n")

  r = await goi(CONG, "PATCH", "/api/concepts/semantic-caching",
    { body: { id: "ten-khac", label_vi: "X" } })
  ok(r.ma === 400 && String(r.json.loi).includes("id"),
    `body có \`id\` khác → 400 (id là thứ bài viết trỏ vào) — được ${r.ma}`)

  r = await goi(CONG, "PATCH", "/api/concepts/semantic-caching", { body: {} })
  ok(r.ma === 422, `không có gì để sửa → 422, không im lặng thành no-op — được ${r.ma}`)

  r = await goi(CONG, "PATCH", "/api/concepts/khong-ton-tai", { body: { label_vi: "X" } })
  ok(r.ma === 404, `id không có trong danh mục → 404 — được ${r.ma}`)

  r = await goi(CONG, "PATCH", "/api/concepts/semantic-caching",
    { body: { label_vi: "Cache ngữ nghĩa (đã sửa)" } })
  ok(r.ma === 200, `sửa label_vi → 200 — được ${r.ma} ${JSON.stringify(r.json).slice(0, 90)}`)

  let cy = readFileSync(CY, "utf8")
  ok(cy.includes("Cache ngữ nghĩa (đã sửa)"), "nhãn mới có trong file, dấu tiếng Việt nguyên")
  ok(cy.includes("id: semantic-caching"), "id KHÔNG đổi")
  ok(/^#/.test(cy), "phần đầu file (9 dòng comment luật) còn nguyên sau khi round-trip")
  ok(cy.includes("walk-forward-validation") && cy.includes("rolling-origin"),
    "mục cũ và aliases của chúng không bị mất")

  console.log("\n9 · FR-021 · XOÁ — chỉ nhãn không ai dùng\n")

  // `idempotency` được banGhi() gán cho mọi bài mẫu ⇒ đang có bài dùng.
  r = await goi(CONG, "DELETE", "/api/concepts/idempotency")
  ok(r.ma === 409 && Number(r.json.dang_dung) > 0,
    `nhãn đang dùng → 409 kèm SỐ BÀI (server tự đếm) — được ${r.ma}/${r.json?.dang_dung}`)
  ok(readFileSync(CY, "utf8") === cy, "bị chặn thì file không đổi một byte")

  r = await goi(CONG, "DELETE", "/api/concepts/semantic-caching")
  ok(r.ma === 200, `nhãn 0 bài dùng → 200 — được ${r.ma}`)
  cy = readFileSync(CY, "utf8")
  ok(!cy.includes("id: semantic-caching"), "mục đã mất khỏi file")
  ok(demMuc(cy) === SO_DAU, `về lại ${SO_DAU} mục — được ${demMuc(cy)}`)
  ok(/^#/.test(cy), "comment đầu file vẫn còn sau khi xoá")

  const nk2 = readFileSync(join(kho, "_nhat-ky-danh-muc.md"), "utf8")
  // FR-034: hành động trong audit_log là mã không dấu (THEM/SUA/XOA/EP-XOA).
  ok(/\bXOA\b/.test(nk2) && /\bSUA\b/.test(nk2),
    "nhật ký ghi CẢ HAI chiều — không có thùng rác cho nhãn nên đây là hồ sơ duy nhất")

  console.log("\n10 · CHỦ ĐỀ · đường ghi ĐẦY ĐỦ (FR-034 — một bảng, hết enum kép)\n")

  // FR-034: chủ đề sống trong bảng `categories`; schema không còn enum để ghi.
  // Đường ghi giờ ĐƠN GIẢN BẰNG concepts — đo trên DB + export, không đo schema.
  const { kho: kho2, rac: rac2, don: don2 } = dungKho("gn-api-danhmuc-cat", { chuDe: true })
  const sv3 = await batServer({ kho: kho2, rac: rac2 })
  const catCua = async () => (await goi(sv3.cong, "GET", "/api/categories")).json.items
  try {
    ok((await catCua()).length === CAT_FX.length,
       `danh mục khởi đầu ${CAT_FX.length} chủ đề (fixture qua DB) — được ${(await catCua()).length}`,
       "số này ĐỌC TỪ fixture (`CAT_FX`), không gõ tay")

    let rc = await goi(sv3.cong, "POST", "/api/categories", {
      body: { id: "security", label_vi: "An ninh", gom: "xác thực, phân quyền" },
    })
    ok(rc.ma === 200, `POST chủ đề mới → 200 — được ${rc.ma} ${JSON.stringify(rc.json).slice(0, 90)}`)
    ok((await catCua()).some((c) => c.id === "security"), "GET /api/categories có `security`")
    const cat = readFileSync(join(kho2, "categories.yaml"), "utf8")
    ok(/id: security/.test(cat) && /label_vi: An ninh/.test(cat),
      "categories.yaml (EXPORT) có mục mới")
    ok(/^#/.test(cat), "comment đầu file còn nguyên (header lưu trong meta)")

    rc = await goi(sv3.cong, "POST", "/api/categories", {
      body: { id: "security", label_vi: "Lần hai", gom: "trùng id" },
    })
    ok(rc.ma === 409, `POST trùng id → 409 — được ${rc.ma}`)

    // Xoá: `security` chưa bài nào dùng ⇒ xoá được — bảng + export cùng gỡ.
    rc = await goi(sv3.cong, "DELETE", "/api/categories/security")
    ok(rc.ma === 200, `DELETE chủ đề 0 bài → 200 — được ${rc.ma}`)
    ok(!(await catCua()).some((c) => c.id === "security"), "gỡ khỏi bảng categories")
    ok(!/id: security/.test(readFileSync(join(kho2, "categories.yaml"), "utf8")),
      "gỡ khỏi categories.yaml (export)")
    ok((await catCua()).length === CAT_FX.length,
       `danh mục về đúng ${CAT_FX.length} mục ban đầu`)

    // Chủ đề ĐANG DÙNG thì không xoá được — gieo một bài dùng nhãn rồi nạp DB.
    const CAT1 = CAT_FX[0][0]
    writeFileSync(join(kho2, "article", "co-cat.md"),
      banGhi({ id: "src_cat001", slug: "co-cat", them: { category: [CAT1] } }), "utf8")
    napLaiDb(kho2, rac2)   // FR-034: gieo file ⇒ nạp DB
    rc = await goi(sv3.cong, "DELETE", `/api/categories/${CAT1}`)
    ok(rc.ma === 409 && Number(rc.json.dang_dung) > 0,
      `DELETE chủ đề ĐANG DÙNG → 409 kèm số — được ${rc.ma}/${rc.json?.dang_dung}`)
    ok((await catCua()).some((c) => c.id === CAT1), "bị chặn thì danh mục không đổi")
  } finally {
    sv3.dung()
    don2()
  }

  console.log("\n11 · Kho tạm KHÔNG cần schema tạm nữa (FR-034)\n")

  // Trước FR-034: kho tạm + schema repo ⇒ 409 "lệch phía" (khoVaSchemaLech) vì
  // thêm chủ đề phải ghi enum schema. Enum chết ⇒ ràng buộc chết theo: POST
  // trên kho tạm thành công thẳng, không đụng file schema nào của repo.
  r = await goi(CONG, "POST", "/api/categories",
    { body: { id: "abc-xyz", label_vi: "Thử", gom: "thử sau FR-034" } })
  ok(r.ma === 200, `kho tạm POST chủ đề → 200, không còn 409 lệch phía — được ${r.ma}`)

  console.log("\n12 · Hai bug TỰ BẮT lúc kiểm tay — test cũ không thấy\n")

  // BUG 1 · định dạng. YAML.stringify đổi `aliases: [a, b]` (flow, như file nguồn
  // viết tay) thành block list. Một lần PATCH làm diff 78 thêm / 32 xoá trên file
  // mà chỉ sửa MỘT nhãn — nội dung đúng nhưng diff vô nghĩa và check_frozen thấy
  // cả file đổi. Test cũ chỉ kiểm NỘI DUNG nên xanh.
  ok(/aliases: \[/.test(cy),
    "aliases giữ FLOW style `[a, b]` sau khi sửa/xoá — không nở thành block list")
  ok(!/aliases:\s*\n\s+-/.test(cy), "không mục nào bị đổi sang block list")

  // BUG 2 · kho rỗng. `kb/` thật có 0 bài, nên MỌI nhãn đều "0 bài dùng" và xoá
  // được hết. Lúc kiểm tay nó đã xoá thật `idempotency` khỏi kho — phục hồi bằng
  // git. Test cũ xanh vì kho TẠM có bài dùng nhãn đó. Cùng lớp lỗi với việc
  // validate.py xanh trên kho 0 bài suốt từ FR-001 tới FR-015.
  const { kho: khoRong, rac: racRong, don: donRong } = dungKho("gn-api-danhmuc-rong")
  for (const f of readdirSync(join(khoRong, "article"))) rmSync(join(khoRong, "article", f))
  for (const f of readdirSync(join(khoRong, "paper"))) rmSync(join(khoRong, "paper", f))
  napLaiDb(khoRong, racRong)   // FR-034: xoá file seed thì DB cũng phải rỗng theo
  const sv2 = await batServer({ kho: khoRong, rac: racRong })
  try {
    const rr = await goi(sv2.cong, "DELETE", "/api/concepts/idempotency")
    ok(rr.ma === 409 && /kho chưa có bài nào/i.test(String(rr.json.loi)),
      `kho 0 bài → 409, KHÔNG xoá nhãn nào — được ${rr.ma}`,
      "0 bài dùng là hệ quả kho rỗng, không phải bằng chứng nhãn vô dụng")
    ok(demMuc(readFileSync(join(khoRong, "concepts.yaml"), "utf8")) === SO_DAU,
      `danh mục kho rỗng vẫn đủ ${SO_DAU} mục`)
  } finally {
    sv2.dung()
    donRong()
  }
} finally {
  sv.dung()
  don()
}

chot("FR-019+021 · thêm/sửa/xoá có điều kiện; id bất biến, nhãn đang dùng không xoá được")
