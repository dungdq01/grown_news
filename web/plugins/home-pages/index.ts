import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { QuartzEmitterPlugin } from "../../_quartz/quartz/plugins/types"
import type { BuildCtx } from "../../_quartz/quartz/util/ctx"
import type { ProcessedContent } from "../../_quartz/quartz/plugins/vfile"
import type { FilePath } from "../../_quartz/quartz/util/path"

/**
 * Nam man tu shell prototype: Trang chu · Tat ca · Cho duyet · Kho · Khai niem.
 *
 * shell.html be nguyen <body> cua app-v20.html. Emitter CHI do du lieu vao cac
 * MOC RONG co id — khong dung mot the nao cua shell.
 *
 * Vi sao chen theo ID: ban truoc dem the long nhau, nhung shell dung the RONG
 * (<div id="nw"></div>) nen dem sai => panel ra rong. Chen theo id la mot phep
 * thay chuoi, khong the sai.
 */

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const SEP = String.fromCharCode(92)

/**
 * NGUONG HIEN THI — khai mot cho, khong rai trong code.
 *
 * Do that tren ban 13 ban ghi: moi the ~2379 byte HTML. Khong gioi han thi
 * 200 ban ghi => 520KB, 500 ban ghi => 1.2MB — trang khong dung duoc, va nguoi
 * doc phai cuon qua hang tram the de tim mot bai.
 *
 * Trang chu chi hien MAU, co nut "xem tat ca" — do la thiet ke G5 (DESIGN.md §4:
 * "moi vung chi hien mau"). Man Tat ca phan trang.
 */
const NGUONG = {
  noiBat: 5,      // feat + phu — tong so ban an vao vung Noi bat
  feat: 3,        // the CHONG trong hero, tu chuyen; moi the mot dot
  phu: 2,         // the phu cot ben — feat + phu = noiBat
  moi: 5,         // danh sach ngay, doc het trong mot lan liec
  luoi: 4,        // mot hang the tren man rong
  cot3D: 3,       // khoi 3D DUNG BA COT: tu cot thu tu tro di cot sau che cot
                  // truoc trong phoi canh nghieng => khoi thanh trang tri
  moiTrang: 24,   // man Tat ca: 24 the ~57KB HTML, cuon 2-3 man hinh
  thangKho: 12,   // Dong chay kho: 12 cot vua mot nam, cot con doc duoc nhan
} as const

type Ban = {
  slug: string; id: string; title: string; priority: number
  credibility_max: string; origin: string; source_type: string
  review_status: string; analyzed_at: string; one_liner: string
  concepts: string[]; concepts_proposed: string[]; category: string[]
  url_normalized: string
  than: string          // thân bài markdown, để cửa sổ đọc mở từ chỉ mục
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

const hai = (n: number) => String(n).padStart(2, "0")

/**
 * Doc mot truong MANG tu frontmatter da parse tho.
 *
 * Vi sao can ham rieng: parser cua docTuDia thu JSON.parse tung dong roi fallback
 * ve chuoi. YAML flow style hop le `[a, b]` KHONG phai JSON hop le (thieu ngoac
 * kep) nen no ngã va tra ve CHUOI "[a, b]". Chi `[]` va `["a","b"]` mới ra mang.
 *
 * Do that tren mau-dat-chuan.md:11 — `concepts: [walk-forward-validation,
 * data-leakage]` parse ra chuoi. Neu tin vao Array.isArray thi moi filter se
 * rong voi MOI file that, con sample thi chay dung => loi chi lo khi nap bai that.
 */
function mang(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  if (typeof v !== "string") return []
  const s = v.trim()
  if (!s.startsWith("[") || !s.endsWith("]")) return []
  return s.slice(1, -1).split(",")
    .map((x) => x.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
}

/**
 * Doc THANG tu thu muc content: build.ts:95 goi filterContent() TRUOC emitter,
 * nen mang `content` chi con ban approved. Man quan ly phai thay ca draft.
 * Doc file la CHI DOC — M03 khong thuoc kb_writers.
 */
function docTuDia(thuMuc: string, hong?: string[]): Ban[] {
  const ra: Ban[] = []
  const quet = (d: string) => {
    for (const t of readdirSync(d)) {
      const p = join(d, t)
      if (statSync(p).isDirectory()) { quet(p); continue }
      if (!t.endsWith(".md") || t.startsWith("_") || t.toLowerCase() === "readme.md") continue
      if (/\.v\d+\.md$/.test(t)) continue

      // File KHONG doc duoc thi GHI TEN LAI, khong bo qua im lang.
      //
      // Bug that: kb/docs/AIAgent-deploy-prototype.md khong co frontmatter.
      // `continue` o day lam no bien mat khoi MOI con so va MOI man — nguoi
      // dung tuong da nap xong, he thong coi nhu khong ton tai. validate.py
      // bat ngay ("Khong co frontmatter YAML") nhung web thi im.
      // Bo qua duoc thi phai NOI RA da bo qua cai gi.
      const m = readFileSync(p, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (!m) {
        hong?.push(p.slice(thuMuc.length + 1).split(SEP).join("/"))
        continue
      }
      const fm: Record<string, unknown> = {}
      // Parse hai dang YAML, ca hai deu xuat hien THAT trong kb/:
      //   flow  `concepts: [a, b]`   — skill source-distiller va kb-mock sinh
      //   block `concepts:` + `- a`  — 05_intake/gate.py sinh (yaml.dump macdinh)
      //
      // Truoc day chi doc dong mot: bai nap qua _inbox/ len web voi category va
      // concepts RONG, sidebar mat han tang chu de. Sample dung flow style nen
      // moi test xanh — loi chi lo khi nap bai that qua cong intake.
      const dongs = m[1].split(/\r?\n/)
      for (let i = 0; i < dongs.length; i++) {
        const kv = dongs[i].match(/^([a-z_]+):\s*(.*)$/)
        if (!kv) continue
        const [, khoa, gt] = kv
        if (gt.trim() === "") {
          // Khoa khong co gia tri cung dong ⇒ co the la block list phia duoi
          const ds: string[] = []
          while (i + 1 < dongs.length) {
            const con = dongs[i + 1].match(/^\s*-\s+(.*)$/)
            if (!con) break
            ds.push(con[1].trim().replace(/^["']|["']$/g, ""))
            i++
          }
          if (ds.length) { fm[khoa] = ds; continue }
        }
        try { fm[khoa] = JSON.parse(gt) } catch { fm[khoa] = gt.replace(/^"|"$/g, "") }
      }
      if (typeof fm.review_status !== "string") {
        hong?.push(p.slice(thuMuc.length + 1).split(SEP).join("/"))
        continue
      }

      const uv = Array.isArray(fm.skill_candidates) ? fm.skill_candidates : []
      const slug = p.slice(thuMuc.length + 1).split(SEP).join("/").replace(/\.md$/, "")
      ra.push({
        // Fallback tiêu đề phải KHỚP đường API (`articles.mjs`: `fm.title ??
        // r.slug`, slug TRẦN). `slug` ở đây CÓ tiền tố loại, nên dùng thẳng nó
        // đã in ra "article/thu-realtime" làm tiêu đề — vừa xấu, vừa làm
        // `dongBoThe` cũ (so chữ hiển thị) chèn thẻ trùng.
        slug, id: String(fm.id ?? ""),
        title: String(fm.title ?? slug.split("/").pop() ?? slug),
        priority: uv.reduce((mx: number, c: Record<string, unknown>) =>
          Math.max(mx, typeof c?.priority === "number" ? c.priority : 0), 0),
        credibility_max: String(fm.credibility_max ?? ""),
        origin: String(fm.origin ?? ""),
        source_type: String(fm.source_type ?? ""),
        review_status: String(fm.review_status),
        analyzed_at: String(fm.analyzed_at ?? ""),
        one_liner: String(fm.one_liner ?? ""),
        concepts: mang(fm.concepts),
        concepts_proposed: mang(fm.concepts_proposed),
        category: mang(fm.category),
        url_normalized: String(fm.url_normalized ?? ""),
        // Than bai (sau `---`) — de cua so doc mo duoc NGAY tu chi muc.
        // Vi sao khong fetch trang bai: Quartz chi sinh trang bai o GOC (tu kho
        // `-d`), nen ban /mock/ khong co trang nao de fetch. Doc ~2.3KB/bai,
        // 15 bai ~35KB — re hon mot vong request, va tu chua theo tung ban.
        than: readFileSync(p, "utf8").slice(m[0].length).trim(),
      })
    }
  }
  quet(thuMuc)
  return ra
}

/*
 * Bản song sinh của `render/trang.mjs` — đổi CÙNG LƯỢT.
 * Sửa một bản mà quên bản kia là lớp lỗi đã trúng dự án này nhiều lần:
 * thẻ đổi hình dạng ngay khi người dùng mở cửa sổ đọc.
 */
const tg = (loai: string) =>
  `<i class="tg"><b>${esc(loai)}</b></i>`

/**
 * Chen vao MOC RONG co id. Mot phep thay chuoi — khong the cat sai.
 *
 * `goiY` la dong hien khi KHONG co du lieu. Khong truyen thi moc de rong, va
 * CSS `[data-mount]:empty{display:none}` an luon ca panel — dung cho nhung vung
 * khong co gi de noi. Truyen thi hien mot dong .hint.
 *
 * Vi sao lo o DAY chu khong o tung cho goi: FR-008 L1 — kho dang 0 bai nen moi
 * moc deu co the rong, va lam tay 13 lan thi chac chan sot mot cho.
 */
function chen(html: string, id: string, noiDung: string, goiY?: string): string {
  const than = noiDung.trim() || (goiY ? `<p class="hint">${goiY}</p>` : "")
  const re = new RegExp(`(<(\\w+)[^>]*\\bid="${id}"[^>]*>)\\s*(</\\2>)`)
  return html.replace(re, (_m, mo, _the, dong) => mo + than + dong)
}

/**
 * FR-027j · Nguoi dung: *"tat ca nhung thu goi la comment / guide thi dung co
 * show ra"*.
 *
 * Cau van giai thich RA KHOI man, vao `title=` cua nhan "TU DONG". Tra duoc khi
 * can, khong chiem cho. Du an da lam dung phep nay mot lan roi — tab man Danh
 * muc: *"Dong giai thich cu day tab cao gan gap doi va lap lai thu da noi o
 * panel dau man. Chuyen vao `title=` — tra duoc khi can, khong chiem cho."*
 *
 * Con lai tren man: NHAN + SO. Do la thong tin; cau van la chu thich.
 */
/** Bo the khoi mot cau truoc khi nhet vao `title=` — thuoc tinh khong hieu HTML. */
const chuTran = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()

const daiMay = (o: readonly (readonly [string, string | number])[]) =>
  `<div class="mb-t-w">
     <div class="mb-l"><span class="mb-i"><i></i><i></i><i></i></span>tự động</div>
   </div>
   ${o.length ? `<div class="mb-s">${o.map(([n, v]) =>
     `<span class="mb-o"><span class="mb-n">${esc(n)}</span><span class="mb-v">${esc(v)}</span></span>`)
     .join("")}</div>` : ""}`

/**
 * FR-027f · KHOI 3D dung duoc nhieu lan.
 *
 * Bê ra khoi vung `bars` cua Trang chu vi bon man can no. `data-bar` mang
 * CHIEU CAO px chu khong phai gia tri tho: JS dung cot bang cach doi ba thuoc
 * tinh (noc translateZ · truoc height · hong width) nen no can px. Chuan hoa
 * o day de JS khong phai biet gi ve du lieu.
 *
 * DUNG BA COT. Khoi 3D chi doc duoc khi so cot it — mat so chieu cao trong
 * phoi canh nghieng, va tu cot thu tu tro di cot sau che cot truoc.
 */
/**
 * FR-027i · `catBot` — so muc BI CAT khoi khoi 3D.
 *
 * Vi sao phai truyen vao: khoi chi ve `NGUONG.cot3D` = 3 cot. Ban mock co SAU
 * loai nguon, nen khoi cong ra 9 trong khi dai ngay canh no noi 13 — nguoi doc
 * cong ba cot roi khong hieu bon ban con lai o dau.
 *
 * Cat bot la hop le (khoi 3D chi doc duoc khi it cot). NOI RA moi la bat buoc:
 * cat im lang thi bieu do doc ra nhu "da phu het".
 */
const CAO3D = 118   // px cao nhat — khop `data-bar="118"` cua ban tham khao
const khoi3D = (o: readonly (readonly [string, number])[], nho = false, catBot = 0) => {
  const max = Math.max(1, ...o.map(([, n]) => n))
  return `<div class="tw-w${nho ? " sm" : ""}">
     <div class="tw-i">
       <div class="tw-p">${o.map(([, n], i) => `
         <div class="tw-b" data-bar="${Math.round((n / max) * CAO3D)}"
           style="left:${24 + i * 76}px">
           <i class="tw-t" style="background:var(--b${i + 1}t)"></i>
           <i class="tw-f" style="background:var(--b${i + 1}f)"></i>
           <i class="tw-s" style="background:var(--b${i + 1}s)"></i>
         </div>`).join("")}</div>
     </div>
   </div>
   <div class="tw-l">${o.map(([ten, n]) => `<span>${n} ${esc(ten)}</span>`).join("")}${
     catBot > 0 ? `<span class="tw-x">+${catBot} loại nữa</span>` : ""}</div>`
}

const bar = (nhan: string, n: number, max: number, mau: string) =>
  `<div class="br"><span class="bl">${esc(nhan)}</span>
   <span class="bw"><i style="width:${max ? (n / max) * 100 : 0}%;--c:${mau}"></i></span>
   <span class="bn">${n}</span></div>`

/**
 * The bai. Ba `data-*` la du lieu cho filter client-side — loc bang cach
 * an/hien the, KHONG build lai trang (site tinh).
 *
 * BA CHIEU, moi chieu mot cau hoi (FR-009):
 *   data-loai  source_type  "nguon nay o dang gi?"     enum 6
 *   data-cat   category     "bai thuoc mang nao?"      enum 6, danh muc dong
 *   data-cpt   concepts     "bai day ky thuat gi?"     22 muc, danh muc roi
 */
// `data-slug` — FR-024: `data-open` là CHỈ SỐ vào chỉ mục, và chỉ mục đọc lúc
// runtime có thể khác chỉ mục lúc build (bài mới thêm sau). FE cần một khoá BỀN
// để sửa lại chỉ số; slug là duy nhất trong kho, url_normalized thì không.
const the = (b: Ban, i: number) =>
  `<button type="button" class="cd st-${esc(b.review_status)}"
     ${i >= 0 ? `data-open="${i}"` : ""} data-slug="${esc(b.slug)}"
     data-loai="${esc(b.source_type)}"
     data-cat="${esc(b.category.join(" "))}"
     data-cpt="${esc(b.concepts.join(" "))}"
     data-ngay="${esc(b.analyzed_at)}" data-pri="${b.priority || 0}"
     style="--c:var(--c-${esc(b.source_type)},var(--ink-2))">
     ${tg(b.source_type)}
     <h4>${esc(b.title)}</h4>
     <div class="mt"><span class="pr">${b.priority || "—"}</span>
       ${esc(b.credibility_max)}
       ${b.review_status !== "approved" ? `· ${esc(b.review_status)}` : ""}
       ${b.origin === "external" ? '<span class="ex">ngoài</span>' : ""}</div>
     ${b.category.length
       ? `<div class="cts">${b.category.map((c) => `<span class="ctx">${esc(c)}</span>`).join("")}</div>`
       : ""}
   </button>`

const dong = (b: Ban, i: number) =>
  `<a ${i >= 0 ? `data-open="${i}"` : ""} data-slug="${esc(b.slug)}"><time>${esc(b.analyzed_at)}</time>
   <div><h4>${esc(b.title)}</h4><p>${esc(b.one_liner)}</p></div>
   ${tg(b.source_type)}</a>`

// `dongDuyet()` DA XOA (FR-033) — man Cho duyet khong con, nen mot hang cua
// danh sach do khong con cho nao de ve.

/**
 * Hai kho, MOT ham doc.
 *
 *   kb/        du lieu THAT  — nguoi nap qua Claude Code hoac _inbox/
 *   kb-mock/   du lieu MAU   — de xem giao dien khi kb/ con rong
 *
 * kb-mock/ dung DUNG dinh dang kb/ (.md + frontmatter), nen ca hai di qua cung
 * mot docTuDia(). Truoc do mock doc JSON contract bang mot ham RIENG — hai
 * duong parse khac nhau se lech nhau ngay lan dau schema doi.
 *
 * Vi sao khong doc thang contract nua: file do co HAI VAI lan nhau — hop dong
 * G5 (frozen, test doc _expected_render) va kho bai mau (sua thoai mai). Gop lam
 * mot nghia la them mot bai mau thi phai mo FR.
 */
const KHO = {
  that: "kb",
  mau: "kb-mock",
} as const

const duongKho = (ten: string) => join(GOC, "..", ten)


/**
 * Nguong M07 tu 07_curate/thresholds.yaml — KHONG go lai so.
 *
 * M07-R2: "sua MOT cho, khong rai trong ma". Nhan "dat nguong goi y gop" o man
 * Khai niem tung hardcode `n >= 2`, trong khi curate.py doc tu file. Chinh file
 * ma web van bao theo so cu la lech im lang — dung ho loi enum category.
 * File no ghi ro ca ba so la PHONG DOAN va se sua sau khi nap 10 bai that.
 */
function docNguong(khoa: string, macDinh: number): number {
  const f = join(GOC, "..", "07_curate", "thresholds.yaml")
  if (!existsSync(f)) return macDinh
  const m = readFileSync(f, "utf8").match(new RegExp(`^${khoa}:\\s*(\\d+)`, "m"))
  return m ? Number(m[1]) : macDinh
}

/**
 * FR-027k · TAP TRANG THAI doc tu ENUM CUA SCHEMA, khong liet ke tay.
 *
 * Bon lan lien tiep cung mot lop loi: code liet ke tay ba gia tri cua
 * `review_status` va bo sot `edited`. Nguon chan ly cua TAP nay la schema —
 * doc thang tu do thi them mot trang thai thu nam khong con lam bieu do lang
 * le thieu no. `bon-trang-thai.test.js` §4b canh chinh dieu nay.
 */
const TRANG_THAI: string[] = (() => {
  const f = join(GOC, "..", "core", "assets", "frontmatter.schema.json")
  if (!existsSync(f)) return ["approved", "draft", "edited", "rejected"]
  try {
    const sc = JSON.parse(readFileSync(f, "utf8"))
    const e = sc?.properties?.review_status?.enum
    return Array.isArray(e) && e.length ? e.map(String) : ["approved", "draft", "edited", "rejected"]
  } catch { return ["approved", "draft", "edited", "rejected"] }
})()

type MucDanhMuc = { id: string; label: string; gom: string }

/**
 * Doc danh muc nhan tu <kho>/<ten>.yaml. MOT ham cho CA HAI file.
 *
 * Hai file cung hinh dang: list cap 1 voi `- id:` + `label_vi:`. categories.yaml
 * co thêm `gom:` (ranh gioi giua 6 mang). Viet ban thu hai la nhan ban no —
 * dung ho hai ban schema da lech hai lan.
 *
 * concepts.yaml FROZEN (FROZEN.lock) + trong deny list S1 — CHI DOC.
 * Khong dung thu vien YAML: chi can 3 khoa scalar o muc cap 1, va them mot phu
 * thuoc chi de doc 22 dong la khong tuong xung (security_baseline §7 doi ghi ly
 * do moi phu thuoc moi vao decisions.md).
 *
 * NHAN THAM SO KHO: truoc day hardcode "kb" nen ban /mock/ doc BAI tu kb-mock/
 * nhung VOCAB tu kb/ — hai kho tron nhau. Hom nay hai file trung noi dung (chi
 * khac CRLF) nen khong ra bug, nhung do la kieu trung khop tam thoi: dung ho
 * bug word_count o FR-015. `kho-tach-rieng.test.js` canh nguyen tac hai kho
 * tach han.
 */
function docDanhMucFile(kho: string, ten: string): MucDanhMuc[] {
  const f = join(duongKho(kho), ten)
  if (!existsSync(f)) return []
  const ra: MucDanhMuc[] = []
  for (const dong of readFileSync(f, "utf8").split(/\r?\n/)) {
    const mId = dong.match(/^-\s+id:\s*(\S+)/)
    if (mId) { ra.push({ id: mId[1], label: "", gom: "" }); continue }
    if (!ra.length) continue
    const mLb = dong.match(/^\s+label_vi:\s*(.+)$/)
    if (mLb) { ra[ra.length - 1].label = mLb[1].trim(); continue }
    const mGom = dong.match(/^\s+gom:\s*(.+)$/)
    if (mGom) ra[ra.length - 1].gom = mGom[1].trim()
  }
  return ra
}

const docDanhMuc = (kho: string) => docDanhMucFile(kho, "concepts.yaml")
const docChuDe = (kho: string) => docDanhMucFile(kho, "categories.yaml")

/**
 * Dem mot truong MANG tren nhieu ban ghi: gia tri -> so bai dung no.
 * Sap giam dan roi theo ten — thu tu on dinh giua hai lan build.
 */
function demMang(ds: Ban[], f: (b: Ban) => string[]): [string, number][] {
  const d: Record<string, number> = {}
  for (const b of ds) for (const v of f(b)) d[v] = (d[v] ?? 0) + 1
  return Object.entries(d).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/**
 * Sidebar filter man Tat ca — BA tang, moi tang mot cau hoi (FR-009).
 *
 *   chu de     category     "bai thuoc mang nao?"    6 gia tri, enum trong schema
 *   loai nguon source_type  "nguon o dang gi?"       6 gia tri, enum trong schema
 *   khai niem  concepts     "bai day ky thuat gi?"   22 muc, danh muc roi
 *
 * Thu tu THO -> MIN: chu de chia kho thanh 6 manh lon, khai niem chia min nhat.
 * Nguoi loc thuong di tu tho den min, khong nguoc lai.
 *
 * Truoc FR-009 chi co hai tang, va vai "chu de" nam trong truong `tags` tu do:
 * 5 tag xuat hien >=2 lan hanh xu nhu danh muc, 7 tag dung mot lan la tu khoa le,
 * va `quan-ly` tieng Viet lot giua 11 tag tieng Anh. Mot truong hai vai thi khong
 * loc duoc theo vai nao.
 *
 * PRD U6 (prd.md:142): "loc theo concepts — chinh xac vi danh muc duoc kiem
 * soat, khong can embedding". Cung ly luan do ap cho category.
 */
function bangLoc(tatCa: Ban[], nhanCua: Record<string, string> = {}): string {
  // `data-gt` GIU id — JS loc so voi data-cat/data-cpt tren the, doi no la vo
  // bo loc. Chi doi CHU HIEN THI: "Agent va LLM" de doc hon "agent-llm", con id
  // van xem duoc o tooltip. Khong co nhan thi giu id (fail mem).
  const nhom = (nhan: string, khoa: string, cap: [string, number][]) =>
    !cap.length ? "" : `<div class="fl-g">
      <div class="fl-l">${esc(nhan)}</div>
      ${cap.map(([k, n]) => `<button type="button" class="fl-b"
        data-loc="${esc(khoa)}" data-gt="${esc(k)}" aria-pressed="false"
        title="${esc(k)}">
        <span>${esc(nhanCua[k] || k)}</span><b>${n}</b></button>`).join("")}
    </div>`

  // Dem tren CUNG MOT TAP voi luoi (tatCa, ke ca draft/rejected).
  // Luot dau toi dem concepts tren `appr` nhung luoi hien `tatCa` => nhan
  // "eventual-consistency 1" trong khi loc ra 2 the. Test filter-counts bat duoc.
  // Man Tat ca la man QUAN LY: no hien moi trang thai, nen bo loc cung vay.
  return `<button type="button" class="fl-b fl-all" data-loc="reset" aria-pressed="true">
      <span>tất cả</span><b>${tatCa.length}</b></button>
    ${nhom("chủ đề", "cat", demMang(tatCa, (b) => b.category))}
    ${nhom("loại nguồn", "loai", demMang(tatCa, (b) => b.source_type ? [b.source_type] : []))}
    ${nhom("khái niệm", "cpt", demMang(tatCa, (b) => b.concepts))}`
}

/** Nut chuyen mock/real. `goc` la tien to duong dan cua ban dang sinh. */
const nutMode = (laMock: boolean) =>
  `<a href="/" aria-current="${!laMock}" title="dữ liệu thật trong kb/">real</a>` +
  `<a href="/mock/" aria-current="${laMock}" title="13 bản ghi mẫu từ contract v3">mock</a>`

export const HomePages: QuartzEmitterPlugin = () => ({
  name: "HomePages",
  async emit(ctx: BuildCtx, _content: ProcessedContent[]): Promise<FilePath[]> {
    const raTatCa: FilePath[] = []

    // Hai ban: "" = real (doc kb/) va "mock/" = doc contract v3.
    // Du lieu chon luc BUILD, nen nut tren web chi la LINK giua hai ban nay.
    for (const laMock of [false, true]) {
      raTatCa.push(...await dungBan(ctx, laMock))
    }
    return raTatCa
  },
})

async function dungBan(ctx: BuildCtx, laMock: boolean): Promise<FilePath[]> {
  {
    // Ban REAL doc kb/ THAT, ban MOCK doc kb-mock/. Ca hai deu la thu muc .md
    // nen di qua cung mot docTuDia() — khong co hai duong parse de lech nhau.
    //
    // Vi sao: `npm run dev` tro -d vao kho SAMPLE de xem thu giao dien. Neu ban
    // real doc theo -d thi no cung doc sample => hai ban REAL va MOCK giong het
    // nhau, va nut chuyen doi vo nghia. Nguoi dung phat hien dung dieu nay.
    //
    // kb/ dang RONG (0 file) nen ban real hien ra man trong — dung nhu thuc te.
    const goc2 = duongKho(laMock ? KHO.mau : KHO.that)
    const hong: string[] = []
    const tatCa = existsSync(goc2) ? docTuDia(goc2, hong) : []
    const appr = tatCa.filter((b) => b.review_status === "approved")
      .sort((a, b) => b.priority - a.priority)
    // FR-027k · `draft` riêng đã BỎ. Nó chỉ còn một chỗ dùng — `bars4` — và
    // chính chỗ đó là lỗi: nó vẽ `draft` trong khi thang tính trên `chuaLen`,
    // và bỏ sót `edited`. Giờ `bars4` đếm từ `TRANG_THAI` nên không cần biến
    // riêng cho từng trạng thái.
    const rej = tatCa.filter((b) => b.review_status === "rejected")

    /**
     * CHO_DUYET = draft + edited — DUYET DUOC, khong phai CHUA TUNG DUYET.
     *
     * Bug that: man Cho duyet loc `=== "draft"` nen ban `edited` khong hien o
     * do, du `BANG_CHUYEN` cua status.mjs CHO PHEP `edited -> approved` va cua
     * so doc bai CO ve nut Duyet cho no. Duong cut o tang dieu huong: API cho,
     * nut co, ma khong man nao dan nguoi dung toi bai do.
     *
     * Do duoc tren kho that: 2 draft + 1 edited. O KPI "cho duyet" hien 2,
     * "tong ban ghi" hien 3 — ban edited khong nam trong BAT KY o nao trong 4 o.
     * Va no den do bang mot duong binh thuong: sua mot bai approved lam no tut
     * xuong `edited` (articles.mjs), tuc bai ROI KHOI SITE roi bien mat khoi moi
     * con so. Khong tin hieu nao cho nguoi duyet biet co viec phai lam.
     *
     * Comment o dong 435 duoi day da ghi dung bai hoc nay cho CHI MUC cua so
     * ("liet ke trang thai bang tay la dem thu cong mot enum se dai ra"), nhung
     * chua ap cho moc `queue`/`qcount`/`kpi2`. Day la cho ap.
     */
    /*
     * FR-033 · `chuaLen` -> `chuaLen`. KHONG chi doi ten bien.
     *
     * Khong con hang doi, nhung con so VAN THAT: `gate.py:123` (M05-R1) giu
     * `draft` cho hang NHAP TU NGOAI qua `_inbox/`, va `edited` con o du lieu
     * cu. Nhung bai do co that va chua len site — bo dem chung la giau mot phan
     * cua kho.
     *
     * Cai doi la CACH GOI. "Cho duyet" mo ta mot THU TUC (co ai do phai duyet);
     * "chua len site" mo ta mot TRANG THAI. Thu tuc da bo, trang thai thi con.
     */
    const chuaLen = tatCa.filter((b) =>
      b.review_status === "draft" || b.review_status === "edited")

    const demTheo = (f: (b: Ban) => string, ds = appr) => {
      const d: Record<string, number> = {}
      for (const b of ds) { const k = f(b); if (k) d[k] = (d[k] ?? 0) + 1 }
      return d
    }
    const theoLoai = demTheo((b) => b.source_type)
    const theoTin = demTheo((b) => b.credibility_max)
    const maxLoai = Math.max(1, ...Object.values(theoLoai))
    const maxTin = Math.max(1, ...Object.values(theoTin))

    /**
     * CHI MUC MO CUA SO — gop theo url_normalized, gom MOI trang thai.
     *
     * Ba loi truoc day dan den "bam the khong mo duoc gi":
     *
     *  1 `data-open` chi gan cho ban approved ⇒ 4/17 the o man Tat ca va MOI
     *    dong o man Cho duyet khong bam duoc. Nhung hai man do la man QUAN LY:
     *    xem duoc noi dung ban draft chinh la viec nguoi duyet can lam.
     *  2 Ban /mock/ KHONG co static/merged-index.json — plugin merge-by-source
     *    chi phat MOT file o goc (no doc `content` da bi Quartz loc, khong biet
     *    ve hai kho). JS fetch("/static/merged-index.json") o trang /mock/ lay
     *    ban GOC ⇒ chi so tro vao kho khac.
     *  3 Chi so danh bang `appr.indexOf(b)` nhung index da GOP theo
     *    url_normalized ⇒ hai ban cung nguon tro cung mot cho, va so bi trung.
     *
     * Sua: emitter nay biet ca hai kho nen no phat chi muc RIENG cho tung ban,
     * va tra chi so bang map slug -> vi tri trong chinh chi muc do.
     */
    // Gom tu `tatCa`, KHONG tu [...appr, ...draft, ...rej]: bo ba do thieu
    // `edited` — trang thai thu tu cua M02 §2.2. Ban `edited` roi khoi chi muc
    // => iCua() tra -1 => the khong co data-open => bam khong mo duoc gi, dung
    // loi so 1 o tren nhung voi mot trang thai khac. Liet ke trang thai bang
    // tay la dem thu cong mot enum se dai ra; `tatCa` la ca kho, khong dem.
    const nhomBai = new Map<string, { url_normalized: string; priority: number; bans: Ban[] }>()
    for (const b of tatCa) {
      const khoa = b.url_normalized || b.slug
      const co = nhomBai.get(khoa)
      if (co) {
        co.bans.push(b)
        if (b.priority > co.priority) co.priority = b.priority
      } else {
        nhomBai.set(khoa, { url_normalized: khoa, priority: b.priority, bans: [b] })
      }
    }
    const chiMuc = [...nhomBai.values()].sort((a, b) =>
      b.priority - a.priority ||
      (b.bans[0]?.analyzed_at ?? "").localeCompare(a.bans[0]?.analyzed_at ?? ""))

    // slug -> chi so trong chiMuc. Dung slug lam khoa vi no DUY NHAT trong kho,
    // con url_normalized thi nhieu ban chia nhau.
    const viTri = new Map<string, number>()
    chiMuc.forEach((g, i) => { for (const b of g.bans) viTri.set(b.slug, i) })
    const iCua = (b: Ban) => viTri.get(b.slug) ?? -1

    // Comment trong shell.html viet cho NGUOI SUA FILE, khong cho trinh duyet:
    // 18 khoi = 2.3KB, va shell lap lai o MOI trang. Cat luc phat ⇒ nguoi doc
    // code van con day du loi giai, trang van nhe. Cat SAU khi doc, truoc khi
    // chen du lieu — de neo id trong comment khong bi hieu nham la neo that.
    // `\r\n` -> `\n`: shell.html luu CRLF (581 dong = 581 byte `\r` thuan),
    // va shell lap lai o MOI trang. Do that: mock/index.html 49187 byte tren
    // dia nhung 46983 khi doc dang text — 2204 byte la ky tu `\r` khong ai doc.
    //
    // Vi sao dang can: tran page-weight la 48 KB va trang do dang o 48.03 —
    // du CON LAI la -35 byte. Bo `\r` mo lai ~2.2 KB, du cho rail + icon.
    //
    // CHI bo `\r`, KHONG gop khoang trang: shell co 2 the <pre>/<textarea>,
    // trong do khoang trang la NOI DUNG.
    let shell = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "shell.html"), "utf8")
      .replace(/\r\n/g, "\n")
      .replace(/<!--[\s\S]*?-->/g, "")

    // ── VUNG 1 · noi bat ──────────────────────────────────────────────────
    // Chen theo id: regex `.brk-g ... </section>` nuot luon moc #bars va #grid
    // nam sau no. Moi moc rong deu co id — dung id la khong the cat nham.
    /**
     * FR-027e · VUNG NOI BAT dung cau truc trang-chu.html.
     *
     * TRAI  `#hero` (preserve-3d) > `[data-rot]` (display:grid) > 3 the
     *       `[data-feat]` XEP CHONG `grid-area:1/1`, doi bang opacity+translateY.
     *       Roi 3 `[data-dot]` + nhan "01 / 03".
     * PHAI  2 the `flex:1` — chia deu chieu cao voi cot trai.
     *
     * VI SAO XEP CHONG thay vi ba the canh nhau: mot bai duoc 700px thi tit
     * doc o 44px va dek co 62ch — do la kich thuoc de NGUOI DOC. Ba bai canh
     * nhau moi bai duoc 233px: tit phai xuong 20px va dek cat con mot dong.
     * Cung ba bai, mot cach cho doc that va mot cach cho biet la co ba bai.
     *
     * `data-open` GIU NGUYEN tren tung the — bam mo cua so doc la chuc nang
     * dang co, khong duoc mat khi doi layout (`open-card.test.js` canh).
     */
    // Ba ô số liệu — lấy từ dữ liệu THẬT của bài, không bịa. Bản tham khảo gõ
    // tay `6.1% / 17.4% / 19.0%`; ở đây là ba trường có sẵn trong frontmatter.
    const soLieu = (b: Ban) => [
      ["ưu tiên", String(b.priority || "—")],
      ["khái niệm", String(b.concepts.length || "—")],
      ["tin cậy", esc(b.credibility_max || "—")],
    ].map(([nhan, gt]) => `<div class="hs-o"><div class="hs-n">${nhan}</div>
          <div class="hs-v">${gt}</div></div>`).join("")
    const feat = appr.slice(0, NGUONG.feat)
    const phu = appr.slice(NGUONG.feat, NGUONG.noiBat)
    shell = chen(shell, "brk", appr.length ? `
      <div id="hero">
        <div class="hero-r" data-rot>${feat.map((b, j) => `
          <article class="feat" data-feat="${j}" ${j ? 'style="opacity:0"' : ""}>
            <i class="feat-b"></i>
            <div class="feat-m">${tg(b.source_type)}
              <span class="c">${esc(b.credibility_max)}</span>
              <span class="pr">ưu tiên ${b.priority}</span></div>
            <h3><button type="button" class="feat-t" data-open="${iCua(b)}"
              >${esc(b.title)}</button></h3>
            <p class="feat-d">${esc(b.one_liner)}</p>
            <div class="hs">${soLieu(b)}</div>
          </article>`).join("")}</div>
        ${feat.length > 1 ? `<div class="rot-c">${feat.map((_, j) =>
          `<button type="button" class="dot-b" data-dot="${j}"
            aria-label="tin ${j + 1}"><i data-dotfill="${j}"
            style="width:${j ? 0 : 100}%"></i></button>`).join("")}
          <span class="rot-l" data-rotlabel>01 / 0${feat.length} · tự chuyển</span>
        </div>` : ""}
      </div>
      <div class="brk-p">${phu.map((b) => `
        <article class="pcard">
          <div class="feat-m">${tg(b.source_type)}
            <span class="c">${esc(b.credibility_max)}</span>
            <span class="pr">${b.priority}</span></div>
          <h4><button type="button" class="feat-t" data-open="${iCua(b)}"
            >${esc(b.title)}</button></h4>
          <p class="feat-d">${esc(b.one_liner)}</p>
        </article>`).join("")}</div>` : "",
      // SCR-02 §"Ba state · empty": dem draft la thong tin HANH DONG DUOC —
      // noi viec dang cho nguoi dung, khong chi bao "trong".
      chuaLen.length
        ? `Kho có <b>${chuaLen.length}</b> bản chưa lên site.`
        : "Chưa có bài nào. Vào màn Nạp nguồn để thêm bài đầu tiên.")

    // ── VUNG 2 · moi phan tich ────────────────────────────────────────────
    const moi = [...appr].sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at))
    shell = chen(shell, "nw", moi.slice(0, NGUONG.moi).map((b) => dong(b, iCua(b))).join(""),
      "Chưa có bản nào được duyệt.")

    // ── VUNG 3 · KPI trang chu (thu gon — chi tiet o /kho/) ──────────────
    // Cung luat mau voi man Kho (FR-016) — mot the KPI khong the doi mau tuy man
    const oNho = (nhan: string, n: number, lop: string) =>
      `<div class="kp ${n ? lop : "trong"}"><div class="l">${nhan}</div>
        <div class="v">${hai(n)}</div></div>`
    // FR-027e · BON o, xep 2x2. Ba o trong luoi 2 cot cho ra 2+1 — mot o le
    // dong duoi, doc ra nhu thieu du lieu. Bon o la mot khoi vuong dong.
    // O thu tu la "da loai": no da co o man Kho (kpi2) nen khong them phep dem
    // nao, va no la ve con lai cua vong doi — thieu no thi ba o kia khong cong
    // thanh tong.
    shell = chen(shell, "kpi", [
      oNho("trên site", appr.length, "ok"),
      oNho("chưa lên site", chuaLen.length, "warn"),
      oNho("đã loại", rej.length, "bad"),
      oNho("tổng bản ghi", tatCa.length, "tong"),
    ].join(""))

    /**
     * FR-027e · BA PANE XEP CHONG, doi 5s (ui_guide §5).
     *
     * Nguoi dung: "can nhieu hon 1 bieu do de lam hieu ung chuyen doi bieu do
     * tu dong". Ba pane, ba goc nhin, KHONG them mot phep dem nao moi:
     *
     *   pane 0  KHOI 3D — ba trang thai (duyet / cho / loai). Ba cot dung ba
     *           gia tri, va do la ly do tower co DUNG ba cot trong ban tham
     *           khao: mot khoi 3D chi doc duoc khi so cot it.
     *   pane 1  bar ngang theo LOAI NGUON  (`theoLoai`, da co)
     *   pane 2  bar ngang theo DO TIN CAY  (`theoTin`, da co — dung o man Kho)
     *
     * `data-bar` mang CHIEU CAO px, khong phai gia tri tho: JS dung cot bang
     * cach doi ba thuoc tinh (noc translateZ · truoc height · hong width) nen
     * no can px. Chuan hoa o day de JS khong phai biet ve du lieu.
     */
    const tr3 = [
      ["trên site", appr.length, 1],
      ["chưa lên", chuaLen.length, 2],
      ["loại", rej.length, 3],
    ] as const
    shell = chen(shell, "bars", tatCa.length ? `
      <div class="pn-w">
        <div class="pane" data-pane="0">${khoi3D(tr3.map(([ten, n]) => [ten, n]))}</div>
        <div class="pane" data-pane="1" style="opacity:0">${Object.entries(theoLoai)
          .map(([k, n]) => bar(k, n, maxLoai, `var(--c-${k},var(--ink-2))`)).join("")}</div>
        <div class="pane" data-pane="2" style="opacity:0">${Object.entries(theoTin)
          .map(([k, n]) => bar(k, n, maxTin, "var(--ink-3)")).join("")}</div>
      </div>
      <div class="pn-t">
        ${["trạng thái", "loại nguồn", "tin cậy"].map((t, i) =>
          `<button type="button" class="tab-b" data-tab="${i}"
            ${i ? "" : 'aria-pressed="true"'}>${t}</button>`).join("")}
        <span class="pn-l">đổi mỗi 5 giây</span>
      </div>` : "", "Chưa đủ dữ liệu để vẽ.")

    // ── VUNG 4 · kho gan day ─────────────────────────────────────────────
    // slice(3,7): ba bai dau da o vung noi bat. Duoi 4 bai thi vung nay rong,
    // va CSS an ca panel — dung, vi no khong noi them gi.
    shell = chen(shell, "grid", appr.length > 3
      ? appr.slice(NGUONG.noiBat, NGUONG.noiBat + NGUONG.luoi).map((b) => the(b, iCua(b))).join("")
      : `<p class="empty">${appr.length
          ? `Chưa đủ bài để xếp lưới — cần trên ${NGUONG.noiBat} bản đã duyệt.`
          : "Kho trống. Xem bản mẫu ở <a href=\"/mock/\">/mock/</a>."}</p>`)

    // ── MAN TAT CA ───────────────────────────────────────────────────────
    shell = chen(shell, "grid2", tatCa.length
      ? tatCa.map((b) => the(b, iCua(b))).join("")
      : '<p class="empty">Kho trống. Xem bản mẫu ở <a href="/mock/">/mock/</a>.</p>')

    // Doc hai danh muc mot lan, dung cho CA sidebar loc VA man Khai niem.
    const kho = laMock ? KHO.mau : KHO.that
    const danhMuc = docDanhMuc(kho)
    const chuDe = docChuDe(kho)
    const nhanCua: Record<string, string> = {}
    for (const c of [...danhMuc, ...chuDe]) if (c.label) nhanCua[c.id] = c.label

    shell = chen(shell, "filter", bangLoc(tatCa, nhanCua))
    shell = chen(shell, "acount", tatCa.length ? `${tatCa.length} bản` : "")

    /**
     * FR-027f · MAN TAT CA — dai "may da lam gi" + khoi 3D phan bo uu tien.
     *
     * KHONG them nguon du lieu nao: `priority` da nam tren moi ban ghi va da
     * duoc in ra o `.pr` cua tung the. Doan nay chi DEM lai theo ba khoang va
     * noi ra ai tinh con so do.
     *
     * Ba khoang lay tu M06: 65 la nguong "cao" trong cong thuc priority, 45 la
     * nguong duoi. Doc tu `docNguong` thi dung hon, nhung hai so nay KHONG nam
     * trong `concepts.yaml` — chung o cong thuc M06 — nen khai o day va ghi ro
     * nguon, khong gia vo la du lieu.
     */
    const NG_PRI = { cao: 65, vua: 45 } as const
    const pCao = tatCa.filter((b) => (b.priority || 0) >= NG_PRI.cao).length
    const pVua = tatCa.filter((b) => {
      const v = b.priority || 0
      return v >= NG_PRI.vua && v < NG_PRI.cao
    }).length
    const pThap = tatCa.length - pCao - pVua
    shell = chen(shell, "mball", tatCa.length
      ? `<div class="mb-3d">${khoi3D([["cao", pCao], ["vừa", pVua], ["thấp", pThap]], true)}</div>`
        + daiMay([["≥ 65", pCao], ["45–64", pVua], ["< 45", pThap]])
      : "")

    // ── MAN KHAI NIEM — moc #cb chua bao gio duoc fill truoc hom nay ─────
    // Danh muc kiem soat (22 muc) x so bai APPROVED dung moi muc.
    //
    // Vi sao `appr` o day ma `tatCa` o sidebar loc: hai man tra loi hai cau hoi
    // khac nhau. Man Tat ca la man QUAN LY ("kho co gi") nen dem moi trang thai.
    // Man Khai niem tra loi "danh muc nay duoc dung tot chua" — chi bai da duyet
    // moi tinh, vi chi chung len web va chi chung vao he so kiem chung cheo.
    //
    // BAR chi cho muc DA DUOC DUNG: 22 bar trong do 12 bang 0 la nhieu, khong
    // phai thong tin. Nhung muc CHUA dung khong bi cat bo — no xuong vung chip
    // ben duoi. Ly do: kho that dang 0/22, cat bo thi man nay RONG TRON va
    // nguoi dung khong co cach nao xem danh muc ma khong mo file YAML.
    const demCpt = Object.fromEntries(demMang(appr, (b) => b.concepts))
    const daDung = danhMuc.filter((c) => (demCpt[c.id] ?? 0) > 0)
    const chuaDung = danhMuc.filter((c) => !(demCpt[c.id] ?? 0))
    // FR-030 · `maxCpt` DA BO. No chi ton tai de tinh be rong cot bar; gio
    // danh sach nhan la HANG nen khong con thang nao de chuan hoa.

    // Nhan concept la NUT LOC, khong phai hinh trang tri.
    //
    // Bam mot khai niem => nhay sang man Tat ca, loc theo khai niem do.
    // Truoc day chung la <div> tinh: nguoi doc thay so 3 ben canh "data-leakage"
    // nhung khong co cach nao xem BA BAI DO la nhung bai nao.
    shell = chen(shell, "cb", daDung
      /**
       * FR-030 · HANG, khong phai BAR.
       *
       * Do tren du lieu that: ban mock cho moi cot 50% hoac 100% (1 hoac 2 bai),
       * ban real cho TOAN BO 100% (moi nhan dung dung 1 lan). Do dai cot gan nhu
       * khong mang thong tin nao — thu mang thong tin la TEN va SO.
       *
       * Mot bieu do ma moi cot dai bang nhau khong phai bieu do; no la mot danh
       * sach duoc ve to hon can thiet. Va no che mat dieu nguoi dung den man nay
       * de lam: TIM mot nhan roi sua/xoa no.
       *
       * VAN LA NUT LOC — `data-loc`/`data-gt` giu nguyen. Doi HINH DANG ben
       * trong, khong doi chuc nang.
       *
       * Cung hinh dang voi `#cchua` ben duoi: truoc day MOT thuc the co HAI dang
       * (bar khi dang dung, hang khi chua dung) nen mat phai hoc hai lan.
       */
      .slice()
      .sort((a, b) => (demCpt[b.id] ?? 0) - (demCpt[a.id] ?? 0))
      /*
       * FR-031 · HÀNG LÀ `<div>`, PHẦN LỌC LÀ `<button>` BÊN TRONG.
       *
       * Bản FR-030 để cả hàng là một `<button>` lọc. Sạch — nhưng nó khoá luôn
       * cửa: `<button>` không được lồng `<button>`, nên nhãn ĐANG DÙNG không có
       * chỗ đặt nút sửa/xoá. Người dùng báo đúng: "các concept đã được gán thì
       * hiện tại ko thể sửa - xóa".
       *
       * Và cái khoá đó là do HÌNH DẠNG MARKUP, không do luật nào: API vẫn cho
       * sửa nhãn đang dùng (`suaNhan` chỉ chặn đổi `id`). Tức giao diện tự cấm
       * một việc hệ thống vẫn cho làm.
       *
       * Giờ: `<div class="rc-r">` chứa `<button class="rc-loc">` (lọc) +
       * `<span class="rc-act">` (sửa/xoá) — cùng khuôn `hangNhan` của nhãn chưa
       * dùng, nên MỘT thực thể vẫn MỘT hình dạng.
       */
      .map((c) => `<div class="rc-r r-cpt r-dung"><button type="button"
         class="rc-loc" data-loc="cpt" data-gt="${esc(c.id)}" aria-pressed="false"
         title="lọc bài mang nhãn này"><time>${demCpt[c.id] ?? 0} bài</time>
         <span><b>${esc(c.label || c.id)}</b> <code>${esc(c.id)}</code></span>
         </button><span class="rc-act"><button type="button"
         class="bt ghost sm api-only" data-suanhan="cpt:${esc(c.id)}"
         data-nhan="${esc(c.label || "")}" data-gom="">sửa</button><button
         type="button" class="bt dstr sm api-only" data-xoanhan="cpt:${esc(c.id)}"
         data-dung="${demCpt[c.id] ?? 0}">xoá</button></span></div>`).join(""),
      // BA trạng thái, ba câu — bản trước chỉ có hai và gộp sai hai cái cuối.
      // "Chưa đọc được" là câu về một LỖI ĐỌC FILE; danh mục RỖNG là trạng thái
      // hợp lệ (FR-031 xoá sạch để người dùng nhập lại). Nói sai nguyên nhân thì
      // người dùng đi tìm một lỗi không có.
      danhMuc.length
        ? `Danh mục có <b>${danhMuc.length}</b> khái niệm, chưa bài nào dùng tới.`
        : "Danh mục khái niệm đang trống — thêm mục đầu tiên bằng nút bên trên.")

    shell = chen(shell, "ccount", danhMuc.length
      ? `${daDung.length}/${danhMuc.length} đang dùng` : "")

    // Muc chua co bai dung — HANG `.rc-r`, khong con la chip.
    //
    // Vi sao doi: chip khong co cho dat nut. Man nay gio la man QUAN LY nen moi
    // nhan can cho cho nut sua/xoa. `.rc-r` la khuon thung rac o man Kho
    // (css:1025) — da co dung hinh dang `time` + `span{flex:1}` + `button`, nen
    // khong phai them class moi (markup-matches-css doi moi class co luat CSS).
    //
    // NUT chi hien khi API chay, va `.api-only` dat tren NUT chu khong tren hang:
    // `body.api-co .api-only` la display:block, dat len mot .rc-r (flex) se vo
    // bo cuc hang.
    const hangNhan = (
      c: MucDanhMuc, n: number, loai: "cpt" | "cat",
    ) => `<div class="rc-r r-${loai}${n ? " r-dung" : ""}"><time>${n ? `${n} bài` : "0 bài"}</time>` +
      `<span><b>${esc(c.label || c.id)}</b> <code>${esc(c.id)}</code>${
        c.gom ? ` · ${esc(c.gom)}` : ""}</span>` +
      // HAI nut trong MOT o grid: truoc day moi nut tu khai `grid-column:4` nen
      // chung tranh cung mot o va roi xuong hai dong. `.rc-act` la o thu tu.
      `<span class="rc-act">` +
      `<button type="button" class="bt ghost sm api-only" data-suanhan="${
        esc(loai)}:${esc(c.id)}" data-nhan="${esc(c.label || "")}" data-gom="${
        esc(c.gom || "")}">sửa</button>` +
      // FR-031 · nut XOA co o MOI hang, ke ca nhan dang duoc bai dung.
      //
      // Truoc: `n === 0` moi ve nut, con lai in chu "dang dung". Giao dien tu
      // quyet dinh thay nguoi dung, va nguoi dung khong co duong nao de noi
      // "toi biet, van xoa" — dung dieu ho vua bao ("can unlock").
      //
      // `data-dung` mang so bai sang cho hop xac nhan (no can con so de noi he
      // qua). SERVER VAN TU DEM LAI: con so nay chi de HOI cho dung, khong de
      // QUYET DINH — client gui `dung=0` sai thi server van 409.
      `<button type="button" class="bt dstr sm api-only" data-xoanhan="${
        esc(loai)}:${esc(c.id)}" data-dung="${n}">xoá</button>` +
      "</span></div>"

    shell = chen(shell, "cchua", chuaDung
      .map((c) => hangNhan(c, 0, "cpt")).join(""),
      danhMuc.length ? "Mọi khái niệm đều đã có bài dùng tới." : "")

    // ── MAN DANH MUC · CHU DE ────────────────────────────────────────────
    // Moc MOI tu luot truoc: khong man nao tung hien danh sach 6 chu de. Sidebar
    // chi hien gia tri DANG DUNG va hien id tho, form sua bai thi chi co trong
    // tooltip. Nguoi dung muon biet "co nhung mang nao" phai mo file YAML.
    const demCat = Object.fromEntries(demMang(appr, (b) => b.category))
    shell = chen(shell, "catlist", chuDe
      .map((c) => hangNhan(c, demCat[c.id] ?? 0, "cat")).join(""),
      "Danh mục chủ đề đang trống — thêm mục đầu tiên bằng nút bên trên.")
    shell = chen(shell, "catcount", chuDe.length ? `${chuDe.length} mảng` : "")

    // Cot phai: concepts_proposed gom tu MOI ban (ke ca draft — de xuat khong
    // cho duyet bai). Dat nguong M07 concept_merge_min ⇒ danh dau.
    const nguongGop = docNguong("concept_merge_min", 2)
    const deXuat = demMang(tatCa, (b) => b.concepts_proposed)
    // FR-019: mục ĐẠT NGƯỠNG có nút Kết nạp. Nút nằm trong .api-only nên bundle
    // tĩnh không có nó — mở file rời không thấy đường ghi nào.
    shell = chen(shell, "cprop", deXuat
      .map(([k, n]) => `<a><time>${n}×</time><div><h4>${esc(k)}</h4>${
        n >= nguongGop
          ? `<p>đạt ngưỡng gợi ý gộp</p><button type="button" class="bt sm api-only"
             data-ketnap="${esc(k)}" data-so="${n}">kết nạp vào danh mục</button>`
          : ""}</div></a>`).join(""),
      "Không có đề xuất nào đang chờ.")
    shell = chen(shell, "pcount", deXuat.length ? `${deXuat.length} mục` : "sạch")

    /**
     * FR-027f · MAN DANH MUC — dai noi ve DUONG ONG TU DONG co that.
     *
     * `concepts_proposed` la khai niem MAY de xuat tu bai; dat nguong
     * `concept_merge_min` (doc tu thresholds.yaml, khong go lai) thi muc do co
     * nut "ket nap". Do la mot quy trinh tu dong THAT trong repo — dai nay chi
     * noi ra no, khong quang cao.
     *
     * Khoi 3D: BA khai niem duoc dung nhieu nhat. Phan bo, dung ba cot, va no
     * tra loi cau nguoi doc thuc su hoi o man nay: "nhan nao dang song".
     */
    const top3Cpt = Object.entries(demCpt)
      .sort((x, y) => y[1] - x[1]).slice(0, NGUONG.cot3D)
      .map(([k, n]) => [nhanCua[k] ?? k, n] as const)
    const datNguong = deXuat.filter(([, n]) => n >= nguongGop).length
    shell = chen(shell, "mbdm", danhMuc.length || deXuat.length
      ? (top3Cpt.length === NGUONG.cot3D ? `<div class="mb-3d">${khoi3D(top3Cpt, true)}</div>` : "")
        + daiMay([["đề xuất", deXuat.length], ["đạt ngưỡng", datNguong],
           ["đang dùng", Object.keys(demCpt).length]])
      : "")

    // Số trên NHÃN TAB — người dùng thấy có bao nhiêu mục ở tab chưa mở.
    shell = chen(shell, "dmn-cpt", danhMuc.length ? `${danhMuc.length} mục` : "")
    shell = chen(shell, "dmn-cat", chuDe.length ? `${chuDe.length} mảng` : "")
    shell = chen(shell, "dmn-cho", deXuat.length ? `${deXuat.length} chờ` : "sạch")
    // Ngưỡng trong câu giải thích cũng phải đọc từ thresholds.yaml — shell tung
    // gõ cứng `<b>2</b>`, tức bản copy thứ hai của cùng con số (M07-R2).
    shell = chen(shell, "pnguong", String(nguongGop))

    // ── MAN CHO DUYET DA BO (FR-033) ─────────────────────────────────────
    // Bon moc di theo no: `queue` (danh sach), `mbq` (dai B-B1), `qcount`
    // (dem), `tbn` (badge tren tab Kho). Ca bon khong con trong shell.html.
    //
    // `dongDuyet()` — ham dung mot hang cua danh sach do, kem nut "doc & duyet"
    // — cung khong con cho goi. Da xoa; giu lai la mot ham mo coi cham vao
    // `data-duyet`, ma nhanh xu ly cua thuoc tinh do da bo o FE.

    // ── MAN KHO — dashboard rieng ────────────────────────────────────────
    const canThem = Math.max(0, 10 - appr.length)
    // Mau theo TRANG THAI, khong phai theo vi tri (FR-016). So 0 giu mau xam:
    // "0 bai bi loai" to do la bao dong gia — chi to mau khi CO gi de noi.
    /**
     * FR-027i · BIEU DO THANH PHAN thay nam o so kho khan.
     *
     * Nguoi dung: *"page /kho -> can lam bieu do thay vi cac con so kho khan"*.
     *
     * Vi sao mot THANH CHIA DOAN chu khong phai nam bieu do rieng: bon con so
     * dau (duyet / cho / loai / tong) khong phai bon dai luong doc lap — chung
     * la BA PHAN cua MOT tong. Nam o roi rac che dung dieu quan trong nhat:
     * ti le. Mot thanh 100% noi ngay "kho dang o dau" ma khong ai phai tinh nham.
     *
     * THUNG RAC tach RIENG, duoi mot duong ke: bai xoa da ROI khoi `kb/` nen no
     * KHONG phai mot phan cua tong. Gop no vao thanh la mot bieu do NOI SAI —
     * va do la loai loi te nhat, vi no doc ra rat thuyet phuc.
     *
     * `oKpi` giu dung TEN va CHU KY: `bon-trang-thai.test.js` canh
     * `oKpi("chờ duyệt", chuaLen.length` de bat viec dem thieu bai `edited`.
     * Y dinh do khong doi — chi doi cach TRINH BAY, nen giu ham.
     */
    // FR-027j · `phu` vao `title=`, KHONG ve ra man. Truoc day no la
    // `<span class="sub">` va bi `text-overflow:ellipsis` trong cot hep cat
    // thanh "l..", "s..", "c.." — mot chu thich bi cat con hai ky tu thi no
    // khong con la thong tin, chi con la rac thi giac.
    const oKpi = (nhan: string, n: number, lop: string, phu: string) =>
      `<div class="tp-r ${n ? lop : "trong"}" title="${esc(chuTran(phu))}">
        <i class="tp-c"></i>
        <span class="l">${nhan}</span><b class="v">${hai(n)}</b></div>`

    // Ba doan cua MOT tong. Ti le tinh tren `tatCa`, khong tren tong ba doan:
    // hai so do bang nhau thi tot, lech nhau thi co mot trang thai khong thuoc
    // nhom nao — va luc do thanh PHAI hut, khong duoc tu lam cho vua.
    const doan = [
      ["ok", appr.length], ["warn", chuaLen.length], ["bad", rej.length],
    ] as const
    const tong = tatCa.length
    shell = chen(shell, "kpi2", tong ? `
      <div class="tp-b" role="img"
        aria-label="${appr.length} trên site · ${chuaLen.length} chưa lên site · ${rej.length} đã loại trên ${tong} bản ghi">
        ${doan.map(([lop, n]) => n
          ? `<i class="tp-s ${lop}" data-seg="${((n / tong) * 100).toFixed(2)}"></i>`
          : "").join("")}
      </div>
      <div class="tp-t"><b>${hai(tong)}</b> bản ghi${
        appr.length + chuaLen.length + rej.length !== tong
          ? ` · <span class="tp-w">${tong - appr.length - chuaLen.length - rej.length} bản ở trạng thái khác</span>`
          : ""}</div>
      <div class="tp-l">
        ${oKpi("trên site", appr.length, "ok", appr.length ? "lên site" : "chưa có bài nào")}
        ${oKpi("chưa lên site", chuaLen.length, "warn",
          chuaLen.length ? "cần người duyệt" : "sạch")}
        ${oKpi("đã loại", rej.length, "bad",
          rej.length ? "có lý do" : "loại là phán quyết, có ghi lý do")}
      </div>
      <!-- THUNG RAC duoi mot duong ke: bai xoa da ROI khoi kb/ nen no KHONG
           phai mot phan cua thanh tren. Lop api-only vi so nay lay tu API;
           site tinh thuan khong co no. Moc kp-rac de JS dien.

           FR-031 · nguoi dung: "cai nay can coi nhu 1 field de thong ke".
           Dung DUNG khuon .tp-r cua ba o tren — cung con cham, cung nhan,
           cung co so — de mat doc no la mot O THONG KE, khong phai mot dong
           ghi chu bo lung o goc.
           (Khong dung dau nhay huyen trong khoi nay: no nam BEN TRONG mot
            template literal, mot dau nhay huyen la ket thuc chuoi som.)

           Duong ke DUT va vi tri duoi cung O LAI: chung la thu noi "so nay
           khong nam trong thanh tren". Cho no giong ba o kia ve HINH DANG ma
           van tach ve VI TRI — giong het thi thanh bieu do noi sai. -->
      <div class="tp-x api-only">
        <div class="tp-r rac"
          title="đã rời khỏi kho — khôi phục được ở mục Thùng rác bên dưới">
          <i class="tp-c"></i>
          <span class="l">ngoài kho · thùng rác</span>
          <b class="v" id="kp-rac">—</b>
        </div>
      </div>` : "", "Kho trống — chưa có bản ghi nào để vẽ.")

    /**
     * FR-027f · MAN KHO — dai noi su that RIENG cua man nay.
     *
     * Khong lap lai cau cua man Tat ca ("may tinh priority") hay man Cho duyet
     * ("ba truong M1"). Su that rieng o day: CA dashboard nay duoc dung lai tu
     * file .md moi lan build — khong co CSDL nao giu san so nay — va so file
     * may KHONG doc duoc duoc NOI RA thay vi bo qua im lang.
     *
     * Khoi 3D: BA LOAI NGUON. Dung ba cot, va la phan bo chua ve 3D o man khac
     * (man Trang chu ve ba TRANG THAI). `theoLoai` da tinh san o tren.
     *
     * FR-027i · SUA LOI THAT. Ban truoc go cung `["paper","video","repo"]` va
     * ban REAL ve ra BA COT 0 kem nhan "0 PAPER · 0 VIDEO · 0 REPO" — nguoi dung
     * chi vao no trong anh chup.
     *
     * Do duoc: `kb/` that co `docs:1, article:2`; `kb-mock/` co ca paper/video/
     * repo. Tuc DUNG lop loi lap lai cua du an — "du lieu mau khong phu hinh
     * dang du lieu that", nhung lan nay nguoc: MAU phu ROI ma THAT thi khong.
     *
     * Sua: lay BA LOAI NHIEU NHAT tu chinh du lieu. Khong loai nao thi khong ve.
     *
     * Va dem tren `tatCa`, KHONG tren `theoLoai` (mac dinh cua `demTheo` la
     * `appr`). Vi sao: khoi nay nam BEN TRONG dai co cau "dung lai tu N file
     * .md" voi N = `tatCa.length`. Dem `appr` thi hai con so trong CUNG MOT o
     * dem hai tap khac nhau — o ban real do la "1 docs" nam canh cau "3 file".
     * Hai so canh nhau ma khong cung goc la loi im lang kho truy nhat.
     */
    const loaiTatCa: Record<string, number> = {}
    for (const b of tatCa) {
      if (b.source_type) loaiTatCa[b.source_type] = (loaiTatCa[b.source_type] ?? 0) + 1
    }
    const ba3Loai = Object.entries(loaiTatCa)
      .sort((a, b) => b[1] - a[1]).slice(0, NGUONG.cot3D)
      .map(([k, n]) => [k, n] as const)
    shell = chen(shell, "mbkho", tatCa.length
      ? `<div class="mb-3d">${khoi3D(ba3Loai, true,
           Object.keys(loaiTatCa).length - ba3Loai.length)}</div>`
        + daiMay([["bản ghi", tatCa.length], ["không đọc được", hong.length]])
      : "")

    // Dải cảnh báo file KHÔNG ĐỌC ĐƯỢC — thay cho việc bỏ qua im lặng.
    // Một file nằm trong kho mà mọi màn đều lờ đi là hỏng im lặng: người dùng
    // tưởng đã nạp xong, con số nói khác, và không ai biết vì sao lệch.
    if (hong.length) {
      shell = chen(shell, "khocanh",
        // Dải này là TRẠNG THÁI LỖI, không phải chú thích: nó phải nêu đích danh
        // tệp nào hỏng, vì đó là thứ người dùng cần để sửa. Bỏ tên trường và
        // đường dẫn công cụ (quy ước chữ giao diện) — giữ nguyên danh sách tệp.
        `<b>${hong.length} tệp trong kho không đọc được</b> — thiếu phần khai báo
         ở đầu tệp, nên chúng không được tính vào các con số trên:
         <code>${hong.map(esc).join("</code> · <code>")}</code>.`)
    }

    // KPI man Danh muc — dung LAI oKpi cua man Kho, khong viet ban thu hai.
    // Dat o day vi oKpi khai o dong tren; moc `dmkpi` nam o man khac nhung
    // chen() la phep thay chuoi nen thu tu goi khong quan trong.
    /**
     * FR-030 · DANH MUC dang PHINH den dau — mot ti le, khong phai hai so roi.
     *
     * Cau hoi that cua man nay: *"danh muc co dang phinh khong"*. Mot danh muc
     * 24 nhan ma 7 duoc dung la mot tin hieu; hai so `24` va `7 dang dung` dat
     * canh nhau bat nguoi doc tu chia.
     *
     * Dung lai `.tp-b` cua thanh thanh phan (FR-027i): cung loai cau hoi (phan
     * cua mot tong) thi cung loai bieu do. Va no thua huong `veThanhPhan()` —
     * doan dung mot lan khi vao tam nhin.
     */
    const nhanXoaDuoc = chuDe.filter((c) => !(demCat[c.id] ?? 0)).length + chuaDung.length
    const tongNhan = danhMuc.length + chuDe.length
    shell = chen(shell, "dmkpi", (tongNhan
      ? `<div class="tp-b" role="img"
          aria-label="${daDung.length} nhãn đang dùng trên ${tongNhan} nhãn trong danh mục">
          ${[["ok", daDung.length], ["", tongNhan - daDung.length]]
            .map(([lop, n]) => Number(n)
              ? `<i class="tp-s ${lop}" data-seg="${((Number(n) / tongNhan) * 100).toFixed(2)}"
                  ${lop ? "" : 'style="background:var(--ink-3)"'}></i>`
              : "").join("")}
        </div>
        <div class="tp-t"><b>${hai(daDung.length)}</b> / ${tongNhan} nhãn đang được bài dùng tới</div>`
      : "") + [
      oKpi("khái niệm", danhMuc.length, "tong", `${daDung.length} đang dùng`),
      oKpi("chủ đề", chuDe.length, "tong", "danh sách đóng"),
      oKpi("chờ vào danh mục", deXuat.length, "warn",
        deXuat.length ? `đủ ${nguongGop} bài nhắc tới thì kết nạp được` : "sạch"),
      oKpi("xoá được", nhanXoaDuoc, "ok", "chưa bài nào dùng tới"),
    ].join(""))

    shell = chen(shell, "bars2", Object.entries(theoLoai)
      .map(([k, n]) => bar(k, n, maxLoai, `var(--c-${k},var(--ink-2))`)).join("")
      || '<p class="empty">Chưa có bài nào.</p>')

    /**
     * FR-027k · ĐỘ TIN CẬY vẽ bằng THANH CHIA ĐOẠN, không phải bar rời rạc.
     *
     * `credibility_max` là enum CÓ THỨ TỰ: `verified > plausible > claimed >
     * conflicted`. Cái người đọc cần biết ở đây không phải "mỗi mức bao nhiêu
     * bài" mà **"bao nhiêu phần kho là nguồn đã kiểm"** — một câu hỏi về TỈ LỆ.
     * Bốn bar rời rạc không trả lời được nó: mắt phải tự cộng rồi tự chia.
     *
     * Dùng lại `.tp-b`/`.tp-s` của thanh thành phần (FR-027i) — cùng loại câu
     * hỏi thì cùng loại biểu đồ, không phát minh cơ chế thứ hai. Và nó cũng thừa
     * hưởng luôn `veThanhPhan()`: đoạn dựng một lần khi vào tầm nhìn.
     *
     * THỨ TỰ đọc từ schema, không sắp theo số lượng: đây là thang đo, và đảo
     * thang đo theo dữ liệu là làm mất chính cái thang.
     */
    const THU_TU_TIN = ["verified", "plausible", "claimed", "conflicted"] as const
    const MAU_TIN: Record<string, string> = {
      verified: "var(--ok)", plausible: "var(--ink-2)",
      claimed: "var(--warn)", conflicted: "var(--destructive)",
    }
    const tongTin = Object.values(theoTin).reduce((a, b) => a + b, 0)
    /* FR-041 lượt 2 · khối `bars3 (tin cậy)` đã RỜI màn — xem web/render/trang.mjs (bản sống). */

    /**
     * FR-027k · BỐN trạng thái, đếm từ `TRANG_THAI` (đọc enum của schema).
     *
     * Bản trước gõ tay ba giá trị và bỏ sót `edited` — nên một bài đã duyệt rồi
     * bị sửa không xuất hiện ở đâu trong biểu đồ trạng thái. `maxTrang` thì lại
     * tính trên `chuaLen` (draft + edited) trong khi cột vẽ `draft`, nên thang
     * cũng lệch.
     *
     * Vì sao biểu đồ này KHÔNG trùng thanh thành phần ở đầu màn: thanh kia gộp
     * `draft + edited` thành một đoạn "chờ duyệt" — đúng cho câu hỏi *"kho đang
     * ở đâu"*. Biểu đồ này TÁCH chúng, vì hai tình huống khác nhau: `draft` là
     * chưa ai đọc, `edited` là đã duyệt rồi bị sửa nên **rời khỏi site**. Người
     * quản lý cần phân biệt.
     */
    const demTrang: Record<string, number> = {}
    for (const b of tatCa) {
      if (b.review_status) demTrang[b.review_status] = (demTrang[b.review_status] ?? 0) + 1
    }
    const maxTrang = Math.max(1, ...TRANG_THAI.map((s) => demTrang[s] ?? 0))
    const MAU_TRANG: Record<string, string> = {
      approved: "var(--ok)", draft: "var(--warn)",
      edited: "var(--warn)", rejected: "var(--ink-3)",
    }
    shell = chen(shell, "bars4", TRANG_THAI
      .map((s) => bar(s, demTrang[s] ?? 0, maxTrang, MAU_TRANG[s] ?? "var(--ink-3)"))
      .join(""))

    /* ═══ FR-031 · DÒNG CHẢY KHO — ba góc nhìn nữa, ba HÌNH DẠNG ═════════════
     *
     * Người dùng: *"Tạo nhiều dashboard cho mục thống kê này hơn → đa dạng auto
     * scroll."*
     *
     * Cả ba đọc từ trường ĐÃ CÓ trong `Ban` — không thêm trường, không đổi API,
     * không đọc thêm file. Và mỗi cái là một hình dạng khác, vì "đa dạng" phải
     * theo hình dạng DỮ LIỆU chứ không theo số lượng biểu đồ:
     *
     *   theo tháng    chuỗi THỜI GIAN, có thứ tự tự nhiên  → cột dọc
     *   theo nguồn    ba phần của một tổng                 → thanh chia đoạn
     *   theo ưu tiên  ba mức có thứ tự, cần số chính xác   → hàng
     *
     * Cơ sở đếm: CẢ KHO (`tatCa`), khai ở nhãn từng pane. Panel `.pt3` bên trên
     * đếm `appr` ở hai mục đầu — hai khối khác mẫu số thì phải nói ra, nếu không
     * người đọc cộng ngang qua chúng.
     */
    // ── Pane 1 · theo tháng ────────────────────────────────────────────────
    // `analyzed_at` là `YYYY-MM-DD`; cắt 7 ký tự ra `YYYY-MM`. Bài thiếu ngày
    // KHÔNG bị nhét vào một tháng đoán được — nó ra ô "chưa rõ", vì đoán hộ ở
    // một biểu đồ thời gian là dịch chuyển cả đường cong.
    // Một regex làm cả hai việc: lấy `YYYY-MM` và xác nhận định dạng. Bản đầu
    // cắt bảy ký tự đầu rồi kiểm bằng một regex thứ hai — hai bước cho một câu
    // hỏi, và `page-weight` bắt đúng: nó cấm cắt-theo-số-cứng trong emitter vì
    // mọi ngưỡng phải khai ở `NGUONG`, mà nó không phân biệt được cắt CHUỖI với
    // cắt MẢNG. Đổi sang regex thì ý định rõ hơn và cổng không phải đoán.
    const demThang: Record<string, number> = {}
    let khongNgay = 0
    for (const b of tatCa) {
      const m = /^(\d{4}-\d{2})/.exec(b.analyzed_at || "")
      if (m) demThang[m[1]] = (demThang[m[1]] ?? 0) + 1
      else khongNgay++
    }
    const thang = Object.keys(demThang).sort().slice(-NGUONG.thangKho)
    const maxThang = Math.max(1, ...thang.map((t) => demThang[t] ?? 0))
    shell = chen(shell, "kf-thang", thang.length
      ? `<div class="kf-col" role="img" aria-label="${thang
          .map((t) => `${t}: ${demThang[t]} bài`).join(" · ")}">
        ${thang.map((t) => `<div class="kf-c" title="${esc(t)} · ${demThang[t]} bài">
          <b data-seg="${((demThang[t] / maxThang) * 100).toFixed(2)}"></b>
          <span>${esc(t.slice(5))}</span></div>`).join("")}
      </div>
      <div class="kf-n">${thang.length} tháng gần nhất · cả kho${
        khongNgay ? ` · ${khongNgay} bài chưa rõ ngày` : ""}</div>`
      : "", "Chưa bài nào có ngày phân tích.")

    // ── Pane 2 · theo nguồn gốc ────────────────────────────────────────────
    const NGUON: Array<[string, string, string]> = [
      ["pipeline", "máy dựng", "var(--ok)"],
      ["manual", "bạn viết", "var(--ink-2)"],
      ["external", "nguồn ngoài", "var(--warn)"],
    ]
    const demNguon: Record<string, number> = {}
    for (const b of tatCa) if (b.origin) demNguon[b.origin] = (demNguon[b.origin] ?? 0) + 1
    const tongNguon = tatCa.length
    /* FR-041 lượt 2 · `kf-nguon (origin)` đã RỜI màn. */

    // ── Pane 3 · theo ưu tiên ──────────────────────────────────────────────
    // Ba mức dùng ĐÚNG ngưỡng của bộ lọc màn Tất cả (≥65 · 45-64 · <45). Đặt
    // ngưỡng khác ở đây là hai chỗ trên cùng một app nói hai định nghĩa "cao".
    const MUC: Array<[string, (n: number) => boolean]> = [
      ["cao · từ 65", (n) => n >= 65],
      ["vừa · 45-64", (n) => n >= 45 && n < 65],
      ["thấp · dưới 45", (n) => n < 45],
    ]
    const demMuc = MUC.map(([, f]) => tatCa.filter((b) => f(b.priority || 0)).length)
    const maxMuc = Math.max(1, ...demMuc)
    /* FR-041 lượt 2 · `kf-uutien (ưu tiên)` đã RỜI màn. */

    // "M1" và "metric chặn của dự án" là từ vựng của người CHẤM dự án, không
    // phải của người đọc báo. Điều người đọc cần biết là còn thiếu bao nhiêu —
    // một số, không một khái niệm.
    shell = shell.replace('<p class="note" id="m1note"></p>',
      `<p class="note" id="m1note">${canThem
        ? `Còn thiếu <b>${canThem}</b> nguồn nữa.`
        : "Đã đủ nguồn."}</p>`)

    // ── MOCK / REAL ──────────────────────────────────────────────────────
    /**
     * FR-027f · MAN NAP NGUON — dai noi MUC TU DONG HOA cua ba loi.
     *
     * Su that rieng cua man nay: ba loi KHONG ngang nhau ve muc tu dong, ma man
     * cu trinh bay chung nhu ba the giong nhau — nen nguoi moi khong biet nen
     * vao loi nao. Ba con so, moi con so mot nguon that:
     *   6 pass  — giao thuc source-distiller (02_proposal §S1)
     *   4 cong  — `gac()` cua 05_intake/gate.py chan truoc khi ghi
     *   9 cong  — danh so `# 1 —` .. `# 9 —` trong validate.py
     * Khong doc dong tu file (chung o Python, khong import duoc tu build TS)
     * nen `luong-nap-bai.test.js` se canh ba so nay khop nguon.
     */
    shell = chen(shell, "mbnap", daiMay([["lối nạp", 3], ["bước kiểm", 9]]))

    shell = chen(shell, "dmode", nutMode(laMock))
    shell = chen(shell, "mockbar", laMock
      ? '<div class="mockbar"><b>dữ liệu mẫu</b> — 13 bản ghi từ contract v3, ' +
        'không phải kho thật</div>'
      : "")

    // ── onclick cua prototype goi ham toan cuc ⇒ doi sang data-* ─────────
    shell = shell.replace(/onclick="nav\('(\w+)'\)"/g, 'data-nav="$1"')
      .replace(/onclick="open_\((\d+)\)"/g, 'data-open="$1"')
      .replace(/\sonclick="[^"]*"/g, "")

    /**
     * FR-027f · CAT BINH LUAN CSS o luc gop.
     *
     * Do that: 58 KB trong 160 KB `gn.css` la BINH LUAN — 36% bundle. Chung viet
     * cho nguoi doc repo, khong cho trinh duyet; nguon giu nguyen tung chu.
     * Cung phep da dung cho shell HTML (bo CRLF + thut dau dong, duoc 4 KB).
     *
     * Vi sao KHONG minify that (bo khoang trang, gop selector): mot buoc bien
     * dich thi phai co source map, khong thi debug CSS thanh doan mo. Cat binh
     * luan la phep BO, khong phai phep DOI — moi dong con lai y nguyen, nen
     * so dong trong DevTools van tro dung cho.
     *
     * Mau `[^*]*\*+(?:[^\/*][^*]*\*+)*` la mau chuan cho binh luan CSS. Khong
     * dung `[\s\S]*?` vi khung `/* ═══ ... ═══ *\/` cua file nay co nhieu `*`
     * lien tiep — mau lazy van dung nhung mau chuan an toan hon khi cau truc
     * long nhau.
     */
    const catBinhLuan = (s: string) =>
      s.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, "")
        .replace(/^[ \t]+$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
    const css = catBinhLuan([
      readFileSync(join(GOC, "..", "05_uiux", "tokens.css"), "utf8"),
      readFileSync(join(GOC, "styles", "prototype.css"), "utf8"),
    ].join("\n"))

    // Moi script boc IIFE rieng: ca hai khai khoiDong/gan/khiNav, noi thang
    // thi trung ten => SyntaxError => KHONG dong nao chay.
    const js = [
      join(GOC, "plugins", "backdrop", "src", "backdrop.inline.js"),
      // FR-027e · chuyen dong Trang chu (hai vong tu chuyen + khoi 3D + dem so).
      // Dat SAU backdrop vi ca hai dung `addCleanup` cua multiwindow, va truoc
      // multiwindow thi ham do chua ton tai.
      join(GOC, "plugins", "home-motion", "src", "home-motion.inline.js"),
      join(GOC, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.js"),
    ].filter((f) => existsSync(f))
      .map((f) => ["(function(){", readFileSync(f, "utf8"), "})();"].join("\n"))
      .join("\n")

    /**
     * CSS va JS ra FILE RIENG, khong nhung vao trang.
     *
     * Do that: CSS 46KB + JS 17KB = 63KB HANG SO lap o MOI trang. Voi 4 man
     * (real) + 4 man (mock) = 8 trang, do la 504KB lap lai — va trinh duyet
     * khong cache duoc vi chung nam trong HTML.
     *
     * Tach ra: tai mot lan, cache cho moi trang sau. Trang HTML con lai chi
     * la noi dung that.
     */
    /**
     * Dau phien ban theo NOI DUNG.
     *
     * Tach CSS/JS ra file de trinh duyet cache — nhung cache khong co dau
     * phien ban thi thanh cache HONG: sua giao dien, build lai, mo trang van
     * thay ban cu. Nguoi dung tuong "sua chua thay khac".
     *
     * Bam theo NOI DUNG chu khong theo thoi gian build: noi dung khong doi thi
     * dau khong doi ⇒ van cache duoc; doi mot ky tu la trinh duyet tai lai.
     */
    const dau = (s: string) => {
      let h = 5381
      for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
      return h.toString(36)
    }
    const vCss = dau(css)
    const vJs = dau(js)

    /**
     * Cat THUT DAU DONG luc phat. Do that: -3712 byte tren mock/index.html.
     *
     * Vi sao can: tran page-weight la 48 KB, trang do dang 48.03 — du CON LAI
     * am 35 byte. Thut de doc MA NGUON shell.html, con trinh duyet khong doc no.
     * Cat luc phat thi nguoi sua file van thay bo cuc, trang van nhe.
     *
     * CHI cat thut (khoang trang NGAY SAU `\n`), KHONG gop khoang trang giua
     * the: `<b>a</b> <b>b</b>` mat dau cach la hai chu dinh nhau.
     *
     * BAO VE <pre> va <textarea> — trong do khoang trang LA NOI DUNG. Hai the
     * nay hien rong trong shell, nhung `.f-kq` duoc bom nguyen van THIEU/SAI/SUA
     * luc chay (FR-010) nen bao ve la dung, khong phai phong xa.
     */
    const catThut = (h: string) => {
      const phan = h.split(/(<(?:pre|textarea)\b[\s\S]*?<\/(?:pre|textarea)>)/g)
      return phan.map((x, i) => (i % 2 ? x : x.replace(/\n[ \t]+/g, "\n"))).join("")
    }

    const trang = (tieuDe: string, than: string, sau = "") => catThut(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tieuDe)} · Grown news</title>
<link rel="stylesheet" href="${sau}gn.css?v=${vCss}">
</head><body>
${than}
<script src="${sau}gn.js?v=${vJs}"></script>
</body></html>
`)


    /** Doi view nao mang class "on" + tab nao dang bat */
    const doiView = (v: string) => shell
      .replace(/<div class="view on"/g, '<div class="view"')
      .replace(`<div class="view" id="v-${v}"`, `<div class="view on" id="v-${v}"`)
      .replace(/<button class="tb on"/g, '<button class="tb"')
      .replace(`<button class="tb" data-nav="${v}"`,
               `<button class="tb on" aria-current="true" data-nav="${v}"`)
      .replace('<span class="tcount" id="tcount"></span>',
               `<span class="tcount" id="tcount">${appr.length} bài · ${tatCa.length} bản ghi</span>`)
      // Logo ve dung goc cua ban dang xem — o /mock/ thi ve /mock/, khong nhay
      // sang ban real (nguoi dung se tuong du lieu bien mat).
      .replace('<a href="/">', `<a href="${laMock ? "/mock/" : "/"}">`)

    /**
     * Man Nap nguon CHI di theo trang /nap/, khong di theo moi trang.
     *
     * Do that: khoi v-nap la 12.5KB tren 21.9KB cua shell — 57%, ma phan lon
     * la form viet bai (6.5KB) chi dung duoc khi API local dang chay. Nhan no
     * o ca 8 trang la nhan mot man khong ai mo tren 7 trang khong dung toi.
     *
     * Doi lai: bam "Nap nguon" tu trang khac se TAI LAI TRANG that (JS tu roi
     * ve location.href khi khong thay #v-nap). Cua so doc dang mo se dong —
     * chap nhan duoc, vi day la man de VIET, khong phai de doc song song.
     */
    /**
     * FR-027h · cat DUNG khoi `v-nap`, khong cat toi `</main>`.
     *
     * Ban cu: `html.slice(0, dau) + html.slice(indexOf("</main>"))`. No cat MOI
     * THU tu `v-nap` den `</main>` — ke ca `</div>` dong `.mid`. Ket qua: bon
     * trang khong-phai-nap co `.mid` KHONG BAO GIO DONG. Trinh duyet tu dong no
     * o `</main>` nen mat thay giong nhau, nhung HTML sai va rat de vo khi sau
     * nay co the gi nam giua.
     *
     * Truoc do loi nay bi che: mot `</div>` LAC dong `.mid` som (ngay truoc
     * v-nap), nen `slice` toi `</main>` khong cat mat gi. Sua cai lac ra thi
     * cai nay lo. Hai loi cung mot goc.
     *
     * Gio tim DUNG the dong cua chinh `v-nap` bang cach dem do sau `<div>`.
     * Dem the la cach duy nhat dung: `indexOf('</div>')` se lay the dong cua
     * phan tu CON dau tien.
     */
    const catNap = (html: string) => {
      const mo = '<div class="view" id="v-nap">'
      const dau = html.indexOf(mo)
      if (dau < 0) return html
      let sau = 0
      const re = /<(\/?)div\b[^>]*>/g
      re.lastIndex = dau
      for (let m = re.exec(html); m; m = re.exec(html)) {
        sau += m[1] ? -1 : 1
        if (sau === 0) return html.slice(0, dau) + html.slice(m.index + m[0].length)
      }
      return html   // khong tim duoc the dong ⇒ tra nguyen, tha nang hon tha vo
    }

    // FR-027g · `cho-duyet/index.html` KHONG con trong danh sach nay — man Cho
    // duyet da gop vao Kho. Duong `/cho-duyet/` van ton tai, nhung la mot TRANG
    // CHUYEN HUONG sinh rieng ben duoi, khong phai mot man.
    const MAN = [
      ["index.html", "home", "Trang chủ"],
      ["tat-ca/index.html", "all", "Tất cả"],
      ["kho/index.html", "kho", "Kho"],
      // v-concepts truoc day la view DUY NHAT khong co URL rieng — chi doi duoc
      // bang JS trong SPA, nen khong bookmark/chia se duoc.
      // Slug GIU "khai-niem" — doi ton 4 test do va pha URL da co. Chi doi
      // TIEU DE hien thi ("Danh mục"), vi man nay gio quan ly ca hai danh muc.
      ["khai-niem/index.html", "concepts", "Danh mục"],
      ["nap/index.html", "nap", "Nạp nguồn"],
    ] as const

    const ra: FilePath[] = []
    const goc = laMock ? join(ctx.argv.output, "mock") : ctx.argv.output

    // Ghi CSS/JS mot lan cho ca ban — moi trang tro toi day.
    for (const [ten, noi] of [["gn.css", css], ["gn.js", js]] as const) {
      const d = join(goc, ten)
      await mkdir(dirname(d), { recursive: true })
      await writeFile(d, noi, "utf8")
      ra.push(d as FilePath)
    }

    // Chi muc mo cua so — MOI BAN mot file rieng.
    //
    // plugin merge-by-source cung phat static/merged-index.json, nhung chi MOT
    // file o goc va chi chua ban approved (no doc `content` da bi Quartz loc).
    // Ban /mock/ khong co file do ⇒ JS lay ban goc ⇒ chi so tro vao kho khac,
    // va bam the o /mock/ mo sai bai hoac khong mo gi.
    //
    // File nay gom MOI trang thai: man Tat ca va Cho duyet la man QUAN LY, doc
    // noi dung ban draft chinh la viec nguoi duyet can lam.
    {
      const d = join(goc, "static", "open-index.json")
      await mkdir(dirname(d), { recursive: true })
      await writeFile(d, JSON.stringify({
        $comment: "Sinh boi home-pages. Chi muc mo cua so doc — gom moi review_status. " +
          "Khac static/merged-index.json (merge-by-source) o cho: file nay theo TUNG BAN " +
          "real/mock va khong loc theo trang thai.",
        total: chiMuc.length,
        articles: chiMuc,
      }, null, 2), "utf8")
      ra.push(d as FilePath)
    }

    for (const [ten, view, tieuDe] of MAN) {
      const duong = join(goc, ten)
      await mkdir(dirname(duong), { recursive: true })
      // Trang o thu muc con can lui mot cap de toi gn.css
      const sau = ten.includes("/") ? "../" : ""
      const than = view === "nap" ? doiView(view) : catNap(doiView(view))
      await writeFile(duong, trang(tieuDe, than, sau), "utf8")
      ra.push(duong as FilePath)
    }

    /**
     * FR-027g · `/cho-duyet/` — TRANG CHUYEN HUONG, khong phai mot man.
     *
     * Man Cho duyet da gop vao Kho. Duong cu van song de bookmark khong gay.
     *
     * Vi sao CA `meta refresh` LAN mot link that: refresh co the bi chan (mot so
     * trinh duyet chan khi nguoi dung dat vay, va trinh doc man hinh doc trang
     * truoc khi no kip nhay). Chi mot trong hai la co mot duong cut.
     *
     * KHONG dung `<script>location.replace(...)`: trang nay khong nap `gn.js`,
     * va mot the script rieng le se lam `no-dangerous-html` phai xet them mot
     * ngoai le. `meta refresh` la HTML thuan, khong can ngoai le nao.
     *
     * Duong dan theo BAN dang sinh: `/mock/cho-duyet/` phai ve `/mock/kho/`,
     * khong duoc nhay sang ban real — nguoi dung se tuong du lieu bien mat.
     * Dung duong TUONG DOI (`../kho/`) nen no dung cho ca hai ban.
     */
    {
      const d = join(goc, "cho-duyet", "index.html")
      await mkdir(dirname(d), { recursive: true })
      await writeFile(d, `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=../kho/">
<link rel="canonical" href="../kho/">
<title>Đường này đã chuyển vào Kho · Grown news</title>
</head><body>
<p>Không còn bước duyệt — bài bạn tạo lên site ngay.
Mọi thống kê về kho nằm ở <a href="../kho/">Kho</a>.</p>
</body></html>
`, "utf8")
      ra.push(d as FilePath)
    }

    /**
     * MAN TAT CA — PHAN TRANG.
     *
     * Do that tren ban 13 ban ghi: moi the ~2379 byte HTML. Khong phan trang thi
     * 200 ban ghi => 520KB, 500 ban ghi => 1.2MB. Trang khong dung duoc, va
     * nguoi doc phai cuon qua hang tram the de tim mot bai.
     *
     * 24 the/trang ~57KB — cuon 2-3 man hinh, vua mot lan doc.
     */
    const soTrang = Math.max(1, Math.ceil(tatCa.length / NGUONG.moiTrang))
    for (let tr = 1; tr <= soTrang; tr++) {
      const lat = tatCa.slice((tr - 1) * NGUONG.moiTrang, tr * NGUONG.moiTrang)
      const duongTr = tr === 1
        ? join(goc, "tat-ca", "index.html")
        : join(goc, "tat-ca", String(tr), "index.html")
      const sau = tr === 1 ? "../" : "../../"

      const nav = soTrang > 1 ? `<nav class="pgn" aria-label="Phân trang">
        ${tr > 1 ? `<a href="${tr === 2 ? "../" : `../${tr - 1}/`}">‹ trước</a>` : '<span>‹ trước</span>'}
        <span class="pgi">trang <b>${tr}</b> / ${soTrang} · ${tatCa.length} bản ghi</span>
        ${tr < soTrang ? `<a href="${tr === 1 ? `${tr + 1}/` : `../${tr + 1}/`}">tiếp ›</a>` : '<span>tiếp ›</span>'}
      </nav>` : ""

      // catNap y het vong MAN o tren: trang phan trang cung KHONG mang man Nap
      // nguon. Bo sot day thi /tat-ca/ (trang 1) van nang 12.5KB thua — va do
      // dung la thu test bat duoc: hai cho sinh cung mot trang, sua mot cho.
      const than = catNap(doiView("all"))
        .replace(/(<div class="grid" id="grid2">)[\s\S]*?(<\/div>)/,
          (_m, mo, dong) => mo + (lat.length
            ? lat.map((b) => the(b, iCua(b))).join("")
            : '<p class="empty">Kho trống.</p>') + dong + nav)

      await mkdir(dirname(duongTr), { recursive: true })
      await writeFile(duongTr, trang(`Tất cả${tr > 1 ? ` · trang ${tr}` : ""}`, than, sau), "utf8")
      ra.push(duongTr as FilePath)
    }

    // Template cho loi nap 02 — phat NGUYEN VAN file da co trong core/skill-src.
    // Khong chep noi dung vao day: mot ban sao thu hai se lech khoi schema ngay
    // lan dau schema doi, va khong ai biet ban nao dung.
    // Chi phat mot lan (ban real): file giong nhau ca hai che do.
    const mau = join(GOC, "..", "core", "skill-src", "mau-dat-chuan.md")
    if (!laMock && existsSync(mau)) {
      const dichMau = join(ctx.argv.output, "mau-nap-nguon.md")
      await writeFile(dichMau, readFileSync(mau, "utf8"), "utf8")
      ra.push(dichMau as FilePath)
    }
    return ra
  }
}

export const manifest = {
  name: "home-pages",
  displayName: "Năm màn từ shell prototype",
  description: "Bê nguyên body app-v20.html, chèn dữ liệu vào mốc rỗng có id",
  version: "2.0.0",
  category: "emitter" as const,
}

export default HomePages
