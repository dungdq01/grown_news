/**
 * WO-061 · Ba lỗi chủ dự án bắt 2026-09-06, cùng một gốc: hệ coi MỌI việc là
 * việc chưng cất, và coi MỌI hiện vật là thứ đáng chiếm chỗ xem trước.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const mw = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
const cc = doc("../plugins/cctab/src/cctab.inline.ts")

console.log("\nWO-061 · việc theo LOẠI, hiện vật theo VAI\n")

// ── 1 · HIỆN VẬT DẪN XUẤT không được chiếm chỗ xem trước ───────────────
//
// Đo trên bản ghi thật: video `cai-dat-va-thiet-lap-hermes-tren-vps` sau khi
// sinh transcript có `media = [ {text/vtt} ]`, và `xemTruocHienVat` THOÁT SỚM
// ở `media[0]` — nên nhánh vẽ trình phát video không bao giờ chạy. Video
// KHÔNG mất dữ liệu (`url` YouTube còn nguyên); nó mất CHỖ.
//
// `chi_dan_xuat: true` đã có sẵn trong `media-mime.json` cho `.vtt` — cờ đúng
// đã tồn tại, chỉ chưa ai đọc nó ở đây.
ok(/chi_dan_xuat/.test(mw),
  "1 · xem trước LỌC hiện vật dẫn xuất theo cờ bảng khai",
  "gõ cứng `text/vtt` thì loại dẫn xuất thứ hai lại chiếm chỗ y như vậy")
const i = mw.indexOf("function xemTruocHienVat")
// BỎ CHÚ THÍCH trước khi soi. Chú thích giải thích lỗi phải được NHẮC TÊN nó
// — `media[0]` xuất hiện trong đúng đoạn văn nói vì sao không dùng `media[0]`.
// Một cổng đếm chuỗi trong văn xuôi thì phạt người viết chú thích rõ.
const boChuThich = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const than = i > 0 ? boChuThich(mw.slice(i, i + 1800)) : ""
ok(/filter|find\(/.test(than) && !/media\[0\]/.test(than),
  "1b · KHÔNG lấy cứng `media[0]`",
  "`[0]` là 'cái được nạp đầu', không phải 'cái đáng xem'")

// ── 2 · cửa sổ việc phải biết LOẠI việc ───────────────────────────────
ok(!/title:\s*"Chưng cất · "/.test(cc),
  "2 · tiêu đề cửa sổ việc KHÔNG gắn cứng 'Chưng cất'",
  "một việc `sinh-transcript` mang nhãn 'Chưng cất' là màn nói sai việc nó làm")
ok(/sinh-transcript/.test(cc),
  "2b · cửa sổ việc phân biệt được `sinh-transcript`")

// ── 3 · kết thúc nói đúng theo loại ───────────────────────────────────
//
// Việc transcript KHÔNG BAO GIỜ sinh bản nháp. Chỉ người sang "hàng nháp" sau
// một việc transcript là chỉ tới một nơi chắc chắn trống — và chủ dự án đã đi
// tới đó, thấy `0 nháp`, rồi báo là lỗi. Đúng là lỗi.
const j = cc.indexOf("function veKetQua")
const thanKq = j > 0 ? cc.slice(j, j + 1200) : ""
ok(/loai|sinh-transcript/.test(thanKq),
  "3 · `veKetQua` rẽ theo LOẠI việc trước khi nói gì",
  "nói 'tìm ở hàng nháp' cho một việc không sinh nháp là chỉ người tới chỗ trống")

// ── 4 · "xem ban nhap" MO CUA SO, khong dieu huong ────────────────────
//
// Roi trang la mat CA HAI cua so — nguon dang doc va cua so viec. Ca diem
// cua flow nay la *vua xem ban goc vua duyet ban chung cat ben canh*.
ok(!cc.includes("/chung-cat/nhap/?nhap="),
  "4 · `xem ban nhap` KHONG con la link dieu huong")
ok(/data-ccxem/.test(cc) && /moCuaSoNhap\(String\(xem/.test(cc),
  "4b · no mo cua so doc ban nhap")

// ── 5 · bam the o /chung-cat/ mo BAN CHUNG CAT ────────────────────────
//
// Panel "CHI TIET VIEC" noi giai doan · model · lan gui — ma re chuot da noi
// du (`WO-048`). Cu bam phai tieu vao viec nguoi that su muon: DOC va DUYET.
const cg = doc("../plugins/chungcat/src/chungcat.inline.ts")
const k = cg.indexOf('const the = t.closest("[data-ccmo]")')
const thanK = k > 0 ? cg.slice(k, k + 1400) : ""
ok(/ccMoNhap/.test(thanK),
  "5 · bam the viec XONG ⇒ mo cua so ban chung cat")
ok(/ccMoChiTiet/.test(thanK),
  "5b · viec CHUA xong van mo panel chi tiet",
  "chua co nhap thi khong co gi de doc — panel la cau tra loi dung cho ca do")

// ── 6 · MOT tap loai, MOI cho doc chung ───────────────────────────────
//
// Lan sua dau toi chua `veKetQua` (cua so viec) ma QUEN dong viec trong tab
// — no van moi "xem ban nhap" cho mot viec `sinh-transcript`, va bam vao ra
// "khong co nhap <ulid>". Chu du an gap dung cau do.
//
// Cung mot su that noi o HAI CHO la hai cho de quen mot cho. Ve nay bat
// buoc ca hai doc chung mot tap.
ok(/LOAI_KHONG_NHAP/.test(cc),
  "6 · co MOT tap `LOAI_KHONG_NHAP` dung chung")
ok((cc.match(/LOAI_KHONG_NHAP\.has/g) || []).length >= 2,
  "6b · CA HAI cho (dong viec + cua so ket qua) doc tap do",
  "chi mot cho doc thi cho kia van moi nguoi mo mot ban nhap khong ton tai")
// KHONG them ve thu ba kieu "khong con chuoi `xem ban nhap` truoc phep re":
// chuoi ay nam trong chinh doan chu thich giai thich loi, va mot cong dem
// chuoi trong van xuoi thi phat nguoi viet chu thich ro. Ve 6 + 6b da giu
// dung tinh chat: MOT tap, MOI cho doc no.

// ── 7 · MOT nguon cho noi dung cau `__GN_MW__` ───────────────────────
//
// Co BA cho publish cau: hai `??=` dau file va mot `=` (ghi de) o cuoi. Toi
// them `md` vao hai cho dau ma quen cho thu ba, nen cau CUOI CUNG ghi de mat
// `md`; chunk goi `mw().md` nhan `undefined` va roi ve chu tho. Bundle CO,
// trinh duyet KHONG — toi do oan cho cache mot luc.
ok(!/__GN_MW__\s*(\?\?)?=\s*\{/.test(mw),
  "7 · khong cho nao publish cau bang mot object literal roi",
  "ba ban cua mot danh sach la hai cho de quen")
ok((mw.match(/__GN_MW__\s*(\?\?)?=\s*_cau\(\)/g) || []).length >= 3,
  "7b · ca ba cho goi CUNG mot ham dung cau")
ok(/function _cau\(\)[^]{0,200}md/.test(mw),
  "7c · cau mang `md` — chunk dung no de dung markdown ban nhap")

// ── 8 · ban nhap dung MARKDOWN, khong do chu tho ─────────────────────
//
// Nguoi duyet phai DOC ban nay de quyet; mot khoi `# ## **` chua dung thi
// doc bang mat rat met, va met thi nguoi duyet qua loa.
ok(/veThanNhap/.test(cc) && /mw\(\)\.md/.test(cc),
  "8 · ban nhap dung bang `md()` cua gn.js — CUNG bo dung voi bai trong kho")
ok(/vc-md/.test(cc) && !/hv-txt vc-t/.test(cc),
  "8b · khong con do thang vao mot the `pre`")

// ── 9 · the o hang doi nhap dung MOC CHUNG ───────────────────────────
const cgg = doc("../plugins/chungcat/src/chungcat.inline.ts")
ok(/data-ccnhap="\$\{esc\(v\.job_ulid\)\}/.test(cgg),
  "9 · the nhap mang `data-ccnhap` (moc ma phep mo cua so nghe)",
  "the mang mot moc, handler nghe moc khac ⇒ bam khong ra gi")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · việc theo loại, hiện vật theo vai")
process.exit(loi ? 1 : 0)
