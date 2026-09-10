#!/usr/bin/env node
/**
 * T08-20 — hai cửa LÕI để FE gọi được THỢ. Sở hữu: `T03-91` (glob `loi-*`).
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * `web` **gọi** `:8790`; **trình duyệt KHÔNG**. Hai chủ thể khác nhau, và cả
 * giá trị của hai cửa này nằm ở chỗ đó:
 *
 *   `POST /job` của THỢ đòi `X-Khoa-Loi` (`M12-R7`). Trình duyệt gọi thẳng
 *   nghĩa là khoá nằm trong JS tải về máy người dùng — mở DevTools là thấy
 *   khoá, và từ đó ai cũng gọi thẳng vào THỢ. `CVE-2025-41258` theo một đường
 *   khác. Đặt lời gọi ở phía `web` giữ khoá Ở LẠI SERVER.
 *
 * Nên phép đo NẶNG NHẤT của cổng này là: **khoá không bao giờ ra khỏi server**
 * — không trong thân trả về, không trong bundle FE.
 *
 * ĐỎ_KHI  khoá lộ ra thân trả về / ra `gn.js` · `dich` (đích egress) đi ra
 *         trình duyệt · payload khai `nguoi_dung_id` được tin · THỢ chết mà
 *         cửa trả 500 trần hoặc treo · mã của THỢ bị dịch lại thành 200 ·
 *         thiếu phiên mà rơi về một "người dùng mặc định"
 * XANH_KHI khoá ở lại server, mã đi nguyên, và việc không chủ được GHI VẾT
 */
import { createServer } from "node:http"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()

const KHOA = "khoa-dich-vu-cho-cong-t0820"
const KHOA_THO = "khoa-loi-cua-tho-t0820"

/* ── THỢ GIẢ: một `:8790` tối thiểu, ghi lại thứ nó NHẬN được ────────────
   Không dùng `chungcat` thật: cổng này đo CỬA CỦA LÕI, không đo THỢ. Và THỢ
   giả cho phép đo chính xác thứ `web` GỬI ĐI — điều không quan sát được nếu
   gọi vào THỢ thật. */
function thoGia(dap) {
  const nhan = []
  const s = createServer((req, res) => {
    let than = ""
    req.on("data", (d) => { than += d })
    req.on("end", () => {
      nhan.push({ duong: req.url, method: req.method, headers: req.headers, than })
      const d = dap(req)
      res.writeHead(d.ma, { "content-type": "application/json" })
      res.end(JSON.stringify(d.than))
    })
  })
  return new Promise((r) => s.listen(0, "127.0.0.1", () => r({
    cong: s.address().port, nhan, dung: () => s.close(),
  })))
}

const DANH_MUC = {
  dong: [
    { nha_cung_cap: "nha-a", model: "model-a", khu_vuc: "khong-xac-dinh",
      can_key: true, kieu_structured: "tool_use", che_do: "sync",
      // THỢ thật đã lọc `dich`; ở đây CỐ Ý trả nó để đo rằng cửa LÕI
      // kiểm LẠI chứ không tin đầu kia đã lọc.
      dich: "gateway.noi-bo" },
  ],
  $canh_bao_mot_gateway: "M12-R5 mất răng khi một gateway",
}

const kho = dungKho("t0820")
const schema = dungSchema("t0820")
const rac = mkdtempSync(join(tmpdir(), "t0820-rac-"))
const loiDb = mkdtempSync(join(tmpdir(), "t0820-loi-"))

const tho = await thoGia((req) => {
  if (req.url === "/model") return { ma: 200, than: DANH_MUC }
  // T08-21 · hai đường ĐỌC. THỢ giả trả `$q` nguyên văn để đo được cửa LÕI
  // chuyển tiếp ĐÚNG tham số nào — không quan sát được nếu gọi THỢ thật.
  if (req.url === "/viec" || req.url.startsWith("/viec?")) {
    return { ma: 200, than: { dong: [{ ulid: "01T0821", slug: "kho/mot-tai-lieu" }],
      tong: 1, tran: 200, $q: req.url.split("?")[1] ?? "" } }
  }
  if (req.url === "/viec/01T0821") return { ma: 200, than: { ulid: "01T0821", giai_doan: "cho" } }
  if (req.url.startsWith("/viec/")) return { ma: 404, than: { loi: "không có việc đó" } }
  return { ma: 201, than: { viec_id: "01T0820", model: "model-a", khu_vuc: "khong-xac-dinh" } }
})

const sv = await batServer({
  kho, rac, schema,
  loi: {
    LOI_DB: join(loiDb, "_loi.sqlite"),
    LUU_LOI: loiDb,
    KHOA_DICH_VU: KHOA,
    KHOA_PHIEN: "khoa-phien-khac-han-t0820",
    CHUNGCAT_KHOA_LOI: KHOA_THO,
    CHUNGCAT_GOC: `http://127.0.0.1:${tho.cong}`,
  },
})

try {
  console.log("\n1 · GET /api/model — bộ chọn có nguồn, `dich` KHÔNG ra ngoài\n")

  const m = await goi(sv.cong, "GET", "/api/model")
  ok(m.ma === 200, "trả 200", `trả ${m.ma}`)
  ok(Array.isArray(m.json?.dong) && m.json.dong.length === 1, "có danh mục")
  const tho_json = JSON.stringify(m.json ?? {})
  ok(!/\bdich\b/.test(tho_json),
    "KHÔNG trường `dich` trong thân trả về — kể cả khi đầu kia trả nó",
    tho_json.slice(0, 120))
  ok(!tho_json.includes("gateway.noi-bo"),
    "và không giá trị đích nào lọt qua dưới một tên khác")
  ok(/khu_vuc/.test(tho_json),
    "`khu_vuc` VẪN đi ra — FR-053 §1.4 đòi FE hiện nó cạnh từng model")
  ok(tho_json.includes("khong-xac-dinh"),
    "giá trị `khong-xac-dinh` đi ra NGUYÊN VĂN, không bị lọc/đổi")

  console.log("\n2 · Khoá dịch vụ Ở LẠI SERVER — phép đo nặng nhất\n")

  const gui = tho.nhan.find((x) => x.duong === "/model")
  ok(gui !== undefined, "`web` thật sự gọi sang THỢ (không tự bịa danh mục)")
  ok(!tho_json.includes(KHOA_THO) && !tho_json.includes(KHOA),
    "không khoá nào trong thân `GET /api/model`")

  console.log("\n3 · POST /api/job — hai header do SERVER gắn\n")

  const j = await goi(sv.cong, "POST", "/api/job", {
    body: { loai: "chung-cat-mot-nguon", slug: "x", model: "model-a",
      // Client khai danh tính — phải bị BỎ, không được tin.
      nguoi_dung_id: 999 },
  })
  ok(j.ma === 201, "mã của THỢ đi NGUYÊN về FE (201)", `trả ${j.ma}`)
  const jt = JSON.stringify(j.json ?? {})
  ok(!jt.includes(KHOA_THO), "khoá THỢ KHÔNG có trong thân trả về")

  const p = tho.nhan.find((x) => x.duong === "/job")
  ok(p !== undefined, "`web` gọi sang `:8790/job`")
  ok(p?.headers["x-khoa-loi"] === KHOA_THO,
    "`web` gắn `X-Khoa-Loi` từ env SERVER — trình duyệt không cầm khoá này")
  ok(!(p?.than ?? "").includes("999"),
    "`nguoi_dung_id` client khai bị BỎ trước khi chuyển tiếp",
    p?.than?.slice(0, 140))
  ok(p?.headers["x-nguoi-dung"] === undefined,
    "KHÔNG phiên ⇒ KHÔNG gắn `X-Nguoi-Dung` — và KHÔNG rơi về 'người dùng mặc định'")

  console.log("\n4 · Việc KHÔNG CÓ CHỦ phải để lại VẾT\n")

  const a = await goi(sv.cong, "GET", "/api/audit?n=20", {
    headers: { "x-khoa-dich-vu": KHOA, "x-aud": "loi" },
  })
  const at = JSON.stringify(a.json ?? {})
  ok(a.ma === 200 || a.ma === 404,
    "đường đọc audit tồn tại hoặc chưa mở — không 500", `trả ${a.ma}`)
  if (a.ma === 200) {
    ok(/khong-chu|tao-job/.test(at),
      "có dòng audit cho lần tạo việc không chủ — null CÓ VẾT, không im lặng",
      at.slice(0, 200))
  }

  console.log("\n5b · T08-21 · hai cửa ĐỌC việc\n")

  const ds = await goi(sv.cong, "GET", "/api/job?giai_doan=cho&n=5&bay=1")
  ok(ds.ma === 200 && ds.json?.tong === 1, "`GET /api/job` trả danh sách", `trả ${ds.ma}`)
  const dsq = new URLSearchParams(ds.json?.$q ?? "")
  ok(dsq.get("giai_doan") === "cho" && dsq.get("n") === "5",
    "chuyển tiếp `giai_doan` + `n`")
  ok(dsq.get("bay") === null,
    "tham số KHÔNG khai (`bay`) bị BỎ — không cho một tham số chưa có hợp đồng " +
    "đi xuyên qua cửa", ds.json?.$q)
  ok(!JSON.stringify(ds.json ?? {}).includes(KHOA_THO),
    "khoá THỢ không có trong thân danh sách")

  const mot = await goi(sv.cong, "GET", "/api/viec/01T0821")
  ok(mot.ma === 200 && mot.json?.giai_doan === "cho", "`GET /api/viec/<id>` trả chi tiết")
  const thieu = await goi(sv.cong, "GET", "/api/viec/khong-co-that")
  ok(thieu.ma === 404,
    "id không có ⇒ **404** của THỢ đi NGUYÊN — dịch thành 200 rỗng làm màn chi " +
    "tiết hiện một việc trống, và người tưởng việc của họ bị xoá", `trả ${thieu.ma}`)

  console.log("\n5 · Mã của THỢ đi NGUYÊN — FE cần phân biệt bị-chặn với đã-nhận\n")

  tho.dung()
  const chet = await goi(sv.cong, "POST", "/api/job", {
    body: { loai: "chung-cat-mot-nguon", slug: "x", model: "model-a" },
  })
  ok(chet.ma === 502,
    "THỢ không nghe ⇒ **502**, không 500 trần và không treo", `trả ${chet.ma}`)
  ok(/không|THỢ|dịch vụ|chưa/.test(JSON.stringify(chet.json ?? {})),
    "kèm câu đọc được, không chỉ một mã trần")

  console.log("\n6 · Khoá KHÔNG có trong bundle FE\n")

  for (const f of ["site/static/gn.js", "public/gn.js"]) {
    try {
      const b = readFileSync(join(import.meta.dirname, "..", f), "utf8")
      ok(!b.includes(KHOA_THO) && !b.includes("x-khoa-loi"),
        `\`${f}\` KHÔNG chứa khoá THỢ — trình duyệt không được cầm nó`)
    } catch { /* bundle chưa build ở môi trường này */ }
  }
} finally {
  sv.dung()
  try { tho.dung() } catch { /* đã đóng ở §5 */ }
}

chot("khoá ở lại server · `dich` không ra ngoài · mã đi nguyên · việc không chủ có vết")
