import type { QuartzFilterPlugin } from "../../_quartz/quartz/plugins/types"

/**
 * M03-R1 · chỉ `review_status: approved` lên site.
 *
 * Vì sao là LUẬT chứ không phải bộ lọc tiện lợi: `draft` là nơi mọi thứ chưa
 * được NGƯỜI xác nhận nằm — kể cả bài sinh ra do prompt injection. Toàn bộ lớp
 * giảm thiểu của security_baseline §6 đứng trên một câu: "tác động tối đa là
 * một bài rác trong draft". Lọt lên web thì câu đó sai.
 *
 * Chặn thêm bản lưu trữ `<slug>.v<n>.md` — lịch sử sau re-analyze, không phải
 * nội dung (spec M02 §2.5, AC-2.2.1 của M03).
 */

const LUU_TRU = /\.v\d+$/

export const ApprovedOnly: QuartzFilterPlugin = () => ({
  name: "ApprovedOnly",
  shouldPublish(_ctx, [_tree, vfile]) {
    const fm = vfile.data?.frontmatter as Record<string, unknown> | undefined

    // Không frontmatter ⇒ không phải bản phân tích (README, ghi chú kho).
    // Không đoán: thiếu review_status là không đạt.
    if (!fm || typeof fm.review_status !== "string") return false

    if (fm.review_status !== "approved") return false

    // `kb/paper/abc.v1.md` ⇒ slug kết thúc `.v1`
    const slug = String(vfile.data?.slug ?? "")
    if (LUU_TRU.test(slug)) return false

    return true
  },
})

export const manifest = {
  name: "approved-only",
  displayName: "Chỉ approved lên site",
  description: "M03-R1 — chặn draft/rejected/bản lưu trữ khỏi output build",
  version: "1.0.0",
  category: "filter" as const,
}

export default ApprovedOnly
