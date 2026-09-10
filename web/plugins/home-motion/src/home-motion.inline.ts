/**
 * FR-027e · CHUYỂN ĐỘNG TRANG CHỦ — ba vòng + dựng khối 3D + đếm số.
 *
 * `ui_guide §5`: ba vòng tự chuyển (6s tin nổi bật · 5s biểu đồ · 7s ảnh nền).
 * Ảnh nền đã có ở plugin `backdrop`; file này lo hai vòng còn lại, cộng
 * `growBars` (§8) và `countUp`.
 *
 * BA QUIRK CỦA BẢN THAM KHẢO, SỬA Ở ĐÂY — không port nguyên:
 *
 *  1 `countUp(document)` / `growBars(document)` gọi ngay lúc load, và chúng đặt
 *    cờ `__c`/`__g` để chống chạy lại. Nên lần gọi trong IntersectionObserver
 *    KHÔNG BAO GIỜ làm gì: số đếm và cột 3D chạy xong trước khi người dùng cuộn
 *    tới, lúc đó khối cha vẫn `opacity:0`. Tức reveal-on-scroll không tồn tại.
 *    ⇒ Ở đây CHỈ gọi qua observer.
 *
 *  2 Cờ `hover` chỉ gắn vào vùng hero nhưng dùng cho CẢ vòng biểu đồ. Hậu quả:
 *    trỏ chuột vào hero thì biểu đồ đóng băng, trỏ vào chính biểu đồ thì không
 *    dừng gì — ngược hẳn ý người dùng.
 *    ⇒ Hai cờ riêng, mỗi vòng đọc cờ của mình.
 *
 *  3 `style-hover="…"` là thuộc tính BỊA, không có tác dụng nào. Hover
 *    `translateY(-3px)` chưa từng chạy.
 *    ⇒ Đã viết thành CSS `:hover` thật trong prototype.css.
 *
 * `DESIGN.md §7` đòi TẮT HOÀN TOÀN khi `prefers-reduced-motion` — không phải
 * giảm biên độ. Nên `reduced` ⇒ không hẹn giờ nào, và số/cột hiện thẳng giá trị
 * cuối (người dùng vẫn đọc được mọi thứ, chỉ không có chuyển động).
 */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches

/** Vòng 1 · tin nổi bật. Trả số phần tử để bên gọi biết có gì mà chạy. */
function veFeat(i: number): number {
  const ds = [...document.querySelectorAll<HTMLElement>("[data-feat]")]
  if (!ds.length) return 0
  const n = ((i % ds.length) + ds.length) % ds.length
  ds.forEach((el, j) => {
    el.style.opacity = j === n ? "1" : "0"
    // `translateY` chỉ ở thẻ ĐANG ẨN: thẻ hiện phải về `none`, không phải
    // `translateY(0)` — hai giá trị đó khác nhau khi có transform kế thừa từ
    // `#hero` (nó mang `preserve-3d` + parallax `rotateX`).
    el.style.transform = j === n ? "none" : "translateY(16px)"
    el.style.pointerEvents = j === n ? "auto" : "none"
  })
  document.querySelectorAll<HTMLElement>("[data-dotfill]").forEach((el, j) => {
    el.style.width = j === n ? "100%" : "0%"
  })
  const nhan = document.querySelector<HTMLElement>("[data-rotlabel]")
  if (nhan) nhan.textContent = `0${n + 1} / 0${ds.length} · tự chuyển`
  return ds.length
}

/** Vòng 2 · biểu đồ. Đổi pane rồi CHẠY LẠI thanh bar trong pane vừa bật. */
function vePane(i: number): number {
  const ds = [...document.querySelectorAll<HTMLElement>("[data-pane]")]
  if (!ds.length) return 0
  const n = ((i % ds.length) + ds.length) % ds.length
  ds.forEach((el, j) => {
    el.style.opacity = j === n ? "1" : "0"
    el.style.pointerEvents = j === n ? "auto" : "none"
    // zIndex: pane ẩn vẫn chiếm chỗ (grid-area chồng) nên nếu không hạ nó thì
    // nó ăn click của pane đang hiện dù mắt không thấy.
    el.style.zIndex = j === n ? "2" : "1"
  })
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((el, j) => {
    el.setAttribute("aria-pressed", String(j === n))
  })
  // Thanh bar chạy lại: đặt 0 rồi đặt lại đích ở khung sau. Cùng khung thì
  // trình duyệt gộp hai lần ghi và transition không chạy.
  const pane = ds[n]
  if (!reduced) {
    pane.querySelectorAll<HTMLElement>(".bw > i").forEach((el, k) => {
      const dich = el.style.width
      el.style.width = "0%"
      setTimeout(() => { el.style.width = dich }, 60 + k * 70)
    })
  }
  return ds.length
}

/**
 * §8 · Dựng khối 3D. Ba mặt, ba thuộc tính — mỗi mặt neo `transform-origin` ở
 * mép nó quay quanh (CSS lo), nên dựng cao chỉ là đổi một số mỗi mặt.
 *
 * Cờ `__g` chống chạy lại: observer có thể bắn nhiều lần nếu khối ra rồi vào
 * lại tầm nhìn, và dựng lại từ 0 mỗi lần đọc ra như lỗi.
 */
function veCot(scope: ParentNode) {
  for (const [i, bar] of [...scope.querySelectorAll<HTMLElement>("[data-bar]")].entries()) {
    const b = bar as HTMLElement & { __g?: boolean }
    if (b.__g) continue
    b.__g = true
    const h = Number(bar.dataset.bar) || 0
    const [noc, truoc, hong] = [...bar.children] as HTMLElement[]
    if (!noc || !truoc || !hong) continue
    const dat = () => {
      noc.style.transform = `translateZ(${h}px)`
      truoc.style.height = `${h}px`
      hong.style.width = `${h}px`
    }
    if (reduced) { dat(); continue }
    noc.style.transform = "translateZ(0px)"
    truoc.style.height = "0px"
    hong.style.width = "0px"
    setTimeout(dat, 140 + i * 130)
  }
}

/**
 * FR-027i · Dựng THANH THÀNH PHẦN của màn Kho.
 *
 * Người dùng gọi đây là *"nơi làm animation AI vào"*. Nên nói rõ ranh giới tôi
 * giữ: chuyển động ở đây chạy **MỘT LẦN khi vùng vào tầm nhìn**, không phải một
 * vòng lặp.
 *
 * Vì sao: dashboard này được **dựng lại lúc build** — nó là một ảnh chụp, không
 * phải một dòng dữ liệu đang chảy. Một hiệu ứng nhấp nháy kiểu "AI đang xử lý"
 * trên một trang tĩnh là nói sai về hệ thống, và đó là loại sai tệ nhất vì nó
 * đọc ra rất thuyết phục. Chạy một lần thì nó nói đúng điều đang xảy ra: *"con
 * số này vừa được tính"*.
 *
 * Cờ `__s` chống chạy lại: observer có thể bắn nhiều lần nếu vùng ra rồi vào
 * lại tầm nhìn, và dựng lại từ 0 mỗi lần đọc ra như lỗi.
 */
function veThanhPhan(scope: ParentNode) {
  for (const [i, el] of [...scope.querySelectorAll<HTMLElement>("[data-seg]")].entries()) {
    const e = el as HTMLElement & { __s?: boolean }
    if (e.__s) continue
    e.__s = true
    const w = el.dataset.seg + "%"
    if (reduced) { el.style.width = w; continue }
    el.style.width = "0%"
    setTimeout(() => { el.style.width = w }, 90 + i * 110)
  }
}

/** Đếm số 0 → n. 14 nhịp × 42ms ≈ 590ms — đủ thấy chuyển động, chưa đủ chờ. */
function demSo(scope: ParentNode) {
  for (const el of scope.querySelectorAll<HTMLElement>(".kp .v, .dn-v")) {
    const e = el as HTMLElement & { __c?: boolean }
    if (e.__c) continue
    e.__c = true
    const dich = Number((el.textContent ?? "").replace(/\D/g, "")) || 0
    if (reduced || dich === 0) continue
    const buoc = Math.ceil(dich / 14)
    let v = 0
    const id = setInterval(() => {
      v = Math.min(dich, v + buoc)
      el.textContent = String(v).padStart(2, "0")
      if (v >= dich) clearInterval(id)
    }, 42)
  }
}

/**
 * FR-041 · BỐN HÀM VẼ MỚI của màn Kho — donut · lưới ô · vòng đời · đường vùng.
 *
 * Cùng ranh giới FR-027i đã chốt: chạy MỘT NHỊP khi vùng vào tầm nhìn, không
 * vòng lặp — dashboard là ảnh chụp, hiệu ứng "đang xử lý" trên trang tĩnh là
 * nói sai về hệ thống. Không hàm nào mở setInterval/rAF mới: chuyển động nằm
 * trong CSS transition, JS chỉ đặt giá trị đích (hoặc đặt thẳng khi `reduced`).
 * Cờ `__s`-kiểu chống chạy lại — observer bắn nhiều lần khi màn ẩn/hiện.
 */
/**
 * Query TÍNH CẢ CHÍNH scope — bug thật (người dùng chụp ảnh 2026-08-29):
 * observer quan sát THẲNG `.wf`/`.lc`/`.sl`, mà `querySelectorAll` chỉ tìm
 * HẬU DUỆ nên ba hàm vẽ không bao giờ thấy phần tử của mình → mọi chart kẹt
 * ở opacity 0. `veDonut` thoát nạn tình cờ: nó query `.dn-c` là hậu duệ của
 * mốc `.dn-w` được quan sát.
 */
function timCaMinh(scope: ParentNode, sel: string): HTMLElement[] {
  const ds = [...scope.querySelectorAll<HTMLElement>(sel)]
  const e = scope as HTMLElement
  if (e.matches?.(sel)) ds.unshift(e)
  return ds
}

function veDonut(scope: ParentNode) {
  for (const el of scope.querySelectorAll<SVGElement>(".dn-c")) {
    const e = el as SVGElement & { __d?: boolean }
    if (e.__d) continue
    e.__d = true
    const cung = Number(el.getAttribute("data-cung")) || 0
    const dich = `${cung} ${100 - cung}`
    if (reduced) { el.style.strokeDasharray = dich; continue }
    el.style.strokeDasharray = "0 100"
    setTimeout(() => { el.style.strokeDasharray = dich }, 120)
  }
}

function veLuoiO(scope: ParentNode) {
  for (const el of timCaMinh(scope, ".wf")) {
    const e = el as HTMLElement & { __s?: boolean }
    if (e.__s) continue
    e.__s = true
    // `reduced` vẫn thêm class: khối reduced-motion trong CSS đã tắt
    // transition, nên thêm class là hiện thẳng — không có nhịp nào bị ép.
    if (reduced) { el.classList.add("ve"); continue }
    requestAnimationFrame(() => el.classList.add("ve"))
  }
}

function veVongDoi(scope: ParentNode) {
  for (const el of timCaMinh(scope, ".lc")) {
    const e = el as HTMLElement & { __s?: boolean }
    if (e.__s) continue
    e.__s = true
    if (reduced) { el.classList.add("ve"); continue }
    requestAnimationFrame(() => el.classList.add("ve"))
  }
}

function veDuongVung(scope: ParentNode) {
  // `.cot` (cột theo ngày) đi cùng nhịp thời-gian — cột mọc từ đáy khi vào
  // tầm nhìn, cùng cờ reduced, cùng chống-chạy-lại.
  for (const el of timCaMinh(scope, ".sl, .cot")) {
    const e = el as HTMLElement & { __s?: boolean }
    if (e.__s) continue
    e.__s = true
    if (reduced) { el.classList.add("ve"); continue }
    requestAnimationFrame(() => el.classList.add("ve"))
  }
}

/**
 * FR-031 · Vòng 3 · "Dòng chảy kho" — BA pane nữa ở màn Kho.
 *
 * Dùng lại đúng cơ chế của `vePane`, KHÔNG dùng lại thuộc tính của nó.
 *
 * Vì sao không dùng `data-pane`/`data-tab`: `shell.html` là CHUNG cho mọi trang,
 * nên markup vòng xoay của Trang chủ có mặt trên `/kho/` (đo được: 3 phần tử
 * `data-pane` trong `site/kho/index.html`, nằm trong `#v-home` đang ẩn). Dùng
 * chung tên là hai vòng trộn thành một tập: bấm tab ở Kho sẽ đổi pane ở Trang
 * chủ, và vòng tự chuyển của Kho sẽ nhảy qua pane của Trang chủ.
 *
 * `.bw > i` chạy lại giống `vePane`, và `[data-seg]` của cột tháng cũng vậy —
 * pane ẩn thì transition không chạy, nên phải kích lại khi nó hiện.
 */
function veKPane(i: number): number {
  const ds = [...document.querySelectorAll<HTMLElement>("[data-kpane]")]
  if (!ds.length) return 0
  const n = ((i % ds.length) + ds.length) % ds.length
  ds.forEach((el, j) => {
    el.style.opacity = j === n ? "1" : "0"
    el.style.pointerEvents = j === n ? "auto" : "none"
    el.style.zIndex = j === n ? "2" : "1"
  })
  document.querySelectorAll<HTMLElement>("[data-ktab]").forEach((el, j) => {
    el.setAttribute("aria-pressed", String(j === n))
  })
  const nhan = document.querySelector<HTMLElement>("[data-krotlabel]")
  if (nhan) nhan.textContent = `0${n + 1} / 0${ds.length} · tự chuyển`
  const pane = ds[n]
  if (!reduced) {
    pane.querySelectorAll<HTMLElement>(".bw > i").forEach((el, k) => {
      const dich = el.style.width
      el.style.width = "0%"
      setTimeout(() => { el.style.width = dich }, 60 + k * 70)
    })
    // Cột tháng và thanh chia đoạn: chiều đổi khác nhau (cao vs rộng) nên
    // không gộp được với vòng trên.
    pane.querySelectorAll<HTMLElement>("[data-seg]").forEach((el, k) => {
      const cot = el.tagName === "B"
      const dich = el.dataset.seg + "%"
      if (cot) { el.style.height = "0%" } else { el.style.width = "0%" }
      setTimeout(() => {
        if (cot) el.style.height = dich; else el.style.width = dich
      }, 60 + k * 55)
    })
  }
  return ds.length
}

// ── Nối vào trang ───────────────────────────────────────────────────────────
let hFeat = 0, hPane = 0, hKPane = 0
let treoFeat = false, treoPane = false, treoKPane = false   // cờ RIÊNG cho từng vùng — xem quirk 2

function gan() {
  const soFeat = veFeat(0)
  const soPane = vePane(0)

  document.querySelectorAll<HTMLElement>("[data-dot]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); veFeat(Number(el.dataset.dot)) })
  })
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); vePane(Number(el.dataset.tab)) })
  })
  const soKPane = veKPane(0)
  document.querySelectorAll<HTMLElement>("[data-ktab]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); veKPane(Number(el.dataset.ktab)) })
  })

  // Mỗi vùng dừng vòng CỦA MÌNH khi chuột vào — người đang đọc thì không được
  // cướp nội dung khỏi tay họ (`ui_guide §5`).
  const vungFeat = document.querySelector<HTMLElement>("[data-rot]")
  const vungPane = document.querySelector<HTMLElement>(".pn-w")
  vungFeat?.addEventListener("mouseenter", () => { treoFeat = true })
  vungFeat?.addEventListener("mouseleave", () => { treoFeat = false })
  vungPane?.addEventListener("mouseenter", () => { treoPane = true })
  vungPane?.addEventListener("mouseleave", () => { treoPane = false })
  const vungK = document.querySelector<HTMLElement>("#v-kho-flow")
  vungK?.addEventListener("mouseenter", () => { treoKPane = true })
  vungK?.addEventListener("mouseleave", () => { treoKPane = false })

  if (!reduced) {
    let iF = 0, iP = 0
    if (soFeat > 1) {
      hFeat = window.setInterval(() => {
        if (!treoFeat && !document.hidden) veFeat(++iF)
      }, 6000)
    }
    if (soPane > 1) {
      hPane = window.setInterval(() => {
        if (!treoPane && !document.hidden) vePane(++iP)
      }, 5000)
    }
    // 7s, chậm hơn hai vòng kia (6s · 5s) CÓ CHỦ ĐÍCH: ba pane này là biểu đồ
    // phải đọc con số, không phải ảnh để ngắm. Và ba chu kỳ lệch nhau thì ba
    // vùng không đổi cùng lúc — cả trang nhảy một nhịp đọc ra như lỗi.
    if (soKPane > 1) {
      let iK = 0
      hKPane = window.setInterval(() => {
        if (!treoKPane && !document.hidden) veKPane(++iK)
      }, 7000)
    }
  }

  // Reveal-on-scroll THẬT: chỉ gọi qua observer (quirk 1). Không có observer
  // thì chạy ngay — thà thấy số đúng còn hơn thấy 00 mãi.
  // FR-027f · thêm `.mb` — dải "máy đã làm gì" của 5 màn còn lại mang khối 3D.
  // `IntersectionObserver` VẪN bắn khi một phần tử đi từ `display:none` sang
  // hiện, nên khối ở màn đang ẩn dựng đúng lúc màn đó được mở, không phải
  // dựng sẵn rồi người dùng thấy nó đã cao từ đầu.
  // FR-027i · thêm `.tp-b` — thanh thành phần của màn Kho.
  // FR-041 · thêm bốn mốc chart mới của màn Kho vào danh sách quan sát.
  const muc = [...document.querySelectorAll<HTMLElement>(
    ".kpi, .pn-w, .mb, .tp-b, .dn-w, .wf, .fn, .lc, .sl, .cot")]
  if (!muc.length) return
  if (!("IntersectionObserver" in window)) {
    for (const m of muc) {
      demSo(m); veCot(m); veThanhPhan(m)
      veDonut(m); veLuoiO(m); veVongDoi(m); veDuongVung(m)
    }
    return
  }
  const io = new IntersectionObserver((mms) => {
    for (const mm of mms) {
      if (!mm.isIntersecting) continue
      demSo(mm.target)
      veCot(mm.target)
      veThanhPhan(mm.target)
      veDonut(mm.target)
      veLuoiO(mm.target)
      veVongDoi(mm.target)
      veDuongVung(mm.target)
      io.unobserve(mm.target)
    }
  }, { threshold: 0.12 })
  for (const m of muc) io.observe(m)

  const w = window as Window & { addCleanup?: (fn: () => void) => void }
  w.addCleanup?.(() => {
    clearInterval(hFeat)
    clearInterval(hPane)
    clearInterval(hKPane)
    io.disconnect()
  })
}

gan()
document.addEventListener("nav", () => gan())

export {}
