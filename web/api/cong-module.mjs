/**
 * M08_api — CỔNG RIÊNG của từng module nội dung (FR-040).
 *
 * VÌ SAO FILE NÀY TỒN TẠI: trước FR-040, ba loại đi qua **một** `taoBai`, và
 * luật riêng của từng module sống dưới dạng lệnh `if` bên trong nó. Thêm luật
 * cho tài liệu là **sửa cái hàm mà bài viết cũng đi qua** — đúng *"gộp chung
 * tính năng"* người dùng cấm, chỉ ở tầng không nhìn thấy trên màn hình.
 *
 * KHÔNG có lời gọi fs ghi và không có SQL nào ở đây: `api-guard` răng 1 đòi mọi
 * handler sạch đường ghi, răng 2 đòi mọi mutation ở `dungchung.mjs`. Tách route
 * KHÔNG có nghĩa là mỗi file tự viết SQL — mỗi route mang CỔNG, rồi cùng gọi một
 * đường ghi.
 *
 * `video_host` ở đây là lần ĐẦU whitelist host có mặt phía server. Đo được
 * trước khi viết: nó chỉ sống ở FE (`multiwindow.inline.ts:1184`), nên một POST
 * thẳng vào API lưu được bản video với URL bất kỳ. FE chặn tại chỗ dán là đúng
 * chỗ cho NGƯỜI; nó không phải cổng cho MÁY.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { hienVat, loaiCuaNhom, NHOM } from "./dungchung.mjs"

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const MEDIA_BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const HOST_VIDEO = MEDIA_BANG.video_host

/*
 * BẢNG CỔNG — một hàm cho mỗi module. Trả `null` khi qua, hoặc `{ma, loi}`.
 *
 * Khoá là tên module trong `loai-nguon.json`. Dòng `assert` ngay dưới biến
 * "quên viết cổng cho module thứ tư" thành lỗi LÚC NẠP, không thành một module
 * lặng lẽ đi qua mà không cổng nào chấm.
 */
/**
 * Chủ đề + khái niệm cho hồ sơ `thu-vien` — MỘT phép kiểm, hai module dùng.
 *
 * Đo được trước khi viết: hai đường nạp tài liệu/video có **0** `<select>` nên
 * mọi bản vào kho với `category: []`, và hai bảng nhãn có **0 hàng**. Facet Chủ
 * đề vì thế rỗng vĩnh viễn. Một ô trên form là NHẮC; chỉ cổng này là LUẬT —
 * `validate.py --strict` hiện cho qua một bản `thu-vien` không nhãn nào.
 *
 * KHÔNG áp cho `bai-viet`: hồ sơ `phan-tich` đã có cổng mục/dẫn nhập/tinh
 * túy/locator trong `validate.py`. Viết lại luật nhãn cho nó ở đây là bản thứ
 * hai của một luật, và nó chặn cả bản ghi cũ — thứ không ai xin chặn.
 *
 * VẮNG và RỖNG phải bị đối xử NHƯ NHAU: `category: []` và không có khoá
 * `category` là hai hình dạng của cùng một sự thật. Chặn một hình để lọt hình
 * kia thì chỉ cần bỏ khoá là đi qua.
 *
 * Câu lỗi NÊU TÊN trường thiếu. "Dữ liệu không hợp lệ" làm người gọi thử lại
 * đúng cái vừa bị từ chối.
 */
const nhanDu = (fm, ten) => {
  const thieu = []
  if (!Array.isArray(fm?.category) || !fm.category.length) thieu.push("chủ đề (`category`)")
  if (!Array.isArray(fm?.concepts) || !fm.concepts.length) thieu.push("khái niệm (`concepts`)")
  if (!thieu.length) return null
  return {
    ma: 422,
    loi: `Bản ${ten} phải có ${thieu.join(" và ")} — gán ở màn nạp, `
      + "hoặc tạo nhãn mới ở màn Danh mục rồi chọn lại.",
  }
}

const CONG = {
  // Bài viết không có ràng buộc riêng ở tầng route: hồ sơ `phan-tich` đã có
  // cổng mục/dẫn nhập/tinh túy/locator trong `validate.py`, và viết lại nó ở
  // đây là bản thứ hai của cùng một luật.
  "bai-viet": () => null,

  "tai-lieu": (fm) => {
    // FR-052 · MẢNG. Bản đầu ở đây từ chối `Array.isArray(m)` tường minh.
    const hv = hienVat(fm)
    if (!hv.length || !hv.every((x) => x.sha256)) {
      return {
        ma: 422,
        loi: "Bản tài liệu phải có `media` trỏ tới hiện vật đã nạp — "
          + "POST /api/articles/media trước, rồi mới tạo bản ghi.",
      }
    }
    /*
     * WO-021 · KHONG con doi nhan.
     *
     * Nguoi dung dao chinh quyet dinh cua ho o T08-17: *"cac fields
     * co dinh thi up gi len cung nen hien thi len UI — ko han can
     * require"*. O van hien du va van nhac, nhung gui thieu thi VAN
     * GHI duoc.
     *
     * He qua noi ra: facet Chu de se rong dan neu bo qua thuong xuyen.
     * `nhanDu` GIU LAI — no la mot phep kiem dung, chi khong duoc goi;
     * xoa han thi lan sau bat lai phai viet lai tu dau.
     */
    return null
  },

  video: (fm) => {
    /*
     * FR-075 (duyet 2026-09-09) · `anyOf [media, url]`, khong `url` bat buoc.
     *
     * Cong nay tung NGHIEM HON schema: `frontmatter.schema.json allOf[6]` khai
     * `ho_so: thu-vien ⇒ anyOf [media | url]`, va `M11_video/spec:38` chep lai
     * dung cau do. Hai cho noi hai tran thi ben nghiem hon thang MOT CACH VO
     * HINH — dung thu `media-mime.json $comment_tran` da ghi cho tran byte.
     * Hau qua that: nguoi dung tai mot .mp4 len (dung thu man moi lam), byte
     * VAO KHO thanh cong, roi ban ghi bi tu choi bang mot cau noi ve `url` ma
     * ho chua nhap. `WO-058`.
     *
     * Vi sao dung `hienVat(fm)` chu khong doc `fm.media` truc tiep: nhanh
     * `tai-lieu` ngay tren dang dung chinh ham do (FR-052 · MANG). Hai phep
     * doc cho mot truong la hai cho de lech.
     */
    const u = String(fm?.url ?? "").trim()
    const hv = hienVat(fm)
    const coByte = hv.length > 0 && hv.every((x) => x.sha256)
    if (!u && !coByte) {
      return {
        ma: 422,
        loi: "Bản video phải có `url` (dán link) HOẶC `media` (tải file lên "
          + "rồi POST /api/articles/media trước).",
      }
    }
    /*
     * DUONG TAI FILE · `kho://video/<slug>`.
     *
     * `url` KHONG bo duoc: no nam trong `required` GOC cua
     * `frontmatter.schema.json`, va file do la file FROZEN duy nhat cua
     * `core/`. Nen thay vi doi hop dong goc cua MOI ban ghi, dung dung quy
     * uoc `tai-lieu` da song voi tu dau: `kho://tai-lieu/<slug>`
     * (`kb/tai-lieu/*.md` · `multiwindow.inline.ts:1328` ·
     * `core/tools/sinh_kb_mock.py:139`). 0 dong sua file frozen, 0 chu ky, va
     * khong phat minh gi — chi ap mot quy uoc DA CO cho loai thu hai can no.
     *
     * Hai rang buoc, ca hai bat buoc:
     *   · phai KEM media — mot dia chi trong kho ma khong co byte nao la mot
     *     ban ghi rong, va no se hong o cho khac, muon hon, kho tra hon;
     *   · slug trong url phai la slug CUA CHINH BAN GHI — `kho://video/khac`
     *     tro vao byte cua nguoi khac la mot con tro sai im lang.
     */
    const kho = u.match(/^kho:\/\/video\/(.+)$/)
    if (kho) {
      if (!coByte) {
        return {
          ma: 422,
          loi: "`url` dạng `kho://video/<slug>` phải kèm `media` trỏ hiện vật "
            + "đã nạp — POST /api/articles/media trước.",
        }
      }
      const slug = String(fm?.slug ?? "").trim()
      if (kho[1] !== slug) {
        return {
          ma: 422,
          loi: `\`url\` trỏ \`kho://video/${kho[1]}\` nhưng bản ghi có slug `
            + `\`${slug}\` — một địa chỉ trong kho phải trỏ vào chính nó.`,
        }
      }
      // KHONG kiem host: `kho://` khong co host ngoai nao de kiem.
      return null
    }
    let mien
    try { mien = new URL(u).hostname.toLowerCase() } catch {
      return { ma: 422, loi: `\`url\` không phải một URL hợp lệ: ${u}` }
    }
    // So theo HẬU TỐ có dấu chấm, không `includes`: `includes("youtube.com")`
    // khớp cả `youtube.com.kẻ-xấu.example`, tức whitelist thành vô nghĩa đúng
    // theo cách khó thấy nhất.
    const hop = HOST_VIDEO.some((h) =>
      mien === h.mien || mien.endsWith("." + h.mien)
      // `youtu.be` là tên rút gọn CÙNG nhà của `youtube.com` và FE sinh ra nó;
      // khai ở đây thay vì thêm một dòng vào bảng khai, vì bảng đó mô tả nơi
      // NHÚNG được, còn đây là nơi NHẬN được.
      || (h.mien === "youtube.com" && (mien === "youtu.be" || mien.endsWith(".youtu.be"))))
    if (!hop) {
      return {
        ma: 422,
        loi: `Host \`${mien}\` không nằm trong whitelist video: `
          + HOST_VIDEO.map((h) => h.mien).join(" · "),
      }
    }
    return null
  },
}

const thieuCong = NHOM.filter((n) => typeof CONG[n] !== "function")
if (thieuCong.length) {
  throw new Error(
    `FR-040 · module ${thieuCong.join(", ")} khai trong loai-nguon.json mà KHÔNG `
    + "có cổng trong cong-module.mjs — một module không cổng là một module không "
    + "ai chấm.")
}

/**
 * Chấm một frontmatter theo cổng của `nhom`. Trả `null` khi qua.
 *
 * `nhom` là `null` cho đường bí danh `/api/articles**` — nó nhận cả ba loại như
 * trước FR-040, và đó là chủ ý: xoá hợp đồng cũ trong cùng lượt với tách đường
 * là hai rủi ro chồng lên nhau (FR-024 đã một lần làm vỡ đúng chỗ đó).
 */
export function congNhom(nhom, fm) {
  if (!nhom) return null
  const loai = loaiCuaNhom(nhom)
  if (!loai) return { ma: 400, loi: `nhóm lạ: ${nhom} — hợp lệ: ${NHOM.join(" · ")}` }
  const st = String(fm?.source_type ?? "")
  if (!loai.includes(st)) {
    return {
      ma: 400,
      loi: `source_type \`${st}\` không thuộc nhóm \`${nhom}\` `
        + `(nhóm này nhận: ${loai.join(", ")}) — sai NHÓM, không phải sai slug.`,
    }
  }
  return CONG[nhom](fm)
}

/**
 * Chấm theo LOẠI của bản ghi, suy module từ bảng khai.
 *
 * `congNhom` cần `nhom` từ đường URL; PUT không có nó (`suaBai` nhận `type`,
 * và đường bí danh `/api/articles/...` không mang nhóm nào). Nhưng luật nhãn
 * thuộc BẢN GHI, không thuộc ĐƯỜNG — nên nó phải giữ ở mọi đường ghi, còn
 * phép kiểm "type có thuộc nhóm" thì đúng là chuyện định tuyến và ở lại
 * `congNhom`.
 *
 * Đo được: thiếu hàm này thì POST bị chặn mà PUT lọt — sửa một tài liệu rồi bỏ
 * hết nhãn là CÙNG một lỗ, đi qua một method khác.
 */
export function congLoai(type, fm) {
  const nhom = NHOM.find((n) => (loaiCuaNhom(n) ?? []).includes(String(type)))
  return nhom ? CONG[nhom](fm) : null
}

/** `type` có thuộc `nhom` không — dùng cho đường `/api/<nhom>/:type/:slug`. */
export function loaiThuocNhom(nhom, type) {
  const loai = loaiCuaNhom(nhom)
  return !!loai && loai.includes(type)
}
