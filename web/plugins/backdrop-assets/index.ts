import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { QuartzEmitterPlugin } from "../../_quartz/quartz/plugins/types"
import type { BuildCtx } from "../../_quartz/quartz/util/ctx"
import type { FilePath } from "../../_quartz/quartz/util/path"

/**
 * Chep anh nen tu public/ ra <output>/static/bg/ + sinh index.json.
 *
 * public/ la thu muc ANH NGUON cua nguoi dung — 10 file jpg commit tu s5.
 * No KHONG nam trong duong phuc vu cua site, va khong duoc dong vao
 * (Quartz xoa sach thu muc output truoc moi build; tro no vao public/ la mat anh).
 *
 * Bo sang = public/light/. Bo toi = public/dark/, khong co thi lay file o goc.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const GOC = join(HERE, "..", "..", "..")
const ANH = /\.(jpe?g|png|webp|avif)$/i

// Anh qua nang lam trang tai cham va nguoi doc thay khung trang truoc khi thay nen
//
// TRAN 4 MB la de BO QUA file khong dung duoc. Nhung 4 MB van qua nang de
// CROSSFADE: trinh duyet giai ma lai ca khung khi doi opacity, va
// `backdrop-filter` cua panel phia tren buoc no chup lai nen moi frame.
//
// Do that (2026-08-24): public/ co 11 file / 17.7 MB, file lon nhat 8.4 MB
// (9783x5503 — bi tran 4MB bo qua im lang). Sau `core/tools/toi_uu_anh_nen.py`:
// 8 file / 2.3 MB, lon nhat 427 KB.
//
// CANH_KB la nguong CANH BAO, khong chan: anh la tai san cua nguoi dung, tu y
// bo mot anh vi nang 30 KB thi te hon la in mot dong nhac.
const TRAN_MB = 4
const CANH_KB = 500

function gom(thuMuc: string): string[] {
  if (!existsSync(thuMuc)) return []
  return readdirSync(thuMuc)
    .filter((f) => ANH.test(f))
    .map((f) => join(thuMuc, f))
    .filter((p) => statSync(p).size <= TRAN_MB * 1024 * 1024)
    .sort()
}

export const BackdropAssets: QuartzEmitterPlugin = () => ({
  name: "BackdropAssets",
  async emit(ctx: BuildCtx): Promise<FilePath[]> {
    const pub = join(GOC, "public")
    const sang = gom(join(pub, "light"))
    const toi = existsSync(join(pub, "dark")) ? gom(join(pub, "dark")) : gom(pub)

    const dich = join(ctx.argv.output, "static", "bg")
    mkdirSync(dich, { recursive: true })

    const ra: FilePath[] = []
    const url: { light: string[]; dark: string[] } = { light: [], dark: [] }

    for (const [tone, ds] of [["light", sang], ["dark", toi]] as const) {
      for (const src of ds) {
        // Ten file co dau cach/ngoac => ma hoa cho URL an toan
        const ten = `${tone}-${ra.length}${src.slice(src.lastIndexOf("."))}`
        const den = join(dich, ten)
        copyFileSync(src, den)
        url[tone].push(`/static/bg/${ten}`)
        ra.push(den as FilePath)
      }
    }

    // NOI RA khi anh nang — crossfade giat la thu nguoi dung thay, con nguyen
    // nhan (mot file 3 MB) thi khong. Bo qua im lang thi lan sau lai nang.
    const nang = [...sang, ...toi]
      .map((p) => [p, Math.round(statSync(p).size / 1024)] as const)
      .filter(([, kb]) => kb > CANH_KB)
    if (nang.length) {
      console.log(`\n  ANH NEN NANG (>${CANH_KB} KB) — crossfade se giat:`)
      for (const [p, kb] of nang) console.log(`    ${kb} KB  ${p.split(/[\\/]/).pop()}`)
      console.log("    Sua: python core/tools/toi_uu_anh_nen.py\n")
    }

    const idx = join(dich, "index.json")
    await writeFile(idx, JSON.stringify(url, null, 2), "utf8")
    ra.push(idx as FilePath)
    return ra
  },
})

export const manifest = {
  name: "backdrop-assets",
  displayName: "Chep anh nen",
  description: "public/ -> <output>/static/bg/ + index.json",
  version: "1.0.0",
  category: "emitter" as const,
}

export default BackdropAssets
