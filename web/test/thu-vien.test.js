#!/usr/bin/env node
/**
 * AC-2.3.1 + AC-2.3.2 (M09) — KHO HIỆN VẬT: byte vào kho, byte ra khỏi kho.
 *
 * Gọi thẳng hàm trong `dungchung.mjs`, không qua HTTP: route
 * `POST /api/articles/media` là đơn vị sau (B5). Kiểm ở tầng hàm ngay bây giờ
 * là để mỗi luật có răng ở đúng chỗ nó sống — luật "sha256 do máy tính" là luật
 * của cửa ghi, không phải của bộ định tuyến.
 *
 * Bốn luật, mỗi luật một lý do đã đo:
 *   M09-R2 · sha256/so_byte do MÁY tính; magic-byte phải khớp mime khai
 *   M09-R2 · content-type từ enum ĐÓNG, không suy từ tên file
 *   M09-R5 · TRAN (1 MB, đường JSON) và TRAN_MEDIA (25 MB) là HAI hằng
 *   M09-R1 · con trỏ treo (media.sha256 khai mà không có byte) KHÔNG được COMMIT
 *
 * KB_DIR phải đặt TRƯỚC `import` — `dungchung.mjs` đọc env một lần lúc nạp
 * module. Nên import ở đây là ĐỘNG, và thứ tự hai dòng đó là hợp đồng.
 */
import { createHash } from "node:crypto"
import { request as httpReq } from "node:http"
import { EventEmitter } from "node:events"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { batServer, dungKho, goi, taoKiem, thanBai } from "./_api.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const GOC = join(TEST, "..", "..")
const { ok, chot } = taoKiem()

const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))

const { kho, rac, don } = dungKho("gn-thuvien")
process.env.KB_DIR = kho
process.env.RECYCLE_DIR = rac
const dc = await import("../api/dungchung.mjs")

// Byte thử. `%PDF-` là magic thật của PDF; bản HTML-có-script dưới đây là ĐÚNG
// thứ lớp thứ sáu tồn tại để chặn — nó vô hại trong test, và nguy hiểm đúng lúc
// được phục vụ lại same-origin dưới content-type `application/pdf`.
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const HTML = Buffer.from("<html><script>fetch('/api/articles')</script></html>", "utf8")
const PPTX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64)])
const bam = (b) => createHash("sha256").update(b).digest("hex")

// MỌI lời gọi nạp đi qua đây. Lý do đã đo: mất `INSERT OR IGNORE` thì SQLite NÉM
// (UNIQUE constraint), ngoại lệ không bắt giết CẢ file test ở dòng thứ hai — nó
// đỏ, nhưng đỏ trước khi in được một dòng nào về luật đã vỡ, và một màu đỏ không
// nói ra chỗ sai là một màu đỏ người ta sẽ bỏ qua. Phép kiểm phải SỐNG SÓT qua
// đúng thứ nó đang chấm.
const nap = (o) => dc.luuHienVat(o).then((r) => r, (e) => ({ ok: false, loi: `ném: ${e.message}` }))

try {
  console.log("\n1 · sha256 + so_byte do MÁY tính (M09-R2)\n")

  const kq = await nap({ byte: PDF, mime: "application/pdf" })
  ok(kq.ok === true, "nạp một PDF hợp lệ ⇒ nhận", kq.loi ?? "")
  ok(kq.sha256 === bam(PDF),
    "sha256 khớp `createHash` tính ĐỘC LẬP trong test",
    `kho nói ${kq.sha256}, test tính ${bam(PDF)}`)
  ok(kq.so_byte === PDF.length, `so_byte = ${PDF.length} (độ dài thật)`,
    `được ${kq.so_byte}`)
  ok(kq.mime === "application/pdf", "mime trả về đúng mime đã khai")

  // Chữ ký của hàm KHÔNG nhận sha256/so_byte: một tham số nhận được là một
  // tham số có ngày bị tin. Kiểm bằng cách gửi kèm rồi đòi máy BỎ QUA.
  const boc = await nap({
    byte: PDF, mime: "application/pdf",
    sha256: "0".repeat(64), so_byte: 999999,
  })
  ok(boc.ok === true && boc.sha256 === bam(PDF) && boc.so_byte === PDF.length,
    "sha256/so_byte gửi kèm bị BỎ QUA — client không chọn khoá lưu trữ",
    `được sha256=${boc.sha256} so_byte=${boc.so_byte}`)

  console.log("\n2 · Lớp thứ sáu — magic-byte phải khớp mime khai (M09-R2)\n")

  const doiLot = await nap({ byte: HTML, mime: "application/pdf" })
  ok(doiLot.ok === false, "HTML-có-script dán nhãn application/pdf ⇒ TỪ CHỐI")
  ok(/magic|byte mở đầu|chữ ký/i.test(String(doiLot.loi ?? "")),
    "lời từ chối nói ra là magic-byte lệch, không nói chung chung",
    String(doiLot.loi))

  /*
   * FR-039 · KỲ VỌNG NÀY ĐÃ HẾT HẠN, và đây là chỗ ghi lý do.
   *
   * Trước: mime ngoài enum ⇒ TỪ CHỐI. Người dùng chốt nhận MỌI định dạng, chặn
   * theo trần dung lượng — nên "từ chối" giờ là hồi quy, không phải phòng thủ.
   *
   * Cái CÒN phải đỏ được, và nó nặng hơn: một mime SAI HÌNH DẠNG. Chuỗi này đi
   * thẳng vào đầu đề `content-type`, nên một xuống dòng hay dấu chấm phẩy trong nó là đường tách
   * đầu đề. Bỏ danh sách không phải bỏ phép kiểm.
   */
  const ngoaiEnum = await nap({ byte: HTML, mime: "text/html" })
  ok(ngoaiEnum.ok === true, "FR-039 · mime lạ hợp lệ ⇒ NHẬN (cửa nhận đã mở)",
    String(ngoaiEnum.loi ?? ""))
  // CRLF dung bang `fromCharCode`, KHONG viet escape: chuoi nay di qua nhieu
  // tang cong cu va mot dau gach cheo o day DA mot lan thanh xuong dong THAT,
  // lam ca file thanh loi cu phap (su co escaping thu 16). Dang khong co
  // gach cheo thi khong tang nao doi duoc no.
  const CRLF = String.fromCharCode(13) + String.fromCharCode(10)
  for (const xau of [`text/html${CRLF}X-Bad: 1`, "text/ html",
                     "text/html; charset=x", "khongcogach"]) {
    const r = await nap({ byte: HTML, mime: xau })
    ok(r.ok === false && r.ma === 415,
      `  mime sai hình dạng ${JSON.stringify(xau)} ⇒ 415`,
      `được ok=${r.ok} ma=${r.ma}`)
  }

  const zip = await nap({
    byte: PPTX,
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  })
  ok(zip.ok === true, "pptx (magic ZIP `PK\\x03\\x04`) ⇒ nhận — cổng không đỏ oan",
    zip.loi ?? "")

  console.log("\n3 · Địa chỉ theo nội dung — nạp hai lần, một dòng byte\n")

  const lai = await nap({ byte: PDF, mime: "application/pdf" })
  ok(lai.ok === true && lai.sha256 === kq.sha256,
    "cùng byte ⇒ cùng sha256, không lỗi trùng khoá (INSERT OR IGNORE)",
    lai.loi ?? "")
  // Đếm bằng cách MỞ THẲNG kho, không qua một hàm `demHienVat()` sinh ra chỉ để
  // test gọi: một hàm production không ai dùng ngoài test là mã đầu cơ, và nó
  // che mất việc test đang đo lời kể của cùng lớp code nó đang chấm.
  const demDong = () => {
    const { DatabaseSync } = createRequire(join(GOC, "web", "package.json"))("node:sqlite")
    const db = new DatabaseSync(join(kho, "_kho.sqlite"), { readOnly: true })
    try { return db.prepare("SELECT count(*) AS n FROM media").all()[0].n } finally { db.close() }
  }
  // FR-039 · con số đổi từ 2 lên 3: bản `text/html` trước đây bị TỪ CHỐI nên
  // không có dòng byte nào; giờ nó được nhận. Phép kiểm vẫn đo đúng thứ nó nói
  // — địa chỉ theo nội dung nên PDF nạp ba lần vẫn MỘT dòng.
  ok(demDong() === 3,
    "kho có ĐÚNG 3 dòng byte sau 5 lần nạp thành công (pdf ×3 + pptx + html)",
    `đếm được ${demDong()}`)

  const ra = dc.docHienVat(kq.sha256)
  ok(ra && Buffer.compare(Buffer.from(ra), PDF) === 0,
    "docHienVat trả lại ĐÚNG byte đã nạp, không lệch một byte")
  ok(dc.docHienVat("f".repeat(64)) === null,
    "sha256 không có trong kho ⇒ null, không ném")

  console.log("\n4 · Trần riêng, chặn TRƯỚC khi đọc byte (M09-R5)\n")

  ok(dc.TRAN === 1024 * 1024, "TRAN (đường JSON) vẫn đúng 1 MB — không bị nới",
    `được ${dc.TRAN}`)
  ok(dc.TRAN_MEDIA === BANG.tran_byte,
    `TRAN_MEDIA = ${BANG.tran_byte} đọc từ media-mime.json, không gõ số lần hai`,
    `được ${dc.TRAN_MEDIA}`)

  {
    const req = new EventEmitter()
    req.headers = { "content-length": String(dc.TRAN_MEDIA + 1) }
    let daHuy = false
    req.destroy = () => { daHuy = true }
    let loi = null
    // Đua với một hẹn giờ: nếu hàm KHÔNG chặn ở header thì nó ngồi chờ byte mãi
    // (req giả không phát gì), và một test treo là một test không báo được gì.
    const treo = Symbol("treo")
    const kq2 = await Promise.race([
      dc.docBodyMedia(req).then(() => "xong", (e) => { loi = e; return "reject" }),
      new Promise((r) => setTimeout(() => r(treo), 300)),
    ])
    ok(loi !== null, "content-length vượt trần ⇒ reject NGAY, chưa một byte nào tới",
      kq2 === treo ? "hàm ngồi chờ byte — nghĩa là nó đo SAU khi đọc, không đo ở header" : "")
    ok(req.listenerCount("data") === 0,
      "không hề đăng ký listener `data` — chặn ở HEADER, không đọc rồi mới đo",
      `thấy ${req.listenerCount("data")} listener`)
    // ĐẢO CHIỀU so với bản B3 (phát hiện ở B5): trên đường HEADER, hàm này
    // KHÔNG được destroy. `req.destroy()` giết luôn socket ⇒ handler không còn
    // chỗ nào để nói `413`, và một trần chặn im lặng là một trần người dùng
    // không hiểu. Chủ của socket là HANDLER: nó trả lời trước, rồi mới cắt.
    // Đường STREAM thì khác — ở đó client đã khai sai, và hàm cắt ngay (khối
    // dưới canh điều đó). Hai tình huống, hai cách xử, mỗi cái một lý do.
    ok(daHuy === false,
      "KHÔNG destroy ở đường header — handler phải còn chỗ để trả 413",
      "destroy sớm là lý do duy nhất khiến 413 không bao giờ tới được client")
  }

  {
    /*
     * Header là DỮ LIỆU của người gửi: khai 10 byte rồi bơm quá trần phải chết.
     *
     * ⚠️ Số MB bơm ĐỌC TỪ TRẦN, không gõ 26. `FR-054 §9` nới trần 25 MB → 1 GiB
     * (chủ dự án ký 2026-09-04), và bản đầu của mục này gõ 26 MB cứng ⇒ nó ĐỎ
     * ngay lúc trần đổi, dù mệnh đề nó đo (*"stream được ĐẾM, header không phải
     * lời cuối"*) không đổi một chữ.
     *
     * Và KHÔNG bơm cả 1 GiB: bơm `trần + 1 MB` là đủ để vượt, còn bơm đủ 1 GiB
     * là một test ngốn 1 GiB RAM cho một mệnh đề về phép ĐẾM.
     */
    const req = new EventEmitter()
    req.headers = { "content-length": "10" }
    let daHuy = false
    req.destroy = () => { daHuy = true }
    let loi = null
    const p = dc.docBodyMedia(req).then(() => {}, (e) => { loi = e })
    const soMB = Math.ceil(dc.TRAN_MEDIA / (1024 * 1024)) + 1
    for (let i = 0; i < soMB && !daHuy; i++) req.emit("data", Buffer.alloc(1024 * 1024))
    req.emit("end")
    await p
    ok(loi !== null && daHuy,
      `khai 10 byte mà bơm >${soMB - 1} MB ⇒ vẫn chết: header không phải lời cuối`)
  }

  {
    const req = new EventEmitter()
    req.headers = { "content-length": String(PDF.length) }
    req.destroy = () => {}
    const p = dc.docBodyMedia(req)
    req.emit("data", PDF)
    req.emit("end")
    const b = await p
    ok(Buffer.compare(b, PDF) === 0, "body trong trần ⇒ trả đúng byte (không đỏ oan)")
  }

  console.log("\n5 · Con trỏ treo không được COMMIT (M09-R1)\n")

  const fmTaiLieu = (them) => ({
    id: "src_tl0001", slug: "tai-lieu-thu", source_type: "tai-lieu",
    url: "kho://tai-lieu/tai-lieu-thu",
    protocol_version: "2.0", analyzed_at: "2026-08-27",
    one_liner: "Bản tài liệu thử cho kho hiện vật",
    credibility_max: "plausible", review_status: "draft", origin: "manual",
    conformance: "B", concepts: ["idempotency"], ho_so: "thu-vien",
    ...them,
  })

  const treo = await dc.ghiSauValidate(
    fmTaiLieu({
      media: [{
        sha256: "a".repeat(64), mime: "application/pdf",
        ten_goc: "bia.pdf", so_byte: 12,
      }],
    }),
    "Ghi chú ngắn về tài liệu.", "tai-lieu", "tai-lieu-thu")
  ok(treo.ok === false, "media.sha256 BỊA (không có dòng byte) ⇒ KHÔNG ghi bản ghi")
  ok(/sha256|hiện vật|byte/i.test(String(treo.loi ?? "")),
    "lời từ chối trỏ vào con trỏ treo", String(treo.loi).slice(0, 120))
  ok(dc.docBai("tai-lieu", "tai-lieu-thu") === null,
    "và kho KHÔNG có bản ghi nào — từ chối là từ chối, không ghi nửa vời")

  const that = await dc.ghiSauValidate(
    fmTaiLieu({
      media: [{
        sha256: kq.sha256, mime: "application/pdf",
        ten_goc: "bia.pdf", so_byte: PDF.length,
      }],
    }),
    "Ghi chú ngắn về tài liệu.", "tai-lieu", "tai-lieu-thu")
  ok(that.ok === true, "cùng khuôn với sha256 THẬT ⇒ nhận (cổng không đỏ oan)",
    String(that.loi ?? "").slice(0, 200))

  console.log("\n6 · Bản PHÂN TÍCH không bị nhánh mới nuốt cổng\n")

  const phanTich = await dc.ghiSauValidate(
    {
      id: "src_pt0001", slug: "bai-phan-tich", source_type: "article",
      url: "https://example.com/bai-phan-tich",
      protocol_version: "2.0", analyzed_at: "2026-08-27",
      one_liner: "Bản phân tích thử", credibility_max: "plausible",
      review_status: "draft", origin: "manual", conformance: "B",
      concepts: ["idempotency"],
    },
    thanBai("Nội dung thử cho bản phân tích."), "article", "bai-phan-tich")
  ok(phanTich.ok === true, "bài phân tích đủ khung vẫn ghi được",
    String(phanTich.loi ?? "").slice(0, 200))

  const thieuMuc = await dc.ghiSauValidate(
    {
      id: "src_pt0002", slug: "bai-thieu-muc", source_type: "article",
      url: "https://example.com/bai-thieu-muc",
      protocol_version: "2.0", analyzed_at: "2026-08-27",
      one_liner: "Bản thiếu mục", credibility_max: "plausible",
      review_status: "draft", origin: "manual", conformance: "B",
      concepts: ["idempotency"],
    },
    "## 1. Overview\n\nMột đoạn duy nhất.\n", "article", "bai-thieu-muc")
  ok(thieuMuc.ok === false,
    "bài phân tích thiếu mục VẪN bị chặn — kho hiện vật không mở cửa sau")

  // ─── §7 · SERVER THẬT (B5) ────────────────────────────────────────────────
  //
  // §1–§6 goi THANG ham. Muc nay di qua HTTP, va do la mot tang khac han: ham
  // dung ma route khong noi la dung lop loi `duong-api-khop-route.test.js` sinh
  // ra de chan — kiem tung ben xanh KHONG suy ra cho noi xanh.
  console.log("\n7 · Qua HTTP — POST /api/articles/media (B5)\n")

  const sv = await batServer({ kho, rac })
  try {
    const napHttp = (byte, mime, them = {}) => goi(sv.cong, "POST", "/api/articles/media",
      { tho: byte, headers: { "content-type": mime, ...them } })

    const r201 = await napHttp(PDF, "application/pdf")
    ok(r201.ma === 201, "hien vat hop le ⇒ 201", `duoc ${r201.ma} · ${JSON.stringify(r201.json)}`)
    ok(r201.json?.sha256 === bam(PDF) && r201.json?.so_byte === PDF.length,
      "201 tra sha256 + so_byte do MAY tinh", JSON.stringify(r201.json))

    // FR-039 · `text/html` gio NHAN duoc. 415 chi con danh cho mime sai HINH
    // DANG — xem khoi tren, va xem `dinh-dang-mo.test.js` cho duong phuc vu.
    const rLa = await napHttp(HTML, "text/html")
    ok(rLa.ma === 201, "mime la hop le ⇒ 201 (cua nhan da mo)", `duoc ${rLa.ma}`)
    // `; charset=x` KHONG dung o day: tang HTTP cat tham so sau `;` truoc khi
    // goi `luuHienVat` (`articles.mjs:362`), va do la hanh vi DUNG cho mot
    // header hop le. Ca sai hinh dang that su di qua duoc phep cat do la mot
    // mime THIEU `/` hoac co dau cach.
    const r415 = await napHttp(HTML, "text/ html")
    ok(r415.ma === 415, "mime sai hinh dang ⇒ 415", `duoc ${r415.ma}`)

    const r422 = await napHttp(HTML, "application/pdf")
    ok(r422.ma === 422, "magic-byte lech mime khai ⇒ 422 (khong phai 415)",
      `duoc ${r422.ma} · ${JSON.stringify(r422.json)}`)

    // ─── 413: do bang CLIENT THO, khong bang fetch ──────────────────────────
    //
    // 413 CHUA TUNG duoc do qua HTTP trong ca bo test (grep "413" trong
    // web/test/ ra 0 dong truoc lan nay).
    //
    // Va do KHONG do duoc bang `fetch`: undici gui 26 MB, server tra 413 roi
    // dong, va client nhan ECONNRESET tren duong GHI truoc khi kip DOC phan
    // hoi — `fetch failed`, khong phai `413`. Do la gioi han cua HTTP, khong
    // phai bug cua server (da thu ca `res.on("finish")` roi moi destroy).
    //
    // Hop dong THAT can do la: "tu choi theo content-length TRUOC khi doc byte".
    // Client tho khai header roi KHONG gui byte nao, va doi phan hoi. Neu server
    // doi sau khi doc thi no se ngoi cho mai va test timeout — nen phep kiem nay
    // do dung dieu no noi.
    const goiTho = (headers) => new Promise((xong) => {
      const req = httpReq({
        host: "127.0.0.1", port: sv.cong, path: "/api/articles/media",
        method: "POST", headers,
      }, (res) => { res.resume(); xong({ ma: res.statusCode }) })
      req.on("error", (e) => xong({ ma: -1, loi: e.message }))
      // `flushHeaders()` la mau chot: `http.request` GIU header lai cho tới
      // `write()` hoac `end()` dau tien. Khong flush thi server chua nhan duoc
      // gi ca, va phep kiem "tu choi theo header" do mot cai im lang cua CLIENT
      // roi ket luan ve SERVER. Da do sai dung nhu vay mot lan.
      req.flushHeaders()
      // CO Y khong goi req.end(): body chua bao gio toi. Server phai tra loi
      // chi bang header.
    })
    const r413 = await Promise.race([
      goiTho({ "content-type": "application/pdf",
               "content-length": String(dc.TRAN_MEDIA + 1) }),
      new Promise((r) => setTimeout(() => r({ ma: -2 }), 3000)),
    ])
    ok(r413.ma === 413,
      "khai content-length vuot tran ⇒ 413 NGAY, chua mot byte body nao duoc gui",
      r413.ma === -2 ? "server ngoi cho body — nghia la no do SAU khi doc"
                     : `duoc ${r413.ma}${r413.loi ? " · " + r413.loi : ""}`)
    // Chieu con lai: khai trong tran thi server KHONG tra loi som (khong do oan)
    const rCho = await Promise.race([
      goiTho({ "content-type": "application/pdf", "content-length": "40" }),
      new Promise((r) => setTimeout(() => r({ ma: -2 }), 800)),
    ])
    ok(rCho.ma === -2, "khai TRONG tran ⇒ server cho body, khong tu choi som",
      `duoc ${rCho.ma} — tu choi mot request hop le la tran chan oan`)

    // `x-ten-goc` la TEN DE HIEN, khong bao gio la duong dan. Loc o SERVER: neu
    // loc o client thi mot client thu hai (curl, script) di vong qua duoc.
    const rTen = await napHttp(PDF, "application/pdf",
      { "x-ten-goc": "../../etc/passwd" })
    const ten = String(rTen.json?.ten_goc ?? "")
    ok(rTen.ma === 201 && !ten.includes("/") && !ten.includes("\\") && !ten.includes(".."),
      "x-ten-goc mang duong dan ⇒ tra ve da loc sach dau phan cach",
      `duoc ${JSON.stringify(ten)}`)
    const rTen2 = await napHttp(PDF, "application/pdf", { "x-ten-goc": "bao cao Q3.pdf" })
    ok(rTen2.json?.ten_goc === "bao cao Q3.pdf",
      "ten thuong KHONG bi doi — khong loc qua tay",
      `duoc ${JSON.stringify(rTen2.json?.ten_goc)}`)

    // Vong day du: byte truoc, ban ghi sau, roi GET lai.
    const fmHttp = (sha) => ({
      id: "src_tl0009", slug: "tl-qua-http", source_type: "tai-lieu",
      url: "kho://tai-lieu/tl-qua-http", protocol_version: "2.0",
      analyzed_at: "2026-08-27", one_liner: "Tai lieu nap qua HTTP",
      credibility_max: "plausible", conformance: "B",
      concepts: ["idempotency"], ho_so: "thu-vien",
      media: [{ sha256: sha, mime: "application/pdf", ten_goc: "bia.pdf", so_byte: PDF.length }],
    })
    const rBia = await goi(sv.cong, "POST", "/api/articles",
      { body: { frontmatter: fmHttp("b".repeat(64)), body: "Ghi chu." } })
    ok(rBia.ma === 422, "ban ghi tro sha256 BIA ⇒ 422", `duoc ${rBia.ma}`)

    const rThat = await goi(sv.cong, "POST", "/api/articles",
      { body: { frontmatter: fmHttp(bam(PDF)), body: "Ghi chu." } })
    ok(rThat.ma === 201, "ban ghi tro sha256 THAT ⇒ 201",
      `duoc ${rThat.ma} · ${JSON.stringify(rThat.json).slice(0, 300)}`)

    const rGet = await goi(sv.cong, "GET", "/api/articles/tai-lieu/tl-qua-http")
    ok(rGet.ma === 200 && rGet.json?.frontmatter?.media?.[0]?.sha256 === bam(PDF),
      "GET lai thay `media` trong frontmatter", `duoc ${rGet.ma}`)
    ok(rGet.json?.frontmatter?.review_status === "approved",
      "trang thai do `taoBai` dat — khong handler thu hai nao tu gan literal")
  } finally {
    sv.dung()
  }
} finally {
  don()
}

chot("kho hiện vật · máy cầm khoá, magic-byte là lớp thứ sáu, con trỏ treo không COMMIT")
