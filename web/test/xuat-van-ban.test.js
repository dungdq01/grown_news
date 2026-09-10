/**
 * T08-33 · CỬA XUẤT văn bản — md · txt · docx · srt.
 *
 * Nguyên tắc chốt (chủ dự án 2026-09-06): **chỉ xuất được dạng mà nội dung
 * THẬT SỰ có.** Nội dung ta giữ dưới dạng VĂN BẢN xuất đa dạng được; file
 * NHỊ PHÂN người tải lên thì "tải xuống" nghĩa là TRẢ LẠI ĐÚNG BYTE ĐÃ NẠP.
 */
import { readFileSync } from "node:fs"
import { batServer, dungKho, goi, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-xuat-kb")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

const BANG = JSON.parse(readFileSync(
  new URL("../../core/assets/xuat-dang.json", import.meta.url), "utf8"))

try {
  console.log("\n1 · Bảng khai là NGUỒN SỰ THẬT chung\n")
  ok(BANG.theo_loai && BANG.dang, "có `theo_loai` + `dang`")
  ok((BANG.theo_loai["tai-lieu"] || []).join() === "goc",
    "tài liệu nhị phân CHỈ có `goc`",
    "bày `docx` cho một PDF là bày một bản DỰNG LẠI mà người nhận tưởng là gốc")
  ok((BANG.theo_loai.article || []).includes("goc"),
    "bai viet CO `goc` — nguyen file .md kem frontmatter",
    "chu du an chot 2026-09-06: `md` la THAN BAI, `goc` la NGUYEN FILE — "
    + "nguoi mang ban ghi sang kho khac can frontmatter")
  ok((BANG.theo_loai.transcript || []).includes("srt"),
    "transcript có `srt`")

  console.log("\n2 · Cửa xuất bài viết\n")
  let r = await goi(CONG, "GET", "/api/xuat/article/bai-nhap?dang=md")
  ok(r.ma === 200, `md trả 200 — được ${r.ma}`)
  const md = String(r.tho ?? r.text ?? "")
  ok(md.includes("##"), "md giữ NGUYÊN VĂN ký hiệu markdown")

  r = await goi(CONG, "GET", "/api/xuat/article/bai-nhap?dang=txt")
  const txt = String(r.tho ?? r.text ?? "")
  ok(r.ma === 200 && !/^#{1,6}\s/m.test(txt) && !/\*\*/.test(txt),
    "txt LỘT ký hiệu markdown, giữ chữ")

  r = await goi(CONG, "GET", "/api/xuat/article/bai-nhap?dang=goc")
  const goc = String(r.tho ?? "")
  ok(r.ma === 200 && goc.startsWith("---"),
    "goc: NGUYEN file — mo dau bang frontmatter")
  ok(goc.includes("id:") && !md.startsWith("---"),
    "goc CO frontmatter, md thi KHONG — hai thu khac nhau, hai ten")

  console.log("\n3 · Dạng ngoài bảng ⇒ 422 KỂ TÊN dạng được phép\n")
  r = await goi(CONG, "GET", "/api/xuat/article/bai-nhap?dang=xlsx")
  ok(r.ma === 422, `dạng lạ ⇒ 422 — được ${r.ma}`)
  const loi = String(r.json?.loi ?? r.tho ?? "")
  ok(/md/.test(loi) && /txt/.test(loi),
    "câu 422 KỂ TÊN dạng được phép",
    "nói 'không hợp lệ' mà không kể tên thì người gọi phải đoán")

  r = await goi(CONG, "GET", "/api/xuat/tai-lieu/bai-nhap?dang=docx")
  ok(r.ma === 422, "tài liệu nhị phân xin docx ⇒ 422")

  console.log("\n4 · Tên file tải xuống\n")
  r = await goi(CONG, "GET", "/api/xuat/article/bai-nhap?dang=md")
  const cd = String(r.headers?.["content-disposition"] ?? "")
  ok(/attachment/.test(cd) && /bai-nhap\.md/.test(cd),
    `Content-Disposition đúng tên — được ${cd.slice(0, 60)}`)

  console.log("\n5 · docx là ZIP hợp lệ, có document.xml\n")
  //
  // Không mở `.docx` bằng thư viện đọc — kiểm HÌNH DẠNG là đủ và rẻ: `.docx`
  // là một zip, và mọi zip mở đầu bằng bốn byte PK 03 04. Một file "docx"
  // không phải zip thì Word từ chối mở, và đó đúng là thứ cần chặn.
  {
    const rr = await fetch(`http://127.0.0.1:${CONG}/api/xuat/article/bai-nhap?dang=docx`)
    const buf = Buffer.from(await rr.arrayBuffer())
    ok(rr.status === 200, `docx trả 200 — được ${rr.status}`)
    ok(buf.length > 500, `docx có thân thật — ${buf.length} byte`)
    ok(buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 3 && buf[3] === 4,
      "docx là ZIP hợp lệ (bốn byte đầu PK 03 04)")
    ok(buf.includes(Buffer.from("word/document.xml")),
      "zip chứa `word/document.xml`")
    ok(/attachment; filename="bai-nhap\.docx"/.test(
      rr.headers.get("content-disposition") ?? ""), "tên file .docx đúng")
  }

  console.log("\n6 · .vtt → .srt và .txt\n")
  {
    const { vttSangSrt, vttSangTxt } = await import("../api/xuat-cua.mjs")
    const vtt = "WEBVTT\n\n00:00:01.500 --> 00:00:03.250\nXin chào.\n\n"
      + "00:00:03.400 --> 00:00:05.000\nDòng hai.\n"
    const srt = vttSangSrt(vtt)
    ok(/^1\n00:00:01,500 --> 00:00:03,250\nXin chào\./.test(srt),
      "srt: số cue + mốc dùng dấu PHẨY",
      "SRT dùng phẩy cho mili-giây; dùng chấm thì trình phát nhận file mà "
      + "không hiện phụ đề — hỏng IM LẶNG")
    ok(/\n2\n/.test(srt), "srt đánh số cue TĂNG DẦN")
    ok(!/WEBVTT/.test(srt), "srt không mang dòng `WEBVTT`")
    const t2 = vttSangTxt(vtt)
    ok(!/-->/.test(t2) && /Xin chào\./.test(t2), "txt bỏ mốc giờ, giữ chữ")
  }

  console.log("\n7 · Nháp đóng dấu ở ĐẦU FILE, bài đã duyệt thì KHÔNG\n")
  {
    const { dauNhap } = await import("../api/xuat-cua.mjs")
    const d = dauNhap({ ban_hien_tai:
      '---\nnguon: [video/x]\nanalyzed_at: 2026-09-06\nchi_dan: "tóm cho dev"\n---\n\n# Bài\n' })
    ok(/^BẢN NHÁP — chưa duyệt/.test(d), "dấu mở đầu bằng 'BẢN NHÁP — chưa duyệt'")
    ok(/video\/x/.test(d), "dấu mang NGUỒN")
    ok(/tóm cho dev/.test(d), "dấu mang CHỈ DẪN",
      "một bản chưng theo yêu cầu riêng phải được chấm bằng đúng yêu cầu đó")
    const r2 = await goi(CONG, "GET", "/api/xuat/article/bai-nhap?dang=txt")
    ok(!/BẢN NHÁP/.test(String(r2.tho ?? "")), "bài trong KHO không mang dấu nháp")
  }

  chot()
} finally {
  await sv.dung?.()
  don?.()
}
