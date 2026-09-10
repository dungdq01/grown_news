/**
 * Mọi `${tên}` chèn vào template literal phải là một tên CÓ THỰC trong hàm ấy.
 *
 * Chủ dự án 2026-09-07, ảnh chụp `/chung-cat/nhap/`:
 *   *"KHÔNG hỏi được hàng đợi nháp — cu is not defined."*
 *
 * `nhapThe(v)` (thẻ hàng nháp) chèn `${cu}` — một tên chỉ tồn tại ở `viecThe`
 * (thẻ HÀNG VIỆC), nơi có `const cu = laCu ? " cct-cu" : ""`. Vết copy giữa hai
 * hàm vẽ thẻ, và `cu` ở hàng nháp còn KHÔNG CÓ NGHĨA: nháp cũ đã vào `da_bo`
 * qua `donBanCu`, danh sách này đọc từ DB chứ không phải hàng đợi.
 *
 * Vì sao nó qua được mọi cổng: `ReferenceError` chỉ nổ LÚC CHẠY, và chỉ trên
 * đường có dữ liệu. Suốt lúc hàng nháp trống, hàm không được gọi lần nào —
 * bản chưng cất đầu tiên vào kho là lần đầu nó chạy, và đó đúng là lúc chủ dự
 * án mở màn. Một hàm chưa từng chạy thì mọi cổng tĩnh đều xanh.
 *
 * ── VÌ SAO cổng này chỉ soi TEMPLATE LITERAL, không soi mọi tên ─────────
 *
 * Hôm nay tôi đã viết một phép quét *"mọi tên trong hàm có giải được không"*
 * và nó ĐỎ OAN 8 hàm — nó là bản thứ hai của chính cơ chế tên của Python/JS.
 * Bài học: đừng dựng lại phép phân giải tên.
 *
 * `${bareIdentifier}` thì hẹp và tra được: nó gần như luôn là một biến cục bộ
 * hoặc tham số của CHÍNH hàm đang viết chuỗi. Nên cổng này hỏi đúng câu hẹp ấy,
 * và bỏ qua mọi biểu thức phức tạp (`${a.b}`, `${f(x)}`, `${a ? b : c}`).
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const CR = String.fromCharCode(13)
const FILE = [
  ["chungcat", "../plugins/chungcat/src/chungcat.inline.ts"],
  ["cctab", "../plugins/cctab/src/cctab.inline.ts"],
]

console.log("\n`${tên}` chèn vào chuỗi phải là tên có thực\n")

for (const [ten, duong] of FILE) {
  // CRLF → LF. `join("\n")` sẽ làm ĐÔI số dòng (mỗi `\r\n` thành hai `\n`),
  // và số dòng báo ra là thứ duy nhất giúp người tìm chỗ hỏng.
  const src = readFileSync(new URL(duong, import.meta.url), "utf8")
    .split(CR).join("")
  // Tên ở TẦNG MODULE — mọi hàm đều thấy.
  const toanCuc = new Set()
  for (const m of src.matchAll(/^(?:const|let|var|function|async function)\s+([A-Za-z_$][\w$]*)/gm))
    toanCuc.add(m[1])
  for (const m of src.matchAll(/^const\s*\{([^}]+)\}/gm))
    for (const x of m[1].split(",")) toanCuc.add(x.trim().split(":").pop().trim())

  // Cắt từng hàm ở TẦNG MODULE. Đủ cho câu hỏi hẹp này: một hàm lồng nằm TRONG
  // đoạn của hàm cha, nên tên của cha vẫn tra được — không tố oan closure.
  const dau = [...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)]
  let xau = 0
  for (let k = 0; k < dau.length; k++) {
    const i = dau[k].index
    const j = k + 1 < dau.length ? dau[k + 1].index : src.length
    const than = src.slice(i, j)
    const cuc = new Set(toanCuc)
    for (const m of than.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g))
      cuc.add(m[1])
    for (const m of than.matchAll(/(?:const|let|var)\s*\{([^}]+)\}/g))
      for (const x of m[1].split(",")) cuc.add(x.trim().split(":").pop().trim())
    // tham số + biến vòng lặp + tham số arrow
    for (const m of than.matchAll(/\(([^)]*)\)\s*(?:=>|\{)/g))
      for (const x of m[1].split(","))
        for (const t of x.matchAll(/[A-Za-z_$][\w$]*/g)) cuc.add(t[0])
    for (const m of than.matchAll(/for\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g))
      cuc.add(m[1])
    for (const m of than.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) cuc.add(m[1])

    // CHỈ `${tên}` trần — bỏ mọi biểu thức.
    for (const m of than.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g)) {
      if (cuc.has(m[1])) continue
      const dong = src.slice(0, i + m.index).split("\n").length
      console.log(`  FAIL ${ten} · \`${dau[k][1]}\` chèn \`\${${m[1]}}\` — `
        + `không có tên ấy trong hàm (dòng ~${dong})`)
      loi++
      xau++
    }
  }
  ok(xau === 0, `${ten} — ${dau.length} hàm, mọi \`\${tên}\` đều có thực`,
    "`ReferenceError` chỉ nổ lúc chạy, và chỉ trên đường CÓ DỮ LIỆU — một hàm "
    + "chưa từng chạy thì mọi cổng tĩnh đều xanh")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · không `${tên}` nào trỏ vào hư không")
