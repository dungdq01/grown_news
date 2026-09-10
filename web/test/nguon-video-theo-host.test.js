#!/usr/bin/env node
/**
 * WO-076 — LOẠI NGUỒN của một video phải theo HOST, không theo "có media hay không".
 *
 * Chủ dự án 2026-09-09 đếm bằng mắt trên màn `/video/`: kho có **5 youtube ·
 * 2 facebook · 1 tiktok · 1 douyin**, mà bộ lọc báo `tai-len 7 · douyin 1 ·
 * youtube 1`.
 *
 * ── Vì sao lệch ────────────────────────────────────────────────────────
 * `nguonCua()` có một dòng: *nếu `b.media` không rỗng ⇒ `"tai-len"`*. Dòng ấy
 * ĐÚNG vào ngày nó được viết, khi thứ duy nhất nằm trong `media` của một video
 * là byte mp4 người dùng tự tải lên. Từ đó `media` nhận thêm HAI loại hiện vật
 * do MÁY sinh:
 *
 *   `.vtt`      transcript (T12-27)
 *   `image/*`   ảnh bìa    (WO-071 · 072 · 075)
 *
 * Cả hai đều mang cờ `chi_dan_xuat: true` trong bảng khai — cờ ĐÃ CÓ SẴN, chỉ
 * chưa ai đọc nó ở đây. Nên một video YouTube vừa sinh transcript xong sẽ **tự
 * đổi loại nguồn thành "tải lên"**, và nguồn thật của nó biến mất khỏi bộ lọc.
 *
 * Đây KHÔNG phải lỗi do ảnh bìa gây ra: nó có từ lúc transcript đầu tiên chạy.
 * Ảnh bìa chỉ làm nó chạm thêm 3 bản ghi nữa, đủ nhiều để nhìn thấy bằng mắt.
 *
 * ── Vì sao vế này gieo dữ liệu chứ không đọc chữ ───────────────────────
 * Một vế `grep` xem mã có chữ `chi_dan_xuat` hay không sẽ xanh ngay cả khi phép
 * lọc viết ngược. Vế dưới đây DỰNG TRANG THẬT với những bản ghi có đúng hình
 * dạng đã gây lỗi, rồi đọc `data-nguon` trên thẻ — thứ người dùng thật sự thấy.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const TEST = dirname(fileURLToPath(import.meta.url))
const GOC = join(TEST, "..", "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

const BANG = JSON.parse(readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const { trangHtml, napRender } = await import("./_render.mjs")
const m = await napRender()

console.log("\nWO-076 · loại nguồn của video theo HOST, không theo `có media`\n")

// Hiện vật DẪN XUẤT (máy sinh) — đọc từ bảng khai, không gõ mime ở đây.
const VTT = { sha256: "a".repeat(64), mime: "text/vtt", ten_goc: "x.vtt", so_byte: 10 }
const ANH = { sha256: "b".repeat(64), mime: "image/jpeg", ten_goc: "x.jpg", so_byte: 10 }
const MP4 = { sha256: "c".repeat(64), mime: "video/mp4", ten_goc: "x.mp4", so_byte: 10 }

{
  const dx = new Set(BANG.loai.filter((l) => l.chi_dan_xuat).map((l) => l.mime))
  ok(dx.has("text/vtt"), "0 · bảng khai: `.vtt` là hiện vật DẪN XUẤT")
  ok(dx.has("image/jpeg"), "0a · bảng khai: ảnh là hiện vật DẪN XUẤT")
  ok(!dx.has("video/mp4"), "0b · nhưng `video/mp4` thì KHÔNG — nó là bản gốc",
    "nếu mp4 cũng `chi_dan_xuat` thì `tai-len` không còn ca nào và vế 2 xanh oan")
}

/** Dựng màn Video với đúng một bản ghi, trả `data-nguon` của thẻ nó. */
const nguonCuaThe = async (them) => {
  const d = m.duLieuMock()
  const goc = (d.bans ?? []).find((x) => x.source_type === "video")
  if (!goc) return "(kho mock không có video để nhân bản)"
  const bg = { ...goc, slug: "thu-nguon", title: "thử nguồn", media: null, ...them }
  const html = await trangHtml("video", { data: { ...d, bans: [bg] } })
  const i = html.indexOf("thu-nguon")
  if (i < 0) return "(bản ghi bị lọc khỏi màn)"
  // Lùi về đầu thẻ rồi đọc `data-nguon` của CHÍNH thẻ ấy.
  const dau = html.lastIndexOf("<button", i)
  const the = html.slice(dau, i + 200)
  return (/data-nguon="([^"]*)"/.exec(the) ?? [])[1] ?? "(không thấy data-nguon)"
}

console.log("1 · Hiện vật DẪN XUẤT không được đổi loại nguồn\n")

/* Dạng `url_normalized` THẬT, chép từ `kb/video/*.md`. `normalize_url()`
   (T01-29) đã gấp `youtu.be/<id>` thành `youtube.com/watch?v=<id>` TRƯỚC khi
   bản ghi vào kho, nên `youtu.be` không bao giờ tới `nguonCua()`. Bản đầu của
   vế này gieo `youtu.be/...` và đỏ — nhưng đỏ vì FIXTURE sai hình dạng, không
   vì mã sai. Suýt nữa tôi nới bảng khai để chữa một ca không tồn tại. */
const CA = [
  ["youtube.com/watch?v=Z0YO9KyVhVg", null, "youtube", "URL YouTube, chưa có hiện vật"],
  ["youtube.com/watch?v=Z0YO9KyVhVg", [VTT], "youtube", "YouTube + transcript ⇒ VẪN youtube"],
  ["youtube.com/watch?v=Z0YO9KyVhVg", [ANH], "youtube", "YouTube + ảnh bìa ⇒ VẪN youtube"],
  ["tiktok.com/video/7669845290265890069", [ANH], "tiktok",
    "TikTok + ảnh bìa ⇒ VẪN tiktok — ca chủ dự án bắt được"],
  ["facebook.com/reel/2020621438895108", [ANH], "fb", "Facebook + ảnh bìa ⇒ VẪN fb"],
  ["douyin.com/jingxuan/course?modal_id=7543503016624655654", null, "douyin", "Douyin"],
  ["youtube.com/watch?v=Z0YO9KyVhVg", [VTT, ANH], "youtube", "cả hai loại dẫn xuất ⇒ VẪN youtube"],
]
for (const [un, media, mong, ten] of CA) {
  const duoc = await nguonCuaThe({ url_normalized: un, url: "https://" + un, media })
  ok(duoc === mong, `1 · ${ten}`, `kỳ vọng ${mong}, được ${duoc}`)
}

console.log("\n2 · `tai-len` vẫn còn răng — byte GỐC thì đúng là tải lên\n")
{
  const duoc = await nguonCuaThe({
    url_normalized: "", url: "kho://video/thu-nguon", media: [MP4] })
  ok(duoc === "tai-len", "2 · mp4 byte trong kho ⇒ `tai-len`",
    `được ${duoc} — sửa quá tay thì bucket 'tải lên' rỗng và nó rỗng một cách DỐI`)

  const duoc2 = await nguonCuaThe({
    url_normalized: "youtube.com/watch?v=Z0YO9KyVhVg", url: "https://youtu.be/Z0YO9KyVhVg",
    media: [ANH, MP4] })
  ok(duoc2 === "tai-len",
    "2a · có CẢ ảnh bìa lẫn mp4 gốc ⇒ `tai-len` thắng",
    `được ${duoc2} — một byte gốc trong kho là sự thật mạnh hơn một URL`)
}

console.log("\n3 · Host lạ vẫn rơi về `khac`, không im lặng biến mất\n")
{
  const duoc = await nguonCuaThe({
    url_normalized: "vimeo.com/12345", url: "https://vimeo.com/12345", media: [ANH] })
  ok(duoc === "khac", "3 · host ngoài bảng khai ⇒ `khac`", `được ${duoc}`)
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · loại nguồn theo host; hiện vật dẫn xuất không cướp nhãn\n")
