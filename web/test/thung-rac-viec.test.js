#!/usr/bin/env node
/**
 * WO-070 · T03-129 — THÙNG RÁC VIỆC: ba đường + màn.
 *
 * `WO-068` dựng ngăn `rac/` và `GET /api/job?rac=1`; `WO-067` dựng
 * `POST /api/viec/<id>/lai`. Không màn nào đọc chúng, nên việc hỏng vào rác
 * rồi BIẾN MẤT khỏi mọi màn — tệ hơn lúc nó hiện sai trạng thái, vì không còn
 * đường nào tới nút "chạy lại".
 *
 * ── Vế đắt nhất là AC3 ──────────────────────────────────────────────────
 * "Xoá hẳn" phải xoá FILE VIỆC mà KHÔNG đụng `egress.*.jsonl`. Vết tiền sống
 * độc lập với file việc (cùng lý lẽ `don_viec_cu`), nên câu *"đã tiêu bao
 * nhiêu"* vẫn phải trả lời được sau khi thùng rác trống. Một phép xoá tiện tay
 * dọn cả sổ egress là xoá đúng thứ không dựng lại được.
 */
import { execFileSync, spawn } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batServer, dungKho, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const GOC = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const PY = existsSync(join(GOC, ".venv", "Scripts", "python.exe"))
  ? join(GOC, ".venv", "Scripts", "python.exe") : "python"
const CR = String.fromCharCode(13)
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")

console.log("\nWO-070 · thùng rác việc\n")

/* Hàng đợi TẠM — không đụng hàng đợi thật của chủ dự án đang test. */
const hd = mkdtempSync(join(tmpdir(), "gn-rac-"))
const py = (ma) => execFileSync(PY, ["-c", ma], {
  encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" },
}).trim()
/* `JSON.stringify` lo escaping đường dẫn Windows — một phép `.replace` gõ tay
   ở đây chính nó lại cần escaping, và đó là chỗ vừa hỏng một lần. */
const SRC = JSON.stringify(join(GOC, "chungcat", "src"))
const HD = JSON.stringify(hd)
const NL = String.fromCharCode(10)
const nap = (than) => py(
  "import sys; sys.path.insert(0, " + SRC + ")" + NL
  + "import vong" + NL + "q = vong.HangDoi(" + HD + ")" + NL + than)

const ULID = "b7".repeat(16)
nap(`u, _ = q.nap("${ULID}", {"loai": "sinh-transcript", "slug": "video/thu"})
q.dat_giai_doan(u, "dang-goi-model")
q.ghi_tien_do(u, [{"tu": 0.0, "den": 42.0, "text": "da co"}])
q.danh_hong(u, "dang-goi-model", "502 Bad Gateway")
print("seeded")
`)
ok(existsSync(join(hd, "rac", `${ULID}.json`)), "0 · gieo được một việc trong rác")

/* Sổ egress GIẢ — đo AC3 mà không cần gọi model thật. */
const soEgress = join(hd, "egress.w1.jsonl")
writeFileSync(soEgress, '{"seq":1,"sha256":"aa","so_byte":10}\n{"seq":2,"sha256":"bb","so_byte":20}\n')
/* Đếm PHÒNG HỘ: sổ bị xoá phải thành một vế ĐỎ ĐỌC ĐƯỢC, không phải một lần
   ném làm cả cổng chết — 'đỏ vì crash' không nói cho ai biết vế nào hỏng. */
const demEgress = () => {
  try { return readFileSync(soEgress, "utf8").trim().split(NL).length }
  catch { return -1 }
}

/*
 * THỢ TẠM trên cổng riêng, hàng đợi riêng.
 *
 * `batServer` chỉ dựng LÕI; THỢ là một tiến trình khác, và cái đang chạy ở
 * `:8790` đọc hàng đợi THẬT của chủ dự án. Không có bước này thì gate gieo vào
 * `hd` rồi hỏi một THỢ không bao giờ thấy nó — cổng sẽ đỏ vì SAI LÝ DO, và
 * `workflow §1a` cấm đúng chuyện đó.
 * `CHUNGCAT_GOC` cho LÕI biết gọi THỢ nào; cả hai biến đều đã có sẵn.
 */
const congTho = 8790 + 91
/* `chay(cong=…)` qua `-c`, KHÔNG chạy thẳng `api.py`: `__main__` của nó gọi
   `chay()` không tham số ⇒ bind cổng THẬT 8790 và giành với THỢ đang chạy.
   Chính `api.py:417` cảnh báo ca này — `SO_REUSEADDR` trên Windows cho hai
   socket cùng cổng bind THÀNH CÔNG, nên hỏng mà không ai kêu. */
const thoTam = spawn(PY, ["-c",
  "import sys; sys.path.insert(0, " + SRC + ")" + NL
  + "import api; api.chay(cong=" + congTho + ").serve_forever()"], {
  env: { ...process.env, PYTHONIOENCODING: "utf-8", CHUNGCAT_HANG_DOI: hd },
  stdio: ["ignore", "ignore", "pipe"],
})
let thoLoi = ""
thoTam.stderr.on("data", (d) => { thoLoi += d })
for (let i = 0; i < 100; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${congTho}/health`)
    if (r.ok) break
  } catch { /* chưa dậy */ }
  await new Promise((x) => setTimeout(x, 100))
}

const { kho, rac, don } = dungKho("gn-racviec")
const sv = await batServer({ kho, rac,
  loi: { CHUNGCAT_GOC: `http://127.0.0.1:${congTho}` } })

try {
  // ── AC1 · liệt kê ─────────────────────────────────────────────────────
  {
    const chinh = await goi(sv.cong, "GET", "/api/job?n=50")
    const rr = await goi(sv.cong, "GET", "/api/job?rac=1&n=50")
    const co = (r) => (r.json?.dong ?? []).some((v) => v.ulid === ULID)
    ok(rr.ma === 200, `1 · GET ?rac=1 ⇒ 200 (được ${rr.ma})`)
    ok(co(rr), "1a · thùng rác CÓ việc hỏng")
    ok(!co(chinh), "1b · danh sách CHÍNH không kể nó — đó là cả điểm của thùng rác")
    const v = (rr.json?.dong ?? []).find((x) => x.ulid === ULID) ?? {}
    ok(v.giai_doan_hong === "dang-goi-model" && String(v.loi ?? "").includes("502"),
      "1c · dòng mang CHẶNG hỏng + LÝ DO — không thì thùng rác chỉ là một danh sách id",
      JSON.stringify({ gd: v.giai_doan_hong, loi: String(v.loi ?? "").slice(0, 40) }))
  }

  // ── AC3 · xoá hẳn, và SỔ EGRESS KHÔNG ĐỔI ────────────────────────────
  {
    const truoc = demEgress()
    const r = await goi(sv.cong, "DELETE", `/api/viec/${ULID}`)
    ok(r.ma === 200, `3 · DELETE việc trong rác ⇒ 200 (được ${r.ma})`,
      JSON.stringify(r.json).slice(0, 160))
    ok(!existsSync(join(hd, "rac", `${ULID}.json`)), "3a · file việc đã đi")
    const sau = demEgress()
    ok(sau === truoc,
      "3b · sổ egress KHÔNG đổi — vết tiền sống độc lập với file việc",
      sau < 0 ? "SỔ EGRESS BỊ XOÁ — xoá một việc không được xoá bằng chứng nó đã tiêu bao nhiêu"
        : `${truoc} → ${sau} dòng`)
    ok(!existsSync(join(hd, "rac", `${ULID}.tien-do.vtt`)),
      "3c · file đi kèm cũng đi — không để lại rác mồ côi")
  }

  // ── AC3b · KHÔNG xoá được việc đang chạy ─────────────────────────────
  {
    const U2 = "c8".repeat(16)
    nap(`q.nap("${U2}", {"loai": "sinh-transcript", "slug": "video/dang-chay"})
q.dat_giai_doan("${U2}", "dang-goi-model")
print("ok")
`)
    const r = await goi(sv.cong, "DELETE", `/api/viec/${U2}`)
    ok(r.ma === 409, `3d · DELETE việc KHÔNG ở rác ⇒ 409 (được ${r.ma})`,
      "xoá một việc đang chạy là cướp chỗ ghi kết quả của worker")
  }

  // ── AC2 · chạy lại đưa việc RA khỏi rác, giữ tiến độ ─────────────────
  {
    const U3 = "d9".repeat(16)
    nap(`q.nap("${U3}", {"loai": "sinh-transcript", "slug": "video/lai"})
q.dat_giai_doan("${U3}", "dang-goi-model")
q.ghi_tien_do("${U3}", [{"tu": 0.0, "den": 99.0, "text": "giu lai"}])
q.danh_hong("${U3}", "dang-goi-model", "502")
print("ok")
`)
    const r = await goi(sv.cong, "POST", `/api/viec/${U3}/lai`)
    ok(r.ma === 200, `2 · POST /lai ⇒ 200 (được ${r.ma})`,
      JSON.stringify(r.json).slice(0, 160))
    ok(existsSync(join(hd, "cur", `${U3}.json`)), "2a · việc RA khỏi rác về `cur/`")
    ok(existsSync(join(hd, "cur", `${U3}.tien-do.vtt`)),
      "2b · FILE TIẾN ĐỘ theo về — không thì 'chạy lại từ chỗ hỏng' mất phần đã trả tiền")
  }
} finally {
  sv.dung()
  thoTam.kill()
  don()
}

// ── AC4 · MÀN: tab thứ ba + hai nút + câu xác nhận trung thực ───────────
{
  const fe = doc("../plugins/chungcat/src/chungcat.inline.ts")
  ok(/data-cctab="rac"/.test(fe), "4 · có tab `rac` trong dải tab")
  ok(/pn-rac/.test(fe), "4a · có khối `#pn-rac` để `ccDoiTab` ẩn/hiện")
  ok(/rac=1/.test(fe), "4b · màn gọi `GET /api/job?rac=1`")
  ok(/data-ccrlai/.test(fe) && /\/lai/.test(fe), "4c · nút ↻ Chạy lại gọi đúng đường")
  ok(/data-ccrxoa/.test(fe) && /method:\s*"DELETE"/.test(fe), "4d · nút 🗑 Xoá hẳn dùng DELETE")
  // Câu xác nhận phải nói ra thứ KHÔNG mất — không thì người tưởng xoá cả sổ tiền.
  const iC = fe.indexOf("confirm(")
  const cauHoi = iC < 0 ? "" : fe.slice(iC, fe.indexOf("))", iC))
  ok(iC >= 0 && /VẾT CHI PHÍ VẪN GIỮ/i.test(cauHoi),
    "4e · CHÍNH câu xác nhận nói VẾT CHI PHÍ vẫn giữ",
    "quét cả file thì toast 'Sổ chi phí giữ nguyên' làm vế này xanh oan — "
    + "đo đúng chuỗi trong `confirm()`, chỗ người dùng thật sự đọc")
  ok(/giai_doan === "hong"|=== "hong"/.test(fe),
    "4f · `nhomLoc` có nhánh `hong` tường minh — không rơi nhầm vào `cho`")
}

chot("WO-070 · thùng rác việc")
