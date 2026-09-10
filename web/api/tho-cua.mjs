/*
 * tho-cua.mjs — HAI cửa LÕI để FE gọi được THỢ (T08-20)
 *
 *   GET  /api/model   danh mục model cho bộ chọn
 *   POST /api/job     tạo việc chưng cất
 *
 * VÌ SAO FILE NÀY TỒN TẠI
 * `web` **gọi** `:8790`; **trình duyệt KHÔNG**. Không phải vì mạng — máy này
 * chạy cả hai nên trình duyệt gọi tới được. Lý do:
 *
 *   `POST /job` của THỢ đòi `X-Khoa-Loi` (`M12-R7`). Trình duyệt gọi thẳng
 *   nghĩa là khoá nằm trong JS tải về máy người dùng — mở DevTools là thấy
 *   khoá, và từ đó ai cũng gọi thẳng vào THỢ, bỏ qua mọi thứ `web` canh.
 *   Đó là `CVE-2025-41258` theo một đường khác.
 *
 * ⇒ Đặt lời gọi ở phía `web` giữ khoá **Ở LẠI SERVER**. Đó là toàn bộ giá trị
 * hai cửa này mua, và là phép đo nặng nhất của cổng.
 *
 * Cộng `Z8` (`ADR-05`): *"chỉ `web/` gọi service"* — MỘT chỗ chuẩn hoá output.
 * Hai client tự dựng output từ cùng một service thì hai bên sẽ lệch.
 *
 * File này KHÔNG cầm SQL (`api-guard` cấm ngoài `dungchung.mjs`) và KHÔNG là
 * cửa ghi kho: nó chuyển tiếp, không quyết nội dung nào vào kho.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { loiGhiAudit, loiXemPhien } from "./dungchung.mjs"

const API = dirname(fileURLToPath(import.meta.url))

const json = (res, ma, o) => {
  res.writeHead(ma, { "content-type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(o))
}

/**
 * Gốc của THỢ. Số cổng ĐỌC TỪ `dich-vu.json` — `Z6`: *"cổng khai MỘT nơi"*.
 * Gõ `8790` ở đây là bản thứ hai của một con số đã có chủ.
 * `CHUNGCAT_GOC` chỉ để test tiêm THỢ giả; không phải đường cấu hình chính.
 */
function gocTho() {
  if (process.env.CHUNGCAT_GOC) return process.env.CHUNGCAT_GOC
  const d = JSON.parse(readFileSync(
    join(API, "..", "..", "core", "assets", "dich-vu.json"), "utf8"))
  const dv = d.dich_vu.find((x) => x.thu_muc === "chungcat")
  if (!dv) throw new Error("`chungcat` không có trong bảng khai dịch vụ")
  return `http://127.0.0.1:${dv.cong}`
}

/* Trần thời gian. Không có nó thì một THỢ treo làm request của người dùng treo
   theo, và người dùng không biết nên chờ hay bấm lại — rồi họ bấm lại. */
const TRAN_MS = 8000

async function goiTho(duong, { method = "GET", than, khoaNguoi } = {}) {
  const h = { "content-type": "application/json" }
  const khoa = process.env.CHUNGCAT_KHOA_LOI
  if (khoa) h["x-khoa-loi"] = khoa
  if (khoaNguoi != null) h["x-nguoi-dung"] = String(khoaNguoi)
  const bo = AbortSignal.timeout(TRAN_MS)
  const r = await fetch(gocTho() + duong, {
    method, headers: h, signal: bo,
    body: than === undefined ? undefined : JSON.stringify(than),
  })
  let j = null
  try { j = await r.json() } catch { /* thân rỗng */ }
  return { ma: r.status, than: j }
}

/**
 * THỢ chết / không nghe ⇒ **502**, không 500 trần.
 *
 * 500 nói *"lỗi ở tôi"*; 502 nói *"lỗi ở dịch vụ phía sau"*. FE hiển thị hai
 * câu khác nhau cho hai ca đó, và người dùng làm hai việc khác nhau.
 */
const chetTho = (res, e) => json(res, 502, {
  loi: "dịch vụ chưng cất không trả lời — kiểm xem nó có đang chạy không",
  chi_tiet: String(e?.name ?? e),
})

/* ═══ GET /api/model — danh mục cho bộ chọn ════════════════════════════════
 *
 * KHÔNG đòi khoá: nó chỉ trả tên model · vùng · kiểu, không lộ nội dung kho.
 * `web/` cần nó để dựng bộ chọn TRƯỚC khi người dùng làm gì.
 *
 * `dich` bị LỌC. Đó là **đích egress** — bộ chọn không cần biết gửi tới đâu,
 * và mọi trường không cần thiết mà vẫn ra trình duyệt là một dòng phải audit
 * về sau. THỢ đã lọc ở đầu kia; cửa này kiểm LẠI, không tin đầu kia đã lọc:
 * hai lớp cho một luật, mà lớp thứ hai rẻ.
 */
const CHO_RA = ["nha_cung_cap", "model", "khu_vuc", "can_key",
  // `ho_tro_audio` (2026-09-08): phiếu SINH TRANSCRIPT lọc theo nó.
  // Lần thứ BA một trường rơi ở đúng chỗ này — `tran_chi_dan_ky_tu`,
  // `tran_payload_byte`, nay cờ này. Danh sách dựng TAY thì mỗi trường mới
  // là một dòng phải nhớ, và quên thì nó rơi ra IM LẶNG.
  "ho_tro_audio",
  // `la_mac_dinh` (T03-107): bộ chọn mở sẵn dòng gợi ý. Thiếu nó thì FE mở
  // dòng ĐẦU của 238 dòng đồng bộ từ gateway — một model ngẫu nhiên, và người
  // dùng phải tự đi tìm lại thứ hệ đã chọn hộ họ. Không phải bí mật: một
  // quyết định đã khai, và `FR-053 §1.1` cho người THẮNG gợi ý — muốn thắng
  // thì phải thấy gợi ý là gì.
  // `mien_phi` (2026-09-04): ví đo được 16.28 VND, nên mọi model không-free là
  // một job chết vì hết tiền — và người bấm chỉ biết SAU khi đã bấm. Cùng lập
  // luận §4.0c hiện `khu_vuc`: cái giá của cú bấm phải hiện trước cú bấm.
  "kieu_structured", "che_do", "la_mac_dinh", "mien_phi"]

export async function cuaModel(req, res) {
  try {
    const r = await goiTho("/model")
    if (r.ma !== 200) return json(res, r.ma, r.than ?? {})
    const dong = (r.than?.dong ?? []).map((x) => Object.fromEntries(
      CHO_RA.filter((k) => k in x).map((k) => [k, x[k]])))
    return json(res, 200, {
      dong,
      // Cảnh báo một-gateway đi RA: `FR-053 §1.4` đòi bộ chọn hiện `khu_vuc`,
      // và câu này giải thích vì sao mọi dòng đều `khong-xac-dinh`.
      $canh_bao_mot_gateway: r.than?.$canh_bao_mot_gateway ?? null,
      /*
       * HAI TRƯỜNG CỦA `T12-25` — chở NGUYÊN, đừng để cửa này nuốt.
       *
       * Đo 2026-09-07 khi chủ dự án hỏi *"input đã có chỗ nhập prompt chưa?"*:
       *   `:8790/model`     → `tran_chi_dan_ky_tu: 500` · 3 chip
       *   `:8787/api/model` → chỉ `{dong:[…]}`
       *
       * Cửa này dựng lại phản hồi BẰNG TAY theo `CHO_RA`, và `CHO_RA` chỉ nói
       * về các khoá của MỘT DÒNG model — hai trường cấp gốc rơi ra ngoài mà
       * không ai báo. Còn `veOChiDan` mở đầu bằng `if (!tran) return ""`, nên
       * ô nhập BIẾN MẤT im lặng: tính năng có thật ở thợ, có thật trong mã FE,
       * và vô hình với người dùng vì một proxy chép thiếu hai dòng.
       */
      tran_chi_dan_ky_tu: r.than?.tran_chi_dan_ky_tu ?? null,
      chi_dan_mau: r.than?.chi_dan_mau ?? [],
      // `SCR-23` khối ① — mẫu số của thanh *cỡ nguyên liệu*. Cùng bài học hai
      // dòng trên: cửa này dựng phản hồi BẰNG TAY, nên mỗi trường cấp gốc mới
      // là một dòng phải thêm ở đây, không thì nó rơi ra im lặng.
      tran_payload_byte: r.than?.tran_payload_byte ?? null,
    })
  } catch (e) {
    return chetTho(res, e)
  }
}

/* ═══ GET /api/job · GET /api/viec/<id> — hai cửa ĐỌC (T08-21) ════════════
 *
 * Cùng khuôn `cuaModel`: `web` gọi `:8790`, trình duyệt gọi `web`, khoá dịch vụ
 * **ở lại server**. Khác `GET /api/model` ở một điểm: hai đường này **lộ `slug`
 * của kho** — tức chúng nói *cái gì đang có trong kho*. THỢ đòi khoá cho chúng
 * (`chungcat/src/api.py`), và cửa này gắn khoá hộ.
 *
 * KHÔNG lọc trường: khác `cuaModel` (lọc `dich`), thân việc là dữ liệu của
 * chính người dùng — lọc bớt ở đây là màn quản lý mất thông tin mà không ai
 * biết mất gì. Nếu sau này thân việc mang một trường không được ra ngoài, chỗ
 * sửa là THỢ, không phải thêm một danh sách lọc thứ hai ở đây.
 */
export async function cuaDsViec(req, res) {
  try {
    const u = new URL(req.url, "http://x")
    const q = new URLSearchParams()
    // Chuyển tiếp ĐÚNG hai tham số đã khai. Chuyển cả query string là để một
    // tham số chưa có hợp đồng đi xuyên qua cửa — cùng hình dạng lỗi mà việc
    // lột `nguoi_dung_id` đang chặn ở đường ghi.
    for (const k of ["giai_doan", "n", "rac"]) {
      const v = u.searchParams.get(k)
      if (v != null) q.set(k, v)
    }
    const d = q.toString()
    const r = await goiTho("/viec" + (d ? "?" + d : ""))
    return json(res, r.ma, r.than ?? {})
  } catch (e) {
    return chetTho(res, e)
  }
}

export async function cuaMotViec(req, res, id) {
  try {
    // Mã của THỢ đi NGUYÊN — 404 cho một `viec_id` không có phải tới được FE:
    // dịch thành 200 với thân rỗng làm màn chi tiết hiện một việc trống thay vì
    // nói "không có việc đó", và người sẽ tưởng việc của họ đã bị xoá.
    const r = await goiTho("/viec/" + encodeURIComponent(id))
    return json(res, r.ma, r.than ?? {})
  } catch (e) {
    return chetTho(res, e)
  }
}

/* ═══ POST /api/viec/<id>/lai — chạy lại việc HỎNG (WO-067) ══════════════
 *
 * Cùng khuôn `cuaMotViec`: mã của THỢ đi NGUYÊN (409 khi chạm trần `M12-R6`
 * hay việc không ở `hong` — FE phải thấy đúng câu đó, không phải một 200
 * rỗng). Không thân request: chỗ chạy lại nằm trong chính file việc
 * (`giai_doan_hong`), client không được chọn chặng.
 */
export async function cuaChayLaiViec(req, res, id) {
  try {
    const r = await goiTho("/viec/" + encodeURIComponent(id) + "/lai", { method: "POST" })
    return json(res, r.ma, r.than ?? {})
  } catch (e) {
    return chetTho(res, e)
  }
}

/* ═══ WO-071 lối (a) · TỰ XẾP việc `sinh-thumbnail` sau khi tạo bản ghi ═══
 *
 * Chủ dự án chọn lối (a): ảnh bìa KHÔNG phải một quyết định của người dùng như
 * chưng cất (tốn token, chọn model) hay tải video (chọn chất lượng) — nó là
 * thứ LUÔN NÊN CÓ. Một nút bắt bấm cho từng video là bắt người làm việc của
 * máy, và phần lớn video sẽ không có ảnh chỉ vì không ai nhớ bấm.
 *
 * FIRE-AND-FORGET, và đó là cả thiết kế: THỢ chết KHÔNG được làm hỏng một lần
 * ghi bản ghi đã thành công. Người dùng vừa đăng ký một video; nếu họ nhận 500
 * vì ảnh bìa thì cái giá sai hoàn toàn.
 *
 * BỎ QUA YouTube: `nenThe` lớp 2 dựng `i.ytimg.com/vi/<id>/…` từ id — ảnh đã
 * có, và một job cho mỗi video YouTube là một lời gọi `yt-dlp` không mua thêm
 * gì thấy được. Đánh đổi nói thẳng: ảnh trong kho KHÔNG hết hạn còn hotlink
 * thì có; ngày nào ytimg đổi đường, chỗ sửa là bỏ đúng dòng `if` này.
 */
/* WO-074 · douyin RA khỏi danh sách. `yt-dlp` có extractor [Douyin] nhưng
 * đòi cookie phiên ("Fresh cookies … are needed") kể cả với URL dạng chuẩn và
 * đã có `curl_cffi` — đo 2026-09-09 trên bản ghi thật. Để lại thì mỗi bản ghi
 * douyin xếp một job CHẮC CHẮN hỏng, và thùng rác việc đầy dần bằng thứ không
 * ai sửa được ở đây.
 *
 * Danh sách này là bản THỨ HAI của luật `chien_luoc_anh_bia` (Python, THỢ).
 * Hai bản là cố ý — LÕI không đọc asset của M12 — nhưng chúng không được
 * phép lệch: `check_sinh_thumbnail.py` vế 7e TÍNH danh sách này từ
 * `nguon-transcript.json` và đỏ ngay khi hai bên rời nhau. */
const HOST_TU_XEP = ["tiktok.com", "facebook.com", "fb.watch"]

export function xepViecThumbnail(fm) {
  try {
    if (String(fm?.source_type) !== "video") return
    const u = String(fm?.url ?? "")
    if (!/^https?:\/\//.test(u)) return           // `kho://` — byte đã có, không tải
    const host = new URL(u).hostname.toLowerCase()
    if (!HOST_TU_XEP.some((h) => host === h || host.endsWith("." + h))) return
    // Đã có ảnh ⇒ không xếp. Sinh lại là việc người bấm, không phải việc tự chạy.
    const ds = Array.isArray(fm.media) ? fm.media : (fm.media ? [fm.media] : [])
    if (ds.some((m) => String(m?.mime ?? "").startsWith("image/"))) return
    void goiTho("/job", {
      method: "POST",
      than: { loai: "sinh-thumbnail", slug: `video/${fm.slug}` },
    }).catch(() => { /* THỢ chết KHÔNG được làm hỏng một lần ghi đã xong */ })
  } catch { /* mọi lỗi ở đây đều không được vọng ra ngoài */ }
}

/* ═══ DELETE /api/viec/<id> — xoá hẳn một việc trong thùng rác (WO-070) ═══
 *
 * Mã của THỢ đi NGUYÊN: 409 (việc không ở rác) phải tới được FE, không dịch
 * thành 200 — người bấm xoá một việc đang chạy phải biết vì sao nó không xoá.
 */
export async function cuaXoaViec(req, res, id) {
  try {
    const r = await goiTho("/viec/" + encodeURIComponent(id), { method: "DELETE" })
    return json(res, r.ma, r.than ?? {})
  } catch (e) {
    return chetTho(res, e)
  }
}

/* ═══ POST /api/job — tạo việc chưng cất ═══════════════════════════════════
 *
 * `nguoi_dung_id` client khai bị **BỎ** (`L1` của `FR-047 §2.1`). Danh tính
 * đến từ phiên mà LÕI tra, không từ thân request.
 *
 * ⚠️ CHƯA CÓ phiên đăng nhập cho TRÌNH DUYỆT — `FR-045` khai bốn bảng nhưng
 * đường đăng nhập web chưa dựng. Nên:
 *   có phiên  ⇒ gắn `X-Nguoi-Dung`
 *   không có  ⇒ VẪN tạo việc, `nguoi_dung_id` null, và GHI VẾT audit
 *   KHÔNG BAO GIỜ rơi về một "người dùng mặc định" — đó mới là fail-open.
 *
 * Vì sao không DENY: `spec M12 §1.1` đã đo *"phép giải quyền CHƯA TỒN TẠI —
 * cả 5 tài khoản đọc cả kho"*. DENY ở đây làm tính năng không dùng được cho
 * tới khi đăng nhập web xong, mà đó là một FR khác. Null **có vết** là trung
 * thực; "người dùng mặc định" là nói dối.
 *
 * Khi đăng nhập web có: đổi thành DENY, và việc cũ `null` phải được nhận ra là
 * **việc không có chủ**, không phải việc của người đầu tiên đăng nhập.
 */
export async function cuaJob(req, res) {
  let b
  try {
    let s = ""
    for await (const c of req) {
      s += c
      if (s.length > 1024 * 1024) { json(res, 413, { loi: "thân quá lớn" }); return }
    }
    b = JSON.parse(s || "{}")
  } catch (e) {
    return json(res, 400, { loi: `thân request không đọc được: ${e.message}` })
  }

  // L1 · lột mọi trường danh tính do client khai.
  delete b.nguoi_dung_id
  const idPhien = req.headers["x-phien"] ?? b.phien
  delete b.phien
  const chu = idPhien ? (loiXemPhien(String(idPhien))?.nguoi_dung_id ?? null) : null

  if (chu == null) {
    loiGhiAudit({ hanh_dong: "tao-job-khong-chu", doi_tuong: b.slug ?? null, ok: true })
  }
  try {
    const r = await goiTho("/job", { method: "POST", than: b, khoaNguoi: chu })
    // Mã của THỢ đi NGUYÊN: FE cần phân biệt "bị chặn" (403/422) với "đã nhận"
    // (2xx). Dịch lại thành 200 là xoá đúng thông tin FE dựa vào.
    return json(res, r.ma, r.than ?? {})
  } catch (e) {
    return chetTho(res, e)
  }
}

/* ═══ GET /api/tai-video/<ulid> — trả file video job `tai-video` đã tải ═══
 *
 * `T12-26`. File sống ở thư mục tạm NGOÀI repo (một video là hàng trăm MB;
 * kho không phải chỗ của nó), nên cửa này STREAM chứ không đọc cả file vào
 * bộ nhớ.
 *
 * Đường file đến từ KẾT QUẢ JOB, không từ URL: người gọi chỉ đưa được `ulid`,
 * và ULID không đoán được. Vẫn kiểm `basename` khớp khuôn trước khi mở —
 * một cửa tin vào chuỗi thợ trả về là một cửa tin vào một tiến trình khác.
 */
/*
 * Khuôn tên file tạm.
 *
 * Id việc là `uuid.uuid4().hex` — **32 ký tự hex** (`api.py:280`), KHÔNG phải
 * ULID 26 ký tự. Bản đầu tôi khai `{26}` và cổng vẫn XANH vì fixture của
 * chính tôi dùng một ULID giả cùng độ dài — một mô phỏng đặt sai chỗ thì nó
 * mô phỏng luôn cả cái sai.
 *
 * Hậu quả đo được trên máy 2026-09-06: cửa `/api/tai-video/<id>` trả 422 cho
 * MỌI file có thật, và `don_xuat_tam` chưa bao giờ xoá được gì.
 *
 * Vẫn phải có khuôn (không nhận tên bừa): `%TEMP%` là nhà chung, và cửa web
 * mở file theo một chuỗi do tiến trình khác trả về.
 */
const KHUON_TEP = /^[0-9a-fA-F]{32}-(\d{3,4}|goc)p?\.mp4$/

/*
 * BỌC TOÀN BỘ trong try/catch — một `throw` ở đây GIẾT CẢ TIẾN TRÌNH WEB.
 *
 * Đo được 2026-09-06: bản đầu thiếu import `basename`, và
 * `ReferenceError: basename is not defined` trong một handler `async` thành
 * một unhandled rejection ⇒ Node thoát ⇒ TOÀN BỘ site sập vì một cửa tải.
 * Một cửa hỏng phải trả 500, không được kéo theo mọi cửa khác.
 */
export async function cuaTaiVideo(req, res, ulid) {
  try {
    return await _cuaTaiVideo(req, res, ulid)
  } catch (e) {
    return json(res, 500, { loi: "cửa tải video hỏng: " + String(e && e.message || e) })
  }
}

async function _cuaTaiVideo(req, res, ulid) {
  let v
  try {
    const r = await goiTho("/viec/" + encodeURIComponent(ulid))
    if (r.ma !== 200) return json(res, r.ma, r.than ?? { loi: "không có việc đó" })
    v = r.than ?? {}
  } catch (e) {
    return chetTho(res, e)
  }
  if ((v.payload || {}).loai !== "tai-video") {
    return json(res, 404, { loi: `việc ${ulid} không phải việc tải video` })
  }
  const kq = v.ket_qua || {}
  if (!kq.tep_tam) {
    // Chưa xong KHÁC hết hạn, và người đọc cần biết mình phải ĐỢI hay phải
    // BẤM LẠI. Gộp hai ca vào một câu 404 là bỏ mất đúng thông tin ấy.
    return json(res, 404, {
      loi: `việc ${ulid} chưa tải xong (giai đoạn: ${v.giai_doan ?? "?"}). `
        + "Đợi job xong rồi tải lại.",
    })
  }
  const ten = basename(String(kq.tep_tam))
  if (!KHUON_TEP.test(ten)) {
    return json(res, 422, { loi: "tên file không đúng khuôn — không mở" })
  }
  const duong = join(String(kq.thu_muc || ""), ten)
  if (!existsSync(duong)) {
    return json(res, 404, {
      loi: "file đã bị dọn (quá hạn giữ ở thư mục tạm). Bấm tải lại để sinh job mới.",
    })
  }
  const st = statSync(duong)
  // Tên NGƯỜI đọc được: `<slug>-480p.mp4`, không phải `<ulid>-480p.mp4`.
  const slug = String(kq.slug || "video").split("/").pop()
  // `p` chỉ đi với bậc SỐ. Bậc `goc` cộng "p" ra `…-gocp.mp4` — một lỗi
  // chính tả nằm trong tên file người sẽ giữ lại trên máy.
  const bac = String(kq.chat_luong ?? "")
  const hau = /^\d+$/.test(bac) ? bac + "p" : bac
  const taiTen = `${slug}-${hau}.mp4`.replace(/[^\w.-]+/g, "-")
  res.writeHead(200, {
    "content-type": "video/mp4",
    "content-length": String(st.size),
    "content-disposition": `attachment; filename="${taiTen}"`,
  })
  createReadStream(duong).pipe(res)
}
