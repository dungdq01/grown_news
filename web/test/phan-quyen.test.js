#!/usr/bin/env node
/**
 * T08-16b — phân quyền hai vai (`FR-051` Y1–Y6).
 *
 * ĐƠN VỊ TEST, viết TRƯỚC code (R5).
 *
 * ⚠️ File này ĐẢO CHIỀU một cổng đang xanh. `M18 AC-6.1` hôm nay đòi *"bốn
 * `vai` khác nhau ⇒ CÙNG một kết quả"* — tức nó cưỡng chế `vai` KHÔNG có tác
 * dụng. Sau `FR-051`, `vai` CÓ tác dụng, nên `AC-6.1` phải **đổi nghĩa**:
 * từ *"vai không phải cổng"* sang *"vai chỉ được đọc ở đúng một chokepoint"*.
 *
 * Sửa AC, KHÔNG xoá cổng. Xoá một cổng vì nó đỏ là cách luật biến mất.
 */
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const tmp = mkdtempSync(join(tmpdir(), "phanquyen-"))
process.env.LOI_DB = join(tmp, "_loi.sqlite")
process.env.LOI_LUU = join(tmp, "_backup")

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
const nem = (fn) => { try { fn(); return null } catch (e) { return e } }

console.log("\nY1 · `vai` là enum ĐÓNG\n")
{
  const ai = M.loiTaoNguoiDung({ ten: "A", boi: ADMIN })
  ok(nem(() => M.loiDatVai(ai, "linh-tinh", { boi: ADMIN })) !== null,
    "`vai` ngoài enum ⇒ bị DDL từ chối")
  ok(nem(() => M.loiDatVai(ai, "chu", { boi: ADMIN })) === null, "`chu` được nhận")
  // Can mot `chu` THU HAI truoc khi ha `ai` — khong thi CHAN ADMIN CUOI (Y10)
  // ban dung. Ban dau ca nay khong co, va no DO sau khi Y10 duoc cai: cong Y10
  // dung, ca Y1 thieu tien de.
  const ai2 = M.loiTaoNguoiDung({ ten: "A2", boi: ADMIN })
  M.loiDatVai(ai2, "chu", { boi: ai })
  ok(nem(() => M.loiDatVai(ai, "dong_nghiep", { boi: ai2 })) === null,
    "`dong_nghiep` được nhận (khi còn chủ dự án khác)")
}

console.log("\nY2 · `null` BỊ CẤM, mặc định là vai ÍT quyền nhất\n")
{
  const ai = M.loiTaoNguoiDung({ ten: "B", boi: ADMIN })
  ok(M.loiXemNguoiDung(ai).vai === "dong_nghiep",
    "hàng mới mặc định `dong_nghiep`", M.loiXemNguoiDung(ai).vai)
  ok(M.loiDemVaiNull() === 0, "0 hàng `vai IS NULL`", String(M.loiDemVaiNull()))
  ok(nem(() => M.loiDatVai(ai, null, { boi: ADMIN })) !== null, "đặt `null` ⇒ bị từ chối")

  // Fail-CLOSED: mặc định là vai ÍT quyền nhất, không phải nhiều nhất.
  // CVE-2026-47713 hỏng theo chiều ngược: thiếu danh tính thì trả TẤT CẢ.
  ok(M.duocLam(ai, "moi-nguoi-moi") === false,
    "và vai mặc định KHÔNG mời được người mới")
}

console.log("\nY4 · DENY mặc định — `viec` chưa khai ⇒ false\n")
{
  const chu = M.loiTaoNguoiDung({ ten: "Chủ", boi: ADMIN })
  M.loiDatVai(chu, "chu", { boi: ADMIN })
  ok(M.duocLam(chu, "viec-chua-ai-khai") === false,
    "chủ dự án CŨNG không làm được một `viec` chưa khai")
  ok(M.duocLam(chu, "moi-nguoi-moi") === true, "nhưng làm được việc đã khai")

  // Thêm một thao tác mới mà quên khai quyền ⇒ nó KHÔNG CHẠY ĐƯỢC, chứ không
  // phải AI CŨNG CHẠY ĐƯỢC. Đây là cả điểm của fail-closed.
  ok(M.duocLam(chu, "") === false, "`viec` rỗng ⇒ false")
  ok(M.duocLam(null, "moi-nguoi-moi") === false, "không danh tính ⇒ false")
}

console.log("\nMa trận FR-051 §6 — hai vai, bốn việc\n")
{
  const chu = M.loiTaoNguoiDung({ ten: "Chủ 2", boi: ADMIN })
  M.loiDatVai(chu, "chu", { boi: ADMIN })
  const dn = M.loiTaoNguoiDung({ ten: "Đồng nghiệp", boi: ADMIN })

  for (const viec of ["sua-bai-nguoi-khac", "moi-nguoi-moi", "thu-hoi", "xem-audit"]) {
    ok(M.duocLam(chu, viec) === true, `chủ dự án ✅ ${viec}`)
    ok(M.duocLam(dn, viec) === false, `đồng nghiệp ❌ ${viec}`)
  }

  // Nạp nguồn: CẢ HAI được — M05-R1 lo phần "dừng ở draft".
  ok(M.duocLam(dn, "nap-nguon") === true, "đồng nghiệp ✅ nạp nguồn (dừng `draft`)")
}

console.log("\nY5 · `B-B1` nguyên vẹn — KHÔNG đi qua bảng quyền\n")
{
  // `duyet-bai` KHÔNG được là một `viec` trong bảng quyền. Nếu nó ở đó thì
  // B-B1 thành một ô on/off, và một cờ tắt được B-B1 là một cờ sẽ bị tắt
  // (FR-051 §7a).
  const dc = readFileSync(new URL("../api/dungchung.mjs", import.meta.url), "utf8")
  const i = dc.indexOf("QUYEN")
  const bang = i >= 0 ? dc.slice(i, dc.indexOf("}", i)) : ""
  ok(!/duyet[-_]?bai/i.test(bang), "`duyet-bai` KHÔNG có trong bảng quyền")

  const chu = M.loiTaoNguoiDung({ ten: "Chủ 3", boi: ADMIN })
  M.loiDatVai(chu, "chu", { boi: ADMIN })
  ok(M.duocLam(chu, "duyet-bai") === false,
    "kể cả chủ dự án cũng KHÔNG duyệt qua `duocLam` — B-B1 ở MÃ, không ở bảng")
}

console.log("\nY3 · ĐÚNG MỘT chỗ ĐỌC `vai` để quyết định\n")
{
  // Bất biến: đúng MỘT chỗ trong `web/api/**` đọc giá trị `vai` ra để quyết
  // định. Đo bằng `.vai` (truy cập thuộc tính sau khi SELECT), không bằng một
  // danh sách toán tử.
  //
  // Bản đầu đo `vai ===` và `WHERE vai =`. Nó ra **0 chỗ** trong khi `duocLam`
  // rõ ràng CÓ đọc — vì cài đặt dùng `cho.includes(h.vai)`. Cổng khớp CÚ PHÁP
  // thay vì đo BẤT BIẾN, nên nó đỏ trên một cài đặt đúng và sẽ **xanh** trên
  // một cài đặt sai viết bằng cú pháp khác. Lần thứ ba trong phiên.
  const api = ["dungchung.mjs", "loi-cua.mjs", "articles.mjs", "router.mjs",
               "danhmuc.mjs", "recycle.mjs", "status.mjs", "cong-module.mjs"]
  const cho = []
  for (const f of api) {
    const s = readFileSync(new URL("../api/" + f, import.meta.url), "utf8")
    for (const m of s.matchAll(/\.vai\b/g)) {
      // Bỏ chỗ nằm trong bình luận — một literal trong chú thích đã phá phép
      // đếm hai lần rồi (`cac-man-con-lai:117`, rồi T08-12).
      const dong = s.slice(0, m.index).split("\n").pop()
      if (dong.trimStart().startsWith("*") || dong.includes("//")) continue
      cho.push(f + ":" + s.slice(0, m.index).split("\n").length)
    }
  }
  ok(cho.length === 1, "đúng 1 chỗ đọc `.vai` để quyết định",
    cho.join(" ") || "0 chỗ")
  ok(cho[0] !== undefined && cho[0].startsWith("dungchung.mjs"),
    "và nó ở `dungchung.mjs` (chokepoint)", cho[0] ?? "-")
}

console.log("\nY7 · đổi `vai` ghi audit (FR-051 §7b)\n")
{
  const ai = M.loiTaoNguoiDung({ ten: "C", boi: ADMIN })
  const truoc = M.loiDemAudit()
  M.loiDatVai(ai, "chu", { boi: ADMIN })
  ok(M.loiDemAudit() > truoc, "đổi vai ⇒ audit tăng",
    `${truoc} → ${M.loiDemAudit()}`)
}


console.log("\nY8 · audit_loi APPEND-ONLY bằng CẤU TRÚC, không bằng lời khai\n")
{
  // Ban dau ham `loiGhiAudit` co mot BINH LUAN viet "audit_loi khong co duong
  // sua". Do la LOI KHAI: bang do la bang thuong, UPDATE/DELETE chay duoc.
  // `audit_log` cua kho co trigger tu truoc — khuon nam cach do MOT FILE.
  M.loiGhiAudit({ hanh_dong: "y8-mau", doi_tuong: "x", ok: true })
  const nem = (sql) => {
    try { M.dungLoiDb((db) => db.exec(sql)); return null } catch (e) { return e }
  }
  ok(nem("UPDATE audit_loi SET hanh_dong='doi' WHERE stt=1") !== null,
    "UPDATE bị chặn")
  ok(nem("DELETE FROM audit_loi WHERE stt=1") !== null, "DELETE bị chặn")
  // Cua thu BA: `INSERT OR REPLACE` do duoc la di vong ca hai trigger tren.
  ok(nem("INSERT OR REPLACE INTO audit_loi (stt,hanh_dong,ok) VALUES (1,'de',1)") !== null,
    "INSERT OR REPLACE bị chặn — cửa thứ ba, hai trigger kia KHÔNG phủ")
  ok(nem("INSERT OR IGNORE INTO audit_loi (stt,hanh_dong,ok) VALUES (1,'ig',1)") !== null,
    "INSERT OR IGNORE bị chặn — im lặng bỏ hàng tệ hơn báo lỗi")
  // Nhung APPEND phai qua — mot bang audit khong ghi duoc thi vo dung.
  const truoc = M.loiDemAudit()
  M.loiGhiAudit({ hanh_dong: "y8-them", ok: true })
  ok(M.loiDemAudit() === truoc + 1, "append VẪN qua — không chặn oan")
}

console.log("\nY9 · vết đổi quyền nói AI ĐÃ đổi, không chỉ ai BỊ đổi\n")
{
  const chu = M.loiTaoNguoiDung({ ten: "Y9-chu", boi: ADMIN })
  M.loiDatVai(chu, "chu", { boi: ADMIN })
  const bi = M.loiTaoNguoiDung({ ten: "Y9-bi", boi: ADMIN })
  M.loiDatVai(bi, "chu", { boi: chu })

  const d = M.loiDocAudit(50, { boi: ADMIN }).find((x) => x.hanh_dong === "doi-vai" && x.nguoi_dung_id === bi)
  ok(d !== undefined, "có bản ghi `doi-vai`")
  ok(d?.boi === chu, "`boi` = người ĐÃ đổi", `boi=${d?.boi} chu=${chu}`)
  ok(d?.nguoi_dung_id === bi, "`nguoi_dung_id` = người BỊ đổi", `${d?.nguoi_dung_id} vs ${bi}`)
  // Hai truong PHAI khac nhau o ca nay — neu chung bang nhau thi cot `boi`
  // dang chep lai cot kia, tuc no khong tra loi cau hoi nao moi.
  ok(d?.boi !== d?.nguoi_dung_id, "hai trường KHÁC nhau — `boi` không chép lại `nguoi_dung_id`")
}

console.log("\nY10 · KHÔNG hạ/thu hồi được chủ dự án CUỐI CÙNG\n")
{
  // Khong co chan nay thi `loiDatVai(chuDuyNhat, "dong_nghiep")` de lai 0 vai
  // `chu` hoat dong — va DENY mac dinh lam trang thai do KHONG TU KHOI PHUC
  // DUOC: khong ai moi duoc ai, khong ai doi duoc vai. Chi con SQL tho.
  const { mkdtempSync } = await import("node:fs")
  const t2 = mkdtempSync(join(tmpdir(), "y10-"))
  const cu = { db: process.env.LOI_DB, luu: process.env.LOI_LUU }
  process.env.LOI_DB = join(t2, "_loi.sqlite")
  process.env.LOI_LUU = join(t2, "_backup")
  try {
    const M2 = await import(`../api/dungchung.mjs?y10=${t2.length}`)
    // Tai khoan DAU TIEN di qua cua bootstrap va SINH RA voi vai `chu` —
    // khong can (va khong the) goi loiDatVai de nang no len.
    const chu = M2.loiTaoNguoiDung({ ten: "duy nhat" })
    ok(M2.loiXemNguoiDung(chu).vai === "chu",
      "tai khoan DAU TIEN sinh ra voi vai `chu` (cua bootstrap)")
    const e1 = (() => { try { M2.loiDatVai(chu, "dong_nghiep", { boi: chu }); return null } catch (e) { return e } })()
    ok(e1 !== null, "hạ vai chủ dự án DUY NHẤT ⇒ ném")
    const e2 = (() => { try { M2.loiThuHoi(chu, { boi: chu }); return null } catch (e) { return e } })()
    ok(e2 !== null, "thu hồi chủ dự án DUY NHẤT ⇒ ném")
    ok(M2.loiXemNguoiDung(chu).vai === "chu", "và vai KHÔNG bị đổi")

    // Co chu THU HAI thi ha duoc — chan phai la "cuoi cung", khong phai "moi chu".
    const chu2 = M2.loiTaoNguoiDung({ ten: "chu hai", boi: chu })
    M2.loiDatVai(chu2, "chu", { boi: chu })
    const e3 = (() => { try { M2.loiDatVai(chu, "dong_nghiep", { boi: chu2 }); return null } catch (e) { return e } })()
    ok(e3 === null, "có chủ THỨ HAI thì hạ được — không chặn oan")
  } finally {
    process.env.LOI_DB = cu.db
    process.env.LOI_LUU = cu.luu
  }
}


console.log("\nY11 · bốn cửa ĐÃ CẮM — và đo ở tầng THAO TÁC, không tầng route\n")
{
  // Ban dau ca nay do "co route nao goi duocLam khong" va bao 0. Do la phep do
  // SAI TANG sau khi chu du an chot "cam ca 4 cua" (2026-09-03):
  //
  //   3 trong 4 `viec` (moi-nguoi-moi · thu-hoi · xem-audit) CHUA CO ROUTE NAO
  //   — man admin chua dung (M18 screens: []). Cam o route nghia la de ba lo ho
  //   toi ngay dung man, va ngay do ai dung route se phai NHO cam.
  //
  // => Cam trong HAM (`epQuyen`), goi tu nam thao tac quan tri. Route moi khong
  //    the bo qua vi no khong di vong duoc.
  const { readFileSync } = await import("node:fs")
  const dc = readFileSync(new URL("../api/dungchung.mjs", import.meta.url), "utf8")

  // `epQuyen` phai goi `duocLam` — neu no tu quyet thi bang QUYEN bi bo qua.
  const iEp = dc.indexOf("function epQuyen(")
  const thanEp = dc.slice(iEp, dc.indexOf("\n}", iEp))
  ok(iEp > 0, "`epQuyen` tồn tại")
  ok(/duocLam\(/.test(thanEp), "và nó gọi `duocLam` — không tự quyết")

  // FAIL-CLOSED: thieu danh tinh => NEM, khong phai cho qua.
  ok(/throw new Error/.test(thanEp), "thiếu danh tính ⇒ NÉM (fail-closed)")

  // Dem so THAO TAC da cam. Bon `viec` + doi vai = nam cho.
  const soCam = [...dc.matchAll(/^\s*epQuyen\("/gm)].length
  ok(soCam >= 5, "≥5 thao tác quản trị gọi `epQuyen`", `đo được ${soCam}`)

  // Moi `viec` trong bang QUYEN (tru `nap-nguon`, la cua CA HAI vai) phai
  // duoc mot thao tac nao do ep. Neu mot `viec` khai ma khong ai ep thi no la
  // mot dong trong bang khong chan gi.
  const iQ = dc.indexOf("export const QUYEN")
  const bangQ = dc.slice(iQ, dc.indexOf("}", iQ))
  const viecs = [...bangQ.matchAll(/"([a-z-]+)":/g)].map((m) => m[1])
  const khongEp = viecs.filter(
    (v) => v !== "nap-nguon" && v !== "sua-bai-nguoi-khac" &&
      !dc.includes(`epQuyen("${v}"`))
  ok(khongEp.length === 0, "mọi `viec` trong bảng QUYEN đều có chỗ ép",
    khongEp.join(" ") || "0 việc bỏ trống")

  // `sua-bai-nguoi-khac` la ve CON LAI: no la duong PUT /api/articles, tuc cua
  // cua NGUOI, va cam no doi mot quyet dinh khac — xem spec §6.5.
  const spec = readFileSync(
    new URL("../../06_modules/M18_nguoidung/spec.md", import.meta.url), "utf8")
  const daCamHet = !/sua-bai-nguoi-khac.*CHƯA CẮM|CHƯA CẮM.*sua-bai-nguoi-khac/s.test(spec)
  const coEp = dc.includes('epQuyen("sua-bai-nguoi-khac"')
  ok(coEp === daCamHet,
    coEp ? "`sua-bai-nguoi-khac` đã cắm ⇒ spec phải gỡ câu «CHƯA CẮM»"
         : "`sua-bai-nguoi-khac` chưa cắm ⇒ spec PHẢI khai «CHƯA CẮM»",
    `epQuyen=${coEp} specGỡ=${daCamHet}`)
}



console.log("\nY12 · tài khoản ĐẦU TIÊN là chủ dự án (AC-6.6)\n")
{
  // Ban dau khong co ve nay, va thieu no la mot DEADLOCK: tai khoan dau tien
  // tao duoc qua cua bootstrap nhung KHONG BAO GIO nang len `chu` duoc —
  // loiDatVai doi quyen moi-nguoi-moi, quyen do doi vai `chu`, va khong ai co.
  // Mot he thong khong ai quan duoc, TU DONG DAU TIEN. Va no chi lo ra o lan
  // cai dat THAT dau tien, khong lo ra o bat ky test nao dang co.
  const { mkdtempSync } = await import("node:fs")
  const t3 = mkdtempSync(join(tmpdir(), "y12-"))
  const cu = { db: process.env.LOI_DB, luu: process.env.LOI_LUU }
  process.env.LOI_DB = join(t3, "_loi.sqlite")
  process.env.LOI_LUU = join(t3, "_backup")
  try {
    const M3 = await import("../api/dungchung.mjs?y12=" + t3.length)
    const a = M3.loiTaoNguoiDung({ ten: "dau tien" })
    ok(M3.loiXemNguoiDung(a).vai === "chu", "tài khoản ĐẦU TIÊN ⇒ `chu`",
      M3.loiXemNguoiDung(a).vai)

    // Va no phai lam duoc viec quan tri NGAY — do la ca diem cua cua bootstrap.
    const b = M3.loiTaoNguoiDung({ ten: "thu hai", boi: a })
    ok(M3.loiXemNguoiDung(b).vai === "dong_nghiep",
      "tài khoản THỨ HAI ⇒ `dong_nghiep`", M3.loiXemNguoiDung(b).vai)

    // Cua bootstrap DA DONG.
    let nem = false
    try { M3.loiTaoNguoiDung({ ten: "lau" }) } catch { nem = true }
    ok(nem, "cửa bootstrap TỰ ĐÓNG — không danh tính ⇒ NÉM")

    nem = false
    try { M3.loiTaoNguoiDung({ ten: "z", boi: b }) } catch { nem = true }
    ok(nem, "`dong_nghiep` KHÔNG mời được người mới")
  } finally {
    process.env.LOI_DB = cu.db
    process.env.LOI_LUU = cu.luu
  }
}

console.log(xau ? `\n${xau} lỗi` : "\npass · FR-051 Y1–Y7")
process.exit(xau ? 1 : 0)
