#!/usr/bin/env node
/**
 * WO-019 — `/api/loai-nguon` và màn Danh mục ĐỌC TỪ DB.
 *
 * Người dùng: *"bạn cần lưu các dữ liệu của mục phân loại này vào bảng DB —
 * giống concept và category ấy, ko được hardcode"*.
 *
 * ═══ VÌ SAO PHẢI ĐO QUA HTTP VÀ QUA HTML ══════════════════════════════════
 *
 * "Bảng có trong DB" đã được `check_loai_nguon_db.py` canh. Điều CÒN LẠI là hai
 * đường đọc: API trả nó, và màn Danh mục lấy TỪ ĐÓ chứ không dựng lại từ file
 * khai. Một panel vẫn suy từ `media-mime.json` sẽ trông y hệt — và mọi sửa của
 * người dùng trong DB sẽ không hiện ra, im lặng.
 *
 * CA ÂM của §3 là vế nặng: sửa một nhãn TRONG DB rồi đòi màn hiện nhãn mới. Nếu
 * panel còn suy từ file thì phép kiểm "panel có 14 dòng" vẫn xanh.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"
import { napRender, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()

const bangJ = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8"))
const media = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
/* Phép lọc phải KHỚP `gieo_loai_nguon` (dung_lai_db.py) và
 * `trang.mjs#laTaiLieu`. Ba chỗ dẫn xuất một danh sách; lệch một chỗ là con số
 * ở đây nói dối về DB. Ba khoá loại trừ, ba lý do khác nhau:
 *   chi_dan_xuat   máy sinh, người không nạp (.vtt)
 *   nhom_thu_vien  định dạng của bản ghi VIDEO (mp4 · mp3 …)
 *   chip_loc:false CÓ mime, KHÔNG làm chip lọc (.md · .txt — FR-064) */
const laChip = (l) => !l.chi_dan_xuat && l.nhom_thu_vien !== "video"
  && l.chip_loc !== false
const CHO = bangJ.module.find((m) => m.ten === "bai-viet").loai.length
  + media.loai.filter(laChip).length + 1 + media.video_host.length + 1

const kv = dungKho("gn-lnguon-kb", { chuDe: true })
const sc = dungSchema("gn-lnguon-sc", { chuDe: true })
const sv = await batServer({ kho: kv.kho, rac: kv.rac, schema: sc.schema })

try {
  console.log("\n1 · `GET /api/loai-nguon` trả bảng từ DB\n")

  const r = await goi(sv.cong, "GET", "/api/loai-nguon")
  ok(r.ma === 200, `GET /api/loai-nguon ⇒ 200 (được ${r.ma})`,
    "404 nghĩa là đường chưa tồn tại, và FE sẽ phải gõ tay danh sách")
  const items = r.json?.items ?? []
  ok(items.length === CHO, `trả ${items.length} loại nguồn (chờ ${CHO})`,
    "số lệch ⇒ hoặc gieo thiếu, hoặc route đọc nhầm bảng")
  ok(items.every((x) => x.id && x.module),
    "mỗi mục có `id` và `module`",
    "`module` là thứ trả lời *loại nguồn nào ứng với phân loại nào*")
  const mod = [...new Set(items.map((x) => x.module))].sort()
  ok(JSON.stringify(mod) === JSON.stringify(["bai-viet", "tai-lieu", "video"]),
    `đủ ba phân loại (được ${mod})`)

  console.log("\n2 · SỬA được một nhãn — đây là 'quản lý', không chỉ 'xem'\n")

  // BOC: danh sach rong o lan chay dau (R5 doi DO truoc) khong duoc lam cong
  // CHET — mot cong chet khong noi duoc rang nao dang canh gi.
  const mot = items[0] ?? { id: "__chua-co__", module: "__" }
  ok(items.length > 0, "co it nhat mot muc de thu sua",
    "danh sach rong ⇒ ca §2 do vi thieu vat lieu, khong vi loi that")
  const rs = await goi(sv.cong, "PATCH", `/api/loai-nguon/${mot.id}`,
    { body: { label_vi: "Nhãn người dùng đặt" } })
  ok(rs.ma === 200, `PATCH một nhãn ⇒ 200 (được ${rs.ma})`,
    `${JSON.stringify(rs.json ?? "")} — người dùng: *ta cần QUẢN LÝ danh sách `
    + "loại nguồn đó*")
  const r2 = await goi(sv.cong, "GET", "/api/loai-nguon")
  const sau = (r2.json?.items ?? []).find((x) => x.id === mot.id)
  ok(sau?.label_vi === "Nhãn người dùng đặt",
    "  sửa xong đọc lại thấy nhãn mới",
    `được ${JSON.stringify(sau)} — ghi mà đọc không ra là ghi vào hư không`)

  // CA ÂM · KHÔNG cho đổi `module` qua PATCH: loại nguồn thuộc phân loại nào là
  // do phép suy quyết (`nguonCua`), không do người gõ. Đổi nó là làm facet nói
  // sai về chính bản ghi.
  const rm = await goi(sv.cong, "PATCH", `/api/loai-nguon/${mot.id}`,
    { body: { module: "video" } })
  const r3 = await goi(sv.cong, "GET", "/api/loai-nguon")
  const sau3 = (r3.json?.items ?? []).find((x) => x.id === mot.id)
  ok(sau3?.module === mot.module,
    `  \`module\` KHÔNG đổi được qua PATCH (vẫn \`${mot.module}\`)`,
    `thành \`${sau3?.module}\` — loại nguồn thuộc phân loại nào là do phép suy `
    + "quyết, đổi tay là làm facet nói sai về chính bản ghi")

  console.log("\n3 · Màn Danh mục đọc TỪ DB, không dựng lại từ file khai\n")

  await napRender()
  // Dữ liệu render phải mang bảng — không thì panel chỉ có thể suy từ file.
  const { napRender: nr } = await import("./_render.mjs")
  const m = await nr()
  const du = m.duLieuReal ? m.duLieuReal() : null
  ok(du === null || Array.isArray(du.loai_nguon),
    "dữ liệu render mang `loai_nguon`",
    "không mang ⇒ panel buộc phải suy lại từ `media-mime.json`, và sửa trong DB "
    + "không bao giờ hiện ra")

  /*
   * CA ÂM NẶNG NHẤT: đưa một nhãn LẠ vào dữ liệu rồi đòi màn hiện nó. Panel còn
   * suy từ file khai thì nhãn lạ không xuất hiện — mà phép kiểm "panel có 14
   * dòng" vẫn xanh.
   */
  const LA = "NHAN-LA-CHI-CO-TRONG-DB"
  const h = await trangHtml("khai-niem", {
    data: {
      bans: [], mock: true, hong: [], concepts: [], categories: [],
      loai_nguon: [{ id: "pdf", module: "tai-lieu", label_vi: LA, thu_tu: 0 }],
    },
  })
  ok(h.includes(LA), "màn hiện nhãn CHỈ có trong dữ liệu (không có trong file khai)",
    "không hiện ⇒ panel vẫn suy từ `media-mime.json`, và mọi sửa trong DB im lặng")

  console.log("\n4 · FE nối được đường sửa — không chỉ API có\n")

  /*
   * API co ma FE khong noi thi nguoi dung khong sua duoc gi tren man — va phep
   * kiem "PATCH tra 200" van xanh. Nen do CA HAI dau: markup co nut, va bundle
   * biet duong cua `nguon`.
   */
  const { readFileSync: rf } = await import("node:fs")
  const MA_FE = rf(join(GOC, "web", "plugins", "multiwindow", "src",
    "scripts", "multiwindow.inline.ts"), "utf8")
  ok(/DUONG_NHAN[\s\S]{0,200}nguon:/.test(MA_FE),
    "bundle biết đường của `nguon`",
    "nút gửi PATCH tới `undefined/<id>` ⇒ 404, và người dùng đọc ra 'hỏng'")
  // ĐO DƯƠNG, không đo phủ định: `? await fetch` có 4 chỗ HỢP LỆ khác trong
  // file (`SUA_TL ? await fetch(...)`), nên một mẫu phủ định quanh nó bắt
  // nhầm. Điều phải đúng là dòng gửi PATCH dựng đường bằng BẢNG TRA.
  ok(/const r = await fetch\(DUONG_NHAN\[loai\]/.test(MA_FE),
    "  đường PATCH dựng từ bảng tra, không từ ternary",
    "ternary hai nhánh không mở rộng được cho cái thứ ba mà không thêm nhánh, và mỗi nhánh là một chỗ để quên")

  /*
   * SUA XONG MAN PHAI DOI NGAY.
   *
   * Danh sach loai nguon do SSR dung — khong co moc nao de `napDanhMuc` lam
   * moi. Do tren trinh duyet truoc khi va: PATCH thanh cong ma hang giu chu
   * cu toi khi tai lai. "Ghi ma doc khong ra" — cung lop loi da bat o WO-016.
   */
  const thanGui = (() => {
    const i = MA_FE.search(/function guiPopupSua/)
    if (i < 0) return ""
    const b = MA_FE.indexOf("{", i)
    let sau = 0
    for (let k = b; k < MA_FE.length; k++) {
      if (MA_FE[k] === "{") sau++
      else if (MA_FE[k] === "}") { sau--; if (!sau) return MA_FE.slice(b, k + 1) }
    }
    return ""
  })()
  ok(thanGui.length > 0, "tìm được thân `guiPopupSua`")
  ok(/loai === "nguon"/.test(thanGui),
    "  `guiPopupSua` có nhánh riêng cho `nguon`",
    "không có ⇒ sửa xong màn giữ chữ cũ tới khi tải lại")
  ok(/textContent\s*=/.test(thanGui) && /dataset\.nhan\s*=/.test(thanGui),
    "  cập nhật CẢ chữ trên hàng LẪN `data-nhan` của nút",
    "quên `data-nhan` ⇒ lần mở sau hiện giá trị lúc trang được dựng, không phải giá trị hiện tại")
  chot("API trả bảng · sửa được nhãn · module bất biến · màn đọc từ DB")
} finally {
  sv.dung()
  kv.don()
}
