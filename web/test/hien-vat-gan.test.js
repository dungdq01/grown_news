#!/usr/bin/env node
/**
 * T08-30 — cửa HẸP `POST /api/articles/<type>/<slug>/hien-vat`.
 *
 * Chủ dự án chọn lối 1 (2026-09-04): một cửa LÕI mới chỉ để GẮN hiện vật vào
 * bản ghi. Cửa `PUT` sẵn có nhận cả frontmatter và thân, nên một THỢ gọi được
 * nó là một THỢ ghi được `category`, `credibility_max`, thân bài — và `M01-R2`
 * cấm máy điền `credibility_max`.
 *
 * ⇒ Bề mặt HẸP là thứ duy nhất làm câu *"THỢ không sửa được bản ghi"* còn đúng
 * sau khi mở một cửa cho THỢ. Cổng này đo đúng cái hẹp đó.
 *
 * ĐỎ_KHI  cửa nhận `category`/`credibility_max`/thân bài · gắn được một `sha256`
 *         chưa có trong bảng `media` · gọi hai lần thêm hai entry · hiện vật cũ
 *         đổi một byte · lời gọi không khoá đi qua
 * XANH_KHI chỉ thêm được một con trỏ, bất động, và mọi trường lạ bị LỘT
 */
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const tmp = mkdtempSync(join(tmpdir(), "hienvat-"))
const { kho, rac } = dungKho("hienvat")
const schema = dungSchema("hienvat")
const KHOA = "khoa-dich-vu-cho-cong-t0830"

const sv = await batServer({
  kho, rac, schema,
  loi: { LOI_DB: join(tmp, "_loi.sqlite"), LOI_LUU: join(tmp, "_luu"),
    KHOA_DICH_VU: KHOA, KHOA_PHIEN: "khoa-phien-khac-t0830" },
})

const KHOA_H = { "x-khoa-dich-vu": KHOA, "x-aud": "loi" }

try {
  console.log("\n0 · Nền — một bản ghi video + một hiện vật đã nạp\n")

  // Bản ghi nào cũng được, miễn nó có thật trong kho tạm. Lấy bản ghi ĐẦU TIÊN
  // mà kho trả về: gõ một slug cứng là gõ một thứ fixture có thể đổi.
  const ds = await goi(sv.cong, "GET", "/api/articles?n=50")
  // Khoá là `items` — đọc từ phản hồi THẬT, không đoán tên.
  const bans = ds.json?.items ?? []
  const ban = Array.isArray(bans) ? bans[0] : null
  ok(ban != null, "kho tạm có ít nhất một bản ghi để gắn vào",
    JSON.stringify(ds.json ?? {}).slice(0, 160))
  const type = ban?.source_type ?? ban?.type
  const slug = String(ban?.slug ?? "").split("/").pop()

  // Nạp một `.vtt` thật qua cửa hiện vật — cửa gắn KHÔNG nạp byte, nó chỉ gắn.
  const vtt = "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nxin chào\n"
  const nap = await goi(sv.cong, "POST", "/api/articles/media", {
    headers: { "content-type": "text/vtt", "x-ten-goc": "thu-t0830.vtt" },
    tho: vtt,
  })
  ok(nap.ma === 200 || nap.ma === 201, "nạp `.vtt` qua cửa hiện vật ⇒ 2xx",
    `trả ${nap.ma} ${JSON.stringify(nap.json)}`)
  const sha = nap.json?.sha256 ?? nap.json?.sha
  ok(/^[0-9a-f]{64}$/.test(String(sha)), "cửa nạp trả `sha256` 64 hex", JSON.stringify(nap.json))

  console.log("\n1 · Đòi khoá dịch vụ — THỢ gọi, không phải trình duyệt\n")

  const khongKhoa = await goi(sv.cong, "POST",
    `/api/articles/${type}/${slug}/hien-vat`, { body: { sha256: sha, mime: "text/vtt" } })
  ok(khongKhoa.ma === 401 || khongKhoa.ma === 403,
    "không khoá ⇒ 401/403", `trả ${khongKhoa.ma}`)

  console.log("\n2 · Gắn ⇒ `media[]` +1, hiện vật cũ NGUYÊN BYTE\n")

  const truoc = await goi(sv.cong, "GET", `/api/articles/${type}/${slug}`)
  const mediaTruoc = truoc.json?.frontmatter?.media ?? []

  const g1 = await goi(sv.cong, "POST", `/api/articles/${type}/${slug}/hien-vat`, {
    headers: KHOA_H,
    body: { sha256: sha, mime: "text/vtt", ten_goc: "thu-t0830.vtt",
      kieu_moc: "la_asr", model_asr: "gemini-2.5-flash-lite" },
  })
  ok(g1.ma === 200, "gắn ⇒ 200", `trả ${g1.ma} ${JSON.stringify(g1.json)}`)

  const sau = await goi(sv.cong, "GET", `/api/articles/${type}/${slug}`)
  const mediaSau = sau.json?.frontmatter?.media ?? []
  ok(mediaSau.length === mediaTruoc.length + 1,
    "`media[]` THÊM đúng một entry", `${mediaTruoc.length} → ${mediaSau.length}`)
  ok(mediaSau.some((m) => m.sha256 === sha), "entry mới mang đúng `sha256`")
  // `AC-V6` vế HAPPY: hiện vật cũ nguyên TỪNG BYTE, không chỉ "còn có mặt".
  ok(JSON.stringify(mediaSau.slice(0, mediaTruoc.length))
    === JSON.stringify(mediaTruoc),
    "hiện vật CŨ nguyên từng byte — `media[]` chỉ THÊM, không viết lại")

  console.log("\n3 · BẤT ĐỘNG — gọi lần hai không thêm entry thứ hai\n")

  const g2 = await goi(sv.cong, "POST", `/api/articles/${type}/${slug}/hien-vat`, {
    headers: KHOA_H, body: { sha256: sha, mime: "text/vtt", ten_goc: "thu-t0830.vtt" },
  })
  ok(g2.ma === 200, "gọi lần hai ⇒ 200 (bất động, không phải lỗi)", `trả ${g2.ma}`)
  const sau2 = await goi(sv.cong, "GET", `/api/articles/${type}/${slug}`)
  ok((sau2.json?.frontmatter?.media ?? []).length === mediaSau.length,
    "`media[]` KHÔNG dài thêm — một cửa thêm entry mỗi lần retry là một cửa "
    + "biến lỗi mạng thành lịch sử giả")

  console.log("\n4 · Cửa HẸP — mọi trường lạ bị LỘT\n")

  const bay = await goi(sv.cong, "POST", `/api/articles/${type}/${slug}/hien-vat`, {
    headers: KHOA_H,
    body: {
      sha256: sha, mime: "text/vtt",
      // Bảy thứ cửa này KHÔNG được nhận. `credibility_max` nặng nhất —
      // `M01-R2` cấm MÁY điền nó.
      review_status: "approved", trang_thai: "da_duyet",
      credibility_max: "verified", category: ["bịa"], concepts: ["bịa"],
      one_liner: "một câu THỢ tự viết", body: "thân bài THỢ tự ghi",
    },
  })
  ok(bay.ma === 200, "payload mang trường lạ ⇒ vẫn 200 (LỘT, không từ chối)",
    `trả ${bay.ma}`)
  const ct = await goi(sv.cong, "GET", `/api/articles/${type}/${slug}`)
  const fm = ct.json?.frontmatter ?? {}
  ok(fm.review_status !== "approved" || truoc.json?.frontmatter?.review_status === "approved",
    "`review_status` KHÔNG bị cửa này đổi")
  ok(fm.credibility_max === truoc.json?.frontmatter?.credibility_max,
    "`credibility_max` giữ nguyên — `M01-R2`: máy không điền nó",
    `${truoc.json?.frontmatter?.credibility_max} → ${fm.credibility_max}`)
  ok(JSON.stringify(fm.category) === JSON.stringify(truoc.json?.frontmatter?.category),
    "`category` giữ nguyên")
  ok(fm.one_liner === truoc.json?.frontmatter?.one_liner, "`one_liner` giữ nguyên")
  ok(ct.json?.body === truoc.json?.body, "THÂN BÀI giữ nguyên từng byte")

  console.log("\n5 · `sha256` chưa có trong bảng `media` ⇒ 422\n")

  const la = await goi(sv.cong, "POST", `/api/articles/${type}/${slug}/hien-vat`, {
    headers: KHOA_H, body: { sha256: "0".repeat(64), mime: "text/vtt" },
  })
  ok(la.ma === 422, "sha lạ ⇒ 422 — cửa này GẮN, không nạp byte", `trả ${la.ma}`)

  console.log("\n6 · `kieu_moc` chỉ nhận hai giá trị của DDL\n")

  const kmLa = await goi(sv.cong, "POST", `/api/articles/${type}/${slug}/hien-vat`, {
    headers: KHOA_H, body: { sha256: sha, mime: "text/vtt", kieu_moc: "bia-dat" },
  })
  ok(kmLa.ma === 422, "`kieu_moc` lạ ⇒ 422 (DDL chỉ có `la_asr`|`nguoi_sua`)",
    `trả ${kmLa.ma}`)
} catch (e) {
  console.log("\n[cổng] lỗi:", String(e?.message ?? e))
  if (sv.loi) console.log("[server stderr]\n" + sv.loi())
  throw e
} finally {
  sv.dung()
}

chot("cửa gắn hiện vật: hẹp · bất động · lột mọi trường lạ")
