/**
 * M03_web · SSR (FR-034/C1) — TẦNG TEMPLATE: dựng HTML một trang từ dữ liệu
 * hình dạng Ban. Port CƠ HỌC từ emitter web/plugins/home-pages/index.ts
 * (dungBan) — giữ nguyên logic từng dòng, chỉ bỏ type annotation + mkdir/write.
 *
 * Nam man tu shell prototype: Trang chu · Tat ca · Kho · Danh muc · Nap nguon.
 * shell.html be nguyen <body> cua app-v20.html. Render CHI do du lieu vao cac
 * MOC RONG co id — khong dung mot the nao cua shell.
 *
 * Vi sao chen theo ID: ban truoc dem the long nhau, nhung shell dung the RONG
 * (<div id="nw"></div>) nen dem sai => panel ra rong. Chen theo id la mot phep
 * thay chuoi, khong the sai.
 *
 * `renderTrang(view, data, thamSo)` trả CHUỖI HTML một trang:
 *   view ∈ trang-chu · tat-ca · tat-ca-trang-n (thamSo = số trang) · kho ·
 *          khai-niem · nap · cho-duyet
 *   data = {bans, concepts, categories, hong, mock} — từ web/render/data.mjs.
 */
import { existsSync, readFileSync, readdirSync} from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { TRANG_THAI, tinhChiMuc } from "./data.mjs"
import { vChunk, vCss, vJs } from "./assets.mjs"

const RENDER = dirname(fileURLToPath(import.meta.url))
const WEB = join(RENDER, "..")
const GOC = join(WEB, "..")

/**
 * NGUONG HIEN THI — khai mot cho, khong rai trong code.
 *
 * Do that tren ban 13 ban ghi: moi the ~2379 byte HTML. Khong gioi han thi
 * 200 ban ghi => 520KB, 500 ban ghi => 1.2MB — trang khong dung duoc, va nguoi
 * doc phai cuon qua hang tram the de tim mot bai.
 *
 * Trang chu chi hien MAU, co nut "xem tat ca" — do la thiet ke G5 (DESIGN.md §4:
 * "moi vung chi hien mau"). Man Tat ca phan trang.
 */
const NGUONG = {
  noiBat: 5,      // feat + phu — tong so ban an vao vung Noi bat
  feat: 3,        // the CHONG trong hero, tu chuyen; moi the mot dot
  phu: 2,         // the phu cot ben — feat + phu = noiBat
  moi: 5,         // danh sach ngay, doc het trong mot lan liec
  luoi: 4,        // mot hang the tren man rong
  cot3D: 3,       // khoi 3D DUNG BA COT: tu cot thu tu tro di cot sau che cot
                  // truoc trong phoi canh nghieng => khoi thanh trang tri
  moiTrang: 24,   // man Tat ca: 24 the ~57KB HTML, cuon 2-3 man hinh
  thangKho: 12,   // Dong chay kho: 12 diem vua mot nam tren duong vung
  ngayKho: 30,    // FR-041 luot 2: truc ngay lui tu bai moi nhat
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])

const hai = (n) => String(n).padStart(2, "0")

/*
 * Huy hiệu KHÔNG tự khai màu nữa — nó đọc `--c` mà thẻ cha đặt (`T03-115`).
 *
 * Trước đây một thẻ phát HAI inline cho MỘT dữ kiện (`source_type`): một ở
 * `border-top-color` của `.cd`, một ở `background` của `<b>`. Cùng một sự thật
 * viết hai lần, ở mọi thẻ, trên mọi trang — đo được 176 `style=` / 6531 byte
 * trên riêng trang chủ, và nó làm vỡ trần 60 KB.
 */
const tg = (loai) => `<i class="tg"><b>${esc(loai)}</b></i>`

/**
 * Chen vao MOC RONG co id. Mot phep thay chuoi — khong the cat sai.
 *
 * `goiY` la dong hien khi KHONG co du lieu. Khong truyen thi moc de rong, va
 * CSS `[data-mount]:empty{display:none}` an luon ca panel — dung cho nhung vung
 * khong co gi de noi. Truyen thi hien mot dong .hint.
 *
 * Vi sao lo o DAY chu khong o tung cho goi: FR-008 L1 — kho dang 0 bai nen moi
 * moc deu co the rong, va lam tay 13 lan thi chac chan sot mot cho.
 */
function chen(html, id, noiDung, goiY) {
  const than = noiDung.trim() || (goiY ? `<p class="hint">${goiY}</p>` : "")
  const re = new RegExp(`(<(\\w+)[^>]*\\bid="${id}"[^>]*>)\\s*(</\\2>)`)
  return html.replace(re, (_m, mo, _the, dong) => mo + than + dong)
}

/**
 * FR-027j · Nguoi dung: *"tat ca nhung thu goi la comment / guide thi dung co
 * show ra"* — cau van giai thich RA KHOI man, vao `title=` cua nhan "TU DONG".
 */
/** Bo the khoi mot cau truoc khi nhet vao `title=` — thuoc tinh khong hieu HTML. */
const chuTran = (s) =>
  s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()

const daiMay = (o) =>
  `<div class="mb-t-w">
     <div class="mb-l"><span class="mb-i"><i></i><i></i><i></i></span>tự động</div>
   </div>
   ${o.length ? `<div class="mb-s">${o.map(([n, v]) =>
     `<span class="mb-o"><span class="mb-n">${esc(n)}</span><span class="mb-v">${esc(v)}</span></span>`)
     .join("")}</div>` : ""}`

/**
 * FR-027f · KHOI 3D dung duoc nhieu lan.
 *
 * `data-bar` mang CHIEU CAO px chu khong phai gia tri tho: JS dung cot bang
 * cach doi ba thuoc tinh (noc translateZ · truoc height · hong width) nen no
 * can px. Chuan hoa o day de JS khong phai biet gi ve du lieu.
 *
 * DUNG BA COT. Khoi 3D chi doc duoc khi so cot it — mat so chieu cao trong
 * phoi canh nghieng, va tu cot thu tu tro di cot sau che cot truoc.
 *
 * FR-027i · `catBot` — so muc BI CAT khoi khoi 3D. Cat bot la hop le (khoi 3D
 * chi doc duoc khi it cot). NOI RA moi la bat buoc: cat im lang thi bieu do
 * doc ra nhu "da phu het".
 */
const CAO3D = 118   // px cao nhat — khop `data-bar="118"` cua ban tham khao
const khoi3D = (o, nho = false, catBot = 0) => {
  const max = Math.max(1, ...o.map(([, n]) => n))
  return `<div class="tw-w${nho ? " sm" : ""}">
     <div class="tw-i">
       <div class="tw-p">${o.map(([, n], i) => `
         <div class="tw-b" data-bar="${Math.round((n / max) * CAO3D)}"
           style="left:${24 + i * 76}px">
           <i class="tw-t" style="background:var(--b${i + 1}t)"></i>
           <i class="tw-f" style="background:var(--b${i + 1}f)"></i>
           <i class="tw-s" style="background:var(--b${i + 1}s)"></i>
         </div>`).join("")}</div>
     </div>
   </div>
   <div class="tw-l">${o.map(([ten, n]) => `<span>${n} ${esc(ten)}</span>`).join("")}${
     catBot > 0 ? `<span class="tw-x">+${catBot} loại nữa</span>` : ""}</div>`
}

/*
 * `width` ở lại inline — nó là DỮ LIỆU của từng thanh, không lặp lại được.
 * Chỉ phần MÀU đi qua `--c`, cùng một cách nói với thẻ bài (`T03-115`): màu
 * theo loại thì luôn là `--c`, một ý tưởng một cách viết. Hai cách viết cho
 * cùng một ý là hai chỗ phải nhớ sửa, và chỗ thứ hai là chỗ bị quên.
 */
const bar = (nhan, n, max, mau) =>
  `<div class="br"><span class="bl">${esc(nhan)}</span>
   <span class="bw"><i style="width:${max ? (n / max) * 100 : 0}%;--c:${mau}"></i></span>
   <span class="bn">${n}</span></div>`

/**
 * The bai. Ba `data-*` la du lieu cho filter client-side — loc bang cach
 * an/hien the, KHONG dung lai trang.
 *
 * BA CHIEU, moi chieu mot cau hoi (FR-009):
 *   data-loai  source_type  "nguon nay o dang gi?"     enum 6
 *   data-cat   category     "bai thuoc mang nao?"      enum 6, danh muc dong
 *   data-cpt   concepts     "bai day ky thuat gi?"     danh muc roi
 *
 * `data-slug` — FR-024: `data-open` là CHỈ SỐ vào chỉ mục, và chỉ mục đọc lúc
 * runtime có thể khác chỉ mục lúc render (bài mới thêm sau). FE cần một khoá
 * BỀN để sửa lại chỉ số; slug là duy nhất trong kho, url_normalized thì không.
 */
/*
 * SCR-25 · TẦNG NỀN của thẻ — BỐN lớp, rơi xuống chứ không vỡ.
 *
 *   1. hiện vật ảnh trong kho   media[].mime bắt đầu `image/`   (T12-29 nạp)
 *   2. ảnh ytimg dựng từ id     chỉ host youtube
 *   3. icon + màu               /i/<data-nguon>.svg + `mau` của bảng khai
 *   4. nền màu trơn             loại nguồn không có icon
 *
 * Lớp 1 THẮNG lớp 2 có chủ đích: khi `T12-29` về, thẻ tự nâng cấp mà FE không
 * sửa một dòng — và ảnh trong kho không hết hạn, không phụ thuộc domain ngoài.
 *
 * ⚠️ Nhận hiện vật bằng `mime.startsWith("image/")`, KHÔNG bằng `kieu_moc`:
 * `kieu_moc` là CỘT CỦA BẢNG `media` (FR-054 §9.2), còn frontmatter khai
 * `additionalProperties: false` với đúng bốn khoá — nên cờ ấy không bao giờ
 * tới được FE. Mime thì tới, và nó trả lời đúng câu ta hỏi.
 *
 * ⚠️ `WO-022` · id YouTube KHÔNG được lấy từ chuỗi đã hạ chữ thường. `nguonCua`
 * hạ cả URL để so host; mượn lại chuỗi ấy thì `dQw4w9WgXcQ` thành
 * `dqw4w9wgxcq` — VẪN khớp `^[A-Za-z0-9_-]{11}$` nên không cổng nào kêu, và
 * ảnh trỏ vào một video KHÁC. Hạ riêng phần host, giữ nguyên phần còn lại —
 * cùng hình dạng `normalize_url()` phía Python.
 */
// LƯỜI: `MEDIA_BANG` khai ở cuối file (cạnh các bảng khai khác), nên dựng map
// ở tầng module là chạm nó trong TDZ. Nhớ một lần, gọi bao nhiêu lần cũng được.
let _mauMime = null
const mauMime = () => (_mauMime ??= Object.fromEntries(
  MEDIA_BANG.loai.filter((l) => l.mau).map((l) => [l.mime, l.mau])))

function nenThe(b) {
  const pl = phanLoaiCua(b)
  // MỌI loại đều có nền — chủ dự án đảo câu 1 ngày 2026-09-08 sau khi nhìn
  // màn thật: *"tài liệu và bài viết chưa có"*. Lưới đều một nhịp thắng lý lẽ
  // "khung ảnh trống là hứa hão" của bản wireframe.

  const hv = (Array.isArray(b.media) ? b.media : b.media ? [b.media] : [])
  let anh = hv.find((m) => String(m?.mime ?? "").startsWith("image/"))?.sha256
  anh = anh ? `/api/articles/media/${esc(anh)}` : ""

  if (!anh && pl === "video") {
    const u = String(b.url_normalized ?? "")
    const h = MEDIA_BANG.video_host.find((x) => u.toLowerCase().startsWith(x.mien))
    // WO-074 · so `nhan`, KHÔNG dò chuỗi trong `nhung`. Douyin nay khai
    // `nhung: null` (embed trả 403) và `null.includes` làm CHẾT CẢ TRANG —
    // 500 ở mọi màn, vì một cột bảng khai đổi kiểu. `nhan` là thứ dòng bảng
    // dùng để tự gọi tên nó; hỏi tên rẻ hơn và không vỡ khi cột khác đổi.
    const id = h?.nhan === "youtube" ? (u.match(new RegExp(h.id_tu)) ?? [])[1] : ""
    if (id) anh = `https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg`
  }

  // MÀU — và chỉ TÀI LIỆU phải trả byte cho nó.
  //
  // Thẻ ĐÃ mang `--c: var(--c-<source_type>)`, nên video (`--c-video`) và mọi
  // loại bài viết (`--c-article`/`--c-repo`/`--c-paper`/…) có màu riêng với
  // **0 byte HTML thêm**: `.cd-n` đọc `var(--nm, var(--c))`.
  // Tài liệu là ngoại lệ THẬT: `source_type` của cả năm định dạng đều là
  // `tai-lieu`, tức `--c` nói *"tài liệu"* chứ không nói *"pdf hay docx"* —
  // nên dòng bảng khai `mau` là thứ duy nhất phân biệt được chúng.
  //
  // BYTE: `data-i` đặt lên CHÍNH `.cd-n` (dùng `::before` làm glyph) thay vì
  // một `<i>` con. Thẻ nhân với số bản ghi, luật CSS thì không: một byte ở
  // đây là N byte trên MỌI trang (shell chứa markup của mọi màn).
  const ng = nguonCua(b)
  const mau = pl !== "tai-lieu"
    ? ""                                  // `--c` của thẻ đã đủ
    : ` style="--nm:var(${mauMime()[(Array.isArray(b.media) ? b.media[0] : b.media)?.mime] ?? "--ink-3"})"`
  return anh
    ? `<span class="cd-n"><img src="${anh}" alt="" loading="lazy" onerror="this.remove()"></span>`
    : `<span class="cd-n"${ICON_CO.has(ng) ? ` data-i="${esc(ng)}"` : ""}${mau}></span>`
}

/*
 * `coNen` — vùng lưới TRANG CHỦ tắt tầng nền (chủ dự án chốt 2026-09-08 câu 4).
 * Không phải vì nó không hợp: `page-weight` đo 2026-09-08 là 61 708 / 61 440,
 * tức trang chủ ĐANG ĐỎ TRƯỚC đơn vị này (chủ: sửa chưa commit của phiên khác,
 * `FR-011`). Thêm ~70 byte/thẻ vào đúng trang đang đỏ là gánh nợ của người khác.
 * Bật lại = đổi `false` thành `true` ở MỘT chỗ gọi.
 */
const the = (b, i, coNen = true) =>
  `<button type="button" class="cd st-${esc(b.review_status)}"
     ${i >= 0 ? `data-open="${i}"` : ""} data-slug="${esc(b.slug)}"
     data-loai="${esc(b.source_type)}"
     data-pl="${esc(phanLoaiCua(b))}" data-nguon="${esc(nguonCua(b))}"
     data-cat="${esc(b.category.join(" "))}"
     data-cpt="${esc(b.concepts.join(" "))}"
     data-ngay="${esc(b.analyzed_at)}" data-pri="${b.priority || 0}"
     style="--c:var(--c-${esc(b.source_type)},var(--ink-2))">
     ${coNen ? nenThe(b) : ""}${tg(b.source_type)}
     <h4>${esc(b.title)}</h4>
     <div class="mt"><span class="pr">${b.priority || "—"}</span>
       ${esc(b.credibility_max)}
       ${b.review_status !== "approved" ? `· ${esc(b.review_status)}` : ""}
       ${b.origin === "external" ? '<span class="ex">ngoài</span>' : ""}</div>
     ${b.category.length
       ? `<div class="cts">${b.category.map((c) => `<span class="ctx">${esc(c)}</span>`).join("")}</div>`
       : ""}
   </button>`

const dong = (b, i) =>
  `<a ${i >= 0 ? `data-open="${i}"` : ""} data-slug="${esc(b.slug)}"><time>${esc(b.analyzed_at)}</time>
   <div><h4>${esc(b.title)}</h4><p>${esc(b.one_liner)}</p></div>
   ${tg(b.source_type)}</a>`

/**
 * Nguong M07 tu 07_curate/thresholds.yaml — KHONG go lai so.
 *
 * M07-R2: "sua MOT cho, khong rai trong ma". Nhan "dat nguong goi y gop" o man
 * Khai niem tung hardcode `n >= 2`, trong khi curate.py doc tu file. Chinh file
 * ma web van bao theo so cu la lech im lang.
 */
function docNguong(khoa, macDinh) {
  const f = join(GOC, "07_curate", "thresholds.yaml")
  if (!existsSync(f)) return macDinh
  const m = readFileSync(f, "utf8").match(new RegExp(`^${khoa}:\\s*(\\d+)`, "m"))
  return m ? Number(m[1]) : macDinh
}

/**
 * Dem mot truong MANG tren nhieu ban ghi: gia tri -> so bai dung no.
 * Sap giam dan roi theo ten — thu tu on dinh giua hai lan render.
 */
function demMang(ds, f) {
  const d = {}
  for (const b of ds) for (const v of f(b)) d[v] = (d[v] ?? 0) + 1
  return Object.entries(d).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/**
 * Sidebar filter man Tat ca — BA tang, moi tang mot cau hoi (FR-009).
 *
 *   chu de     category     "bai thuoc mang nao?"
 *   loai nguon source_type  "nguon o dang gi?"
 *   khai niem  concepts     "bai day ky thuat gi?"
 *
 * Thu tu THO -> MIN: chu de chia kho thanh 6 manh lon, khai niem chia min nhat.
 * Nguoi loc thuong di tu tho den min, khong nguoc lai.
 */
function bangLoc(tatCa, nhanCua = {}, module = null) {
  // `data-gt` GIU id — JS loc so voi data-cat/data-cpt tren the, doi no la vo
  // bo loc. Chi doi CHU HIEN THI: "Agent va LLM" de doc hon "agent-llm", con id
  // van xem duoc o tooltip. Khong co nhan thi giu id (fail mem).
  const nhom = (nhan, khoa, cap) =>
    !cap.length ? "" : `<div class="fl-g">
      <div class="fl-l">${esc(nhan)}</div>
      ${cap.map(([k, n]) => `<button type="button" class="fl-b"
        data-loc="${esc(khoa)}" data-gt="${esc(k)}" aria-pressed="false"${khoa === "nguon" && ICON_CO.has(k) ? ` data-i="${esc(k)}"` : ""}
        title="${esc(k)}">
        <span>${esc(nhanCua[k] || k)}</span><b>${n}</b></button>`).join("")}
    </div>`

  // Dem tren CUNG MOT TAP voi luoi (tatCa, ke ca draft/rejected).
  // Man Tat ca la man QUAN LY: no hien moi trang thai, nen bo loc cung vay.
  return `<button type="button" class="fl-b fl-all" data-loc="reset" aria-pressed="true">
      <span>tất cả</span><b>${tatCa.length}</b></button>
    ${module
      /*
       * WO-016 · man TRON co CA HAI chieu; man loai chi co `nguon`.
       *
       * Ban truoc la `if/else` nen man tron nhan `pl`, man loai nhan `nguon`, va
       * KHONG man nao nhan ca hai. Nguoi dung doi `/tat-ca/` hien du BON chieu.
       *
       * Van khong dat `pl` o man loai: o do no la dung MOT dong, va do chinh la
       * cai WO-014 vua go bo.
       */
      ? ""
      : nhom("phân loại", "pl", demMang(tatCa, (b) => [phanLoaiCua(b)].filter(Boolean)))}
    ${nhom("loại nguồn", "nguon", demMang(tatCa, (b) => [nguonCua(b)].filter(Boolean)))}
    ${nhom("chủ đề", "cat", demMang(tatCa, (b) => b.category))}
    ${nhom("khái niệm", "cpt", demMang(tatCa, (b) => b.concepts))}`
}

/** Nut chuyen mock/real. */
const nutMode = (laMock) =>
  `<a href="/" aria-current="${!laMock}" title="dữ liệu thật trong kho">real</a>` +
  `<a href="/mock/" aria-current="${laMock}" title="bản ghi mẫu từ kho mẫu">mock</a>`

/**
 * Cat THUT DAU DONG luc phat — thut de doc MA NGUON shell.html, con trinh
 * duyet khong doc no. CHI cat thut (khoang trang NGAY SAU `\n`), KHONG gop
 * khoang trang giua the: `<b>a</b> <b>b</b>` mat dau cach la hai chu dinh nhau.
 * BAO VE <pre> va <textarea> — trong do khoang trang LA NOI DUNG.
 */
const catThut = (h) => {
  const phan = h.split(/(<(?:pre|textarea)\b[\s\S]*?<\/(?:pre|textarea)>)/g)
  return phan.map((x, i) => (i % 2 ? x : x.replace(/\n[ \t]+/g, "\n"))).join("")
}

/**
 * Man Nap nguon CHI di theo trang /nap/, khong di theo moi trang.
 *
 * Do that: khoi v-nap la 12.5KB tren 21.9KB cua shell — 57%, ma phan lon
 * la form viet bai chi dung duoc khi API local dang chay.
 *
 * FR-027h · cat DUNG khoi `v-nap` bang cach dem do sau `<div>` — khong cat toi
 * `</main>` (cach cu nuot luon `</div>` dong `.mid`).
 */
const catMotMan = (html, idShell) => {
  /*
   * Tim theo ID, KHONG theo chuoi nguyen van cua the mo (`WO-058`).
   *
   * Ban truoc so `<div class="view" id="v-X">` dung tung ky tu, nen mot the
   * mang them thuoc tinh la truot IM LANG: `v-chungcat` viet
   * `<div class="view" id="v-chungcat" data-mount>` ⇒ khong khop ⇒ khung RONG
   * di theo MOI trang ⇒ `doiView()` hien tai cho thay vi dieu huong, ma chunk
   * chua nap ⇒ MAN TRANG cho toi khi F5. Do la bug chu du an bat duoc.
   *
   * Phep cat phai neo vao CAU TRUC (`id`), khong vao cach viet the — them mot
   * thuoc tinh la chuyen binh thuong, con mat mot man thi khong.
   */
  // `\\b` chu KHONG `\b`: trong template literal `\b` la ky tu BACKSPACE
  // (U+0008), khong phai ranh gioi tu. Nhin bang mat hai dong giong het nhau.
  const reMo = new RegExp(`<div\\b[^>]*\\bid="v-${idShell}"[^>]*>`)
  const mMo = reMo.exec(html)
  if (!mMo) return html
  const dau = mMo.index
  let sau = 0
  const re = /<(\/?)div\b[^>]*>/g
  re.lastIndex = dau
  for (let m = re.exec(html); m; m = re.exec(html)) {
    sau += m[1] ? -1 : 1
    if (sau === 0) return html.slice(0, dau) + html.slice(m.index + m[0].length)
  }
  return html   // khong tim duoc the dong ⇒ tra nguyen, tha nang hon tha vo
}

/*
 * Cat MOI man khai `cat_khi_khac`, TRU man dang render (FR-038/C6a).
 *
 * Truoc C6a chi co MOT man nap chung nen ham nay go cung `v-nap`. Gio co hai (va
 * se co ba): giu ban go cung thi `/bai-viet/nap/` mang ca man nap tai lieu, va
 * `/tai-lieu/nap/` mang ca form viet bai 9 KB — moi trang cong them dung thu no
 * vua duoc tach ra khoi.
 *
 * `dangMo` la `id_shell`, KHONG phai ten view: hai thu do khac nhau (slug
 * `khai-niem` ≠ id `concepts`), va cat nham la cat mat chinh noi dung trang.
 */
const catNap = (html, dangMo = null) => {
  let ra = html
  for (const m of BANG_MAN) {
    if (!m.cat_khi_khac || m.id_shell === dangMo) continue
    ra = catMotMan(ra, m.id_shell)
  }
  return ra
}


/**
 * FR-027g · `/cho-duyet/` — TRANG CHUYEN HUONG, khong phai mot man.
 * Man Cho duyet da gop vao Kho. Duong cu van song de bookmark khong gay.
 * CA `meta refresh` LAN mot link that: refresh co the bi chan. Duong TUONG DOI
 * (`../kho/`) nen dung cho ca hai ban real/mock.
 */
const TRANG_CHO_DUYET = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=../kho/">
<link rel="canonical" href="../kho/">
<title>Đường này đã chuyển vào Kho · Grown news</title>
</head><body>
<p>Không còn bước duyệt — bài bạn tạo lên site ngay.
Mọi thống kê về kho nằm ở <a href="../kho/">Kho</a>.</p>
</body></html>
`

/**
 * Dựng shell ĐÃ ĐỔ ĐỦ dữ liệu + các helper phụ thuộc dữ liệu. Port thân
 * `dungBan` của emitter — mọi phép chen giữ nguyên thứ tự và nội dung.
 */
function dungShell(data) {
  const laMock = !!data.mock
  const tatCa = data.bans ?? []
  const hong = data.hong ?? []
  const appr = tatCa.filter((b) => b.review_status === "approved")
    .sort((a, b) => b.priority - a.priority)
  const rej = tatCa.filter((b) => b.review_status === "rejected")

  /*
   * FR-033 · `chuaLen` — khong con hang doi, nhung con so VAN THAT: gate.py giu
   * `draft` cho hang NHAP TU NGOAI, va `edited` con o du lieu cu. Nhung bai do
   * co that va chua len site — bo dem chung la giau mot phan cua kho.
   */
  const chuaLen = tatCa.filter((b) =>
    b.review_status === "draft" || b.review_status === "edited")

  /*
   * ═══ M09-R4 · HAI NỀN, và mỗi pane phải khai nền của nó ═══════════════════
   *
   * Người dùng chốt *"dashboard tổng hợp All"*. **Số đếm** đúng là phải tổng
   * hợp — tổng bản ghi, lưới thẻ, bộ lọc, bốn trạng thái, theo tháng, theo
   * nguồn, theo loại. Chúng trả lời *"kho tôi có gì"*.
   *
   * **Thước đo CHẤT LƯỢNG thì không.** `priority` sinh từ `fm.skill_candidates`
   * (`data.mjs`) nên một bản ghi thư viện luôn **0**; `credibility_max` mô tả
   * một BẢN PHÂN TÍCH chứ không mô tả một file PDF. 50 PDF sẽ đẩy histogram ưu
   * tiên về ~100% "thấp" và làm phẳng thang tin cậy — dashboard TỆ HƠN TRƯỚC
   * trong khi mọi con số vẫn "đúng".
   *
   * Suy từ *"tổng hợp số đếm"* ra *"trộn cả thước đo chất lượng"* là suy quá
   * tay. Nên pane chất lượng (`mball` — FR-041 lượt 2 bỏ `kf-uutien`/`bars3`) đứng trên
   * `phanTich`, và mỗi pane NÓI RA nền của nó — quy ước đã có ở
   * *"Cơ sở đếm: CẢ KHO, khai ở nhãn từng pane"* bên dưới.
   */
  const phanTich = tatCa.filter((b) => (b.ho_so ?? "phan-tich") === "phan-tich")
  const apprPT = phanTich.filter((b) => b.review_status === "approved")
  // Chỉ nói ra khi kho THẬT SỰ có bản thư viện: một dòng "nền: bản phân tích"
  // trên một kho toàn phân tích là một chú thích không giải thích gì.
  const coThuVien = phanTich.length !== tatCa.length
  const nenPT = coThuVien
    ? `<div class="kf-n">nền: ${phanTich.length} bản phân tích · `
      + `${tatCa.length - phanTich.length} bản thư viện không vào thước đo này</div>`
    : ""

  const demTheo = (f, ds = appr) => {
    const d = {}
    for (const b of ds) { const k = f(b); if (k) d[k] = (d[k] ?? 0) + 1 }
    return d
  }
  const theoLoai = demTheo((b) => b.source_type)
  // M09-R4 · nền `apprPT`: độ tin cậy là thước đo CHẤT LƯỢNG.
  const theoTin = demTheo((b) => b.credibility_max, apprPT)
  const maxLoai = Math.max(1, ...Object.values(theoLoai))
  const maxTin = Math.max(1, ...Object.values(theoTin))

  // CHI MUC MO CUA SO — gop theo url_normalized, gom MOI trang thai.
  // (tinhChiMuc ở data.mjs — dùng chung với open-index.json để không lệch số.)
  const chiMuc = tinhChiMuc(tatCa)
  const viTri = new Map()
  chiMuc.forEach((g, i) => { for (const b of g.bans) viTri.set(b.slug, i) })
  const iCua = (b) => viTri.get(b.slug) ?? -1

  // Comment trong shell.html viet cho NGUOI SUA FILE, khong cho trinh duyet.
  // `\r\n` -> `\n`: shell.html luu CRLF, va shell lap lai o MOI trang.
  // CHI bo `\r`, KHONG gop khoang trang: shell co 2 the <pre>/<textarea>,
  // trong do khoang trang la NOI DUNG.
  // C6 · shell.html di ve NHA cua render — plugins/home-pages chet cung Quartz.
  let shell = readFileSync(join(WEB, "render", "shell.html"), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")

  // ── VUNG 1 · noi bat ──────────────────────────────────────────────────
  // FR-027e · VUNG NOI BAT: 3 the [data-feat] XEP CHONG, doi bang opacity —
  // mot bai duoc 700px thi tit doc o 44px; ba bai canh nhau moi bai 233px.
  // Ba ô số liệu — lấy từ dữ liệu THẬT của bài, không bịa.
  const soLieu = (b) => [
    ["ưu tiên", String(b.priority || "—")],
    ["khái niệm", String(b.concepts.length || "—")],
    ["tin cậy", esc(b.credibility_max || "—")],
  ].map(([nhan, gt]) => `<div class="hs-o"><div class="hs-n">${nhan}</div>
        <div class="hs-v">${gt}</div></div>`).join("")
  const feat = appr.slice(0, NGUONG.feat)
  const phu = appr.slice(NGUONG.feat, NGUONG.noiBat)
  shell = chen(shell, "brk", appr.length ? `
    <div id="hero">
      <div class="hero-r" data-rot>${feat.map((b, j) => `
        <article class="feat" data-feat="${j}" ${j ? 'style="opacity:0"' : ""}>
          <i class="feat-b"></i>
          <div class="feat-m">${tg(b.source_type)}
            <span class="c">${esc(b.credibility_max)}</span>
            <span class="pr">ưu tiên ${b.priority}</span></div>
          <h3><button type="button" class="feat-t" data-open="${iCua(b)}"
            >${esc(b.title)}</button></h3>
          <p class="feat-d">${esc(b.one_liner)}</p>
          <div class="hs">${soLieu(b)}</div>
        </article>`).join("")}</div>
      ${feat.length > 1 ? `<div class="rot-c">${feat.map((_, j) =>
        `<button type="button" class="dot-b" data-dot="${j}"
          aria-label="tin ${j + 1}"><i data-dotfill="${j}"
          style="width:${j ? 0 : 100}%"></i></button>`).join("")}
        <span class="rot-l" data-rotlabel>01 / 0${feat.length} · tự chuyển</span>
      </div>` : ""}
    </div>
    <div class="brk-p">${phu.map((b) => `
      <article class="pcard">
        <div class="feat-m">${tg(b.source_type)}
          <span class="c">${esc(b.credibility_max)}</span>
          <span class="pr">${b.priority}</span></div>
        <h4><button type="button" class="feat-t" data-open="${iCua(b)}"
          >${esc(b.title)}</button></h4>
        <p class="feat-d">${esc(b.one_liner)}</p>
      </article>`).join("")}</div>` : "",
    // SCR-02 §"Ba state · empty": dem draft la thong tin HANH DONG DUOC.
    chuaLen.length
      ? `Kho có <b>${chuaLen.length}</b> bản chưa lên site.`
      : "Chưa có bài nào. Vào màn Nạp nguồn để thêm bài đầu tiên.")

  // ── VUNG 2 · moi phan tich ────────────────────────────────────────────
  const moi = [...appr].sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at))
  shell = chen(shell, "nw", moi.slice(0, NGUONG.moi).map((b) => dong(b, iCua(b))).join(""),
    "Chưa có bản nào được duyệt.")

  // ── VUNG 3 · KPI trang chu (thu gon — chi tiet o /kho/) ──────────────
  const oNho = (nhan, n, lop) =>
    `<div class="kp ${n ? lop : "trong"}"><div class="l">${nhan}</div>
      <div class="v">${hai(n)}</div></div>`
  // FR-027e · BON o, xep 2x2 — mot o le dong duoi doc ra nhu thieu du lieu.
  shell = chen(shell, "kpi", [
    oNho("trên site", appr.length, "ok"),
    oNho("chưa lên site", chuaLen.length, "warn"),
    oNho("đã loại", rej.length, "bad"),
    oNho("tổng bản ghi", tatCa.length, "tong"),
  ].join(""))

  // FR-027e · BA PANE XEP CHONG, doi 5s (ui_guide §5) — ba goc nhin,
  // KHONG them mot phep dem nao moi.
  const tr3 = [
    ["trên site", appr.length, 1],
    ["chưa lên", chuaLen.length, 2],
    ["loại", rej.length, 3],
  ]
  shell = chen(shell, "bars", tatCa.length ? `
    <div class="pn-w">
      <div class="pane" data-pane="0">${khoi3D(tr3.map(([ten, n]) => [ten, n]))}</div>
      <div class="pane" data-pane="1" style="opacity:0">${Object.entries(theoLoai)
        .map(([k, n]) => bar(k, n, maxLoai, `var(--c-${k},var(--ink-2))`)).join("")}</div>
      <div class="pane" data-pane="2" style="opacity:0">${Object.entries(theoTin)
        .map(([k, n]) => bar(k, n, maxTin, "var(--ink-3)")).join("")}</div>
    </div>
    <div class="pn-t">
      ${["trạng thái", "loại nguồn", "tin cậy"].map((t, i) =>
        `<button type="button" class="tab-b" data-tab="${i}"
          ${i ? "" : 'aria-pressed="true"'}>${t}</button>`).join("")}
      <span class="pn-l">đổi mỗi 5 giây</span>
    </div>` : "", "Chưa đủ dữ liệu để vẽ.")

  // ── VUNG 4 · kho gan day ─────────────────────────────────────────────
  // slice: ba bai dau da o vung noi bat. Duoi 4 bai thi vung nay rong,
  // va CSS an ca panel — dung, vi no khong noi them gi.
  shell = chen(shell, "grid", appr.length > 3
    ? appr.slice(NGUONG.noiBat, NGUONG.noiBat + NGUONG.luoi)
        .map((b) => the(b, iCua(b), false)).join("")
    : `<p class="empty">${appr.length
        ? `Chưa đủ bài để xếp lưới — cần trên ${NGUONG.noiBat} bản đã duyệt.`
        : "Kho trống. Xem bản mẫu ở <a href=\"/mock/\">/mock/</a>."}</p>`)

  // ── MAN TAT CA ───────────────────────────────────────────────────────
  shell = chen(shell, "grid2", tatCa.length
    ? tatCa.map((b) => the(b, iCua(b))).join("")
    : '<p class="empty">Kho trống. Xem bản mẫu ở <a href="/mock/">/mock/</a>.</p>')

  // Hai danh muc dung cho CA sidebar loc VA man Danh muc — tới từ data.mjs
  // (bản real: bảng concepts/categories trong DB; bản mock: yaml của kb-mock/).
  const danhMuc = data.concepts ?? []
  const chuDe = data.categories ?? []
  const nhanCua = {}
  for (const c of [...danhMuc, ...chuDe]) if (c.label) nhanCua[c.id] = c.label

  shell = chen(shell, "filter", bangLoc(tatCa, nhanCua))
  shell = chen(shell, "acount", tatCa.length ? `${tatCa.length} bản` : "")

  /*
   * ── BA MAN LOAI (FR-038/C5) ──────────────────────────────────────────
   *
   * Cung mot vong lap cho ca ba: khac nhau o dung mot thu — tap `source_type`
   * cua nhom, va tap do doc tu `loai-nguon.json`. Viet ba khoi giong nhau la ba
   * cho de lech, va lech o day nghia la mot loai bien mat khoi man cua no ma
   * khong cong nao thay: `bay-man.test.js` §5 canh dung viec do.
   *
   * `iCua(b)` giu nguyen chi muc cua CA KHO, khong danh lai theo tung man:
   * `data-open` la chi so vao mang `BAI` toan cuc ma cua so doc dung. Danh lai
   * theo man thi bam mot the o man Video mo nham bai — dung lop loi "phan trang
   * danh lai chi so" da tung trung.
   */
  for (const m of MAN_LOAI) {
    const cua = LOAI_CUA_NHOM[m.module] ?? []
    const ds = tatCa.filter((b) => cua.includes(b.source_type))
    /*
     * CẮT ở `NGUONG.moiTrang` — CÙNG hằng số màn Tổng hợp dùng, không gõ số mới.
     *
     * Vì sao bắt buộc: shell mang CẢ mọi màn trong MỌI trang, nên ba màn loại
     * không cắt là ba lần cả kho nhân vào từng trang. Đo được lúc chưa cắt: kho
     * 120 bản ⇒ trang Tổng hợp mang 144 thẻ thay vì 24, và `page-weight` bắt
     * đúng lúc.
     *
     * NÓI RA phần bị cắt, không im lặng: một danh sách cắt âm thầm đọc ra như
     * "kho chỉ có bấy nhiêu". Trang sau nằm ở màn Tổng hợp (đã phân trang) —
     * phân trang riêng cho ba màn loại là việc của C6/C7, và tới đó thì dòng
     * này là chỗ gắn nút.
     */
    const lat = ds.slice(0, NGUONG.moiTrang)
    const con = ds.length - lat.length
    /*
     * WO-012 · TRẠNG THÁI RỖNG ra khỏi lưới. Trước đó nó là con của `.grid` nên
     * nó ăn một cột 240px và câu "Chưa có tài liệu nào trong kho." xuống dòng
     * giữa, lệch trái — người dùng nhìn thấy trước tôi.
     */
    shell = chen(shell, `g-${m.id_shell}`,
      lat.map((b) => the(b, iCua(b))).join(""))
    shell = chen(shell, `rong-${m.id_shell}`, ds.length
      ? (con > 0 ? `Còn ${con} bản nữa — xem ở màn Tổng hợp.` : "")
      : `Chưa có ${m.nhan.toLowerCase()} nào trong kho.`)
    shell = chen(shell, `c-${m.id_shell}`, ds.length ? `${ds.length} bản` : "")

    /*
     * WO-012 · SIDEBAR LỌC + DẢI, y khuôn màn Tổng hợp. `bangLoc()` và
     * `daiMay()` đã là hàm dùng chung — gọi lại với tập ĐÃ LỌC, không viết
     * bản thứ hai.
     *
     * Dải nói số CỦA LOẠI NÀY. Ba màn cùng khuôn nhưng ba tập số khác nhau; ba
     * dải cùng một con số nghĩa là chúng đang in số cả kho, và `ui-ba-man` §2
     * đòi chúng khác nhau đúng vì thế.
     */
    shell = chen(shell, `fl-${m.id_shell}`, bangLoc(ds, nhanCua, m.module))
    const apprL = ds.filter((b) => b.review_status === "approved").length
    shell = chen(shell, `mb-${m.id_shell}`, ds.length
      ? daiMay([[`loại nguồn`, new Set(ds.map((b) => b.source_type)).size],
                ["đã duyệt", apprL], ["còn nháp", ds.length - apprL]])
      : "")
  }

  /**
   * FR-027f · MAN TAT CA — dai "may da lam gi" + khoi 3D phan bo uu tien.
   * Ba khoang lay tu M06: 65 la nguong "cao" trong cong thuc priority, 45 la
   * nguong duoi. Hai so nay KHONG nam trong danh muc — chung o cong thuc M06 —
   * nen khai o day va ghi ro nguon, khong gia vo la du lieu.
   */
  const NG_PRI = { cao: 65, vua: 45 }
  // M09-R4 · nền `phanTich` — xem khối HAI NỀN ở đầu hàm.
  const pCao = phanTich.filter((b) => (b.priority || 0) >= NG_PRI.cao).length
  const pVua = phanTich.filter((b) => {
    const v = b.priority || 0
    return v >= NG_PRI.vua && v < NG_PRI.cao
  }).length
  const pThap = phanTich.length - pCao - pVua
  shell = chen(shell, "mball", phanTich.length
    ? `<div class="mb-3d">${khoi3D([["cao", pCao], ["vừa", pVua], ["thấp", pThap]], true)}</div>`
      + daiMay([["≥ 65", pCao], ["45–64", pVua], ["< 45", pThap]]) + nenPT
    : "")

  // ── MAN KHAI NIEM ────────────────────────────────────────────────────
  // Danh muc kiem soat x so bai APPROVED dung moi muc. Vi sao `appr` o day ma
  // `tatCa` o sidebar loc: man Khai niem tra loi "danh muc nay duoc dung tot
  // chua" — chi bai da duyet moi tinh.
  const demCpt = Object.fromEntries(demMang(appr, (b) => b.concepts))
  const daDung = danhMuc.filter((c) => (demCpt[c.id] ?? 0) > 0)
  const chuaDung = danhMuc.filter((c) => !(demCpt[c.id] ?? 0))

  // Nhan concept la NUT LOC, khong phai hinh trang tri.
  // FR-030 · HANG, khong phai BAR — thu mang thong tin la TEN va SO.
  // FR-031 · HÀNG LÀ `<div>`, PHẦN LỌC LÀ `<button>` BÊN TRONG: `<button>`
  // không được lồng `<button>`, nên nhãn ĐANG DÙNG mới có chỗ đặt nút sửa/xoá.
  shell = chen(shell, "cb", daDung
    .slice()
    .sort((a, b) => (demCpt[b.id] ?? 0) - (demCpt[a.id] ?? 0))
    .map((c) => `<div class="rc-r r-cpt r-dung"><button type="button"
       class="rc-loc" data-loc="cpt" data-gt="${esc(c.id)}" aria-pressed="false"
       title="lọc bài mang nhãn này"><time>${demCpt[c.id] ?? 0} bài</time>
       <span><b>${esc(c.label || c.id)}</b> <code>${esc(c.id)}</code></span>
       </button><span class="rc-act"><button type="button"
       class="bt ghost sm api-only" data-suanhan="cpt:${esc(c.id)}"
       data-nhan="${esc(c.label || "")}" data-gom="">sửa</button><button
       type="button" class="bt dstr sm api-only" data-xoanhan="cpt:${esc(c.id)}"
       data-dung="${demCpt[c.id] ?? 0}">xoá</button></span></div>`).join(""),
    // BA trạng thái, ba câu: "chưa dùng" · danh mục RỖNG là trạng thái hợp lệ.
    danhMuc.length
      ? `Danh mục có <b>${danhMuc.length}</b> khái niệm, chưa bài nào dùng tới.`
      : "Danh mục khái niệm đang trống — thêm mục đầu tiên bằng nút bên trên.")

  shell = chen(shell, "ccount", danhMuc.length
    ? `${daDung.length}/${danhMuc.length} đang dùng` : "")

  // Muc chua co bai dung — HANG `.rc-r`, khong con la chip: chip khong co cho
  // dat nut. NUT chi hien khi API chay, va `.api-only` dat tren NUT chu khong
  // tren hang: `body.api-co .api-only` la display:block, dat len mot .rc-r
  // (flex) se vo bo cuc hang.
  const hangNhan = (c, n, loai) =>
    `<div class="rc-r r-${loai}${n ? " r-dung" : ""}"><time>${n ? `${n} bài` : "0 bài"}</time>` +
    `<span><b>${esc(c.label || c.id)}</b> <code>${esc(c.id)}</code>${
      c.gom ? ` · ${esc(c.gom)}` : ""}</span>` +
    // HAI nut trong MOT o grid — `.rc-act` la o thu tu.
    `<span class="rc-act">` +
    `<button type="button" class="bt ghost sm api-only" data-suanhan="${
      esc(loai)}:${esc(c.id)}" data-nhan="${esc(c.label || "")}" data-gom="${
      esc(c.gom || "")}">sửa</button>` +
    // FR-031 · nut XOA co o MOI hang, ke ca nhan dang duoc bai dung.
    // `data-dung` mang so bai sang cho hop xac nhan. SERVER VAN TU DEM LAI:
    // con so nay chi de HOI cho dung — client gui `dung=0` sai thi server van 409.
    `<button type="button" class="bt dstr sm api-only" data-xoanhan="${
      esc(loai)}:${esc(c.id)}" data-dung="${n}">xoá</button>` +
    "</span></div>"

  shell = chen(shell, "cchua", chuaDung
    .map((c) => hangNhan(c, 0, "cpt")).join(""),
    danhMuc.length ? "Mọi khái niệm đều đã có bài dùng tới." : "")

  // ── MAN DANH MUC · CHU DE ────────────────────────────────────────────
  const demCat = Object.fromEntries(demMang(appr, (b) => b.category))
  shell = chen(shell, "catlist", chuDe
    .map((c) => hangNhan(c, demCat[c.id] ?? 0, "cat")).join(""),
    "Danh mục chủ đề đang trống — thêm mục đầu tiên bằng nút bên trên.")
  shell = chen(shell, "catcount", chuDe.length ? `${chuDe.length} mảng` : "")

  /*
   * ── MAN DANH MUC · LOAI NGUON (WO-016) ────────────────────────────────
   *
   * CHI DOC, va do la lua chon co ly do: danh sach loai nguon sinh ra chinh cac
   * rang buoc `CHECK` cua DDL (`loai-nguon.json` -> `kho.schema.sql`). Mot nut
   * "them loai nguon" o day la loi hua ma `INSERT` se tu choi, va loi tu choi do
   * khong ai doc duoc. M02-R3 noi ve NHAN do nguoi tao; loai nguon la enum cua
   * schema, khong phai nhan.
   *
   * So dem lay tu CUNG `demMang` voi facet — hai noi dem mot su that thi co ngay
   * chung lech, va cai lech do im lang.
   */
  // TEN PHAI PHAN BIET: `demNguon` o pane "theo nguon goc" dem `origin`
  // (may dung / ban viet / nguon ngoai) — mot nghia KHAC cua chu "nguon". Hai
  // khai niem cung ten trong mot file la dung su nham lan nguoi dung vua chi ra,
  // o tang bien so.
  const demLoaiNguon = Object.fromEntries(demMang(appr, (b) => [b.source_type]))
  /*
   * ── QUAN LY LOAI NGUON, nhom theo PHAN LOAI (WO-019) ──────────────
   *
   * Nguoi dung: *"thu chung ta can la danh sach loai nguon, chu ko phai phan
   * loai: loai nguon la tap hop con cua phan loai, va ta can quan ly danh sach
   * LOAI NGUON do -> LOAI NGUON nao ung voi PHAN LOAI nao"*.
   *
   * Noi dung truoc do SAI: no liet ke `m.loai` cua `loai-nguon.json`, tuc ten
   * BANG (`tai-lieu`, `video`). Voi bai viet thi `source_type` CHINH LA loai
   * nguon nen no dung tinh co; hai module kia thi khong.
   *
   * Dung lai `nguonCua()` — MOT phep suy da co tu WO-014, dang chay cho moi
   * thanh facet. Dung phep suy thu hai o day la hai cho de lech, va cai lech
   * do im lang.
   */
  /*
   * NGUON CUA DANH SACH: bang trong DB (`data.loai_nguon`).
   *
   * Nguoi dung: *"luu cac du lieu cua muc phan loai nay vao bang DB — ko duoc
   * hardcode"*. Panel doc BANG; suy tu file khai chi la duong LUI khi du lieu
   * chua co (ban mock, hoac kho chua dung DB) — khong phai duong chinh.
   *
   * Neu bo duong lui: ban mock se hien mot panel rong, va man Danh muc trong
   * nhu bi hong o moi trang tinh.
   */
  const tuDb = Array.isArray(data.loai_nguon) ? data.loai_nguon : []
  const DS_NGUON = tuDb.length
    ? Object.fromEntries(BANG_MODULE.map((m) => [m.ten, tuDb
      .filter((x) => x.module === m.ten)
      .map((x) => ({ id: x.id, nhan: x.label_vi || x.id }))]))
    : {
    "bai-viet": (LOAI_CUA_NHOM["bai-viet"] ?? []).map((l) => ({ id: l, nhan: l })),
    // `chi_dan_xuat` bị LỌC: hiện vật do máy sinh (`.vtt` của FR-054) không
    // phải thứ người nạp lên, nên một chip cho nó ở bộ lọc "loại nguồn" là chip
    // không bao giờ khớp bản ghi nào — và nó tính vào byte tải đầu của MỌI trang.
    //
    // `nhom_thu_vien: "video"` bị LỌC cùng lý do (T01-45/T03-109): mp4 · webm ·
    // m4a · mp3 · wav là định dạng của bản ghi VIDEO, nên một chip của chúng ở
    // bộ lọc "định dạng tài liệu" là chip không khớp bản ghi tài liệu nào. Đo
    // được lúc thêm năm dòng đó mà chưa lọc: trần HTML trang chủ vỡ ngay
    // (62713/61440) — sửa bằng Ý NGHĨA, không bằng nới trần.
    "tai-lieu": MEDIA_BANG.loai.filter(laTaiLieu).map((l) => ({
      id: l.duoi.replace(".", ""), nhan: l.ten,
    })).concat([{ id: MEDIA_BANG.mac_dinh.duoi.replace(".", ""),
                  nhan: MEDIA_BANG.mac_dinh.ten }]),
    video: MEDIA_BANG.video_host.map((h) => ({ id: h.nhan, nhan: h.nhan }))
      .concat([{ id: "tai-len", nhan: "tải lên" }]),
    }

  // Dem theo LOAI NGUON that, khong theo `source_type`.
  const demNg = Object.fromEntries(demMang(appr, (b) => [nguonCua(b)]))
  const demPl = Object.fromEntries(demMang(appr, (b) => [phanLoaiCua(b)]))

  /*
   * MOT khuon hang, khong hai.
   *
   * Nhanh "nhom chua dung loai nao" tung dung mot khuon THU HAI, va nut sua
   * chi vao khuon thu nhat — nen mot nhom chua dung gi thi khong sua duoc
   * dong nao. Hai khuon cho mot hang la hai cho de lech, va no lech ngay.
   */
  const hangLn = (x, n) => `<li class="ln-r${n ? "" : " ln-0"}"><span class="ln-n">${esc(x.nhan)}</span>${x.nhan === x.id ? "" : `<code>${esc(x.id)}</code>`}<b style="--ln-v:${n}">${n}</b><button type="button" class="bt ghost sm api-only ln-s2" data-suanhan="nguon:${esc(x.id)}" data-nhan="${esc(x.nhan)}" data-gom="" title="đổi chữ hiện thị">sửa</button></li>`

  shell = chen(shell, "nguonlist", BANG_MODULE.map((m) => {
    const ds = DS_NGUON[m.ten] ?? []
    const dung = ds.filter((x) => demNg[x.id])
    const cao = Math.max(1, ...ds.map((x) => demNg[x.id] ?? 0))
    /*
     * MOT THE cho mot phan loai. Quan he "loai nguon ⊂ phan loai" la quan he
     * NHOM, va nhom thi doc bang KHOI canh nhau — 14 dong xep doc bat mat lan
     * theo mot cot dai 500px trong khi nua phai man hinh trong.
     *
     * `--ln-cao` mang so cao nhat cua nhom sang CSS de ve thanh ty le. Ty le
     * TRONG nhom, khong xuyen nhom: `bai-viet` 3 ban va `video` 1 ban thi mot
     * thang do chung lam nhom nho trong nhu bi loi.
     */
    return `<section class="ln-c ln-${esc(m.ten)}"><header class="ln-h"><b>${esc(m.nhan)}</b><span class="ln-s">${demPl[m.ten] ?? 0} bản · ${dung.length}/${ds.length} loại nguồn đang dùng</span></header>`
      + (dung.length ? `<ul class="ln-l" style="--ln-cao:${cao}">${
        ds.map((x) => {
          const n = demNg[x.id] ?? 0
          /*
           * NUT SUA — nguoi dung: *"ta can QUAN LY danh sach LOAI NGUON do"*.
           *
           * Chi SUA chu hien thi. Khong them, khong xoa: danh sach den tu
           * schema va whitelist, nen them mot loai DDL khong biet la hua thu
           * `CHECK` se tu choi, va xoa mot loai con ban ghi dung la lam facet
           * mat mot nhom.
           */
          return hangLn(x, n)
        }).join("")}</ul>`
        : `<p class="ln-rong">Chưa dùng loại nào trong ${ds.length} loại của nhóm này.</p><ul class="ln-l">${ds.map((x) =>
          hangLn(x, 0)).join("")}</ul>`)
      + "</section>"
  }).join(""), "")
  const soNguon = Object.values(DS_NGUON).reduce((n, d) => n + d.length, 0)
  /*
   * ── BON MOC CUA MAN NAP (WO-018) ──────────────────────────────────
   *
   * Dong liet ke dinh dang / noi phat DAN XUAT tu bang khai. Truoc do toi go
   * tay, va no NOI DOI: dai video ke `douyin · bilibili` trong khi whitelist
   * co hai host; dai tai lieu ke `docs · bang tinh` trong khi bang co
   * `pdf pptx docx ppt doc`. Dan link douyin thi 422, ma man doc nhu no duoc
   * nhan — go tay la cach mot dong chu noi doi lan nua.
   *
   * Khoi nay tung bi mot lat cat cua chinh toi cat mat khi viet lai panel ben
   * tren; cong `mo-ta-va-nut-nap` §4 bat duoc.
   */
  shell = chen(shell, "vd-nph",
    esc(MEDIA_BANG.video_host.map((h) => h.nhan).join(" · ")), "")
  shell = chen(shell, "tv-dd",
    esc([...new Set(MEDIA_BANG.loai.filter(laTaiLieu)
      .map((l) => l.duoi.replace(".", "")))]
      .join(" · ") + " · " + String(MEDIA_BANG.mac_dinh.ten).toLowerCase()), "")
  for (const tien of ["tv", "vd", "up"]) {
    shell = chen(shell, tien + "-tran",
      String(KHUNG_BANG.tran_tu_thu_vien), "")
  }

  shell = chen(shell, "nguoncount",
    `${soNguon} loại nguồn · ${BANG_MODULE.length} phân loại`)

  // Cot phai: concepts_proposed gom tu MOI ban (ke ca draft — de xuat khong
  // cho duyet bai). Dat nguong M07 concept_merge_min ⇒ danh dau.
  const nguongGop = docNguong("concept_merge_min", 2)
  const deXuat = demMang(tatCa, (b) => b.concepts_proposed)
  // FR-019: mục ĐẠT NGƯỠNG có nút Kết nạp. Nút nằm trong .api-only.
  shell = chen(shell, "cprop", deXuat
    .map(([k, n]) => `<a><time>${n}×</time><div><h4>${esc(k)}</h4>${
      n >= nguongGop
        ? `<p>đạt ngưỡng gợi ý gộp</p><button type="button" class="bt sm api-only"
           data-ketnap="${esc(k)}" data-so="${n}">kết nạp vào danh mục</button>`
        : ""}</div></a>`).join(""),
    "Không có đề xuất nào đang chờ.")
  shell = chen(shell, "pcount", deXuat.length ? `${deXuat.length} mục` : "sạch")

  // FR-027f · MAN DANH MUC — dai noi ve DUONG ONG TU DONG co that.
  // Khoi 3D: BA khai niem duoc dung nhieu nhat — "nhan nao dang song".
  const top3Cpt = Object.entries(demCpt)
    .sort((x, y) => y[1] - x[1]).slice(0, NGUONG.cot3D)
    .map(([k, n]) => [nhanCua[k] ?? k, n])
  const datNguong = deXuat.filter(([, n]) => n >= nguongGop).length
  shell = chen(shell, "mbdm", danhMuc.length || deXuat.length
    ? (top3Cpt.length === NGUONG.cot3D ? `<div class="mb-3d">${khoi3D(top3Cpt, true)}</div>` : "")
      + daiMay([["đề xuất", deXuat.length], ["đạt ngưỡng", datNguong],
         ["đang dùng", Object.keys(demCpt).length]])
    : "")

  // Số trên NHÃN TAB — người dùng thấy có bao nhiêu mục ở tab chưa mở.
  shell = chen(shell, "dmn-cpt", danhMuc.length ? `${danhMuc.length} mục` : "")
  shell = chen(shell, "dmn-cat", chuDe.length ? `${chuDe.length} mảng` : "")
  shell = chen(shell, "dmn-cho", deXuat.length ? `${deXuat.length} chờ` : "sạch")
  // Ngưỡng trong câu giải thích cũng phải đọc từ thresholds.yaml (M07-R2).
  shell = chen(shell, "pnguong", String(nguongGop))

  // ── MAN KHO — dashboard rieng ────────────────────────────────────────
  const canThem = Math.max(0, 10 - appr.length)
  /**
   * FR-027i · BIEU DO THANH PHAN thay nam o so kho khan: bon con so dau
   * (duyet / cho / loai / tong) la BA PHAN cua MOT tong — mot thanh 100% noi
   * ngay "kho dang o dau". THUNG RAC tach RIENG, duoi mot duong ke: bai xoa
   * da ROI khoi kho nen no KHONG phai mot phan cua tong.
   */
  // FR-027j · `phu` vao `title=`, KHONG ve ra man — chu thich bi cat con hai
  // ky tu thi khong con la thong tin.
  const oKpi = (nhan, n, lop, phu) =>
    `<div class="tp-r ${n ? lop : "trong"}" title="${esc(chuTran(phu))}">
      <i class="tp-c"></i>
      <span class="l">${nhan}</span><b class="v">${hai(n)}</b></div>`

  // Ba doan cua MOT tong. Ti le tinh tren `tatCa`, khong tren tong ba doan:
  // lech nhau thi co mot trang thai khong thuoc nhom nao — luc do thanh PHAI
  // hut, khong duoc tu lam cho vua.
  const doan = [
    ["ok", appr.length], ["warn", chuaLen.length], ["bad", rej.length],
  ]
  const tong = tatCa.length
  /*
   * FR-041 · DONUT thay thanh chia đoạn. Phần-của-tổng đọc bằng GÓC, và tổng —
   * con số chính của cả màn — đứng ở tâm đúng vai chính, đếm 0→n khi vào tầm
   * nhìn (home-motion.veDonut). `pathLength="100"` để dasharray tính bằng
   * PHẦN TRĂM — không nhân chu vi ở hai nơi. Cung đặt sẵn `stroke-dashoffset`
   * (25 = đỉnh vòng); JS chỉ mở dasharray từ `0 100` → `${cung} ${100-cung}`.
   * Màu qua CLASS ok/warn/bad — cùng tên thanh cũ dùng, cùng token đã audit.
   */
  let gocDn = 0
  const cungDn = doan.filter(([, n]) => n).map(([lop, n]) => {
    const cung = ((n / tong) * 100).toFixed(1)
    const goc = (25 - (gocDn / tong) * 100).toFixed(1)
    gocDn += n
    return `<circle class="dn-c ${lop}" pathLength="100"
        data-cung="${cung}" style="stroke-dashoffset:${goc}"/>`
  }).join("")
  shell = chen(shell, "kpi2", tong ? `
    <div class="dn-w">
      <svg class="dn" viewBox="0 0 120 120" role="img"
        aria-label="${appr.length} trên site · ${chuaLen.length} chưa lên site · ${rej.length} đã loại trên ${tong} bản ghi">
        <circle class="dn-o" pathLength="100"/>
        ${cungDn}
      </svg>
      <div class="dn-t"><b class="dn-v">${hai(tong)}</b><span>bản ghi</span></div>
    </div>
    ${appr.length + chuaLen.length + rej.length !== tong
      ? `<div class="tp-t"><span class="tp-w">${tong - appr.length - chuaLen.length - rej.length} bản ở trạng thái khác</span></div>`
      : ""}
    <div class="tp-l">
      ${oKpi("trên site", appr.length, "ok", appr.length ? "lên site" : "chưa có bài nào")}
      ${oKpi("chưa lên site", chuaLen.length, "warn",
        chuaLen.length ? "cần người duyệt" : "sạch")}
      ${oKpi("đã loại", rej.length, "bad",
        rej.length ? "có lý do" : "loại là phán quyết, có ghi lý do")}
    </div>
    <div class="tp-x api-only">
      <div class="tp-r rac"
        title="đã rời khỏi kho — khôi phục được ở mục Thùng rác bên dưới">
        <i class="tp-c"></i>
        <span class="l">ngoài kho · thùng rác</span>
        <b class="v" id="kp-rac">—</b>
      </div>
    </div>` : "", "Kho trống — chưa có bản ghi nào để vẽ.")

  /**
   * FR-027f/i · MAN KHO — khoi 3D lay BA LOAI NHIEU NHAT tu chinh du lieu
   * (khong go cung ten loai — ban REAL tung ve ba cot 0). Va dem tren `tatCa`,
   * KHONG tren `theoLoai` (mac dinh `appr`): khoi nay nam BEN TRONG dai co cau
   * "dung lai tu N ban ghi" voi N = tatCa.length — hai so canh nhau phai cung goc.
   */
  const loaiTatCa = {}
  for (const b of tatCa) {
    if (b.source_type) loaiTatCa[b.source_type] = (loaiTatCa[b.source_type] ?? 0) + 1
  }
  const ba3Loai = Object.entries(loaiTatCa)
    .sort((a, b) => b[1] - a[1]).slice(0, NGUONG.cot3D)
  shell = chen(shell, "mbkho", tatCa.length
    ? `<div class="mb-3d">${khoi3D(ba3Loai, true,
         Object.keys(loaiTatCa).length - ba3Loai.length)}</div>`
      + daiMay([["bản ghi", tatCa.length], ["không đọc được", hong.length]])
    : "")

  // Dải cảnh báo file KHÔNG ĐỌC ĐƯỢC — thay cho việc bỏ qua im lặng.
  if (hong.length) {
    shell = chen(shell, "khocanh",
      `<b>${hong.length} tệp trong kho không đọc được</b> — thiếu phần khai báo
       ở đầu tệp, nên chúng không được tính vào các con số trên:
       <code>${hong.map(esc).join("</code> · <code>")}</code>.`)
  }

  // KPI man Danh muc — dung LAI oKpi cua man Kho, khong viet ban thu hai.
  // FR-030 · DANH MUC dang PHINH den dau — mot ti le, khong phai hai so roi.
  const nhanXoaDuoc = chuDe.filter((c) => !(demCat[c.id] ?? 0)).length + chuaDung.length
  const tongNhan = danhMuc.length + chuDe.length
  shell = chen(shell, "dmkpi", (tongNhan
    ? `<div class="tp-b" role="img"
        aria-label="${daDung.length} nhãn đang dùng trên ${tongNhan} nhãn trong danh mục">
        ${[["ok", daDung.length], ["", tongNhan - daDung.length]]
          .map(([lop, n]) => Number(n)
            ? `<i class="tp-s ${lop}" data-seg="${((Number(n) / tongNhan) * 100).toFixed(2)}"
                ${lop ? "" : 'style="background:var(--ink-3)"'}></i>`
            : "").join("")}
      </div>
      <div class="tp-t"><b>${hai(daDung.length)}</b> / ${tongNhan} nhãn đang được bài dùng tới</div>`
    : "") + [
    oKpi("khái niệm", danhMuc.length, "tong", `${daDung.length} đang dùng`),
    oKpi("chủ đề", chuDe.length, "tong", "danh sách đóng"),
    oKpi("chờ vào danh mục", deXuat.length, "warn",
      deXuat.length ? `đủ ${nguongGop} bài nhắc tới thì kết nạp được` : "sạch"),
    oKpi("xoá được", nhanXoaDuoc, "ok", "chưa bài nào dùng tới"),
  ].join(""))

  /*
   * FR-041 · LƯỚI Ô thay bar ngang. Ở kho nhỏ, ĐẾM Ô thật hơn so chiều dài
   * thanh — người đọc thấy từng bài là một ô, màu theo `--c-<loại>` sẵn có.
   * Quá 120 ô thì mỗi ô đại diện nhiều bài, và `data-o` + dòng chú khai thẳng
   * điều đó — không khai là bắt người đọc đoán tỉ lệ.
   */
  /*
   * BUG NGƯỜI DÙNG CHỈ (2026-08-29, ảnh): pane này từng đếm `source_type` —
   * với thư viện đó là TÊN BẢNG (`tai-lieu`, `video`), không phải loại nguồn.
   * "Loại nguồn" thật là pdf · youtube · repo… — đúng danh sách tab Loại nguồn
   * của màn Danh mục. Đếm bằng CÙNG phép suy `nguonCua()` và lấy nhãn từ CÙNG
   * bảng `DS_NGUON` — phép đếm thứ hai là phép đếm sẽ lệch im lặng.
   * Màu theo NHÓM (3 token viền của màn Danh mục) — mắt gom pdf/pptx về "tài
   * liệu" mà không cần 14 màu.
   */
  const nhanNg = Object.fromEntries(Object.values(DS_NGUON).flat().map((x) => [x.id, x.nhan]))
  const nhomNg = Object.fromEntries(
    Object.entries(DS_NGUON).flatMap(([m, ds]) => ds.map((x) => [x.id, m])))
  const MAU_NHOM = {
    "bai-viet": "var(--c-article)", "tai-lieu": "var(--c-paper)", video: "var(--c-video)",
  }
  const theoNg = demTheo((b) => nguonCua(b))
  const dsNg = Object.entries(theoNg)
    .sort((a, b) => (nhomNg[a[0]] ?? "").localeCompare(nhomNg[b[0]] ?? "") || b[1] - a[1])
  const tongNg = dsNg.reduce((a, [, x]) => a + x, 0)
  const oGia = tongNg > 120 ? Math.ceil(tongNg / 120) : 1
  let iNhomO = 0
  shell = chen(shell, "bars2", tongNg
    ? `<div class="wf" role="img" data-o="${oGia}"
        aria-label="${dsNg.map(([k, x]) => `${x} ${nhanNg[k] ?? k}`).join(" · ")}">
      ${dsNg.map(([k, x]) =>
        `<span class="wf-g" style="--i:${iNhomO++};color:${MAU_NHOM[nhomNg[k]] ?? "var(--ink-2)"}" title="${esc(nhanNg[k] ?? k)}">`
        + `<i class="wf-o"></i>`.repeat(Math.max(1, Math.round(x / oGia)))
        + "</span>").join("")}
    </div>
    <div class="tp-l">${dsNg.map(([k, x]) => `
      <div class="tp-r" title="${esc(nhanNg[k] ?? k)}"><i class="tp-c" style="background:${MAU_NHOM[nhomNg[k]] ?? "var(--ink-2)"}"></i>
        <span class="l">${esc(k)}</span><b class="v">${hai(x)}</b></div>`).join("")}
    </div>
    <div class="kf-n">${oGia === 1 ? "mỗi ô = 1 bài" : `mỗi ô ≈ ${oGia} bài`} · bài đã duyệt</div>`
    : '<p class="empty">Chưa có bài nào.</p>')

  /**
   * FR-027k · ĐỘ TIN CẬY vẽ bằng THANH CHIA ĐOẠN: `credibility_max` là enum
   * CÓ THỨ TỰ — cái người đọc cần là TỈ LỆ "bao nhiêu phần kho là nguồn đã
   * kiểm". THỨ TỰ đọc từ schema, không sắp theo số lượng: đảo thang đo theo
   * dữ liệu là làm mất chính cái thang.
   */
  /*
   * FR-041 lượt 2 · THEO PHÂN LOẠI thế chỗ pane tin cậy — người dùng chốt màn
   * Kho chỉ còn BỐN tổng hợp (thời gian · phân loại · loại nguồn · trạng
   * thái); tin cậy và ưu tiên rời màn, pane chất lượng duy nhất còn lại là
   * `mball` bên màn Tất cả (spec §pane chất lượng đã amend theo).
   *
   * Ba mảng đọc từ `BANG_MODULE` (loai-nguon.json) — CÙNG file khai mà route
   * và DB dùng; gõ tay danh sách nhóm ở đây là bản chép thứ tư để trôi.
   * Nền: CẢ KHO — phân loại là câu "kho có gì", không phải thước đo chất lượng.
   */
  const maxNhom = Math.max(1, ...BANG_MODULE.map((m) =>
    tatCa.filter((b) => phanLoaiCua(b) === m.ten).length))
  shell = chen(shell, "kf-nhom", tatCa.length
    ? BANG_MODULE.map((m) => {
        const soNhom = tatCa.filter((b) => phanLoaiCua(b) === m.ten).length
        return bar(m.nhan, soNhom, maxNhom, "var(--brand)")
      }).join("") + `<div class="kf-n">cả kho · ${hai(tatCa.length)} bản ghi</div>`
    : '<p class="empty">Chưa có bài nào.</p>')

  /**
   * FR-027k · BỐN trạng thái, đếm từ `TRANG_THAI` (đọc enum của schema) —
   * bản gõ tay từng bỏ sót `edited`. Biểu đồ này TÁCH draft/edited (thanh
   * thành phần đầu màn gộp): `draft` là chưa ai đọc, `edited` là đã duyệt
   * rồi bị sửa nên rời khỏi site — người quản lý cần phân biệt.
   */
  const demTrang = {}
  for (const b of tatCa) {
    if (b.review_status) demTrang[b.review_status] = (demTrang[b.review_status] ?? 0) + 1
  }
  /*
   * FR-041 · VÒNG ĐỜI thay bar ngang: bốn trạng thái KHÔNG phải bốn đại lượng
   * rời — chúng là các chặng của một bảng chuyển (M02 §2.2), và bar ngang giấu
   * chính điều đó. Node nối bằng mũi tên, mỗi node mang số đếm 0→n khi vào tầm
   * nhìn (home-motion.veVongDoi). VẪN lặp trên `TRANG_THAI` đọc từ schema —
   * `bon-trang-thai.test.js` §4b canh, và nó canh đúng: bản gõ tay từng bỏ sót
   * `edited`.
   */
  shell = chen(shell, "bars4", `<div class="lc" role="img"
      aria-label="${TRANG_THAI.map((s) => `${demTrang[s] ?? 0} ${s}`).join(" · ")}">`
    + TRANG_THAI.map((s) => {
      const n = demTrang[s] ?? 0
      return `<div class="lc-n${n ? "" : " trong"}" data-st="${s}">
          <b class="v">${hai(n)}</b><span>${s}</span></div>`
    }).join("")
    + "</div>")

  /* ═══ FR-031 · DÒNG CHẢY KHO — ba góc nhìn nữa, ba HÌNH DẠNG ═════════════
   *   theo tháng    chuỗi THỜI GIAN, có thứ tự tự nhiên  → cột dọc
   *   theo nguồn    ba phần của một tổng                 → thanh chia đoạn
   *   theo ưu tiên  ba mức có thứ tự, cần số chính xác   → hàng
   * Cơ sở đếm: CẢ KHO (`tatCa`), khai ở nhãn từng pane.
   */
  // ── Pane 1 · theo tháng ────────────────────────────────────────────────
  // Bài thiếu ngày KHÔNG bị nhét vào một tháng đoán được — nó ra ô "chưa rõ",
  // vì đoán hộ ở một biểu đồ thời gian là dịch chuyển cả đường cong.
  const demThang = {}
  let khongNgay = 0
  for (const b of tatCa) {
    const m = /^(\d{4}-\d{2})/.exec(b.analyzed_at || "")
    if (m) demThang[m[1]] = (demThang[m[1]] ?? 0) + 1
    else khongNgay++
  }
  const thang = Object.keys(demThang).sort().slice(-NGUONG.thangKho)
  const maxThang = Math.max(1, ...thang.map((t) => demThang[t] ?? 0))
  /*
   * FR-041 · ĐƯỜNG VÙNG thay cột dọc: chuỗi thời gian đọc bằng ĐƯỜNG — xu
   * hướng nằm ở độ dốc, cột chỉ hơn khi so từng tháng lẻ. `pathLength="100"`
   * + dashoffset để đường VẼ DẦN khi vào tầm nhìn (home-motion.veDuongVung);
   * mỗi điểm một chấm mang title tra được. Một tháng duy nhất thì đường suy
   * biến thành chấm — vẫn đúng, không vẽ hộ dữ liệu không có.
   */
  const SLW = 260, SLH = 84
  const diemSl = thang.map((t, i) => {
    const x = thang.length === 1 ? SLW / 2 : 10 + (i / (thang.length - 1)) * (SLW - 20)
    const y = SLH - 16 - ((demThang[t] ?? 0) / maxThang) * (SLH - 30)
    return [x.toFixed(1), y.toFixed(1)]
  })
  const duongSl = diemSl.map((d) => d.join(",")).join(" ")
  shell = chen(shell, "kf-thang", thang.length
    ? `<svg class="sl" viewBox="0 0 ${SLW} ${SLH}" role="img"
        aria-label="${thang.map((t) => `${t}: ${demThang[t]} bài`).join(" · ")}">
      <defs><linearGradient id="slg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--brand)" stop-opacity=".38"/>
        <stop offset="1" stop-color="var(--brand)" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon class="sl-a" points="${diemSl[0][0]},${SLH - 16} ${duongSl} ${diemSl[diemSl.length - 1][0]},${SLH - 16}"></polygon>
      <polyline class="sl-l" points="${duongSl}" pathLength="100"></polyline>
      ${diemSl.map(([x, y]) =>
        `<circle class="sl-d" cx="${x}" cy="${y}" r="3"/>`).join("")}
    </svg>
    <div class="sl-x">${thang.map((t) => `<span>${esc(t.slice(5))}</span>`).join("")}</div>
    <div class="kf-n">${thang.length} tháng gần nhất · cả kho${
      khongNgay ? ` · ${khongNgay} bài chưa rõ ngày` : ""}</div>`
    : "", "Chưa bài nào có ngày phân tích.")

  /* FR-041 lượt 2 · pane "theo nguồn gốc" (origin) ĐÃ RỜI MÀN — không nằm
     trong bốn tổng hợp người dùng chốt. Đừng nhầm với "Theo loại nguồn"
     (source_type) — pane đó GIỮ, nó là tổng hợp số 3. */

  /*
   * FR-041 lượt 2 · THEO NGÀY — tổng hợp thời gian thang mịn, thế chỗ pane ưu
   * tiên. CỘT DỌC vì câu hỏi ở thang ngày là so TỪNG NGÀY lẻ; xu hướng dài đã
   * có đường vùng theo tháng — hai thang, hai hình, đúng luật mỗi-câu-hỏi-một-
   * hình-dạng.
   *
   * Trục lùi từ ngày MỚI NHẤT trong kho, KHÔNG lùi từ hôm nay: kho nghỉ một
   * tuần thì trục theo-hôm-nay vẽ 30 cột rỗng — đọc ra như "kho chết", sai.
   * Cột rỗng là `<i></i>` trần (không style) — 30 cột lặp ở mọi trang, mỗi
   * byte thừa nhân với số trang.
   */
  const demNgay = {}
  for (const b of tatCa) {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(b.analyzed_at || "")
    if (m) demNgay[m[1]] = (demNgay[m[1]] ?? 0) + 1
  }
  const coNgay = Object.keys(demNgay).sort()
  let khoiNgay = ""
  if (coNgay.length) {
    const moc = new Date(coNgay[coNgay.length - 1] + "T00:00:00Z")
    const truc = Array.from({ length: NGUONG.ngayKho }, (_, i) => {
      const d = new Date(moc)
      d.setUTCDate(d.getUTCDate() - (NGUONG.ngayKho - 1 - i))
      return d.toISOString().split("T")[0]
    })
    const maxNgay = Math.max(1, ...truc.map((d) => demNgay[d] ?? 0))
    khoiNgay = `<div class="cot" role="img" aria-label="${truc
        .filter((d) => demNgay[d]).map((d) => `${d}: ${demNgay[d]} bài`).join(" · ")}">
      ${truc.map((d, iC) => (demNgay[d]
        ? `<i title="${d} · ${demNgay[d]} bài" data-n="${demNgay[d]}" style="--i:${iC % 12};height:${(((demNgay[d]) / maxNgay) * 100).toFixed(0)}%"></i>`
        : "<i></i>")).join("")}
    </div>
    <div class="cot-x"><span>${truc[0].slice(5)}</span><span>${truc[truc.length - 1].slice(5)}</span></div>
    <div class="kf-n">${NGUONG.ngayKho} ngày quanh bài mới nhất · cả kho</div>`
  }
  shell = chen(shell, "kf-ngay", khoiNgay, "Chưa bài nào có ngày phân tích.")

  // "M1" là từ vựng của người CHẤM dự án — điều người đọc cần biết là còn
  // thiếu bao nhiêu: một số, không một khái niệm.
  shell = shell.replace('<p class="note" id="m1note"></p>',
    `<p class="note" id="m1note">${canThem
      ? `Còn thiếu <b>${canThem}</b> nguồn nữa.`
      : "Đã đủ nguồn."}</p>`)

  // ── MOCK / REAL ──────────────────────────────────────────────────────
  // FR-027f · MAN NAP NGUON — dai noi MUC TU DONG HOA cua ba loi:
  //   6 pass — giao thuc source-distiller · 4 cong — gac() cua gate.py ·
  //   9 cong — danh so trong validate.py. `luong-nap-bai.test.js` canh khop nguon.
  shell = chen(shell, "mbnap", daiMay([["lối nạp", 3], ["bước kiểm", 9]]))

  /*
   * WO-012 · DAI "LOI NAP 1 · LOP CONG 6 · MB TOI DA 25" DA BO.
   *
   * Toi tu them no o C6a, va no noi KIEN TRUC: "lop cong" la tu vung noi bo cua
   * du an, khong phai thu nguoi nap mot file PDF can biet. `chu-giao-dien` ton
   * tai dung de chan man hinh noi kien truc — va toi vi pham chinh cong do.
   *
   * Thu NGUOI DUNG can o day da co san: dong goi y duoi o chon file noi "moi
   * dinh dang · toi da 25.0 MB", va no lay so tu bang khai.
   */
  shell = chen(shell, "mbnaptl", "")

  shell = chen(shell, "dmode", nutMode(laMock))
  shell = chen(shell, "mockbar", laMock
    ? '<div class="mockbar"><b>dữ liệu mẫu</b> — bản ghi mẫu từ kho mẫu, ' +
      'không phải kho thật</div>'
    : "")

  // ── onclick cua prototype goi ham toan cuc ⇒ doi sang data-* ─────────
  shell = shell.replace(/onclick="nav\('(\w+)'\)"/g, 'data-nav="$1"')
    .replace(/onclick="open_\((\d+)\)"/g, 'data-open="$1"')
    .replace(/\sonclick="[^"]*"/g, "")

  /*
   * T03-102 · `chunk` = tên màn có chunk JS riêng, hoặc "" nếu không.
   *
   * Thẻ script thứ hai đặt SAU `gn.js`: chunk tự chứa nên thứ tự không bắt
   * buộc, nhưng đặt sau giữ đúng một điều — `gn.js` là thứ mọi trang cần, và
   * cái cần-cho-mọi-trang không được xếp sau cái chỉ-một-trang-cần.
   */
  const trang = (tieuDe, than, sau = "", chunk = "") => catThut(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tieuDe)} · Grown news</title>
<link rel="stylesheet" href="${sau}gn.css?v=${vCss}">
</head><body>
${than}
<script src="${sau}gn.js?v=${vJs}"></script>
${chunk ? `<script src="${sau}gn-${chunk}.js?v=${vChunk(chunk)}"></script>` : ""}
</body></html>
`)

  /** Doi view nao mang class "on" + tab nao dang bat */
  const doiView = (v) => shell
    .replace(/<div class="view on"/g, '<div class="view"')
    .replace(`<div class="view" id="v-${v}"`, `<div class="view on" id="v-${v}"`)
    .replace(/<button class="tb on"/g, '<button class="tb"')
    .replace(`<button class="tb" data-nav="${v}"`,
             `<button class="tb on" aria-current="true" data-nav="${v}"`)
    .replace('<span class="tcount" id="tcount"></span>',
             '<span class="tcount" id="tcount" data-mount></span>')
    // Logo ve dung goc cua ban dang xem — o /mock/ thi ve /mock/, khong nhay
    // sang ban real (nguoi dung se tuong du lieu bien mat).
    .replace('<a href="/">', `<a href="${laMock ? "/mock/" : "/"}">`)

  return { trang, doiView, tatCa, iCua }
}

/**
 * Thay noi dung moc `grid2` bang danh sach da cat trang, chen `nav` ngay sau.
 *
 * FR-034/C5 · SUA NO-OP PORT TU EMITTER: regex cu bat dau bang
 * `<div class="grid" id="grid2">` — nhung the that trong shell la
 * `<div class="grid" id="grid2" data-mount>` (va `chen()` giu nguyen the mo),
 * nen regex KHONG BAO GIO khop va `/tat-ca/:n/` tra nguyen ca kho o moi trang.
 * Khong the sua bang lazy-regex `[\s\S]*?</div>`: the dong dau tien nam BEN
 * TRONG the bai (`.mt`), cat o do la vo trang. Dem do sau <div> nhu `catNap`.
 */
function thayGrid2(html, noiDung, nav) {
  const m = /<div class="grid" id="grid2"[^>]*>/.exec(html)
  if (!m) return html
  let sau = 0
  const re = /<(\/?)div\b[^>]*>/g
  re.lastIndex = m.index
  for (let x = re.exec(html); x; x = re.exec(html)) {
    sau += x[1] ? -1 : 1
    if (sau === 0) {
      return html.slice(0, m.index) + m[0] + noiDung + "</div>" + nav +
             html.slice(x.index + x[0].length)
    }
  }
  return html   // khong tim duoc the dong ⇒ tra nguyen, tha nang hon tha vo
}

/**
 * MAN TAT CA — PHAN TRANG. 24 the/trang ~57KB — cuon 2-3 man hinh, vua mot
 * lan doc. (Port nguyên khối từ vòng phân trang của emitter.)
 */
function trangTatCa(b, tr) {
  const soTrang = Math.max(1, Math.ceil(b.tatCa.length / NGUONG.moiTrang))
  const lat = b.tatCa.slice((tr - 1) * NGUONG.moiTrang, tr * NGUONG.moiTrang)
  const sau = tr === 1 ? "../" : "../../"

  const nav = soTrang > 1 ? `<nav class="pgn" aria-label="Phân trang">
    ${tr > 1 ? `<a href="${tr === 2 ? "../" : `../${tr - 1}/`}">‹ trước</a>` : '<span>‹ trước</span>'}
    <span class="pgi">trang <b>${tr}</b> / ${soTrang} · ${b.tatCa.length} bản ghi</span>
    ${tr < soTrang ? `<a href="${tr === 1 ? `${tr + 1}/` : `../${tr + 1}/`}">tiếp ›</a>` : '<span>tiếp ›</span>'}
  </nav>` : ""

  // catNap y het cac man khac: trang phan trang cung KHONG mang man Nap nguon.
  const than = thayGrid2(catNap(b.doiView("all")),
    lat.length
      ? lat.map((x) => b.the2(x)).join("")
      : '<p class="empty">Kho trống.</p>',
    nav)

  // Tiêu đề đọc từ bảng khai, không gõ tay: `tat-ca` là màn TỔNG HỢP (người dùng
  // chốt tên đó cho thanh menu). Tên VIEW giữ `tat-ca` — đổi nó là phá URL đã có
  // và sáu cổng ghim chuỗi đó (four-screens:107 · css-applied:34 · ssr-routes:35
  // · open-card:80 · buttons:67 · cac-man:531).
  const tdTatCa = BANG_MAN.find((m) => m.ten === "tat-ca")?.tieu_de ?? "Tổng hợp"
  return b.trang(`${tdTatCa}${tr > 1 ? ` · trang ${tr}` : ""}`,
    chen(chen(than, "nutnap", moiNutNap("all", b.tatCa)),
      "tcount", moiSoDem("all", b.tatCa)),
    sau)
}

/** view → [id view trong shell, tiêu đề, tiền tố đường tới gn.css]. */
/*
 * BANG MAN — DAN XUAT tu `core/assets/man-hinh.json` (FR-038/C5).
 *
 * Truoc do bang nay go tay o DAY, va con ba ban go tay khac phai khop voi no
 * bang tay: `server.mjs` VIEW_SSR (path -> ten view) · `multiwindow.inline.ts`
 * DUONG (id shell -> path) · `test/_render.mjs` VIEWS. Do la cho DA TROI, khong
 * phai cho co the troi: bon ten khac nhau cho cung mot man — slug `khai-niem` ≠
 * id shell `concepts` ≠ tieu de "Danh mục".
 *
 * `tat-ca` KHONG co trong bang nay va do la co y: no re nhanh o `renderTrang`
 * TRUOC khi tra bang, vi no co phan trang (`tat-ca-trang-n`). Bang nay chi cho
 * cac man di duong CHUNG.
 */
// Tran hien vat doc tu bang khai — go `25` o day la ban thu hai cua mot con
// so da co chu (`media-mime.json.tran_byte`).
const TRAN_MEDIA_MB = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
  .tran_byte / 1048576

const BANG_MAN = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
const MAN = Object.fromEntries(BANG_MAN
  .filter((m) => m.ten !== "tat-ca")
  .map((m) => [m.ten, [m.id_shell, m.tieu_de, m.tien_to]]))
/*
 * Ba man DANH SACH theo loai — `menu` VA `module`, khong chi `module`.
 *
 * Chi loc `m.module` la sai tu C6a: hai man NAP rieng cung khai `module` (chung
 * thuoc mot module ma), nen chung lot vao vong do luoi va `m.nhan` cua chung la
 * `null` ⇒ vo ngay tai `.toLowerCase()`. Man DANH SACH la man co mat tren thanh
 * menu; man nap thi khong.
 */
/*
 * ═══ WO-014 · HAI CHIỀU: PHÂN LOẠI và LOẠI NGUỒN ════════════════════════════
 *
 * Người dùng, kèm ảnh chụp: *"chúng ta đang nhầm mục loại nguồn và phân loại…
 * trong trang tổng hợp, các key như video, tai-lieu KHÔNG THỂ để chung chỗ loại
 * nguồn như tiktok / youtube / article / paper"*.
 *
 * `bangLoc` trước đó dựng nhóm "loại nguồn" bằng `source_type` — một ô chở hai
 * ý. Hệ quả: sidebar `/video/` hiện đúng MỘT dòng `video`.
 *
 *   PHÂN LOẠI  = module: bài viết · tài liệu · video
 *   LOẠI NGUỒN = KHÁC NHAU theo module:
 *       bài viết ⇒ `source_type`             (article · paper · repo · …)
 *       tài liệu ⇒ ĐỊNH DẠNG từ `media.mime` (pdf · pptx · docx · …)
 *       video    ⇒ NƠI PHÁT từ `url_normalized` (youtube · tiktok · …),
 *                  hoặc `tai-len` nếu bản đó có byte trong kho
 *
 * KHÔNG đổi schema: cả ba đã nằm sẵn trong dữ liệu, chỉ chưa được đưa lên mặt.
 *
 * Ba tập PHẢI RỜI NHAU — một giá trị thuộc hai module thì bộ lọc nói dối. Nên
 * mặc định của tài liệu là `bin` (đuôi của `mac_dinh`), của video là `khac`.
 */
/* Trần số từ của hồ sơ `thu-vien` — màn phải NÓI RA trước, không để 422 nói
   hộ sau khi người dùng gõ xong. Đọc từ bảng khai, không gõ số. */
const KHUNG_BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "khung-than-bai.json"), "utf8"))

/*
 * TAP ICON = CHINH THU MUC `public/icon/`.
 *
 * Doc thu muc chu khong liet mot mang tay: mot mang tay la ban thu hai cua
 * danh sach file, va ban thu hai bao gio cung lac hau truoc — them mot icon
 * roi quen dong mang thi icon co that ma khong ai thay.
 *
 * Chi chip nao CO icon moi mang `data-i`. Nho vay o vuong den 14px (bug chu
 * du an bat 2026-09-08) khong the xay ra NUA VE CAU TRUC: khong co `data-i`
 * thi khong co `::before`, chu khong phai *co `::before` nhung thieu mask*.
 */
const ICON_CO = new Set(
  readdirSync(join(GOC, "public", "icon"))
    .filter((f) => f.endsWith(".svg"))
    .map((f) => f.slice(0, -4)))

const MEDIA_BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))

/*
 * Dòng bảng mime thuộc nhóm TÀI LIỆU — dùng cho cả chip bộ lọc và dòng chữ
 * "định dạng nhận". MỘT phép, hai chỗ gọi: hai bản của cùng phép lọc là chỗ
 * chúng lệch, và lệch ở đây nghĩa là bộ lọc kể một danh sách khác dòng chữ
 * ngay bên trên nó.
 *
 * Loại ra: `chi_dan_xuat` (máy sinh, người không nạp) và `nhom_thu_vien:
 * "video"` (mp4/mp3 — định dạng của bản ghi video, không phải tài liệu).
 */
const laTaiLieu = (l) => !l.chi_dan_xuat && l.nhom_thu_vien !== "video"
  // `FR-064` · `chip_loc: false` ⇒ có mime, không có chip. Vai RENDER và
  // vai CHIP LỌC là hai vai; `.md`/`.txt` chỉ cần vai đầu.
  && l.chip_loc !== false

/** Định dạng nhóm VIDEO nhận được — nguồn duy nhất cho `accept` của ô file. */
export const dinhDangVideo = () =>
  MEDIA_BANG.loai.filter((l) => l.nhom_thu_vien === "video")
/*
 * MOT lan doc bang khai, ba phep dan xuat.
 *
 * Truoc WO-016 file nay doc `loai-nguon.json` HAI lan (o day va o
 * `LOAI_CUA_NHOM`); WO-016 can lan thu ba (nhan module cho man Danh muc). Ba
 * lan doc cung mot file la ba co hoi de mot trong ba doc sai duong hoac loc sai
 * khoa ma khong ai bao — dung thu bang khai sinh ra de dep.
 */
const BANG_MODULE = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module

const NHOM_CUA_LOAI = Object.fromEntries(
  BANG_MODULE.flatMap((m) => m.loai.map((l) => [l, m.ten])))

/** PHÂN LOẠI của một bản — tên module. */
const phanLoaiCua = (b) => NHOM_CUA_LOAI[b.source_type] ?? ""

/**
 * LOẠI NGUỒN của một bản — MỘT phép suy, dùng cho mọi màn.
 *
 * Hai phép suy cho cùng một nhãn là hai chỗ để lệch; đó là lớp lỗi `dongBoThe`
 * (hai bên dựng cùng một khoá bằng hai công thức, và bài không có `title` thì
 * fallback lệch ⇒ thẻ nhân đôi).
 */
function nguonCua(b) {
  const nhom = phanLoaiCua(b)
  if (nhom === "tai-lieu") {
    // FR-052 · MANG. Duoi file suy tu hien vat DAU — mot the danh sach hien
    // MOT nhan loai, va nhan do noi ve hien vat chinh.
    const hv0 = Array.isArray(b.media) ? b.media[0] : b.media
    const l = MEDIA_BANG.loai.find((x) => x.mime === hv0?.mime)
    return (l ? l.duoi : MEDIA_BANG.mac_dinh.duoi).replace(/^\./, "")
  }
  if (nhom === "video") {
    // Có byte GỐC trong kho ⇒ "tải lên".
    //
    // ⚠️ WO-076 · "GỐC", không phải "có media". Dòng này trước đây hỏi
    // `b.media.length` và nó ĐÚNG vào ngày được viết: thứ duy nhất nằm trong
    // `media` của một video khi ấy là byte mp4 người dùng tự tải lên. Từ đó
    // `media` nhận thêm HAI loại hiện vật do MÁY sinh — `.vtt` transcript
    // (`T12-27`) và ảnh bìa (`WO-071/072/075`) — nên một video YouTube vừa
    // sinh transcript xong TỰ ĐỔI loại nguồn thành "tải lên", và nguồn thật
    // của nó biến mất khỏi bộ lọc.
    //
    // Chủ dự án đếm bằng mắt 2026-09-09: kho có 5 youtube · 2 fb · 1 tiktok ·
    // 1 douyin, bộ lọc báo `tai-len 7 · douyin 1 · youtube 1`. Đúng 7 bản ghi
    // có hiện vật dẫn xuất.
    //
    // Lọc bằng cờ `chi_dan_xuat` của bảng khai — cờ ĐÃ CÓ SẴN cho cả hai loại,
    // chỉ chưa ai đọc nó ở đây. Cùng phép lọc mà `xemTruocHienVat` dùng để
    // chọn hiện vật CHÍNH: một nơi khai, mọi tầng đọc.
    const ds = Array.isArray(b.media) ? b.media : (b.media ? [b.media] : [])
    const danXuat = new Set(
      (MEDIA_BANG.loai ?? []).filter((l) => l.chi_dan_xuat).map((l) => l.mime))
    if (ds.some((x) => x?.sha256 && !danXuat.has(String(x?.mime ?? "")))) return "tai-len"
    const u = String(b.url_normalized ?? "").toLowerCase()
    const h = MEDIA_BANG.video_host.find(
      (x) => u === x.mien || u.startsWith(x.mien + "/") || u.startsWith(x.mien + "?"))
    return h ? h.nhan : "khac"
  }
  return b.source_type ?? ""
}

const MAN_LOAI = BANG_MAN.filter((m) => m.menu && m.module)
/*
 * WO-012 · NUT NAP cua MOT man — dien luc renderTrang, khong luc dungShell.
 *
 * `dungShell` chay MOT lan cho ca sau man; o do chua biet man nao dang mo. Dat
 * o day la dat sai tang, va no lam nut cua module khac dung tren man nay — dung
 * "gop chung tinh nang" nguoi dung cam.
 *
 * Truoc WO-012: `+ VIET BAI` (do dam) tren MOI man, ke ca `/tai-lieu/` va
 * `/video/`. Dich doc tu `man-hinh.json` qua `module`, khong go ba duong.
 */
/*
 * WO-012 · SO DEM HEADER theo MAN dang mo, khong theo ca kho.
 *
 * Truoc: header noi "1 bai · 1 ban ghi" tren man Tai lieu co 0 tai lieu. Mot
 * con so DUNG dat SAI CHO — cung lop loi BUG-2 `#acount`, va nguoi dung doc nó
 * nhu mot loi dem.
 *
 * Man khong co `module` (Trang chu · Tong hop · Kho · Danh muc) van noi so ca
 * kho, va do la DUNG: chung la man tron.
 */
function soDem(idShell, tatCa) {
  const man = BANG_MAN.find((x) => x.id_shell === idShell)
  const cua = man?.module ? (LOAI_CUA_NHOM[man.module] ?? []) : null
  const ds = cua ? tatCa.filter((b) => cua.includes(b.source_type)) : tatCa
  const ap = ds.filter((b) => b.review_status === "approved").length
  return `${ap} bài · ${ds.length} bản ghi`
}

/*
 * HEADER PHẢI ĐỔI THEO MÀN — và nó KHÔNG nằm trong `.view` nào.
 *
 * Bug chủ dự án bắt 2026-09-07: đứng ở `/tai-lieu/` mà nút nạp vẫn là *ĐĂNG
 * KÝ VIDEO*, số đếm vẫn của màn trước. Gốc: shell có ĐÚNG MỘT `#nutnap` và
 * MỘT `#tcount`, đổ ở máy chủ cho màn được render; `doiView()` đổi `.view.on`
 * rồi `pushState` sang URL mới, nhưng header ngoài `.view` nên nó giữ nguyên
 * nội dung của màn đã render lúc TẢI TRANG.
 *
 * Nặng hơn một lỗi hiển thị: nút ấy MỞ MỘT MÀN NẠP. Người ở Tài liệu bấm nó
 * sẽ đi đăng ký một VIDEO — màn nói sai việc nó sắp làm.
 *
 * Lối sửa: phát SẴN header của MỌI màn, mỗi cái mang `data-napfor`/`data-tcfor`,
 * và ẩn hết trừ màn đang mở. `doiView` chỉ việc đổi cờ `hidden` — không dựng
 * chuỗi HTML trong JS, nên không có bản thứ hai của luật "nút nào cho màn nào".
 *
 * Vì sao KHÔNG để `doiView` tự dựng: luật ấy đọc `BANG_MAN` + `LOAI_CUA_NHOM`
 * ở máy chủ. Chép nó sang FE là chép một bảng khai — và hai bản của một bảng
 * là hai chỗ để lệch.
 */
/*
 * Màn nào được phát header SẴN trong tài liệu này?
 *
 * HAI phép chặn, và phép thứ hai là một LUẬT của dự án chứ không phải tối ưu:
 *
 *   1 · `cat_khi_khac` đã bị `catMotMan` cắt khỏi mọi trang trừ chính nó ⇒
 *       phát header cho chúng là phát cho một view không tồn tại. Dead weight
 *       thuần, và nó vỡ trần HTML trang chủ (đo: 65596/61440).
 *
 *   2 · **KHÁC MODULE thì KHÔNG phát.** Cổng `ba-module-tach-biet` bắt đúng
 *       chỗ này: tài liệu `/tai-lieu/` không được chứa nút *"viết bài"*, KỂ
 *       CẢ ẩn — chủ dự án đặt luật *"ba module tách biệt ở MỌI tầng"*, và một
 *       nút ẩn vẫn là một nút có trong tài liệu.
 *
 * Hệ quả: đổi màn TRONG một module là đổi view (nhanh); vượt sang module khác
 * là một lần TẢI TRANG THẬT. Đúng thứ tự ưu tiên — luật trước, tốc độ sau.
 */
function phatHeaderCho(m, dangMo) {
  if (m.cat_khi_khac && m.id_shell !== dangMo) return false
  const cua = BANG_MAN.find((x) => x.id_shell === dangMo)
  // Màn CÓ module ⇒ CHỈ header của chính nó.
  //
  // Kể cả dropdown `+ nạp` của các màn KHÔNG module cũng không được ở đây:
  // nó liệt kê cả ba lối nạp, tức chứa *"+ viết bài"* — và cổng
  // `ui-ba-man` bắt đúng chuỗi ấy trong thanh trên của `/tai-lieu/`.
  if (cua?.module) return m.id_shell === dangMo
  // Màn KHÔNG module (home · all · kho · concepts · dothai) dùng chung MỘT
  // dropdown; phát cho cả nhóm là 0 byte thêm sau khi gộp.
  return !m.module
}

function moiNutNap(dangMo, tatCa) {
  /*
   * GỘP các bản GIỐNG HỆT nhau.
   *
   * Năm màn không có `module` (home · all · kho · concepts · dothai) đều nhận
   * CÙNG MỘT dropdown `+ nạp`. Phát mười ba bản rời làm HTML trang chủ vọt
   * lên 65596/61440 — đo được 2026-09-07, vỡ trần 4156 byte.
   *
   * Nên `data-napfor` mang DANH SÁCH view cách nhau bằng khoảng trắng, và bên
   * FE so bằng `~=`. Một bản HTML cho mọi màn dùng chung nó.
   */
  const nhom = new Map()
  for (const m of BANG_MAN) {
    if (!phatHeaderCho(m, dangMo)) continue
    const h = nutNap(m.id_shell)
    if (!h) continue
    if (!nhom.has(h)) nhom.set(h, [])
    nhom.get(h).push(m.id_shell)
  }
  return [...nhom].map(([h, ids]) =>
    `<span data-napfor="${esc(ids.join(" "))}"${ids.includes(dangMo) ? "" : " hidden"}>${h}</span>`
  ).join("")
}

function moiSoDem(dangMo, tatCa) {
  /*
   * Chữ của màn ĐANG MỞ là TEXT TRỰC TIẾP của `#tcount`; các màn khác nằm
   * trong `<i hidden>` phía sau.
   *
   * Vì sao không bọc tất cả vào `<span>`: cổng `real-vs-mock` đọc số đếm bằng
   * `/id="tcount"[^>]*>([^<]*)/` — nó cắt tới dấu `<` đầu tiên. Bọc thẻ vào
   * ngay sau `#tcount` làm phép đọc ấy ra chuỗi RỖNG, và cổng đỏ. Cổng đang
   * đo một thứ đúng (số đếm phản ánh dữ liệu thật) bằng một phép đọc hợp lý;
   * nới nó là bên bị chấm sửa thước, nên đổi MARKUP là lối đúng.
   */
  // Gộp y như nút nạp: mọi màn KHÔNG có `module` đếm trên cùng một tập.
  const nhom = new Map()
  for (const m of BANG_MAN) {
    if (!phatHeaderCho(m, dangMo)) continue                 // xem `moiNutNap`
    const d = soDem(m.id_shell, tatCa)
    if (!nhom.has(d)) nhom.set(d, [])
    nhom.get(d).push(m.id_shell)
  }
  return esc(soDem(dangMo, tatCa)) + [...nhom].map(([d, ids]) =>
    `<i hidden data-tcfor="${esc(ids.join(" "))}">${esc(d)}</i>`).join("")
}

function nutNap(idShell) {
  const man = BANG_MAN.find((x) => x.id_shell === idShell)
  const nap = man?.module
    ? BANG_MAN.find((x) => x.module === man.module && x.cat_khi_khac)
    : null
  /*
   * Man co MODULE ma module do CHUA co duong nap ⇒ KHONG hien nut nao.
   *
   * Roi ve nut cua module khac la dung loi vua sua: `/video/` chua co
   * `/video/nap/` (C6b), va mot nut "+ viet bai" o do la moi nguoi dung lam
   * viec cua module khac. Vang mot nut noi dung su that: chua co duong nao.
   */
  /*
   * MAN TRON moi CA BA duong. O do khong co module nao de suy ra mot duong,
   * nen roi ve `napbaiviet` la CHON HO nguoi dung — va no chon luon module.
   *
   * `<details>` la menu cua NEN TANG: khong mot dong JS, khong mot lang nghe,
   * dong dung bang Esc, va doc duoc bang ban phim san. `gn.js` con 355 byte.
   */
  /*
   * TREN MAN NAP: moi cac loi KHAC, danh dau loi dang mo.
   *
   * Do duoc: man nap cung khai `module`, nen phep tim "man nap cua module
   * nay" giai ra CHINH no. Nut tro vao trang dang dung la nut chet, va khong
   * co duong sang loi nap khac — dung cau nguoi dung noi: "bi switch va ko
   * back lai duoc".
   */
  if (man?.cat_khi_khac) {
    const khac = BANG_MAN.filter((x) => x.cat_khi_khac && x !== man)
    if (!khac.length) return ""
    return `<details class="nap-ba"><summary class="bt ghost sm">${esc(String(man.tieu_de))}</summary><div class="nap-ba-m"><span class="nap-ba-h">đang mở: ${esc(String(man.tieu_de).toLowerCase())}</span>${khac.map((x) =>
      `<button class="bt ghost sm" data-nav="${esc(x.data_nav)}">+ ${esc(String(x.tieu_de).toLowerCase())}</button>`).join("")}</div></details>`
  }
  if (!man?.module) {
    /*
     * `cat_khi_khac && module`, KHÔNG chỉ `cat_khi_khac`.
     *
     * Cờ đó mang HAI nghĩa và chúng đã va nhau một lần: (1) *"cắt khỏi trang
     * khác"* — việc của render, và (2) *"là một màn NẠP"* — thứ cụm `+ nạp`
     * dùng. `T03-98` đã trúng: `/dot-hai/` mọc trong dropdown `+ nạp` vì nó
     * mang cờ đó cho nghĩa (1).
     *
     * Chỉ màn NẠP mới có `module` (`nap-bai-viet` → `bai-viet`…), nên vế thứ
     * hai tách đúng hai nghĩa mà không cần thêm một cờ nữa.
     */
    const ds = BANG_MAN.filter((x) => x.cat_khi_khac && x.module)
    if (!ds.length) return ""
    return `<details class="nap-ba"><summary class="bt pri sm">+ nạp</summary><div class="nap-ba-m">${ds.map((x) =>
      `<button class="bt ghost sm" data-nav="${esc(x.data_nav)}">+ ${esc(String(x.tieu_de).toLowerCase())}</button>`).join("")}</div></details>`
  }
  if (!nap) return ""
  return `<button class="bt pri sm" data-nav="${esc(nap.data_nav)}">`
    + `+ ${esc(String(nap.tieu_de).toLowerCase())}</button>`
}

const LOAI_CUA_NHOM = Object.fromEntries(
  BANG_MODULE.map((m) => [m.ten, m.loai]))

/*
 * ═══ T03-90 · MÀN ĐỢT HAI — năm dịch vụ M12–M16 ════════════════════════════
 *
 * Số liệu đọc từ `05_uiux/contracts/<dv>.sample.v1.json` — MỘT nguồn sự thật.
 * Gõ số ở đây là bản thứ hai của một con số đã có chủ, và bản thứ hai sẽ lệch
 * đúng lúc không ai kiểm.
 *
 * Bảng khai dưới đây quyết cả năm thẻ. Thêm một dịch vụ = thêm MỘT dòng; nó
 * không phải một chuỗi `if` vì `Z1`–`Z8` của `ADR-05` đã khai vùng cho từng
 * dịch vụ, và hai bảng nói cùng một chuyện là hai bảng sẽ lệch.
 *
 * `vung` KHÔNG phải nhãn trang trí: nó là thứ quyết ai được gọi ra Internet
 * (LÕI không bao giờ · THỢ là cửa duy nhất · BIÊN đối mặt Internet). Người đọc
 * màn này cần thấy nó trước khi thấy bất cứ con số nào.
 */
const DOT_HAI = [
  { ma: "m12", ten: "Chưng cất", tep: "chungcat", khoa: "jobs",
    dv: "việc", vung: "THỢ", trang_thai: "đang dựng",
    lam: "nguyên liệu trong kho → bản nháp, kèm địa chỉ phân giải được" },
  { ma: "m13", ten: "Truy hồi", tep: "truyhoi", khoa: "chunks",
    dv: "đoạn", vung: "THỢ", trang_thai: "chưa dựng",
    lam: "chỉ mục trên kho; phạm vi lấy từ bộ lọc facet, không phải top-k ẩn" },
  { ma: "m14", ten: "Chatbot", tep: "chatbot", khoa: "hoi_dap",
    dv: "lượt", vung: "THỢ", trang_thai: "chưa dựng",
    lam: "hỏi → đáp kèm địa chỉ bấm được; không có trong kho thì từ chối" },
  { ma: "m15", ten: "Kênh", tep: "kenh", khoa: "adapters",
    dv: "adapter", vung: "BIÊN", trang_thai: "chưa dựng",
    lam: "adapter kênh chat — kéo tin, dịch lệnh, không chạm kho" },
  { ma: "m16", ten: "Artifact", tep: "artifact", khoa: "artifacts",
    dv: "bản", vung: "THỢ", trang_thai: "chưa dựng",
    lam: "bài đã duyệt → slide · giọng đọc · video" }
]

/** Đếm từ hợp đồng mẫu. Thiếu file ⇒ NÉM, không rơi về 0 im lặng: một số 0
 *  không phân biệt được với "chưa có dữ liệu", và màn sẽ nói dối. */
function soDotHai(m) {
  const d = JSON.parse(readFileSync(
    join(GOC, "05_uiux", "contracts", m.tep + ".sample.v1.json"), "utf8"))
  const v = d[m.khoa]
  if (!Array.isArray(v)) throw new Error(`contract ${m.tep} thiếu khoá ${m.khoa}`)
  return v.length
}

/** Bốn ô KPI — tổng hợp, không lặp lại thẻ. */
function dhKpi() {
  const so = DOT_HAI.map(soDotHai)
  const tong = so.reduce((a, x) => a + x, 0)
  const dung = DOT_HAI.filter((m) => m.trang_thai === "đang dựng").length
  const o = [
    ["dịch vụ", String(DOT_HAI.length), ""],
    ["đang dựng", String(dung), "warn"],
    ["bản ghi mẫu", String(tong), ""],
    ["vùng THỢ", String(DOT_HAI.filter((m) => m.vung === "THỢ").length), ""]
  ]
  // Dùng lại `.kp` (`.v` số · `.l` nhãn · `.kp.warn` tô số) — không đẻ class mới.
  return o.map(([l, v, c]) => '<div class="kp' + (c ? " " + c : "") + '">'
    + '<div class="l">' + l + '</div><div class="v">' + v + "</div></div>").join("")
}

/** Năm thẻ — mỗi thẻ một dịch vụ, ba sự thật, một con số có nguồn. */
function dhThe() {
  return DOT_HAI.map((m) => '<article class="kp dh-c" data-ma="' + m.ma + '">'
    + '<header><span class="dh-ma">' + m.ma.toUpperCase() + '</span>'
    + '<h3>' + m.ten + "</h3>"
    // `.ex` là chip cảnh báo CÓ SẴN của dự án; `.bn` chỉ đổi màu cho BIÊN.
    + '<span class="ex' + (m.vung === "BIÊN" ? " bn" : "") + '">'
    + m.vung + "</span></header>"
    + "<p>" + m.lam + "</p>"
    + "<footer><span>" + soDotHai(m) + " " + m.dv + "</span>"
    + '<span' + (m.trang_thai === "đang dựng" ? ' class="on"' : "") + '>'
    + m.trang_thai + "</span></footer></article>").join("")
}

export function renderTrang(view, data, thamSo) {
  // Trang chuyen huong khong can du lieu — tra thang, khong dung shell.
  if (view === "cho-duyet") return TRANG_CHO_DUYET

  const b = dungShell(data)
  // the2: đóng gói `the(x, iCua(x))` cho vòng phân trang — iCua là closure
  // trên chỉ mục của ĐÚNG bản dữ liệu này.
  b.the2 = (x) => the(x, b.iCua(x))

  if (view === "tat-ca") return trangTatCa(b, 1)
  if (view === "tat-ca-trang-n") return trangTatCa(b, Math.max(1, Number(thamSo) || 1))

  const man = MAN[view]
  if (!man) throw new Error(`view không có: ${view}`)
  const [id, tieuDe, sau] = man
  // Man Nap nguon CHI di theo trang /nap/ — cac trang khac cat khoi v-nap
  // (57% shell la form viet bai, chi dung khi API chay).
  // `id` di kem: man dang render KHONG duoc tu cat chinh no. Truoc C6a phep so
  // la `id === "nap"` — mot ban go cung dung mot lan roi het han.
  const than = catNap(b.doiView(id), id)
  let than2 = chen(chen(than, "nutnap", moiNutNap(id, b.tatCa)),
    "tcount", moiSoDem(id, b.tatCa))
  // Đổ số của màn Đợt hai — chỉ khi đang render đúng màn đó. `cat_khi_khac`
  // đã cắt view khỏi các trang khác, nên hai phép này không bao giờ chạy oan.
  if (id === "dothai") {
    than2 = chen(chen(than2, "dhkpi", dhKpi()), "dhthe", dhThe())
  }
  // Màn nào có chunk riêng thì tên chunk = tên view. MỘT phép so, không một
  // bảng thứ hai: bảng thứ hai là chỗ tên màn lệch lần nữa (bốn tên cho một
  // màn đã là bài học của FR-038/C5).
  /*
   * CHỈ màn `/chung-cat/` xin chunk. Trang chủ thì KHÔNG — đo 2026-09-04:
   *   thẻ `<script>` thêm vào HTML trang chủ  = +48 byte, mà nó dư **9**
   *   chunk cộng vào tổng tải đầu của `/`     = +8010 byte, mà nó dư **326**
   * (tổng của `/` là 265914/266240 trước khi thêm gì cả.)
   *
   * Nên khối ba số của `T03-95` đi vào **bundle chung** thay vì chunk: `gn.js`
   * dư 1453 byte và khối đó nhỏ hơn thế. Ngược quyết (a) của PM, và lý do là
   * quyết đó dựa trên hai số không đo được: *"gn.css 91380, dư 11KB sau
   * T03-99"* — `T03-99` CHƯA chạy (8 luật icon còn nguyên, gn.css 102391), và
   * *"chỉ HTML trang chủ kẹt ~9B"* đúng, nhưng 9 byte không đủ cho một thẻ
   * script. Ghi ra để PM đối chiếu, không im lặng làm khác.
   */
  /*
   * T03-104 · `napvideo` chỉ đi với màn `/video/nap/`. Bảng MỘT DÒNG thay vì
   * chuỗi `if`: thêm một chunk là thêm một dòng, còn `if` thì thêm một chunk là
   * sửa một biểu thức và quên một nhánh.
   */
  /*
   * `chungcatnhap` dùng LẠI chunk `chungcat` — nó là màn DƯỚI url module
   * chưng cất, nên chunk của module đó là chỗ đúng cả về byte lẫn về nghĩa.
   * Một chunk phục vụ hai màn không phá luật của `page-weight`: phép đo là
   * "còn màn KHÔNG xin", không phải "đúng một màn xin".
   */
  const CHUNK_MAN = { chungcat: "chungcat", chungcatnhap: "chungcat", napvideo: "napvideo" }
  return b.trang(tieuDe, than2, sau, CHUNK_MAN[id] ?? "")
}
