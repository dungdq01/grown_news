/**
 * M03_web · SSR (FR-034/C1) — GHÉP ASSET TĨNH: gn.css, gn.js, open-index.json,
 * ảnh nền. Port phần asset của emitter home-pages + backdrop-assets.
 *
 * CSS/JS ghép MỘT LẦN lúc import: nguồn của chúng là file trong repo, chỉ đổi
 * khi code đổi — mà code đổi thì server restart. Render trang thì mỗi request
 * (dữ liệu sống trong DB), asset thì theo đời process — hai nhịp khác nhau
 * vì hai thứ đổi theo hai nhịp khác nhau.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tinhChiMuc } from "./data.mjs"

const RENDER = dirname(fileURLToPath(import.meta.url))
const WEB = join(RENDER, "..")
const GOC = join(WEB, "..")

/**
 * FR-027f · CAT BINH LUAN CSS o luc gop.
 *
 * Do that: 58 KB trong 160 KB `gn.css` la BINH LUAN — 36% bundle. Chung viet
 * cho nguoi doc repo, khong cho trinh duyet; nguon giu nguyen tung chu.
 *
 * Vi sao KHONG minify that (bo khoang trang, gop selector): mot buoc bien
 * dich thi phai co source map, khong thi debug CSS thanh doan mo. Cat binh
 * luan la phep BO, khong phai phep DOI — moi dong con lai y nguyen, nen
 * so dong trong DevTools van tro dung cho.
 *
 * Mau `[^*]*\*+(?:[^\/*][^*]*\*+)*` la mau chuan cho binh luan CSS. Khong
 * dung `[\s\S]*?` vi khung `/* ═══ ... ═══ *\/` cua file nay co nhieu `*`
 * lien tiep — mau lazy van dung nhung mau chuan an toan hon khi cau truc
 * long nhau.
 */
/*
 * FR-041 · CAT THEM THUT DAU DONG — van la phep BO, khong phai phep DOI:
 * so DONG giu nguyen (DevTools van tro dung cho), chi mat khoang trang dan
 * trang ma trinh duyet khong doc. Do luc them: ~6 KB tren bundle da kich
 * tran 100 KB. Khoang trang TRONG dong giu nguyen — `calc(a - b)` can no.
 */
const catBinhLuan = (s) =>
  s.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")

const css = catBinhLuan([
  readFileSync(join(GOC, "05_uiux", "tokens.css"), "utf8"),
  readFileSync(join(WEB, "styles", "prototype.css"), "utf8"),
].join("\n"))

/**
 * T03-101 · CAT BINH LUAN JS — cung khuon `catBinhLuan` cho CSS (`FR-027f`).
 *
 * Do that: `gn.js` da o **102314 / 102400 — du 86 byte** truoc dot nay, nen MOI
 * tinh nang FE tiep theo deu vuot tran. JS cua du an nay dac binh luan hon CSS,
 * va cung lap luan: chung viet cho nguoi doc repo, khong cho trinh duyet.
 *
 * VI SAO KHONG regex tong quat: `//` song duoc trong chuoi (`"http://x"`),
 * trong regex literal (`/\/\//`), va trong template literal nhieu dong. Mot
 * regex "cat moi `//` toi het dong" lam hong ma IM LANG.
 *
 * ⇒ Chi cat HAI dang KHONG NHAP NHANG, ca hai nhan dien o DAU DONG:
 *     · dong ma ky tu dau (sau khoang trang) la `//`
 *     · khoi `/* … *\/` ma `/*` la ky tu dau cua dong
 *   `//` hay `/*` GIUA dong thi giu — no co the nam trong mot chuoi.
 *
 * VI SAO thay bang DONG TRONG chu khong xoa dong: giu nguyen SO DONG thi
 * DevTools con tro dung cho. Do la chinh ly do `FR-027f` tu choi minify.
 *
 * Cho con rui ro, khai ra: mot template literal nhieu dong co mot dong bat dau
 * bang `//`. Khong do duoc bang cach nhin tung dong ⇒ cong PHAI CHAY bundle da
 * cat (`new Function`), khong chi do kich thuoc — `cat-binh-luan-js.test.js §4`.
 */
export const catBinhLuanJs = (s) => {
  const ra = []
  let trongKhoi = false
  for (const dong of s.split("\n")) {
    const t = dong.trimStart()
    if (trongKhoi) {
      // Khoi ket o dong co `*/`. Con ma SAU `*/` tren cung dong thi giu lai —
      // bo ca dong la cach cat mat mot dong ma.
      const k = dong.indexOf("*/")
      if (k >= 0) {
        trongKhoi = false
        const con = dong.slice(k + 2).trim()
        ra.push(con === "" ? "" : dong.slice(k + 2))
      } else {
        ra.push("")
      }
      continue
    }
    if (t.startsWith("//")) { ra.push(""); continue }
    if (t.startsWith("/*")) {
      const k = dong.indexOf("*/", dong.indexOf("/*") + 2)
      if (k < 0) { trongKhoi = true; ra.push(""); continue }
      const con = dong.slice(k + 2).trim()
      ra.push(con === "" ? "" : dong.slice(k + 2))
      continue
    }
    ra.push(dong)
  }
  return ra.join("\n")
}

// Moi script boc IIFE rieng: ca ba khai khoiDong/gan/khiNav, noi thang
// thi trung ten => SyntaxError => KHONG dong nao chay.
const jsGoc = [
  join(WEB, "plugins", "backdrop", "src", "backdrop.inline.js"),
  // FR-027e · chuyen dong Trang chu (hai vong tu chuyen + khoi 3D + dem so).
  // Dat SAU backdrop vi ca hai dung `addCleanup` cua multiwindow, va truoc
  // multiwindow thi ham do chua ton tai.
  join(WEB, "plugins", "home-motion", "src", "home-motion.inline.js"),
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.js"),
].filter((f) => existsSync(f))
  // T03-101 · cat binh luan TUNG FILE, khong cat sau khi ghep: mot khoi
  // `/* … */` mo o cuoi file nay va dong o file sau la thu khong the xay ra khi
  // cat rieng, con cat sau khi ghep thi no thanh mot trang thai co that.
  .map((f) => ["(function(){", catBinhLuanJs(readFileSync(f, "utf8")), "})();"].join("\n"))
  .join("\n")

/**
 * Dau phien ban theo NOI DUNG.
 *
 * Cache khong co dau phien ban thi thanh cache HONG: sua giao dien, restart,
 * mo trang van thay ban cu. Bam theo NOI DUNG chu khong theo thoi diem khoi
 * dong: noi dung khong doi thi dau khong doi ⇒ van cache duoc; doi mot ky tu
 * la trinh duyet tai lai.
 */
const dau = (s) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

export const vCss = dau(css)

/*
 * T03-102 · CHUNK theo màn. `gn.js` là bundle CHUNG (backdrop · home-motion ·
 * multiwindow); mã của một màn riêng đi thành file riêng và **chỉ trang đó nạp
 * nó** — `trang.mjs` phát thẻ `<script>` thứ hai đúng cho màn đó.
 *
 * Vì sao không nhét vào `gn.js`: trần `gn.js` tồn tại để giữ **đường tải ĐẦU**
 * nhẹ, và mã của một màn người chưa mở không thuộc đường tải đầu của họ. Đo
 * được: `gn.js` đã ở 102314/102400 (dư 86 byte) trước đợt này.
 *
 * ⚠️ Tách KHÔNG được thành cách lách thước đo. Nên `page-weight` đã đổi sang đo
 * **tổng byte tải đầu của TỪNG trang** — tách mà tổng của trang đó không giảm
 * thì cổng vẫn đỏ, và trang `/chung-cat/` phải tự chịu chunk của nó.
 *
 * Bọc IIFE riêng, cắt bình luận y như `gn.js`: chunk phải TỰ CHỨA — một chunk
 * phụ thuộc thứ tự nạp của chunk khác là một lỗi chờ xảy ra.
 */
const CHUNK = {
  chungcat: join(WEB, "plugins", "chungcat", "src", "chungcat.inline.js"),
  napvideo: join(WEB, "plugins", "napvideo", "src", "napvideo.inline.js"),
  // `cctab` KHÔNG có màn nào phát thẻ `<script>` cho nó — `multiwindow` nạp
  // lúc người bấm tab. Nó vẫn phải khai ở đây để `/gn-cctab.js` được phục vụ.
  cctab: join(WEB, "plugins", "cctab", "src", "cctab.inline.js"),
}
/** Chunk nạp THEO YÊU CẦU — không trang nào xin bằng thẻ, và đó là chủ ý. */
export const chunkTheoYeuCau = ["cctab"]
const chunkJs = Object.fromEntries(Object.entries(CHUNK)
  .filter(([, f]) => existsSync(f))
  .map(([k, f]) => [k, ["(function(){",
    catBinhLuanJs(readFileSync(f, "utf8")), "})();"].join("\n")]))

/** Mã chunk của một màn, hoặc `null` khi màn đó không có chunk. */
/** Tên MỌI chunk đã khai — cổng cần nó để thấy chunk KHAI mà không ai xin. */
export const tenChunk = () => Object.keys(CHUNK)

export const gnChunk = (ten) => chunkJs[ten] ?? null

/*
 * Dấu phiên bản của chunk nạp-theo-yêu-cầu chèn vào CHÍNH `gn.js`.
 *
 * Vì sao không đặt vào HTML: mỗi trang phải mang thêm một thuộc tính, và trần
 * HTML của trang chủ đã từng vỡ vì đúng loại byte đó. Chèn vào `gn.js` thì sửa
 * chunk là đổi luôn dấu của `gn.js` ⇒ trình duyệt tải lại cả hai, và 0 byte
 * HTML thêm.
 */
const js = [jsGoc, ...chunkTheoYeuCau.map((t) => chunkJs[t]
  ? `globalThis.__V_${t.toUpperCase()}__=${JSON.stringify(dau(chunkJs[t]))};`
  : "")].filter(Boolean).join(String.fromCharCode(10))

export const vJs = dau(js)
/** Dấu phiên bản THEO NỘI DUNG của chunk — cache hỏng thì giao diện cũ. */
export const vChunk = (ten) => (chunkJs[ten] ? dau(chunkJs[ten]) : "")

/*
 * NÉN KHOẢNG TRẮNG ở TẦNG GHÉP, không ở tầng dịch (`WO-057`).
 *
 * Bản đầu tôi bật `minifyWhitespace` trong `build-fe.mjs`, tức nén luôn các
 * file `plugins/**\/*.js`. Bảy cổng đỏ ngay, và không phải vì neo khoảng
 * trắng: bốn cổng CẮT một hàm ra khỏi bundle theo dòng rồi CHẠY nó
 * (`form-van-xuoi` · `id-video-hoa-thuong` · `sua-dung-man` · `media-cua-so`),
 * và `cat-binh-luan-js` đo *"bundle NHỎ HƠN nguồn"* để chứng minh phép cắt
 * bình luận có chạy — esbuild cắt sạch bình luận trước thì phép đo ấy so
 * 84045 với 84045.
 *
 * Những cổng đó không sai. Chúng coi mã đã dịch là VẬT ĐỌC ĐƯỢC, và đó là
 * quyền của chúng. Sai là tôi nén ở tầng chúng đang đọc.
 *
 * Nên: `gnJs()` trả bản NÉN — thứ trình duyệt tải và `page-weight` đo.
 * `gnJsNguon()` trả bản chưa nén — thứ cổng soi mã đọc. Cùng một mã, hai cách
 * trình bày, và mỗi bên đọc bản đúng với câu hỏi của mình.
 *
 * `transformSync` chạy một lần lúc nạp module (~10ms trên 100 KB). Hỏng thì
 * TRẢ BẢN CHƯA NÉN chứ không ném: một trang nặng hơn vẫn chạy được, còn một
 * server không nạp nổi `assets.mjs` thì không.
 */
let jsNen = js
try {
  const { transformSync } = await import("esbuild")
  jsNen = transformSync(js, { minifyWhitespace: true, loader: "js" }).code
} catch {
  // esbuild vắng (chạy từ bản đã đóng gói) ⇒ dùng nguyên bản.
}

export const gnCss = () => css
export const gnJs = () => jsNen
/** Bản CHƯA NÉN — cho cổng soi mã. KHÔNG phải thứ được ship. */
export const gnJsNguon = () => js

/**
 * Chi muc mo cua so — chuỗi JSON cho /static/open-index.json (mỗi bản
 * real/mock một chỉ mục riêng, sinh từ CÙNG tinhChiMuc với trang HTML).
 */
export function openIndexJson(data) {
  const chiMuc = tinhChiMuc(data.bans)
  return JSON.stringify({
    $comment: "Sinh boi SSR (web/render). Chi muc mo cua so doc — gom moi review_status, " +
      "theo TUNG BAN real/mock va khong loc theo trang thai.",
    total: chiMuc.length,
    articles: chiMuc,
  }, null, 2)
}

/**
 * Ảnh nền — port backdrop-assets (index.ts:46-85) sang dạng PHỤC VỤ THẲNG:
 * không copy file ra output nữa, chỉ dựng bảng URL → đường file gốc trong
 * public/ để server stream. Tên URL giữ Y HỆT phép đặt tên của emitter cũ
 * (`<tone>-<stt chạy suốt>.<ext>`) — index.json và file cùng sinh từ một
 * vòng lặp nên không lệch được.
 *
 * Bo sang = public/light/. Bo toi = public/dark/, khong co thi lay file o goc.
 * TRAN 4 MB de BO QUA file khong dung duoc (anh qua nang lam crossfade giat).
 */
const ANH = /\.(jpe?g|png|webp|avif)$/i
const TRAN_MB = 4

function gomAnh(thuMuc) {
  if (!existsSync(thuMuc)) return []
  return readdirSync(thuMuc)
    .filter((f) => ANH.test(f))
    .map((f) => join(thuMuc, f))
    .filter((p) => statSync(p).size <= TRAN_MB * 1024 * 1024)
    .sort()
}

/** Trả {index: chuỗi JSON cho /static/bg/index.json, file: Map(url → path)}. */
export function anhNen() {
  const pub = join(GOC, "public")
  const sang = gomAnh(join(pub, "light"))
  const toi = existsSync(join(pub, "dark")) ? gomAnh(join(pub, "dark")) : gomAnh(pub)

  const url = { light: [], dark: [] }
  const file = new Map()
  let stt = 0   // đếm chạy suốt cả hai tone — khớp `ra.length` của emitter cũ
  for (const [tone, ds] of [["light", sang], ["dark", toi]]) {
    for (const src of ds) {
      // Ten file co dau cach/ngoac => ma hoa cho URL an toan
      const ten = `${tone}-${stt}${src.slice(src.lastIndexOf("."))}`
      url[tone].push(`/static/bg/${ten}`)
      file.set(ten, src)
      stt++
    }
  }
  return { index: JSON.stringify(url, null, 2), file }
}
