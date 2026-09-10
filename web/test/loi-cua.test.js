#!/usr/bin/env node
/**
 * T08-12b — cổng cho NĂM CỬA tài khoản C3–C7 (FR-047 §2, §3 V2–V8).
 *
 * ĐƠN VỊ TEST, viết TRƯỚC code (R5). Chạy trực tiếp trên lớp thao tác của
 * `dungchung.mjs` — KHÔNG dựng HTTP server: năm cửa này chưa đấu route lúc
 * test được viết, và điều đang đo là LUẬT (V2–V8), không phải đường ống HTTP.
 * Vế HTTP là AC riêng của `T08-12`, đo bằng `api-guard` + `npm test`.
 *
 * DB tạm dưới os.tmpdir() qua LOI_DB — không đụng `web/_loi.sqlite` thật.
 */
import { mkdtempSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { tmpdir } from "node:os"
import { join } from "node:path"

const tmp = mkdtempSync(join(tmpdir(), "loicua-"))
process.env.LOI_DB = join(tmp, "_loi.sqlite")
process.env.LOI_LUU = join(tmp, "_luu")
process.env.KHOA_DICH_VU = "khoa-dich-vu-rieng-cho-test"
process.env.KHOA_PHIEN = "khoa-session-KHAC-HAN"

const M = await import("../api/dungchung.mjs")

// FR-051 · bon cua da cam o tang thao tac. Tai khoan DAU TIEN di
// qua cua bootstrap (bang con rong) va SINH RA voi vai `chu`; moi loi
// goi sau do phai mang `boi`. Cua bootstrap TU DONG sau hang dau tien.
const ADMIN = M.loiTaoNguoiDung({ ten: "admin-bootstrap" })

let xau = 0
const ok = (dieu, nhan, them = "") => {
  console.log(`  ${dieu ? "ok  " : "SAI "} ${nhan}${them ? "  — " + them : ""}`)
  if (!dieu) xau++
}
const nem = (fn) => { try { fn(); return null } catch (e) { return e } }

// ── nền: một tài khoản + một mã mời còn hạn ───────────────────────────
const ai = M.loiTaoNguoiDung({ ten: "Đồng nghiệp A", boi: ADMIN })
const ma = M.loiCapMaMoi({ nguoi_dung_id: ai, phut: 60, boi: ADMIN })

console.log("\nV2 · danh tính do LÕI gán, KHÔNG từ payload (L1)\n")
{
  // Payload bịa `nguoi_dung_id` — cửa PHẢI bỏ qua nó và dùng chủ của mã.
  const ai2 = M.loiTaoNguoiDung({ ten: "B", boi: ADMIN })
  const r = M.loiBuocDinhDanh({
    kenh: "telegram", chat_id: "111", ma,
    nguoi_dung_id: ai2,          // ← bịa; phải bị LỘT
  })
  ok(r.nguoi_dung_id === ai,
    "C4 dùng chủ của MÃ, không dùng nguoi_dung_id trong payload",
    `được ${r.nguoi_dung_id}, chủ mã là ${ai}`)
}

console.log("\nV4 · ma_moi MỘT LẦN\n")
{
  const e = nem(() => M.loiBuocDinhDanh({ kenh: "telegram", chat_id: "222", ma }))
  ok(e !== null, "dùng LẠI mã đã tiêu ⇒ từ chối")
  const con = M.loiXemMaMoi(ma)
  ok(con && con.dung_luc !== null, "dung_luc đã đặt")
  const truoc = con.dung_luc
  nem(() => M.loiBuocDinhDanh({ kenh: "telegram", chat_id: "333", ma }))
  ok(M.loiXemMaMoi(ma).dung_luc === truoc,
    "dung_luc KHÔNG bị ghi đè lần hai — mất thời điểm dùng thật là mất vết audit")
}

console.log("\nV4b · mã HẾT HẠN bị từ chối dù chưa dùng\n")
{
  const ai3 = M.loiTaoNguoiDung({ ten: "C", boi: ADMIN })
  const maCu = M.loiCapMaMoi({ nguoi_dung_id: ai3, phut: -1, boi: ADMIN })
  const e = nem(() => M.loiBuocDinhDanh({ kenh: "telegram", chat_id: "444", ma: maCu }))
  ok(e !== null, "hết hạn ⇒ từ chối (hai điều kiện độc lập với dung_luc)")
}

console.log("\nV6 · C3 KHÔNG rò danh tính — hai ca phải GIỐNG HỆT\n")
{
  const la = M.loiTraDinhDanh({ kenh: "telegram", chat_id: "khong-ton-tai" })
  const chuaBuoc = M.loiTraDinhDanh({ kenh: "discord", chat_id: "111" })
  ok(JSON.stringify(la) === JSON.stringify(chuaBuoc),
    "chat_id LẠ và chat_id CÓ-nhưng-chưa-buộc trả cùng một thứ",
    `${JSON.stringify(la)} vs ${JSON.stringify(chuaBuoc)}`)

  const co = M.loiTraDinhDanh({ kenh: "telegram", chat_id: "111" })
  ok(co.nguoi_dung_id === ai, "ca ĐÃ buộc thì trả nguoi_dung_id")
  const khoa = Object.keys(co)
  ok(khoa.length === 1 && khoa[0] === "nguoi_dung_id",
    "và KHÔNG trả gì khác — không tên, không email", khoa.join(","))
}

console.log("\nV3 · thiếu danh tính ⇒ DENY, không nới (L2)\n")
{
  ok(nem(() => M.loiTraDinhDanh({ kenh: "telegram" })) !== null,
    "C3 thiếu chat_id ⇒ ném, KHÔNG trả cả bảng")
  ok(nem(() => M.loiBuocDinhDanh({ kenh: "telegram", chat_id: "555" })) !== null,
    "C4 thiếu mã ⇒ ném, không tự buộc")
  ok(nem(() => M.loiXemPhien("")) !== null, "C6 id rỗng ⇒ ném")
}

console.log("\nV7 · khoá dịch vụ RIÊNG, và `aud` được kiểm (L3)\n")
{
  ok(process.env.KHOA_DICH_VU !== process.env.KHOA_PHIEN,
    "hai khoá khác nhau trong env")
  ok(M.loiKiemKhoaDichVu({ khoa: process.env.KHOA_DICH_VU, aud: "loi" }) === true,
    "khoá đúng + aud đúng ⇒ qua")
  ok(M.loiKiemKhoaDichVu({ khoa: process.env.KHOA_PHIEN, aud: "loi" }) === false,
    "khoá SESSION KHÔNG mở được cửa dịch vụ (CVE-2025-41258)")
  ok(M.loiKiemKhoaDichVu({ khoa: process.env.KHOA_DICH_VU, aud: "khac" }) === false,
    "aud sai ⇒ chặn")
  ok(M.loiKiemKhoaDichVu({ khoa: "", aud: "loi" }) === false,
    "khoá RỖNG ⇒ chặn — fail-closed, không fail-open")
}

console.log("\nV6b · C6 trả danh tính nhưng KHÔNG trả ngu_canh\n")
{
  const pid = M.loiMoPhien({ nguoi_dung_id: ai, kenh: "telegram", ngu_canh: '{"bi":"mat"}' })
  const p = M.loiXemPhien(pid)
  ok(p.nguoi_dung_id === ai && p.het_han, "trả nguoi_dung_id + het_han")
  ok(!("ngu_canh" in p), "KHÔNG có ngu_canh trong phản hồi (FR-045 U6)")
}

console.log("\nAC-1.3 · thu hồi tài khoản ⇒ phiên hết hiệu lực ở lần dùng KẾ\n")
{
  const ai4 = M.loiTaoNguoiDung({ ten: "D", boi: ADMIN })
  const pid = M.loiMoPhien({ nguoi_dung_id: ai4, kenh: "web" })
  ok(M.loiXemPhien(pid) !== null, "trước thu hồi: phiên dùng được")
  M.loiThuHoi(ai4, { boi: ADMIN })
  ok(M.loiXemPhien(pid) === null, "sau thu hồi: phiên KHÔNG dùng được")
  ok(M.loiDemNguoiDung() > 0, "hàng nguoi_dung KHÔNG bị xoá (AC-1.2)")
}

console.log("\nV5 · audit_log APPEND-ONLY\n")
{
  M.loiGhiAudit({ hanh_dong: "thu-buoc", doi_tuong: "telegram", ok: false })
  const n = M.loiDemAudit()
  ok(n >= 1, "ghi được")
  ok(typeof M.loiSuaAudit !== "function" && typeof M.loiXoaAudit !== "function",
    "KHÔNG tồn tại hàm sửa/xoá audit")

  // dòng log KHÔNG chứa mã đã thử (M18-R2 · M17 testcases:68)
  M.loiGhiAudit({ hanh_dong: "thu-ma-sai", doi_tuong: "telegram", ok: false })
  const chuoi = JSON.stringify(M.loiDocAudit(100, { boi: ADMIN }))
  ok(!chuoi.includes(ma), "không dòng audit nào chứa giá trị mã mời")
}

console.log("\nV8 · ban_goc_ai bất biến\n")
{
  const j = M.loiTaoNhap({ nguoi_dung_id: ai, ban_goc_ai: "bản máy" })
  ok(nem(() => M.loiSuaBanGoc(j, "sửa trộm")) !== null || typeof M.loiSuaBanGoc !== "function",
    "không có đường sửa ban_goc_ai, hoặc nó ném")
  M.loiSuaNhap(j, "người sửa")
  ok(M.loiXemNhap(j).ban_goc_ai === "bản máy", "ban_goc_ai giữ nguyên sau khi sửa bản hiện tại")
}

console.log("\nM12 AC-1.3 · hàng nháp LUÔN nhap+draft, payload không đổi được\n")
{
  // Vì sao cổng này tồn tại: AC-1.3 nói *"payload có chuỗi `approved` cũng
  // không đổi được — và cổng phải chứng minh bằng cách GIEO một payload đòi
  // `approved` rồi ĐỌC LẠI hàng đã ghi"*. Đo lời khai của handler là đo sai
  // chỗ; đo hàng trong DB mới là đo thứ M12 phải dựa vào.
  const j = M.loiTaoNhap({ nguoi_dung_id: ai, ban_goc_ai: "bản máy" })
  const h = M.loiXemNhap(j)
  ok(h.trang_thai === "nhap", "trạng thái đầu là `nhap`")
  ok(h.review_status === "draft", "review_status là `draft` (cột mới — M12 AC-1.3)")

  // Lớp 1 · `loiTaoNhap` nhận ĐÚNG hai trường có tên ⇒ khoá lạ không tới INSERT.
  const j2 = M.loiTaoNhap({
    nguoi_dung_id: ai, ban_goc_ai: "bản máy 2",
    // ← payload đòi, phải bị BỎ.
    //
    // `da_duyet`, KHÔNG `da_gui` (T08-27): từ khi enum khớp `FR-046`, `da_gui`
    // bị `CHECK` chặn ⇒ phép kiểm sẽ XANH vì DDL từ chối giá trị, chứ không vì
    // `loiTaoNhap` lột nó. Một cổng xanh vì lý do sai là cổng không đo gì.
    // `da_duyet` là giá trị DDL SẼ NHẬN, nên thứ duy nhất giữ hàng ở `nhap` là
    // chữ ký hàm chỉ nhận hai trường có tên — đúng lớp 1 mà mục này đo.
    review_status: "approved", trang_thai: "da_duyet",
  })
  const h2 = M.loiXemNhap(j2)
  ok(h2.review_status === "draft", "payload đòi approved ⇒ hàng đọc lại vẫn draft")
  ok(h2.trang_thai === "nhap",
    "payload đòi `da_duyet` (giá trị DDL NHẬN) ⇒ hàng đọc lại vẫn `nhap` — " +
    "chữ ký hàm lột nó, không phải CHECK")

  // Lớp 2 · kể cả khi lớp 1 vỡ, DDL vẫn từ chối. CHECK là HẰNG, không phải enum.
  ok(nem(() => M.dungLoiDb((db) =>
    db.prepare("UPDATE nhap_chung_cat SET review_status='approved' WHERE job_ulid=?").run(j),
  )) !== null, "UPDATE thẳng SQL sang approved ⇒ CHECK chặn (cưỡng chế ở DDL)")
  ok(M.loiXemNhap(j).review_status === "draft", "sau lần UPDATE bị chặn, hàng vẫn draft")

  // `lan_gui` KHÔNG được là tên cột ở đây — nó có chủ ở M12 (spec §5.1: số lần
  // payload rời khỏi máy, trần 2, không reset). Cột của LÕI đếm việc khác.
  ok(!("lan_gui" in h), "không có cột `lan_gui` — tên đó thuộc bộ đếm egress của THỢ")
  ok("lan_gui_duyet" in h, "cột của LÕI tên `lan_gui_duyet`, không trùng nghĩa")

  /*
   * ── T08-27 / WO-043 · DDL phải KHỚP `FR-046 §1` ───────────────────────
   *
   * `FR-046 §1` (đã duyệt) khai bảng nháp:
   *   `nhap_chung_cat(job_ulid, ban_goc_ai, ban_hien_tai, khang_dinh_bi_tia,
   *                   trang_thai: nhap → da_sua → da_duyet | tra_lai, sua_luc)`
   *
   * Bản đầu của DDL này khai `nhap|da_gui|bo` và KHÔNG có
   * `khang_dinh_bi_tia`. Hai giá trị `da_gui`/`bo` không có nguồn — grep toàn
   * repo chỉ ra chính DDL đó và một dòng test của nó.
   *
   * Vì sao đo ở tầng DDL chứ không ở handler: `T08-22` sẽ có bốn cửa hành
   * động, và mỗi cửa là một chỗ có thể quên. `CHECK` là chỗ DUY NHẤT không
   * quên được — cùng khuôn `review_status` ở trên.
   */
  /*
   * ── T08-29 / FR-057 · giá trị THỨ NĂM: `da_bo` ────────────────────────
   *
   * `T03-94` đòi BỐN hành động (Duyệt · Sửa · Trả lại · **Xoá**) mà vòng đời
   * `FR-046 §1` không có giá trị nào nghĩa *"đã bỏ"*. Chủ dự án chốt lối (a):
   * thêm trạng thái, **KHÔNG xoá hàng** — `ban_goc_ai` là thứ tốn token model
   * để tạo, và là thứ duy nhất trả lời *"người đã sửa những gì"*.
   *
   * `bo` (trần) VẪN bị chặn ở vòng dưới: nó là một trong hai giá trị vô-nguồn
   * mà `T08-27` vừa dẹp. Tên mới là `da_bo`, cùng khuôn `da_sua`/`da_duyet`.
   */
  for (const tt of ["nhap", "da_sua", "da_duyet", "tra_lai", "da_bo"]) {
    ok(nem(() => M.dungLoiDb((db) =>
      db.prepare("UPDATE nhap_chung_cat SET trang_thai=? WHERE job_ulid=?").run(tt, j),
    )) === null, `\`trang_thai='${tt}'\` được nhận — đúng năm giá trị FR-046+FR-057`)
  }
  for (const tt of ["da_gui", "bo", "approved"]) {
    ok(nem(() => M.dungLoiDb((db) =>
      db.prepare("UPDATE nhap_chung_cat SET trang_thai=? WHERE job_ulid=?").run(tt, j),
    )) !== null, `\`trang_thai='${tt}'\` bị CHẶN — không nằm trong FR-046`)
  }
  // Trả bảng về trạng thái đầu: các phép kiểm sau đọc lại hàng này.
  M.dungLoiDb((db) =>
    db.prepare("UPDATE nhap_chung_cat SET trang_thai='nhap' WHERE job_ulid=?").run(j))

  ok("khang_dinh_bi_tia" in h,
    "cột `khang_dinh_bi_tia` tồn tại (FR-046 §1)",
    "T03-94 đòi hiện `⚠ đã tỉa N` TRƯỚC nút duyệt — không có cột thì không có " +
    "gì để hiện, và không hiện là NÓI DỐI người duyệt")
  ok("ly_do" in h,
    "cột `ly_do` tồn tại — ca TRẢ LẠI bắt kèm lý do (T08-22 AC3)")

  // Ghi rồi đọc lại: một cột có trong `SELECT` mà `XUAT_LOI` không liệt kê thì
  // nó vắng ở bản xuất, và bản xuất là thứ ADR-06 dùng để dựng lại DB.
  M.dungLoiDb((db) => db.prepare(
    "UPDATE nhap_chung_cat SET khang_dinh_bi_tia=?, ly_do=? WHERE job_ulid=?",
  ).run('{"so":2}', "thiếu địa chỉ", j))
  const h3 = M.loiXemNhap(j)
  ok(h3.khang_dinh_bi_tia === '{"so":2}', "đọc lại `khang_dinh_bi_tia` ra đúng giá trị")
  ok(h3.ly_do === "thiếu địa chỉ", "đọc lại `ly_do` ra đúng giá trị")

  // `review_status` KHÔNG bị kéo theo: `da_duyet` của `trang_thai` không có
  // nghĩa "đã vào kho". Duyệt = ghi FILE vào `kb/` + `dung_lai_db`, và từ giây
  // đó FILE là chân lý (`FR-046 §1` · `B-C1`).
  ok(M.loiXemNhap(j).review_status === "draft",
    "sau khi đổi `trang_thai`, `review_status` VẪN `draft` — hai vòng đời khác nhau")
}


console.log("\nT08-29 · di trú enum-5 BẤT ĐỘNG và GIỮ trigger\n")
{
  /*
   * `ALTER TABLE` không đổi được `CHECK` ⇒ `diTruLoi` dựng lại bảng. Hai thứ
   * chết IM LẶNG ở đường đó, và cổng này đo cả hai:
   *   · chạy lần HAI phải là no-op — không thì mỗi lần mở DB là một lần chép
   *     lại cả bảng, và một lần chép hỏng là mất dữ liệu.
   *   · trigger `ban_goc_ai` gắn với bảng CŨ và chết theo nó. Quên dựng lại là
   *     gỡ một bất biến của `FR-046` mà KHÔNG ai báo.
   *
   * Dựng một DB mang schema enum-4 BẰNG TAY (đúng thứ đang chạy thật), rồi cho
   * `dungLoiDb` mở nó — di trú chạy trong đó.
   */
  const d2 = mkdtempSync(join(tmpdir(), "ditru5-"))
  const duong = join(d2, "_loi.sqlite")
  const db0 = new DatabaseSync(duong)
  db0.exec(`CREATE TABLE nhap_chung_cat (
    job_ulid TEXT PRIMARY KEY, nguoi_dung_id INTEGER, ban_goc_ai TEXT NOT NULL,
    ban_hien_tai TEXT NOT NULL,
    trang_thai TEXT NOT NULL DEFAULT 'nhap'
      CHECK (trang_thai IN ('nhap','da_sua','da_duyet','tra_lai')),
    khang_dinh_bi_tia TEXT, ly_do TEXT,
    review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status = 'draft'),
    lan_gui_duyet INTEGER NOT NULL DEFAULT 0,
    tao_luc TEXT NOT NULL DEFAULT (datetime('now')),
    cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')))`)
  db0.prepare("INSERT INTO nhap_chung_cat (job_ulid, ban_goc_ai, ban_hien_tai) VALUES (?,?,?)")
    .run("cu-t0829", "bản máy", "bản máy")
  db0.close()

  const schema = () => M.dungLoiDb((db) => db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='nhap_chung_cat'",
  ).get()?.sql ?? "", { duong })

  const s1 = schema()
  ok(s1.includes("da_bo"), "di trú thêm `da_bo` vào `CHECK`", s1.slice(0, 120))
  const s2 = schema()
  ok(s1 === s2, "chạy LẦN HAI không đổi schema — di trú BẤT ĐỘNG")

  const hang = M.dungLoiDb((db) => db.prepare(
    "SELECT job_ulid, ban_goc_ai FROM nhap_chung_cat").all(), { duong })
  ok(hang.length === 1 && hang[0].ban_goc_ai === "bản máy",
    "hàng cũ đi qua di trú NGUYÊN VẸN", JSON.stringify(hang))

  const eTrig = nem(() => M.dungLoiDb((db) => db.prepare(
    "UPDATE nhap_chung_cat SET ban_goc_ai=? WHERE job_ulid=?").run("sửa trộm", "cu-t0829"),
  { duong }))
  ok(eTrig !== null,
    "trigger `ban_goc_ai` bất biến VẪN chặn sau di trú — trigger gắn bảng CŨ và "
    + "chết theo nó; quên dựng lại là gỡ một bất biến mà không ai báo")

  const eBo = nem(() => M.dungLoiDb((db) => db.prepare(
    "UPDATE nhap_chung_cat SET trang_thai='da_bo' WHERE job_ulid=?").run("cu-t0829"),
  { duong }))
  ok(eBo === null, "DB đã di trú nhận `da_bo`")
}

console.log("\nADR-06 (c) · xuất BỐN bảng, KHÔNG xuất hai bảng bí mật\n")
{
  const d = join(tmp, "_luu")
  // KHÔNG đòi `ghi === 3` ở đây nữa: từ khi `sauGhiLoi()` chạy sau mỗi phép
  // ghi, ba file đã tồn tại TRƯỚC dòng này — và đó chính là điều đáng có.
  // Phép đo đúng là "ba file CÓ MẶT và nội dung khớp DB", không phải "lần gọi
  // này ghi mấy file". Bản đầu đòi 3 và ĐỎ ngay khi backup bắt đầu tự chạy —
  // một cổng đo THAO TÁC thay vì đo KẾT QUẢ.
  /*
   * T08-28 / WO-046 · BỐN bảng, không ba.
   *
   * `audit_loi` từng KHÔNG có đường backup, nên một lần dựng lại DB xoá vết
   * audit IM LẶNG — mà audit log tồn tại đúng để chống điều đó. `WO-044` phải
   * xuất tay 9 hàng ra thư mục tạm vì không có đường chính thức.
   *
   * Và cổng này từng đo `=== 3` — nó đo *"ba bảng ĐÃ KHAI"*, không đo *"mọi
   * bảng ĐÁNG backup"*. Con số lấy từ chính thứ bị đo (`#tự-khai`), nên nó
   * xanh mãi dù bảng thứ tư không ai cứu.
   */
  const a = M.xuatLoi({ thuMuc: d })
  ok(a.bang === 4, "khai đúng 4 bảng phải-xuất", `khai ${a.bang}`)
  const b = M.xuatLoi({ thuMuc: d })
  ok(b.ghi === 0, "chạy LẦN HAI ghi 0 file — điểm bất động, không sinh diff git rác")

  const { readdirSync, readFileSync } = await import("node:fs")
  const ten = readdirSync(d).sort()
  ok(ten.length === 4, "đúng 4 file, không hơn", ten.join(" "))
  ok(ten.includes("audit-loi.yaml"), "có `audit-loi.yaml`", ten.join(" "))
  const tat = ten.map((x) => readFileSync(join(d, x), "utf8")).join("")

  ok(tat.includes("Đồng nghiệp A"), "CÓ tên người dùng — thứ cần khôi phục")
  ok(tat.includes("111"), "CÓ chat_id đã buộc")
  ok(!tat.includes(ma), "KHÔNG chứa mã mời (bí mật)")

  const pidMoi = M.loiMoPhien({ nguoi_dung_id: ai, kenh: "web" })
  M.xuatLoi({ thuMuc: d })
  const tat2 = readdirSync(d).map((x) => readFileSync(join(d, x), "utf8")).join("")
  ok(!tat2.includes(pidMoi), "KHÔNG chứa id phiên (session)")

  // Cột tường minh: `ma_da_dung` LÀ chính mã mời, và CỐ Ý ngoài danh sách cột.
  // Bản đầu dùng `SELECT *` và mã đi THẲNG vào file — ca này bắt được ngay
  // lượt chạy đầu. Đúng bài học `S8`: liệt kê cột, đừng `SELECT *`.
  ok(!tat2.includes("ma_da_dung"), "cột `ma_da_dung` không ra file")

  // Vết audit PHẢI có trong bản lùi — đó là cả lý do WO-046 tồn tại. Đo bằng
  // một hành động THẬT, không bằng "file có mặt": một file rỗng cũng có mặt.
  M.loiGhiAudit({ hanh_dong: "thu-cho-cong-t0828", doi_tuong: "x", ok: true })
  M.xuatLoi({ thuMuc: d })
  const tatAudit = readdirSync(d).map((x) => readFileSync(join(d, x), "utf8")).join("")
  ok(tatAudit.includes("thu-cho-cong-t0828"),
    "dòng audit vừa ghi CÓ trong bản lùi — không chỉ 'file có mặt'")
}


console.log("\nV1 · C1 ép `draft` VÔ ĐIỀU KIỆN — đo trên MÃ NGUỒN của handler\n")
{
  const { readFileSync } = await import("node:fs")
  const src = readFileSync(new URL("../api/loi-cua.mjs", import.meta.url), "utf8")
  const c1 = src.slice(src.indexOf("export async function cuaNhap("),
                       src.indexOf("export async function cuaNhapChungCat("))

  ok(/delete fm\.review_status/.test(c1), "C1 LỘT review_status khỏi payload")
  ok(/fm\.review_status\s*=\s*"draft"/.test(c1), "C1 đặt draft, không đặt gì khác")
  ok(!/"approved"/.test(c1), "C1 KHÔNG có literal `approved` ở đâu cả")

  // Thứ tự: xoá TRƯỚC khi đặt. Ngược lại thì một payload khai `review_status`
  // sau `origin` vẫn lọt — cùng lớp lỗi "hai bước, một khe" của M18-R1.
  ok(c1.indexOf("delete fm.review_status") < c1.indexOf('fm.review_status = "draft"'),
    "xoá TRƯỚC khi đặt — không thì payload vẫn lọt qua khe giữa hai bước")

  // B-B1: cửa của NGƯỜI vẫn đặt approved, và đó là ĐÚNG. Hai đường hai luật.
  const art = readFileSync(new URL("../api/articles.mjs", import.meta.url), "utf8")
  ok(/review_status\s*=\s*"approved"/.test(art),
    "cửa của NGƯỜI (`taoBai`) VẪN đặt approved — không bị C1 kéo theo")
}

console.log("\nV3b · cả bảy cửa đều qua `quaCong` — không cửa nào quên\n")
{
  const { readFileSync } = await import("node:fs")
  const src = readFileSync(new URL("../api/loi-cua.mjs", import.meta.url), "utf8")
  const ten = [...src.matchAll(/export (?:async )?function (cua\w+)\(/g)].map((m) => m[1])
  ok(ten.length === 7, `đúng 7 handler xuất khẩu`, ten.join(" "))

  // Bất biến THẬT: `quaCong` phải đứng trước mọi thao tác DỮ LIỆU (`loi*`),
  // không phải "trong 400 ký tự đầu".
  //
  // Bản đầu đo bằng VỊ TRÍ (`slice(i, i+400)`) + regex `quaCong(req, res)`.
  // Nó ĐỎ ngay khi FR-049 đổi hai handler thành `quaCong(req, res, {ma})` và
  // đọc body trước đó — trong khi mã vẫn ĐÚNG: đọc một body CÓ TRẦN không phải
  // chạm dữ liệu. Cổng đang đo HÌNH DẠNG, không đo LUẬT.
  const thieu = ten.filter((n) => {
    const i = src.indexOf("function " + n + "(")
    const than = src.slice(i, src.indexOf("\n}", i))
    const iCong = than.search(/quaCong\(/)
    if (iCong < 0) return true
    // Thao tác dữ liệu đầu tiên. Bỏ `loiChoThu` — nó nằm TRONG `quaCong`.
    const m = than.match(/\b(loi(?!ChoThu)[A-Z]\w*|ghiSauValidate|docBai)\(/)
    return m ? than.indexOf(m[0]) < iCong : false
  })
  ok(thieu.length === 0, "quaCong đứng TRƯỚC mọi thao tác dữ liệu",
    thieu.join(" ") || "0 thiếu")
}

console.log("\nM18-R3 (ĐỔI VAI sau FR-051) · `vai` chỉ đọc ở MỘT chokepoint\n")
{
  // ⚠️ AC NÀY ĐÃ ĐỔI NGHĨA 2026-09-02, không bị xoá.
  //
  // Bản cũ đòi: *"bốn `vai` khác nhau ⇒ CÙNG một kết quả"* — tức nó cưỡng chế
  // `vai` KHÔNG có tác dụng, đúng khi `vai` là một cột trống.
  //
  // `FR-051` cho `vai` tác dụng thật. Nên bản cũ **phải** đỏ — và nó đỏ bằng
  // cách NÉM, vì `CHECK` mới từ chối giá trị bịa mà nó gieo.
  //
  // Nghĩa mới: `vai` được đọc ở **đúng một** chokepoint (`duocLam`), và mọi
  // khác biệt hành vi giữa hai vai đi qua **chokepoint đó**, không qua một `if`
  // rải rác. Cổng `Y3` của `phan-quyen.test.js` đo vế đếm; ở đây đo vế HÀNH VI.
  const a = M.loiTaoNguoiDung({ ten: "vai-A", boi: ADMIN })
  const b = M.loiTaoNguoiDung({ ten: "vai-B", boi: ADMIN })
  ok(M.loiXemNguoiDung(a).vai === M.loiXemNguoiDung(b).vai,
    "hai tài khoản mới ⇒ CÙNG vai mặc định")

  // Cùng vai ⇒ cùng kết quả, từng việc. Đây là vế bản cũ giữ được.
  const viecs = ["sua-bai-nguoi-khac", "moi-nguoi-moi", "thu-hoi", "xem-audit",
                 "nap-nguon", "viec-khong-ton-tai"]
  const khac = viecs.filter((v) => M.duocLam(a, v) !== M.duocLam(b, v))
  ok(khac.length === 0, "cùng `vai` ⇒ cùng kết quả trên MỌI việc",
    khac.join(" ") || "0 lệch")

  // Khác vai ⇒ khác kết quả, NHƯNG chỉ qua `duocLam`. Thao tác KHÔNG khai
  // quyền thì hai vai vẫn như nhau — chứng minh không có `if (vai)` nào lẻ.
  M.loiDatVai(b, "chu", { boi: ADMIN })
  ok(M.duocLam(a, "thu-hoi") === false && M.duocLam(b, "thu-hoi") === true,
    "khác `vai` ⇒ khác kết quả ở việc CÓ khai quyền")

  const maA = M.loiCapMaMoi({ nguoi_dung_id: a, boi: ADMIN })
  const maB = M.loiCapMaMoi({ nguoi_dung_id: b, boi: ADMIN })
  const thu = (ma, cid) => {
    try { M.loiBuocDinhDanh({ kenh: "tg-r3", chat_id: cid, ma }); return "OK" }
    catch (e) { return "NEM" }
  }
  ok(thu(maA, "r3-a") === thu(maB, "r3-b"),
    "thao tác KHÔNG khai quyền ⇒ hai vai VẪN như nhau (không `if (vai)` lẻ)")

  // `vai = null` không còn dựng được — DDL chặn. Ca fail-open của
  // CVE-2026-47713 nay bị cấm bằng CẤU TRÚC, không bằng phép kiểm.
  ok(nem(() => M.loiDatVai(a, null, { boi: ADMIN })) !== null,
    "`vai = null` bị DDL chặn — fail-open không dựng được nữa")
}

console.log("\nADR-06 (c) · backup TỰ CHẠY — không phải một hàm chờ ai gọi\n")
{
  // Một `xuatLoi()` không ai gọi thì ADR-06 (c) là một HÀM, không phải một
  // BACKUP. Ca này đo đúng chuyện đó, vì nó là loại lỗ im lặng nhất: mọi test
  // khác vẫn xanh, và người ta chỉ biết vào ngày ổ cứng hỏng.
  const { readFileSync } = await import("node:fs")
  const d = join(tmp, "_luu")
  const doc = (f) => readFileSync(join(d, f), "utf8")

  const truoc = doc("nguoi-dung.yaml")
  const aiMoi = M.loiTaoNguoiDung({ ten: "Tự-động-E", boi: ADMIN })
  ok(doc("nguoi-dung.yaml") !== truoc && doc("nguoi-dung.yaml").includes("Tự-động-E"),
    "tạo tài khoản ⇒ bản lùi TỰ cập nhật, không cần gọi xuatLoi bằng tay")

  const maE = M.loiCapMaMoi({ nguoi_dung_id: aiMoi, boi: ADMIN })
  const ddTruoc = doc("dinh-danh-kenh.yaml")
  M.loiBuocDinhDanh({ kenh: "tg-auto", chat_id: "auto-1", ma: maE })
  ok(doc("dinh-danh-kenh.yaml") !== ddTruoc, "buộc chat_id ⇒ bản lùi TỰ cập nhật")

  // Cấp mã KHÔNG được làm đổi bản lùi — `ma_moi` là bảng KHÔNG xuất.
  const trc = doc("nguoi-dung.yaml")
  M.loiCapMaMoi({ nguoi_dung_id: aiMoi, boi: ADMIN })
  ok(doc("nguoi-dung.yaml") === trc,
    "cấp mã mời KHÔNG đổi bản lùi — ma_moi là bảng không-xuất")

  // Và mã vừa cấp KHÔNG có trong bất kỳ file lùi nào.
  const tat = ["nguoi-dung.yaml", "dinh-danh-kenh.yaml", "nhap-chung-cat.yaml"]
    .map(doc).join("")
  ok(!tat.includes(maE), "mã mời không rò vào bản lùi qua đường tự-xuất")
}


console.log("\nFR-050 cách 2 · KHÔNG dữ liệu cá nhân nào vào git\n")
{
  const { execSync } = await import("node:child_process")
  const theo = execSync("git ls-files", { cwd: join(import.meta.dirname, "..", "..") })
    .toString().split("\n")

  ok(!theo.some((f) => f.startsWith("web/_luu/")),
    "`web/_luu/` KHÔNG có file nào được git theo dõi")
  ok(!theo.some((f) => f.startsWith("_backup/")),
    "`_backup/` KHÔNG có file nào được git theo dõi")

  // X6 · đích mặc định phải là `_backup/` ở GỐC, không phải `web/_luu`.
  const { readFileSync } = await import("node:fs")
  const dc = readFileSync(new URL("../api/dungchung.mjs", import.meta.url), "utf8")
  const m = dc.match(/LUU_LOI\s*=\s*\(\)\s*=>\s*process\.env\.LOI_LUU\s*\?\?\s*join\((\w+),\s*"([^"]+)"\)/)
  ok(m !== null, "`LUU_LOI` có dạng đọc-được")
  ok(m && m[2] === "_backup", "đích mặc định là `_backup`", m ? m[2] : "?")
  ok(m && m[1] === "GOC", "và nó ở GỐC REPO, không trong `web/`", m ? m[1] : "?")
}

console.log("\nX7 · mất backup thì NÓI RA — không im lặng như 'chưa mời ai'\n")
{
  // Sau cách 2, một `clone` mới chạy được VÀ KHÔNG CÓ TÀI KHOẢN NÀO — và đó
  // trông GIỐNG HỆT một hệ thống mới tinh. Phải phân biệt được:
  //   "chưa mời ai"            → 0 tài khoản, 0 file lùi
  //   "backup không có ở đây"  → 0 tài khoản, NHƯNG DB đã từng có
  const { existsSync, mkdtempSync } = await import("node:fs")
  const rong = mkdtempSync(join(tmpdir(), "luu-rong-"))
  ok(typeof M.trangThaiBanLui === "function",
    "có hàm phân biệt hai ca đó")
  if (typeof M.trangThaiBanLui === "function") {
    const t = M.trangThaiBanLui({ thuMuc: rong })
    ok(t.co_file === false, "thư mục rỗng ⇒ `co_file: false`")
    ok(typeof t.canh_bao === "string" && t.canh_bao.length > 0,
      "và có câu cảnh báo, không phải im lặng", t.canh_bao?.slice(0, 60))
  }
}


console.log("\nX6 · tài liệu khai ĐÚNG cách 2 — không còn câu nói backup=git\n")
{
  const { readFileSync } = await import("node:fs")
  const goc = join(import.meta.dirname, "..", "..")
  const env = readFileSync(join(goc, "04_system", "env_plan.md"), "utf8")
  const adr = readFileSync(join(goc, "04_system", "adr.md"), "utf8")

  // Câu "backup riêng: vẫn thừa" phải HẾT tồn tại — sau FR-050 nó SAI.
  ok(!/backup riêng`?: \*\*vẫn thừa\*\*/.test(env),
    "`env_plan` không còn câu 'backup riêng: vẫn thừa'")
  ok(/HẾT THỪ/.test(env), "và nói rõ nó HẾT THỪA")

  // ADR-06 phải nói vế commit-vào-git đã bị lật.
  ok(/FR-050/.test(adr), "`ADR-06` nhắc `FR-050`")
  ok(/LẬT vế/.test(adr) || /LẬT/.test(adr),
    "và nói rõ vế nào bị lật")

  // Cả hai phải mang câu đánh đổi — đây là thứ người ta cần đọc TRƯỚC khi
  // tin rằng git đã phủ.
  //
  // Đo bằng HAI mảnh chữ rời, không bằng một regex khớp cả câu: bản đầu tôi
  // viết một regex ba nhánh cho ba cách viết hoa/đậm khác nhau, và nó ĐỎ OAN
  // trên `env_plan` — file ĐÃ CÓ câu đó, chỉ khác cách in đậm. Một phép đo
  // khớp-cả-câu vỡ vì một dấu sao.
  for (const [ten, s] of [["env_plan", env], ["adr", adr]]) {
    const hoa = s.toLowerCase()
    ok(hoa.includes("_backup") && hoa.includes("mất tài khoản"),
      `${ten} mang câu đánh đổi "mất ổ = mất tài khoản"`)
  }
}


console.log("\nENV · bí mật của LÕI KHÔNG lọt xuống tiến trình con\n")
{
  // ⚠️ Do duoc TRUOC khi sua: ba cho trong web/ truyen `{ ...process.env }`
  // xuong Python con — dungchung.mjs:432 · :482 · server.mjs:117.
  // Voi `.env` theo service (04_system/env-theo-service.md), dieu do nghia la
  // MOI BI MAT CUA LOI chay vao tien trinh validate.py/xuat_kho.py — va tien
  // trinh do chay ma co `--fix` GHI VAO KHO.
  //
  // "Mot .env cho moi service" KHONG DU neu ranh gioi tien trinh RO XUONG DUOI.
  const { readFileSync } = await import("node:fs")

  // 1 · khong con cho nao spread ca process.env xuong con
  const dc = readFileSync(new URL("../api/dungchung.mjs", import.meta.url), "utf8")
  const sv = readFileSync(new URL("../server.mjs", import.meta.url), "utf8")
  for (const [ten, s] of [["dungchung.mjs", dc], ["server.mjs", sv]]) {
    const xau = [...s.matchAll(/env:\s*\{\s*\.\.\.process\.env/g)]
    ok(xau.length === 0, `${ten}: 0 chỗ spread \`...process.env\` vào env con`,
      `thấy ${xau.length}`)
  }

  // 2 · va no la ALLOWLIST, khong denylist — CVE-2018-8007 di vong mot blacklist
  ok(/const ENV_CHO_CON = \[/.test(dc), "`ENV_CHO_CON` là một MẢNG liệt kê (allowlist)")
  // Do HANH VI, khong do CHU: ban dau toi regex chu "denylist"/"blacklist" va
  // no khop CHINH BINH LUAN cua toi trong `envCon` (dong giai thich vi sao
  // dung allowlist). Lan thu SAU trong phien mot literal trong chu thich pha
  // mot phep dem cua chinh toi.
  //
  // Bat bien THAT: `envCon` dung xong KHONG con bien nao ngoai allowlist. Do
  // bang cach dat mot bien la roi doi no VANG MAT — khong doc ma nguon.
  const cuLa = process.env.MOT_BIEN_LA_KHONG_TRONG_ALLOWLIST
  try {
    process.env.MOT_BIEN_LA_KHONG_TRONG_ALLOWLIST = "x"
    ok(M.envCon().MOT_BIEN_LA_KHONG_TRONG_ALLOWLIST === undefined,
      "biến ngoài allowlist ⇒ VẮNG trong env con (không phải 'bị xoá sau')")
  } finally {
    if (cuLa === undefined) delete process.env.MOT_BIEN_LA_KHONG_TRONG_ALLOWLIST
    else process.env.MOT_BIEN_LA_KHONG_TRONG_ALLOWLIST = cuLa
  }

  // 3 · HANH VI: dat hai bi mat roi doi chung KHONG co trong env con
  const cu = { dv: process.env.KHOA_DICH_VU, ph: process.env.KHOA_PHIEN }
  try {
    process.env.KHOA_DICH_VU = "BI-MAT-A"
    process.env.KHOA_PHIEN = "BI-MAT-B"
    process.env.BANK_TOKEN = "BI-MAT-C"
    const e = M.envCon()
    const ro = Object.entries(e).filter(([, v]) => String(v).startsWith("BI-MAT-"))
    ok(ro.length === 0, "3 bí mật đặt vào process.env ⇒ 0 lọt xuống con",
      ro.map(([k]) => k).join(",") || "0 rò")
    // Nhung bien tien trinh con THAT SU can thi phai co.
    ok(e.PYTHONIOENCODING === "utf-8", "`PYTHONIOENCODING` vẫn được truyền")
    ok(e.PATH !== undefined, "`PATH` vẫn được truyền — thiếu nó không tìm được interpreter")
  } finally {
    process.env.KHOA_DICH_VU = cu.dv
    process.env.KHOA_PHIEN = cu.ph
    delete process.env.BANK_TOKEN
  }

  // 4 · ghi de van hoat dong — kho tam cua test phai tro dung cho
  const e2 = M.envCon({ KB_DIR: "/tmp/x" })
  ok(e2.KB_DIR === "/tmp/x", "ghi đè `KB_DIR` vẫn hoạt động")
}

console.log(xau ? `\n${xau} lỗi` : "\npass · BẢY cửa C1–C7 giữ đủ V1–V8 + xuất ADR-06 (c)")
process.exit(xau ? 1 : 0)
