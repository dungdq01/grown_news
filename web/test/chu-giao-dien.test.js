#!/usr/bin/env node
/**
 * FR-029 · QUY ƯỚC CHỮ GIAO DIỆN — không nói kiến trúc với người dùng.
 *
 * VÌ SAO CÓ FILE NÀY: người dùng chỉ vào bốn chỗ trên màn hình và nói *"truy tìm
 * tất cả comment hay text guide trên web để xóa đi, thiếu chuyên nghiệp quá"*.
 * Bốn chỗ đó là triệu chứng, không phải bệnh. Bệnh là repo này viết tài liệu
 * RẤT tốt cho người sửa code, rồi để văn tài liệu tràn ra màn hình người dùng:
 *
 *     "Server tự áp `origin: manual` và `review_status: draft`… bài vẫn phải
 *      qua đủ 9 cổng validate như mọi bài khác."
 *
 * Câu đó đúng từng chữ và vô dụng với người đọc báo. Sửa tay một lượt thì lần
 * sau lại có câu mới — nên quy ước phải thành CỔNG, không phải lời dặn.
 *
 * LUẬT: chữ HIỆN RA trên trang không được chứa
 *   · đường dẫn trong kho (`kb/…`, `_inbox/`, `_recycle/`)
 *   · tên file nội bộ (`validate.py`, `frontmatter.schema.json`, `*.yaml`)
 *   · mã module / rule / FR (`M02-R3`, `B-B1`, `FR-011`, `05_intake`)
 *   · tên trường dữ liệu (`review_status`, `insight_new`, `origin:`…)
 *   · tên công cụ nội bộ (`source-distiller`, `gate.py`)
 *   · đếm bước kỹ thuật ("6 pass", "9 cổng")
 *
 * BA MIỄN TRỪ, và cả ba đều CÓ LÝ DO chứ không phải cho tiện:
 *
 *   1 `title=` / `aria-label` — FR-027j đã chốt phép này: câu giải thích ra khỏi
 *     màn, vào tooltip. Tra được khi cần, không chiếm chỗ.
 *   2 `.np-cmd` — lệnh để COPY. Đó là cơ chế của tính năng, không phải chú
 *     thích. Xoá đi là gãy luồng "dán link".
 *   3 comment HTML/JS — viết cho người sửa file, trình duyệt không hiện.
 *
 * Miễn trừ 1 và 2 là chỗ dễ bị lạm dụng nhất: nhét câu văn vào `title=` rồi coi
 * như đã dọn. Nên có thêm phép kiểm NGƯỢC ở mục 3 — tooltip cũng phải ngắn.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tatCaTrang } from "./_render.mjs"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
// FR-034/C5 · nguồn đổi từ output build sang renderTrang: map "đường trang" →
// HTML, cả hai bản real (kho tạm qua DB) + mock. Assertion giữ nguyên.
const TRANG_MAP = await tatCaTrang()
const docTrang = (t) => TRANG_MAP.get(t)
let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

// DANH SÁCH ĐÓNG. Thêm một mẫu ⇒ phải sửa file này, tức có người đọc lại luật.
const CAM = [
  ["đường dẫn trong kho", /\bkb\/[a-z_<]|_inbox\/|_recycle\//],
  ["tên file nội bộ", /frontmatter\.schema\.json|validate\.py|thresholds\.yaml|concepts\.yaml|categories\.yaml/],
  ["mã module/rule/FR", /\bM0\d(?:[- ]R\d)?\b|\bB-[BC]\d\b|\bFR-\d{3}\b|\b0\d_[a-z]+\b/],
  ["tên trường dữ liệu", /review_status|origin:|insight_new|skill_installed|review_minutes|concepts_proposed|url_normalized|concept_merge_min|credibility_max/],
  ["tên công cụ nội bộ", /source-distiller|gate\.py/],
  ["đếm bước kỹ thuật", /\d+ pass\b|\d+ cổng\b/],
]

/** Chữ NGƯỜI DÙNG THẤY: bỏ comment, script/style, tooltip, và khối lệnh copy. */
function chuHien(h) {
  h = h.replace(/<!--[\s\S]*?-->/g, "")
  h = h.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "")
  h = h.replace(/<div class="np-cmd">[\s\S]*?<\/div>/g, " ")
  h = h.replace(/\s(?:title|aria-label|alt|placeholder|data-i18n|data-cmd)="[^"]*"/g, " ")
  return h.replace(/<[^>]+>/g, " ")
}

console.log("\nQuy ước chữ giao diện — màn hình nói việc, không nói kiến trúc\n")

console.log("1 · Mọi trang đã build\n")

const trang = [...TRANG_MAP.keys()]
ok(trang.length > 0, `có ${trang.length} trang để soi`, "render không ra trang nào")

for (const t of trang) {
  const chu = chuHien(docTrang(t))
  const thay = []
  for (const [ten, re] of CAM) {
    const m = chu.match(new RegExp(re, "g"))
    if (m) thay.push(`${ten}: ${[...new Set(m)].slice(0, 4).join(", ")}`)
  }
  ok(thay.length === 0, `/${t.replace(/index\.html$/, "")}`, thay.join(" · "))
}

console.log("\n2 · Chữ do script sinh ra cũng là chữ trên màn\n")

/**
 * Soi NGUỒN theo DÒNG, không soi bundle đã gói.
 *
 * Bản đầu tách chuỗi khỏi bundle bằng regex và SAI — không lex nổi JS bằng
 * regex: nháy đơn lồng trong nháy kép (`'[data-f="insight_new"]'`), `//` trong
 * URL, regex literal… Một dấu nháy lệch là "chuỗi" nuốt luôn phần mã phía sau,
 * rồi cổng chỉ thẳng vào `body.insight_new = …` — một dòng GÁN không bao giờ
 * lên màn hình. Phép kiểm báo động giả thì sẽ bị tắt, nên phải bỏ hướng đó.
 *
 * Hướng thay: chỉ xét dòng TRÔNG NHƯ CHỮ HIỂN THỊ — có thẻ HTML hoặc có dấu
 * tiếng Việt. `body.insight_new = ph.querySelector(...)` không có cả hai.
 *
 * Đây là heuristic, và nó sai về phía AN TOÀN: bỏ sót một câu thuần ASCII
 * không dấu, chứ không bao giờ tố oan một dòng mã. Mục 1 (quét trang đã build)
 * mới là lưới chính; mục này bắt phần JS chèn vào sau khi trang tải.
 */
// Dấu tiếng Việt, HOẶC một THẺ HTML thật (`<p `, `</em>`). KHÔNG dùng `[<>]`
// trần: nó bắt cả `=>` của arrow function và `<HTMLInputElement>` của generic,
// tức mọi dòng mã đều thành "chữ".
const LA_CHU = /<\/?[a-z][a-z0-9-]*[\s/>]|[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i
const dongChu = []
for (const f of [
  "plugins/multiwindow/src/scripts/multiwindow.inline.ts",
  // FR-034/C5 · template render sống ở web/render/trang.mjs (port từ emitter).
  "render/trang.mjs",
]) {
  // Khối `/* … */` phải bỏ TRƯỚC khi tách dòng: repo viết khối kiểu
  // `/* ═══ TIÊU ĐỀ ═══` rồi các dòng sau là văn xuôi TRẦN, không mở bằng `*`.
  const src = readFileSync(join(WEB, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  for (const d of src.split("\n")) {
    const t = d.trim()
    if (t.startsWith("//")) continue
    // Chữ hiển thị = trông như chữ VÀ nằm trong nháy. Dòng mã thuần
    // (`body.insight_new = …`) trượt cả hai.
    if (!LA_CHU.test(t) || !/["'`]/.test(t)) continue
    dongChu.push(t
      // `data-f="insight_new"` là định danh cho máy (như `data-slug`);
      // `title=` là tooltip — miễn trừ 1, soi riêng ở mục 3.
      // `[\s[]` để bắt cả trong MARKUP (` data-f=…`) lẫn trong SELECTOR
      // (`'[data-f="insight_new"]'`) — cùng một định danh, hai chỗ dùng.
      .replace(/[\s[][a-zA-Z-]+="[^"]*"/g, " ")
      // `ban.credibility_max` là ĐỌC DỮ LIỆU, không phải chữ. Thứ hiện ra là
      // GIÁ TRỊ ("plausible"), không phải tên trường.
      //
      // CHỪA phần mở rộng file: `concepts.yaml` trông y hệt một truy cập thuộc
      // tính, và bóc nó đi thì `"Không đọc được …/concepts.yaml"` lọt lưới.
      // Đã lọt thật một lần, phát hiện khi soi tay.
      .replace(/\??\.(?!(?:yaml|json|md|py|sqlite)\b)[a-z_]\w*/g, " "))
  }
}
ok(dongChu.length > 50, `${dongChu.length} dòng trông như chữ hiển thị`)
const chuFE = dongChu.join("\n")

for (const [ten, re] of CAM) {
  const m = chuFE.match(new RegExp(re, "g"))
  ok(!m, `mã FE không sinh ${ten}`, m ? [...new Set(m)].slice(0, 5).join(", ") : "")
}

console.log("\n3 · Tooltip là chỗ TRA, không phải chỗ giấu bài văn\n")

// Miễn trừ `title=` chỉ đứng vững nếu tooltip vẫn ngắn. Nhét nguyên đoạn vào đó
// rồi coi như đã dọn thì màn hình sạch mà thông tin vẫn không tới được ai —
// tooltip dài không đọc nổi trên di động và không có ở bàn phím.
const NGUONG = 220
const dai = []
for (const t of trang) {
  const h = docTrang(t).replace(/<!--[\s\S]*?-->/g, "")
  for (const m of h.matchAll(/\stitle="([^"]{40,})"/g)) {
    if (m[1].length > NGUONG) dai.push(`${t}: ${m[1].length} ký tự — "${m[1].slice(0, 60)}…"`)
  }
}
ok(dai.length === 0, `không tooltip nào quá ${NGUONG} ký tự`,
   [...new Set(dai)].slice(0, 3).join(" | "))

console.log("\n3b · Chữ phụ trợ trên màn — đo MẬT ĐỘ, không đếm phần tử\n")

/*
 * FR-031 · Người dùng: "bỏ hết tất cả các mô tả - comment thừa - nhìn rác web",
 * "ít chữ nhiều hiệu ứng".
 *
 * Mục 1 và 2 cấm chữ nói KIẾN TRÚC. Chúng không chặn được thứ vừa bị phàn nàn:
 * văn xuôi hoàn toàn thân thiện, đúng ngữ pháp, và VÔ DỤNG — "địa chỉ gốc; hệ
 * thống tự chuẩn hoá để đếm nguồn độc lập" cạnh một ô đã ghi rõ "URL nguồn".
 *
 * Đo KÝ TỰ, không đếm phần tử: đếm phần tử thì gộp ba câu thành một `<em>` là
 * "giảm" trong khi màn hình không đổi. Ký tự là thứ mắt phải đi qua.
 *
 * Hai ngưỡng, hai lớp lỗi khác nhau:
 *   MỘT_ĐOẠN  chặn đoạn văn — thứ người dùng chỉ vào trong ảnh
 *   MỘT_TRANG chặn tổng — mười câu ngắn cũng là một bức tường chữ
 */
const MOT_DOAN = 80
const MOT_TRANG = 480
const PHU = /<(?:p|span)\s+class="(?:note|np-h)"[^>]*>([\s\S]*?)<\/(?:p|span)>|<em>([\s\S]*?)<\/em>/g
for (const t of trang) {
  // `.rc-act` là NHÃN TRẠNG THÁI của một hàng dữ liệu ("đang dùng"), không phải
  // văn giải thích. Bản đầu của phép kiểm này đếm cả nó, nên `/mock/nap/` đỏ vì
  // kho mẫu có 7 nhãn đang dùng — tức phép kiểm phạt màn hình vì CÓ DỮ LIỆU.
  // Đó là báo động giả, và phép kiểm báo động giả thì sẽ bị tắt.
  const h = docTrang(t)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<span class="rc-act">[\s\S]*?<\/span>/g, " ")
  const doan = [...h.matchAll(PHU)]
    .map((m) => (m[1] ?? m[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
  const qua = doan.filter((d) => d.length > MOT_DOAN)
  const tong = doan.reduce((s, d) => s + d.length, 0)
  ok(qua.length === 0 && tong <= MOT_TRANG,
     `/${t.replace(/index\.html$/, "")} — ${doan.length} đoạn, ${tong} ký tự`,
     qua.length
       ? `đoạn quá ${MOT_DOAN} ký tự: "${qua[0].slice(0, 70)}…"`
       : `tổng ${tong} > ${MOT_TRANG} — cắt bớt, đừng nâng ngưỡng`)
}

console.log("\n4 · Ba miễn trừ vẫn còn nguyên vẹn\n")

// Nếu ai đó "dọn" bằng cách xoá luôn khối lệnh copy thì luồng dán link gãy —
// phép kiểm này canh chiều ngược lại của cùng một luật.
// FR-038/C6a · man `/nap/` chung DA BO; khoi lenh copy sang man nap BAI VIET.
// `?? ""` de cong BAO thay vi CHET: `docTrang` tra `undefined` khi duong sai,
// va mot TypeError o day giet ca file test thay vi do mot phep kiem.
const nap = docTrang("bai-viet/nap/index.html") ?? ""
ok(/<div class="np-cmd">/.test(nap),
   "màn Nạp nguồn còn khối lệnh để copy",
   "lệnh là CƠ CHẾ của tính năng, không phải chú thích — dọn nhầm là gãy luồng")
ok((nap.match(/data-cmd/g) ?? []).length >= 2,
   `còn ${(nap.match(/data-cmd/g) ?? []).length} lệnh copy được`)

if (loi) {
  console.log(`\nFAIL · ${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · màn hình không nói kiến trúc; tooltip ngắn; lệnh copy còn nguyên\n")
