/**
 * M08_api — bảng route (FR-011).
 *
 * Hàm THUẦN nhận (req, res): khớp thì xử lý và trả true, không thì trả false
 * để server.mjs (M03) rơi tiếp xuống /api/inbox cũ và serve tĩnh. M08 KHÔNG
 * tự mở listen (M08-R1) — cổng duy nhất là server.mjs, bind 127.0.0.1.
 *
 * Cổng cấu trúc cho MỌI route có :type/:slug — trước khi chạm handler:
 *   type ∈ enum đóng 6 giá trị · slug khớp [a-z0-9-]. Sai ⇒ 400, không chuẩn
 *   hoá hộ: một GET với slug lạ mà "được sửa cho đúng" là một đường đoán mò.
 */
import { docLoaiNguon } from "./dungchung.mjs"
import {
  chiMucMo, chiTiet, danhMucChuDe, danhMucKhaiNiem, danhSach, napHienVat,
  phucVuHienVat, suaBai, taoBai,
  ganHienVat,
} from "./articles.mjs"
import { suaLoaiNguonHttp, suaNhan, themChuDe, themKhaiNiem, xoaNhan }
  from "./danhmuc.mjs"
import { loaiThuocNhom } from "./cong-module.mjs"
import { json, laSlug, LOAI, NHOM } from "./dungchung.mjs"
import { danhSachRac, khoiPhuc, xoaBai } from "./recycle.mjs"
import { doiTrangThai } from "./status.mjs"
import {
  cuaBuocDinhDanh, cuaDungMaMoi, cuaGhiAudit, cuaNhap, cuaNhapChungCat,
  cuaTraDinhDanh, cuaXemPhien,
} from "./loi-cua.mjs"
import {
  cuaChayLaiViec, cuaDsViec, cuaJob, cuaKhoDelta, cuaModel, cuaMotViec, cuaTaiVideo, cuaTim, cuaXoaViec,
} from "./tho-cua.mjs"
import {
  cuaBoNhap, cuaDsNhap, cuaDuyetNhap, cuaMotNhap, cuaSuaNhap, cuaTraLaiNhap,
} from "./nhap-cua.mjs"
import { cuaXuat, cuaXuatNhap } from "./xuat-cua.mjs"

export async function xuLyApi(req, res) {
  const u = new URL(req.url ?? "/", "http://local")
  const phan = u.pathname.split("/").filter(Boolean)
  if (phan[0] !== "api") return false

  if (req.method === "GET" && phan[1] === "health" && phan.length === 2) {
    json(res, 200, { api: true, fr: "FR-011" })
    return true
  }

  /* ═══ NĂM CỬA TÀI KHOẢN C3–C7 (FR-047 · T08-12) ═══════════════════════
   * Cửa cho MÁY (M15_kenh · M17_cong), không phải cho người. Cả năm đòi
   * header `x-khoa-dich-vu` + `x-aud` — khoá RIÊNG, khác khoá session
   * (CVE-2025-41258). Thiếu ⇒ 401, không rơi về "người dùng mặc định".
   *
   * `POST /api/articles` KHÔNG bị đụng: nó là cửa của NGƯỜI, và FE dựng URL
   * thẳng ở bốn chỗ (FR-024 đã một lần làm vỡ đúng đó).
   */
  // C1 · cửa của MÁY. `POST /api/articles` (cửa của NGƯỜI) ĐẶT approved;
  // cửa này ép `draft` VÔ ĐIỀU KIỆN. Hai đường, hai luật — không gộp.
  if (phan[1] === "nhap" && phan.length === 2 && req.method === "POST") {
    cuaNhap(req, res)
    return true
  }
  /*
   * T08-20 · HAI cửa để FE gọi được THỢ. `web` gọi `:8790`; trình duyệt KHÔNG
   * — khoá `X-Khoa-Loi` đọc từ env SERVER và không bao giờ ra trình duyệt
   * (`M12-R7` + `Z8`). Xem `tho-cua.mjs` đầu file.
   *
   * `GET /api/model` KHÔNG đòi khoá dịch vụ: nó là danh mục cho bộ chọn, không
   * lộ nội dung kho và không lộ `dich` (đích egress bị lọc ở `tho-cua.mjs`).
   */
  if (phan[1] === "model" && phan.length === 2 && req.method === "GET") {
    void cuaModel(req, res)
    return true
  }
  /*
   * T08-35 · HAI cửa phục vụ M13_truyhoi. `kho-delta` là cửa ĐỌC của LÕI cho
   * indexer (M13 không mở `_kho.sqlite` — M13-R3). `tim` là proxy web→truyhoi:
   * khoá chiều + `x-aud` gắn ở server, trình duyệt không cầm (cùng lý lẽ T08-20).
   * Chỉ GET — 0 đường ghi mới.
   */
  if (phan[1] === "kho-delta" && phan.length === 2 && req.method === "GET") {
    cuaKhoDelta(req, res, u)
    return true
  }
  if (phan[1] === "tim" && phan.length === 2 && req.method === "GET") {
    void cuaTim(req, res, u)
    return true
  }
  /* T08-21 · hai cửa ĐỌC việc. Đòi khoá ở THỢ (danh sách lộ slug của kho),
     nên `web` gắn khoá hộ — trình duyệt vẫn không cầm khoá nào. */
  if (phan[1] === "job" && phan.length === 2 && req.method === "GET") {
    void cuaDsViec(req, res)
    return true
  }
  if (phan[1] === "viec" && phan.length === 3 && req.method === "GET") {
    void cuaMotViec(req, res, phan[2])
    return true
  }
  /* WO-067 · CHẠY LẠI một việc HỎNG. Đây là đổi TRẠNG THÁI Ở THỢ, không phải
     ghi kho — cùng lớp với `POST /api/job` (T08-20). Không thân: chặng chạy
     lại nằm trong chính file việc (`giai_doan_hong`), client không chọn. */
  if (phan[1] === "viec" && phan.length === 4 && phan[3] === "lai"
      && req.method === "POST") {
    void cuaChayLaiViec(req, res, phan[2])
    return true
  }
  /* WO-070 · XOÁ HẲN một việc trong thùng rác. Đổi trạng thái ở THỢ, không
     ghi kho — cùng lớp với `job` và `viec/<id>/lai`. */
  if (phan[1] === "viec" && phan.length === 3 && req.method === "DELETE") {
    void cuaXoaViec(req, res, phan[2])
    return true
  }
  /* T12-26 · tải file video job `tai-video` đã kéo về thư mục tạm. */
  if (phan[1] === "tai-video" && phan.length === 3 && req.method === "GET") {
    void cuaTaiVideo(req, res, phan[2])
    return true
  }
  if (phan[1] === "job" && phan.length === 2 && req.method === "POST") {
    void cuaJob(req, res)
    return true
  }
  /*
   * T08-22 · NĂM cửa nháp cho TRÌNH DUYỆT — `nhap-cua.mjs`.
   *
   * Đặt TRƯỚC cửa C2 dưới đây và phân biệt bằng METHOD + độ dài đường: C2 là
   * `POST /api/nhap-chung-cat` (cửa MÁY, đòi khoá), năm cửa này là `GET` cùng
   * đường + ba `POST` có hậu tố. Mở cửa cho NGƯỜI KHÔNG được nới cửa MÁY —
   * `loi-nhap-cua.test.js §7` đo đúng chiều đó.
   */
  /*
   * `T08-33` · CỬA XUẤT — chỉ `GET`, 0 đường ghi mới.
   *
   * Đặt TRƯỚC khối `nhap-chung-cat` để hai đường không lẫn: `xuat-nhap` mang
   * cùng một `job_ulid` nhưng trả FILE, không trả JSON.
   */
  if (phan[1] === "xuat" && phan.length === 4 && req.method === "GET") {
    void cuaXuat(req, res, phan[2], phan[3], u.searchParams.get("dang") ?? "")
    return true
  }
  if (phan[1] === "xuat-nhap" && phan.length === 3 && req.method === "GET") {
    void cuaXuatNhap(req, res, phan[2], u.searchParams.get("dang") ?? "")
    return true
  }
  if (phan[1] === "nhap-chung-cat" && phan.length === 2 && req.method === "GET") {
    cuaDsNhap(req, res)
    return true
  }
  if (phan[1] === "nhap-chung-cat" && phan.length === 3 && req.method === "GET") {
    cuaMotNhap(req, res, phan[2])
    return true
  }
  if (phan[1] === "nhap-chung-cat" && phan.length === 4 && req.method === "POST") {
    const ham = {
      sua: cuaSuaNhap, "tra-lai": cuaTraLaiNhap, duyet: cuaDuyetNhap,
      bo: cuaBoNhap,   // T08-29 / FR-057
    }[phan[3]]
    if (ham) {
      void ham(req, res, phan[2])
      return true
    }
  }
  if (phan[1] === "nhap-chung-cat" && phan.length === 2 && req.method === "POST") {
    cuaNhapChungCat(req, res)
    return true
  }
  if (phan[1] === "dinh-danh" && phan.length === 2) {
    if (req.method === "GET") { cuaTraDinhDanh(req, res, u); return true }
    if (req.method === "POST") { cuaBuocDinhDanh(req, res); return true }
  }
  if (phan[1] === "audit" && phan.length === 2 && req.method === "POST") {
    cuaGhiAudit(req, res)
    return true
  }
  if (phan[1] === "ma-moi" && phan[2] === "dung" && req.method === "POST") {
    cuaDungMaMoi(req, res)
    return true
  }
  if (phan[1] === "phien" && phan.length === 3 && req.method === "GET") {
    cuaXemPhien(req, res, phan[2])
    return true
  }

  if (phan[1] === "recycle" && phan.length === 2 && req.method === "GET") {
    danhSachRac(req, res)
    return true
  }

  // FR-024 · chỉ mục mở cửa sổ, đọc lúc REQUEST thay vì lúc build.
  // Thay `static/open-index.json` khi API sống ⇒ sửa bài rồi F5 là thấy,
  // không phải `npm run build`. CHỈ GET — không phải đường ghi.
  if (phan[1] === "index" && phan.length === 2 && req.method === "GET") {
    // `u` đi kèm: FR-038/C4 thêm `?nhom=`. Không truyền thì handler không đọc
    // được tham số nào và phép lọc im lặng vô hiệu — ba màn loại tải cả kho.
    chiMucMo(req, res, u)
    return true
  }

  // Danh mục nhãn — GET đọc · POST thêm (FR-019) · PATCH sửa nhãn hiển thị và
  // DELETE nhãn không ai dùng (FR-021).
  //
  // `PUT` KHÔNG có nhánh ⇒ 404, và đó là ranh giới có chủ ý: PUT là "thay toàn
  // bộ", tức đường đổi `id` — thứ bài viết trỏ vào. PATCH là "sửa một phần" nên
  // sửa được `label_vi`/`gom`. Hai method na ná nhau nhưng khác hẳn hệ quả.
  /*
   * LOAI NGUON (WO-019) — GET doc bang, PATCH sua NHAN.
   *
   * KHONG co POST/DELETE: danh sach loai nguon den tu schema va whitelist,
   * khong phai nhan nguoi tao. Them mot loai nguon ma DDL khong biet la hua
   * mot thu `CHECK` se tu choi; xoa mot loai con ban ghi dung la lam facet
   * mat mot nhom. Doi CHU HIEN THI thi duoc — do la thu cua nguoi dung.
   */
  if (phan[1] === "loai-nguon") {
    if (phan.length === 2 && req.method === "GET") {
      json(res, 200, { items: docLoaiNguon() })
      return true
    }
    if (phan.length === 3 && req.method === "PATCH") {
      await suaLoaiNguonHttp(req, res, phan[2])
      return true
    }
  }

  if (phan[1] === "concepts" || phan[1] === "categories") {
    const loai = phan[1] === "concepts" ? "cpt" : "cat"
    if (phan.length === 2) {
      if (req.method === "GET") {
        // `u` đi kèm: FR-031 thêm `?limit`/`?offset`. Không truyền thì hai
        // handler không đọc được tham số nào và phân trang im lặng vô hiệu.
        if (loai === "cpt") danhMucKhaiNiem(req, res, u); else danhMucChuDe(req, res, u)
        return true
      }
      if (req.method === "POST") {
        if (loai === "cpt") await themKhaiNiem(req, res); else await themChuDe(req, res)
        return true
      }
      return false
    }
    if (phan.length === 3 && laSlug(phan[2])) {
      if (req.method === "PATCH") { await suaNhan(req, res, loai, phan[2]); return true }
      // `u` cho `?force=1` (FR-031). Thiếu nó thì cờ ép xoá im lặng vô hiệu —
      // người dùng bấm "vẫn xoá" và nhận đúng 409 vừa bấm qua.
      if (req.method === "DELETE") { await xoaNhan(req, res, loai, phan[2], u); return true }
    }
    return false
  }

  /*
   * FR-040 · BA ĐƯỜNG RIÊNG + MỘT BÍ DANH.
   *
   * `/api/bai-viet` · `/api/tai-lieu` · `/api/video` mang cổng RIÊNG của module
   * chúng (`cong-module.mjs`). `/api/articles**` giữ nguyên hợp đồng cũ và
   * KHÔNG bị xoá: FE dựng URL thẳng `"/api/articles/" + ban.slug` ở bốn chỗ sửa
   * đổi (`multiwindow.inline.ts:1196·1289·1323·2249`), và FR-024 đã một lần làm
   * vỡ đúng đó — người dùng báo "duyệt, loại, sửa, bỏ đều không hoạt động".
   * Tách đường và xoá đường cũ trong CÙNG một lượt là hai rủi ro chồng lên nhau.
   *
   * Tên nhóm đọc từ `loai-nguon.json` qua `NHOM`, không gõ ba chuỗi ở đây.
   */
  const nhom = NHOM.includes(phan[1]) ? phan[1] : null
  if (phan[1] !== "articles" && !nhom) return false

  if (phan.length === 2) {
    if (req.method === "GET") {
      // Ép `?nhom=` theo ĐƯỜNG, ghi đè bất cứ thứ gì client gửi: `/api/video`
      // mà trả bài viết vì client thêm `?nhom=bai-viet` là đường nói dối về
      // chính nó.
      if (nhom) u.searchParams.set("nhom", nhom)
      danhSach(req, res, u)
      return true
    }
    if (req.method === "POST") { await taoBai(req, res, nhom); return true }
    return false
  }

  /*
   * POST /api/articles/media — NAP HIEN VAT (FR-036/B5).
   *
   * Ba doan, nen no khong dam vao `/:type/:slug` (bon doan) va cung khong bao
   * gio bi cong cau truc duoi day soi: `media` khong nam trong `LOAI`, va cong
   * do chi chay tu bon doan tro len.
   *
   * DUOI tien to `/api/articles/` co y: whitelist theo TIEN TO cua
   * `no-write-path.test.js` khong phai sua — khong URL thu sau.
   */
  if (phan.length === 3 && phan[2] === "media" && req.method === "POST") {
    await napHienVat(req, res)
    return true
  }

  /*
   * GET /api/articles/media/<sha256> — PHUC VU byte (FR-036/B6).
   *
   * PHAI dung TRUOC cong cau truc `:type/:slug` duoi day: no cung bon doan, va
   * `media` khong nam trong `LOAI` nen cong do se tra 400 truoc khi tay nay
   * duoc goi. Thu tu hai khoi nay LA hop dong, khong phai so thich.
   */
  if (phan.length === 4 && phan[2] === "media" && req.method === "GET") {
    phucVuHienVat(req, res, phan[3])
    return true
  }

  /*
   * Method khac tren duong hien vat ⇒ 405 KEM `Allow`, khong roi xuong cong cau
   * truc duoi day.
   *
   * Vi sao khong de mac: `DELETE /api/articles/media/<sha>` roi xuong do se
   * nhan 400 "type phai thuoc: …" — mot cau tra loi NOI SAI CHO: no bao duong
   * dan sai trong khi thu sai la METHOD. Nguoi goi doc no roi di sua URL.
   *
   * `Allow` khong phai trang tri: 405 thieu `Allow` la 405 khong noi duoc
   * phai lam gi tiep (RFC 9110 §15.5.6 doi no).
   */
  if (phan[2] === "media" && (phan.length === 3 || phan.length === 4)) {
    const cho = phan.length === 3 ? "POST" : "GET"
    res.writeHead(405, {
      allow: cho, "content-type": "application/json; charset=utf-8",
    })
    res.end(JSON.stringify({ loi: `Duong hien vat chi nhan ${cho}.` }))
    return true
  }

  // /api/articles/:type/:slug[/status|/restore]
  const [, , type, slug, duoi] = phan
  if (phan.length < 4 || phan.length > 5) return false
  if (!LOAI.includes(type)) { json(res, 400, { loi: `type phải thuộc: ${LOAI.join(", ")}` }); return true }
  /*
   * FR-040 · `type` phải THUỘC nhóm của đường. `/api/video/paper/x` là lỗi PHÂN
   * LOẠI, không phải "không tìm thấy".
   *
   * 404 ở đây nói SAI CHỖ: người gọi đọc nó rồi đi sửa `slug`, trong khi thứ sai
   * là ĐƯỜNG. Cùng lý do khối 405 phía trên tồn tại thay vì để mặc — một câu trả
   * lời đúng mã nhưng sai chỗ tốn của người đọc một vòng đoán.
   */
  if (nhom && !loaiThuocNhom(nhom, type)) {
    json(res, 400, {
      loi: `type \`${type}\` không thuộc nhóm \`${nhom}\` — sai NHÓM, không phải sai slug.`,
    })
    return true
  }
  if (!laSlug(slug)) { json(res, 400, { loi: "slug phải khớp [a-z0-9]+(-[a-z0-9]+)*" }); return true }

  /*
   * T08-30 · POST .../<type>/<slug>/hien-vat — CỬA HẸP gắn hiện vật.
   *
   * PHẢI đứng TRƯỚC cổng cấu trúc bốn đoạn dưới đây: nó năm đoạn, và cổng đó
   * chỉ chạy từ bốn đoạn trở lên nên nó sẽ trả 400 trước khi tay này được gọi.
   * Thứ tự hai khối này LÀ hợp đồng, không phải sở thích — cùng bài học với
   * `GET /api/articles/media/<sha>`.
   */
  if (phan.length === 5 && phan[4] === "hien-vat" && req.method === "POST") {
    await ganHienVat(req, res, type, slug)
    return true
  }

  if (phan.length === 4) {
    if (req.method === "GET") { chiTiet(req, res, type, slug); return true }
    if (req.method === "PUT") { await suaBai(req, res, type, slug); return true }
    if (req.method === "DELETE") { await xoaBai(req, res, type, slug); return true }
    return false
  }
  if (duoi === "status" && req.method === "PATCH") {
    await doiTrangThai(req, res, type, slug)
    return true
  }
  if (duoi === "restore" && req.method === "POST") {
    await khoiPhuc(req, res, type, slug)
    return true
  }
  return false
}
