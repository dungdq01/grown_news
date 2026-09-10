#!/usr/bin/env node
/**
 * WO-022 — id video phải đi qua NGUYÊN VẸN, kể cả chữ hoa.
 *
 * `idVideo()` hạ CẢ url về chữ thường rồi mới bóc id. Chữ thường cần cho MỘT
 * việc — so tên miền — nhưng nó được áp cho cả phần id, và id YouTube là
 * base64url PHÂN BIỆT hoa–thường.
 *
 * VÌ SAO KHÔNG CỔNG NÀO KÊU: `dqw4w9wgxcq` vẫn khớp `^[A-Za-z0-9_-]{11}$`.
 * `id_mau` hỏi "id có ĐÚNG HÌNH DẠNG không" và câu trả lời là CÓ. Id sai vẫn
 * đúng hình dạng. Nên ở đây so TỪNG KÝ TỰ với id kỳ vọng, không so hình dạng.
 *
 * Và không test cũ nào bắt được: ba file nhắc `video_host` đều dùng id toàn chữ
 * thường hoặc toàn chữ số — `tiktok` là số nên `.toLowerCase()` vô hại ở đó. Bug
 * ẩn sau đúng cái host duy nhất miễn nhiễm với nó.
 *
 * CHẠY BYTE ĐÃ BUILD, không chép tay lại hàm: một bản chép luôn đúng vì tôi vừa
 * viết nó, nên nó kiểm bản chép chứ không kiểm thứ người dùng chạy.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { taiSan } from "./_render.mjs"

const { ok, chot } = taoKiem()
const NLJS = String.fromCharCode(10)
const MEDIA = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))

console.log("\n1 · Cắt `idVideo` ra khỏi bundle ĐÃ BUILD\n")

const js = (await taiSan()).gnJsNguon ?? ""
const i = js.indexOf("function idVideo")
// Đóng ngoặc ở cột 0: `idVideo` là khai báo cấp cao nhất, nên `\n}` đầu tiên sau
// nó là dấu đóng của chính nó. Đếm ngoặc thì chắc hơn, nhưng bundle đã minify
// khoảng trắng nào đâu — và một phép cắt sai sẽ lộ ngay ở §2 chứ không im lặng.
const than = i >= 0 ? js.slice(i, js.indexOf("\n}", i) + 2) : ""
ok(than.length > 0, "tìm được thân `idVideo` trong `gn.js`")
ok(/return\s*{/.test(than) && than.includes("id_mau"),
  "  cắt trọn thân hàm (có `return {` và `id_mau`)",
  "cắt hụt ⇒ mọi phép dưới đo một mảnh, không đo hàm")

let idVideo = null
try { idVideo = new Function("MEDIA", than + "\nreturn idVideo")(MEDIA) } catch (e) {
  ok(false, "dựng lại được hàm từ byte đã build", String(e))
}

console.log("\n2 · Id CÓ CHỮ HOA phải đi qua NGUYÊN VẸN\n")

// Id thật, 11 ký tự, có cả hoa lẫn thường. So TỪNG KÝ TỰ — `id_mau` không phân
// biệt được `dQw4w9WgXcQ` với `dqw4w9wgxcq`, và đó chính là chỗ bug sống sót.
const ID = "dQw4w9WgXcQ"
const r = idVideo?.("youtube.com/watch?v=" + ID)
ok(r?.nhan === "youtube", "nhận đúng host `youtube`")
ok(r?.id === ID,
  `  id giữ nguyên chữ hoa — kỳ vọng ${JSON.stringify(ID)}`,
  `nhận được ${JSON.stringify(r?.id)} ⇒ iframe trỏ vào MỘT VIDEO KHÁC`)

console.log("\n3 · Host vẫn so KHÔNG phân biệt hoa–thường\n")

// Kẹp phép sửa từ phía kia: bỏ luôn `.toLowerCase()` thì §2 xanh mà §3 đỏ.
const rH = idVideo?.("YouTube.COM/watch?v=" + ID)
ok(rH?.nhan === "youtube",
  "`YouTube.COM/…` vẫn nhận ra host",
  "chữ thường vẫn cần cho phép so tên miền — chỉ không được áp cho phần id")
ok(rH?.id === ID, "  và id vẫn nguyên vẹn")

console.log("\n4 · `src` iframe = whitelist + id (M09-R3)\n")

// Đo chuỗi GHÉP, vì đó là thứ tới trình duyệt. Đo `id` một mình thì một `nhung`
// sai vẫn xanh.
//
// ⚠️ ĐO Ở ĐÂU — đổi 2026-09-09 (`WO-074`). Bản trước đo `r.nhung + r.id`, tức
// đòi `idVideo()` TRẢ VỀ chuỗi nhúng. Nhưng `media-cua-so` cấm hàm dựng markup
// chạm `.nhung` (một chuỗi host đi qua đó là một bước gần hơn tới chỗ nó lọt
// vào markup, và lúc đó MỞ TRANG đã là một lời gọi ra ngoài). Hai cổng kéo hai
// hướng, nên `idVideo` nay trả CỜ `nhungDuoc` và chuỗi nhúng chỉ sống trong
// `nhungVideo` — hàm chạy SAU KHI người bấm.
//
// Tính chất cần canh KHÔNG đổi: `src` = tiền tố TỪ BẢNG KHAI + id GIỮ NGUYÊN
// CHỮ HOA. Nó chỉ đổi CHỖ. Nên phép đo đi theo, chứ không nới ra.
const H = MEDIA.video_host.find((x) => x.nhan === "youtube")
{
  const iN = js.indexOf("function nhungVideo")
  const thanN = iN >= 0 ? js.slice(iN, js.indexOf(NLJS + "}", iN) + 2) : ""
  ok(thanN.length > 0, "cắt được thân `nhungVideo` — nơi `src` thật sự ghép")
  // Tiền tố phải tới TỪ dòng bảng khai tra bằng `nhan`, không từ url người dán.
  ok(/video_host\.find/.test(thanN) && /x\.nhan === /.test(thanN),
    "  tiền tố tra TỪ whitelist bằng `nhan`, không dựng từ url người dùng",
    thanN.slice(0, 120))
  ok(/\.src = h\.nhung \+ id|\.src=h\.nhung\+id/.test(thanN),
    "  src = `h.nhung + id` — ghép đúng hai mảnh, không nội suy url",
    "một phép ghép khác ⇒ hoặc tiền tố không từ bảng, hoặc id bị biến đổi")
  // Và id đi vào đó là id GỐC: hàm đọc thẳng `dataset.vid`, không hạ chữ.
  ok(/dataset\.vid/.test(thanN) && !/toLowerCase/.test(thanN),
    "  id lấy nguyên từ `dataset.vid`, KHÔNG hạ chữ",
    "hạ chữ ở đây làm hỏng lại đúng bug WO-022, chỉ ở một hàm khác")
}
// Mắt xích còn lại: id mà `idVideo` bóc ra phải tới được `data-vid` nguyên vẹn.
// §2 đã đo id, vế này đo rằng nó ĐƯỢC GHI vào đúng thuộc tính `nhungVideo` đọc.
ok(H && typeof H.nhung === "string" && H.nhung.startsWith("https://"),
  "  youtube vẫn có tiền tố nhúng trong bảng khai", JSON.stringify(H?.nhung))

console.log("\n5 · Ca âm giữ nguyên\n")

ok(idVideo?.("khong-phai-host.example/watch?v=" + ID) === null,
  "host ngoài whitelist ⇒ null")
ok(idVideo?.("youtube.com/watch?v=qua-ngan") === null,
  "id sai hình dạng ⇒ null")
ok(idVideo?.("youtube.com/watch") === null,
  "không có id ⇒ null")

// TikTok là số nên `.toLowerCase()` vô hại — giữ ca này để phép sửa không làm
// hỏng host duy nhất đang đúng.
const rT = idVideo?.("tiktok.com/@ai/video/7234567890123456789")
ok(rT?.id === "7234567890123456789", "tiktok (toàn số) không đổi")

chot("id video giữ nguyên chữ hoa · host vẫn so không phân biệt hoa–thường")
