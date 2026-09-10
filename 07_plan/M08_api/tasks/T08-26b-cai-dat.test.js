#!/usr/bin/env node
/**
 * T08-17b — bảng `cai_dat` + `O_SUA_DUOC` (`M18 §10`, 13 AC).
 *
 * ĐƠN VỊ TEST, viết TRƯỚC code (R5).
 *
 * Đây là **tầng thứ ba** của `ADR-07`: giá trị ô ở DB, `chu` đổi được qua web.
 * Hai tầng trên đã có — bất biến (DDL `CHECK`) và schema ô (`QUYEN` trong mã).
 *
 * `M18-R5` và `M18-R6` trỏ vào file này. Trước khi nó tồn tại, hai rule đó khai
 * `S3` mà **thực là `soft`** (`R3`), và `check_rule_surfaces` đỏ đúng chỗ đó.
 */
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const tmp = mkdtempSync(join(tmpdir(), "caidat-"))
process.env.LOI_DB = join(tmp, "_loi.sqlite")
process.env.LOI_LUU = join(tmp, "_backup")

const M = await import("../api/dungchung.mjs")

// Tài khoản ĐẦU TIÊN đi qua cửa bootstrap và sinh ra với vai `chu`.
const CHU = M.loiTaoNguoiDung({ ten: "chu-caidat" })
const DN = M.loiTaoNguoiDung({ ten: "dong-nghiep", boi: CHU })

let xau = 0
const ok = (d, n, t = "") => {
  console.log(`  ${d ? "ok  " : "SAI "} ${n}${t ? "  — " + t : ""}`)
  if (!d) xau++
}
const nem = (fn) => { try { fn(); return null } catch (e) { return e } }

console.log("\nAC-10.1 · khoá ngoài allowlist ⇒ từ chối, 0 hàng mới\n")
{
  const truoc = M.demCaiDat()
  ok(nem(() => M.datCaiDat("linh-tinh", true, { boi: CHU })) !== null,
    "khoá lạ ⇒ ném")
  ok(M.demCaiDat() === truoc, "và KHÔNG tạo hàng nào", `${truoc} → ${M.demCaiDat()}`)
  ok(nem(() => M.datCaiDat("", true, { boi: CHU })) !== null, "khoá rỗng ⇒ ném")
  ok(nem(() => M.datCaiDat("XEM-AUDIT", true, { boi: CHU })) !== null,
    "khác hoa/thường ⇒ ném (so khớp CHÍNH XÁC, không chuẩn hoá)")

  const o = M.O_SUA_DUOC[0]
  ok(nem(() => M.datCaiDat(o.khoa, true, { boi: CHU })) === null,
    `khoá trong allowlist (\`${o.khoa}\`) ⇒ nhận`)
}

console.log("\nAC-10.2 · ALLOWLIST — tập mặc định là RỖNG\n")
{
  // Ca phan biet allowlist voi denylist: mot `viec` CO trong QUYEN nhung KHONG
  // khai trong O_SUA_DUOC thi KHONG ghi duoc. Mot cai dat denylist se XANH o
  // cac ca tren va DO o day — vi `viec` moi khong nam trong danh sach chan.
  const trongQuyen = Object.keys(M.QUYEN)
  const trongO = M.O_SUA_DUOC.map((x) => x.khoa)
  const chuaKhai = trongQuyen.filter((v) => !trongO.includes(v))
  ok(chuaKhai.length > 0,
    "có ít nhất một `viec` trong QUYEN mà KHÔNG trong O_SUA_DUOC", chuaKhai.join(" "))
  for (const v of chuaKhai) {
    ok(nem(() => M.datCaiDat(v, true, { boi: CHU })) !== null,
      `\`${v}\` có trong QUYEN nhưng KHÔNG khai ⇒ vẫn bị từ chối`)
  }
}

console.log("\nAC-10.3 · 10.4 · 10.6 — ba khoá phải VẮNG khỏi tập ô\n")
{
  const o = M.O_SUA_DUOC.map((x) => x.khoa)
  ok(!o.includes("duyet-bai"), "`duyet-bai` KHÔNG trong O_SUA_DUOC")
  ok(!Object.keys(M.QUYEN).includes("duyet-bai"), "và KHÔNG trong QUYEN")
  ok(!o.some((k) => /vai/i.test(k)), "không khoá nào chạm `vai`")
  ok(!o.includes("sua-cai-dat"),
    "`sua-cai-dat` KHÔNG trong O_SUA_DUOC — `chu` không tự khoá được")

  // AC-10.4 HANH VI: ghi MOI o roi doi `vai` cua moi hang KHONG doi.
  const truoc = [CHU, DN].map((i) => M.loiXemNguoiDung(i).vai).join(",")
  for (const x of M.O_SUA_DUOC) M.datCaiDat(x.khoa, true, { boi: CHU })
  ok([CHU, DN].map((i) => M.loiXemNguoiDung(i).vai).join(",") === truoc,
    "ghi MỌI ô ⇒ `vai` của mọi hàng KHÔNG đổi", truoc)
}

console.log("\nAC-10.5 · cửa nhận (khoa, gia_tri), KHÔNG nhận object\n")
{
  const o = M.O_SUA_DUOC[0].khoa
  const e = nem(() => M.datCaiDat({ khoa: o, gia_tri: true, vai: "chu" }, undefined, { boi: CHU }))
  ok(e !== null, "truyền một OBJECT làm tham số đầu ⇒ ném")
  ok(M.loiXemNguoiDung(DN).vai === "dong_nghiep",
    "và `vai` của đồng nghiệp KHÔNG bị object đó chạm")
}

console.log("\nAC-10.7 · gia_tri là BOOLEAN — vế nền\n")
{
  const o = M.O_SUA_DUOC[0].khoa
  ok(nem(() => M.datCaiDat(o, true, { boi: CHU })) === null, "`true` nhận")
  ok(nem(() => M.datCaiDat(o, false, { boi: CHU })) === null, "`false` nhận")
  for (const [gt, ten] of [
    ["true", "chuỗi 'true'"], [1, "số 1"], [null, "null"],
    ["../../etc/passwd", "đường dẫn"], ["$(rm -rf /)", "lệnh"],
    ["http://evil/", "URL"],
  ]) {
    ok(nem(() => M.datCaiDat(o, gt, { boi: CHU })) !== null, `${ten} ⇒ ném`)
  }
}

console.log("\nAC-10.8 · duocLam trả BOOLEAN đồng bộ\n")
{
  const kq = M.duocLam(CHU, "xem-audit")
  ok(typeof kq === "boolean", "`typeof === 'boolean'`", typeof kq)
  ok(!(kq instanceof Promise), "KHÔNG là Promise")
  ok(kq.then === undefined, "không có `.then` — một `await` quên sẽ làm mọi phép kiểm thành true")
  for (const [a, b, ten] of [
    [null, "xem-audit", "id null"], [CHU, "viec-la", "viec lạ"],
    [CHU, "", "viec rỗng"], [999999, "xem-audit", "id không tồn tại"],
  ]) {
    ok(typeof M.duocLam(a, b) === "boolean", `${ten} ⇒ vẫn boolean`)
  }
}

console.log("\nAC-10.9 · cửa ghi kiểm CẢ BA câu\n")
{
  const o = M.O_SUA_DUOC[0].khoa
  ok(nem(() => M.datCaiDat(o, true, { boi: CHU })) === null,
    "chủ + khoá hợp lệ + boolean ⇒ qua")
  ok(nem(() => M.datCaiDat(o, true, { boi: DN })) !== null,
    "*ai ghi*: đồng nghiệp ⇒ ném")
  ok(nem(() => M.datCaiDat("khong-co", true, { boi: CHU })) !== null,
    "*khoá nào*: khoá lạ ⇒ ném")
  ok(nem(() => M.datCaiDat(o, "x", { boi: CHU })) !== null,
    "*giá trị nào*: chuỗi ⇒ ném")
  ok(nem(() => M.datCaiDat(o, true)) !== null,
    "thiếu danh tính ⇒ ném (fail-closed)")
}

console.log("\nAC-10.10 · vết có `boi`\n")
{
  const o = M.O_SUA_DUOC[0].khoa
  const truoc = M.loiDemAudit()
  M.datCaiDat(o, false, { boi: CHU })
  ok(M.loiDemAudit() > truoc, "audit tăng", `${truoc} → ${M.loiDemAudit()}`)
  const d = M.loiDocAudit(50, { boi: CHU })
    .find((x) => x.hanh_dong === "doi-cai-dat")
  ok(d !== undefined, "có bản ghi `doi-cai-dat`")
  ok(d?.boi === CHU, "`boi` = người đã đổi", `boi=${d?.boi}`)
  ok(String(d?.doi_tuong ?? "").includes(o), "`doi_tuong` mang tên khoá", d?.doi_tuong)

  M.datCaiDat(o, true, { boi: CHU })
  const n = M.loiDocAudit(50, { boi: CHU })
    .filter((x) => x.hanh_dong === "doi-cai-dat").length
  ok(n >= 2, "đổi hai lần ⇒ HAI hàng audit, không phải một", String(n))
}

console.log("\nAC-10.11 · quản quyền ≠ quản audit\n")
{
  ok(Object.keys(M.QUYEN).includes("xem-audit"), "`QUYEN` có `xem-audit` (ĐỌC)")
  const xau2 = Object.keys(M.QUYEN)
    .filter((v) => /ghi-audit|xoa-audit|sua-audit/.test(v))
  ok(xau2.length === 0, "KHÔNG `viec` nào ghi/xoá/sửa audit", xau2.join(" ") || "0")
}

console.log("\nAC-10.12 · gieo lại lúc khởi động\n")
{
  const o = M.O_SUA_DUOC[0].khoa
  // (a) khoa la bi XOA
  M.dungLoiDb((db) =>
    db.exec("INSERT OR REPLACE INTO cai_dat (khoa, gia_tri) VALUES ('khoa-la-999', 1)"))
  M.gieoLaiCaiDat()
  ok(M.docCaiDat("khoa-la-999") === undefined, "khoá ngoài allowlist ⇒ bị XOÁ")

  // (b) khoa thieu duoc gieo mac dinh
  M.dungLoiDb((db) => db.exec(`DELETE FROM cai_dat WHERE khoa = '${o}'`))
  M.gieoLaiCaiDat()
  const md = M.O_SUA_DUOC.find((x) => x.khoa === o).mac_dinh
  ok(M.docCaiDat(o) === md, "khoá thiếu ⇒ gieo MẶC ĐỊNH", `${M.docCaiDat(o)} vs ${md}`)

  // (c) gia tri DA DOI CO CHU Y phai GIU NGUYEN
  M.datCaiDat(o, !md, { boi: CHU })
  M.gieoLaiCaiDat()
  ok(M.docCaiDat(o) === !md,
    "giá trị đã đổi có chủ ý ⇒ GIỮ NGUYÊN sau khi gieo lại", String(M.docCaiDat(o)))
}

console.log("\nAC7 (T08-17 §f) · hàng bịa KHÔNG thắng `QUYEN`\n")
{
  // Ca nay KHONG co trong §10 — tim ra khi viet task file.
  // Neu duocLam doc cai_dat TRUOC roi roi ve QUYEN khi khong co hang, thi mot
  // hang bia cho mot `viec` NGOAI O_SUA_DUOC se THANG QUYEN.
  const ngoai = Object.keys(M.QUYEN)
    .find((v) => !M.O_SUA_DUOC.some((x) => x.khoa === v))
  ok(ngoai !== undefined, "có một `viec` ngoài allowlist để thử", ngoai)
  M.dungLoiDb((db) =>
    db.exec(`INSERT OR REPLACE INTO cai_dat (khoa, gia_tri) VALUES ('${ngoai}', 1)`))
  ok(M.duocLam(DN, ngoai) === false,
    `hàng \`cai_dat\` bịa cho \`${ngoai}\` KHÔNG cho đồng nghiệp quyền đó`)
  M.dungLoiDb((db) => db.exec(`DELETE FROM cai_dat WHERE khoa = '${ngoai}'`))
}

console.log("\nÔ ĐÃ KHAI thì `cai_dat` THẮNG `QUYEN` — đó là cả điểm của tầng ba\n")
{
  const x = M.O_SUA_DUOC[0]
  M.datCaiDat(x.khoa, true, { boi: CHU })
  ok(M.duocLam(DN, x.khoa) === true, `bật \`${x.khoa}\` ⇒ đồng nghiệp LÀM ĐƯỢC`)
  M.datCaiDat(x.khoa, false, { boi: CHU })
  ok(M.duocLam(DN, x.khoa) === false, "tắt ⇒ KHÔNG làm được")
  ok(M.duocLam(CHU, x.khoa) === true, "và `chu` vẫn làm được — ô chỉ nới cho vai thấp")
}

console.log(xau ? `\n${xau} lỗi` : "\npass · M18 §10 · AC-10.1…10.13")
process.exit(xau ? 1 : 0)
