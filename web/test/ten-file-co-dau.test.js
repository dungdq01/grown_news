#!/usr/bin/env node
/**
 * WO-057 · T03-127 + T08-36 — TÊN FILE CÓ DẤU qua header.
 *
 * Chủ dự án 2026-09-09, ảnh màn Đăng ký video: nạp `Thầy ôn bai thi final .mp4`
 * (55 MB) ⇒ *"Không gọi được /api/articles/media — máy chủ chưa chạy?"* trong
 * khi máy chủ ĐANG chạy.
 *
 * ── Gốc, đo bằng playwright trên :8787 thật ─────────────────────────────
 * Giá trị header HTTP chỉ nhận **ISO-8859-1**. `ầ`/`ô` nằm ngoài dải đó nên
 * `fetch` ném `TypeError` **lúc dựng request** — 0 byte rời máy. Cùng lời gọi
 * với tên `t.mp4`: gửi được. 55 MB KHÔNG liên quan: `curl` POST 55 MB vào cửa
 * ấy trả **201 trong 1.61s**, và trần bảng khai là 1 GB.
 *
 * ── Vì sao cổng này đo BA chỗ, không một ────────────────────────────────
 * Cùng lớp lỗi nằm ở `napvideo` (`x-ten-goc`), `multiwindow` (`x-ten-goc`) và
 * `multiwindow` (`x-ten-file`). Một `.pdf` hay `.md` tên tiếng Việt hỏng y hệt,
 * chưa ai báo vì chưa ai thử. Vá một chỗ là để hai chỗ hỏng im lặng.
 *
 * ── Ca ẩn hơn ca ném, và nó nguy hơn ────────────────────────────────────
 * `café.mp4` nằm TRONG ISO-8859-1 ⇒ gửi được, nhưng Node đọc header theo
 * latin1 ⇒ tên vào frontmatter bị mojibake. Nó *thành công* với dữ liệu sai,
 * nên không ai phát hiện. Vế 5 canh đúng ca đó.
 */
import { request as httpReq } from "node:http"
import { readFileSync } from "node:fs"

import { batServer, dungKho, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const CR = String.fromCharCode(13)
const doc = (p) =>
  readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const NV = boCT(doc("../plugins/napvideo/src/napvideo.inline.ts"))
const MW = boCT(doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts"))

/** MP4 tối thiểu — `ftyp` ở offset 4 (ISO BMFF), qua được lớp magic-byte. */
const MP4 = Buffer.concat([
  Buffer.from([0, 0, 0, 32]), Buffer.from("ftyp"), Buffer.alloc(24),
])

console.log("\nWO-057 · tên file có dấu qua header\n")

// ══ PHẦN I · FE (T03-127) — đo NGUỒN ════════════════════════════════════
{
  // AC1 · KHÔNG chỗ nào nhét tên thô vào header.
  for (const [ten, src, mau] of [
    ["napvideo · x-ten-goc", NV, /"x-ten-goc":\s*f\.name/],
    ["multiwindow · x-ten-goc", MW, /"x-ten-goc":\s*f\.name/],
    ["multiwindow · x-ten-file", MW, /"x-ten-file":\s*f\.name/],
  ]) ok(!mau.test(src), `1 · ${ten} KHÔNG gửi tên thô`,
    "header chỉ chở ISO-8859-1 ⇒ tên có dấu làm fetch NÉM, 0 byte rời máy")

  /*
   * AC3 · MỘT hàm CÓ TÊN trong MỖI chunk — không phải một hàm dùng chung cho
   * cả hai. `chunk-tu-chua.test.js` (WO-059) cấm chunk gọi hàm của chunk khác:
   * mỗi chunk bọc IIFE riêng, nên một hàm dùng chung ném `ReferenceError` ngay
   * lần bấm ĐẦU TIÊN của người dùng — bug chủ dự án đã bắt 2026-09-06. Nên hai
   * bản CỤC BỘ ở đây là ĐÚNG, không phải trùng lặp.
   * Cái phải chặn là bản thứ ba: một `encodeURIComponent` gõ THẲNG tại chỗ gọi.
   */
  for (const [ten, src, soGoi] of [["napvideo", NV, 1], ["multiwindow", MW, 2]]) {
    ok(/(function|const)\s+tenChoHeader/.test(src),
      `3 · ${ten} khai hàm CÓ TÊN \`tenChoHeader\` (cục bộ — chunk phải tự chứa)`)
    ok((src.match(/tenChoHeader\(/g) ?? []).length >= soGoi + 1,
      `3b · ${ten} gọi nó ở đủ ${soGoi} chỗ gửi`,
      `đếm được ${(src.match(/tenChoHeader\(/g) ?? []).length} lần (1 khai + ${soGoi} gọi)`)
  }
  // Bản thứ ba: mã hoá gõ THẲNG vào literal header là chỗ sẽ lệch.
  ok(!/"x-ten-(goc|file)":\s*encodeURIComponent/.test(NV + MW),
    "3c · KHÔNG chỗ nào gõ `encodeURIComponent` thẳng vào literal header")

  // AC2 · `catch` tách hai ca. "Máy chủ chưa chạy" không còn là câu duy nhất.
  // Neo vao CHINH loi goi dang do, khong vao chuoi "catch" dau tien cua file:
  // `napvideo` co mot `catch` khac o `new URL(...)` dong 84, va do o do thi ve
  // nay xanh/do vi mot doan ma khong lien quan.
  const iGoi = NV.indexOf('"x-ten-goc"')
  const than = iGoi < 0 ? "" : NV.slice(iGoi, iGoi + 1200)
  ok(/t[eê]n|name/i.test(than) && /máy chủ chưa chạy/.test(than),
    "2 · `catch` của napvideo có nhánh nói về TÊN FILE, cạnh nhánh máy-chủ",
    "gộp hai ca là chỉ người đọc đi khởi động lại máy chủ — sai chỗ hoàn toàn")
  ok(/TypeError|instanceof/.test(than),
    "2b · phân biệt bằng LOẠI lỗi, không bằng phỏng đoán",
    "request chưa rời máy ném TypeError; máy chủ không nghe ném lỗi mạng")
}

// ══ PHẦN II · SERVER (T08-36) — đo trên SERVER THẬT ═════════════════════
const { kho, rac, don } = dungKho("gn-tenfile")
const sv = await batServer({ kho, rac })

const nap = (tenHeader) => new Promise((xong, loi) => {
  const req = httpReq({
    host: "127.0.0.1", port: sv.cong, path: "/api/articles/media", method: "POST",
    headers: { "content-type": "video/mp4", "content-length": MP4.length,
               "x-ten-goc": tenHeader },
  }, (res) => {
    const p = []
    res.on("data", (c) => p.push(c))
    res.on("end", () => {
      let j = null
      try { j = JSON.parse(Buffer.concat(p).toString("utf8")) } catch { /* không JSON */ }
      xong({ ma: res.statusCode, j })
    })
  })
  req.on("error", loi)
  req.end(MP4)
})

try {
  const VN = "Thầy ôn bai thi final .mp4"

  // AC1 · mã hoá vào ⇒ tên tiếng Việt NGUYÊN VẸN ra.
  {
    const r = await nap(encodeURIComponent(VN))
    ok(r.ma === 201, `4 · nạp tên đã mã hoá ⇒ 201 (được ${r.ma})`)
    ok(r.j?.ten_goc === VN,
      "4a · `ten_goc` trả về ĐÚNG tên tiếng Việt gốc",
      `nhận: ${JSON.stringify(r.j?.ten_goc)}`)
  }

  // Ca ẩn: tên trong dải latin1 KHÔNG ném nhưng bị mojibake nếu không mã hoá.
  {
    const CAFE = "café.mp4"
    const r = await nap(encodeURIComponent(CAFE))
    ok(r.j?.ten_goc === CAFE,
      "5 · tên latin1 (`café.mp4`) không bị mojibake",
      `nhận: ${JSON.stringify(r.j?.ten_goc)} — ca này THÀNH CÔNG với dữ liệu sai nếu không mã hoá`)
  }

  // AC2 · `%` lẻ ⇒ KHÔNG 500. `decodeURIComponent` ném URIError.
  {
    const r = await nap("100% xong.pdf")
    ok(r.ma === 201, `6 · tên thô mang \`%\` lẻ ⇒ KHÔNG 500 (được ${r.ma})`,
      "client thứ hai (curl) gửi tên thô; giải mã thất bại phải GIỮ chuỗi thô")
    ok(typeof r.j?.ten_goc === "string" && r.j.ten_goc.includes("100%"),
      "6a · giữ nguyên chuỗi thô khi giải mã thất bại",
      `nhận: ${JSON.stringify(r.j?.ten_goc)}`)
  }

  // AC3 · giải mã TRƯỚC lọc — nếu không, `%2e%2e%2f` thoát ra `../`.
  {
    const r = await nap("%2e%2e%2fthoat.mp4")
    const t = String(r.j?.ten_goc ?? "")
    ok(!t.includes("/") && !t.includes(".."),
      "7 · `%2e%2e%2f` KHÔNG thoát thành `../` — giải mã TRƯỚC lọc",
      `nhận: ${JSON.stringify(t)} · lọc trước rồi giải mã sau là một lỗ THẬT`)
  }

  // AC4 · tương thích lùi: client cũ gửi tên ASCII thô.
  {
    const r = await nap("t.mp4")
    ok(r.j?.ten_goc === "t.mp4",
      "8 · tên ASCII thô (client cũ) vẫn đúng — tương thích lùi",
      `nhận: ${JSON.stringify(r.j?.ten_goc)}`)
  }
} finally {
  sv.dung()
  don()
}

chot("WO-057 · tên file có dấu qua header")
