#!/usr/bin/env node
/**
 * SERVER PHẢI NGHE CẢ HAI ĐỊA CHỈ LOOPBACK — `127.0.0.1` và `::1`.
 *
 * Người dùng báo *"load hơi lâu"*. Đo mười màn: mọi màn ~230 ms phía server,
 * ĐỒNG ĐỀU, với kho chỉ 1 bản ghi — tức chi phí CỐ ĐỊNH mỗi request. Và nó
 * trúng cả `/static/bg/index.json`, một file **0 KB**. Vậy không phải render.
 *
 * Tách nhỏ đồng hồ:
 *
 *     localhost:8787    connect 207 ms   ttfb 215 ms
 *     127.0.0.1:8787    connect   1 ms   ttfb   8 ms
 *
 * `server.listen(CONG, "127.0.0.1")` chỉ nghe IPv4. Trên Windows `localhost`
 * phân giải `::1` TRƯỚC; kết nối đó bị từ chối và client chờ rồi mới thử lại
 * IPv4. ~205 ms, trả mỗi lần mở kết nối mới.
 *
 * ĐO HÀNH VI, KHÔNG ĐỌC MÃ: một chuỗi `"::1"` trong mã không cho biết cổng nào
 * thật sự nghe. Ở đây mở kết nối thật tới cả hai địa chỉ.
 *
 * CA ÂM giữ ràng buộc an ninh: KHÔNG được nghe ngoài loopback (BRD B-D3 ·
 * security_baseline §4 — bản phân tích có thể chứa nguồn nội bộ). Một bản vá
 * "cho nhanh" bằng `0.0.0.0` sẽ ĐẠT vế tốc độ và phá vế này, nên cổng đòi cả hai.
 */
import { connect } from "node:net"

import { batServer, dungKho, dungSchema, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const { kho, rac, don } = dungKho("gn-loopback", { chuDe: true })
const { schema } = dungSchema("gn-loopback-sc", { chuDe: true })
const sv = await batServer({ kho, rac, schema })

/** Mở một kết nối TCP, trả số ms — hoặc null nếu không nối được. */
const thu = (host, cong, hetGio = 3000) => new Promise((xong) => {
  const t0 = Date.now()
  const s = connect({ host, port: cong, family: host.includes(":") ? 6 : 4 })
  const dong = (kq) => { try { s.destroy() } catch { } ; xong(kq) }
  s.setTimeout(hetGio, () => dong(null))
  s.once("connect", () => dong(Date.now() - t0))
  s.once("error", () => dong(null))
})

try {
  console.log("\n1 · Nghe trên CẢ HAI địa chỉ loopback\n")

  const v4 = await thu("127.0.0.1", sv.cong)
  ok(v4 !== null, `\`127.0.0.1:${sv.cong}\` nối được (${v4} ms)`,
    "không nghe IPv4 thì mọi thứ hỏng, không chỉ chậm")

  const v6 = await thu("::1", sv.cong)
  ok(v6 !== null, `\`[::1]:${sv.cong}\` nối được (${v6} ms)`,
    "KHÔNG nghe `::1` ⇒ trình duyệt mở `localhost` sẽ thử IPv6 TRƯỚC, bị từ chối, "
    + "rồi chờ ~205 ms mới thử lại IPv4 — trả cho MỖI kết nối mới")

  console.log("\n2 · CA ÂM — không nghe ngoài loopback\n")

  /*
   * Đây là vế dễ mất nhất khi ai đó "chữa cho nhanh": đổi sang `0.0.0.0` cũng
   * làm §1 xanh, và mở luôn máy ra mạng. BRD B-D3 · security_baseline §4.
   */
  const { networkInterfaces } = await import("node:os")
  const ngoai = []
  for (const ds of Object.values(networkInterfaces())) {
    for (const n of ds ?? []) {
      if (!n.internal && n.family === "IPv4") ngoai.push(n.address)
    }
  }
  ok(ngoai.length > 0, `máy có ${ngoai.length} địa chỉ NGOÀI loopback để thử`,
    "không có địa chỉ ngoài nào ⇒ ca âm này đúng vô điều kiện và không đo gì")

  for (const dc of ngoai.slice(0, 3)) {
    const m = await thu(dc, sv.cong, 1500)
    ok(m === null, `  \`${dc}:${sv.cong}\` KHÔNG nối được`,
      `nối được trong ${m} ms — server đang mở ra mạng, không chỉ loopback`)
  }
} finally {
  sv.dung()
  don()
}

chot("server nghe cả hai loopback, và KHÔNG nghe ngoài loopback")
