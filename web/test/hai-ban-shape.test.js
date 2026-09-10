#!/usr/bin/env node
/**
 * BẢN SONG SINH — hai hàm dựng `Ban` phải có CÙNG tập khoá (FR-036/B7a).
 *
 * `web/render/data.mjs` có hai hàm dựng `Ban`, mỗi hàm một danh sách trường GÕ
 * TAY:
 *   `banTuDb`   — kho thật, đọc DB (JSON, mảng là mảng)
 *   `docTuDia`  — kb-mock, quét đĩa (parser YAML tự chế)
 *
 * VÌ SAO CỔNG NÀY ĐÁNG TỒN TẠI RIÊNG: `hai-duong-doc-khop.test.js` bị retired ở
 * FR-034 với lý do *"chỉ còn MỘT đường đọc"*. Điều đó chỉ đúng cho **kho thật**.
 * `duLieuMock()` vẫn quét đĩa, nên hai hàm vẫn sống song song — và từ FR-034 tới
 * nay KHÔNG cổng nào so chúng. Một cổng bị gỡ để lại khoảng trắng mà không ai
 * khai, và đây là chỗ trắng đó.
 *
 * Thêm một trường vào MỘT bên là cách FE nhận `undefined` ở bản mock trong khi
 * bản real chạy đúng — bug chỉ lộ khi có người bấm nút REAL/MOCK.
 *
 * So TẬP KHOÁ, không so giá trị: giá trị khác nhau là ĐÚNG (hai kho khác nhau).
 */
import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { napLaiDb, taoKiem, xuatKho } from "./_api.mjs"
import { khoTam, napRender } from "./_render.mjs"

const { ok, chot } = taoKiem()
const m = await napRender()
const { kho, rac } = khoTam()

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const SHA = createHash("sha256").update(PDF).digest("hex")

// ─── Gieo mot ban ghi `tai-lieu` CO hien vat vao kho tam ───────────────────
// Byte phai co TRUOC khi nap DB: `dung_lai_db.py` chet to khi mot .md khai
// `media.sha256` ma thieu byte (M09-R1). Nen gieo file byte roi moi gieo .md.
mkdirSync(join(kho, "_media"), { recursive: true })
writeFileSync(join(kho, "_media", `${SHA}.pdf`), PDF)
mkdirSync(join(kho, "tai-lieu"), { recursive: true })
writeFileSync(join(kho, "tai-lieu", "tl-shape.md"), [
  "---",
  'id: "src_tlshape"',
  'slug: "tl-shape"',
  'source_type: "tai-lieu"',
  'url: "kho://tai-lieu/tl-shape"',
  'protocol_version: "2.0"',
  'analyzed_at: "2026-08-27"',
  'one_liner: "Tai lieu thu cho phep kiem hinh dang"',
  'credibility_max: "plausible"',
  'review_status: "approved"',
  'origin: "manual"',
  'conformance: "B"',
  'ho_so: "thu-vien"',
  // FR-052 · MANG — dau `-` bien block map thanh mot phan tu.
  "media:",
  `- sha256: "${SHA}"`,
  '  mime: "application/pdf"',
  '  ten_goc: "bia.pdf"',
  `  so_byte: ${PDF.length}`,
  "---",
  "",
  "Ghi chu ngan ve tai lieu.",
  "",
].join("\n"), "utf8")
napLaiDb(kho, rac)
xuatKho(kho, rac)

console.log("\n1 · Tap khoa cua `Ban` — hai chieu\n")

const real = m.duLieuReal().bans
const mock = m.duLieuMock().bans
ok(real.length > 0, `ban real co ${real.length} ban ghi`)
ok(mock.length > 0, `ban mock co ${mock.length} ban ghi`)

// Hop khoa CUA CA TAP, khong lay ban ghi dau tien: mot ban ghi le co the thieu
// khoa vi gia tri `undefined` bi bo, va do se lam phep kiem doc mot mau khong
// dai dien.
const khoaCua = (ds) => {
  const s = new Set()
  for (const b of ds) for (const k of Object.keys(b)) s.add(k)
  return s
}
const kReal = khoaCua(real)
const kMock = khoaCua(mock)

// HAI CHIEU, vi day la hai benh khac nhau:
//   thieu o mock = FE nhan `undefined` khi nguoi dung bam MOCK
//   thieu o real = FE nhan `undefined` tren kho THAT — nang hon
const thieuMock = [...kReal].filter((k) => !kMock.has(k)).sort()
const thieuReal = [...kMock].filter((k) => !kReal.has(k)).sort()
ok(thieuMock.length === 0, "khong khoa nao co o REAL ma thieu o MOCK",
  thieuMock.length ? `thieu: ${thieuMock.join(" · ")}` : "")
ok(thieuReal.length === 0, "khong khoa nao co o MOCK ma thieu o REAL",
  thieuReal.length ? `thieu: ${thieuReal.join(" · ")}` : "")
ok(kReal.size >= 15, `tap khoa co ${kReal.size} truong — du de phep kiem co nghia`,
  "qua it: co the ham dung Ban da doi hinh dang va phep kiem xanh vo can cu")

console.log("\n2 · Hai truong moi tới được `Ban` (FR-036)\n")

for (const ten of ["ho_so", "media"]) {
  ok(kReal.has(ten), `REAL mang \`${ten}\``)
  ok(kMock.has(ten), `MOCK mang \`${ten}\``)
}

const tl = real.find((b) => b.slug === "tai-lieu/tl-shape")
ok(!!tl, "tim thay ban ghi tai-lieu vua gieo",
  `co: ${real.map((b) => b.slug).join(", ")}`)
ok(tl?.ho_so === "thu-vien", "`ho_so` cua ban ghi thu vien tới nguyen ven",
  `duoc ${JSON.stringify(tl?.ho_so)}`)
ok(tl?.media?.[0]?.sha256 === SHA, "`media.sha256` tới nguyen ven (khong bi String() bop)",
  `duoc ${JSON.stringify(tl?.media)}`)
ok(tl?.media?.[0]?.mime === "application/pdf" && tl?.media?.[0]?.so_byte === PDF.length,
  "`media.mime` + `media.so_byte` tới nguyen ven", JSON.stringify(tl?.media))

console.log("\n3 · Mac dinh — ban ghi cu KHONG phai sua gi\n")

const cu = real.find((b) => b.slug !== "tai-lieu/tl-shape")
ok(!!cu, "co mot ban ghi khong khai `ho_so` de doi chung")
ok(cu?.ho_so === "phan-tich",
  "vang `ho_so` ⇒ `phan-tich` (khop validate.py + schema)",
  `duoc ${JSON.stringify(cu?.ho_so)}`)
// `null` chu khong `undefined`/`""`: mot hinh dang ON DINH la thu FE kiem duoc
// bang MOT phep thu. Ba kieu rong khac nhau la ba nhanh o phia FE.
ok(cu?.media === null, "vang `media` ⇒ `null`, khong `undefined` va khong chuoi rong",
  `duoc ${JSON.stringify(cu?.media)} (kieu ${typeof cu?.media})`)

const cuMock = mock[0]
ok(cuMock?.ho_so === "phan-tich", "ban MOCK cung mac dinh `phan-tich`",
  `duoc ${JSON.stringify(cuMock?.ho_so)}`)
ok(cuMock?.media === null, "ban MOCK vang `media` ⇒ `null`",
  `duoc ${JSON.stringify(cuMock?.media)}`)

/*
 * ═══ BON builder, khong hai (FR-038/C4) ═════════════════════════════════════
 *
 * Ten file noi "hai ban" vi luc sinh ra chi co hai. DO duoc la co BON danh sach
 * truong GO TAY dung hinh dang mot ban ghi:
 *
 *   `banTuDb`   render/data.mjs:156  — kho that, doc DB
 *   `docTuDia`  render/data.mjs:255  — kb-mock, quet dia
 *   `chiMucMo`  api/articles.mjs:72  — GET /api/index, cua so doc ban THAT
 *   `theBai`    api/articles.mjs:20  — GET /api/articles, THE danh sach
 *
 * BA builder dau nuoi CUNG mot ham `nap()` o FE nen phai co TAP KHOA Y HET —
 * lech mot truong la FE nhan `undefined` o dung mot ban trong khi ban kia chay.
 *
 * `theBai` la hop dong KHAC (the danh sach, khong kem than bai). Khac biet cua
 * no khai THANH BANG duoi day, khong noi phep so thanh "gan giong": khai ra thi
 * mot khac biet MOI la do, con noi phep so thi moi khac biet deu xanh.
 */
console.log("\n4 · BON builder — ba ban `Ban` khop tuyet doi\n")

const { batServer, goi } = await import("./_api.mjs")
const sv = await batServer({ kho, rac })
let kIdx, kThe, theTL, theBv
try {
  const idx = await goi(sv.cong, "GET", "/api/index")
  kIdx = khoaCua((idx.json?.articles ?? []).flatMap((g) => g.bans ?? []))
  const ds = await goi(sv.cong, "GET", "/api/articles")
  kThe = khoaCua(ds.json?.items ?? [])
  theTL = (ds.json?.items ?? []).find((b) => b.slug === "tl-shape")
  theBv = (ds.json?.items ?? []).find((b) => b.slug !== "tl-shape")
} finally {
  sv.dung()
}

ok(kIdx.size > 0 && kThe.size > 0,
  `/api/index co ${kIdx.size} khoa · /api/articles co ${kThe.size} khoa`,
  "khong doc duoc endpoint nao ⇒ moi phep kiem duoi xanh vo can cu")

for (const [ten, bo] of [["REAL", kReal], ["MOCK", kMock]]) {
  const thieuIdx = [...bo].filter((k) => !kIdx.has(k)).sort()
  const thuaIdx = [...kIdx].filter((k) => !bo.has(k)).sort()
  ok(thieuIdx.length === 0, `\`chiMucMo\` khong thieu khoa nao so voi ${ten}`,
    `thieu: ${thieuIdx.join(" · ")} — cua so doc tren kho THAT nhan undefined`)
  ok(thuaIdx.length === 0, `\`chiMucMo\` khong co khoa la so voi ${ten}`,
    `thua: ${thuaIdx.join(" · ")}`)
}

console.log("\n5 · `theBai` — khac biet CO CHU DICH, khai thanh bang\n")

// Vang o `theBai` MOT CACH CO CHU DICH — the danh sach khong kem than bai va
// khong lam viec gop/xep hang.
const THE_VANG = ["than", "priority", "url_normalized", "concepts_proposed"]
// CO rieng o `theBai` — the can etag de PUT, `url` tho de mo nguon, `word_count`
// de hien do dai. Ba builder kia khong can.
const THE_RIENG = ["etag", "url", "word_count"]

for (const k of THE_VANG) {
  ok(!kThe.has(k), `\`theBai\` vang \`${k}\` — dung nhu khai`,
    "co them truong ⇒ hop dong the doi ma bang nay chua cap nhat")
}
for (const k of THE_RIENG) {
  ok(kThe.has(k), `\`theBai\` co \`${k}\` — dung nhu khai`)
}
const laThe = [...kThe]
  .filter((k) => !kReal.has(k) && !THE_RIENG.includes(k)).sort()
const hutThe = [...kReal]
  .filter((k) => !kThe.has(k) && !THE_VANG.includes(k)).sort()
ok(laThe.length === 0, "khong khoa NAO o `theBai` ngoai bang khai",
  `la: ${laThe.join(" · ")}`)
ok(hutThe.length === 0, "khong khoa nao cua `Ban` bi `theBai` bo ngoai bang khai",
  `hut: ${hutThe.join(" · ")}`)

ok(theTL?.ho_so === "thu-vien", "the danh sach mang `ho_so` dung",
  `duoc ${JSON.stringify(theTL?.ho_so)}`)
ok(theTL?.media?.[0]?.sha256 === SHA, "the danh sach mang `media.sha256` nguyen ven",
  `duoc ${JSON.stringify(theTL?.media)}`)
ok(theBv?.ho_so === "phan-tich", "the vang `ho_so` ⇒ `phan-tich`",
  `duoc ${JSON.stringify(theBv?.ho_so)}`)
ok(theBv?.media === null, "the vang `media` ⇒ `null` khong `undefined`",
  `duoc ${JSON.stringify(theBv?.media)} (kieu ${typeof theBv?.media})`)

chot("bon builder: ba ban Ban khop tuyet doi · theBai khac dung bang khai")
