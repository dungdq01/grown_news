/**
 * M08_api · CỬA XUẤT văn bản — `T08-33`.
 *
 * NGUYÊN TẮC, chốt bởi chủ dự án 2026-09-06:
 *
 *   Chỉ xuất được dạng mà nội dung THẬT SỰ có.
 *
 * Nội dung ta giữ dưới dạng VĂN BẢN (bài viết · bản chưng cất · transcript)
 * xuất đa dạng được, vì mọi dạng đều dựng từ CÙNG một chữ. Còn file NHỊ PHÂN
 * người tải lên (pdf · doc · ppt · mp4) thì "tải xuống" nghĩa là TRẢ LẠI ĐÚNG
 * BYTE ĐÃ NẠP — và đường đó đã có sẵn qua cửa media.
 *
 * Chuyển `pdf → docx` ở máy chủ là DỰNG LẠI một tài liệu mới mang tên tài liệu
 * cũ: mất bố cục, mất bảng, mất phông. Người nhận tưởng đó là bản gốc. Đó là
 * nói dối bằng một cái nút, nên cửa này KHÔNG làm.
 *
 * PDF của nội dung văn bản đi đường IN của trình duyệt (`T03-117`), không
 * render ở máy chủ: mọi thư viện PDF server kéo theo phông nhúng, và tiếng
 * Việt có dấu là chỗ chúng vỡ trước tiên.
 *
 * 0 ĐƯỜNG GHI MỚI — cửa này chỉ đọc, `api-guard` không đổi một dòng.
 */
import { existsSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

/** Xuống dòng — `NL` cục bộ trong vài hàm, hằng này cho tầng module. */
const NLT = String.fromCharCode(10)
import { docHienVat, json, khoDoc, laSlug, loiXemNhap, tachFm } from "./dungchung.mjs"

const BANG = JSON.parse(readFileSync(
  new URL("../../core/assets/xuat-dang.json", import.meta.url), "utf8"))

/** Dạng được phép cho một loại bản ghi. Loại lạ ⇒ rỗng (không đoán). */
const dangChoLoai = (loai) => BANG.theo_loai?.[String(loai)] ?? []

/* `media-mime.json` khai mime nào là SẢN PHẨM MÁY DẪN XUẤT (`chi_dan_xuat`).
   Cửa này và FE đọc CÙNG bảng — hai danh sách cho một khái niệm là hai chỗ
   để lệch. */
const MIME_BANG = JSON.parse(readFileSync(
  new URL("../../core/assets/media-mime.json", import.meta.url), "utf8"))

/*
 * Lột markdown → chữ thuần.
 *
 * GIỮ CHỮ của heading, chỉ bỏ ký hiệu: `## 3. Nội dung` → `3. Nội dung`. Bỏ cả
 * dòng heading là bỏ cấu trúc bài, mà cấu trúc chính là thứ người đọc bản .txt
 * cần nhất để dò.
 *
 * Không dùng thư viện: phép lột này đúng 12 dòng, và một thư viện markdown đầy
 * đủ ở đây là vài trăm KB cho một việc ta làm hết trong một hàm.
 */
/*
 * WO-095 · MARKDOWN → HTML cho BẢN IN.
 *
 * Bản trước nhét cả thân bài vào một `<pre>`: an toàn, nhưng in ra thì
 * `## 2. Bối cảnh` hiện đúng chữ ấy, bảng thành một rừng dấu `|`, `**đậm**`
 * giữ nguyên hai dấu sao. Nó trả lời *"in ra được không"*, còn câu đang hỏi là
 * *"in ra có đọc được không"*.
 *
 * ── THOÁT TRƯỚC, DỰNG SAU ──────────────────────────────────────────────────
 * Thân bài do MODEL sinh, nên nó KHÔNG phải HTML tin được. `<pre>` cũ an toàn
 * nhờ `esc2`; bản này giữ đúng tính chất ấy bằng cách thoát TOÀN BỘ ngay dòng
 * đầu, rồi mới sinh thẻ từ cú pháp Markdown. Không có đường nào để một
 * `<script>` của model thành thẻ thật.
 *
 * Cố ý KHÔNG kéo một thư viện markdown: bản in cần đúng tám thứ dưới đây, và
 * một phụ thuộc mới ở tầng cửa là một quyết định riêng (`WO-095 §Ngoài phạm vi`).
 */
/*
 * WO-096 · TÌM BINARY `typst`.
 *
 * Ba chỗ, theo thứ tự: biến môi trường (người triển khai chỉ định) → `PATH` →
 * đường winget mặc định trên Windows. Không thấy ⇒ `null`, và cửa trả 503 nói
 * thẳng thay vì một file 0 byte.
 */
export function timTypst() {
  const ung = [process.env.TYPST_BIN]
  const home = process.env.LOCALAPPDATA
  if (home) {
    ung.push(join(home, "Microsoft", "WinGet", "Links", "typst.exe"))
    ung.push(join(home, "Microsoft", "WinGet", "Packages",
      "Typst.Typst_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "typst-x86_64-pc-windows-msvc", "typst.exe"))
  }
  for (const p of ung) {
    if (p && existsSync(p)) return p
  }
  // Trên `PATH`: hỏi hệ điều hành thay vì đoán thư mục.
  for (const ten of ["typst", "typst.exe"]) {
    try {
      const r = spawnSync(ten, ["--version"], { timeout: 5000 })
      if (r.status === 0) return ten
    } catch { /* không có */ }
  }
  return null
}

/*
 * WO-096 · MARKDOWN → MARKUP TYPST.
 *
 * ── THOÁT TRƯỚC, DỰNG SAU — và ở đây nó NẶNG HƠN ở HTML ────────────────────
 * Typst là một NGÔN NGỮ, không phải một bộ đánh chữ câm: `#import`, `#eval`,
 * `#read` là mã CHẠY ĐƯỢC trong bộ dựng. Thân bài do MODEL sinh, nên dán thẳng
 * là mở một đường thực thi — tệ hơn hẳn một thẻ HTML lọt lưới.
 *
 * Nên `E()` thoát TOÀN BỘ ký tự đặc biệt của Typst trước, rồi mới sinh markup
 * từ cú pháp Markdown. Markup do CHÍNH TA đặt (`==`, `*…*`, `#table`) không đi
 * qua `E()`.
 */
export function mdSangTypst(md) {
  /*
   * `E` thoát MỌI ký tự Typst coi là đặc biệt. Kể tên đích danh, không đoán:
   * `#` mở lệnh · `$` mở công thức · `@` là tham chiếu · `*` `_` là markup ·
   * `` ` `` mở khối mã · `<>` là nhãn · `[]` mở khối nội dung · `\` là chính
   * dấu thoát.
   */
  const E = (t) => String(t).replace(/[\\#$@*_`<>[\]]/g, (c) => "\\" + c)
  /*
   * `D` mở lại ĐÚNG những cấu trúc Markdown ta muốn giữ — trên chuỗi ĐÃ THOÁT.
   *
   * Nên mẫu ở đây khớp DẤU THOÁT (`\*`, `` \` ``), không khớp ký tự trần. Đó là
   * cách bảo đảm một `*` do MODEL viết ra vẫn nằm im, còn `**đậm**` của cú pháp
   * Markdown thì thành `*đậm*` của Typst.
   */
  const D = (t) => E(t)
    .replace(/\\`([^`\\]+)\\`/g, "`$1`")
    .replace(/\\\*\\\*([^*\\]+?)\\\*\\\*/g, "*$1*")
    .replace(/\\\*([^*\\]+?)\\\*/g, "_$1_")
    .replace(/\\\[([^\]\\]+)\\\]\((https?:\/\/[^\s)]+)\)/g, '#link("$2")[$1]')
  const ra = []
  const dong = String(md ?? "").split(/\r?\n/)
  let i = 0
  while (i < dong.length) {
    const l = dong[i]
    if (/^```/.test(l)) {
      const than = []
      for (i++; i < dong.length && !/^```/.test(dong[i]); i++) than.push(dong[i])
      i++
      ra.push("```" + NLT + than.join(NLT) + NLT + "```")
      continue
    }
    if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(dong[i + 1] ?? "")) {
      const o = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim())
      const dau = o(l)
      i += 2
      const o2 = []
      for (; i < dong.length && /^\s*\|/.test(dong[i]); i++) o2.push(o(dong[i]))
      const oL = (c) => "[" + D(c) + "]"
      ra.push("#table(" + NLT + "  columns: " + dau.length + "," + NLT
        + "  table.header(" + dau.map(oL).join(", ") + ")," + NLT
        + o2.map((r) => "  " + r.map(oL).join(", ") + ",").join(NLT) + NLT + ")")
      continue
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l)
    if (h) { ra.push("=".repeat(Math.min(h[1].length, 6)) + " " + D(h[2])); i++; continue }
    const q = /^\s{0,3}>\s?(.*)$/.exec(l)
    if (q) {
      const than = [q[1]]
      for (i++; i < dong.length && /^\s{0,3}>\s?/.test(dong[i]); i++) {
        than.push(dong[i].replace(/^\s{0,3}>\s?/, ""))
      }
      ra.push("#quote(block: true)[" + D(than.join(" ")) + "]")
      continue
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(l)
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(l)
    if (ul) { ra.push("- " + D(ul[1])); i++; continue }
    if (ol) { ra.push("+ " + D(ol[1])); i++; continue }
    ra.push(l.trim() ? D(l) : "")
    i++
  }
  return ra.join(NLT)
}

export function mdSangHtml(md) {
  const E = (t) => String(t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
  // Trong DÒNG. Chạy SAU khi đã thoát, nên `<em>` sinh ra ở đây là thẻ ta đặt,
  // không phải thẻ model gửi.
  const D = (t) => E(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    // Chỉ `http(s)` và neo trong trang. `javascript:` là một URL hợp lệ về cú
    // pháp — chặn theo DANH SÁCH CHO PHÉP, không theo danh sách cấm.
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]*)\)/g,
      '<a href="$2" rel="noopener">$1</a>')
  const ra = []
  const dong = String(md ?? "").split(/\r?\n/)
  let i = 0
  const dongMuc = (the) => { if (the) ra.push("</" + the + ">") }
  let muc = ""
  while (i < dong.length) {
    const l = dong[i]
    // khối mã — `<pre>` ĐÚNG VAI ở đây, và ruột chỉ thoát, không dựng thẻ
    if (/^```/.test(l)) {
      dongMuc(muc); muc = ""
      const than = []
      for (i++; i < dong.length && !/^```/.test(dong[i]); i++) than.push(dong[i])
      i++
      ra.push("<pre><code>" + E(than.join("\n")) + "</code></pre>")
      continue
    }
    // bảng: dòng `|…|` kèm dòng phân cách `|---|`
    if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(dong[i + 1] ?? "")) {
      dongMuc(muc); muc = ""
      const o = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim())
      const dau = o(l)
      i += 2
      const than = []
      for (; i < dong.length && /^\s*\|/.test(dong[i]); i++) than.push(o(dong[i]))
      ra.push("<table><thead><tr>"
        + dau.map((c) => "<th>" + D(c) + "</th>").join("") + "</tr></thead><tbody>"
        + than.map((r) => "<tr>" + r.map((c) => "<td>" + D(c) + "</td>").join("") + "</tr>").join("")
        + "</tbody></table>")
      continue
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l)
    if (h) {
      dongMuc(muc); muc = ""
      // `##` ⇒ `h2`. Trang in đã có `<h1>` là TIÊU ĐỀ BÀI, và thân bài bắt
      // đầu từ `##`, nên ánh xạ thẳng cấp — cộng một là đẩy cả thang xuống
      // một bậc và `##` thành `h3`.
      const n = Math.min(h[1].length, 6)
      ra.push("<h" + n + ">" + D(h[2]) + "</h" + n + ">")
      i++; continue
    }
    const q = /^\s{0,3}>\s?(.*)$/.exec(l)
    if (q) {
      dongMuc(muc); muc = ""
      const than = [q[1]]
      for (i++; i < dong.length && /^\s{0,3}>\s?/.test(dong[i]); i++) {
        than.push(dong[i].replace(/^\s{0,3}>\s?/, ""))
      }
      ra.push("<blockquote><p>" + D(than.join(" ")) + "</p></blockquote>")
      continue
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(l)
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(l)
    if (ul || ol) {
      const can = ul ? "ul" : "ol"
      if (muc !== can) { dongMuc(muc); ra.push("<" + can + ">"); muc = can }
      ra.push("<li>" + D((ul || ol)[1]) + "</li>")
      i++; continue
    }
    dongMuc(muc); muc = ""
    if (l.trim()) ra.push("<p>" + D(l) + "</p>")
    i++
  }
  dongMuc(muc)
  return ra.join("\n")
}

export function lotMd(md) {
  return String(md ?? "")
    .replace(/^```[^\n]*\n([\s\S]*?)^```\s*$/gm, "$1")   // khối mã: giữ ruột
    .replace(/^#{1,6}\s+/gm, "")                          // heading: bỏ dấu #
    .replace(/^\s{0,3}>\s?/gm, "")                        // trích dẫn
    .replace(/^\s*[-*+]\s+/gm, "· ")                      // gạch đầu dòng
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")              // link: giữ chữ
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/*
 * `.vtt` → `.srt`. ~20 dòng, không thư viện.
 *
 * Ba khác biệt, và cả ba đều bắt buộc: SRT đánh SỐ từng cue, dùng dấu PHẨY cho
 * mili-giây, và không có dòng `WEBVTT` ở đầu. Bỏ sót cái nào thì trình phát
 * nhận file nhưng không hiện phụ đề — hỏng im lặng.
 */
export function vttSangSrt(vtt) {
  const dong = String(vtt ?? "").split(/\r?\n/)
  const ra = []
  let so = 0
  for (let i = 0; i < dong.length; i++) {
    const m = /^(\d{2}:\d{2}:\d{2})[.,](\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})[.,](\d{3})/
      .exec(dong[i])
    if (!m) continue
    const chu = []
    for (let k = i + 1; k < dong.length && dong[k].trim(); k++) chu.push(dong[k])
    if (!chu.length) continue
    ra.push(String(++so), `${m[1]},${m[2]} --> ${m[3]},${m[4]}`, ...chu, "")
  }
  return ra.join("\n")
}

/** Bỏ mốc giờ khỏi `.vtt` — bản `.txt` là để ĐỌC, không để tua. */
export const vttSangTxt = (vtt) =>
  String(vtt ?? "").split(/\r?\n/)
    .filter((l) => !/^WEBVTT/.test(l) && !/-->/.test(l) && !/^\d+$/.test(l.trim()))
    .join("\n").replace(/\n{3,}/g, "\n\n").trim()

/*
 * DẤU BẢN NHÁP — đóng ở ĐẦU FILE, mọi dạng.
 *
 * File rời khỏi máy thì cái vết phải đi cùng nó. Một bản nháp gửi qua chat mà
 * không mang dấu sẽ được đọc như một bài đã duyệt — và người đọc không có cách
 * nào biết. Dấu ghi cả `chi_dan` vì một bản chưng theo yêu cầu riêng phải được
 * chấm bằng đúng yêu cầu đó.
 */
export function dauNhap(h) {
  const fm = tachFm(String(h?.ban_hien_tai || h?.ban_goc_ai || "")).fm ?? {}
  const cd = String(fm.chi_dan ?? "").trim()
  return "BẢN NHÁP — chưa duyệt"
    + ` · nguồn ${Array.isArray(fm.nguon) ? fm.nguon.join(", ") : (fm.nguon ?? "—")}`
    + ` · ${fm.analyzed_at ?? "—"}`
    + ` · chỉ dẫn: ${cd || "—"}`
}

async function docx(tieuDe, md) {
  const D = await import("docx")
  const con = []
  for (const d of String(md ?? "").split(/\r?\n/)) {
    const h = /^(#{1,6})\s+(.*)$/.exec(d)
    if (h) {
      con.push(new D.Paragraph({
        text: h[2],
        heading: D.HeadingLevel[`HEADING_${Math.min(h[1].length, 6)}`],
      }))
      continue
    }
    const li = /^\s*[-*+]\s+(.*)$/.exec(d)
    if (li) { con.push(new D.Paragraph({ text: li[1], bullet: { level: 0 } })); continue }
    if (!d.trim()) { con.push(new D.Paragraph("")); continue }
    // `**đậm**` giữ được; phần còn lại lột ký hiệu — `.docx` là bản ĐỌC, không
    // phải bản dựng lại markdown từng nét.
    const khuc = d.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) =>
      /^\*\*[^*]+\*\*$/.test(t)
        ? new D.TextRun({ text: t.slice(2, -2), bold: true })
        : new D.TextRun(lotMd(t)))
    con.push(new D.Paragraph({ children: khuc }))
  }
  const doc = new D.Document({ sections: [{ children: con }] })
  return D.Packer.toBuffer(doc)
}

function traFile(res, ma, than, { mime, ten }) {
  res.writeHead(ma, {
    "content-type": mime,
    // `filename` sạch vì slug đã kebab — 0 dấu nháy, 0 khoảng trắng, 0 `/`.
    "content-disposition": `attachment; filename="${ten}"`,
    "cache-control": "no-store",
  })
  res.end(than)
}

const loi422 = (res, loai, dang) => json(res, 422, {
  loi: `dạng \`${dang}\` không xuất được cho loại \`${loai}\`. `
    + `Dạng được phép: ${(dangChoLoai(loai).join(" · ")) || "(không dạng nào)"}.`,
})

/*
 * Tìm hiện vật `text/vtt` của một bản ghi, rồi xuất theo dạng.
 *
 * Tra qua CẢ `video` lẫn `tai-lieu`: transcript hôm nay chỉ sinh cho video,
 * nhưng một bản ghi tài liệu có audio cũng phiên âm được, và giới hạn cứng ở
 * `video` sẽ thành một lỗi 404 khó hiểu vào đúng ngày ai đó mở rộng.
 */
function xuatTranscript(res, slug, dang) {
  const b = khoDoc(["video", "tai-lieu"]).find((x) => x.slug === slug)
  if (!b) return json(res, 404, { loi: `không có bản ghi \`${slug}\`` })

  const mang = Array.isArray(b.fm?.media) ? b.fm.media
    : (b.fm?.media ? [b.fm.media] : [])
  // Bản CUỐI = mới nhất (bản ghi lịch sử có thể mang nhiều vtt — xem cctab).
  const hv = mang.filter((m) => String(m?.mime) === "text/vtt").at(-1)
  if (!hv) {
    /* Câu CHỈ ĐƯỜNG, không 404 trần. 404 trần làm trình duyệt lưu thân lỗi
       thành file, và người mở ra tưởng transcript của mình hỏng. */
    return json(res, 404, {
      loi: `bản ghi \`${slug}\` chưa có transcript. Mở bản ghi rồi bấm `
        + `"Sinh transcript" — xong thì mục Phụ đề ở menu Tải xuống sẽ sáng.`,
    })
  }
  const byte = docHienVat(String(hv.sha256 ?? ""))
  if (!byte) {
    return json(res, 404, {
      loi: `transcript của \`${slug}\` có trong bản ghi nhưng KHÔNG có byte `
        + `trong kho hiện vật (sha \`${String(hv.sha256).slice(0, 12)}…\`).`,
    })
  }
  const vtt = Buffer.isBuffer(byte) ? byte.toString("utf8") : String(byte)
  const d = BANG.dang[dang] ?? {}

  /* `goc` = ĐÚNG BYTE đã có, đuôi `.vtt`. Đổi nó thành `.srt` là trả một thứ
     khác mang tên bản gốc — đúng loại nói dối mà bảng khai cấm. */
  if (dang === "goc") {
    return traFile(res, 200, vtt, { mime: "text/vtt", ten: slug + ".vtt" })
  }
  if (dang === "srt") {
    return traFile(res, 200, vttSangSrt(vtt), { mime: d.mime, ten: slug + ".srt" })
  }
  if (dang === "txt") {
    return traFile(res, 200, vttSangTxt(vtt), { mime: d.mime, ten: slug + ".txt" })
  }
  if (dang === "docx") {
    return docx(slug, vttSangTxt(vtt)).then((b2) =>
      traFile(res, 200, b2, { mime: d.mime, ten: slug + ".docx" }))
  }
  return loi422(res, "transcript", dang)
}

/* ═══ GET /api/xuat/<loai>/<slug>?dang=… ═════════════════════════════════ */
export async function cuaXuat(req, res, loai, slug, dang) {
  if (!laSlug(slug)) return json(res, 400, { loi: "slug không hợp lệ" })
  if (!dangChoLoai(loai).includes(dang)) return loi422(res, loai, dang)

  /*
   * TRANSCRIPT KHÔNG PHẢI MỘT BẢN GHI — nên nó phải rẽ TRƯỚC phép tra kho.
   *
   * Bug chủ dự án bắt 2026-09-06 (ảnh chụp): bấm *Phụ đề* ⇒ trình duyệt lưu
   * về `<slug>.json` chứa `{"loi":"không có transcript/<slug>"}`. Tức cửa trả
   * 404 và trình duyệt ngoan ngoãn lưu THÂN LỖI thành file — người mở ra thấy
   * JSON và tưởng transcript của mình hỏng.
   *
   * Gốc: `xuat-dang.json` khai `theo_loai.transcript` từ `T08-33`, nhưng mã
   * chỉ biết `khoDoc([loai])` — mà transcript sống như một HIỆN VẬT
   * `text/vtt` gắn trên bản ghi video, không như một hàng trong kho. Bảng
   * khai hứa một dạng mã chưa bao giờ cài; `T03-121` là thứ đầu tiên dựng
   * đường tới nó nên tới hôm nay mới lộ.
   */
  if (loai === "transcript") return xuatTranscript(res, slug, dang)

  /* `khoDoc(loai)` trả MỌI bản của loại đó rồi lọc theo slug — cùng đường mà
     `articles.mjs` dùng, nên cửa này không dựng một phép đọc kho thứ hai. */
  const b = khoDoc([loai]).find((x) => x.slug === slug)
  if (!b) return json(res, 404, { loi: `không có ${loai}/${slug}` })
  const than = String(b.than ?? "")
  const d = BANG.dang[dang] ?? {}
  const ten = `${slug}${d.duoi ?? ""}`

  /*
   * `goc` cho ban ghi VAN BAN = NGUYEN FILE `.md`, CO frontmatter.
   *
   * Chu du an chot 2026-09-06. Luc hoi toi cho day la *hai ten cho mot thu*
   * — SAI: `md` tra THAN BAI, `goc` tra NGUYEN FILE. Nguoi muon mang ban ghi
   * sang mot kho khac can frontmatter, va mot `.md` mat frontmatter la mot
   * bai mat danh tinh (`id` · `nguon` · `category` · `concepts`).
   *
   * Dung lai tu `fm` + `than`, KHONG doc file tren dia: `FR-034` chot DB la
   * NGUON va file la export, nen doc dia la doc mot ban co the da cu.
   */
  /*
   * `in` — TRANG IN SACH, trinh duyet tu dung PDF (`T03-117`).
   *
   * Khong render PDF o may chu. Hai ly do do duoc: (1) moi thu vien PDF
   * server keo theo phong nhung, va tieng Viet co dau la cho chung vo truoc
   * tien; (2) trinh duyet da co bo dung PDF hoan chinh, dung phong he thong,
   * 0 phu thuoc them.
   *
   * Dat o CUA XUAT chu khong o `trang.mjs`: site khong co route theo tung
   * bai (chi co route theo MAN), nen dat o do phai them mot duong dinh tuyen
   * moi. Cua nay da phan giai duoc ban ghi, va bang khai da liet `in` la mot
   * dang — nen no la nha san co.
   *
   * Than do bang `md()`? KHONG — day la may chu, khong co `md()` cua FE. Do
   * bang the `<pre>` va `white-space: pre-wrap`: trang in can DOC duoc, va
   * chu nguyen ban giu dung xuong dong cua tac gia.
   */
  if (dang === "in") {
    const LF = String.fromCharCode(10)
    const tieu = String(b.fm?.title ?? slug)
    const esc2 = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    const html = [
      "<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\">",
      "<title>" + esc2(tieu) + "</title>",
      /*
       * WO-095 · Kiểu chữ để ĐỌC TRÊN GIẤY, và luật NGẮT TRANG.
       *
       * Chữ CÓ CHÂN cho thân bài: bản in là để đọc dài, và đây là chỗ serif
       * hơn sans thật sự, khác với trên màn.
       *
       * Bốn luật ngắt trang là thứ quyết định bản PDF trông có được chăm hay
       * không: `orphans/widows` chặn một dòng lạc sang trang, `break-after`
       * chặn tiêu đề rơi một mình ở cuối trang, `break-inside` chặn bảng và
       * khối mã bị cắt đôi.
       */
      "<style>",
      "@page{margin:18mm 16mm}",
      "body{max-width:46em;margin:2rem auto;padding:0 1rem;color:#111;",
      "font:12pt/1.65 Georgia,'Times New Roman',serif;",
      "orphans:3;widows:3}",
      "h1{font:600 1.7rem/1.25 system-ui,'Segoe UI',sans-serif;margin:0 0 .3rem}",
      "h2,h3,h4{font-family:system-ui,'Segoe UI',sans-serif;line-height:1.3;",
      "margin:1.6em 0 .5em;break-after:avoid;page-break-after:avoid}",
      "h2{font-size:1.25rem}h3{font-size:1.08rem}h4{font-size:1rem}",
      ".m{color:#666;font-size:.82rem;margin:0 0 1.6rem;",
      "font-family:system-ui,sans-serif;border-bottom:1px solid #ddd;",
      "padding-bottom:.6rem}",
      "p{margin:0 0 .8em}",
      "ul,ol{margin:0 0 .9em;padding-left:1.4em}li{margin:.2em 0}",
      "blockquote{margin:1em 0;padding:.1em 1em;border-left:3px solid #ccc;",
      "color:#444}",
      "table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.92em;",
      "break-inside:avoid;page-break-inside:avoid}",
      "th,td{border:1px solid #bbb;padding:.45em .6em;text-align:left;",
      "vertical-align:top}th{background:#f2f2f2;font-weight:600}",
      "pre{background:#f6f6f6;padding:.7em .9em;overflow-x:auto;",
      "font:10.5pt/1.5 ui-monospace,Consolas,monospace;",
      "break-inside:avoid;page-break-inside:avoid}",
      "code{font:.92em ui-monospace,Consolas,monospace;background:#f0f0f0;",
      "padding:.1em .3em;border-radius:3px}",
      "pre code{background:none;padding:0}",
      "a{color:#0b57a4}",
      "@media print{body{margin:0;max-width:none}a{color:#111;",
      "text-decoration:none}a[href^=http]::after{content:' (' attr(href) ')';",
      "font-size:.8em;color:#666}}",
      "</style></head><body>",
      "<h1>" + esc2(tieu) + "</h1>",
      "<p class=\"m\">" + esc2(loai) + " · " + esc2(slug)
        + " · " + esc2(b.fm?.analyzed_at ?? "") + "</p>",
      mdSangHtml(than),
      "<script>window.addEventListener('load',()=>window.print())<\/script>",
      "</body></html>",
    ].join(LF)
    res.writeHead(200, { "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store" })
    return res.end(html)
  }
  /*
   * WO-096 · `pdf` — PDF THẬT do máy chủ dựng bằng `typst`.
   *
   * Khác `in`: `in` trả một trang HTML để TRÌNH DUYỆT tự dựng PDF; `pdf` trả
   * thẳng một file. Chủ dự án 2026-09-10: *"cố gắng sử dụng latex mà làm …
   * font latex xuất ra pdf đó"* — và `s1` đã chọn Typst vì nó là MỘT binary,
   * dùng font **New Computer Modern**, cùng họ với mẫu.
   *
   * Chú thích đầu file nói *"không render PDF ở máy chủ vì tiếng Việt có dấu
   * là chỗ chúng vỡ trước tiên"*. Lo ấy ĐÚNG với các thư viện PDF thời đó, và
   * đã được ĐO LẠI 2026-09-10: NCM phủ 100% dấu tiếng Việt (74/74 ký tự
   * round-trip qua PDF, `pypdf`). Nên nhánh này tồn tại được — nhưng `in` GIỮ
   * NGUYÊN làm đường không phụ thuộc binary.
   */
  if (dang === "pdf") {
    const bin = timTypst()
    if (!bin) {
      return json(res, 503, {
        loi: "chưa cài `typst` trên máy chủ nên không dựng được PDF. "
          + "Cài: `winget install Typst.Typst` (hoặc đặt `TYPST_BIN`). "
          + 'Trong lúc đó dùng "In" — trình duyệt tự dựng PDF.',
      })
    }
    const tieu = String(b.fm?.title ?? slug)
    const dau = [
      '#set document(title: ' + JSON.stringify(tieu) + ')',
      '#set page(paper: "a4", margin: (x: 20mm, y: 22mm),',
      '  numbering: "1", footer-descent: 8mm)',
      '#set text(font: "New Computer Modern", size: 11pt, lang: "vi")',
      '#set par(justify: true, leading: .72em)',
      '#show heading: it => block(above: 1.4em, below: .7em, it)',
      '#align(center)[#text(size: 17pt, weight: 600)[' + tieu.replace(/[\\[\]#$@]/g, "") + ']]',
      '#align(center)[#text(size: 9pt, fill: luma(90))['
        + [loai, slug, String(b.fm?.analyzed_at ?? "")].join(" · ").replace(/[\\[\]#$@]/g, "")
        + ']]',
      '#v(1em)',
    ].join(NLT)
    /*
     * Trần thời gian 30 s và giết tiến trình khi quá — một `typst` treo giữ
     * luôn một request, và không ai gỡ nó ra.
     */
    const r = spawnSync(bin, ["compile", "--format", "pdf", "-", "-"], {
      input: dau + NLT + NLT + mdSangTypst(than),
      maxBuffer: 64 * 1024 * 1024, timeout: 30000, killSignal: "SIGKILL",
    })
    if (r.status !== 0 || !r.stdout?.length) {
      return json(res, 500, {
        loi: "typst không dựng được PDF: "
          + String(r.stderr ?? r.error ?? "").slice(0, 400),
      })
    }
    return traFile(res, 200, r.stdout, { mime: d.mime, ten })
  }
  if (dang === "goc") {
    /* HOTFIX PM 2026-09-06 (ô backlog M08 "goc trả .md"): với bản ghi CÓ HIỆN
     * VẬT (tai-lieu · video mp4), "File gốc" = BYTE MEDIA — chuyển hướng sang
     * đường phục vụ hiện vật sẵn có (đúng mime + ten_goc, một cửa, không đường
     * đọc thứ hai). Nhánh .md-nguyên-file bên dưới GIỮ cho bản ghi VĂN BẢN —
     * đó là chủ đích (md = thân · goc = nguyên file kèm frontmatter).
     * URL-only (video không byte) ⇒ 422 nói thẳng, không đưa nhầm .md. */
    const mangMedia = Array.isArray(b.fm?.media) ? b.fm.media
      : (b.fm?.media ? [b.fm.media] : [])
    /*
     * BỎ hiện vật do MÁY DẪN XUẤT trước khi chọn "bản gốc".
     *
     * Bug đo được 2026-09-06: `GET /api/xuat/video/<slug>?dang=goc` trả về
     * **file `.vtt` 20 KB** — transcript do ASR sinh — dán nhãn *bản gốc của
     * video*. Gốc: `media[0]` với một video ĐĂNG KÝ BẰNG URL là phần tử duy
     * nhất có mặt, và nó là transcript.
     *
     * Người bấm "bản gốc" muốn thứ họ ĐÃ NẠP. Đưa một sản phẩm máy sinh và
     * gọi nó là bản gốc đúng là *"nói dối bằng một cái nút"* mà chính
     * `xuat-dang.json` cấm.
     *
     * Danh sách mime dẫn xuất đọc từ `media-mime.json` (`chi_dan_xuat`) —
     * MỘT nguồn khai, dùng chung với FE.
     */
    const danXuat = new Set((MIME_BANG.loai ?? [])
      .filter((l) => l?.chi_dan_xuat).map((l) => String(l.mime)))
    const goc1 = mangMedia.find((m) => m && !danXuat.has(String(m?.mime)))
    const sha = String(goc1?.sha256 ?? "")
    if (loai === "tai-lieu" || loai === "video") {
      if (/^[0-9a-f]{64}$/.test(sha)) {
        /*
         * WO-091 · CÕNG THEO `?dang=goc`.
         *
         * Chuyển hướng trần làm RƠI Ý ĐỊNH: cửa hiện vật chỉ còn thấy một
         * `sha256`, và với PDF (`xem_truoc: iframe`) nó trả `inline` — nên bấm
         * *Bản gốc* mở thêm một tab thay vì tải. Đó là nửa còn lại của bug;
         * sửa mỗi cửa kia là sửa nửa đường.
         */
        res.writeHead(302, { location: "/api/articles/media/" + sha + "?dang=goc",
          "cache-control": "no-store" })
        return res.end()
      }
      return json(res, 422, { loi: `bản ghi \`${slug}\` không có file trong kho`
        + ` — video đăng ký bằng URL thì xem/tải ở nguồn, không có "File gốc".` })
    }
    const fm = b.fm ?? {}
    const LF = String.fromCharCode(10)
    const dong = Object.entries(fm).map(([k, v]) =>
      k + ": " + (Array.isArray(v) ? "[" + v.join(", ") + "]" : JSON.stringify(v)))
    const noi = "---" + LF + dong.join(LF) + LF + "---" + LF + LF + than
    return traFile(res, 200, noi, { mime: "text/markdown", ten: slug + ".md" })
  }
  if (dang === "md") return traFile(res, 200, than, { mime: d.mime, ten })
  if (dang === "txt") return traFile(res, 200, lotMd(than), { mime: d.mime, ten })
  if (dang === "docx") {
    return traFile(res, 200, await docx(slug, than), { mime: d.mime, ten })
  }
  return loi422(res, loai, dang)
}

/* ═══ GET /api/xuat-nhap/<job_ulid>?dang=… ═══════════════════════════════ */
export async function cuaXuatNhap(req, res, ulid, dang) {
  if (!dangChoLoai("nhap").includes(dang)) return loi422(res, "nhap", dang)
  const h = loiXemNhap(ulid)
  if (!h) return json(res, 404, { loi: `không có nháp ${ulid}` })

  const ban = String(h.ban_hien_tai || h.ban_goc_ai || "")
  const { than } = { than: ban.startsWith("---")
    ? ban.split("---").slice(2).join("---").trim() : ban }
  const dau = dauNhap(h)
  const d = BANG.dang[dang] ?? {}
  const ten = `nhap-${ulid.slice(0, 10)}${d.duoi ?? ""}`

  if (dang === "goc") {
    // Nhap: `goc` = NGUYEN ban model sinh, frontmatter con nguyen. Dau nhap
    // VAN dong — file roi khoi may thi cai vet di cung no, ke ca ban goc.
    return traFile(res, 200, "<!-- " + dau + " -->" + String.fromCharCode(10) + ban,
      { mime: "text/markdown", ten: `nhap-${ulid.slice(0, 10)}.md` })
  }
  if (dang === "md") {
    return traFile(res, 200, `> ${dau}\n\n${than}`, { mime: d.mime, ten })
  }
  if (dang === "txt") {
    return traFile(res, 200, `${dau}\n\n${lotMd(than)}`, { mime: d.mime, ten })
  }
  if (dang === "docx") {
    return traFile(res, 200, await docx(ten, `**${dau}**\n\n${than}`),
      { mime: d.mime, ten })
  }
  return loi422(res, "nhap", dang)
}
