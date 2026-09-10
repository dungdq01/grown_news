#!/usr/bin/env node
/**
 * Bien dich MOI plugins/**\/*.inline.ts -> .js (esbuild, devDep cua web/).
 *
 * C6 cua FR-034 — tach tu link-plugins.mjs:115-153 de song doc lap voi
 * _quartz/ (thu muc do nho di cung Quartz). Cac file .inline.js la thu
 * assets.mjs ghep thanh gn.js luc server khoi dong; sua .inline.ts thi chay
 * lai lenh nay roi restart `npm run api`.
 *
 * QUET DE QUY thay vi hardcode ten file — bai hoc cu: luot dau chi dich
 * multiwindow.inline.ts nen them plugin backdrop la chet ngay.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = dirname(fileURLToPath(import.meta.url))
const NGUON = join(WEB, "plugins")

/*
 * KHUNG THAN BAI vao bundle qua `define` — duong dan xuat thu tu cua
 * core/assets/khung-than-bai.json (FR-036). Ba duong kia: khung.py (Python),
 * web/test/_khung.mjs (test Node), check_khung.py (van xuoi).
 *
 * Vi sao `define` chu khong `import ... from "*.json"`: lenh nay chay
 * `bundle:false`, nen mot `import` con song sot trong file .js se bi
 * assets.mjs boc vao IIFE va thanh SyntaxError — giet ca BA script, khong
 * chi script nay.
 *
 * LOT moi khoa `$comment*` truoc khi nhung. Do duoc: page-weight cho gn.js
 * tran 100 KB, va trang lon nhat (`mock/nap/`) dang 66 KB tren tran 74 —
 * chi ~8 KB du. Binh luan trong JSON la de NGUOI doc file khai, khong phai
 * de tai xuong trinh duyet.
 */
const KHUNG_PATH = join(WEB, "..", "core", "assets", "khung-than-bai.json")
if (!existsSync(KHUNG_PATH)) {
  // THROW, khong canh bao roi di tiep: thieu file thi `__KHUNG__` thanh
  // `undefined` luc chay, form dung 0 o, va khong cong nao do.
  throw new Error(`thieu ${KHUNG_PATH} — khung than bai khai o DO (FR-036)`)
}
const lotComment = (o) => Array.isArray(o)
  ? o.map(lotComment)
  : (o && typeof o === "object"
      ? Object.fromEntries(Object.entries(o)
          // MOI khoa `$`, khong chi `$comment*`. Do duoc: `$magic_la` — chu
          // thich cho `magic`, ma `magic` da bi chieu ra khoi bundle tu
          // FR-036 — van di theo 166 byte vao trinh duyet. Loc theo tien to
          // hep thi khoa `$` dat ten khac lot qua, im lang.
          .filter(([k]) => !k.startsWith("$"))
          .map(([k, v]) => [k, lotComment(v)]))
      : o)
/*
 * CHIEU BANG KHUNG xuong truong FE THAT DOC (T03-85).
 *
 * `locator` la luat cua validate phia Python; `phien_ban` / `tran_tu_mem` /
 * `tran_tu_thu_vien` chi co mat trong KHAI BAO KIEU cua FE — khai bao kieu
 * bien mat luc bien dich, nen khong mot phep doc nao cham toi chung.
 *
 * Danh sach go tay, va no KHONG troi duoc: `test/bang-khai-khong-mo.js`
 * canh hai chieu — thua thi do o chieu A, thieu thi do o chieu B.
 */
const KHUNG_BO_GOC = ["phien_ban", "tran_tu_mem", "tran_tu_thu_vien"]
const KHUNG_BO_MUC = ["locator"]
const chieuMuc = (m) => {
  const r = Object.fromEntries(
    Object.entries(m).filter(([k]) => !KHUNG_BO_MUC.includes(k)))
  if (Array.isArray(r.con)) r.con = r.con.map(chieuMuc)
  return r
}
const KHUNG_GOC = lotComment(JSON.parse(readFileSync(KHUNG_PATH, "utf8")))
const KHUNG_JSON = JSON.stringify({
  ...Object.fromEntries(
    Object.entries(KHUNG_GOC).filter(([k]) => !KHUNG_BO_GOC.includes(k))),
  muc: KHUNG_GOC.muc.map(chieuMuc),
})

/*
 * BANG MIME cua kho hien vat — cung duong `define`, cung ly do (FR-036/B7b).
 *
 * FE can ba thu tu bang nay: `accept` cua input file, danh sach duoi hien cho
 * nguoi dung, va `tran_byte` de kiem `file.size` TRUOC khi POST.
 *
 * Vi sao FE phai tu kiem size: `413` KHONG toi duoc client giua luc upload —
 * trinh duyet nhan ECONNRESET tren duong GHI truoc khi kip DOC phan hoi (do
 * duoc o B5, WL-01K9N7FR036B5). Khong kiem o client thi nguoi dung keo mot file
 * 30 MB vao va chi thay "mang loi".
 */
const MEDIA_PATH = join(WEB, "..", "core", "assets", "media-mime.json")
if (!existsSync(MEDIA_PATH)) {
  throw new Error(`thieu ${MEDIA_PATH} — bang mime kho hien vat khai o DO (FR-036)`)
}
/*
 * CHIEU `magic` RA KHOI BUNDLE.
 *
 * Do duoc: bang nay nhung 1313 byte vao `gn.js`. FE doc `.duoi` `.mime` `.ten`
 * `.mien` `.nhung` `.id_mau` `.id_tu` `.nhan` va `mac_dinh.*` — KHONG doc
 * `magic`. Soi byte mo dau la viec cua SERVER (M09-R2: may tinh, luon luon),
 * nen 58 byte hex do nam khong trong bundle cua trinh duyet.
 *
 * Cung phep chieu da lay lai ~3 KB cho `__MAN__` o FR-038/C6: tham chieu mot
 * bang keo NGUYEN bang vao bundle, ke ca truong khong ai doc.
 */
const MEDIA_GOC = lotComment(JSON.parse(readFileSync(MEDIA_PATH, "utf8")))
// `loai_thu_vien` KHONG co consumer JS nao (do o FR-038/S5, van dung hom
// nay): FE khong doc mot lan. No o lai trong file khai cho Python.
const { loai_thu_vien: _bo, ...MEDIA_CON } = MEDIA_GOC
const XUAT_JSON = JSON.stringify(lotComment(JSON.parse(
  readFileSync(join(WEB, "..", "core", "assets", "xuat-dang.json"), "utf8"))))

const MEDIA_JSON = JSON.stringify({
  ...MEDIA_CON,
  // `magic` chieu ra tu FR-036; `chi_dan_xuat` chieu ra tu T01-45 — no la moi
  // quan tam cua SSR (`trang.mjs` loc chip bo loc), FE khong doc mot lan.
  // Mot khoa toi trinh duyet ma khong ai doc la byte tai-dau tra gia cho khong.
  //
  // `magic_bu` chieu ra CUNG LY DO `magic`: no la do lech de so byte mo dau, va
  // viec do o SERVER (`dungchung.mjs`). Gui do lech ma khong gui chu ky la gui
  // mot nua mot phep kiem — vo dung o trinh duyet, ton byte o moi trang.
  //
  // `nhom_thu_vien` O LAI trong bundle: `napvideo` doc no de dan xuat `accept`
  // cua o file mp4 (T03-109). MOT nhan co tham quyen o ca hai ben tot hon hai
  // phep phan loai — mot o nhan, mot o tien to mime — vi hai phep se lech.
  //
  // `xem_truoc` cung O LAI DU DU: bo qua phien ban truoc toi da chieu no ra tru
  // dong `iframe`, lay lai 220 byte. Do la SAI HUONG: cong `media-cua-so` doi
  // "bundle nhac MOI dang xem truoc co that trong bang", va phep chieu do lam
  // no do — toi da dinh sua chinh cong day de vua phep chieu. Sau khi don hop
  // thoai chung cat sang chunk, `gn.js` du 3951 byte, nen 220 byte kia khong
  // con phai doi bang mot menh de bi lam yeu.
  // `chip_loc` (FR-064) cung chieu RA: no la khoa cua SSR — quyet mot dong co
  // lam chip trong facet hay khong. FE khong doc mot lan.
  // `chi_dan_xuat` GIỮ LẠI trong bundle từ `WO-061`.
  //
  // Trước đây nó bị lược vì chỉ SSR đọc. Nay FE đọc: `xemTruocHienVat` lọc
  // hiện vật DẪN XUẤT ra khỏi phép chọn bản xem trước — nếu không, một `.vtt`
  // vừa sinh chiếm chỗ trình phát video và video BIẾN MẤT khỏi cửa sổ đọc.
  //
  // Cổng `bang-khai-khong-mo` bắt đúng ca này: tôi viết phép lọc trước, và nó
  // đã lặng lẽ vô hiệu vì trường không có trong bundle — `undefined` không đỏ
  // ở đâu cả. Đó là lý do cổng ấy tồn tại.
  loai: MEDIA_CON.loai.map(({ magic, magic_bu, chip_loc, ...con }) => con),
})

/*
 * BANG MAN + BANG LOAI-NGUON vao bundle — cung duong `define` (FR-038/C5).
 *
 * FE can bang man cho `DUONG` (id shell -> path URL) va bang loai-nguon cho cac
 * man loai o C6/C7. Truoc do `DUONG` go tay trong `multiwindow.inline.ts`, la
 * ban thu BA phai khop bang tay voi `VIEW_SSR` va `MAN`.
 *
 * CHIEU CHIEU o day khong ton byte vo ich: esbuild `define` chi thay o cho co
 * THAM CHIEU. Bang nao FE chua dung thi khong mot byte nao vao gn.js — do duoc
 * bang `node test/page-weight.test.js` truoc va sau.
 */
const bangKhai = (d) => {
  if (!existsSync(d)) throw new Error(`thieu ${d} — bang khai o DO (FR-038)`)
  return JSON.stringify(lotComment(JSON.parse(readFileSync(d, "utf8"))))
}
// Duong dan dung THANG o day, khong qua mot tham so `ten`: `check_khai_mot_noi`
// §4 doi ten bang khai nam tren mot dong CO `join(`/`readFileSync` — no phan
// biet mot lenh doc voi mot dong binh luan bang dung cach do. Goi
// `bangKhai("man-hinh.json")` la ten file nam mot minh tren mot dong khong co
// bieu thuc duong dan nao, va cong bao "chua doc" DUNG theo luat cua no.
const MAN_JSON = bangKhai(join(WEB, "..", "core", "assets", "man-hinh.json"))

const NHOM_JSON = bangKhai(join(WEB, "..", "core", "assets", "loai-nguon.json"))

/*
 * PHÉP CHIẾU `source_type -> id_shell của màn nạp` (WO-013/1).
 *
 * FE cần đúng ánh xạ này để `suaTuCua` về màn nạp CỦA MODULE bản đang sửa. Tham
 * chiếu thẳng `__NHOM__` thì esbuild kéo NGUYÊN `loai-nguon.json` vào bundle:
 * đo được +1047 byte, trong khi `gn.js` chỉ còn dư 5.
 *
 * Đây KHÔNG phải bảng gõ tay thứ hai — nó tính lúc build từ chính hai bảng khai,
 * cùng nguyên tắc `lotComment`. Đổi bảng khai thì phép chiếu đổi theo, không có
 * chỗ nào để lệch.
 */
const _man = JSON.parse(MAN_JSON).man
const _napCua = (ten) => _man.find((x) => x.module === ten && x.cat_khi_khac)
/*
 * CHỈ khai NGOẠI LỆ + khoá `""` là mặc định — đo được: bảng đầy đủ 7 mục tốn
 * ~200 byte và `gn.js` vượt trần 325. Nhóm đông loại nhất làm mặc định, nên
 * bảng chỉ còn hai mục.
 *
 * Khoá `""` chứ không một hằng gõ trong FE: `"napbaiviet"` viết thẳng ở FE là
 * một tên màn gõ tay lần thứ hai, và nó lệch đúng vào hôm màn đó đổi id.
 */
const _macDinh = JSON.parse(NHOM_JSON).module
  .slice().sort((a, c) => c.loai.length - a.loai.length)[0]
/*
 * PHÉP CHIẾU thứ hai: `id_shell -> path` cho `DUONG` của FE.
 *
 * FE chỉ dùng HAI trường của bảng màn, nhưng tham chiếu `__MAN__` kéo NGUYÊN
 * `man-hinh.json` vào bundle — kể cả `$comment`, `nhan`, `tieu_de`, `vi_tri`…
 * Đo được: chiếu xuống còn hai trường tiết kiệm ~2 KB, và `gn.js` đang vượt trần.
 *
 * Cùng nguyên tắc `NAP_CUA_JSON`: tính lúc build từ chính bảng khai, nên không
 * có bản gõ tay thứ hai để lệch.
 */
const DUONG_JSON = JSON.stringify(Object.fromEntries(
  _man.map((m) => [m.id_shell, m.path.replace(/^\/|\/$/g, "")]),
))

const NAP_CUA_JSON = JSON.stringify(Object.fromEntries([
  ["", _napCua(_macDinh.ten)?.id_shell ?? ""],
  ...JSON.parse(NHOM_JSON).module
    .filter((m) => m.ten !== _macDinh.ten)
    .flatMap((m) => {
      const man = _napCua(m.ten)
      return man ? m.loai.map((l) => [l, man.id_shell]) : []
    }),
]))

const tsFiles = []
const quetTs = (d) => {
  if (!existsSync(d)) return
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) quetTs(p)
    else if (f.endsWith(".inline.ts")) tsFiles.push(p)
  }
}
quetTs(NGUON)

if (tsFiles.length) {
  const { build } = await import("esbuild")
  for (const f of tsFiles) {
    await build({
      entryPoints: [f],
      outfile: f.replace(/\.ts$/, ".js"),
      bundle: false,
      format: "esm",
      target: "es2022",
      loader: { ".ts": "ts" },
      define: {
        __KHUNG__: KHUNG_JSON, __MEDIA__: MEDIA_JSON,
        // T03-117 · bang khai LOAI -> DANG XUAT. Cua API va menu FE
        // cung doc MOT nguon, nen them mot dang la ca hai tu moc.
        __XUAT__: XUAT_JSON,
        __MAN__: MAN_JSON, __NHOM__: NHOM_JSON,
        __DUONG__: DUONG_JSON,
        __NAP_CUA__: NAP_CUA_JSON,
      },
      logLevel: "silent",
    })
    console.log(`  dich  ${f.slice(NGUON.length + 1)}  ->  .js`)
  }
}
console.log(`build-fe: ${tsFiles.length} file .inline.ts`)
