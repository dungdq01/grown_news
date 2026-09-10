/**
 * Nen phong canh tu chuyen — port tu app-v20.html.
 *
 * KHONG dung cross-fade(): Firefox chua ho tro tinh den 2026 (DESIGN.md §6).
 * Hai lop .sky dao opacity — chay moi trinh duyet va chi animate opacity.
 *
 * PHAI decode() truoc khi fade. Dat src roi hien ngay thi trinh duyet giai ma
 * GIUA luc chuyen canh, va khung hinh giat.
 */
type Bo = { light: string[]; dark: string[] }

const MIN_MS = 5000
const MAX_MS = 7000

let BO: Bo = { light: [], dark: [] }
let chiSo = { light: 0, dark: 0 }
let lop: HTMLElement[] = []
let dangDung = 0
let hen: number | undefined
let treoChuot = false

const toi = () =>
  document.documentElement.getAttribute("saved-theme") === "dark" ||
  document.documentElement.classList.contains("dark")

const boHienTai = () => (toi() ? BO.dark : BO.light)

/** Khoang NGAU NHIEN 5-7s. Nhip deu tam tap lam nguoi doc de y toi chuyen canh. */
const khoang = () => MIN_MS + Math.random() * (MAX_MS - MIN_MS)

async function ham(src: string) {
  const im = new Image()
  im.src = src
  try { await im.decode() } catch { /* anh hong thi bo qua, khong chan vong */ }
}

async function doiSang(src: string) {
  if (!lop.length) return
  await ham(src)                       // decode TRUOC khi fade
  const tiep = lop[(dangDung + 1) % lop.length]
  tiep.style.backgroundImage = `url("${src}")`
  tiep.classList.add("on")
  lop[dangDung].classList.remove("on")
  dangDung = (dangDung + 1) % lop.length
}

function hen_gio() {
  clearTimeout(hen)
  const bo = boHienTai()
  if (treoChuot || document.hidden || bo.length < 2) return
  hen = window.setTimeout(async () => {
    const t = toi() ? "dark" : "light"
    chiSo[t] = (chiSo[t] + 1) % bo.length
    await doiSang(bo[chiSo[t]])
    hen_gio()
  }, khoang())
}

function dungLop() {
  document.querySelectorAll(".sky, .mist, .grain").forEach((x) => x.remove())
  lop = [0, 1].map(() => {
    const d = document.createElement("div")
    d.className = "sky"
    document.body.prepend(d)
    return d
  })
  for (const c of ["mist", "grain"]) {
    const d = document.createElement("div")
    d.className = c
    document.body.prepend(d)
  }
}

async function khoiDong() {
  try {
    const r = await fetch("/static/bg/index.json")
    if (!r.ok) return
    BO = await r.json()
  } catch { return }

  const bo = boHienTai()
  if (!bo.length) return

  dungLop()
  await ham(bo[0])
  lop[0].style.backgroundImage = `url("${bo[0]}")`
  lop[0].classList.add("on")
  dangDung = 0
  if (bo[1]) void ham(bo[1])          // nap truoc anh ke tiep
  hen_gio()
}

// ── tu dung dung luc nao ───────────────────────────────────────────────────
const khiAn = () => (document.hidden ? clearTimeout(hen) : hen_gio())
const khiVao = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  // Re chuot len VUNG NEN thi dung — nguoi dang nhin anh, dung doi giua chung
  treoChuot = !t.closest(".top, .pn, .bk, main, article, nav")
  if (treoChuot) clearTimeout(hen); else hen_gio()
}

function gan() {
  // Ba nut tren thanh: tam dung / doi anh ngay / doi tone (tb do multiwindow lo)
  const bamNut = (e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest("#bgp")) {
      e.preventDefault()
      treoChuot = !treoChuot          // dung tam dung lam co "da tam dung"
      const n = document.getElementById("bgp")
      if (n) { n.textContent = treoChuot ? "▶" : "❙❙"
               n.title = treoChuot ? "chay tiep" : "tam dung" }
      if (treoChuot) clearTimeout(hen); else hen_gio()
      return
    }
    if (t.closest("#bgb")) {
      e.preventDefault()
      const bo = boHienTai()
      if (bo.length < 2) return
      const to = toi() ? "dark" : "light"
      chiSo[to] = (chiSo[to] + 1) % bo.length
      void doiSang(bo[chiSo[to]])
      hen_gio()
      return
    }
  }
  // Doi tone => doi sang bo anh cua tone moi
  const khiDoiTone = () => { chiSo = { light: 0, dark: 0 }; void khoiDong() }

  document.addEventListener("click", bamNut)
  // ── FR-027d · PARALLAX khi cuộn (ui_guide §7) ────────────────────────────
  //
  // "Ba lớp, ba tốc độ — càng xa càng chậm." Ở đây chỉ lớp ảnh: `y * 0.07`,
  // đúng hệ số bản tham khảo dùng cho `#photo`. Nền trôi CHẬM hơn nội dung nên
  // mắt đọc ra khoảng cách — đó là cả tác dụng.
  //
  // Ba chốt chặn, mỗi cái một lý do đo được (§6 và DESIGN.md §7):
  //   · `reduced` — tắt hẳn khi người dùng tắt chuyển động. Không phải giảm
  //     biên độ: DESIGN.md §7 nói "tắt hoàn toàn".
  //   · `tick` + rAF — `scroll` bắn hàng trăm lần/giây; ghi `transform` mỗi lần
  //     là buộc trình duyệt tính lại layer liên tục. rAF gộp về 1 lần/khung.
  //   · `document.hidden` — không tính khi tab ẩn.
  //
  // Chỉ `transform`, KHÔNG `top`/`background-position`: transform chạy trên
  // compositor, không kích hoạt layout. `.sky` đã có `will-change:transform`.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  let tick = false
  const veParallax = () => {
    tick = false
    if (document.hidden) return
    const y = window.scrollY || 0
    for (const el of document.querySelectorAll<HTMLElement>(".sky")) {
      el.style.transform = `translate3d(0,${(y * 0.07).toFixed(1)}px,0)`
    }
  }
  const khiCuon = () => {
    if (tick || reduced) return
    tick = true
    requestAnimationFrame(veParallax)
  }
  if (!reduced) window.addEventListener("scroll", khiCuon, { passive: true })

  document.addEventListener("gn-tone", khiDoiTone)
  document.addEventListener("visibilitychange", khiAn)
  document.addEventListener("mouseover", khiVao)
  const w = window as Window & { addCleanup?: (fn: () => void) => void }
  w.addCleanup?.(() => {
    clearTimeout(hen)
    document.removeEventListener("click", bamNut)
    document.removeEventListener("gn-tone", khiDoiTone)
    document.removeEventListener("visibilitychange", khiAn)
    document.removeEventListener("mouseover", khiVao)
    window.removeEventListener("scroll", khiCuon)
    // Trả `.sky` về vị trí gốc: điều hướng SPA giữ lại phần tử, nên transform
    // cũ đọng lại là ảnh lệch một đoạn ở màn mới mà không ai hiểu vì sao.
    for (const el of document.querySelectorAll<HTMLElement>(".sky")) el.style.transform = ""
  })
}

const khiNav = () => { void khoiDong() }
document.addEventListener("nav", khiNav)
window.addEventListener("beforeunload", () => document.removeEventListener("nav", khiNav))

gan()
void khoiDong()

// `export {}` de file nay la MODULE, khong phai script toan cuc.
// Khong co no thi TypeScript coi moi file .inline.ts chung MOT pham vi toan
// cuc — hai file cung khai `khoiDong`, `gan`, `khiNav` thanh "Duplicate
// function implementation" du chung hoan toan doc lap luc chay.
export {}
