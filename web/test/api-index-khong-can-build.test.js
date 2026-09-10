#!/usr/bin/env node
/**
 * FR-024 · sửa kho rồi F5 là thấy — không phải `npm run build`.
 *
 * VẤN ĐỀ GỐC: thẻ bài và `static/open-index.json` đều sinh lúc BUILD. Thêm hay
 * sửa một bài sau đó thì trang vẫn hiện tập cũ. Hệ thống tự biết — có hằng
 * `NHAC_BUILD` nối vào 11 toast (*"trang tĩnh là bản build — chạy npm run build"*).
 *
 * CÁCH SỬA: `GET /api/index` trả cùng hình dạng `open-index.json` nhưng đọc lúc
 * request; `nap()` thử API trước, rơi xuống file tĩnh khi không có API.
 *
 * BA THỨ TEST NÀY CANH:
 *   1 endpoint trả đúng hình dạng, gộp theo url_normalized (M03-R5)
 *   2 thêm/xoá file trong kho ⇒ API phản ánh NGAY, không build
 *   3 hai bản markup thẻ (emitter `the()` và FE `theFE()`) KHÔNG lệch —
 *     đây là lớp lỗi đã gặp ba lần: parser YAML flow/block, word_count, tiêu đề
 *     nhân đôi. Bản song sinh nào cũng phải có cổng canh.
 */
import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { banGhi, batServer, dungKho, goi, napLaiDb, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-api-index")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

const GOC = join(import.meta.dirname, "..")

try {
  console.log("\n1 · GET /api/index — hình dạng của open-index.json\n")

  let r = await goi(CONG, "GET", "/api/index")
  ok(r.ma === 200, `200 — được ${r.ma}`)
  ok(Array.isArray(r.json?.articles), "có mảng `articles`")
  ok(typeof r.json?.total === "number", "có `total`")

  const g0 = r.json.articles[0]
  ok(g0 && Array.isArray(g0.bans), "mỗi phần tử có `bans[]` — hình dạng nhóm")
  ok(g0 && typeof g0.priority === "number", "nhóm có `priority` để sắp")
  const b0 = g0?.bans?.[0]
  for (const k of ["slug", "title", "source_type", "review_status", "than"]) {
    ok(b0 && k in b0, `bản có \`${k}\``)
  }
  ok(b0?.than?.length > 0, "có THÂN BÀI — cửa sổ đọc mở được từ chỉ mục, không fetch thêm")

  console.log("\n2 · Gộp theo url_normalized (M03-R5), sắp theo priority\n")

  // Hai bản CÙNG url ⇒ MỘT nhóm. Không gộp là thổi phồng số lượng bài.
  writeFileSync(join(kho, "article", "cung-nguon.md"),
    banGhi({ id: "src_cung001", slug: "cung-nguon",
      them: { url: "https://example.com/bai-nhap", url_normalized: "example.com/bai-nhap" } }), "utf8")
  writeFileSync(join(kho, "article", "bai-nhap.md"),
    banGhi({ id: "src_nhap01", slug: "bai-nhap",
      them: { url: "https://example.com/bai-nhap", url_normalized: "example.com/bai-nhap" } }), "utf8")
  napLaiDb(kho, rac)   // FR-034: gieo file ⇒ nạp DB — server đọc DB

  r = await goi(CONG, "GET", "/api/index")
  const nhomCung = r.json.articles.find((g) => g.url_normalized === "example.com/bai-nhap")
  ok(nhomCung?.bans?.length === 2,
    `hai bản cùng url_normalized gộp thành MỘT nhóm — được ${nhomCung?.bans?.length}`,
    "không gộp là thổi phồng số lượng bài")

  const pri = r.json.articles.map((g) => g.priority)
  ok(pri.every((p, i) => i === 0 || pri[i - 1] >= p),
    `sắp theo priority giảm dần — được [${pri.join(", ")}]`)

  console.log("\n3 · Kho đổi ⇒ API thấy NGAY, không build (FR-024; FR-034: kho = DB)\n")

  const truoc = (await goi(CONG, "GET", "/api/index")).json
  const demBan = (d) => d.articles.reduce((n, g) => n + g.bans.length, 0)

  const moi = join(kho, "paper", "them-nong.md")
  writeFileSync(moi, banGhi({ id: "src_nong01", slug: "them-nong", type: "paper" }), "utf8")
  napLaiDb(kho, rac)   // FR-034: thả file không còn là đường nạp — dung_lai_db là
  const sau = (await goi(CONG, "GET", "/api/index")).json
  ok(demBan(sau) === demBan(truoc) + 1,
    `thêm 1 bài vào DB ⇒ API +1 bản (${demBan(truoc)} → ${demBan(sau)}) — KHÔNG build`,
    "đây là phép kiểm chính của FR-024")

  unlinkSync(moi)
  napLaiDb(kho, rac)
  const sauXoa = (await goi(CONG, "GET", "/api/index")).json
  ok(demBan(sauXoa) === demBan(truoc), "bài rời DB ⇒ API về số cũ ngay")

  console.log("\n4 · Hai bản markup thẻ KHÔNG lệch\n")

  // `the()` ở emitter và `theFE()` ở FE sinh cùng một thẻ. Bản song sinh có chủ
  // ý, nhưng phải có cổng: thiếu một data-* là bộ lọc/sắp/mở-bài vỡ im lặng.
  const em = readFileSync(join(GOC, "plugins", "home-pages", "index.ts"), "utf8")
  const fe = readFileSync(
    join(GOC, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")

  const khoiEm = em.slice(em.indexOf("const the = (b: Ban"), em.indexOf("const dong = (b: Ban"))
  const khoiFe = fe.slice(fe.indexOf("function theFE("), fe.indexOf("async function dongBoThe"))

  for (const t of ["data-open", "data-slug", "data-loai", "data-cat", "data-cpt",
    // `--c:var(--c-` thay `border-top-color` từ `T03-115`: cùng một tính chất
    // được canh (hai bản song sinh mang CÙNG cơ chế màu-theo-loại), chỉ đổi
    // MỐC NEO vì cơ chế đổi. Số vế không giảm, phạm vi không nới.
    "data-ngay", "data-pri", "class=\"cd st-", "--c:var(--c-"]) {
    const a = khoiEm.includes(t), b = khoiFe.includes(t)
    ok(a && b, `cả hai bản có \`${t}\``, `emitter:${a} FE:${b}`)
  }
  ok(/class="pr"/.test(khoiEm) && /class="pr"/.test(khoiFe), "cả hai vẽ ô priority")
  ok(/class="ctx"/.test(khoiEm) && /class="ctx"/.test(khoiFe), "cả hai vẽ chip category")

  console.log("\n5 · Bản thật CHỈ một nguồn; /mock/ giữ nguồn riêng (FR-034)\n")

  ok(/if \(goc\(\) === "\/"\)/.test(fe),
    "vẫn tách hai bản theo goc() — `/mock/` không bao giờ đọc API kho thật")
  // FR-034: bản THẬT bỏ đường rơi im lặng — /api/index lỗi thì báo NHÌN THẤY.
  ok(/\/mock\/static\/open-index\.json/.test(fe),
    "/mock/ vẫn đọc chỉ mục tĩnh CỦA CHÍNH NÓ (server sinh từ kb-mock/)")
  const napSrc = fe.slice(fe.indexOf("async function nap("), fe.indexOf("function mo("))
  ok(!/"\/static\/open-index\.json"|g \+ "static\/open-index/.test(napSrc),
    "bản thật KHÔNG còn đường rơi về open-index — lỗi API phải nhìn thấy, không âm thầm cũ đi")
  ok(/bao\(true,/.test(napSrc), "nap() báo lỗi NHÌN THẤY khi /api/index trượt")
  ok(/if \(!API_CO\) return/.test(fe.slice(fe.indexOf("async function dongBoThe"))),
    "dongBoThe thoát ngay khi không có API — /mock/ không đổi hành vi")

  console.log("\n6 · slug của /api/index DÙNG ĐƯỢC ở /api/articles/<slug>\n")

  // Mục 1 chỉ canh CÓ trường `slug`; nó vẫn xanh khi giá trị sai hình dạng.
  // Bug thật lọt qua đúng khe đó: endpoint trả slug trần (`nop-qua-web`) trong
  // khi FE nối thẳng `"/api/articles/" + ban.slug` và router đòi `loai/slug`.
  // Bốn nút Duyệt · Loại · Sửa · Bỏ cùng chết, chỉ báo "Không đọc được bài".
  //
  // Nên ở đây KHÔNG so chuỗi với một mẫu — đi lại đúng đường FE đi.
  const moiSlug = (await goi(CONG, "GET", "/api/index")).json
    .articles.flatMap((g) => g.bans.map((b) => b.slug))
  ok(moiSlug.length > 0, `chỉ mục có bài để thử — ${moiSlug.length} bản`)
  for (const s of moiSlug) {
    const d = await goi(CONG, "GET", "/api/articles/" + s)
    ok(d.ma === 200, `GET /api/articles/${s} — 200, được ${d.ma}`,
      "FE nối thẳng slug này vào URL ở cả bốn chỗ sửa đổi")
  }

  // Cùng lẽ đó cho ba đường ghi: chúng nối slug y hệt.
  const mau = moiSlug[0]
  for (const [duoi, cach] of [["/status", "PATCH"], ["", "PUT"], ["", "DELETE"]]) {
    const d = await goi(CONG, cach, "/api/articles/" + mau + duoi, {})
    ok(d.ma !== 404, `${cach} /api/articles/${mau}${duoi} — không 404 (được ${d.ma})`,
      "404 ở đây nghĩa là router không nhận dạng slug, không phải bài không tồn tại")
  }

  console.log("\n7 · FR-028 · HAI phép đếm 'đang dùng', hai câu hỏi khác nhau\n")

  // Màn Danh mục lấy số bài dùng mỗi nhãn từ `GET /api/concepts`. Emitter đếm
  // con số đó trên bài APPROVED (`home-pages/index.ts:730-740`, lý do ghi sẵn:
  // màn này hỏi "nhãn được dùng tốt chưa"). Guard xoá nhãn thì đếm MỌI trạng
  // thái, vì nó hỏi "có bài nào TRỎ VÀO không".
  //
  // Hai con số phải KHÁC nhau khi có draft. Ai đó "dọn dẹp" bằng cách gộp hai
  // hàm lại thì một trong hai đầu vỡ, và vỡ im lặng:
  //   · gộp về approved  ⇒ xoá được nhãn mà một bài draft đang dùng
  //   · gộp về mọi-trạng ⇒ bật API lên là số trên màn nhảy so với bản build
  writeFileSync(join(kho, "article", "hai-dem-appr.md"),
    banGhi({ id: "src_hd0001", slug: "hai-dem-appr", status: "approved",
      them: { concepts: ["hai-dem"], insight_new: "x", skill_installed: "y", review_minutes: 5 } }), "utf8")
  writeFileSync(join(kho, "article", "hai-dem-draft.md"),
    banGhi({ id: "src_hd0002", slug: "hai-dem-draft", them: { concepts: ["hai-dem"] } }), "utf8")
  // FR-034: nạp DB TRƯỚC khi POST — POST kéo export, và export xoá file mồ côi
  // (file chưa vào DB chính là "mồ côi" dưới mắt xuat_kho).
  napLaiDb(kho, rac)

  r = await goi(CONG, "POST", "/api/concepts",
    { body: { id: "hai-dem", label_vi: "Nhãn thử hai phép đếm" } })
  ok(r.ma === 200, `thêm nhãn thử → 200 (FR-028: khai tự do) — được ${r.ma}`)

  const mucCpt = (await goi(CONG, "GET", "/api/concepts")).json.items
    .find((c) => c.id === "hai-dem")
  ok(mucCpt?.dang_dung === 1,
    `GET /api/concepts: dang_dung = 1 (chỉ bài approved) — được ${mucCpt?.dang_dung}`,
    "2 bài dùng nhãn này, 1 approved. Ra 2 nghĩa là mất bộ lọc approved.")

  const chan = await goi(CONG, "DELETE", "/api/concepts/hai-dem")
  ok(chan.ma === 409 && chan.json?.dang_dung === 2,
    `guard xoá: 409 và đếm = 2 (mọi trạng thái) — được ${chan.ma}/${chan.json?.dang_dung}`,
    "ra 1 nghĩa là guard đã lọc approved ⇒ xoá được nhãn mà bài draft đang dùng")

  ok(mucCpt.dang_dung !== chan.json.dang_dung,
    "hai con số KHÁC nhau — đó là chủ ý, không phải lỗi cần 'thống nhất'")

  /*
   * Và cùng trường đó phải có ở chủ đề, đúng hình dạng màn Danh mục cần.
   *
   * FR-031 · kho tạm của file này KHÔNG dùng schema tạm, nên `categories.yaml`
   * của nó buộc phải khớp enum trong repo — và enum đó giờ rỗng (người dùng xoá
   * sạch chủ đề). Vậy có thể KHÔNG có mục nào để soi hình dạng.
   *
   * Không bỏ qua: soi hình dạng ở nơi có dữ liệu, và khi rỗng thì soi HAI thứ
   * vẫn đo được — cái phong bì phân trang, và bốn trường trong chính handler.
   * Nhánh nào cũng có răng.
   */
  const traCat = (await goi(CONG, "GET", "/api/categories")).json
  const TRUONG_CAT = ["id", "label_vi", "gom", "dang_dung"]
  if (traCat.items[0]) {
    for (const k of TRUONG_CAT) ok(k in traCat.items[0], `mục chủ đề có \`${k}\``)
  } else {
    ok(Array.isArray(traCat.items) && typeof traCat.tong === "number",
       "chủ đề rỗng — vẫn trả đúng phong bì `{items, tong}`",
       "rỗng mà thiếu `tong` thì client không phân biệt được 'hết' với 'lỗi'")
    const src = readFileSync(join(GOC, "api", "articles.mjs"), "utf8")
    const than = src.slice(src.indexOf("export function danhMucChuDe"))
    const thieu = TRUONG_CAT.filter((k) => !than.slice(0, 600).includes(k))
    ok(thieu.length === 0, `handler chủ đề vẫn map đủ ${TRUONG_CAT.length} trường`,
       `thiếu trong mã: ${thieu.join(", ")}`)
  }
  const mucCpt0 = (await goi(CONG, "GET", "/api/concepts")).json.items[0]
  for (const k of ["id", "label_vi", "aliases", "dang_dung"]) {
    ok(mucCpt0 && k in mucCpt0, `mục khái niệm có \`${k}\``)
  }

  // Và bản dựng lúc BUILD phải cùng hình dạng — hai nguồn nuôi chung `nap()`.
  ok(/const slug = p\.slice\(thuMuc\.length \+ 1\)/.test(em),
    "emitter vẫn lấy slug = đường dẫn tương đối trong kho (có tiền tố loại)",
    "đổi bên này mà không đổi chiMucMo là hai nguồn lệch nhau trở lại")
} finally {
  sv.dung()
  don()
}

chot("FR-024 · sửa kho rồi F5 là thấy; hai bản markup không lệch")
