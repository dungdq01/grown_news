#!/usr/bin/env node
/**
 * T03-4 - bon man + ba state.
 *
 * Kiem tren OUTPUT BUILD that: 4 vung trang chu, moi vung MOT layout family
 * khac nhau (DESIGN.md §4 - khong family nao lap), man Cho duyet KHONG co nut
 * duyet nao, man Tat ca hien ca draft/rejected.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml, taiSan } from "./_render.mjs"
import { KHUNG } from "./_khung.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const GOC = join(TEST, "..", "..")

// Contract doc THANG tu file — khong can seed kho nua: FR-034/C5 doi nguon
// HTML tu output build sang renderTrang, con ban mock doc kb-mock (cung 13
// ban ghi contract). Assertion giu nguyen.
const contract = JSON.parse(readFileSync(
  join(GOC, "05_uiux", "contracts", "analyses.sample.v5.json"), "utf8"))

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// Doc ban MOCK — luon co 13 ban ghi de kiem.
// real-vs-mock.test.js lo phan "hai ban phai khac nhau".
const home = await trangHtml("trang-chu")
const tatCa = await trangHtml("tat-ca")
// FR-027g · man Cho duyet DA GOP vao Kho — muc `#cho-duyet` trong `v-kho`.
// Doc trang Kho: moi phep kiem duoi day van dung y nguyen, chi doi CHO doc.
const cho = await trangHtml("kho")
const kho = cho

console.log("\nT03-4 - trang chu 4 vung, 4 layout family\n")

// Shell co 8 .pn — 4 o v-home, con lai o v-all/v-queue/v-concepts.
// Chi dem trong view DANG BAT, khong dem ca file.
const viewHome = (home.match(/<div class="view on" id="v-home">([\s\S]*?)(?=<div class="view)/) ?? [])[1] ?? ""

// DEM VUNG THEO LAYOUT FAMILY, khong dem `.pn`.
//
// Y dinh cua phep kiem nay (header dong 5) la "4 vung trang chu, moi vung MOT
// layout family". Dem `.pn` chi la mot CACH do y dinh do — va FR-027e lam cach
// do sai: vung Noi bat khong con panel boc (tieu de tran + luoi 2 cot, chinh
// cac the la panel). Boc no lai la panel-trong-panel: hai lop kinh chong nhau
// doc ra mot khoi duc, va khac ban tham khao ma nguoi dung chi dinh.
//
// Nen dem thu THAT SU dinh nghia mot vung: MOC DU LIEU cua no. Bon moc, bon
// family, khong lap — do la dieu DESIGN.md §4.7 doi.
const FAMILY = [["brk-g", "luoi bat doi xung"], ["nw", "danh sach"],
                ["kpi", "KPI + bar"], ["grid", "luoi the"]]
const vung = FAMILY.filter(([f]) => new RegExp(`class="${f}"`).test(viewHome))
ok(vung.length === 4, "co dung 4 vung",
   `co ${vung.length}: ${vung.map((v) => v[0]).join(", ")}`)

for (const [f, ten] of FAMILY) {
  ok(home.includes(f), `family "${ten}" co mat`)
}

const moBai = home.match(/data-open=/g) ?? []
ok(moBai.length > 0, `${moBai.length} diem bam mo cua so`)

console.log("\nMuc Cho duyet (trong man Kho) - CHI HIEN, khong ghi duoc\n")

// FR-033 · muc `#cho-duyet` DA BO HAN. Nguoi dung bo buoc duyet, nen khong con
// hang doi de hien — bai tao tren web vao kho voi trang thai `approved` ngay.
//
// Phep kiem doi CHIEU: khong hoi "muc nam dung cho chua" ma hoi "no di han
// chua". Con lai la mot khoi chet — nang o MOI trang, khong duong nao toi.
ok(!/id="cho-duyet"/.test(cho), "muc `#cho-duyet` da bo han",
   "con moc la emitter van chen vao mot cho khong ai thay")
ok(!/chờ duyệt/i.test(cho.replace(/<!--[\s\S]*?-->/g, "")),
   "man Kho khong con chu `cho duyet`",
   "ten goi la thu nguoi dung yeu cau bo, khong chi la cai man")
// Luat that (M03-R2 ban FR-011): BUNDLE TINH khong co duong ghi SONG nao.
// FR-011 cho phep MOT form (viet bai, v-nap) nhung no phai NGU trong HTML
// tinh: hidden + api-only — chi song khi /api/health tra 200 (than JS bat).
// Sua CO CHU DICH 2026-08-19: ban cu cam moi `<form` — luat do doi theo FR-011.
// fetch( van khong nam trong danh sach: DOC duoc phep, GHI thi
// no-write-path.test.js soi whitelist literal + method POST/PUT/PATCH/DELETE.
for (const t of ["duyet-btn", "review_status=", "XMLHttpRequest", "sendBeacon"]) {
  ok(!cho.includes(t), `khong co ${t}`,
    "trang thai chi doi qua API nguoi bam - M02-R1, M03-R2/FR-011")
}
{
  // Luat that: MOI form trong bundle tinh phai NGU khi khong co API local.
  // `.api-only` la thu lam viec do (display:none tru khi body.api-co) —
  // `hidden` chi la trang thai dong/mo cua rieng form viet bai.
  //
  // Sua CO CHU DICH 2026-08-19: ban truoc doi DUNG mot form va bat buoc co ca
  // `hidden`. Cai do bat nham form them nhan (#f-cat-moi) — no `api-only` va
  // ngu dung nghia, chi khong dong san. Dem form la dem SAI THU; thu phai dem
  // la form nao co the song ma khong co API.
  const forms = cho.match(/<form[^>]*>/g) ?? []
  const thuc = forms.filter((f) => !/\bapi-only\b/.test(f))
  ok(thuc.length === 0, `${forms.length} form, tat ca deu api-only`,
    `form song trong bundle tinh: ${thuc.join(" ")} — duong ghi hien ca khi khong co API (AC-2.5.1)`)
}

console.log("\nMan Tat ca - hien CA draft va rejected\n")

for (const r of contract.analyses) {
  ok(tatCa.includes(r.title ?? r.slug), `co "${(r.title ?? r.slug).slice(0, 34)}"`)
}
ok(tatCa.includes("st-rejected"), "danh dau ban rejected")
ok(tatCa.includes("st-draft"), "danh dau ban draft")

console.log("\nA11y\n")
ok(home.includes('class="skip"'), "co skip-link")
ok(home.includes('class="sky"') && home.includes('class="mist"')
   && home.includes('class="grain"'),
   "ba lop nen: sky + mist + grain", "thieu mot lop la mat mot tang thiet ke")
// h1 la LOGO (.lg) — dung nhu prototype. Tieu de vung la h2 ben trong .pn-h.
ok(/<h1 class="lg"/.test(home), "h1 la logo")
// <h2 ...> chu khong <h2>: nhan khung mang data-i18n cho che do EN/VI.
// Test kiem VAI (tieu de vung la h2), khong kiem the co attribute hay khong.
ok(/<div class="pn-h">[\s\S]{0,80}<h2[\s>]/.test(home), "tieu de vung la h2 trong .pn-h")
ok(home.includes('lang="vi"'), "khai lang vi")
// The la <button type="button"> — TU bam duoc bang ban phim, khong can
// tabindex. Luot dau test doi tabindex="0" vi markup cu dung <article onclick>.
const nutBam = (home.match(/<button type="button"/g) ?? []).length
ok(nutBam >= 3, `${nutBam} the la <button> — bam duoc bang ban phim`,
   "the khong phai button thi phai co role + tabindex")

// ── FR-020 · man Nap nguon CHI di theo trang /nap/ ───────────────────────
//
// Khoi v-nap la 12.5KB tren 21.9KB shell (57%), phan lon la form viet bai chi
// dung duoc khi API local chay. Nhan no o moi trang la nhan mot man khong ai
// mo tren 7 trang khong dung toi — trang chu tung len 47KB vi the.
//
// Va vi no THIEU o cac trang kia, doiView() phai roi ve tai-trang-that; khong
// co nhanh do thi bam "Nap nguon" doi URL ma man hinh trong tron.
console.log("\nMan Nap nguon chi di theo trang /nap/\n")
{
  // FR-038/C6a · man `/nap/` chung DA BO — moi loai mot man nap rieng.
  const nap = await trangHtml("nap-bai-viet")
  ok(nap.includes('id="v-napbaiviet"') && nap.includes('id="f-bai"'),
     "trang /bai-viet/nap/ CO man va form")

  // Bon trang kia khong duoc mang BAT KY man nap nao — truoc C6a chi co mot,
  // gio co hai (va se co ba). Go tay `v-nap` o day thi man nap thu hai lot qua
  // im lang, dung lop loi ma `cat_khi_khac` sinh ra de chan.
  for (const [t, ten] of [[home, "trang chu"], [tatCa, "tat ca"],
                          [cho, "cho duyet"], [kho, "kho"]]) {
    const lot = [...t.matchAll(/id="v-(nap[a-z]*)"/g)].map((m) => m[1])
    ok(lot.length === 0, `${ten} KHONG mang man nap nao`, lot.join(" · "))
  }

  const js = (await taiSan()).gnJs
  ok(/(?:G|getElementById)\("v-" ?\+ ?v\)/.test(js) && js.includes("location.href"),
     "JS roi ve tai trang that khi man thieu",
     "thieu nhanh nay thi bam Nap nguon tu trang khac ra man hinh trong")

  // ── SCR-05 · form viet bai co MOT O MOI MUC LA, khong mot o ────────────
  // Cong doi du muc. Mot textarea bat nguoi viet tu nho ten muc va tu go
  // `## n.` / `### n.m`, va chi biet minh thieu sau khi cong tra 422 — do la
  // thu wireframe SCR-05 §1 thay bang mot o cho MOI muc la.
  //
  // FR-036: `id` KHONG mang so nua. Ban truoc la `f-muc9`, va moi lan khung doi
  // la mot lan rename id o shell + CSS + test — mot tap go tay nua.
  ok(nap.includes('id="f-o-muc"'), "co khoi o noi dung (`f-o-muc`)")
  /*
   * WO-037 · CHE DO THO DA BO. Nguoi dung chot: form chi nhan van xuoi, tuyet
   * doi khong go dau markdown. Nhung LY DO cua phep kiem cu van dung — bo mot
   * duong thoat ma khong thay gi la nuot noi dung — nen no doi DICH, khong bi
   * xoa: gio doi CHOT AN TOAN o `dienForm`. Chi tiet o `form-van-xuoi.test.js` §5.
   */
  ok(!/data-soan/.test(nap), "khong con nut doi che do o / tho")
  ok(/raiKhung/.test(js) && /doThan/.test(js),
     "van co duong tu choi bai khong khop khung",
     "bo ca hai la mo form roi luu ghi de than bai bang rong, am tham")
  ok(nap.includes('id="f-mau"'), "co nut dien bai mau",
     "hoc bang vi du: o trong khong day duoc nguoi viet biet viet gi")
  for (const [ham, mo] of [
    ["dungKhung", "dung cac o tu khung khai"], ["gomKhung", "o -> markdown"],
    ["raiKhung", "markdown -> o (sua bai cu)"], ["dienMau", "do bai mau"],
  ]) ok(js.includes(ham), `JS co ${mo}`)
  /*
   * RANG NAY TUNG MAT RANG, va day la cho no duoc tra lai.
   *
   * Ban truoc viet `!/## 1\. B/` — chan chuoi `## 1. Boi canh`, ten muc 1 cua
   * khung 9 muc. FR-036 doi muc 1 thanh "Overview", nen dieu kien do thanh
   * HIEN NHIEN DUNG: cong van xanh nhung khong con kiem gi ca.
   *
   * Thay bang mot moc DAN XUAT tu khung: ten muc 1 doc tu khung khai. Khung doi
   * thi moc doi theo, khong ai phai nho sua test.
   */
  const ten1 = KHUNG.muc[0].ten
  ok(/open-index\.json/.test(js) && !js.includes(`## 1. ${ten1}`),
     `bai mau lay tu kho mau, khong go tay trong JS (moc: "## 1. ${ten1}")`,
     "go tay mot ban mau thi no sai lang le ngay lan dau schema doi")

  // ── FR-022 · khong con hop thoai goc trinh duyet ───────────────────────
  //
  // `confirm()`/`prompt()` mang tieu de "127.0.0.1:8787 says", font va nut cua
  // he dieu hanh — khong theo token nao, khong theo quy uoc dat ten nut.
  // Va tu lan thu hai Chrome hien o "Khong cho trang nay tao hop thoai nua":
  // bam nham mot lan thi MOI `confirm` sau do tra false IM LANG — nut Xoa
  // thanh nut chet ma khong bao gi.
  //
  // MOT ngoai le duoc phep: duong du phong trong chinh ham hoi(), cho truong
  // hop trang cu chua co the <dialog>. Tha hoi bang hop thoai trinh duyet con
  // hon im lang LAM LUON mot viec xoa.
  {
    const goi = [...js.matchAll(/\b(confirm|alert|prompt)\s*\(/g)].map((m) => m[1])
    ok(goi.length <= 2, `${goi.length} loi goi hop thoai goc (toi da 2 — duong du phong)`,
       `con: ${goi.join(", ")} — dung hoi() thay vi confirm/prompt`)
    ok(js.includes("dlg-hoi") && js.includes("showModal"),
       "hop thoai cua san pham co trong bundle")
    ok(nap.includes('id="dlg-hoi"'), "the <dialog id=dlg-hoi> co trong shell")
  }

  // ── File trong kho khong doc duoc phai duoc DEM va BAO ─────────────────
  //
  // Bug that (2026-08-20): kb/docs/AIAgent-deploy-prototype.md khong co
  // frontmatter. Emitter `continue` im lang ⇒ bai bien mat khoi MOI con so va
  // MOI man, khong mot canh bao. validate.py bat ngay, web thi khong — nguoi
  // dung tuong da nap xong. `_seed.mjs` giu mot file hong lam fixture.
  //
  // Kiem tren MA NGUON emitter chu khong tren trang da build: dai canh bao chi
  // hien khi kho CO file hong, ma ca hai kho dung de test (`kb-mock/` va kho
  // seed) deu phai SACH — kb-mock con bi `check_kb_mock.py` validate trong CI.
  // Gieo mot file hong vao do la tao mot fixture chong lai chinh cong khac.
  {
    // FR-034/C5 · nguon song cua render la web/render/ (port tu emitter);
    // soi o do — emitter cu se bi nho o C6.
    const nguon = readFileSync(join(TEST, "..", "render", "data.mjs"), "utf8")
      + readFileSync(join(TEST, "..", "render", "trang.mjs"), "utf8")
    ok(/hong\?\.push\(/.test(nguon), "emitter DEM file khong doc duoc",
       "`continue` tran la bo qua im lang — dung thu vua sinh ra bug nay")
    ok(/chen\(shell, "khocanh"/.test(nguon), "emitter chen dai canh bao")
    ok(/validate\.py/.test(nguon), "canh bao chi ra lenh xem chi tiet")
    const shell = readFileSync(
      join(TEST, "..", "plugins", "home-pages", "shell.html"), "utf8")
    ok(shell.includes('id="khocanh"'), "shell co moc cho dai canh bao")
  }

  // ── Bo khoi kho KHAC loai bai — hai viec, hai nhan ─────────────────────
  // Nguoi dung xoa 2 bai roi di tim chung o o "da loai" va thay 0. Hai nut cu
  // ghi "loai…" va "xoa" canh nhau, cung co, khong cho nao noi khac gi.
  //
  // esbuild thoat chu tieng Viet trong gn.js bang CA HAI dang: `\uXXXX` cho
  // chu co dau tren BMP cao, va `\xNN` cho latin-1 (y → \xFD, a → \xE0).
  // Giai ma thieu mot dang la assertion do vi LY DO SAI — chinh no vua xay ra.
  {
    const chu = js
      .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\x([0-9a-fA-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    ok(chu.includes("Bỏ khỏi kho"), "nut xoa ghi ro 'Bo khoi kho'",
       "'xoa' canh 'loai' doc ra la mot viec")
    ok(chu.includes("Loại (ghi lý do)"), "nut loai ghi ro no doi ly do")
    ok(js.includes("kp-rac"), "man Kho co o KPI 'trong thung rac'",
       "bai bo khoi kho khong nam trong 4 o kia — thieu o nay la no boc hoi khoi moi con so")
  }

  // ── Trang thai HONG phai NOI RA ────────────────────────────────────────
  // Ca co that: nguoi dung chay `npm run api` TRUOC khi route /api/categories
  // duoc them. Node khong nap lai ma ⇒ 404, trong khi ma nguon tren dia dung.
  // Ban cu cua napMotDanhMuc `return` lang le va de nguyen chu "dang tai danh
  // muc…" VINH VIEN — giao dien noi doi: no khong dang tai, no da hong.
  ok(/npm run api/.test(js) && /404/.test(js),
     "o danh muc NOI RA khi tai that bai (goi y server chay ban cu)",
     "de nguyen 'dang tai…' la mot loi hua trang khong giu")
}

console.log()
if (loi.length) { console.log(`${loi.length} loi`); process.exit(1) }
console.log("pass - 4 man dung wireframe, a11y day du")
