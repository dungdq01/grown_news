import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
// Kieu lay tu _quartz/ chu khong tu "@quartz-community/types": goi do chi ton
// tai khi plugin cai qua npm. Plugin LOCAL nap thang tu nguon nen phai tro
// duong tuong doi — cung dinh nghia, khac duong.
import type { QuartzComponent, QuartzComponentConstructor } from "../../_quartz/quartz/components/types"

/**
 * Cua so doc — 05_uiux/DESIGN.md §5.
 *
 * "Quyen sach" la CACH DOC (cot hep, muc luc, chia muc), khong phai mot to giay
 * duy nhat giua man hinh — nen nhan duoc ra nhieu ban.
 *
 * Component khong render gi: no la cho de Quartz nap script + CSS. Cua so tao
 * bang JS luc nguoi bam, khong ton tai trong HTML tinh.
 *
 * DOC BANG fs THAY VI import:
 * Node ESM khong hieu `.css`/`.ts` trong import cua plugin LOCAL — chi bundler
 * cua Quartz hieu, va plugin local khong di qua bundler do (plugin cong dong
 * thi co, vi chung build sang dist/*.js truoc khi Quartz nap).
 * Nhung `css` va `afterDOMLoaded` khai kieu StringResource — tuc CHUOI. Doc
 * file bang fs la dung kieu, khong phai lach.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const doc = (p: string) => readFileSync(join(HERE, p), "utf8")

// Doc .js DA DICH chu khong phai .ts nguon: afterDOMLoaded nhan chuoi JS thuan,
// Quartz khong strip cu phap TypeScript. link-plugins.mjs dich truoc bang
// esbuild co san trong node_modules cua Quartz.

const MultiWindow: QuartzComponent = () => null

MultiWindow.css = doc("src/styles/multiwindow.css")
MultiWindow.afterDOMLoaded = doc("src/scripts/multiwindow.inline.js")

const Ctor: QuartzComponentConstructor = () => MultiWindow

export { MultiWindow }
export default Ctor

export const manifest = {
  name: "multiwindow",
  displayName: "Cua so doc nhieu bai",
  description: "Port 363 dong JS tu prototype G5 — mo nhieu bai cung luc, keo tha, keo gian 8 huong",
  version: "1.0.0",
  category: "component" as const,
  components: {
    MultiWindow: {
      displayName: "Cua so doc",
      defaultPosition: "afterBody" as const,
      defaultPriority: 90,
    },
  },
}
