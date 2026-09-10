import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { QuartzComponent, QuartzComponentConstructor } from "../../_quartz/quartz/components/types"

/**
 * Nen phong canh — 05_uiux/DESIGN.md §6.
 *
 * Component nap script + chep anh tu public/ ra output.
 *
 * Vi sao anh phai chep: public/ la thu muc NGUON cua nguoi dung, khong nam
 * trong duong phuc vu cua site. Chep ra /static/bg/ luc build.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const GOC = join(HERE, "..", "..", "..")     // web/plugins/backdrop -> repo root

const ANH = /\.(jpe?g|png|webp|avif)$/i

/** Anh sang o public/light/, anh toi la cac file con lai o public/. */
function gomAnh() {
  const pub = join(GOC, "public")
  const bo: { light: string[]; dark: string[] } = { light: [], dark: [] }
  if (!existsSync(pub)) return bo

  const sang = join(pub, "light")
  if (existsSync(sang)) {
    for (const f of readdirSync(sang)) {
      if (ANH.test(f)) bo.light.push(join(sang, f))
    }
  }
  const toi = join(pub, "dark")
  if (existsSync(toi)) {
    for (const f of readdirSync(toi)) {
      if (ANH.test(f)) bo.dark.push(join(toi, f))
    }
  } else {
    // Chua co public/dark/ thi dung anh o goc public/ — chung deu la canh toi
    for (const f of readdirSync(pub)) {
      if (ANH.test(f)) bo.dark.push(join(pub, f))
    }
  }
  return bo
}

const Backdrop: QuartzComponent = () => null

// 437 dong CSS BE NGUYEN tu app-v20.html. Nap o day chu khong qua custom.scss:
// Sass dien giai CSS thuan la sai kieu, va QuartzComponent.css nhan CHUOI.
Backdrop.css = readFileSync(join(GOC, "web", "styles", "prototype.css"), "utf8")
// Doc .js DA DICH: afterDOMLoaded nhan chuoi JS thuan, Quartz khong strip
// cu phap TypeScript. link-plugins.mjs dich moi *.inline.ts truoc.
Backdrop.afterDOMLoaded = readFileSync(join(HERE, "src", "backdrop.inline.js"), "utf8")

const Ctor: QuartzComponentConstructor = () => Backdrop

export { Backdrop, gomAnh }
export default Ctor

export const manifest = {
  name: "backdrop",
  displayName: "Nen phong canh + tu chuyen",
  description: "Port phan bg* tu prototype G5",
  version: "1.0.0",
  category: "component" as const,
  components: {
    Backdrop: {
      displayName: "Nen phong canh",
      defaultPosition: "afterBody" as const,
      defaultPriority: 5,
    },
  },
}
