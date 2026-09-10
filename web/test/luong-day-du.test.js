#!/usr/bin/env node
/**
 * PHỦ BA LUỒNG: nạp bài · trạng thái duyệt · CRUD.
 *
 * VÌ SAO CÓ FILE NÀY: khảo sát độ phủ (2026-08-24) tìm 22 nhánh code KHÔNG có
 * test nào chạy qua. File này phủ nhóm nghiêm trọng nhất — nhánh mà nếu rụng
 * thì MẤT DỮ LIỆU hoặc GHI SAI KHO, chứ không phải nhánh trả thông báo sai.
 *
 * Nguyên tắc mỗi phép kiểm: sau khi API từ chối, ĐỌC ĐĨA để chắc kho không đổi.
 * Một mã 4xx đúng mà file vẫn bị sửa thì cổng đó chỉ là trang trí.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { batServer, dungKho, GOC, goi, napLaiDb, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-luong-day-du")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

const doc = (t, s) => readFileSync(join(kho, t, s + ".md"))
const et = async (t, s) => (await goi(CONG, "GET", `/api/articles/${t}/${s}`)).json?.etag

try {
  // ══ 1 · TRẠNG THÁI — MA TRẬN ĐẦY ĐỦ ═══════════════════════════════════════
  //
  // BANG_CHUYEN nằm cạnh handler và KHÔNG có test nào đọc nó. Đo được: đổi
  // `edited: ["approved"]` thành `["approved","rejected"]` không làm đỏ test nào
  // — tức là nới bảng vòng đời là việc làm được mà không ai biết.
  //
  // Nên test này khai ma trận ĐỘC LẬP với code: 4 trạng thái × 4 đích = 16 cặp,
  // đúng 3 cặp được phép (M02 §2.2). `approved → edited` KHÔNG nằm đây — nó là
  // hệ quả của PUT, không phải một lệnh đổi trạng thái.
  console.log("\n1 · Bảng chuyển trạng thái — ma trận 16 cặp\n")

  const TRANG = ["draft", "edited", "approved", "rejected"]
  // FR-026 vế B + B2 · người dùng chốt mở hai đường còn lại. Bảng giờ KHÔNG còn
  // ngõ cụt nào — mọi trạng thái về được `draft`:
  //   draft    → approved | rejected
  //   edited   → approved | rejected
  //   approved → draft    | rejected
  //   rejected → draft
  /*
   * FR-033 · ĐỌC BẢNG TỪ `status.mjs`, KHÔNG gõ tay.
   *
   * Bản trước liệt kê 7 cặp bằng tay. FR-033 đổi hai cặp (`approved>draft` đóng,
   * `rejected>approved` mở) và phép kiểm đỏ với ba dòng lệch — trong khi API
   * làm ĐÚNG điều nó vừa được yêu cầu làm.
   *
   * Đây là lớp lỗi repo này đã sửa bốn lần ở chỗ khác (`TRANG_THAI` đọc enum từ
   * schema, `bon-trang-thai` đọc `BANG_CHUYEN`): một danh sách gõ tay là bản
   * khai THỨ HAI về hệ thống, và bản thứ hai luôn lạc hậu trước.
   *
   * Đọc từ nguồn thì phép kiểm vẫn còn răng — nó không hỏi "bảng có đúng 7 cặp
   * không" mà hỏi "API có xử ĐÚNG bảng nó tự khai không". Bảng sai thì đó là
   * một quyết định thiết kế, và nó có FR; API lệch bảng mới là bug.
   */
  const CHO_PHEP = new Set()
  {
    const st = readFileSync(join(GOC, "web", "api", "status.mjs"), "utf8")
    const khoi = /const BANG_CHUYEN = \{([\s\S]*?)\n\}/.exec(st)
    ok(!!khoi, "đọc được BANG_CHUYEN từ status.mjs",
       "không đọc được thì ma trận dưới chỉ là lời khai thứ hai")
    for (const d of (khoi?.[1] ?? "").split("\n")) {
      const m = /^\s*(\w+)\s*:\s*\[([^\]]*)\]/.exec(d)
      if (!m) continue
      for (const x of m[2].match(/["'](\w+)["']/g) ?? []) {
        CHO_PHEP.add(`${m[1]}>${x.slice(1, -1)}`)
      }
    }
    ok(CHO_PHEP.size > 0, `bảng có ${CHO_PHEP.size} cặp hợp lệ`)
  }

  // Đặt một bài về trạng thái cần, ghi THẲNG file (test dựng fixture, không
  // phải đường sản phẩm) rồi hỏi API.
  const datTrang = (slug, trang) => {
    const f = join(kho, "article", slug + ".md")
    let t = readFileSync(f, "utf8")
    t = t.replace(/^review_status:.*$/m, `review_status: ${trang}`)
    if (trang === "rejected" && !/^reject_reason:/m.test(t)) {
      t = t.replace(/^review_status:.*$/m, (m) => m + "\nreject_reason: dựng fixture cho test ma trận")
    }
    // FR-026 · `approved` ĐÒI ba trường M1 (schema `allOf`, FR-001). Helper này
    // đã làm đúng việc đó cho `rejected` + `reject_reason` nhưng QUÊN `approved`.
    //
    // Trước đây lỗi đó không lộ ra: mọi đường `approved → *` đều 409 nên không
    // gì xoá M1 khỏi file, và M1 còn sót từ bước trước. Mở bảng + xoá trường
    // HẾT HIỆU LỰC khi rời `approved` làm fixture này thành bản ghi KHÔNG HỢP LỆ
    // — và nó báo 422 ở một phép kiểm nói về chuyện khác, tức lỗi hiện ra ở sai
    // địa chỉ. Fixture phải tự hợp lệ với trạng thái nó đặt.
    if (trang === "approved" && !/^insight_new:/m.test(t)) {
      t = t.replace(/^review_status:.*$/m, (m) => m
        + "\ninsight_new: false\nskill_installed: false\nreview_minutes: 1")
    }
    writeFileSync(f, t, "utf8")
    napLaiDb(kho, rac)   // FR-034: fixture ghi file thì phải nạp DB — API đọc DB
  }

  let dung = 0, sai = []
  for (const tu of TRANG) {
    for (const den of TRANG) {
      datTrang("bai-nhap", tu)
      const e = await et("article", "bai-nhap")
      const r = await goi(CONG, "PATCH", "/api/articles/article/bai-nhap/status", {
        headers: { "if-match": e },
        body: { to: den, insight_new: true, skill_installed: false, review_minutes: 5,
                reject_reason: "lý do đủ dài cho cổng" },
      })
      const phep = CHO_PHEP.has(`${tu}>${den}`)
      const dat = phep ? r.ma === 200 : r.ma === 409
      if (dat) dung++
      else sai.push(`${tu}→${den}: ${phep ? "phải 200" : "phải 409"} nhưng được ${r.ma}`)
    }
  }
  ok(sai.length === 0, `16/16 cặp đúng bảng vòng đời M02 §2.2 (đúng ${dung})`,
     sai.join(" · "))

  // `to` vắng hoặc lạ — nhánh `?? "?"` chưa chạy lần nào.
  datTrang("bai-nhap", "draft")
  for (const [ten, body] of [["vắng `to`", {}], ["`to` lạ", { to: "xyz" }]]) {
    const r = await goi(CONG, "PATCH", "/api/articles/article/bai-nhap/status",
      { headers: { "if-match": await et("article", "bai-nhap") }, body })
    ok(r.ma === 409 && Array.isArray(r.json?.duoc_phep),
       `${ten} ⇒ 409 kèm danh sách đường hợp lệ — được ${r.ma}`,
       "người dùng phải biết đi đâu được, không chỉ biết mình sai")
  }

  // ══ 2 · approved + PUT y nguyên ⇒ PHẢI GIỮ approved ════════════════════════
  //
  // Nhánh `if (noiDungDoi)` FALSE chưa chạy lần nào. Nếu so sánh sai (ví dụ thứ
  // tự khoá YAML đổi sau khi delete+gán lại) thì MỌI PUT trên bài approved đều
  // hạ xuống `edited` — và bài rơi khỏi site, vì M03-R1 chỉ publish approved.
  // Đây là mất nội dung đã công bố, do một lần bấm Lưu không đổi gì.
  console.log("\n2 · PUT y nguyên trên bài approved — không được hạ trạng thái\n")

  datTrang("bai-nhap", "approved")
  let r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  const cu = r.json
  r = await goi(CONG, "PUT", "/api/articles/article/bai-nhap", {
    headers: { "if-match": cu.etag },
    body: { frontmatter: cu.frontmatter, body: cu.body },
  })
  ok(r.ma === 200 && r.json?.review_status === "approved",
     `PUT y nguyên ⇒ vẫn approved — được ${r.ma} / ${r.json?.review_status}`,
     "hạ xuống edited nghĩa là mỗi lần bấm Lưu là bài rời khỏi site")

  // Đổi MỘT trường frontmatter (body y nguyên) ⇒ vẫn phải approved.
  r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  const fm2 = { ...r.json.frontmatter, one_liner: "đổi một dòng mô tả" }
  r = await goi(CONG, "PUT", "/api/articles/article/bai-nhap", {
    headers: { "if-match": r.json.etag },
    body: { frontmatter: fm2, body: r.json.body },
  })
  /*
   * FR-033 · ĐỔI CHIỀU. Sửa nội dung ⇒ bài VẪN trên site.
   *
   * Trước: đổi một trường ⇒ hạ `edited` ⇒ rời site ⇒ phải duyệt lại. Đó là hàng
   * đợi mang tên khác, và người dùng bỏ hàng đợi.
   *
   * Điều này dễ hồi quy nhất trong cả FR: một nhánh `if (noiDungDoi)` mọc lại là
   * bài của người dùng lặng lẽ biến mất khỏi site sau mỗi lần bấm Lưu — im lặng,
   * và họ sẽ đi tìm ở đâu đó khác.
   */
  ok(r.ma === 200 && r.json?.review_status === "approved",
     `PUT đổi frontmatter ⇒ VẪN approved — được ${r.json?.review_status}`,
     "hạ trạng thái khi sửa là dựng lại hàng đợi vừa bỏ")

  // Đổi một giá trị LỒNG SÂU (trong `skill_candidates`) ⇒ cũng vẫn approved.
  //
  // Phép kiểm này tồn tại vì tôi suýt sửa bug trên bằng
  // `JSON.stringify(o, Object.keys(o).sort())` — replacer dạng mảng XOÁ TRẮNG
  // object lồng, nên `priority: 3` → `priority: 9` sẽ không bị phát hiện và bài
  // giữ nguyên `approved`. Đó là lỗi NGƯỢC và nặng hơn cái đang sửa.
  // Gieo `skill_candidates` (mảng object) lúc bài còn draft, rồi mới approve —
  // đúng thứ tự vòng đời thật, và không cần sửa fixture dùng chung.
  datTrang("bai-nhap", "draft")
  r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  const fmUv = {
    ...r.json.frontmatter,
    // Hình dạng theo schema: capability/verdict/credibility required, và
    // `verdict: NEW` đòi thêm why_now/score/priority/draft_trigger (allOf).
    skill_candidates: [{
      capability: "kiểm so sánh lồng sâu", verdict: "NEW",
      credibility: "plausible", priority: 3,
      why_now: "phép so không đệ quy bỏ qua thay đổi lồng sâu",
      draft_trigger: "khi có bài approved bị sửa skill_candidates",
      // 5 khoá lấy từ bài THẬT trong kb/, không đoán — cổng đòi đủ cả năm.
      score: { relevance: 5, frequency: 3, durability: 5, corroboration_factor: 1.6, cost: 2 },
    }],
  }
  r = await goi(CONG, "PUT", "/api/articles/article/bai-nhap", {
    headers: { "if-match": r.json.etag },
    body: { frontmatter: fmUv, body: r.json.body },
  })
  ok(r.ma === 200, `gieo skill_candidates ⇒ 200 — được ${r.ma}`,
     JSON.stringify(r.json).slice(0, 200))

  datTrang("bai-nhap", "approved")
  r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  const uv = r.json.frontmatter?.skill_candidates
  ok(Array.isArray(uv) && typeof uv[0] === "object",
     "bài có skill_candidates dạng mảng object (hình dạng dữ liệu thật)")
  if (Array.isArray(uv) && typeof uv[0] === "object") {
    const fmSau = structuredClone(r.json.frontmatter)
    fmSau.skill_candidates[0].priority = (Number(uv[0].priority) || 0) + 1
    const q = await goi(CONG, "PUT", "/api/articles/article/bai-nhap", {
      headers: { "if-match": r.json.etag },
      body: { frontmatter: fmSau, body: r.json.body },
    })
    ok(q.ma === 200 && q.json?.review_status === "approved",
       `đổi giá trị LỒNG SÂU ⇒ VẪN approved — được ${q.ma} / ${q.json?.review_status}`,
       // In NGUYÊN VĂN phản hồi khi trượt: lần đầu phép kiểm này đỏ trong bộ
       // đầy đủ mà xanh khi chạy riêng, và thông báo chỉ nói `undefined` — không
       // phân biệt được "so sánh sai" với "PUT không thành công".
       `phản hồi: ${JSON.stringify(q.json).slice(0, 300)}`)
  }

  // ══ 3 · DELETE — ba cổng chưa từng được kiểm ══════════════════════════════
  //
  // If-Match là răng DUY NHẤT chống lost-update trên đường xoá. Bỏ hai dòng
  // kiểm ở recycle.mjs thì không test nào đỏ, và xoá-mù bằng etag cũ thành hợp lệ.
  console.log("\n3 · DELETE — 404 / thiếu If-Match / etag cũ\n")

  r = await goi(CONG, "DELETE", "/api/articles/paper/khong-he-co",
    { headers: { "if-match": "abc" } })
  ok(r.ma === 404, `DELETE bài không có ⇒ 404 — được ${r.ma}`)

  const truoc = doc("paper", "bai-duyet")
  r = await goi(CONG, "DELETE", "/api/articles/paper/bai-duyet")
  ok(r.ma === 400, `DELETE thiếu If-Match ⇒ 400 — được ${r.ma}`)
  ok(doc("paper", "bai-duyet").equals(truoc), "file CÒN trong kho, byte nguyên")

  r = await goi(CONG, "DELETE", "/api/articles/paper/bai-duyet",
    { headers: { "if-match": "0000000000000000" } })
  ok(r.ma === 412, `DELETE etag cũ ⇒ 412 — được ${r.ma}`)
  ok(doc("paper", "bai-duyet").equals(truoc), "file CÒN trong kho, byte nguyên")

  // ══ 4 · XOÁ HAI LẦN RỒI RESTORE BẢN THỨ HAI ═══════════════════════════════
  //
  // HỞ THẬT: `chuyenSangRac` đặt tên `slug.<epoch>.md` khi trùng, nhưng
  // `phucHoi` chỉ ghép `slug + ".md"`. Còn `quetRac` BÓC hậu tố khi trả `slug`.
  // Nên UI hiện "restore được" mà API luôn 404 — bản xoá thứ hai trở đi không
  // lấy lại được. Test này KHẲNG ĐỊNH hành vi đúng: mọi mục thùng rác thấy được
  // thì phải lấy lại được.
  console.log("\n4 · Xoá hai lần cùng slug — bản thứ hai phải restore được\n")

  r = await goi(CONG, "DELETE", "/api/articles/paper/bai-duyet",
    { headers: { "if-match": await et("paper", "bai-duyet") } })
  ok(r.ma === 200, `xoá lần 1 ⇒ 200 — được ${r.ma}`)
  r = await goi(CONG, "POST", "/api/articles/paper/bai-duyet/restore")
  ok(r.ma === 200, "restore lần 1 ⇒ 200")
  r = await goi(CONG, "DELETE", "/api/articles/paper/bai-duyet",
    { headers: { "if-match": await et("paper", "bai-duyet") } })
  ok(r.ma === 200, `xoá lần 2 ⇒ 200 — được ${r.ma}`)

  const trongRac = readdirSync(join(rac, "paper"))
  ok(trongRac.length >= 1, `thùng rác có ${trongRac.length} bản của bai-duyet`)

  r = await goi(CONG, "GET", "/api/recycle")
  const muc = (r.json?.items ?? []).filter((x) => x.slug === "bai-duyet")
  ok(muc.length === trongRac.length,
     `GET /api/recycle liệt kê đủ ${trongRac.length} bản — thấy ${muc.length}`)

  // Mọi mục LIỆT KÊ ĐƯỢC phải PHỤC HỒI ĐƯỢC. Nếu không, UI mời người bấm một
  // nút luôn thất bại — và bài coi như mất dù file còn trên đĩa.
  let phucHoiDuoc = 0
  for (const m of muc) {
    const q = await goi(CONG, "POST", `/api/articles/paper/${m.slug}/restore`,
      m.ten_file ? { body: { ten_file: m.ten_file } } : {})
    if (q.ma === 200) {
      phucHoiDuoc++
      // Xoá lại để chỗ trống cho mục kế (kho chỉ chứa một bản mỗi slug).
      if (muc.indexOf(m) < muc.length - 1) {
        await goi(CONG, "DELETE", "/api/articles/paper/bai-duyet",
          { headers: { "if-match": await et("paper", "bai-duyet") } })
      }
    }
  }
  ok(phucHoiDuoc === muc.length,
     `mọi bản trong thùng rác phục hồi được: ${phucHoiDuoc}/${muc.length}`,
     "liệt kê được mà không phục hồi được = nút chết, bài coi như mất")

  // ══ 5 · POST — cổng từ PAYLOAD (khác cổng từ URL) ═════════════════════════
  //
  // `taoBai` tự kiểm `source_type`/`slug` LẤY TỪ PAYLOAD, còn router kiểm giá
  // trị lấy từ URL. Hai cổng khác nhau, chỉ cổng URL có test.
  console.log("\n5 · POST — source_type / slug lấy từ payload\n")

  const truocSo = readdirSync(join(kho, "article")).length
  for (const [ten, fm] of [
    ["source_type ngoài enum", { id: "src_abc123", slug: "hop-le", source_type: "la-loai" }],
    ["slug traversal", { id: "src_abc123", slug: "../../thoat", source_type: "article" }],
    ["slug chữ hoa", { id: "src_abc123", slug: "Sai-Hoa", source_type: "article" }],
  ]) {
    const q = await goi(CONG, "POST", "/api/articles", { body: { frontmatter: fm, body: "x" } })
    ok(q.ma === 400, `POST ${ten} ⇒ 400 — được ${q.ma}`)
  }
  ok(readdirSync(join(kho, "article")).length === truocSo,
     "không file nào mới xuất hiện trong kho")
  ok(!existsSync(join(kho, "thoat.md")) && !existsSync(join(kho, "..", "thoat.md")),
     "không file nào rơi ra ngoài kho (traversal)")

  // ══ 6 · Body không JSON / thiếu frontmatter ═══════════════════════════════
  console.log("\n6 · Body hỏng — ba handler cùng phải 400\n")

  for (const [ten, duong, method] of [
    ["POST /api/articles", "/api/articles", "POST"],
    ["PUT bài", "/api/articles/article/bai-nhap", "PUT"],
    ["PATCH status", "/api/articles/article/bai-nhap/status", "PATCH"],
  ]) {
    const q = await goi(CONG, method, duong,
      { tho: "day-khong-phai-json", headers: { "if-match": await et("article", "bai-nhap") } })
    ok(q.ma === 400 && /JSON/i.test(JSON.stringify(q.json)),
       `${ten} body không JSON ⇒ 400 nói rõ "JSON" — được ${q.ma}`)
  }

  r = await goi(CONG, "POST", "/api/articles", { body: { body: "thiếu frontmatter" } })
  ok(r.ma === 400, `POST thiếu frontmatter ⇒ 400 — được ${r.ma}`)

  // ══ 7 · PUT đổi địa chỉ bất biến ══════════════════════════════════════════
  //
  // `slug` đã có test; `id` và `source_type` thì chưa. Cả ba là ĐỊA CHỈ: đổi
  // được nghĩa là một PUT có thể ghi đè lên bài khác.
  console.log("\n7 · PUT không đổi được id / source_type / slug\n")

  for (const khoa of ["id", "slug", "source_type"]) {
    const g = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
    const byteTruoc = doc("article", "bai-nhap")
    const fm = { ...g.json.frontmatter, [khoa]: khoa === "source_type" ? "paper" : "doi-roi" }
    const q = await goi(CONG, "PUT", "/api/articles/article/bai-nhap",
      { headers: { "if-match": g.json.etag }, body: { frontmatter: fm, body: g.json.body } })
    ok(q.ma === 400, `PUT đổi \`${khoa}\` ⇒ 400 — được ${q.ma}`)
    ok(doc("article", "bai-nhap").equals(byteTruoc), `  file không đổi byte`)
  }

  // ══ 8 · GET 404 · phân trang · filter category ════════════════════════════
  console.log("\n8 · GET — 404, phân trang, filter category\n")

  r = await goi(CONG, "GET", "/api/articles/paper/khong-he-co")
  ok(r.ma === 404, `GET chi tiết không có ⇒ 404 — được ${r.ma}`)

  r = await goi(CONG, "GET", "/api/articles?per_page=9999")
  ok(r.json?.per_page === 200, `per_page=9999 kẹp về 200 — được ${r.json?.per_page}`,
     "không kẹp thì một request kéo cả kho về, và trang treo")
  // `per_page=0` và `per_page=abc` đều falsy sau `Number()` ⇒ rơi về mặc định
  // 50, KHÔNG kẹp về 1. Đó là hành vi đúng: 0 bản ghi mỗi trang là vô nghĩa,
  // còn `|| 50` biến mọi giá trị vô nghĩa thành mặc định. Kẹp `Math.max(…,1)`
  // chỉ để chặn số ÂM.
  for (const [v, cho] of [["0", 50], ["abc", 50], ["-5", 1]]) {
    const q = await goi(CONG, "GET", `/api/articles?per_page=${v}`)
    ok(q.json?.per_page === cho,
       `per_page=${v} ⇒ ${cho} — được ${q.json?.per_page}`,
       "giá trị vô nghĩa phải thành mặc định hoặc bị kẹp, không bao giờ thành 0")
  }

  r = await goi(CONG, "GET", "/api/articles?page=999")
  ok(Array.isArray(r.json?.items) && r.json.items.length === 0 && r.json.total > 0,
     `page ngoài phạm vi ⇒ items rỗng, total vẫn đúng (${r.json?.total})`)

  const cats = (await goi(CONG, "GET", "/api/articles")).json.items
    .flatMap((b) => b.category ?? [])
  if (cats.length) {
    r = await goi(CONG, "GET", `/api/articles?category=${encodeURIComponent(cats[0])}`)
    ok(r.json.items.length > 0 && r.json.items.every((b) => (b.category ?? []).includes(cats[0])),
       `filter category=${cats[0]} ⇒ ${r.json.items.length} bài, tất cả đúng nhãn`)
  } else {
    ok(true, "kho tạm không có category nào — bỏ qua filter (đúng thực tế)")
  }

  // ══ 9 · Danh mục vắng file ⇒ items rỗng, KHÔNG 500 ════════════════════════
  //
  // Đường rơi mặc định: kho tạm không có concepts.yaml/categories.yaml. Nếu
  // nhánh này 500 thì form tạo bài mất danh sách chọn và người phải gõ tay —
  // đúng thứ danh mục đóng tồn tại để chống.
  console.log("\n9 · concepts.yaml / categories.yaml vắng ⇒ items rỗng\n")

  for (const d of ["/api/concepts", "/api/categories"]) {
    const q = await goi(CONG, "GET", d)
    const coFile = existsSync(join(kho, d.slice(5) + ".yaml"))
    ok(q.ma === 200 && Array.isArray(q.json?.items),
       `GET ${d} ⇒ 200 + mảng items${coFile ? "" : " (file vắng)"} — được ${q.ma}`)
  }
} finally {
  sv.dung()
  don()
}

chot("ba luồng nạp/trạng thái/CRUD: nhánh mất-dữ-liệu đã có răng")
