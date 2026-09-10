#!/usr/bin/env node
/**
 * FR-034/C5 · HARNESS RENDER — nguồn chuỗi HTML cho các test giao diện.
 *
 * Trước C5, ~20 file test lấy HTML bằng cách CHẠY BUILD Quartz rồi đọc file
 * trong `web/site` / `web/test/_site*`. FR-034 bỏ đường build: trang render
 * lúc request từ `web/render/`. Harness này gọi THẲNG `renderTrang` — test
 * giữ nguyên assertion, chỉ đổi nguồn chuỗi.
 *
 * Hai bản dữ liệu, y như server:
 *   mock — `duLieuMock()` đọc kb-mock/ (13 bản ghi contract, không đụng DB)
 *   real — `duLieuReal()` SELECT từ kb/_kho.sqlite của một KHO TẠM do
 *          `dungKho()` dựng (_api.mjs) — KHÔNG BAO GIỜ đọc kb/ thật.
 *
 * VÌ SAO import ĐỘNG: `web/api/dungchung.mjs` đọc `KB_DIR` LÚC IMPORT
 * (`export const KB = process.env.KB_DIR ?? join(GOC, "kb")`). Import tĩnh ở
 * đầu file là chốt đường về kb/ thật TRƯỚC khi kịp trỏ kho tạm — nên kho tạm
 * phải dựng xong, env phải đặt xong, RỒI mới `import()`.
 *
 * VÌ SAO luôn dựng kho tạm (kể cả test chỉ cần mock): module ESM cache theo
 * URL. Nếu lượt gọi mock đi trước mà không đặt KB_DIR thì dungchung đã chốt
 * kb/ thật, và lượt real theo sau trong CÙNG file test sẽ lặng lẽ đọc kho
 * thật — đúng lớp bẫy "hai nguồn chân lý" FR-034 đi dẹp.
 */
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { GOC, dungKho } from "./_api.mjs"

let _mod = null
let _khoTam = null

/** Nạp bộ module render (một lần cho cả file test). Trả về mọi export gộp. */
export async function napRender() {
  if (_mod) return _mod
  _khoTam = dungKho("gn-render")
  process.env.KB_DIR = _khoTam.kho
  process.env.RECYCLE_DIR = _khoTam.rac
  // Dọn kho tạm khi process kết thúc — test không phải nhớ gọi don().
  process.once("exit", () => { try { _khoTam?.don() } catch { /* OS dọn */ } })
  const [t, d, a] = await Promise.all([
    import("../render/trang.mjs"),
    import("../render/data.mjs"),
    import("../render/assets.mjs"),
  ])
  _mod = { ...t, ...d, ...a }
  return _mod
}

/** Đường tới kho tạm bản real — cho test cần đếm file .md làm đối chứng. */
export function khoTam() { return _khoTam }

/**
 * HTML MỘT MÀN — thay cho `readFileSync(join(SITE, ...))`.
 *   view   ∈ trang-chu · tat-ca · tat-ca-trang-n · kho · khai-niem · nap · cho-duyet
 *   mock   true (mặc định) = kb-mock; false = kho tạm qua DB
 *   thamSo số trang cho `tat-ca-trang-n`
 *   data   truyền thẳng một data dựng tay (bỏ qua mock/real) — cho test
 *          cần kho 120 bản (page-weight) hay data từ contract (expected-render)
 */
export async function trangHtml(view, { mock = true, thamSo, data } = {}) {
  const m = await napRender()
  return m.renderTrang(view, data ?? (mock ? m.duLieuMock() : m.duLieuReal()), thamSo)
}

/**
 * MAP đủ các trang cả hai bản — key giữ ĐÚNG đường file của bản build cũ
 * ("index.html", "mock/kho/index.html", …) để test quét-mọi-trang giữ được
 * tên trang trong log lỗi.
 */
export async function tatCaTrang() {
  const m = await napRender()
  const ra = new Map()
  /*
   * BẢNG THỨ TƯ — dẫn xuất từ `core/assets/man-hinh.json` (FR-038/C5-C6a).
   *
   * Gõ tay ở đây là chỗ trôi nguy hiểm nhất trong bốn: quên một màn thì màn đó
   * VÔ HÌNH với 7 test quét-mọi-trang, và chúng vẫn xanh. Vừa xảy ra ngược lại
   * — bảng còn `"nap"` sau khi màn đó bị bỏ, và `renderTrang` ném.
   */
  const VIEWS = JSON.parse(readFileSync(
    join(GOC, "core", "assets", "man-hinh.json"), "utf8"))
    .man.map((m) => [m.ten, m.path.slice(1)])   // bỏ "/" đầu, không regex
  for (const [goc, data] of [["", m.duLieuReal()], ["mock/", m.duLieuMock()]]) {
    for (const [v, duong] of VIEWS) ra.set(`${goc}${duong}index.html`, m.renderTrang(v, data))
    ra.set(`${goc}cho-duyet/index.html`, m.renderTrang("cho-duyet", data))
  }
  return ra
}

/**
 * NGUỒN của MỌI mã FE — `multiwindow` + MỌI chunk theo màn.
 *
 * Từ `T03-102`/`T03-104`, mã FE nằm ở NHIỀU file: bundle chung và các chunk
 * chỉ tải trên màn của chúng. Một cổng hỏi *"FE có làm X không"* mà đọc riêng
 * `multiwindow.inline.ts` là đọc MỘT PHẦN rồi kết luận về TOÀN THỂ — và nó sẽ
 * ĐỎ mỗi lần một khối dời sang chunk dù hành vi không đổi. Đã trúng bốn cổng
 * cùng lúc khi `T03-104` dời `ghiVideo`/`ganNapVideo`.
 *
 * DẪN XUẤT TỪ THƯ MỤC, không gõ danh sách: thêm một chunk sau này thì không
 * phải sửa cổng nào — và một danh sách gõ tay là chỗ nó lạc hậu im lặng.
 *
 * @param duoi ".ts" (nguồn, giữ chú thích) hay ".js" (đã biên dịch)
 */
export function maFeNguon(duoi = ".ts") {
  const goc = join(GOC, "web", "plugins")
  const ra = []
  for (const d of readdirSync(goc)) {
    for (const p of [
      join(goc, d, "src", `${d}.inline${duoi}`),
      join(goc, d, "src", "scripts", `${d}.inline${duoi}`),
    ]) {
      try { ra.push(readFileSync(p, "utf8")) } catch { /* plugin không có script */ }
    }
  }
  return ra.join(String.fromCharCode(10))
}

/** Asset tĩnh — thay cho đọc gn.css / gn.js / open-index.json từ site. */
export async function taiSan() {
  const m = await napRender()
  return {
    gnCss: m.gnCss(),
    gnJs: m.gnJs(),
    // Bản CHƯA NÉN — cho cổng SOI MÃ (`WO-057`). Bốn cổng cắt một hàm ra
    // khỏi bundle rồi CHẠY nó, và một cổng đo *bundle nhỏ hơn nguồn*; chúng
    // coi mã đã dịch là VẬT ĐỌC ĐƯỢC, nên chúng phải nhận bản chưa nén.
    // `gnJs` vẫn là thứ trình duyệt tải và `page-weight` đo.
    gnJsNguon: m.gnJsNguon ? m.gnJsNguon() : m.gnJs(),
    // T03-102 · chunk theo màn. `gnChunk(ten)` trả `null` cho màn không có
    // chunk, nên cổng phân biệt được "màn này không nạp chunk" với "chunk rỗng".
    gnChunk: m.gnChunk,
    tenChunk: m.tenChunk(),
    chunkTheoYeuCau: m.chunkTheoYeuCau ?? [],
    /*
     * MỌI mã FE được ship = bundle chung + MỌI chunk.
     *
     * Từ khi `T03-102` tách chunk theo màn, một cổng hỏi *"FE có làm X không"*
     * mà chỉ đọc `gnJs` là đọc MỘT PHẦN rồi kết luận về TOÀN THỂ — và nó sẽ ĐỎ
     * mỗi lần một khối dời sang chunk dù hành vi không đổi. Đã trúng thật:
     * `nap-video.test.js` đỏ ngay khi `T03-104` dời `ghiVideo`/`ganNapVideo`.
     */
    jsMoi: [m.gnJs(), ...m.tenChunk().map((k) => m.gnChunk(k) ?? "")].join("\n"),
    openIndexMock: m.openIndexJson(m.duLieuMock()),
    openIndexReal: m.openIndexJson(m.duLieuReal()),
    anhNen: m.anhNen(),
  }
}
