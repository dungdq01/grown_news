#!/usr/bin/env node
/**
 * Sinh kho TẠM từ analyses.sample.v5.json để test M03.
 *
 * KHÔNG ghi vào kb/ thật: M03 không thuộc kb_writers (chỉ M01 và M05 được ghi).
 * Kho tạm nằm trong thư mục test, xoá được, và mỗi lần chạy dựng lại từ contract.
 *
 * Nội dung 9 mục là khung tối thiểu — test M03 kiểm SHAPE (bài nào lên site,
 * gộp thế nào, sắp ra sao), không kiểm nội dung.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { thanBaiKhung } from "./_khung.mjs"

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const CONTRACT = join(GOC, "05_uiux", "contracts", "analyses.sample.v5.json")

/**
 * Kho tạm nằm NGOÀI repo, trong thư mục tạm của hệ điều hành.
 *
 * Vì sao không để trong web/test/: Quartz bật `gitignore: true` (glob.ts:18),
 * nên mọi thư mục bị .gitignore đều biến mất khỏi input — `Found 0 input files`
 * dù đĩa có 14 file. Mà kho tạm thì BẮT BUỘC phải ignore (sinh lại mỗi lần chạy).
 * Hai ràng buộc chỏi nhau ⇒ đặt ra ngoài repo.
 */
export const KHO_MAC_DINH = join(tmpdir(), "grown-news-test-kb")

/*
 * VÌ SAO FIXTURE KHÔNG THỂ TỰ SỞ HỮU DANH MỤC — đo được, ghi ra đây để lần sau
 * không ai thử lại.
 *
 * Tôi đã thử: `seed()` ghi `concepts.yaml` + `categories.yaml` vào kho tạm và
 * tự gán nhãn cho bản ghi. KHÔNG có tác dụng nào, vì emitter không đọc thư mục
 * build: `duongKho()` (`home-pages/index.ts:327`) là `join(GOC, "..", ten)` với
 * `ten` là "kb" hoặc "kb-mock" — tức MỌI dashboard và sidebar đọc thẳng kho
 * trong repo, còn `-d` chỉ quyết định Quartz sinh TRANG BÀI từ đâu.
 *
 * Nên mọi phép kiểm về nhãn thật ra đang đo `kb-mock/`, không đo kho tạm. Sau
 * khi FR-031 xoá sạch danh mục, chúng mất thứ để đo — và cách sửa đúng là đổi
 * THƯỚC ĐO của chúng (xem `filter-counts.test.js`), không phải dựng fixture giả
 * mà emitter không bao giờ nhìn tới.
 */
export function seed(dich) {
  const d = JSON.parse(readFileSync(CONTRACT, "utf8"))
  rmSync(dich, { recursive: true, force: true })

  for (const r of d.analyses) {
    const fm = Object.entries(r)
      .filter(([k]) => !k.startsWith("_"))
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n")
    // Thân bài từ KHUNG KHAI (core/assets/khung-than-bai.json), không gõ tay.
    const than = thanBaiKhung({
      "1": r.one_liner ?? "—",
      "3.2": "Chi tiết [nguon.py:10-40]",
    }).trimEnd()

    const p = join(dich, r.source_type, `${r.slug}.md`)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, `---\n${fm}\n---\n\n${than}\n`, "utf8")
  }

  // Bản lưu trữ sau re-analyze — PHẢI bị loại khỏi site (AC-2.2.1)
  const goc = d.analyses.find((r) => r.review_status === "approved")
  const pLuu = join(dich, goc.source_type, `${goc.slug}.v1.md`)
  writeFileSync(pLuu, readFileSync(join(dich, goc.source_type, `${goc.slug}.md`), "utf8"), "utf8")

  return { soFile: d.analyses.length + 1, contract: d }
}

// Chi chay khi duoc GOI THANG, khong chay khi bi import.
// Loi cu: dev-server.mjs import file nay, va `--kb` bi nuot lam duong dan =>
// tao thu muc rac ten "--kb".
const goiThang = basename(process.argv[1] ?? "") === "_seed.mjs"
if (goiThang) {
  // Bo qua co dong lenh — chi nhan duong dan that
  const tham = process.argv[2]
  const dich = tham && !tham.startsWith("-") ? tham : KHO_MAC_DINH
  const { soFile } = seed(dich)
  console.log(`sinh ${soFile} file vào ${dich}`)
}
