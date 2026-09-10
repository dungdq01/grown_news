#!/usr/bin/env node
/**
 * XEM TRƯỚC HIỆN VẬT trong cửa sổ đọc (FR-036/B8b) — và M09-R3.
 *
 * M09-R3 là luật nặng nhất của module: nhúng video là **lần đầu** sản phẩm gọi
 * ra mạng ngoài, và nó chỏi thế trận đã khai — bind 127.0.0.1, `analytics:
 * provider: null` ghim bằng `no-dangerous-html`, `no-leak`. Người dùng ký cho
 * egress này, nhưng ký cho **hai host cụ thể**; `fm.url` là DỮ LIỆU, và dựng
 * `src` từ dữ liệu là để người nạp bài chọn máy chủ mà trình duyệt người đọc gọi.
 *
 * Hai tầng, cố ý:
 *   §1–§3 soi BUNDLE — luật về CÁCH dựng `src` sống trong code, không trong DOM
 *   §4    soi TRANG MOCK đã render — chứng minh bản ghi thư viện tới được màn
 *         hình, tức `media` đi qua parser YAML tự chế (flow JSON, B8a)
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"

import { batServer, goi, napLaiDb, taoKiem } from "./_api.mjs"
import { khoTam, napRender, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
const GOC = join(WEB, "..")
const { ok, chot } = taoKiem()

const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const TS = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")

const js = (await taiSan()).gnJsNguon
  .replace(/\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g,
    (_, u, x) => String.fromCharCode(parseInt(u ?? x, 16)))

/**
 * Cat than mot ham trong bundle theo NGOAC KHOP.
 *
 * Vi sao ba phep kiem duoi day phai do TRONG than ham chu khong tren ca bundle:
 * ca bang `media-mime.json` duoc nhung vao bundle qua `define`, nen
 * `js.includes("xem_truoc")` LUON dung — no do su ton tai cua BANG, khong do
 * viec code CO DOC bang. Kiem hai chieu bat duoc dung lo do: doi
 * `loai.xem_truoc === "iframe"` thanh `loai.duoi === ".pdf"` ma cong VAN XANH.
 */
function thanHam(src, moc) {
  const i = src.indexOf(moc)
  if (i < 0) return null
  let sau = 0, k = src.indexOf("{", i)
  if (k < 0) return null
  for (; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}") { sau--; if (!sau) return src.slice(i, k + 1) }
  }
  return null
}

console.log("\n1 · Chon dang xem truoc theo BANG KHAI, khong theo FE doan\n")

const thanVe = thanHam(js, "function xemTruocHienVat")
ok(thanVe !== null, "tim duoc than ham `xemTruocHienVat`",
  "khong tim duoc thi moi phep kiem duoi day do mot chuoi rong")
ok(thanVe !== null && /xem_truoc/.test(thanVe),
  "HAM DUNG XEM TRUOC doc `xem_truoc` cua bang khai",
  "do tren ca bundle la vo nghia: ca bang nhung qua `define` nen chuoi do LUON co")
// Hai dang co that trong bang — dan xuat, khong go tay vao test.
const dang = [...new Set(BANG.loai.map((l) => l.xem_truoc))].sort()
ok(dang.length >= 2, `bang khai ${dang.length} dang xem truoc: ${dang.join(" · ")}`)
for (const d of dang) {
  ok(js.includes(`"${d}"`) || js.includes(`'${d}'`),
    `bundle nhac dang \`${d}\``)
}
ok(/\/api\/articles\/media\//.test(js),
  "duong xem truoc tro `/api/articles/media/<sha256>`")
// `attachment` o server (B6) CHINH LA chinh sach xem truoc cua ppt/word; FE chi
// noi ra. Nen phai co mot nut TAI VE cho dang `the`.
// Do TRONG than ham, khong tren ca bundle: `download` con xuat hien o cho khac
// (link tai template .md), nen phep kiem bundle-wide la vo nghia — kiem hai
// chieu bat duoc: bo han nut tai ve ma cong VAN XANH.
ok(thanVe !== null && /download/.test(thanVe), "dang `the` co nut tai ve (`download`)",
  "khong co thi nguoi dung thay mot the khong lam gi duoc")

console.log("\n2 · M09-R3 · `src` video dung tu WHITELIST, khong tu fm.url\n")

for (const h of BANG.video_host) {
  ok(js.includes(h.nhung), `bundle mang hang nhung cua \`${h.nhan}\``, h.nhung)
  ok(js.includes(h.id_mau), `bundle mang regex id cua \`${h.nhan}\``, h.id_mau)
}
// Nguon `.ts` KHONG go tay host: chung phai den tu `__MEDIA__`.
ok(!/youtube-nocookie|tiktok\.com\/embed/.test(TS),
  "`.ts` nguon KHONG go tay host nhung nao",
  "hai ban go tay lech nhau la mot host khong ai ky duyet len song")

/*
 * Chieu NGUOC — day la phep kiem chinh cua M09-R3.
 *
 * Cam noi suy `fm.url`/`url_normalized` THANG vao `src`. Bat theo hinh dang da
 * gay loi o cac repo khac: `src = ` roi den mot bieu thuc co `url` trong do.
 * Cat theo DONG de mot `src` hop le o dong khac khong bi ket toi oan.
 */
const dongSrc = js.split("\n").filter((l) => /\bsrc\b\s*[=:]/.test(l)
  || /setAttribute\(\s*["']src["']/.test(l))
const xau = dongSrc.filter((l) => /\burl(_normalized)?\b/.test(l)
  && !/nhung|EMBED|HOST/.test(l))
ok(xau.length === 0,
  `khong dong nao dung \`src\` tu \`url\` (${dongSrc.length} dong co \`src\`)`,
  xau.slice(0, 2).map((l) => l.trim().slice(0, 90)).join(" | "))
ok(dongSrc.length >= 1, "co it nhat mot cho dung `src` — phep kiem tren khong rong")

console.log("\n3 · Click-to-load — mo trang KHONG goi ra ngoai\n")

ok(/data-act="nhung-video"|data-act='nhung-video'/.test(js),
  "co nut `data-act=\"nhung-video\"` de nguoi doc bam")
ok(/act === "nhung-video"/.test(js),
  "va nhanh xu ly cho no (nut khong chet — nut-song §1)")
/*
 * Iframe video KHONG duoc nam trong chuoi HTML dung luc render. Kiem bang cach
 * cat khoi ham dung xem truoc roi doi: co `<iframe` cho PDF, KHONG co `nhung`
 * (host video) trong do — host chi xuat hien trong nhanh xu ly cu bam.
 */
const iNhung = js.indexOf('act === "nhung-video"')
ok(iNhung > 0, "tim duoc nhanh `nhung-video` trong bundle",
  "khong tim duoc thi phep kiem duoi day do mot chuoi rong")
if (thanVe) {
  // Doi KHONG nhac `nhung` — ca hang host LAN thuoc tinh. Ban dau chi so voi
  // hang literal, va kiem hai chieu bat duoc: chen `src=${v.nhung}${v.id}` vao
  // ham thi cong VAN XANH, vi bundle giu `v.nhung` la THAM CHIEU BIEN.
  // Hai phep, cong lai bat ca hai duong dan host vao ham:
  //   `.nhung` — TRUY CAP THUOC TINH (`${v.nhung}${v.id}`). Kiem hai chieu bat
  //     duoc lo nay: ban dau chi so voi HANG literal, nen chen bien thi cong
  //     VAN XANH — bundle giu `v.nhung` la tham chieu, khong noi suy chuoi.
  //   hang literal — ai do go thang URL nhung vao ham.
  // KHONG cam ca chuoi `nhung`: ten act la `nhung-video`, va no PHAI o day.
  ok(!/\.nhung\b/.test(thanVe),
    "ham dung xem truoc KHONG truy cap `.nhung` — iframe video chi sinh SAU khi bam",
    "dan host qua mot bien cung la mo trang LA goi ra ngoai")
  // `typeof === "string"` KHONG phai mot phep noi long — no vá mot ĐO ĐO OAN.
  // WO-074 cho douyin khai `nhung: null` (embed cua no tra 403, xem
  // `media-mime.json`). `"...".includes(null)` ep null thanh chuoi "null", va
  // than ham co chua chu "null" — nen ve nay DO vi mot ly do khong lien quan gi
  // toi viec co hay khong mot URL nhung trong ham. Host nao khong co chuoi
  // nhung thi khong co gi de ro ri o day.
  ok(!BANG.video_host.some((h) => typeof h.nhung === "string" && thanVe.includes(h.nhung)),
    "ham dung xem truoc KHONG chua hang host nao")
  ok(/<iframe/.test(thanVe), "ham dung xem truoc CO iframe cho pdf (khong do oan)")
}
// Cua NHUNG phai xac nhan id LAN NUA: giua luc ve va luc bam, DOM la thu ai
// cung sua duoc bang devtools.
const thanNhung = thanHam(js, "function nhungVideo")
ok(thanNhung !== null, "tim duoc ham `nhungVideo`")
ok(thanNhung !== null && /id_mau/.test(thanNhung),
  "`nhungVideo` xac nhan id voi `id_mau` TRUOC khi dung `src`",
  "do tren ca bundle la vo nghia — `id_mau` con nam trong bang duoc nhung")

console.log("\n4 · HAI duong du lieu cua cua so doc\n")

/*
 * Cua so doc lay `BAI` tu HAI cho:
 *   ban mock  -> fetch("/mock/static/open-index.json")
 *   ban THAT  -> fetch("/api/index")
 * Chung do HAI builder KHAC NHAU dung ra (data.mjs va articles.mjs:chiMucMo).
 * `hai-ban-shape.test.js` canh hai builder trong `data.mjs`; no KHONG biet
 * builder thu BA. Nen phai do o day — va do tren DU LIEU, khong tren HTML cua
 * trang: `media` khong bao gio nam trong HTML, no den qua JSON.
 */
const m = await napRender()
const mock = m.duLieuMock().bans
const tl = mock.find((b) => b.slug === "tai-lieu/bao-cao-chi-phi-suy-luan")
ok(!!tl, "ban ghi `tai-lieu` co trong duLieuMock()",
  `co: ${mock.map((b) => b.slug).slice(0, 3).join(", ")}`)
const SHA_MOCK = "3f2a" + "0".repeat(60)
ok(tl?.media?.[0]?.sha256 === SHA_MOCK,
  "`media` cua ban mock qua duoc parser YAML tu che (FLOW JSON, B8a)",
  `duoc ${JSON.stringify(tl?.media)} — block mapping ⇒ null, mat im lang`)
const vd = mock.find((b) => b.slug === "video/hoi-thao-context-engineering")
ok(vd?.ho_so === "thu-vien" && vd?.media === null,
  "ban ghi `video` la thu-vien va KHONG co media (dang ky URL, khong tai file)",
  `ho_so=${vd?.ho_so} media=${JSON.stringify(vd?.media)}`)

// Duong THAT: GET /api/index
const { kho, rac } = khoTam()
mkdirSync(join(kho, "_media"), { recursive: true })
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const SHA = createHash("sha256").update(PDF).digest("hex")
writeFileSync(join(kho, "_media", `${SHA}.pdf`), PDF)
mkdirSync(join(kho, "tai-lieu"), { recursive: true })
const FM = [
  "---",
  `id: "src_tlchimuc"`,
  `slug: "tl-chimuc"`,
  `source_type: "tai-lieu"`,
  `url: "kho://tai-lieu/tl-chimuc"`,
  `protocol_version: "2.0"`,
  `analyzed_at: "2026-08-27"`,
  `one_liner: "Tai lieu cho phep kiem chi muc"`,
  `credibility_max: "plausible"`,
  `review_status: "approved"`,
  `origin: "manual"`,
  `conformance: "B"`,
  `ho_so: "thu-vien"`,
  `media: [{"sha256": "${SHA}", "mime": "application/pdf", "ten_goc": "a.pdf", "so_byte": ${PDF.length}}]`,
  "---",
  "",
  "Ghi chu.",
  "",
]
writeFileSync(join(kho, "tai-lieu", "tl-chimuc.md"),
  FM.join(String.fromCharCode(10)), "utf8")
napLaiDb(kho, rac)

const sv = await batServer({ kho, rac })
try {
  const r = await goi(sv.cong, "GET", "/api/index")
  ok(r.ma === 200, "GET /api/index ⇒ 200", `duoc ${r.ma}`)
  const bans = (r.json?.articles ?? []).flatMap((a) => a.bans ?? [])
  const bTl = bans.find((b) => b.slug === "tai-lieu/tl-chimuc")
  ok(!!bTl, "chi muc co ban ghi tai-lieu vua gieo",
    `co: ${bans.map((b) => b.slug).join(", ")}`)
  ok(bTl?.ho_so === "thu-vien",
    "`/api/index` mang `ho_so` — builder thu BA khong bi bo quen",
    `duoc ${JSON.stringify(bTl?.ho_so)}`)
  ok(bTl?.media?.[0]?.sha256 === SHA,
    "`/api/index` mang `media` — thieu no thi xem truoc CHI chay tren ban mock",
    `duoc ${JSON.stringify(bTl?.media)}`)
  const bKhac = bans.find((b) => b.slug !== "tai-lieu/tl-chimuc")
  ok(bKhac?.ho_so === "phan-tich" && bKhac?.media === null,
    "ban ghi thuong: `phan-tich` + `media: null` (cung mac dinh voi data.mjs)",
    `ho_so=${bKhac?.ho_so} media=${JSON.stringify(bKhac?.media)}`)
} finally {
  sv.dung()
}

console.log("\n5 · Khung nhúng phải GỬI ORIGIN — không thì YouTube trả lỗi 153\n")

/*
 * Nguoi dung bao: mo cua so doc cua mot video YouTube ⇒ *"Loi 153 · Loi cau
 * hinh trinh phat video"*.
 *
 * Do duoc tren TRINH DUYET THAT, hai khung canh nhau, cung mot video, cung mot
 * trang, khac DUNG MOT thuoc tinh:
 *
 *   referrerpolicy="no-referrer"  ->  Error 153 · Video player configuration error
 *   referrerpolicy="origin"       ->  video nap binh thuong
 *
 * Mot bien, hai ket qua. YouTube TU CHOI PHAT khi khung nhung khong gui
 * `Referer`. Y dinh rieng tu cua `no-referrer` la that, nhung no tat luon
 * tinh nang.
 *
 * Vi sao o day do GIA TRI chu khong do HANH VI: mot cong goi YouTube moi lan
 * chay la cong do theo DUONG TRUYEN, khong theo ma. Bang chung hanh vi nam o
 * WO-032; cong nay canh cho no khoi troi nguoc.
 */
{
  const t = thanHam(js, "function nhungVideo") ?? ""
  ok(t.length > 0, "tìm được `nhungVideo`")
  const m = /referrerpolicy["'`,\s]+([a-z-]+)/.exec(t)
  ok(m !== null, `khung nhúng có khai \`referrerpolicy\``,
    "không khai thì trình duyệt dùng mặc định — chạy được, nhưng rộng hơn cần")
  const gt = m?.[1] ?? "(không khai)"
  // HAI VE. Chi cam `no-referrer` thi `same-origin` lot qua va hong y het:
  // no cung KHONG gui gi khi sang mot origin khac.
  ok(gt !== "no-referrer",
    `  KHÔNG phải \`no-referrer\` (đang là \`${gt}\`)`,
    "YouTube trả Lỗi 153 khi khung nhúng không gửi `Referer` — đo được trên "
    + "trình duyệt thật, hai khung cạnh nhau")
  ok(["origin", "strict-origin", "origin-when-cross-origin",
    "strict-origin-when-cross-origin"].includes(gt),
    `  và là giá trị CÓ gửi origin (\`${gt}\`)`,
    "`same-origin`/`no-referrer` không gửi gì khi sang origin khác ⇒ vẫn 153")
}
chot("xem truoc theo bang khai · src video tu whitelist · click-to-load")
