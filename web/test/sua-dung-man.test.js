#!/usr/bin/env node
/**
 * WO-013/1 — sửa một bản đưa về màn nạp CỦA MODULE đó.
 *
 * `suaTuCua()` gọi `doiView("napbaiviet")` KHÔNG ĐIỀU KIỆN, nên sửa một tài liệu
 * hay một video đưa người dùng sang màn nạp BÀI VIẾT — đúng "gộp chung màn"
 * người dùng cấm, và nhìn thấy được.
 *
 * ĐO BẰNG CÁCH GỌI CHÍNH PHÉP TRA, không đo "có chuỗi `napvideo` trong bundle".
 * Một chuỗi có mặt vì bất kỳ lý do gì — nó đã có sẵn từ C6b. Phép tra trả về
 * đúng đích với ba `source_type` khác nhau mới là thứ người dùng gặp.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { taiSan } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
const NHOM = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module
const js = (await taiSan()).gnJsNguon ?? ""

console.log("\n1 · Đích của phép sửa — CHẠY phép tra, không tìm chuỗi\n")

/*
 * Rút hàm tra khỏi bundle rồi CHẠY nó. Bundle là ESM và có tham chiếu DOM ở nơi
 * khác, nên không import cả file được; cắt đúng hàm và dựng lại với hai bảng
 * khai là cách chạy được nó mà không dựng cả trình duyệt.
 */
function rutHam(ten) {
  const i = js.indexOf(`function ${ten}(`)
  if (i < 0) return null
  const j = js.indexOf("{", i)
  let sau = 0
  for (let k = j; k < js.length; k++) {
    if (js[k] === "{") sau++
    else if (js[k] === "}") { sau--; if (!sau) return js.slice(i, k + 1) }
  }
  return null
}

const than = rutHam("manNapCua")
ok(than !== null, "bundle có hàm tra đích sửa (`manNapCua`)",
  "không có ⇒ `suaTuCua` đang gọi một đích CỐ ĐỊNH, và mọi loại về cùng một màn")

if (than) {
  // Dựng lại hàm với hai bảng khai — cùng thứ `define` bơm vào bundle.
  // esbuild thay `__NAP_CUA__` bang `define_NAP_CUA_default`. Dung ten DO khi
  // dung lai ham — dung ten trong nguon `.ts` la do mot thu khong ton tai
  // trong bundle, va bundle moi la thu chay tren trinh duyet.
  // Hinh dang THAT ma build-fe emit: chi NGOAI LE + khoa "" la mac dinh. Dung
  // bang day du o day la do mot thu bundle khong co — va ca "loai la" se sai.
  const macDinh = [...NHOM].sort((a, c) => c.loai.length - a.loai.length)[0]
  const manCua = (ten) => BANG.find((x) => x.module === ten && x.cat_khi_khac)
  const PHEP_CHIEU = Object.fromEntries([
    ["", manCua(macDinh.ten)?.id_shell ?? ""],
    ...NHOM.filter((m) => m.ten !== macDinh.ten).flatMap((m) => {
      const man = manCua(m.ten)
      return man ? m.loai.map((l) => [l, man.id_shell]) : []
    }),
  ])
  const chay = new Function("define_NAP_CUA_default",
    `${than}
     return manNapCua`)(PHEP_CHIEU)

  for (const m of NHOM) {
    for (const loai of m.loai) {
      const man = BANG.find((x) => x.module === m.ten && x.cat_khi_khac)
      const cho = man?.id_shell ?? null
      const duoc = chay(loai)
      ok(duoc === cho, `\`${loai}\` ⇒ \`${cho}\``,
        `được ${JSON.stringify(duoc)} — sửa một ${m.ten} mà về màn khác là `
        + "gộp chung màn")
    }
  }
  // Loại lạ ⇒ về màn bài viết, KHÔNG ném: một `source_type` chưa biết không được
  // làm nút Sửa chết im lặng.
  ok(typeof chay("khong-co-that") === "string",
    "loại lạ vẫn trả một đích (không ném, không `undefined`)",
    "ném ở đây làm nút Sửa chết mà không lời nào")
}

console.log("\n2 · Đích DẪN XUẤT, không gõ ba đường\n")

const iSua = js.indexOf("async function suaTuCua")
const thanSua = iSua > 0 ? js.slice(iSua, iSua + 1200) : ""
ok(iSua > 0, "tìm được `suaTuCua` trong bundle")
ok(!/doiView\("nap[a-z]+"\)/.test(thanSua),
  "`suaTuCua` KHÔNG gọi `doiView` với một đích gõ cứng",
  "một đích cố định là mọi loại về cùng một màn")

console.log("\n3 · Ngân sách đo bằng BYTE, không làm tròn\n")

/*
 * `page-weight` TỪNG so `Math.round(byte/1024) <= 100`, nên nó cho vượt tới
 * 511 byte mà vẫn xanh — và điều đó ĐÃ LỌT THẬT ở C6b: `gn.js` 102666 byte
 * báo "100 KB (ngưỡng 100)" và XANH.
 *
 * WO-025 đã vá tận gốc: `page-weight` nay so theo byte. Phép kiểm này GIỮ
 * LẠI — nó là chốt chéo, và một bất biến quan trọng đo ở hai nơi độc lập thì
 * một nơi hỏng không làm mất cả hai. Đây cũng là hồ sơ: xoá đi thì lần sau
 * không ai biết lỗ ấy từng tồn tại và từng lọt.
 */
/*
 * Cân bản SHIP, không bản đọc (`WO-057`).
 *
 * `js` ở file này là `gnJsNguon` — bản CHƯA NÉN, để những phép soi mã bên trên
 * cắt được hàm ra mà chạy. Nhưng TRẦN nói về thứ TRÌNH DUYỆT TẢI, và thứ đó là
 * bản đã nén. Cân bản chưa nén là cân một vật không ai tải: đo được 102654 so
 * với 84324 — chênh 18 KB, đủ để báo vỡ trần trong khi trang thật còn dư rộng.
 */
const byte = Buffer.byteLength((await taiSan()).gnJs, "utf8")
ok(byte <= TRAN.js, `gn.js ${byte} byte / ${TRAN.js} (dư ${TRAN.js - byte})`,
  "vượt trần ⇒ TÁCH BUNDLE hoặc SIẾT một khối cũ, KHÔNG nới trần")

/* ═══ WO-045 / T03-105 · NGỮ CẢNH SỬA phải sống qua ĐIỀU HƯỚNG ═══════════
 *
 * VÌ SAO BUG NÀY TRỐN ĐƯỢC LÂU: cổng này (và mọi cổng FE khác) render MỘT
 * trang rồi đo trang đó. Không ai đo *"bấm ở trang A, kết quả ở trang B"* —
 * mà đó đúng là hình dạng của bug.
 *
 * Đo trên trình duyệt thật 2026-09-04: `/tai-lieu/` → "✎ Sửa…" → tới
 * `/tai-lieu/nap/` với `tv-1l` RỖNG, `up-tv-kq` RỖNG, `tv-gui` = "Ghi vào kho".
 * Người bấm SỬA nhận một form NẠP MỚI trống.
 *
 * Nguyên nhân: `doiView` CÓ THỂ ĐIỀU HƯỚNG (`location.href = …` khi view vắng
 * khỏi DOM), và `suaTaiLieu` điền form SAU khi gọi nó ⇒ điền vào một trang
 * đang unload.
 *
 * Nên phép đo ở đây là phép đo CẤU TRÚC MÃ, không phải đo một trang: không
 * nhánh nào được điền DOM sau một `doiView` mà không đi qua đường nối-lại.
 */
{
  const thanSua = (js.match(/function suaTaiLieu[\s\S]{0,3000}?\n\}/) ?? [""])[0]
  ok(thanSua !== "", "đọc được thân `suaTaiLieu`")

  // Ngữ cảnh phải được CẤT trước khi gọi `doiView` — sau đó là quá muộn.
  const iCat = thanSua.search(/sessionStorage\.setItem/)
  const iDoi = thanSua.search(/doiView\(/)
  ok(iCat >= 0, "`suaTaiLieu` CẤT ngữ cảnh vào `sessionStorage`",
    "biến module chết cùng trang — và đó chính là bug")
  ok(iCat >= 0 && iDoi >= 0 && iCat < iDoi,
    "CẤT trước, `doiView` sau — gọi `doiView` trước là mất ngữ cảnh khi nó điều hướng",
    `vị trí cất ${iCat} · doiView ${iDoi}`)

  // Đo ĐÚNG KHOÁ ngữ cảnh sửa, không đo cả bundle: `localStorage` đã có mặt
  // hợp lệ cho `gn-theme` và `gn-lang` (hai thứ ĐÁNG sống qua lần đóng trình
  // duyệt). Bản đầu của phép này cấm `localStorage` toàn file và đỏ oan ngay.
  ok(!/localStorage\.\w+\(\s*["'`]gn-sua/.test(js),
    "ngữ cảnh sửa KHÔNG vào `localStorage` — nó là việc của MỘT tab đang làm " +
    "dở; `localStorage` sống qua cả lần đóng trình duyệt và dùng chung mọi tab, " +
    "nên tab thứ hai sẽ thấy 'đang sửa' một bài mình chưa bấm")

  // Nối lại: đọc rồi XOÁ NGAY. Để lại thì lần vào `/…/nap/` kế tiếp (bấm
  // "+ nạp tài liệu", không phải Sửa) sẽ mở ra form đã điền sẵn của bài cũ.
  const noiLai = (js.match(/sessionStorage\.getItem[\s\S]{0,900}/) ?? [""])[0]
  ok(noiLai !== "", "có nhánh NỐI LẠI đọc `sessionStorage`")
  ok(/removeItem/.test(noiLai),
    "nối lại XOÁ ngữ cảnh ngay — không xoá thì lần nạp mới sau mở ra form của bài cũ")

  // Ca thứ hai, cùng lớp lỗi: `suaTuCua` cũng `doiView(...)` rồi `G("f-bai")`.
  const thanTuCua = (js.match(/function suaTuCua[\s\S]{0,2000}?\n\}/) ?? [""])[0]
  ok(thanTuCua !== "", "đọc được thân `suaTuCua`")
  const jDoi = thanTuCua.search(/doiView\(/)
  const jDom = thanTuCua.search(/G\("f-bai"\)/)
  ok(jDoi < 0 || jDom < 0 || thanTuCua.includes("sessionStorage.setItem"),
    "`suaTuCua` cũng đi qua đường cất-rồi-nối-lại — cùng lớp lỗi, không chỉ " +
    "sửa một chỗ", `doiView ${jDoi} · G(f-bai) ${jDom}`)
}

chot("sửa về đúng màn của module · đích dẫn xuất · ngân sách đo bằng byte · ngữ cảnh sống qua điều hướng")
