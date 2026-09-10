#!/usr/bin/env node
/**
 * LỐI NẠP THƯ VIỆN — tab thứ tư của màn Nạp nguồn (FR-036/B7b).
 *
 * Soi BUNDLE ĐÃ BUILD, không soi `.ts`: thứ chạy trên trình duyệt là bundle, và
 * một helper đúng trong `.ts` mà esbuild inline sai thì `.ts` vẫn xanh — bài
 * học của `duong-api-khop-route.test.js`.
 *
 * Phép kiểm nặng nhất ở đây là §3: **`file.size` phải được kiểm TRƯỚC lời gọi
 * `fetch` đầu tiên**, và đo bằng VỊ TRÍ trong thân hàm chứ không bằng "có tồn
 * tại chuỗi". Lý do đã đo ở B5 (`WL-01K9N7FR036B5`): `413` KHÔNG tới được client
 * giữa lúc upload — trình duyệt nhận ECONNRESET trên đường GHI trước khi kịp
 * ĐỌC phản hồi. Không kiểm ở client thì người dùng kéo một file 30 MB vào và
 * chỉ thấy "mạng lỗi".
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { taoKiem } from "./_api.mjs"
import { taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
const GOC = join(WEB, "..")
const { ok, chot } = taoKiem()

const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const TS = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")
const SHELL_R = readFileSync(join(WEB, "render", "shell.html"), "utf8")
const SHELL_H = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")

// esbuild escape ky tu ngoai ASCII thanh CA HAI dang `\uXXXX` VA `\xXX`. Giai
// ma mot dang thoi de lai phep kiem do sai — da xay ra o `khung-8-o.test.js`.
const js = (await taiSan()).gnJs
  .replace(/\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g,
    (_, u, x) => String.fromCharCode(parseInt(u ?? x, 16)))

/*
 * WO-017 · khoá lối đổi `thu-vien` -> `tep`.
 *
 * `thu-vien` là tên HỒ SƠ — một khái niệm của `validate.py` (hiện vật + nhãn,
 * miễn cổng khung). Khoá của một LỐI NẠP phải gọi tên đường vào mà người dùng
 * thấy — "Chọn tệp" — không gọi tên một khái niệm nội bộ. Hai thứ khác nhau
 * tình cờ trùng chỗ, và trùng chỗ là cách chúng bị lẫn.
 */
const TAB = "tep"

console.log("\n1 · Loi thu vien — hai shell, va nut khong chet\n")

/*
 * FR-038/C6a · KHONG CON "tab thu tu". Loi thu vien da sang man rieng
 * `/tai-lieu/nap/`, va man do co DUNG MOT loi nen no khong can tab nao.
 *
 * Phep kiem doi lai: pane phai CON, va phai nam TRONG khoi `v-naptailieu` —
 * "pane con ton tai" mot minh xanh ca khi no bi bo quen o mot man khac.
 */
for (const [ten, s] of [["render", SHELL_R], ["home-pages", SHELL_H]]) {
  ok(s.includes(`data-napview="${TAB}"`), `${ten}/shell.html co pane \`${TAB}\``)
  const i = s.indexOf('id="v-naptailieu"')
  const j = s.indexOf('<div class="view"', i + 5)
  ok(i > 0 && s.slice(i, j < 0 ? s.length : j).includes(`data-napview="${TAB}"`),
    `${ten}/shell.html: pane \`${TAB}\` nam TRONG man nap tai lieu`,
    "pane o ngoai man cua no la pane khong ai mo duoc")
  /*
   * CAT VUNG BAI VIET. Ban truoc quet CA SHELL — va shell mang ca ba view nap,
   * nen tab `tep` co mat (o view tai lieu, dung cho cua no) va phep kiem do
   * OAN. Dieu no muon noi la "khong co tab do TRONG vung bai viet", nen no
   * phai cat vung — nhu chinh phep kiem ngay tren da lam.
   */
  const iB = s.indexOf('id="v-napbaiviet"')
  const sauB = iB < 0 ? "" : s.slice(iB + 20)
  const jB = sauB.search(/id="v-[a-z]+"/)
  const vungB = jB < 0 ? sauB : sauB.slice(0, jB)
  ok(vungB.length > 1000, `${ten}: cat duoc vung v-napbaiviet (${vungB.length} ky tu)`,
    "khong cat duoc ⇒ phep kiem duoi lay pham vi ca shell")
  ok(!vungB.includes(`data-naptab="${TAB}"`),
    `${ten}/shell.html KHONG co tab \`${TAB}\` trong VUNG bai viet`,
    "loi tai lieu nam chung man voi bai viet la dung thu nguoi dung cam")
}
// Hai shell phai KHOP nhau. Chung dang byte-identical; mot ban sua le la cach
// SSR va trang mock lech nhau im lang (5 file test doc ban home-pages).
ok(SHELL_R === SHELL_H, "hai shell.html giu byte-identical",
  `render ${SHELL_R.length} vs home-pages ${SHELL_H.length} ky tu`)

/*
 * CAT THEO VUNG `v-napbaiviet`, khong dem ca shell.
 *
 * Shell mang CA BA view nap. Ban truoc dem `data-naptab` tren toan bo shell
 * roi doi bang 3 — WO-017 them dai loi cho tai lieu (`tep`) va video (`url`)
 * lam con so thanh 5, va cong do vi mot ly do KHONG lien quan toi thu no canh.
 *
 * Cung lop loi da trung nhieu lan trong du an nay: do pham vi CA TRANG khi
 * dieu phai dung la theo TUNG vung.
 */
const _iNBV = SHELL_H.indexOf('id="v-napbaiviet"')
const _sauNBV = _iNBV < 0 ? "" : SHELL_H.slice(_iNBV + 20)
const _jNBV = _sauNBV.search(/id="v-[a-z]+"/)
const VUNG_NBV = _jNBV < 0 ? _sauNBV : _sauNBV.slice(0, _jNBV)
ok(VUNG_NBV.length > 1000, `vung v-napbaiviet ${VUNG_NBV.length} ky tu`,
  "khong cat duoc vung ⇒ moi phep dem duoi day lay pham vi ca shell")
const soTab = [...VUNG_NBV.matchAll(/data-naptab="([a-z-]+)"/g)].map((m) => m[1])
ok(new Set(soTab).size === soTab.length, "khong tab nao khai trung",
  soTab.join(" · "))
// BA tab, khong bon: man nap bai viet co ba loi (link · file · viet); loi thu tu
// da sang man cua no. Doi DUNG 3 va doi KHONG co `thu-vien` trong so do — chi
// doi ">= 3" thi tab thu tu quay lai ma khong ai thay.
ok(soTab.length === 3, `co ${soTab.length} tab tren man nap bai viet`,
  soTab.join(" · "))
ok(!soTab.includes(TAB), `khong tab nao la \`${TAB}\``, soTab.join(" · "))

// Hai chieu nhu `nut-song §1`: moi tab duoc VE phai co pane, va nguoc lai.
const soPane = [...VUNG_NBV.matchAll(/data-napview="([a-z-]+)"/g)].map((m) => m[1])
const thieuPane = soTab.filter((t) => !soPane.includes(t))
const thieuTab = soPane.filter((p) => !soTab.includes(p))
ok(thieuPane.length === 0, "moi tab co mot pane", thieuPane.join(" · "))
// Pane KHONG co tab la CO Y voi moi man nap RIENG: moi man mot loi, nen khong
// con gi de chuyen. Doc tap do tu BANG KHAI thay vi go tay hai ten — C6b vua
// them `video`, va mot danh sach go tay se lech dung o day.
const PANE_RIENG = new Set(JSON.parse(readFileSync(
  join(GOC, "core", "assets", "loai-nguon.json"), "utf8"))
  .module.map((m) => m.ten === "bai-viet" ? "" : m.ten).filter(Boolean))
PANE_RIENG.add(TAB)
const moCoi = thieuTab.filter((x) => !PANE_RIENG.has(x))
ok(moCoi.length === 0,
  `khong pane mo coi (ngoai ${[...PANE_RIENG].join(" · ")} co chu dich)`,
  moCoi.join(" · "))

// Nut co nhanh: `moTabNap` chay tren MOI `[data-naptab]` nen no khong chet theo
// kieu "thieu case". Nhung pane thu tu phai co MOT ham nap rieng duoc goi —
// khong thi tab mo ra mot khung trong.
ok(/ganNapThuVien|napHienVatFE/.test(js),
  "bundle co ham xu ly loi thu vien", "tab mo ra mot khung trong la nut chet")

console.log("\n2 · Bang mime tới bundle — khong go tay lan thu hai\n")

for (const l of BANG.loai) {
  ok(js.includes(l.mime), `bundle mang mime \`${l.duoi}\``, l.mime)
  ok(js.includes(l.duoi), `bundle mang duoi \`${l.duoi}\``)
}
ok(js.includes(String(BANG.tran_byte)),
  `bundle mang tran_byte ${BANG.tran_byte}`,
  "khong co thi FE khong the kiem file.size truoc khi POST")

// Nguon `.ts` KHONG duoc go chuoi mime: chung phai den tu `define`.
ok(!/openxmlformats/.test(TS),
  "`.ts` nguon KHONG go tay chuoi mime nao",
  "hai ban go tay lech nhau la file gui len mang mot content-type khac han")
ok(!new RegExp(String(BANG.tran_byte)).test(TS),
  `\`.ts\` nguon KHONG go tay so ${BANG.tran_byte}`,
  "tran phai doc tu bang khai, khong thi hai noi lech nhau")
ok(/__MEDIA__/.test(TS), "`.ts` doc bang qua `__MEDIA__` (define cua build-fe)")

console.log("\n3 · file.size kiem TRUOC fetch — bai hoc B5\n")

// Cat thân hàm theo NGOẶC KHỚP, khong bang regex dung o cuoi dong: bundle giu
// nguyen binh luan nen thân hàm trai nhieu dong.
function thanHam(src, moc) {
  const i = src.indexOf(moc)
  if (i < 0) return null
  const j = src.indexOf("{", i)
  if (j < 0) return null
  let sau = 0
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}") { sau--; if (!sau) return src.slice(j, k + 1) }
  }
  return null
}

const than = thanHam(js, "async function napHienVatFE")
  ?? thanHam(js, "napHienVatFE = async")
ok(than !== null, "tim duoc than ham `napHienVatFE` trong bundle",
  "khong tim duoc thi ba phep kiem duoi day do MOT CHUOI RONG va xanh vo can cu")

if (than) {
  const iFetch = than.indexOf("fetch(")
  ok(iFetch >= 0, "than ham co goi `fetch(`")
  const truoc = iFetch >= 0 ? than.slice(0, iFetch) : ""

  /*
   * Doi mot PHEP SO THAT, khong doi "co nhac `.size` o dau do truoc fetch".
   *
   * Ban dau phep kiem nay chi so VI TRI cua chuoi `.size` voi vi tri `fetch(`.
   * Kiem hai chieu bat duoc lo: doi `if (f.size > MEDIA.tran_byte)` thanh
   * `if (false)` thi cong VAN XANH — vi `f.size` va `MEDIA.tran_byte` con nam
   * trong CAU THONG BAO cua nhanh da chet. Mot nhanh chet thoa man moi phep
   * kiem dang "co nhac ten".
   *
   * Nen doi ba thu, tat ca TRONG doan truoc `fetch(`:
   *   · mot phep so `.size` voi tran (toan tu so sanh that);
   *   · mot `return` — so xong ma khong thoat thi phep so la trang tri;
   *   · tran den tu BANG KHAI, khong tu mot so go tay.
   */
  ok(/\.size\s*[><]=?\s*.*tran_byte/.test(truoc),
    "co PHEP SO `.size` voi `tran_byte` TRUOC `fetch(`",
    "mot nhanh chet (`if (false)`) van chua du chuoi `.size` — nen phai doi toan tu")
  /*
   * Cat KHOI GUARD — tu phep so den `}` khop cua no — roi doi mot `return`
   * NAM TRONG do.
   *
   * Vi sao khong dung mot regex 'so roi return' tren ca doan truoc `fetch(`:
   * da do, no XANH khi bo het `return` cua khoi guard — vi mot `return` cua
   * nhanh KHAC (`if (!f.size) { …; return }`) con nam trong doan va thoa dieu
   * kien thu tu. Mot phep kiem theo THU TU khong biet return nao thuoc ve ai.
   */
  const iCmp = truoc.search(/\.size\s*[><]=?\s*.*tran_byte/)
  const khoi = iCmp < 0 ? null : (() => {
    const a = truoc.indexOf("{", iCmp)
    if (a < 0) return null
    let sau = 0
    for (let k = a; k < truoc.length; k++) {
      if (truoc[k] === "{") sau++
      else if (truoc[k] === "}") { sau--; if (!sau) return truoc.slice(a, k + 1) }
    }
    return null
  })()
  ok(khoi !== null, "tim duoc khoi guard cua phep so `.size`",
    "khong tim duoc thi phep kiem duoi day do mot chuoi rong")
  ok(khoi !== null && /return/.test(khoi),
    "khoi guard co `return` — so xong PHAI thoat, khong POST tiep",
    "canh bao roi POST tiep la nguoi dung thay ca canh bao LAN loi mang")
  ok(/tran_byte/.test(truoc),
    "tran den tu bang khai (`tran_byte`), khong tu mot so go tay")
}

// Duong ghi phai la LITERAL ngay sau `fetch(` — `no-write-path.test.js:50` doc
// dich o do. Ghep tu bien la lam cong mu.
ok(/fetch\(\s*["'`]\/api\/articles\/media["'`]/.test(js),
  "fetch tro literal `/api/articles/media`",
  "ghep tu bien lam `no-write-path` khong doc duoc dich")

console.log("\n4 · Nhan cho nguoi dung dan xuat tu bang khai\n")

// `accept` KHONG duoc go trong shell.html: shell la HTML TINH, no khong doc
// duoc bang khai. Go tay o do la tap thu hai, va tap thu hai luon la tap se
// lech khi bang doi. Nen FE dat `.accept` LUC CHAY tu `__MEDIA__`.
ok(!/id="up-tv-f"[^>]*accept=/.test(SHELL_H),
  "shell.html KHONG go tay `accept` — no khong doc duoc bang khai",
  "go tay o day la ban thu hai cua danh sach duoi")
ok(/\.accept\s*=/.test(js), "bundle DAT `.accept` luc chay",
  "khong dat thi input nhan moi loai file, roi server tu choi sau mot vong POST")

// Gia tri dat vao phai DAN XUAT tu bang, khong phai mot chuoi go trong .ts.
const iAcc = js.indexOf(".accept")
const quanhAcc = iAcc < 0 ? "" : js.slice(Math.max(0, iAcc - 400), iAcc + 400)
ok(/duoi|MEDIA|loai/.test(quanhAcc),
  "gia tri `accept` dan xuat tu bang khai (`duoi` cua tung loai)",
  quanhAcc.slice(0, 160))

chot("loi nap thu vien · bang khai lai form · size chan o client truoc khi POST")
