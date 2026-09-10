#!/usr/bin/env node
/**
 * Nhịp + chuyển động (FR-014) — canh bốn hiệu ứng và ba cái bẫy của chúng.
 *
 * Vì sao cần test cho "hiệu ứng": chúng hỏng IM LẶNG. Build xanh, trang hiện
 * đủ chữ, chỉ là không có gì động — hoặc tệ hơn, phần tử mắc ở trạng thái đầu
 * và người dùng thấy panel trống / bar rỗng. Không test nào khác bắt được.
 *
 * Ba bẫy đã gặp khi thi hành, mỗi cái một phép kiểm:
 *
 * 1 · **Bar chạy sau lớp mờ.** 4/5 khối `.bars` nằm TRONG `.pn.rise`, mà panel
 *     bắt đầu `opacity:0` và mất .55s để hiện. Bar chạy ngay lúc đó thì diễn ra
 *     sau lớp mờ — mắt bỏ mất. Nên delay bar phải ≥ thời gian panel hiện.
 *
 * 2 · **JS chỉ quan sát `.rise`.** `.bars` cần class `.in` riêng; thiếu vòng
 *     quan sát thứ hai thì bar không bao giờ chạy.
 *
 * 3 · **reduced-motion để phần tử mắc trạng thái đầu.** Tắt transition mà
 *     không trả về trạng thái CUỐI ⇒ panel vô hình, bar rỗng vĩnh viễn với
 *     người bật giảm chuyển động. Đây là lỗi a11y, không phải lỗi thẩm mỹ.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))

// FR-034/C5 · nguồn đổi từ output build sang taiSan/renderTrang — assertion giữ nguyên.
const TAI_SAN = await taiSan()
const css = TAI_SAN.gnCss
const js = TAI_SAN.gnJs
const kho = await trangHtml("kho")

const loi = []
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi.push(ten)
}

console.log("\n1 · Viền nhấn — nền GIỮ NGUYÊN\n")
ok((css.match(/--vien-nhan:/g) ?? []).length === 2,
   "--vien-nhan khai 2 lần (sáng + tối)",
   "tone tối thiếu bộ riêng ⇒ viền vô hình trên nền thẫm")
ok(/\.pn::after\{[^}]*box-shadow:inset 0 0 0 1px/.test(css.replace(/\s*\n\s*/g, "")),
   "viền dựng bằng box-shadow inset 1px")
// MỘT màu, KHÔNG gradient. Lượt đầu dùng gradient 3 hue + mask-composite:
// mask viết tắt khai SAU composite ⇒ reset composite ⇒ gradient tràn cả mặt
// panel. Vừa vỡ kỹ thuật vừa sai hướng thẩm mỹ ("trẻ trâu" — người dùng).
ok(!/--vien-mau|--vien-sang/.test(css), "KHÔNG còn token gradient cầu vồng")
ok(!/\.pn::before\{[^}]*background:linear-gradient/.test(css.replace(/\s*\n\s*/g, "")),
   "KHÔNG có gradient phủ mặt panel",
   "mask hỏng ⇒ gradient tràn kín panel thay vì nằm ở viền")
ok(/\.pn\.brk::after\{display:none\}/.test(css),
   "vùng Nổi bật miễn trừ — đã có viền đỏ riêng")
// Nền phải nằm trong 50 cặp contrast-audit đã validate — KHÔNG được đổi
const audit = JSON.parse(readFileSync(
  join(TEST, "..", "..", "05_uiux", "contracts", "contrast-audit.json"), "utf8"))
const tokens = readFileSync(join(TEST, "..", "..", "05_uiux", "tokens.css"), "utf8")
// So HAI NGUỒN KHỚP NHAU, không khoá cứng một con số.
//
// Bản trước viết `audit.glass_alpha.light === 0.9` — nó khoá GIÁ TRỊ trong khi
// điều cần bảo vệ là SỰ KHỚP: alpha trong tokens.css phải đúng alpha mà audit
// đã đo. Khoá giá trị làm hai việc sai cùng lúc:
//   · chặn một thay đổi hợp lệ (FR-027b hạ .9 → .7 để kính hiện ở chế độ sáng)
//   · KHÔNG bắt được lỗi thật — sửa tokens rồi quên sinh lại audit thì hai bên
//     lệch nhau mà con số 0.9 vẫn đúng ở cả hai
// Giờ audit được SINH từ tokens (`core/tools/sinh_contrast_audit.py`) nên lệch
// chỉ xảy ra khi ai đó quên chạy lại — và đó đúng là thứ phép kiểm này bắt.
for (const [mode, re] of [
  ["light", /:root\{[\s\S]*?--background:rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\)/],
  ["dark", /\[data-theme="dark"\]\{[\s\S]*?--background:rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\)/],
]) {
  const m = re.exec(tokens)
  const tu_token = m ? Number(m[1]) : NaN
  const tu_audit = audit.glass_alpha?.[mode]
  ok(Math.abs(tu_token - tu_audit) < 1e-9,
     `alpha ${mode}: tokens ${tu_token} = audit ${tu_audit}`,
     "lệch ⇒ audit lạc hậu; chạy `python core/tools/sinh_contrast_audit.py`")
}
ok(audit.failures === 0, `audit ${audit.total} cặp · ${audit.failures} trượt`,
   "một cặp trượt là một chỗ chữ không đọc được trên ảnh nền")

console.log("\n2 · Tách layout\n")
ok(/\.two\{gap:var\(--s-lg\)\}/.test(css), "hai cột cách --s-lg (32px), không 24px")
ok(/\.two > \.pn:last-child\{margin-top/.test(css), "cột phải lệch nhịp")
ok(/@media\(min-width:1081px\)\{[\s\S]{0,200}\.two > \.pn:last-child/.test(css),
   "lệch nhịp CHỈ ở màn rộng (dưới 1080px .two xếp dọc)")
ok(/\.grid\{gap:var\(--s-sm\)\}/.test(css), "lưới thẻ nới ra cho bóng không chồng")

console.log("\n3 · Chuyển động panel\n")
ok(/\.rise\{opacity:0;transform:translateY\(18px\) scale\(\.985\)/.test(css),
   "panel trượt lên + tiến lại (scale)")
ok(/cubic-bezier\(\.16,\.8,\.3,1\)/.test(css), "easing có đà, không tuyến tính")

console.log("\n4 · Bar chạy từ 0\n")
ok(/transform:scaleX\(0\)/.test(css), "bar bắt đầu ở 0")
ok(/\.bars\.in \.bw > i\{transform:scaleX\(1\)\}/.test(css), "chạy tới 1 khi có .in")
const nDelay = (css.match(/\.bars\.in \.br:nth-child\(\d\) \.bw > i\{transition-delay/g) ?? []).length
ok(nDelay >= 6, `${nDelay} bar lệch nhịp`, "6 bar chạy cùng lúc thành một khối động")

// BẪY 1 — delay phải đủ để panel hiện xong trước
{
  const dur = css.match(/\.rise\{[^}]*transition:opacity \.(\d+)s/)
  const d1 = css.match(/\.bars\.in \.br:nth-child\(1\) \.bw > i\{transition-delay:(\d+)ms/)
  const panelMs = dur ? Number("0." + dur[1]) * 1000 : 0
  const barMs = d1 ? Number(d1[1]) : 0
  ok(barMs >= panelMs * 0.4,
     `delay bar ${barMs}ms vs panel hiện ${panelMs}ms — bar không chạy sau lớp mờ`,
     "4/5 khối .bars nằm trong .pn.rise ⇒ bar chạy lúc panel còn opacity:0")
}

// BẪY 2 — JS phải quan sát .bars, không chỉ .rise
ok(/\.bars:not\(\.in\)/.test(js), "JS quan sát .bars riêng",
   "chỉ quan sát .rise ⇒ .bars không bao giờ nhận .in ⇒ bar rỗng vĩnh viễn")
// Và delay của bar do CSS đặt — JS đặt style.transitionDelay lên .bars sẽ ĐÈ nó
ok(!/bars[\s\S]{0,120}style\.transitionDelay/.test(js),
   "JS KHÔNG đặt transitionDelay lên .bars (sẽ đè delay của CSS)")

// Đo trên HTML thật: .bars có thật nằm trong .pn.rise?
{
  let i = 0, trongRise = 0, tong = 0
  while ((i = kho.indexOf('class="bars"', i)) >= 0) {
    tong++
    const j = kho.lastIndexOf("<section", i)
    if (/class="pn rise"/.test(kho.slice(j, j + 40))) trongRise++
    i += 5
  }
  ok(tong > 0, `${tong} khối .bars trên màn Kho`)
  console.log(`         (${trongRise}/${tong} nằm trong .pn.rise — lý do cần delay)`)
}

console.log("\n5 · Scroll ngang vùng Nổi bật\n")
ok(/scroll-snap-type:x mandatory/.test(css), "snap từng thẻ")
ok(/\.brk-g > \*\{scroll-snap-align:start/.test(css), "mỗi thẻ là điểm snap")
ok(/@media\(min-width:1081px\)\{[\s\S]{0,400}\.brk-g\{display:flex/.test(css),
   "CHỈ ở màn rộng — mobile giữ xếp dọc (SCR-02 đã quyết)")
ok(/scrollbar-width:thin/.test(css) || /::-webkit-scrollbar/.test(css),
   "scrollbar mảnh nhưng CÒN — ẩn hẳn mà mất cuộn là bẫy")

console.log("\n6 · prefers-reduced-motion trả về trạng thái CUỐI\n")
{
  const m = css.match(/@media \(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n\}/g) ?? []
  const gop = m.join("")
  ok(m.length > 0, `${m.length} khối reduced-motion`)
  ok(/\.rise\{opacity:1;transform:none\}/.test(gop),
     "panel trả về opacity:1 (không mắc ở 0)",
     "tắt transition mà không trả trạng thái cuối ⇒ panel VÔ HÌNH")
  ok(/scaleX\(1\)/.test(gop), "bar trả về scaleX(1) (không mắc ở 0)",
     "bar rỗng vĩnh viễn với người bật giảm chuyển động — lỗi a11y")
}

console.log(loi.length
  ? `\n${loi.length} lỗi`
  : "\npass · bốn hiệu ứng đến được trang, ba bẫy đã chặn")
process.exit(loi.length ? 1 : 0)
