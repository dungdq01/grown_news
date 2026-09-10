/*
 * T03-104 · CHUNK màn NẠP VIDEO — tải CHỈ trên `/video/nap/`.
 *
 * VÌ SAO TÁCH (quyết PM lối i, chủ dự án duyệt 2026-09-04)
 * `T03-95` cần ~1512B trong `gn.js` mà bundle chỉ dư 1453B. Nới trần bị
 * `FR-027f` cấm ("SIẾT, không nới"), và lối chunk-riêng cho TRANG CHỦ chết vì
 * thẻ `<script>` +48B > 9B dư của HTML trang chủ. Lối còn lại: DỌN chỗ.
 *
 * Vùng này là lát cắt SẠCH NHẤT của màn nap — đo trước khi cắt:
 *   nạp VIDEO     3637B trong `.js` · KHÔNG đụng `hienVatCho`/`SUA_TL`
 *                 (chỉ đọc `MEDIA.video_host`, qua `mediaCua()`)
 *   nạp THƯ VIỆN  6131B             · đụng cả ba ⇒ để lượt sau (ô nợ M03)
 *
 * VÌ SAO NÓ CHỈ CẦN TRÊN TRANG NAP — đo, không suy:
 *   /video/      v-napvideo x0        (view bị cắt khỏi trang không phải nap)
 *   /video/nap/  v-napvideo x1
 * và `doiView` ĐIỀU HƯỚNG khi view vắng, nên không đường nào chạm form này từ
 * trang khác mà không tải lại.
 *
 * BA helper chép lại (~350B) thay vì gọi sang `gn.js`: `G` · `kqTV` · `loiMay`.
 * Đó là giá của độc lập, và độc lập là điều kiện để tách có nghĩa.
 *
 * MỘT ngoại lệ, hẹp và có ý thức: `MEDIA` đọc từ `globalThis.__GN_MEDIA__` do
 * `gn.js` công bố. Tự khai `__MEDIA__` ở đây thì esbuild nhúng cả bảng JSON
 * **6590 byte**, và tổng tải đầu của trang nap sẽ VƯỢT TRẦN — tách mà làm trang
 * nặng lên thì tách để làm gì. Chỉ DỮ LIỆU, đọc LÚC GỌI, và một chiều.
 */
const G = (id: string) => document.getElementById(id)

/** Ô kết quả của form nạp — chép từ `gn.js`, ~200B, đổi lấy độc lập. */
function kqTV(txt: string, loai: string, moc = "up-tv-kq") {
  const o = G(moc)
  if (!o) return
  o.textContent = txt
  o.className = "up-kq " + (loai === "loi" ? "loi" : "ok")
  o.hidden = false
}

const loiMay = (r: { status: number }) => `Máy trả ${r.status}.`

/*
 * `nhanCua` + `thanTu` CHÉP VÀO ĐÂY, không gọi sang `gn.js` (`WO-059`).
 *
 * Bug chủ dự án bắt 2026-09-06: bấm "Ghi vào kho" không có gì xảy ra, console
 * ném `ReferenceError: nhanCua is not defined`. Mỗi chunk bọc IIFE riêng
 * (`assets.mjs`: *"chunk phải TỰ CHỨA"*), nên một hàm khai trong `gn.js` KHÔNG
 * nhìn thấy được từ đây — mã trông đúng, và chỉ nổ lúc người dùng bấm.
 *
 * Chép chứ không dựng cầu: đây là hai hàm ba dòng, cùng hạng với `G` · `kqTV`
 * · `loiMay` đã chép sẵn ở trên — `plugins/WORKLOG.md` gọi đó là *"giá của độc
 * lập"*. Dựng một cầu `globalThis` cho hai hàm ba dòng là thêm một hợp đồng
 * phải giữ, để tiết kiệm 200 byte.
 */
const nhanCua = (tien: string, loai: string): string[] =>
  [...document.querySelectorAll<HTMLInputElement>(
    "#" + tien + "-" + loai + " input:checked")].map((c) => c.value)

const thanTu = (tien: string, motCau: string): string =>
  ((G(tien + "-mo") as HTMLTextAreaElement | null)?.value ?? "").trim() || motCau

/** Bảng media do `gn.js` công bố — đọc LÚC GỌI, không lúc nạp. */
type DongMime = {
  mime: string; duoi: string; ten: string; nhom_thu_vien?: string
}
const mediaCua = () => (globalThis as {
  __GN_MEDIA__?: {
    video_host: { mien: string; nhan: string }[]
    // T03-109 · `loai` + `tran_byte` cần cho ô file MP4. Vẫn MỘT chiều và đọc
    // LÚC GỌI: `gn.js` công bố `__GN_MEDIA__` khi nó chạy.
    loai?: DongMime[]
    tran_byte?: number
  }
}).__GN_MEDIA__ ?? { video_host: [], loai: [], tran_byte: 0 }

// Một câu, một chỗ: nó xuất hiện ở cả `ghiVideo` và `ganNapVideo`, và hai bản
// của cùng một lời là hai chỗ để lệch.
// `loiHost()` dựng LÚC GỌI, không lúc nạp: `gn.js` công bố `__GN_MEDIA__` khi
// nó chạy, và một hằng cấp-module ở đây sẽ đọc trước lúc đó.
const loiHost = () => "Nơi phát này không nằm trong danh sách nhận: "
  + mediaCua().video_host.map((h) => h.mien).join(" · ")

function hostVideoHopLe(tho: string) {
  let mien = ""
  try { mien = new URL(tho).hostname.toLowerCase() } catch { return null }
  // `youtu.be` la ten rut gon CUNG NHA cua `youtube.com`, va FE sinh ra no.
  // Gop vao mot vong: mot nhanh `if` rieng cho mot ten mien la mot ban go tay
  // thu hai (`cong-module.mjs` cung co no) — va `gn.js` dang sat tran.
  const PHU: Record<string, string[]> = { "youtube.com": ["youtu.be"] }
  for (const h of mediaCua().video_host) {
    for (const m of [h.mien, ...(PHU[h.mien] ?? [])]) {
      if (mien === m || mien.endsWith("." + m)) return h
    }
  }
  return null
}

/** Slug gợi ý từ câu tóm tắt — người dùng sửa được, máy không ép. */
function slugGoiY(cau: string): string {
  // `NFD` + dải dấu thanh gọn hơn một bảng tra chữ, và `đ` phải xử riêng vì nó
  // KHÔNG phân rã được — đây là hai dòng, không phải một thư viện.
  return cau.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}

async function ghiVideo() {
  const oU = G("vd-url") as HTMLInputElement | null
  const oL = G("vd-1l") as HTMLInputElement | null
  const tho = (oU?.value ?? "").trim()
  const motCau = (oL?.value ?? "").trim()
  /*
   * WO-028 · TU SUY slug, khong doc o.
   *
   * O "Dia chi trong kho" (`vd-slug`) da bi go o WO-021 theo yeu cau nguoi
   * dung, nhung ham nay van doc no: `G("vd-slug")` tra `null`, `slug` thanh
   * "", va phep kiem ngay duoi LUON do — duong nap video chet han.
   *
   * Cung cong thuc bai viet dang dung: `slugGoiY(tieu de || mot cau)`.
   */
  const slug = slugGoiY((G("vd-title") as HTMLInputElement | null)?.value || motCau)

  /*
   * WO-058 · FR-075 · HAI DUONG VAO, khong mot.
   *
   * Ban truoc mo dau bang `if (!hostVideoHopLe(tho)) return` VO DIEU KIEN, va
   * `hienVatVideo` — bien giu hien vat vua nap — khong ai DOC. Hau qua chu du
   * an gap 2026-09-09: tai mot `.mp4` len (dung thu man moi lam), byte VAO KHO
   * thanh cong, roi bi tu choi bang cau *"noi phat khong nam trong danh sach"*
   * — mot cau noi ve thu ho CHUA NHAP. Cua ta sai trang thai, nen nguoi bao
   * bug di tim sai cho.
   *
   * `url` KHONG bo duoc (`required` goc cua schema FROZEN), nen duong tai file
   * dung quy uoc `kho://video/<slug>` — dung cai `tai-lieu` da dung tu dau.
   */
  const diaChi = tho || (hienVatVideo ? `kho://video/${slug}` : "")
  if (!tho && !hienVatVideo) {
    kqTV("Cần MỘT trong hai: dán link video, hoặc tải lên file.",
      "loi", "up-vd-kq")
    return
  }
  // Kiem host CHI cho url NGUOI DAN. `kho://` khong co host ngoai nao de kiem,
  // va `FR-075 §4` khong noi whitelist mot milimet cho duong dan link.
  if (tho && !hostVideoHopLe(tho)) {
    kqTV(loiHost(), "loi", "up-vd-kq")
    return
  }
  if (!motCau) {
    kqTV(LOI_MOT_CAU, "loi", "up-vd-kq")
    return
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    kqTV(LOI_SLUG, "loi", "up-vd-kq")
    return
  }

  // WO-016 · nhãn của FORM NÀY (tiền tố `vd-`). Cùng luật, cùng lý do như
  // ở `ghiBanGhiThuVien` — và cùng một hàm đọc, không hai bản.
  const cat = nhanCua("vd", "cat")
  const cpt = nhanCua("vd", "cpt")
  if (!cat.length || !cpt.length) {
    kqTV(loiNhan("video"), "loi", "up-vd-kq")
    return
  }

  const nut = G("vd-gui") as HTMLButtonElement | null
  if (nut) { nut.disabled = true; nut.setAttribute("aria-busy", "true") }
  try {
    /*
     * `/api/video`, KHÔNG `/api/articles`.
     *
     * Đường cũ vẫn tạo được bản video (bí danh còn sống từ FR-040), nên gọi nó
     * thì tính năng TRÔNG đúng — mà cổng riêng của module video (whitelist host
     * phía server) KHÔNG chạy. Đó là cách một tính năng bỏ qua đúng cái cổng
     * sinh ra cho nó.
     *
     * KHÔNG gửi `url_normalized`: `validate.py --fix` điền. Một công thức.
     */
    const r = await fetch("/api/video", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        frontmatter: {
          // KHÔNG đặt `review_status`/`origin` — server LỘT hai trường đó
          // (M08-R5). Gửi lên chỉ để bị xoá là một lời khai sai về ai quyết định.
          id: "src_" + slug.replace(/-/g, "").slice(0, 10).padEnd(6, "0"),
          slug,
          source_type: "video",
          url: diaChi,
          // Co hien vat thi GUI no. Truoc day khoi nay khong bao gio gui
          // `media`, nen o file tren man la trang tri: byte vao kho roi khong
          // ban ghi nao tro tới nó.
          ...(hienVatVideo ? { media: [hienVatVideo] } : {}),
          protocol_version: "2.0",
          analyzed_at: new Date().toISOString().slice(0, 10),
          title: G("vd-title")?.value.trim() || null,
          one_liner: motCau,
          credibility_max: "plausible",
          conformance: "B",
          ho_so: "thu-vien",
          category: cat,
          concepts: cpt,
        },
        body: thanTu("vd", motCau),
      }),
    })
    const d = await r.json()
    if (!r.ok) {
      kqTV(d.loi_validate ?? d.loi ?? loiMay(r), "loi", "up-vd-kq")
      return
    }
    /*
     * GHI XONG THÌ ĐI, và nói bằng tiếng người (`WO-060`).
     *
     * Bản trước dừng tại chỗ với câu `Đã ghi video/abc.md vào kho.` — một
     * ĐƯỜNG DẪN FILE. Người vừa đăng ký một video không hỏi file nằm đâu; họ
     * hỏi *"xong chưa, và nó đâu rồi"*. Form tự xoá trắng rồi đứng im trả lời
     * được câu thứ nhất một cách mơ hồ và câu thứ hai thì không.
     *
     * Chuyển sang màn Video: đó là chỗ bản ghi vừa xuất hiện, nên người thấy
     * NGAY kết quả việc mình vừa làm thay vì phải tự đi tìm.
     */
    // `?.value?.trim()` — hai dấu hỏi, không một. `a?.b.c` chỉ chặn khi `a`
    // null; `b` có mà undefined thì `.c` vẫn ném, và `catch` bên ngoài nuốt nó
    // rồi báo "máy chủ chưa chạy" cho một lời gọi ĐÃ thành công. Cổng bắt đúng
    // ca đó.
    const ten = (G("vd-title") as HTMLInputElement | null)?.value?.trim() || motCau
    kqTV(`Đã đăng ký "${ten}" — đang mở màn Video…`, "ok", "up-vd-kq")
    if (oU) oU.value = ""
    if (oL) oL.value = ""
    const meta = G("vd-meta")
    if (meta) meta.hidden = true
    /* Chờ một nhịp để người kịp ĐỌC câu vừa hiện. Chuyển ngay lập tức thì câu
       xác nhận chớp qua, và người không chắc mình vừa bấm thành công hay chưa. */
    setTimeout(() => {
      const nutVideo = document.querySelector('[data-nav="video"]') as HTMLElement | null
      if (nutVideo) nutVideo.click()
      else location.href = "/video/"
    }, 900)
  } catch {
    kqTV("Không gọi được /api/video — máy chủ chưa chạy?", "loi", "up-vd-kq")
  } finally {
    if (nut) { nut.disabled = false; nut.removeAttribute("aria-busy") }
  }
}

/*
 * T03-109 · Ô FILE MP4 — nguồn PHỤ của bản ghi video (quyết 4, 2026-09-04).
 *
 * VÌ SAO CHUNK DỰNG Ô NÀY, KHÔNG PHẢI `trang.mjs`
 * Task khai markup ở `trang.mjs`. Đo thật thì không được: shell là MỘT bản
 * dùng cho mọi màn, nên một ô file thêm vào đó tính vào HTML của **mọi** trang
 * — và trần HTML trang chủ còn **7 byte** (61433/61440). Dựng từ chunk thì ô
 * này tồn tại đúng ở `/video/nap/` và tốn 0 byte ở các trang khác. Hẹp hơn
 * phạm vi đã khai, không rộng hơn.
 *
 * `accept` DẪN XUẤT từ `nhom_thu_vien: "video"` của bảng khai. Gõ tay danh
 * sách mime ở đây là bản sao thứ hai của bảng, và WO-018 đã trả giá đúng lớp
 * lỗi đó: dòng chữ "định dạng nhận" kể `douyin · bilibili` trong khi whitelist
 * có hai host khác — một dòng chữ gõ tay nói dối thêm một lần nữa.
 */
function nhomVideo() {
  /* Lọc bằng NHÃN `nhom_thu_vien` của bảng khai — cùng nhãn `trang.mjs` dùng.
   * Bản trước lọc bằng tiền tố mime để tiết kiệm 130 byte bundle; đổi lại là
   * HAI phép phân loại cho một câu hỏi, và hai phép thì sẽ lệch. Sau khi dọn
   * hộp thoại sang chunk thì `gn.js` không còn cần 130 byte đó. */
  return (mediaCua().loai ?? []).filter((l) => l.nhom_thu_vien === "video")
}

/*
 * CSS của chunk — KHÔNG vào `prototype.css` (`WO-059`).
 *
 * `gn.css` đang 102378/102400, dư 22 byte. Một luật chỉ dùng ở MỘT màn mà nằm
 * trong bundle CHUNG là đúng thứ `FR-061` chống: mọi độc giả tải nó, kể cả
 * người không bao giờ mở màn này. Cùng khuôn `cctab` đã theo.
 */
const KHOI_CSS = `
.f-tep{margin-top:var(--s-sm)}
.f-tep > span{font-size:var(--fs-meta);color:var(--ink-2);display:block;
  margin-bottom:var(--s-3xs)}
/* Ô THẢ: input thật ẩn đi, cái người thấy là NHÃN — trình duyệt vẽ
   "Choose File | No file chosen" theo cách riêng của từng hệ, nên để nguyên
   là chấp nhận ba giao diện khác nhau cho một ô. */
.f-tep input[type=file]{position:absolute;width:1px;height:1px;opacity:0;
  overflow:hidden;clip-path:inset(50%)}
.f-tha{display:flex;align-items:center;gap:var(--s-2xs);cursor:pointer;
  border:1px dashed var(--border);border-radius:var(--radius-sm);
  padding:var(--s-2xs) var(--s-xs);color:var(--ink-2);font-size:var(--fs-small);
  background:var(--background)}
.f-tha:hover,.f-tep input[type=file]:focus-visible + .f-tha{
  border-color:var(--accent);color:var(--ink)}
.f-tha b{font-weight:600;color:var(--ink)}
.f-tha .f-ten{color:var(--ink-2)}
.f-tha .f-duoi{margin-left:auto;font-size:var(--fs-nano);color:var(--ink-3);
  font-variant-numeric:tabular-nums}
`

function trCss() {
  if (G("napvideo-css")) return
  const e = document.createElement("style")
  e.id = "napvideo-css"
  e.textContent = KHOI_CSS
  document.head.appendChild(e)
}

/*
 * Ô tải file — MỘT KHỐI đúng khuôn form, không phải một input lơ lửng.
 *
 * Bản trước chèn `<input type=file>` trần ngay sau `#vd-url`, ngoài mọi
 * `.f-row`, và đặt cho nó class `.f-file`/`.f-nhan` mà KHÔNG ai viết luật cho
 * — hai class ấy có **0** dòng trong `prototype.css`. Nên trình duyệt vẽ
 * control mặc định giữa một form đã có ngôn ngữ riêng: lệch nền, lệch bo góc,
 * lệch cỡ chữ. Đó là lỗi bố cục chủ dự án chụp lại.
 */
function dungOFile(oU: HTMLInputElement) {
  if (G("vd-file")) return G("vd-file") as HTMLInputElement
  const ds = nhomVideo()
  if (!ds.length) return null
  trCss()
  const duoi = ds.map((l) => l.duoi.replace(".", ""))

  const khoi = document.createElement("div")
  khoi.className = "f-tep"
  /* Câu này nói ĐÁNH ĐỔI, không chỉ nói tính năng: URL là nguồn chính vì nó
     xem được; file là nguồn phụ vì nó ASR được. Người bấm phải biết mình đang
     chọn cái nào và vì sao. */
  const cap = document.createElement("span")
  cap.textContent = "…hoặc tải lên file — để sinh transcript"
  khoi.appendChild(cap)

  const o = document.createElement("input")
  o.type = "file"
  o.id = "vd-file"
  o.accept = ds.map((l) => l.mime).concat(ds.map((l) => l.duoi)).join(",")
  khoi.appendChild(o)

  const nhan = document.createElement("label")
  nhan.className = "f-tha"
  nhan.htmlFor = "vd-file"
  // `class` chứ không `id`: một `id` khai trong JS mà vắng trong shell là
  // một MỐC TREO — cổng `moc-fe-con-that` bắt đúng thứ đó, và nó bắt đúng.
  // Phần tử này sống trong khối vừa dựng, nên hỏi nó qua khối là đủ.
  nhan.innerHTML = '<b>Chọn tệp</b><span class="f-ten">chưa chọn tệp nào</span>'
    + `<span class="f-duoi">${duoi.join(" · ")}</span>`
  khoi.appendChild(nhan)

  oU.closest(".f-row")?.insertAdjacentElement("afterend", khoi)
    ?? oU.insertAdjacentElement("afterend", khoi)
  return o
}

const doGon = (n: number) => n >= 1048576
  ? `${(n / 1048576).toFixed(1)} MB`
  : `${Math.round(n / 1024)} KB`

/** File người chọn, đã nạp qua cửa media. `null` = chưa có. */
let hienVatVideo: { sha256: string; so_byte: number; mime: string; ten_goc: string } | null = null

/*
 * WO-057 · TEN FILE cho vao HEADER.
 *
 * Gia tri header HTTP chi cho **ISO-8859-1**. Mot ten tieng Viet (`Thay on.mp4`)
 * lam `fetch` nem `TypeError` NGAY LUC DUNG REQUEST — 0 byte roi may, va cai
 * `catch` phia duoi tung bao "may chu chua chay?" cho mot loi hoan toan phia
 * client. Do 2026-09-09 tren `:8787` that.
 *
 * Ca AM HON: `cafe.mp4` co dau nam TRONG dai latin1 nen no GUI DUOC, roi Node
 * doc header theo latin1 va ten vao frontmatter bi mojibake — thanh cong voi
 * du lieu sai, nen khong ai phat hien.
 *
 * Loi nay KHONG moi trong file: `x-bo-sung` da percent-encode tu WO-020. Hai
 * header ten file chi la cho bi bo sot.
 *
 * Ham CUC BO, khong dung chung giua hai chunk: `chunk-tu-chua.test.js` (WO-059)
 * cam chunk goi ham cua chunk khac — moi chunk boc IIFE rieng nen mot ham dung
 * chung nem `ReferenceError` ngay lan bam DAU TIEN.
 */
function tenChoHeader(ten) { return encodeURIComponent(String(ten ?? "")) }

async function napFileVideo(f: File) {
  const duoi = ("." + (f.name.split(".").pop() ?? "")).toLowerCase()
  const l = nhomVideo().find((x) => x.duoi === duoi)
  /*
   * Chặn ở đây DÙ `accept` đã lọc: `accept` là gợi ý cho hộp thoại, không phải
   * một cổng — kéo-thả và "All files" đi vòng qua nó dễ dàng. Đúng bài học
   * `#up-tv-f`, chỉ ở chiều còn lại.
   */
  if (!l) {
    kqTV(`\`${duoi}\` không thuộc định dạng video/audio nhận được.`,
      "loi", "up-vd-kq")
    return
  }
  if (!f.size) {
    kqTV("File rỗng — không có byte nào để lưu.", "loi", "up-vd-kq")
    return
  }
  // Trần ĐỌC từ bảng, không gõ số: nới ở bảng thì chỗ này theo ngay.
  const tran = mediaCua().tran_byte ?? 0
  if (f.size > tran) {
    kqTV(`File ${doGon(f.size)}, vượt trần ${doGon(tran)} — 0 byte đã gửi.`,
      "loi", "up-vd-kq")
    return
  }
  kqTV(`Đang nạp ${f.name} (${doGon(f.size)})…`, "ok", "up-vd-kq")
  try {
    // CỬA SẴN CÓ. Không mở đường ghi mới cho cùng một việc — `api-guard`
    // whitelist không đổi vì đơn vị này.
    const r = await fetch("/api/articles/media", {
      method: "POST",
      headers: { "content-type": l.mime, "x-ten-goc": tenChoHeader(f.name) },
      body: await f.arrayBuffer(),
    })
    const d = await r.json()
    if (!r.ok || !d.sha256) {
      kqTV(d.loi ?? loiMay(r), "loi", "up-vd-kq")
      return
    }
    hienVatVideo = {
      sha256: d.sha256, so_byte: d.so_byte ?? f.size,
      mime: d.mime ?? l.mime, ten_goc: d.ten_goc ?? f.name,
    }
    kqTV(`Đã nạp ${hienVatVideo.ten_goc} · ${doGon(hienVatVideo.so_byte)} · `
      + `${l.ten}. Sinh transcript dùng byte này, không tải lại.`,
      "ok", "up-vd-kq")
    const meta = G("vd-meta")
    if (meta) meta.hidden = false
  } catch (e) {
    /*
     * HAI CA, KHONG MOT. `workflow §1a` cam cong chan sai ly do do, va cai
     * `catch` cu gop moi thu thanh "may chu chua chay?" — nguoi doc di khoi
     * dong lai may chu cho mot loi nam hoan toan phia client.
     * `TypeError` tu day = `fetch` nem LUC DUNG request (header khong cho noi
     * gia tri) ⇒ request CHUA BAO GIO roi may. Loi mang thi khong phai TypeError.
     */
    kqTV(e instanceof TypeError
      ? `Không gửi được — tên file "${f.name}" có ký tự header không chở được. `
        + "Đổi tên file rồi thử lại; 0 byte đã gửi."
      : "Không gọi được /api/articles/media — máy chủ chưa chạy?",
      "loi", "up-vd-kq")
  }
}

function ganNapVideo() {
  const oU = G("vd-url") as HTMLInputElement | null
  if (!oU) return
  // Cờ trên phần tử, cùng khuôn `ganNapThuVien`: `khoiDong()` chạy mỗi lần nav.
  if (oU.dataset.ganRoi) return
  oU.dataset.ganRoi = "1"

  const meta = G("vd-meta")
  const soat = () => {
    const tho = oU.value.trim()
    if (!tho) { if (meta) meta.hidden = true; return }
    const h = hostVideoHopLe(tho)
    if (!h) {
      kqTV(loiHost(), "loi", "up-vd-kq")
      if (meta) meta.hidden = true
      return
    }
    kqTV(`Nhận — ${h.nhan}. Điền một câu tóm tắt rồi ghi vào kho.`, "ok", "up-vd-kq")
    if (meta) meta.hidden = false
  }
  oU.addEventListener("input", soat)
  // KHONG gan them `paste`: su kien `input` da ban khi dan (moi trinh duyet
  // hien hanh). Hai listener cho cung mot luc la byte tra gia khong doi lay gi,
  // va `gn.js` dang sat tran.

  // WO-028 · o `vd-slug` da go (WO-021), nen khong con gi de goi y vao —
  // `ghiVideo` tu suy slug luc gui.
  const nut = G("vd-gui")
  if (nut) nut.addEventListener("click", ghiVideo)

  // T03-109 · ô file dựng ở đây, sau khi biết `vd-url` có thật — dựng nó trên
  // một màn không có form là để lại một ô lơ lửng ngoài khung.
  const oF = dungOFile(oU)
  if (oF && !oF.dataset.ganRoi) {
    oF.dataset.ganRoi = "1"
    oF.addEventListener("change", () => {
      const f = oF.files?.[0]
      // Tên tệp hiện NGAY, trước cả khi nạp xong: người vừa chọn cần thấy
      // mình chọn đúng file, chứ không phải đợi một request trả lời.
      const ten = oF.parentElement?.querySelector(".f-ten")
      if (ten) ten.textContent = f ? `${f.name} · ${doGon(f.size)}` : "chưa chọn tệp nào"
      if (f) void napFileVideo(f)
    })
  }
}


/*
 * Điểm vào. `khoiDong()` của `gn.js` chạy mỗi lần đổi view, nên chunk cũng phải
 * gắn lại — cờ `data-ganRoi` trên phần tử lo phần "chỉ gắn một lần".
 */
document.addEventListener("nav", () => { ganNapVideo() })
ganNapVideo()
