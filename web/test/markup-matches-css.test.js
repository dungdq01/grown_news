/**
 * Moi class trong markup PHAI co luat CSS, va khoi du lieu PHAI duoc fill.
 *
 * Vi sao co test nay: hai lop loi da lot qua ca 10 test truoc do.
 *
 *   1 · multiwindow sinh class "gn-*" trong khi prototype.css dinh nghia "bk*"
 *       => cua so noi mat het nen/vien/bong, chay theo dong van ban.
 *   2 · emitter nham '<div class="nw">' nhung shell co ID o khoi dau
 *       (`<div class="nw" id="nw">`) va BA khoi cung class
 *       => du lieu bi nhet vao sai vung, "Moi phan tich" trong tron.
 *
 * Ca hai deu la LOI TEN, khong phai loi logic — khong test nao so markup voi
 * CSS nen chung im lang. Test nay lam viec do.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
let loi = 0
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi++
}

/*
 * CSS mà cổng này soi = `prototype.css` CỘNG mọi khối style TIÊM TỪ MÃ.
 *
 * `T03-117` đặt luật của menu tải xuống vào một khối `TX_CSS` tiêm lúc chạy,
 * KHÔNG vào `prototype.css` — đo được: đặt ở đó đẩy `gn.css` lên 103140/102400,
 * vỡ 740 byte, và `FR-061` cấm nới trần bundle chung. `cctab` cũng làm vậy từ
 * `FR-062`.
 *
 * Tính chất cổng này giữ là *KHÔNG class nào thiếu luật* — không phải *mọi luật
 * phải nằm trong prototype.css*. Chỉ soi một file thì nó tố oan đúng những khối
 * đã tránh trần một cách có chủ đích.
 */
const cssTiem = ["multiwindow/src/scripts/multiwindow.inline.js",
  "cctab/src/cctab.inline.js", "chungcat/src/chungcat.inline.js",
  "napvideo/src/napvideo.inline.js"]
  .map((f) => { try { return readFileSync(join(WEB, "plugins", f), "utf8") }
                catch { return "" } }).join(String.fromCharCode(10))
const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
  .concat(String.fromCharCode(10), cssTiem)
  .replace(/\/\*[\s\S]*?\*\//g, "")
const shell = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")

const coLuat = (c) =>
  new RegExp("\\." + c.replace(/-/g, "\\-") + "(?![a-zA-Z0-9_-])").test(css)

// ── 1 · class trong script cua so ────────────────────────────────────────
console.log("\nClass trong markup multi-window co luat CSS\n")
const mwJs = join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.js")
let mw = ""
try { mw = readFileSync(mwJs, "utf8") } catch { /* chua bien dich */ }
if (!mw) {
  ok(false, "multiwindow.inline.js ton tai", "chay `npm run link` truoc")
} else {
  const cls = new Set()
  for (const m of mw.matchAll(/class="([a-zA-Z0-9 _-]+)"/g))
    m[1].split(/\s+/).forEach((c) => c && cls.add(c))
  ok(cls.size > 0, `tim thay ${cls.size} class trong markup cua so`)
  const thieu = [...cls].filter((c) => !coLuat(c))
  ok(thieu.length === 0, "moi class cua so deu co luat CSS",
     "khong co luat: " + thieu.join(" "))
}

// ── 2 · class trong shell ────────────────────────────────────────────────
console.log("\nClass trong shell.html co luat CSS\n")
{
  const bo = new Set(["view", "on", "rise", "in"]) // class trang thai, JS quan ly
  const cls = new Set()
  for (const m of shell.matchAll(/class="([a-zA-Z0-9 _-]+)"/g))
    m[1].split(/\s+/).forEach((c) => c && !bo.has(c) && cls.add(c))
  const thieu = [...cls].filter((c) => !coLuat(c))
  ok(thieu.length === 0, `${cls.size} class shell deu co luat CSS`,
     "khong co luat: " + thieu.join(" "))
}

// ── 3 · diem neo cua emitter phai DUY NHAT trong shell ───────────────────
console.log("\nDiem neo thayKhoi() la duy nhat\n")
{
  const idx = readFileSync(join(WEB, "plugins", "home-pages", "index.ts"), "utf8")
  // Emitter chen theo ID moc rong, khong con dung thayKhoi() dem the long nhau.
  // Ban cu dem the nhung shell dung THE RONG (<div id="nw"></div>) nen cat sai
  // => panel ra rong. id la duy nhat theo dinh nghia HTML — chac chan hon.
  const neo = [...idx.matchAll(/chen\(shell,\s*"(\w+)"/g)].map((m) => m[1])
  ok(neo.length >= 4, `${neo.length} diem neo khai trong emitter`)
  for (const n of neo) {
    const d = (shell.match(new RegExp(`id="${n}"`, "g")) ?? []).length
    ok(d === 1, `neo #${n}  khop ${d} lan`,
       d === 0 ? "khong co moc — du lieu bi bo" : "id trung — de fill sai vung")
  }
}

// ── 4 · nhan HOA dung font giao dien + tracking (TYPOGRAPHY.md luat 3) ────
//
// Sua CO CHU DICH 2026-08-19 (FR-018): luat cu doi nhan HOA phai `--f-mn`.
// Gio ca web dung MOT ho chu (Inter) — nhan tach khoi noi dung bang
// letter-spacing + HOA + tabular-nums, khong bang doi ho chu nua.
// `--f-mn` chi con dung cho MA THAT, va ma that khong viet HOA, nen luat
// nay khong duoc phep bat gap no o day.
console.log("\nNhan viet HOA dung font giao dien + tracking\n")
{
  let n = 0
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, " ")
    if (sel.startsWith("@") || !/text-transform:\s*uppercase/.test(m[2])) continue
    n++
    const fam = m[2].match(/font-family:\s*([^;]+)/)?.[1] ?? ""
    const tr = m[2].match(/letter-spacing:\s*([^;]+)/)?.[1] ?? ""
    ok(/--f-ui/.test(fam) && /--tr-lb/.test(tr), `${sel}  --f-ui + --tr-lb`,
       "TYPOGRAPHY.md luat 3 (FR-018): nhan HOA dung font giao dien + tracking .06em")
  }
  ok(n > 0, `kiem ${n} luat viet HOA`)
}

// ── 5 · MOT ho chu cho ca giao dien (FR-018) ─────────────────────────────
// Nguoi dung: "toi can 1 font chu - kieu chu apply cho tat ca cac man".
// Mono con dung duoc, nhung CHI cho ma that: khoi lenh chep duoc va output
// nguyen van cua gate.py/validate.py — o do be rong ky tu co dinh la chuc
// nang. Moc o bat ky cho nao khac la mot man lai lech kieu chu mot kieu.
console.log("\nMot ho chu — mono chi cho MA THAT\n")
{
  // Danh sach DONG cac cho duoc phep mono. Them cho thu nam la phai sua day —
  // do la muc dich: mot dong sua co ho so, khong phai mono lan ra am tham.
  const MA = /^(code|kbd|samp|pre|[^{]*\b(code|pre|kbd)\b|\.up-kq|\.f-kq)/
  const sai = []
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, " ")
    if (!/font-family:[^;]*--f-mn/.test(m[2])) continue
    if (!MA.test(sel)) sai.push(sel)
  }
  ok(sai.length === 0, `mono chi o luat ma that`,
     sai.length ? `con dung o: ${sai.join(" | ")}` : "")

  // Chieu NGUOC LAI — thu suyt lot HAI lan:
  //   lan 1 (FR-016) class bao ngoai bi doi ten, luat mono thanh xac
  //   lan 2 (FR-018) script don CSS mo coi xoa nham vi COMMENT cua luat co
  //          nhac ten class chet
  // Ca hai lan test cu van xanh, vi no chi hoi "mono co lan ra ngoai khong".
  // Cau hoi con lai: MA co con mono khong.
  const coLuatMa = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].some(([, sel, than]) =>
    /(^|,)\s*code(\s|,|$)/.test(sel) && /font-family:[^;]*--f-mn/.test(than))
  ok(coLuatMa, "the <code> CO luat mono",
     "khong luat nao dat --f-mn cho the code ⇒ moi doan ma hien bang font giao dien")
}

// ── 6 · Moi KHOI DIEU KHIEN phai style NUT cua no ────────────────────────
//
// Loi nay tai di tai lai: style cai HOP (nen, vien, khoang cach), style NHAN,
// style O NHAP — roi quen NUT. Nut roi ve mac dinh trinh duyet: xam, vuong,
// lac han khoi phan con lai. Nguoi dung nhin phat ra ngay.
//
// Danh sach DONG: them mot khoi co nut ma khong style nut ⇒ them dong o day
// va test do — mot dong sua co ho so, khong phai nut xau lot am tham.
console.log("\nMoi khoi dieu khien phai style nut cua no\n")
// Nut dung class chung `.bt` thi da co luat — chi can canh chinh `.bt`.
// Danh sach duoi la nhung khoi dung nut TRAN (khong class), chung khong co gi
// do lung ngoai luat cua chinh khoi do.
for (const [khoi, mo] of [
  [".bt", "class nut dung chung"],
  [".bk-phieu .f-act", "phieu duyet/loai — nut tran"],
  [".bt-bt", "nut bien tap o chan cua so — nut tran"],
  [".sortb", "nhom nut sap xep — nut tran"],
  [".np-tab", "tab man Nap nguon"],
]) {
  const co = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].some(([, sel, than]) =>
    sel.includes(khoi) && /(background|color|border|padding)/.test(than))
  ok(co, `${khoi} co luat (${mo})`,
     "khong luat nao ⇒ nut roi ve mac dinh trinh duyet")
}

console.log(loi ? `\n${loi} loi` : "\npass - markup khop CSS, diem neo duy nhat")
process.exit(loi ? 1 : 0)
