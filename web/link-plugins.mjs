#!/usr/bin/env node
/**
 * Nối plugin local vào .quartz/plugins/ bằng JUNCTION thay vì symlink.
 *
 * Vì sao cần: Quartz gọi fs.symlinkSync(target, link, "dir") cứng
 * (gitLoader.ts:476). Trên Windows, symlink kiểu "dir" đòi quyền quản trị hoặc
 * Developer Mode; junction thì không. Kiểm thật trên máy này:
 *
 *     junction     ĐƯỢC
 *     symlink dir  EPERM
 *
 * Junction thoả đúng ba điều kiện Quartz kiểm ở gitLoader.ts:442-448:
 *   lstatSync().isSymbolicLink()  → true
 *   realpathSync() khớp nguồn      → true
 *   đọc được file bên trong        → true
 * ⇒ Quartz thấy "đã link rồi" và bỏ qua bước symlink của nó.
 *
 * KHÔNG sửa mã Quartz: sửa thượng nguồn thì mỗi lần cập nhật phải vá lại, và
 * bản vá sẽ âm thầm biến mất.
 */
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, renameSync, rmSync, statSync, symlinkSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const WEB = dirname(fileURLToPath(import.meta.url))
const NGUON = join(WEB, "plugins")
const DICH = join(WEB, "_quartz", ".quartz", "plugins")

/**
 * Chốt kiểm TRƯỚC khi Quartz chạy: `web/site/` có đang bị khoá không?
 *
 * Quartz xoá sạch thư mục output trước mỗi lần build. Trên Windows, một tiến
 * trình lấy `web/site` LÀM THƯ MỤC LÀM VIỆC (điển hình: `npx http-server` gõ
 * ngay trong đó) sẽ khoá cả cây ⇒ Quartz chết với `EBUSY: rmdir` — thông báo
 * không nói ai giữ, cũng không nói phải làm gì.
 *
 * Phép thử là đổi tên rồi đổi lại: KHÔNG xoá gì, và nó thất bại đúng lúc
 * Quartz sẽ thất bại. Đổi được ⇒ trả về nguyên trạng, build chạy tiếp.
 *
 * Lưu ý: `npm run api` (server.mjs) KHÔNG khoá — nó đứng ở `web/`, chỉ mở file
 * theo từng request. Vừa duyệt bài trên web vừa `npm run build` là luồng bình
 * thường của FR-011.
 */
{
  const SITE = process.env.SITE ?? join(WEB, "site")
  if (existsSync(SITE)) {
    const thu = SITE + ".dang-kiem"
    try {
      renameSync(SITE, thu)
      renameSync(thu, SITE)
    } catch (e) {
      if (existsSync(thu)) { try { renameSync(thu, SITE) } catch { /* để nguyên */ } }
      console.error(`\nDỪNG: ${SITE} đang bị một tiến trình khác khoá (${e.code}).`)
      console.error("Quartz xoá thư mục output trước khi build, nên build sẽ chết vì EBUSY.\n")
      console.error("Tìm thủ phạm — tiến trình nào lấy thư mục đó làm chỗ đứng:")
      console.error("  powershell \"Get-CimInstance Win32_Process -Filter \\\"Name='node.exe'\\\" | Select ProcessId,CommandLine\"")
      console.error("  netstat -ano | findstr LISTENING")
      console.error("\nThường là một `npx http-server` mở trong chính web/site/.")
      console.error("Đóng nó rồi chạy lại. Muốn xem site thì dùng `npm run api`")
      console.error("(phục vụ web/site mà KHÔNG khoá, và có luôn API biên tập).\n")
      process.exit(1)
    }
  }
}

if (!existsSync(NGUON)) {
  console.log("không có web/plugins/ — bỏ qua")
  process.exit(0)
}

mkdirSync(DICH, { recursive: true })
let noi = 0, giu = 0

for (const ten of readdirSync(NGUON)) {
  const tu = resolve(NGUON, ten)
  const den = resolve(DICH, ten)

  // CHI noi thu muc. Junction khong dung duoc cho file: gap WORKLOG.md trong
  // plugins/ thi symlinkSync nem EPERM va script chet TRUOC buoc dich TS —
  // nen .js giu ban cu va moi sua .ts am tham khong co hieu luc.
  if (!statSync(tu).isDirectory()) continue

  if (existsSync(den)) {
    try {
      const st = lstatSync(den)
      if (st.isSymbolicLink() && realpathSync(den) === realpathSync(tu)) {
        console.log(`  giữ  ${ten}`)
        giu++
        continue
      }
    } catch { /* hỏng thì tạo lại */ }
    rmSync(den, { recursive: true, force: true })
  }

  symlinkSync(tu, den, "junction")
  console.log(`  nối  ${ten}  →  plugins/${ten}`)
  noi++
}

console.log(`\n${noi} nối mới, ${giu} giữ nguyên`)

// ── styles: chép tokens.css + custom.scss vào _quartz/quartz/styles/ ────────
// componentResources.ts:10 import CỨNG "../../styles/custom.scss" nên không trỏ
// ra ngoài được. Nguồn sống ở web/styles/ (trong git); _quartz/ là thượng nguồn
// KHÔNG thuộc git — chép vào chứ không sửa trực tiếp, để `git clone` lại Quartz
// không mất gì và cập nhật thượng nguồn không đè mất CSS của ta.
const STYLES = join(WEB, "_quartz", "quartz", "styles")
if (existsSync(STYLES)) {
  copyFileSync(join(WEB, "..", "05_uiux", "tokens.css"), join(STYLES, "tokens.css"))
  copyFileSync(join(WEB, "styles", "custom.scss"), join(STYLES, "custom.scss"))
  copyFileSync(join(WEB, "styles", "prototype.css"), join(STYLES, "prototype.css"))
  console.log("  chép tokens.css + custom.scss + prototype.css  →  _quartz/quartz/styles/")
}

// ── bien dich MOI *.inline.ts -> .js ──────────────────────────────────────
// afterDOMLoaded nhan CHUOI JS; Quartz dua thang cho esbuild o che do JS nen
// no KHONG strip cu phap TypeScript ("Expected ; but found Bo" o dong
// `type Bo = {`). Plugin cong dong khong gap vi chung build sang dist/*.js
// truoc; plugin LOCAL nap thang tu nguon => tu bien dich o buoc chuan bi nay.
//
// QUET thay vi hardcode ten file: luot dau toi chi dich multiwindow.inline.ts,
// nen them plugin backdrop la chet ngay. Loi nay se lap voi moi plugin sau.
// Quet DE QUY: backdrop dat script o src/, multiwindow o src/scripts/.
// Luot dau toi viet hai vong lap voi `continue` o giua — nhanh src/ khong bao
// gio chay khi plugin khong co src/scripts/. Quet de quy khong co cho de sot.
const tsFiles = []
const quetTs = (d) => {
  if (!existsSync(d)) return
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) quetTs(p)
    else if (f.endsWith(".inline.ts")) tsFiles.push(p)
  }
}
quetTs(NGUON)

if (tsFiles.length) {
  // pathToFileURL: Node ESM tu choi duong Windows tuyet doi ("protocol c:")
  const { build } = await import(
    pathToFileURL(join(WEB, "_quartz", "node_modules", "esbuild", "lib", "main.js")).href)
  for (const f of tsFiles) {
    await build({
      entryPoints: [f],
      outfile: f.replace(/\.ts$/, ".js"),
      bundle: false,
      format: "esm",
      target: "es2022",
      loader: { ".ts": "ts" },
      logLevel: "silent",
    })
    console.log(`  dich  ${f.slice(NGUON.length + 1)}  ->  .js`)
  }
}
