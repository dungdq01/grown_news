#!/usr/bin/env node
/**
 * WO-016 — BỐN chiều nhãn, không phải hai.
 *
 * Người dùng: *"Phân biệt rõ PHÂN LOẠI / Loại nguồn / CHỦ ĐỀ (category) và
 * KHÁI NIỆM (concept)"*. `/tat-ca/` phải hiện cả bốn; ba màn loại hiện ba
 * (không có phân loại — trong màn Video nó là đúng một dòng).
 *
 * ═══ VÌ SAO CỔNG NÀY PHẢI GIEO DỮ LIỆU CÓ `category` ═══════════════════════
 *
 * `bangLoc()` đã phát `nhom("chủ đề", "cat", …)` từ trước, và `nhom()` trả chuỗi
 * RỖNG khi không có mục nào. Đo được: kho thật `category: []`, kho mock KHÔNG
 * khai trường này, và hai bảng nhãn có **0 hàng**. Nên một cổng gieo dữ liệu
 * thiếu `category` sẽ đỏ ở §2 vì DỮ LIỆU rỗng, không vì mã sai — rồi tôi sẽ đi
 * sửa `bangLoc` cho một bug không có ở đó. Đúng lớp lỗi đã trúng bốn lần
 * (`route-theo-module` §2 · `dinh-dang-mo` §4 · ca host của `check_fix_url` ·
 * `man-nap-rieng` §2).
 *
 * Nên: mọi bản ghi gieo ở đây MANG `category`, và §0 tự kiểm điều đó trước khi
 * tin bất cứ kết luận nào bên dưới.
 *
 * ═══ VÀ PHẢI CẮT THEO TỪNG `v-*` ══════════════════════════════════════════
 *
 * Mọi màn nằm trong CÙNG một tài liệu (shell mang cả mười màn). Một phép grep
 * trên cả HTML in ra cùng một danh sách cho năm màn khác nhau — chính phép đo
 * hiện trạng đầu tiên của WO-016 đã dính, và nó "xanh" cho cả năm.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CAT_FX, CPT_FX, GOC, taoKiem } from "./_api.mjs"
import { napRender, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
await napRender()

const BANG_MAN = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
const MAN_LOAI = BANG_MAN.filter((m) => m.menu && m.module)

/** Cắt một view khỏi tài liệu — mốc là view KẾ TIẾP, không phải `</main>`. */
function vungMan(html, idShell) {
  const mo = `id="v-${idShell}"`
  const i = html.indexOf(mo)
  if (i < 0) return ""
  const sau = html.slice(i + mo.length)
  const j = sau.search(/id="v-[a-z]+"/)
  return j < 0 ? sau.slice(0, sau.indexOf("</main>")) : sau.slice(0, j)
}

/** Các tầng facet có mục THẬT trong một vùng (tầng rỗng không được tính). */
function tangCua(vung) {
  const dem = {}
  for (const m of vung.matchAll(/data-loc="([a-z]+)"/g)) {
    if (m[1] === "reset") continue
    dem[m[1]] = (dem[m[1]] ?? 0) + 1
  }
  return dem
}

/* ── dữ liệu gieo: BỐN chiều đều có giá trị, và ba module đều có mặt ───────── */
const CAT = CAT_FX.map(([id]) => id)
const CPT = CPT_FX.map(([id]) => id)
const ban = (slug, type, them = {}) => ({
  slug, id: `src_${slug.replace(/-/g, "")}`, title: `Bản ${slug}`,
  source_type: type, review_status: "approved", origin: "manual",
  analyzed_at: "2026-08-20", one_liner: `Bản thử ${slug}`,
  credibility_max: "verified", priority: 3,
  concepts: [CPT[0]], concepts_proposed: [],
  category: [CAT[0]], url_normalized: `example.com/${slug}`,
  ho_so: null, media: null, than: "## Mục\n\nNội dung.",
  ...them,
})

const BANS = [
  ban("a-article", "article"),
  ban("a-paper", "paper", { category: [CAT[1]], concepts: [CPT[1]] }),
  ban("a-repo", "repo", { category: [CAT[2]] }),
  ban("t-pdf", "tai-lieu", {
    ho_so: "thu-vien", category: [CAT[1]], concepts: [CPT[2]],
    media: [{ sha256: "a".repeat(64), mime: "application/pdf",
             ten_goc: "bia.pdf", so_byte: 1024 }],
  }),
  ban("t-docx", "tai-lieu", {
    ho_so: "thu-vien", category: [CAT[2]],
    media: [{ sha256: "b".repeat(64), ten_goc: "ke-hoach.docx", so_byte: 2048,
             mime: "application/vnd.openxmlformats-officedocument"
               + ".wordprocessingml.document" }],
  }),
  ban("v-yt", "video", {
    ho_so: "thu-vien", category: [CAT[0]], concepts: [CPT[3]],
    url_normalized: "youtube.com/watch?v=abcdefghij1",
  }),
  ban("v-tt", "video", {
    ho_so: "thu-vien", category: [CAT[1]],
    url_normalized: "tiktok.com/@ai/video/7300000000000000001",
  }),
]
const DU_LIEU = {
  bans: BANS, mock: true, hong: [],
  concepts: CPT_FX.map(([id, nhan, al]) => ({ id, label_vi: nhan, aliases: al })),
  categories: CAT_FX.map(([id, nhan, gom]) => ({ id, label_vi: nhan, gom })),
}

console.log("\n0 · TỰ KIỂM vật liệu — trước khi tin bất cứ kết luận nào\n")

// Một cổng không kiểm vật liệu của nó là một cổng chưa biết mình đo cái gì.
ok(BANS.every((b) => b.category?.length),
  `cả ${BANS.length} bản gieo đều có \`category\``,
  "thiếu ⇒ tầng `cat` rỗng vì DỮ LIỆU, và tôi sẽ đi sửa mã không có bug")
ok(new Set(BANS.map((b) => b.category[0])).size >= 3,
  "≥3 chủ đề khác nhau", "một chủ đề duy nhất ⇒ không phân biệt được lọc thật")
for (const m of MAN_LOAI) {
  const co = BANS.filter((b) => b.source_type === m.id_shell.replace(/^/, "")
    || (m.ten === "bai-viet" && ["article", "paper", "repo", "announcement", "docs"]
      .includes(b.source_type))
    || b.source_type === m.ten).length
  ok(co > 0, `module \`${m.ten}\` có ${co} bản gieo`,
    "0 bản ⇒ mọi facet của màn đó rỗng và mọi phép kiểm dưới xanh vô căn cứ")
}

console.log("\n1 · `/tat-ca/` phải có ĐỦ BỐN tầng\n")

const hAll = await trangHtml("tat-ca", { data: DU_LIEU })
const tAll = tangCua(vungMan(hAll, "all"))
for (const [tang, nhan] of [["pl", "phân loại"], ["nguon", "loại nguồn"],
                            ["cat", "chủ đề"], ["cpt", "khái niệm"]]) {
  ok((tAll[tang] ?? 0) > 0, `\`/tat-ca/\` có tầng ${nhan} (\`${tang}\`)`,
    `đo trong vùng \`v-all\`, thấy: ${JSON.stringify(tAll)} — `
    + "`bangLoc` dùng if/else nên màn trộn chỉ nhận `pl` HOẶC `nguon`")
}

console.log("\n2 · Ba màn loại: nguồn · chủ đề · khái niệm — KHÔNG có phân loại\n")

for (const m of MAN_LOAI) {
  const h = await trangHtml(m.ten, { data: DU_LIEU })
  const t = tangCua(vungMan(h, m.id_shell))
  for (const [tang, nhan] of [["nguon", "loại nguồn"], ["cat", "chủ đề"],
                              ["cpt", "khái niệm"]]) {
    ok((t[tang] ?? 0) > 0, `\`/${m.ten}/\` có tầng ${nhan}`,
      `thấy: ${JSON.stringify(t)}`)
  }
  // CA ÂM · `pl` trong màn loại là đúng một dòng — vô nghĩa, và người dùng đã
  // chỉ đúng vào chuyện này ở WO-014.
  ok(!(t.pl > 0), `  \`/${m.ten}/\` KHÔNG có tầng phân loại`,
    "một facet 'phân loại' trong màn Video là đúng một dòng")
}

console.log("\n3 · Chủ đề của màn loại lấy từ BẢN GHI CỦA MODULE ĐÓ\n")

/*
 * CA ÂM quan trọng nhất của §2. Nếu `cat` dựng từ CẢ KHO thì mọi phép kiểm
 * có-mặt ở trên vẫn xanh, trong khi sidebar `/video/` liệt kê chủ đề của những
 * bài viết không có trong danh sách đang xem. Cùng bệnh WO-014 vừa chữa cho
 * `nguon`, và nó không lộ ra bằng phép đếm tầng.
 */
const catCuaMan = async (m) => {
  const h = await trangHtml(m.ten, { data: DU_LIEU })
  return [...vungMan(h, m.id_shell)
    .matchAll(/data-loc="cat" data-gt="([^"]+)"/g)].map((x) => x[1]).sort()
}
for (const m of MAN_LOAI) {
  const loai = m.ten === "bai-viet"
    ? ["article", "paper", "repo", "announcement", "docs"] : [m.ten]
  const cho = [...new Set(BANS.filter((b) => loai.includes(b.source_type))
    .flatMap((b) => b.category))].sort()
  const duoc = await catCuaMan(m)
  ok(JSON.stringify(duoc) === JSON.stringify(cho),
    `\`/${m.ten}/\` liệt kê đúng ${cho.length} chủ đề của module`,
    `được [${duoc}] · chờ [${cho}] — lấy từ cả kho thì facet nói về bản ghi `
    + "không nằm trong danh sách đang xem")
}

console.log("\n4 · Số trên mỗi mục chủ đề = số bản ghi THẬT mang chủ đề đó\n")

const soCua = (vung, tang) => Object.fromEntries(
  [...vung.matchAll(new RegExp(`data-loc="${tang}" data-gt="([^"]+)"[^>]*>`
    + "[\\s\\S]*?<b>(\\d+)</b>", "g"))].map((m) => [m[1], Number(m[2])]))
const soAll = soCua(vungMan(hAll, "all"), "cat")
for (const c of CAT) {
  const cho = BANS.filter((b) => b.category.includes(c)).length
  if (!cho) continue
  ok(soAll[c] === cho, `chủ đề \`${c}\`: nhãn ${soAll[c]} = thật ${cho}`,
    "số trên nhãn không do đếm bản ghi thì nó là một con số trang trí")
}

console.log("\n5 · Thẻ mang `data-cat` để FE lọc được\n")

const the = [...vungMan(hAll, "all").matchAll(/class="cd[^"]*"[\s\S]{0,400}?>/g)]
ok(the.length > 0, `tìm được ${the.length} thẻ trong \`v-all\``)
const coCat = [...vungMan(hAll, "all").matchAll(/data-cat="([^"]*)"/g)]
ok(coCat.length >= BANS.length,
  `≥${BANS.length} thẻ mang \`data-cat\` (thấy ${coCat.length})`,
  "không có `data-cat` thì bấm một chủ đề không lọc được gì — facet thành trang trí")
// `data-loai` GIỮ nghĩa `source_type`; chiều mới KHÔNG được chiếm chỗ nó.
const loai = [...vungMan(hAll, "all").matchAll(/data-loai="([^"]*)"/g)]
  .map((m) => m[1])
ok(loai.every((x) => BANS.some((b) => b.source_type === x)),
  "`data-loai` vẫn là `source_type`",
  `thấy [${[...new Set(loai)]}] — đổi nghĩa nó là phá 3 cổng vì lý do không liên quan`)

console.log("\n6 · FE biết tầng `cat`, và khai tầng ở MỘT nơi\n")

const fe = readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
  "scripts", "multiwindow.inline.ts"), "utf8")
const NL = String.fromCharCode(10)
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)
const maFe = chiMa(fe)
const mTang = maFe.match(/TANG\s*=\s*\[([^\]]*)\]/)
ok(!!mTang, "FE khai `TANG` một chỗ")
const tangFe = (mTang?.[1] ?? "").match(/["'`]([a-z]+)["'`]/g)?.map((x) =>
  x.slice(1, -1)) ?? []
for (const t of ["pl", "nguon", "cat", "cpt"]) {
  ok(tangFe.includes(t), `  \`TANG\` có \`${t}\``,
    `thấy [${tangFe}] — tầng SSR phát mà FE không biết thì bấm vào không lọc gì`)
}

console.log("\n7 · `/khai-niem/` có đủ BA component\n")

const hKn = await trangHtml("khai-niem", { data: DU_LIEU })
const vKn = vungMan(hKn, "concepts")
ok(vKn.length > 500, `vùng \`v-concepts\` ${vKn.length} byte`)
// So KHONG phan biet hoa thuong: yeu cau la "man co phan loai nguon", khong
// phai "chuoi viet chu thuong". Ban dau toi tim chu thuong trong khi tab viet
// `Loại nguồn` ⇒ do bao thieu mot phan da co.
const vKnLow = vKn.toLowerCase()

/*
 * ĐO COMPONENT, KHÔNG ĐO CHỮ. Bản đầu chỉ hỏi `vKn.includes("loại nguồn")` và
 * kiểm hai chiều tố ngay: tôi xoá `data-dmtab="nguon"` khỏi shell mà cổng vẫn
 * XANH — vì chuỗi đó còn nằm trong đoạn văn giải thích ngay dưới. Một phép kiểm
 * khớp văn xuôi kể VỀ component thì component biến mất nó vẫn xanh.
 *
 * Nên mỗi phần phải có đủ BA vật: nút tab · panel · mốc đổ danh sách.
 */
for (const [khoa, moc, ten] of [["cpt", "cchua", "khái niệm"],
                                ["cat", "catlist", "chủ đề"],
                                ["nguon", "nguonlist", "loại nguồn"]]) {
  ok(vKn.includes(`data-dmtab="${khoa}"`), `màn Danh mục có TAB ${ten}`,
    "người dùng: *liệt kê đủ các loại nguồn / chủ đề và khái niệm*")
  ok(vKn.includes(`data-dmview="${khoa}"`), `  có PANEL ${ten}`,
    "tab không có panel ⇒ bấm vào hiện một vùng trắng")
  ok(vKn.includes(`id="${moc}"`), `  có mốc đổ danh sách \`#${moc}\``,
    "không có mốc ⇒ panel rỗng vĩnh viễn, và SSR không báo gì")
  ok(vKnLow.includes(ten), `  có chữ "${ten}" cho người đọc`)
}
// Loại nguồn là enum của schema, KHÔNG phải nhãn người tạo (M02-R3) ⇒ phần đó
// không được có đường thêm/sửa. Một nút "thêm loại nguồn" là một lời hứa mà
// `CHECK` của DDL sẽ từ chối, và lời từ chối đó không ai đọc được.
const iLn = vKnLow.indexOf("loại nguồn")
const khoiLn = iLn < 0 ? "" : vKn.slice(iLn, iLn + 1200)
// XANH RỖNG: khối chưa tồn tại thì `khoiLn` là "" và "" không chứa gì xấu
// ⇒ phép kiểm này phải đòi khối CÓ MẶT trước đã.
ok(iLn >= 0 && !/data-(?:them|sua|xoa)nhan="nguon"/.test(khoiLn),
  "  nhung KHONG co duong them/xoa",
  "loại nguồn sinh ra `CHECK` của DDL — thêm ở UI là hứa thứ DB sẽ từ chối")

console.log("\n8 · Tab PHÂN LOẠI: loại nguồn nằm TRONG phân loại\n")

/*
 * Người dùng: *"loại nguồn nằm trong (tập hợp con của) phân loại"*.
 *
 * Panel đã lồng đúng từ trước (Bài viết → repo · paper · article · docs ·
 * announcement), nhưng TAB gọi là "Loại nguồn" — nhãn nói sai về thứ nó chứa,
 * và đặt cạnh Khái niệm/Chủ đề thì nó đọc như chiều thứ tư ngang cấp.
 *
 * Nên đo QUAN HỆ, không đo chuỗi: mỗi phân loại phải là một tiêu đề nhóm, và
 * mọi loại nguồn của nó phải nằm SAU tiêu đề đó, TRƯỚC tiêu đề kế tiếp.
 */
const BANG_LOAI = JSON.parse(readFileSync(
  join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module

const nutNguon = vKn.match(/<button[^>]*data-dmtab="nguon"[\s\S]*?<\/button>/)
ok(!!nutNguon, "tìm được nút tab của phân loại")
/*
 * TAB TEN **LOAI NGUON** — do la thu duoc QUAN LY, phan loai chi la NHOM CHA.
 *
 * Luot truoc toi doi tab thanh "Phan loai" va nguoi dung dinh chinh: *"thu
 * chung ta can la danh sach loai nguon, chu ko phai phan loai: loai nguon la
 * tap hop con cua phan loai, va ta can quan ly danh sach LOAI NGUON do"*.
 */
ok(/loại nguồn/i.test(nutNguon?.[0] ?? ""),
  "tab mang tên **loại nguồn** — thứ được quản lý",
  `nhãn: ${(nutNguon?.[0] ?? "").replace(/<[^>]*>/g, " ").trim().slice(0, 60)}`
  + " — panel liệt kê phân loại, mỗi phân loại chứa loại nguồn của nó")

// Mỗi phân loại là một tiêu đề nhóm, và loại nguồn của nó nằm TRONG nhóm.
const iNhom = BANG_LOAI.map((m) => [m.ten, m.nhan, vKn.indexOf(m.nhan)])
for (const [ten, nhan, i] of iNhom) {
  ok(i > 0, `phân loại \`${ten}\` có tiêu đề nhóm \`${nhan}\``,
    "thiếu tiêu đề ⇒ danh sách loại nguồn thành một dãy phẳng, và quan hệ "
    + "tập-con biến mất")
}
const sap = iNhom.filter(([, , i]) => i > 0).sort((a, b) => a[2] - b[2])
/*
 * TAP CHO: tai lieu ⇒ DINH DANG · video ⇒ NOI PHAT.
 *
 * Ban truoc doi `m.loai` cua `loai-nguon.json` — tuc ten BANG (`tai-lieu`,
 * `video`). Voi bai viet thi `source_type` CHINH LA loai nguon nen no dung
 * tinh co; hai module kia thi khong, va do la dieu nguoi dung chi vao.
 *
 * Lay tu `media-mime.json` — CUNG nguon voi `nguonCua()` dang chay cho facet.
 */
const MEDIA_B = JSON.parse(readFileSync(
  join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const CHO_NGUON = {
  "bai-viet": BANG_LOAI.find((m) => m.ten === "bai-viet")?.loai ?? [],
  // `chi_dan_xuat` LỌC: `.vtt` (FR-054) là hiện vật do MÁY sinh, không phải
  // loại nguồn người nạp. Nó không có chip ở bộ lọc, nên đòi nó có mặt là đòi
  // một thứ `trang.mjs` cố ý không render.
  //
  // `nhom_thu_vien: "video"` LỌC cùng lý do (T01-45): mp4 · webm · m4a · mp3 ·
  // wav là định dạng của bản ghi VIDEO. Đòi chúng có mặt dưới tiêu đề `tai-lieu`
  // là đòi đúng thứ cổng NÀY tồn tại để chặn — *"loại nguồn của module này hiện
  // dưới tiêu đề của module khác"*. Phép lọc phải KHỚP `trang.mjs#laTaiLieu`;
  // hai bản khác nhau thì một trong hai đỏ oan.
  "tai-lieu": MEDIA_B.loai
    // `chip_loc: false` (FR-064) — phép lọc phải KHỚP `trang.mjs#laTaiLieu`;
    // hai bản khác nhau thì một trong hai đỏ oan.
    .filter((l) => !l.chi_dan_xuat && l.nhom_thu_vien !== "video"
      && l.chip_loc !== false)
    .map((l) => l.ten)
    .concat([MEDIA_B.mac_dinh.ten]),
  video: MEDIA_B.video_host.map((h) => h.nhan),
}
for (const m of BANG_LOAI) {
  const i = vKn.indexOf(m.nhan)
  if (i < 0) continue
  const ke = sap.find(([, , j]) => j > i)
  const trong = vKn.slice(i, ke ? ke[2] : vKn.length)
  const cho = CHO_NGUON[m.ten] ?? []
  // MARKUP MỚI: tên loại nguồn nằm trong `<span class="ln-n">`, không `<b>`.
  // Thẻ `<b>` nay giữ SỐ ĐẾM — bắt `<b>${ten}</b>` là bắt một chỗ khác.
  const thieu = cho.filter((l) =>
    !trong.includes(`class="ln-n">${l}<`) && !trong.includes(`<b>${l}</b>`))
  ok(thieu.length === 0,
    `  ${cho.length} loại nguồn của \`${m.ten}\` nằm TRONG nhóm của nó`,
    `ngoài nhóm: ${thieu.join(" · ")} — loại nguồn của module này hiện dưới `
    + "tiêu đề của module khác")
}

// CHỈ ĐỌC vẫn phải giữ: loại nguồn sinh ra `CHECK` của DDL.
const iP = vKn.indexOf(BANG_LOAI[0].nhan)
/*
 * SUA thi DUOC, THEM/XOA thi KHONG.
 *
 * Ban dau phep kiem nay cam ca ba — toi viet no khi thiet ke con chi-doc. Nguoi
 * dung sau do noi ro: *"ta can QUAN LY danh sach LOAI NGUON do"*, va quan ly la
 * doi duoc CHU HIEN THI.
 *
 * Hai ve con lai giu nguyen va co ly do: them mot loai ma DDL khong biet la hua
 * thu `CHECK` se tu choi; xoa mot loai con ban ghi dung la lam facet mat mot
 * nhom.
 */
ok(iP > 0 && /data-suanhan="nguon:/.test(vKn.slice(iP)),
  "  phan loai nguon CO duong sua chu hien thi",
  "nguoi dung: *ta can QUAN LY danh sach loai nguon do*")
ok(iP > 0 && !/data-(?:them|xoa)nhan="nguon"/.test(vKn.slice(iP)),
  "  phần phân loại KHÔNG có đường thêm/sửa/xoá",
  "loại nguồn sinh ra `CHECK` của DDL — thêm ở UI là hứa thứ DB sẽ từ chối")

console.log("\n9 · Tab strip KHÔNG đếm tay số tab trong CSS\n")

/*
 * ĐO ĐƯỢC trên Chromium: `.dm-tabs` tính ra **3 cột** trong khi có 4 tab, nên
 * tab thứ tư rơi xuống dòng hai. Tôi sửa luật ở `prototype.css:1505` còn luật
 * THẮNG ở `:1748` — đúng cái bẫy mà chính file đó viết chú thích cảnh báo:
 * *"hai luật cùng selector thì phép kiểm dễ khớp vào luật ĐÃ BỊ ĐÈ"*.
 *
 * Nên bỏ hẳn con số: một `grid-template-columns:repeat(N,…)` là một con số
 * phải sửa mỗi lần thêm tab, và quên sửa thì strip vỡ IM LẶNG. Phép kiểm này
 * đòi không luật nào ghim số cột — nó đúng với 4 tab và với tab thứ năm.
 */
const { taiSan: taiSanCss } = await import("./_render.mjs")
const css = (await taiSanCss()).gnCss ?? ""
ok(css.length > 1000, `gn.css ${css.length} ky tu — co vat lieu de do`)
const cssMa2 = css.replace(/[/][*][^]*?[*][/]/g, " ")
const luatTab = [...cssMa2.matchAll(
  /([^{}@]*\.dm-tabs[^{}@]*)\{([^{}]*)\}/g)].map((m) =>
  ({ sel: m[1].trim(), than: m[2] }))
ok(luatTab.length >= 1, `tìm được ${luatTab.length} luật \`.dm-tabs\``)
const ghimSo = luatTab
  .filter((l) => /grid-template-columns\s*:\s*repeat\(\s*\d/.test(l.than))
  .map((l) => l.sel)
ok(ghimSo.length === 0,
  "không luật `.dm-tabs` nào ghim SỐ cột",
  `ghim ở: ${ghimSo.join(" · ")} — thêm tab thứ N+1 là strip vỡ im lặng, và `
  + "đó là đúng chuyện vừa xảy ra")
ok(luatTab.some((l) => /grid-auto-flow\s*:\s*column/.test(l.than)),
  "strip xếp tab bằng `grid-auto-flow: column`",
  "không có ⇒ số tab và CSS là hai con số phải khớp tay")
chot("bốn chiều ở Tổng hợp · loại nguồn nằm trong phân loại · strip không đếm tay")
