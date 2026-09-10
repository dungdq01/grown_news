#!/usr/bin/env node
/**
 * FR-038/C4 — `?nhom=` lọc danh sách theo MODULE, ở phía server.
 *
 * VÌ SAO CẦN: ba màn loại (Bài viết · Tài liệu · Video) cần danh sách của riêng
 * loại đó. `GET /api/index` không nhận tham số nào và trả cả kho KÈM CẢ THÂN BÀI
 * ⇒ mở màn Video vẫn tải toàn bộ kho.
 *
 * CHIỀU ÂM NẶNG HƠN CHIỀU DƯƠNG. Nếu một hôm ai đó cài `?nhom=` thành no-op "cho
 * khỏi lỗi" thì mọi phép kiểm chiều dương vẫn XANH — mọi bản ghi đều có mặt trong
 * kết quả. Chỉ phép kiểm "nhóm này KHÔNG được chứa bản của nhóm kia" bắt được.
 *
 * NHÓM LẠ ⇒ 400, KHÔNG PHẢI 200 RỖNG. Một danh sách rỗng không phân biệt được với
 * "kho chưa có gì", nên một lỗi chính tả ở FE thành "màn Video trống mãi mãi" mà
 * không ai báo. Cùng lớp lỗi `bangCua()` chọn NÉM thay vì rơi về bảng mặc định.
 *
 * Và một phép kiểm đo HÀNH VI chứ không đo chuỗi SQL: thân phản hồi `?nhom=video`
 * phải nhỏ hơn HẲN bản không lọc. Lọc trong JS sau khi đã đọc cả kho cũng làm mọi
 * phép kiểm nội dung ở trên xanh — nhưng không làm phản hồi nhỏ đi thì thôi, còn
 * cái nó cần chữa (đọc cả kho) thì vẫn nguyên.
 */
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, banGhi, batServer, dungKho, goi, napLaiDb, taoKiem, xuatKho } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-loc-nhom-kb")
const { ok, chot } = taoKiem()

// ─── Gieo: đủ NĂM loại bài viết + một tài liệu + một video ──────────────────
// Năm loại là có chủ đích: `?nhom=bai-viet` phải trả CẢ NĂM. Gieo một loại thôi
// thì một cài đặt chỉ nhận loại đầu bảng (`loai[0]`) vẫn xanh.
const NHOM_JSON = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module
const LOAI_BV = NHOM_JSON.find((m) => m.ten === "bai-viet").loai

// `dungKho` đã gieo article×2 + paper. Còn lại: repo · docs · announcement.
for (const loai of LOAI_BV) {
  const slug = `nhom-${loai}`
  mkdirSync(join(kho, loai), { recursive: true })
  writeFileSync(join(kho, loai, `${slug}.md`),
    banGhi({ id: `src_n${loai.slice(0, 5)}`, slug, type: loai }), "utf8")
}

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const SHA = createHash("sha256").update(PDF).digest("hex")
mkdirSync(join(kho, "_media"), { recursive: true })
writeFileSync(join(kho, "_media", `${SHA}.pdf`), PDF)
mkdirSync(join(kho, "tai-lieu"), { recursive: true })
writeFileSync(join(kho, "tai-lieu", "nhom-tai-lieu.md"), banGhi({
  id: "src_ntl001", slug: "nhom-tai-lieu", type: "tai-lieu",
  them: {
    ho_so: "thu-vien",
    media: [{ sha256: SHA, mime: "application/pdf", ten_goc: "bia.pdf", so_byte: PDF.length }],
  },
}), "utf8")

mkdirSync(join(kho, "video"), { recursive: true })
writeFileSync(join(kho, "video", "nhom-video.md"), banGhi({
  id: "src_nvd001", slug: "nhom-video", type: "video",
  them: { ho_so: "thu-vien", url_normalized: "youtube.com/watch?v=abc123nhom" },
}), "utf8")

napLaiDb(kho, rac)
xuatKho(kho, rac)

const sv = await batServer({ kho, rac })
const CONG = sv.cong

/** Mọi `source_type` xuất hiện trong một phản hồi `/api/index`. */
function loaiTrongChiMuc(j) {
  const s = new Set()
  for (const g of j.articles ?? []) for (const b of g.bans ?? []) s.add(b.source_type)
  return s
}

try {
  console.log("\n1 · Không lọc — cả kho, cả ba nhóm\n")

  const day = await goi(CONG, "GET", "/api/index")
  const loaiDay = loaiTrongChiMuc(day.json)
  ok(day.ma === 200, `/api/index không tham số ⇒ 200 (được ${day.ma})`)
  ok(loaiDay.size >= 7,
    `không lọc thì thấy cả ${loaiDay.size} loại — đủ để phép kiểm dưới có nghĩa`,
    `được: ${[...loaiDay].sort().join(" · ")}`)
  ok(loaiDay.has("tai-lieu") && loaiDay.has("video"),
    "gieo được cả tai-lieu và video vào kho tạm",
    "thiếu một loại ⇒ chiều âm dưới đây xanh vô căn cứ")

  console.log("\n2 · CHIỀU DƯƠNG — mỗi nhóm trả bản của mình\n")

  const chiMuc = {}
  for (const m of NHOM_JSON) {
    const r = await goi(CONG, "GET", `/api/index?nhom=${m.ten}`)
    chiMuc[m.ten] = r
    ok(r.ma === 200, `?nhom=${m.ten} ⇒ 200 (được ${r.ma})`)
    const co = loaiTrongChiMuc(r.json)
    ok(co.size > 0, `  ?nhom=${m.ten} trả ít nhất một bản ghi`,
      "rỗng ⇒ hoặc lọc sai hoặc gieo sai — cả hai đều phải đỏ")
    ok(m.loai.every((l) => co.has(l)),
      `  ?nhom=${m.ten} trả ĐỦ ${m.loai.length} loại của nhóm`,
      `thiếu ${m.loai.filter((l) => !co.has(l)).join(" · ")} — cài đặt chỉ nhận loai[0]?`)
  }

  console.log("\n3 · CHIỀU ÂM — nhóm này KHÔNG được chứa bản của nhóm kia\n")

  for (const m of NHOM_JSON) {
    const co = loaiTrongChiMuc(chiMuc[m.ten].json)
    const la = [...co].filter((l) => !m.loai.includes(l)).sort()
    ok(la.length === 0, `?nhom=${m.ten} KHÔNG lẫn loại của nhóm khác`,
      `lẫn: ${la.join(" · ")} — \`?nhom=\` đang là no-op`)
  }

  console.log("\n4 · Nhóm lạ ⇒ 400 kèm danh sách hợp lệ, KHÔNG phải 200 rỗng\n")

  const la = await goi(CONG, "GET", "/api/index?nhom=khong-co-that")
  ok(la.ma === 400, `?nhom=khong-co-that ⇒ 400 (được ${la.ma})`,
    "200 rỗng không phân biệt được với kho rỗng ⇒ lỗi chính tả ở FE im lặng mãi")
  const chuLoi = JSON.stringify(la.json ?? "")
  ok(NHOM_JSON.every((m) => chuLoi.includes(m.ten)),
    "  lời lỗi NÊU RA ba nhóm hợp lệ",
    `được: ${chuLoi.slice(0, 200)}`)

  const rong = await goi(CONG, "GET", "/api/index?nhom=")
  ok(rong.ma === 200 && loaiTrongChiMuc(rong.json).size === loaiDay.size,
    "`?nhom=` rỗng ⇒ coi như không lọc, không phải nhóm lạ",
    `được ${rong.ma} · ${loaiTrongChiMuc(rong.json).size} loại`)

  console.log("\n5 · Đo HÀNH VI — phản hồi lọc phải NHỎ HƠN HẲN\n")

  const bDay = Buffer.byteLength(JSON.stringify(day.json), "utf8")
  const bVideo = Buffer.byteLength(JSON.stringify(chiMuc.video.json), "utf8")
  ok(bVideo < bDay * 0.5,
    `?nhom=video nhỏ hơn nửa bản đầy (${(bVideo / 1024).toFixed(1)} KB < ` +
    `${(bDay / 1024).toFixed(1)} KB / 2)`,
    "lọc trong JS sau khi đã đọc cả kho làm mọi phép kiểm trên xanh mà không " +
    "chữa được thứ cần chữa")

  console.log("\n6 · `/api/articles` cũng nhận `?nhom=`\n")

  // Nó đã có `?type=` cho MỘT loại, nhưng nhóm `bai-viet` gồm NĂM loại. Không
  // thêm ở đây thì FE phải gõ tay năm loại — tầng thứ hai gõ tay đúng thứ
  // `loai-nguon.json` sinh ra để dẹp.
  for (const m of NHOM_JSON) {
    const r = await goi(CONG, "GET", `/api/articles?nhom=${m.ten}`)
    ok(r.ma === 200, `GET /api/articles?nhom=${m.ten} ⇒ 200 (được ${r.ma})`)
    const la2 = [...new Set((r.json?.items ?? []).map((b) => b.source_type))]
      .filter((l) => !m.loai.includes(l)).sort()
    ok(la2.length === 0, `  không lẫn loại nhóm khác`, `lẫn: ${la2.join(" · ")}`)
  }
  const laDs = await goi(CONG, "GET", "/api/articles?nhom=khong-co-that")
  ok(laDs.ma === 400, `/api/articles?nhom= lạ ⇒ 400 (được ${laDs.ma})`)

  console.log("\n7 · `theBai()` mang `ho_so` + `media` (builder thứ tư)\n")

  const ds = await goi(CONG, "GET", "/api/articles?nhom=tai-lieu")
  const the = (ds.json?.items ?? []).find((b) => b.slug === "nhom-tai-lieu")
  ok(!!the, "tìm thấy thẻ của bản tai-lieu",
    `có: ${(ds.json?.items ?? []).map((b) => b.slug).join(", ")}`)
  ok(the?.ho_so === "thu-vien", "thẻ mang `ho_so` đúng",
    `được ${JSON.stringify(the?.ho_so)}`)
  ok(the?.media?.[0]?.sha256 === SHA, "thẻ mang `media.sha256` nguyên vẹn",
    `được ${JSON.stringify(the?.media)}`)

  const theBv = (await goi(CONG, "GET", "/api/articles?nhom=bai-viet"))
    .json?.items?.[0]
  ok(theBv?.ho_so === "phan-tich", "bản không khai `ho_so` ⇒ `phan-tich`",
    `được ${JSON.stringify(theBv?.ho_so)}`)
  ok(theBv?.media === null, "bản không có hiện vật ⇒ `media` là `null`",
    `được ${JSON.stringify(theBv?.media)} (kiểu ${typeof theBv?.media})`)
} finally {
  sv.dung()
  don()
}

chot("?nhom= lọc đúng ba nhóm · nhóm lạ 400 · thẻ danh sách mang ho_so+media")
