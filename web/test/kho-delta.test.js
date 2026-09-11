#!/usr/bin/env node
/**
 * T08-35 — cửa kho-delta cho indexer M13 + proxy /api/tim + gocTho(ten).
 *
 * CỔNG VIẾT TRƯỚC (rule.md mục 8): sinh ở `07_plan/M08_api/tasks/T08-35-kho-delta.test.js`
 * (19 lỗi → pass, commit cf51668), dời vào đây bằng `git mv` ở T03-150 (đơn vị TEST của M03 —
 * `web/test/**` là boundary M03) + đăng ký `npm test`. Chỉ đổi dòng import `_api.mjs`.
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * M13 dựng chỉ mục DẪN XUẤT từ kho, và nó KHÔNG được mở `kb/_kho.sqlite`
 * (M13-R3). Nên LÕI phải có một cửa nói "bản ghi nào đổi" (`kho-delta`), và web
 * gọi M13 để TÌM qua một proxy giữ khoá Ở LẠI SERVER (ADR-08: web là wrapper).
 * `gocTho()` hôm nay gõ cứng `thu_muc === "chungcat"`; thêm `truyhoi` là lần
 * thứ hai cùng một hằng — đúng thứ Z6 cấm.
 *
 * ĐỎ_KHI  kho-delta thiếu/thừa một trong NĂM trường (slug · loai · updated_at ·
 *         sha_than · space) · sửa bài mà sha_than không đổi · /api/tim không gắn
 *         `x-aud: truyhoi` + khoá chiều web→truyhoi, hoặc khoá lộ về client, hoặc
 *         khoá chiều web→chungcat bị gửi nhầm sang truyhoi · thiếu `k` mà web không
 *         khai mặc định tường minh · `=== "chungcat"` còn trong tho-cua.mjs
 * XANH_KHI năm trường đúng, sha_than đổi theo thân, proxy mang đúng hai header và
 *         trả nguyên kết quả, gocTho đọc cổng theo TÊN từ dich-vu.json
 *
 * AC3 (poke `/reindex-poke` sau ghi bài) — CHỜ PM QUYẾT (2026-09-10): endpoint
 * không có trong spec/model_flow M13. Vế đó in SKIP kèm lý do, không xanh rỗng.
 */
import { createServer } from "node:http"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()

/* Gốc repo: hằng dò hai vị trí giữ lại từ lúc cổng còn ở thư mục task — vô hại, và cổng chạy được cả hai nơi. */
const GOC = [join(import.meta.dirname, "..", "..", ".."), join(import.meta.dirname, "..", "..")]
  .find((g) => existsSync(join(g, "web", "package.json")))
const THO_CUA = join(GOC, "web", "api", "tho-cua.mjs")

const KHOA = "khoa-dich-vu-cho-cong-t0835"
const KHOA_WEB_TRUYHOI = "khoa-chieu-web-truyhoi-t0835"
const KHOA_WEB_CHUNGCAT = "khoa-chieu-web-chungcat-t0835"

/* THỢ GIẢ — ghi lại thứ nó NHẬN được. Hai server, hai cổng: để đo được
   `gocTho("truyhoi")` và `gocTho("chungcat")` trỏ HAI nơi khác nhau. */
function thoGia(dap) {
  const nhan = []
  const s = createServer((req, res) => {
    let than = ""
    req.on("data", (d) => { than += d })
    req.on("end", () => {
      nhan.push({ duong: req.url, method: req.method, headers: req.headers, than })
      const d = dap(req, than)
      res.writeHead(d.ma, { "content-type": "application/json" })
      res.end(JSON.stringify(d.than))
    })
  })
  return new Promise((r) => s.listen(0, "127.0.0.1", () => r({
    cong: s.address().port, nhan, dung: () => s.close(),
  })))
}

const KET_QUA_MAU = {
  ket_qua: [{
    doc_id: "bai-duyet", file: "kb/paper/bai-duyet.md", anchor: "muc-mot",
    line_start: 12, line_end: 20, dia_chi: "paper/bai-duyet.md:12-20",
    heading_path: "Bài duyệt › Mục một", body: "thân đầy đủ, không cắt",
    nguon_van_ban: "than", bm25: -4.2,
  }],
  so_ban_ghi_trong_pham_vi: 1,
  tong: 1,
}

// `dungKho` trả `{kho, rac, don}` — truyền OBJECT vào `batServer` là KB_DIR="[object Object]"
// và kho tạm RỖNG im lặng (đo 2026-09-10: /api/index total 0, mọi vế xanh oan trên []).
const { kho, rac } = dungKho("t0835")
const { schema } = dungSchema("t0835")
const loiDb = mkdtempSync(join(tmpdir(), "t0835-loi-"))

const truyhoi = await thoGia((req) => {
  if (req.url === "/truy-hoi" && req.method === "POST") return { ma: 200, than: KET_QUA_MAU }
  return { ma: 404, than: { loi: "truyhoi giả: không có đường này" } }
})
const chungcat = await thoGia((req) => {
  if (req.url === "/model") return { ma: 200, than: { dong: [] } }
  return { ma: 404, than: { loi: "chungcat giả: không có đường này" } }
})

const sv = await batServer({
  kho, rac, schema,
  loi: {
    LOI_DB: join(loiDb, "_loi.sqlite"),
    LUU_LOI: loiDb,
    KHOA_DICH_VU: KHOA,
    KHOA_PHIEN: "khoa-phien-khac-han-t0835",
    CHUNGCAT_KHOA_LOI: KHOA_WEB_CHUNGCAT,
    CHUNGCAT_GOC: `http://127.0.0.1:${chungcat.cong}`,
    KHOA_WEB_TRUYHOI,
    TRUYHOI_GOC: `http://127.0.0.1:${truyhoi.cong}`,
  },
})

const NAM_TRUONG = ["loai", "sha_than", "slug", "space", "updated_at"]

try {
  console.log("\n1 · GET /api/kho-delta — NĂM trường, trang được, sha_than đổi theo thân\n")

  let r = await goi(sv.cong, "GET", "/api/kho-delta")
  ok(r.ma === 200, "trả 200", `trả ${r.ma}`)
  const items = Array.isArray(r.json?.items) ? r.json.items : []
  ok(items.length >= 3, "≥3 bản ghi seed hiện ra (bản `.v1` lưu trữ KHÔNG hiện)", `được ${items.length}`)
  ok(r.json?.tong === items.length, "`tong` = số dòng khi không cắt trang", `tong=${r.json?.tong}`)
  ok(items.every((x) => JSON.stringify(Object.keys(x).sort()) === JSON.stringify(NAM_TRUONG)),
    "mỗi dòng ĐÚNG năm trường slug · loai · updated_at · sha_than · space — không thiếu, không thừa",
    JSON.stringify(Object.keys(items[0] ?? {}).sort()))
  ok(items.every((x) => x.space === "mac-dinh"),
    "`space` = `mac-dinh` cho MỌI bản ghi (cột dành sẵn — điểm nối khoá rule.md 13, đổi qua FR + báo PM-Space)")
  ok(items.every((x) => /^[0-9a-f]{64}$/.test(String(x.sha_than))),
    "`sha_than` là sha256 hex 64 ký tự", String(items[0]?.sha_than))
  ok(items.every((x) => typeof x.loai === "string" && x.loai.length > 0), "`loai` là chuỗi khác rỗng")
  const slugs = items.map((x) => x.slug).sort()
  ok(slugs.includes("bai-duyet") && slugs.includes("bai-nhap"), "slug seed có mặt", slugs.join(","))

  const trang = await goi(sv.cong, "GET", "/api/kho-delta?limit=1&offset=1")
  ok(trang.ma === 200 && trang.json?.items?.length === 1 && trang.json?.tong === items.length,
    "`?limit=1&offset=1` ⇒ 1 dòng, `tong` vẫn là tổng cả kho",
    `ma=${trang.ma} items=${trang.json?.items?.length} tong=${trang.json?.tong}`)

  // Sửa THÂN một bài qua cửa ghi thật ⇒ sha_than của đúng slug đó đổi, slug khác giữ.
  const truoc = Object.fromEntries(items.map((x) => [x.slug, x.sha_than]))
  const bai = await goi(sv.cong, "GET", "/api/articles/paper/bai-duyet")
  ok(bai.ma === 200 && bai.json?.etag, "đọc được bài để sửa", `trả ${bai.ma}`)
  const sua = await goi(sv.cong, "PUT", "/api/articles/paper/bai-duyet", {
    body: { frontmatter: bai.json?.frontmatter, body: (bai.json?.body ?? "") + "\nMột dòng thêm cho T08-35.\n" },
    headers: { "if-match": bai.json?.etag },
  })
  ok(sua.ma === 200, "PUT sửa thân ⇒ 200", `trả ${sua.ma} ${JSON.stringify(sua.json ?? {}).slice(0, 120)}`)
  r = await goi(sv.cong, "GET", "/api/kho-delta")
  const sau = Object.fromEntries((r.json?.items ?? []).map((x) => [x.slug, x.sha_than]))
  ok(sau["bai-duyet"] !== undefined && sau["bai-duyet"] !== truoc["bai-duyet"],
    "sửa `bai-duyet` ⇒ `sha_than` của nó ĐỔI", `${truoc["bai-duyet"]} → ${sau["bai-duyet"]}`)
  ok(sau["bai-nhap"] === truoc["bai-nhap"], "bài không sửa ⇒ `sha_than` GIỮ")

  console.log("\n2 · GET /api/tim — proxy tới :8791/truy-hoi, khoá chiều web→truyhoi Ở LẠI SERVER\n")

  const t = await goi(sv.cong, "GET", "/api/tim?q=" + encodeURIComponent("bản nháp") + "&k=5&pl=video")
  ok(t.ma === 200, "trả 200", `trả ${t.ma}`)
  ok(JSON.stringify(t.json ?? {}) === JSON.stringify(KET_QUA_MAU),
    "trả NGUYÊN kết quả của THỢ (ket_qua · so_ban_ghi_trong_pham_vi · tong) — web không ghép, không lọc",
    JSON.stringify(t.json ?? {}).slice(0, 160))
  const p = truyhoi.nhan.find((x) => x.duong === "/truy-hoi")
  ok(p !== undefined && p.method === "POST", "`web` thật sự POST sang `truyhoi/truy-hoi`")
  ok(p?.headers["x-aud"] === "truyhoi", "gắn `x-aud: truyhoi` (M13-R6 — khoá dùng được nhiều đích thì đích nào cũng nhận)", String(p?.headers["x-aud"]))
  ok(p?.headers["x-khoa-dich-vu"] === KHOA_WEB_TRUYHOI,
    "gắn khoá CHIỀU web→truyhoi (`KHOA_WEB_TRUYHOI`) trong `x-khoa-dich-vu`", String(p?.headers["x-khoa-dich-vu"]))
  ok(p?.headers["x-khoa-loi"] === undefined,
    "KHÔNG gửi khoá chiều web→chungcat (`x-khoa-loi`) sang truyhoi — mỗi chiều một khoá (FR-047 L3)")
  let than = {}
  try { than = JSON.parse(p?.than ?? "{}") } catch { /* để FAIL ở dưới */ }
  ok(than.cau_hoi === "bản nháp", "`q` → `cau_hoi` nguyên văn (có dấu)", String(than.cau_hoi))
  ok(than.k === 5, "`k` → số 5, không phải chuỗi", String(than.k))
  ok(JSON.stringify(than.pham_vi?.pl) === JSON.stringify(["video"]), "`pl` → `pham_vi.pl` đúng khoá TANG", JSON.stringify(than.pham_vi))
  ok("nguon" in than && than.nguon === null,
    "khoá `nguon` CÓ MẶT và = null — web tìm trên cả kho, và nói ra điều đó (AC-5.3)")
  const tt = JSON.stringify(t.json ?? {}) + JSON.stringify(t.headers ?? {})
  ok(!tt.includes(KHOA_WEB_TRUYHOI) && !tt.includes(KHOA_WEB_CHUNGCAT),
    "không khoá nào lộ về client — phép đo nặng nhất")

  const kThieu = await goi(sv.cong, "GET", "/api/tim?q=" + encodeURIComponent("bản nháp"))
  const p2 = truyhoi.nhan.filter((x) => x.duong === "/truy-hoi").at(-1)
  let than2 = {}
  try { than2 = JSON.parse(p2?.than ?? "{}") } catch { /* để FAIL ở dưới */ }
  ok(kThieu.ma === 200 && Number.isInteger(than2.k) && than2.k > 0,
    "thiếu `k` ⇒ web khai MẶC ĐỊNH TƯỜNG MINH rồi gửi số (ui_flow §2c) — M13 không được mặc định",
    `ma=${kThieu.ma} k=${String(than2.k)}`)
  const qThieu = await goi(sv.cong, "GET", "/api/tim")
  ok(qThieu.ma === 400, "thiếu `q` ⇒ 400, không gọi THỢ với câu rỗng", `trả ${qThieu.ma}`)

  console.log("\n3 · AC3 · poke /reindex-poke sau ghi bài\n")
  console.log("  SKIP AC3 · endpoint `/reindex-poke` không có trong spec/model_flow M13 — chờ PM quyết (Q4, 2026-09-10). Không đo, không xanh rỗng.")

  console.log("\n4 · gocTho(ten) — cổng đọc theo TÊN từ dich-vu.json, hết hằng `chungcat`\n")

  const src = readFileSync(THO_CUA, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
  const cung = (src.match(/===\s*"chungcat"/g) ?? []).length
  ok(cung === 0, "`=== \"chungcat\"` trong tho-cua.mjs ⇒ 0 (Z6: một hằng, không hai)", `thấy ${cung}`)
  ok(!/8791|8790/.test(src), "không số cổng nào gõ tay trong tho-cua.mjs")
  const m = await goi(sv.cong, "GET", "/api/model")
  ok(m.ma === 200, "cửa cũ `GET /api/model` vẫn đi tới THỢ chungcat (gocTho(\"chungcat\"))", `trả ${m.ma}`)
  ok(chungcat.nhan.some((x) => x.duong === "/model") && !truyhoi.nhan.some((x) => x.duong === "/model"),
    "`/model` tới server chungcat giả, KHÔNG tới server truyhoi giả — hai tên, hai gốc")
  ok(!chungcat.nhan.some((x) => x.duong === "/truy-hoi"), "`/truy-hoi` KHÔNG tới chungcat")

  console.log("\n5 · THỢ truyhoi chết ⇒ 502, không treo\n")
  truyhoi.dung()
  const chet = await goi(sv.cong, "GET", "/api/tim?q=x&k=3")
  ok(chet.ma === 502, "truyhoi không nghe ⇒ 502", `trả ${chet.ma}`)
} finally {
  sv.dung()
  try { truyhoi.dung() } catch { /* đã đóng ở §5 */ }
  chungcat.dung()
}

chot("kho-delta năm trường · sha_than đổi theo thân · /api/tim mang đúng hai header, khoá ở lại server · gocTho theo tên")
