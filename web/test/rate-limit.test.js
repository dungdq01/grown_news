#!/usr/bin/env node
/**
 * T08-15b — rate limit hai chiều + răng cho entropy (`FR-049` W1–W6).
 *
 * ĐƠN VỊ TEST, viết TRƯỚC code (R5).
 *
 * `AC3` là vế phân biệt cổng THẬT với cổng hình thức: một cổng chỉ bắn `N+1`
 * sẽ **xanh** trên một cài đặt gõ cứng đúng số đó. Ca "đổi ngưỡng ⇒ điểm chặn
 * dời theo" là thứ chỉ một cài đặt đọc-từ-bảng-khai làm được.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const tmp = mkdtempSync(join(tmpdir(), "ratelimit-"))
process.env.LOI_DB = join(tmp, "_loi.sqlite")
process.env.LOI_LUU = join(tmp, "_luu")
process.env.KHOA_DICH_VU = "khoa-dv-ratelimit"
process.env.KHOA_PHIEN = "khoa-phien-KHAC"

const M = await import("../api/dungchung.mjs")

// FR-051 · bon cua da cam o tang thao tac. Tai khoan DAU TIEN di
// qua cua bootstrap (bang con rong) va SINH RA voi vai `chu`; moi loi
// goi sau do phai mang `boi`. Cua bootstrap TU DONG sau hang dau tien.
const ADMIN = M.loiTaoNguoiDung({ ten: "admin-bootstrap" })

let xau = 0
const ok = (d, n, t = "") => {
  console.log(`  ${d ? "ok  " : "SAI "} ${n}${t ? "  — " + t : ""}`)
  if (!d) xau++
}

console.log("\nW3 · ngưỡng đọc từ BẢNG KHAI, không gõ cứng\n")
{
  const n = M.nguongLoi()
  ok(typeof n.thu_theo_ip === "number" && n.thu_theo_ip > 0,
    "`thu_theo_ip` là số dương", String(n.thu_theo_ip))
  ok(typeof n.thu_theo_ma === "number" && n.thu_theo_ma > 0,
    "`thu_theo_ma` là số dương", String(n.thu_theo_ma))
  ok(typeof n.cua_so_phut === "number" && n.cua_so_phut > 0,
    "`cua_so_phut` là số dương", String(n.cua_so_phut))

  // Bảng khai phải GIẢI THÍCH từng số — tiền lệ 07_curate/thresholds.yaml ghi
  // thẳng "CHƯA kiểm chứng" cho cả ba số của nó. Một số phỏng đoán mà không
  // khai là phỏng đoán thì lần sau không ai dám sửa.
  const thoNguon = readFileSync(
    new URL("../../core/assets/nguong-loi.json", import.meta.url), "utf8")
  ok(/vì sao|vi_sao|\$comment/i.test(thoNguon), "bảng khai có giải thích vì sao")
}

console.log("\nW1 · chặn theo IP — bắn N+1, cái thứ N+1 bị chặn\n")
{
  const N = M.nguongLoi().thu_theo_ip
  const ip = "10.0.0.1"
  let chan = -1
  for (let i = 1; i <= N + 2; i++) {
    if (!M.loiChoThu({ ip, ma: `ma-khac-${i}` })) { chan = i; break }
  }
  ok(chan === N + 1, `bị chặn ở lần thứ ${N + 1}`, `chặn ở lần ${chan}`)
}

console.log("\nW2 · chặn theo MÃ — nhiều IP cùng thử MỘT mã\n")
{
  const N = M.nguongLoi().thu_theo_ma
  const ma = "mot-ma-bi-do"
  let chan = -1
  for (let i = 1; i <= N + 2; i++) {
    // IP KHÁC NHAU mỗi lần — chiều IP không thể bắt ca này.
    if (!M.loiChoThu({ ip: `10.1.0.${i}`, ma })) { chan = i; break }
  }
  ok(chan === N + 1, `bị chặn ở lần thứ ${N + 1} dù mỗi lần một IP`,
    `chặn ở lần ${chan}`)
}

console.log("\nW3b · ĐỔI ngưỡng ⇒ điểm chặn DỜI THEO\n")
{
  // Đây là ca phân biệt cổng thật với cổng hình thức. Một cài đặt gõ cứng sẽ
  // xanh ở W1/W2 và ĐỎ ở đây.
  const duong = new URL("../../core/assets/nguong-loi.json", import.meta.url)
  const goc = readFileSync(duong, "utf8")
  try {
    const j = JSON.parse(goc)
    j.thu_theo_ip = 3
    writeFileSync(duong, JSON.stringify(j, null, 2), "utf8")
    M.xoaCacheNguong?.()

    const ip = "10.2.0.1"
    let chan = -1
    for (let i = 1; i <= 6; i++) {
      if (!M.loiChoThu({ ip, ma: `x-${i}` })) { chan = i; break }
    }
    ok(chan === 4, "ngưỡng 3 ⇒ chặn ở lần 4", `chặn ở lần ${chan}`)
  } finally {
    writeFileSync(duong, goc, "utf8")
    M.xoaCacheNguong?.()
  }
}

console.log("\nW4 · entropy ≥128 bit — răng cho một tính chất ĐANG đúng\n")
{
  const src = readFileSync(new URL("../api/dungchung.mjs", import.meta.url), "utf8")
  const i = src.indexOf("export function loiCapMaMoi")
  const than = src.slice(i, src.indexOf("\n}", i))

  const rb = than.match(/randomBytes\((\d+)\)/)
  ok(rb !== null, "đường sinh mã dùng randomBytes")
  ok(rb && Number(rb[1]) >= 16, `randomBytes(n) với n ≥ 16 (=128 bit)`,
    rb ? `n = ${rb[1]}` : "không thấy")
  ok(!/Math\.random/.test(than), "KHÔNG có Math.random trong đường sinh mã")

  // Và mã sinh ra phải THẬT SỰ dài — đo trên giá trị, không chỉ trên mã nguồn.
  const ai = M.loiTaoNguoiDung({ ten: "entropy", boi: ADMIN })
  const ma = M.loiCapMaMoi({ nguoi_dung_id: ai, boi: ADMIN })
  ok(ma.length >= 22, "mã sinh ra dài ≥22 ký tự base64url (=128 bit)",
    `dài ${ma.length}`)
  const ma2 = M.loiCapMaMoi({ nguoi_dung_id: ai, boi: ADMIN })
  ok(ma !== ma2, "hai mã liên tiếp KHÁC nhau")
}

console.log("\nW5 · vượt ngưỡng ⇒ audit tăng, và log KHÔNG chứa mã\n")
{
  const truoc = M.loiDemAudit()
  const ip = "10.3.0.1"
  const maBiDo = "ma-bi-do-nhieu-lan"
  const N = M.nguongLoi().thu_theo_ip
  for (let i = 0; i <= N + 1; i++) M.loiChoThu({ ip, ma: maBiDo })
  ok(M.loiDemAudit() > truoc, "audit có bản ghi mới khi bị chặn",
    `${truoc} → ${M.loiDemAudit()}`)
  ok(!JSON.stringify(M.loiDocAudit(100, { boi: ADMIN })).includes(maBiDo),
    "dòng audit KHÔNG chứa mã đã thử (M18-R2)")
}

console.log("\nW6 · cửa của NGƯỜI không bị đếm\n")
{
  // `loiChoThu` chỉ được gọi từ `quaCong` của bảy cửa MÁY. Cửa của người
  // (`POST /api/articles`) không đi qua đó — đo bằng cách đọc mã nguồn, vì
  // đây là câu hỏi "có gọi hay không", không phải "gọi ra kết quả gì".
  const art = readFileSync(new URL("../api/articles.mjs", import.meta.url), "utf8")
  ok(!/loiChoThu/.test(art), "`articles.mjs` KHÔNG gọi loiChoThu")
  const cua = readFileSync(new URL("../api/loi-cua.mjs", import.meta.url), "utf8")
  ok(/loiChoThu/.test(cua), "`loi-cua.mjs` CÓ gọi loiChoThu")
}

console.log(xau ? `\n${xau} lỗi` : "\npass · FR-049 W1–W6")
process.exit(xau ? 1 : 0)
