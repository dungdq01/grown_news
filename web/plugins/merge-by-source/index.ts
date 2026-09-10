import type { QuartzEmitterPlugin } from "../../_quartz/quartz/plugins/types"
import type { BuildCtx } from "../../_quartz/quartz/util/ctx"
import type { ProcessedContent } from "../../_quartz/quartz/plugins/vfile"
import type { FilePath, FullSlug } from "../../_quartz/quartz/util/path"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

/**
 * Hai luật tòa soạn, một emitter — vì cả hai đều cần nhìn TOÀN BỘ tập bài:
 *
 * M03 §2.1.3 · gộp theo `url_normalized`
 *   Ba bản phân tích cùng một URL là MỘT nguồn. Đếm theo `url` thô thì thêm
 *   `?utm_source=` là ra "nguồn độc lập" mới, và hệ số kiểm chứng chéo bị thổi
 *   phồng bằng một thao tác copy link.
 *
 * M03-R5 · sắp theo `priority`, KHÔNG theo `analyzed_at`
 *   `analyzed_at` đo "khi nào tôi rảnh"; `priority` đo "cái này quan trọng thế
 *   nào". Sắp theo ngày thì bài quan trọng nhất chìm sau một tối nạp nhiều nguồn
 *   — đúng thứ hệ thống này sinh ra để chống.
 *
 * Vì sao emitter làm được: `emit(ctx, content: ProcessedContent[], resources)`
 * nhận TOÀN BỘ mảng content một lần (kiểm ở quartz/plugins/types.ts:50-56).
 * Nếu API là mỗi-file-một-lần thì phải dựng chỉ mục riêng — đó là điều kiểm
 * trước khi quyết F1 giữ Quartz.
 */

type Ban = {
  slug: FullSlug
  id: string
  title: string
  url_normalized: string
  priority: number
  credibility_max: string
  origin: string
  source_type: string
  analyzed_at: string
}

type Bai = {
  url_normalized: string
  priority: number      // cao nhất trong nhóm
  bans: Ban[]           // nhiều bản = nhiều tab
}

/** priority cao nhất trong `skill_candidates[]`. Không có ứng viên ⇒ 0. */
function priorityCua(fm: Record<string, unknown>): number {
  const uv = fm.skill_candidates
  if (!Array.isArray(uv)) return 0
  return uv.reduce((max: number, c: Record<string, unknown>) => {
    const p = typeof c?.priority === "number" ? c.priority : 0
    return p > max ? p : max
  }, 0)
}

export function gop(content: ProcessedContent[]): Bai[] {
  const nhom = new Map<string, Bai>()

  for (const [, file] of content) {
    const data = (file.data ?? {}) as Record<string, unknown>
    const fm = (data.frontmatter ?? {}) as Record<string, unknown>
    if (typeof fm.review_status !== "string") continue

    // Khoá gộp: url_normalized. Thiếu thì dùng slug — mỗi bản một bài, không gộp bừa.
    const khoa = typeof fm.url_normalized === "string" && fm.url_normalized
      ? fm.url_normalized
      : String(data.slug ?? "")

    const ban: Ban = {
      slug: data.slug as FullSlug,
      id: String(fm.id ?? ""),
      title: String(fm.title ?? data.slug ?? ""),
      url_normalized: khoa,
      priority: priorityCua(fm),
      credibility_max: String(fm.credibility_max ?? ""),
      origin: String(fm.origin ?? ""),
      source_type: String(fm.source_type ?? ""),
      analyzed_at: String(fm.analyzed_at ?? ""),
    }

    const co = nhom.get(khoa)
    if (co) {
      co.bans.push(ban)
      if (ban.priority > co.priority) co.priority = ban.priority
    } else {
      nhom.set(khoa, { url_normalized: khoa, priority: ban.priority, bans: [ban] })
    }
  }

  // Sắp giảm dần theo priority. Bằng nhau ⇒ mới hơn trước (tiêu chí PHỤ, không phải chính).
  return [...nhom.values()].sort((a, b) =>
    b.priority - a.priority ||
    (b.bans[0]?.analyzed_at ?? "").localeCompare(a.bans[0]?.analyzed_at ?? ""),
  )
}

export const MergeBySource: QuartzEmitterPlugin = () => ({
  name: "MergeBySource",
  async emit(ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> {
    const bai = gop(content)
    const noiBat = bai[0]

    const chiMuc = {
      $comment: "Sinh bởi merge-by-source. Web đọc file này để dựng trang chủ và màn Tất cả.",
      total_articles: bai.length,
      merged_groups: Object.fromEntries(
        bai.filter((b) => b.bans.length > 1).map((b) => [b.url_normalized, b.bans.map((x) => x.id)]),
      ),
      featured_id: noiBat?.bans[0]?.id ?? null,
      featured_priority: noiBat?.priority ?? 0,
      articles: bai,
    }

    // Tự ghi thay vì mượn `write` nội bộ của Quartz: import đường tương đối vào
    // quartz/plugins/emitters/helpers gãy lúc CHẠY (Node ESM đòi đuôi .js) dù
    // tsc chấp nhận. Bốn dòng `import type` thì không sao — chúng bị xoá khi
    // biên dịch. Hàm này chỉ là mkdir + writeFile, không đáng để phụ thuộc.
    const duong = join(ctx.argv.output, "static", "merged-index.json")
    await mkdir(dirname(duong), { recursive: true })
    await writeFile(duong, JSON.stringify(chiMuc, null, 2), "utf8")
    return [duong as FilePath]
  },
})

export const manifest = {
  name: "merge-by-source",
  displayName: "Gộp theo url_normalized + sắp theo priority",
  description: "M03-R5 — nhiều bản cùng nguồn là một bài nhiều tab; sắp theo priority",
  version: "1.0.0",
  category: "emitter" as const,
}

export default MergeBySource
