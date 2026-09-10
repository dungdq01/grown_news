#!/usr/bin/env node
/**
 * T03-108 — BẬT nút "Sinh transcript" + xem transcript trong cửa sổ đọc.
 *
 * `T03-92` dựng nút ở trạng thái disabled-CÓ-LÝ-DO (*"video cần bản chữ trước
 * khi chưng cất — đường đó chưa mở"*). C4b mở đường đó: `T12-16` cho worker
 * chạy `sinh-transcript` thật, `T01-45` cho `.vtt` một dòng mime + magic
 * `WEBVTT`. Đơn vị này bật nút và cho người XEM kết quả.
 *
 * ĐO NGUỒN FE, không đo DOM — cùng lý do `tab-theo-doi-chung-cat`: nút sống
 * trong cửa sổ đọc và chỉ hiện sau một chuỗi bấm; dựng chuỗi đó trong một cổng
 * tĩnh là dựng một bản mô phỏng trình duyệt, và bản mô phỏng là thứ sẽ lệch
 * khỏi trình duyệt thật. Vế "bấm chạy được" là ảnh chụp — NGƯỜI chấm.
 *
 * HAI FILE nguồn: cụm nút ở `multiwindow` (nó trong thanh tiêu đề mọi cửa sổ),
 * thân hộp thoại + tab transcript ở chunk `cctab` (`FR-062` — mã của một thứ
 * chưa ai bấm không thuộc đường tải đầu của người đọc báo).
 *
 * ĐỎ_KHI  nút video còn `bat: false` · bấm lần một đã gửi · gửi sai `loai` ·
 *         không lọc `.vtt` theo mime của bảng khai · cue không chèn `[t=..]` ·
 *         `tai-lieu` bị đổi hành vi kèm
 * XANH_KHI sáu vế trên đo được trên nguồn thật, và suite web còn xanh
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
await napRender()

const NL = String.fromCharCode(10)
/** Bỏ chú thích trước khi đo: chú thích DẪN LẠI mã cũ để nói vì sao nó sai. */
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)

const doc = (...p) => chiMa(readFileSync(join(GOC, ...p), "utf8"))
const MW = doc("web", "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts")
const CC = doc("web", "plugins", "cctab", "src", "cctab.inline.ts")
const TS = MW + NL + CC
const MM = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))

/** Thân một hàm, đếm ngoặc — trả "" khi không tìm được. */
function than(src, mau) {
  const i = src.search(mau)
  if (i < 0) return ""
  const b = src.indexOf("{", i)
  let sau = 0
  for (let k = b; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}") { sau--; if (!sau) return src.slice(b, k + 1) }
  }
  return ""
}

console.log(`${NL}1 · Nút của bản ghi VIDEO đã BẬT${NL}`)

const bang = than(MW, /HANH_DONG_CHUNG_CAT\s*=/)
ok(bang.length > 0, "tìm được bảng `HANH_DONG_CHUNG_CAT`")

const dongVideo = (bang.match(/video:\s*\{[^}]*\}/) ?? [""])[0]
ok(/bat:\s*true/.test(dongVideo),
  "hàng `video` khai `bat: true` — nút bấm được",
  `hàng hiện tại: ${dongVideo.replace(/\s+/g, " ").slice(0, 90)} — `
  + "`T03-92` để `false` kèm lý do *đường đó chưa mở*; C4b mở rồi, và một nút "
  + "disabled kèm lý do đã hết đúng là một câu nói sai với người dùng")

// SCR-24 rút nhãn thành `♫ Transcript` (chủ dự án: *"nút cần gọn gàng"*).
// Bất biến ĐÚNG không phải bốn chữ `Sinh transcript` — chính câu dưới đây nói
// ra nó: nhãn phải nói TRANSCRIPT, và KHÔNG được là `Chưng cất`. Khoá đúng
// chuỗi thì mỗi lần rút chữ là một lần cổng đỏ oan cho một dòng đúng.
ok(/transcript/i.test(dongVideo) && !/Chưng cất/.test(dongVideo),
  "  nhãn video nói TRANSCRIPT, không phải `Chưng cất`",
  "video phải qua bản chữ trước; gộp hai nhãn là hứa một việc khác việc sẽ chạy")

/*
 * CA KHÔNG ĐƯỢC VỠ. Bật một hàng của bảng rất dễ thành "bật cả bảng": đổi
 * `HANH_DONG_CHUNG_CAT` thành `{bat: true}` cho mọi loại thì vế trên xanh, và
 * `article`/`paper`/`repo` mọc một cái nút chúng không có đường chạy.
 */
for (const loai of ["article", "paper", "repo", "announcement", "docs"]) {
  const d = (bang.match(new RegExp(loai + ":\\s*\\{[^}]*\\}")) ?? [""])[0]
  ok(/nhan:\s*""/.test(d), `  \`${loai}\` vẫn KHÔNG có nút`,
    `hàng: ${d.replace(/\s+/g, " ").slice(0, 70)} — loại này không có đường `
    + "sinh transcript, nên một cái nút ở đó là một cú bấm không dẫn tới đâu")
}

console.log(`${NL}2 · Bấm lần MỘT không gửi gì — lần HAI mới gửi${NL}`)

const moPhieu = than(CC, /async function moPhieuTranscript\b/)
ok(moPhieu.length > 0, "có hàm mở phiếu xác nhận cho `sinh-transcript`",
  "thiếu ⇒ hoặc nút gửi ngay (0 lần xác nhận), hoặc nút không làm gì")

ok(!/fetch\(/.test(moPhieu),
  "hàm MỞ PHIẾU không `fetch` — lần bấm thứ nhất 0 request",
  "gửi ngay lúc bấm là bỏ mất chỗ duy nhất người kịp đổi ý, và job này TIÊU "
  + "TIỀN THẬT (đo: ~217đ một audio)")

const gui = than(CC, /async function guiTranscript\b/)
ok(gui.length > 0, "có hàm GỬI riêng, gọi từ nút của phiếu")
ok(/["'`]sinh-transcript["'`]/.test(gui),
  "gửi `loai: \"sinh-transcript\"`",
  "gửi `chung-cat-mot-nguon` cho một video là xếp hàng một việc worker sẽ "
  + "chạy trên một bản ghi KHÔNG có chữ — nó chết ở giai đoạn đọc nguồn")
ok(/\/api\/job/.test(gui) && !/8790/.test(gui),
  "gọi `POST /api/job` của LÕI, không gọi thẳng `:8790`",
  "khoá dịch vụ ở env SERVER và không bao giờ ra trình duyệt (`M12-R7`)")
/*
 * ĐỔI HỢP ĐỒNG hai lần, và vế này phải theo:
 *   ① chủ dự án 2026-09-05: bỏ ULID + đường dẫn khỏi toast (không đọc nổi)
 *   ② `T03-112`: chỗ theo dõi là CỬA SỔ SONG SONG, không phải một link
 * Nên câu hỏi *"người xem việc mình vừa xếp ở đâu"* nay trả lời bằng cửa sổ.
 * Giữ vế cũ là đòi một cái link mà chỉ đạo vừa yêu cầu bỏ.
 */
ok(/moCuaSoViec\(/.test(gui),
  "gửi xong ⇒ MỞ CỬA SỔ theo dõi (T03-112), không dán link vào toast",
  "không mở cửa sổ thì người không thấy tiến trình ở đâu")
ok(!/viec_id.{0,40}mở |\/chung-cat\/\?job=/.test(gui),
  "  và toast KHÔNG dán ULID/đường dẫn",
  "một ULID 32 ký tự trong toast tự tắt là thứ không ai đọc kịp, cũng không "
  + "copy nổi — chủ dự án đã yêu cầu bỏ hai lần")

console.log(`${NL}3 · Xem transcript — cue theo mốc, chèn được mốc [t=..]${NL}`)

const dongVtt = MM.loai.find((l) => l.duoi === ".vtt")
ok(!!dongVtt, `bảng khai có \`.vtt\` (mime \`${dongVtt?.mime}\`)`,
  "không có dòng ⇒ hiện vật transcript rơi vào `mac_dinh` và không phép lọc "
  + "nào nhận ra nó")

const veTr = than(CC, /function veTranscript\b/)
ok(veTr.length > 0, "có hàm vẽ transcript")
ok(/text\/vtt|\.vtt/.test(veTr) || /text\/vtt|\.vtt/.test(CC),
  "lọc hiện vật transcript theo mime/đuôi `.vtt` của bảng khai",
  "lấy hiện vật ĐẦU TIÊN thì một bản ghi có cả mp4 và vtt sẽ hiện mp4 làm "
  + "transcript")

ok(/\[t=/.test(CC),
  "cue bấm được thì chèn chip `[t=mm:ss]`",
  "mốc thời gian là ĐỊA CHỈ của một câu trong video — không chèn được thì "
  + "người phải gõ tay, và gõ tay là chỗ mốc lệch khỏi transcript")

ok(/(\d+)\s*[/%]\s*60|Math\.floor\([^)]*\/\s*60/.test(CC) || /mmss|phutGiay/.test(CC),
  "  giây → `mm:ss` đổi trong mã, không in số giây trần",
  "`[t=754]` không phải địa chỉ người đọc được, và `validate.py` đối chiếu "
  + "`[t=..]` với thời lượng `.vtt` theo dạng mốc")

console.log(`${NL}3b · SINH TỚI ĐÂU HIỆN TỚI ĐÓ (T12-19 + T03-108)${NL}`)

/*
 * Chỉ đạo: *"nó sinh chữ tới đâu thì show tới đó"*. THỢ tính `tien_do` từ file
 * checkpoint và lộ qua `GET /viec/<id>`; FE chỉ ĐỌC. Vế dưới đây khoá lại
 * chiều đó: FE KHÔNG được tự suy tiến độ từ giai đoạn — giai đoạn là enum bốn
 * nấc, còn cue là số thật.
 */
/* Đo trên CẢ nguồn chunk, không cắt thân bằng đếm ngoặc: phép cắt đó đã trả
 * "" hai lần cho những hàm có thật (WO-048 · WO-051), và một cổng đỏ mà không
 * ai giải thích được là cổng dạy người ta bỏ qua màu đỏ. */
const td = CC
ok(/function veTienDo/.test(CC), "có hàm vẽ tiến độ transcript")
ok(/tien_do/.test(td),
  "đọc `tien_do` do THỢ tính, không tự suy từ giai đoạn",
  "suy từ enum bốn nấc ra một con số câu là bịa một tiến độ")
ok(/cue_xong|giay_xong/.test(td),
  "  hiện SỐ CÂU và MỐC GIÂY đã phiên âm",
  "đây là hai con số đo được; phần trăm thì không")
ok(/textContent/.test(CC),
  "  chữ đổ bằng textContent",
  "transcript do model sinh — không tin được, không cho thành DOM")

console.log(`${NL}4 · Ngân sách byte — thân nằm ở CHUNK, không ở bundle chung${NL}`)

/* Đo THÂN, không đo cái TÊN: `multiwindow` phải nhắc `"veTranscript"` — nó gọi
 * qua cầu `goiChunk("veTranscript", …)`, và một lời gọi là 20 byte chứ không
 * phải 3 KB thân hàm. Bản đầu của vế này cấm cả cái tên, nên nó đỏ trong khi
 * phép dời đã đúng — đo nhầm thứ. */
ok(!/function\s+(veTranscript|guiTranscript)\b|WEBVTT|tr-t/.test(MW),
  "thân transcript KHÔNG ở `multiwindow` (bundle chung)",
  "`FR-061` cấm nới `gn.js`, và mã của một tab chưa ai bấm không thuộc đường "
  + "tải đầu của người chỉ đọc báo")

const AS = await taiSan()
const b = (s) => Buffer.byteLength(s ?? "", "utf8")
for (const [ten, noi] of [["gn.css", AS.gnCss], ["gn.js", AS.gnJs]]) {
  // FR-068: `gn.css` 104448, `gn.js` giữ 102400 — trần theo TỪNG file.
  const tran = ten === "gn.css" ? TRAN.css : TRAN.js
  ok(b(noi) <= tran, `${ten} ${b(noi)}/${tran} (dư ${tran - b(noi)})`,
    "`FR-061` nới trần TẢI ĐẦU của trang có chunk, KHÔNG nới bundle CHUNG")
}

chot("nút video bật · xác nhận trước khi tiêu tiền · transcript xem được, "
  + "chèn được mốc")
