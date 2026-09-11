/*
 * TÌM TOÀN VĂN — panel dưới ô `#q`, gọi truy hồi THẬT (SCR-27 · T03-125 bước 2).
 *
 * VÌ SAO CHUNK RIÊNG (`rule.md` 15 · SCR-27 §6): `gn.js` là bundle của MỌI trang và trần nó vừa
 * phải nới lần thứ năm cho C3. Người chưa gõ vào ô tìm thì không tải một byte nào của màn này —
 * `multiwindow` nạp `/gn-timkiem.js` lúc ô `#q` nhận focus, đúng khuôn `cctab` nạp lúc bấm tab.
 *
 * VÌ SAO KHÔNG LỌC DOM NỮA: ô `#q` hôm nay chạy `boDau(the.textContent).includes(tim)` — lọc CHUỖI
 * trên thẻ đã render, tức chỉ thấy tít và một dòng mô tả. `PRD U6` hứa full-text *"trên tít,
 * one_liner, thân bài"* từ đợt MỘT. Panel này gọi `GET /api/tim` (LÕI giữ khoá chiều) →
 * `POST :8791/truy-hoi`, nên nó tìm trong THÂN BÀI và cả transcript. Phép lọc thẻ cũ GIỮ NGUYÊN:
 * hai việc khác nhau — lọc là thu hẹp lưới đang xem, tìm là truy hồi cả kho.
 *
 * BA THỨ M13 TRẢ, PHẢI HIỆN ĐỦ (`ui_flow` §2): đoạn (`body` ĐẦY ĐỦ, panel tự tô chỗ khớp — KHÔNG
 * `snippet()`, M13-R4 nói trần 64 token cắt giữa câu mà vẫn trông như trích dẫn) · địa chỉ
 * (`dia_chi`) · **số bản ghi trong phạm vi**, đến CÙNG lời gọi (AC-5.1: hai lời gọi là hai thời
 * điểm, và số trên màn có thể không phải số đã dùng để trả lời).
 *
 * `k` là tham số NGƯỜI GỌI đưa (AC-5.2). Web khai mặc định `K` ở đây — M13 từ chối request thiếu `k`.
 */

const K = 20;               // SCR-27 §7 câu 3 — chủ dự án duyệt nguyên bản
const THEM = 20;            // mỗi lần bấm "thêm"
const NHIP = 250;           // debounce, SCR-27 §3
const TRAN_DOAN = 220;      // ký tự hiển thị quanh chỗ khớp — cắt HIỂN THỊ, không cắt dữ liệu

const mw = () => (globalThis as any).__GN_MW__;
const esc = (s: any) => String(s ?? "").replace(/[&<>"]/g, (c: string) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }) as any)[c] ?? c);

/** Bỏ dấu + hạ chữ để SO KHỚP hiển thị. Không phải luật slug, không phải chuẩn hoá của M13. */
function boDauTim(s: string): string {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
}

/**
 * Đường gọi LÕI. Câu hỏi đi NGUYÊN VĂN — chuẩn hoá là việc của `chuan_hoa_tim` phía M13, và làm
 * thêm một lần ở FE là dựng bản thứ hai của một luật (đúng thứ M13-R1 cấm).
 */
function duongTim(q: string, loc: any, k: number): string {
  const p = new URLSearchParams();
  p.set("q", String(q ?? ""));
  p.set("k", String(k || K));
  for (const khoa of ["pl", "cat", "loai", "cpt", "nguon"]) {
    const v = loc?.[khoa];
    const ds = v instanceof Set ? [...v] : Array.isArray(v) ? v : v ? [v] : [];
    if (ds.length) p.set(khoa, ds.join(","));
  }
  return "/api/tim?" + p.toString();
}

/** Tô chỗ khớp TỪ `body` đầy đủ, cắt cửa sổ hiển thị quanh chỗ khớp đầu tiên. */
function toSang(body: string, q: string): string {
  const tho = String(body ?? "");
  const kim = boDauTim(q).split(/\s+/).filter((x: string) => x.length > 1);
  const nen = boDauTim(tho);
  let dau = -1;
  for (const t of kim) { const i = nen.indexOf(t); if (i >= 0 && (dau < 0 || i < dau)) dau = i; }
  let tu = 0;
  if (dau > TRAN_DOAN / 2) tu = Math.max(0, dau - Math.floor(TRAN_DOAN / 3));
  const cat = tho.slice(tu, tu + TRAN_DOAN);
  const nenCat = boDauTim(cat);
  const moc: Array<[number, number]> = [];
  for (const t of kim) {
    for (let i = nenCat.indexOf(t); i >= 0; i = nenCat.indexOf(t, i + t.length)) moc.push([i, i + t.length]);
  }
  moc.sort((a, b) => a[0] - b[0]);
  let ra = "", cuoi = 0;
  for (const [a, b] of moc) {
    if (a < cuoi) continue;
    ra += esc(cat.slice(cuoi, a)) + "<mark>" + esc(cat.slice(a, b)) + "</mark>";
    cuoi = b;
  }
  ra += esc(cat.slice(cuoi));
  return (tu > 0 ? "…" : "") + ra + (tu + TRAN_DOAN < tho.length ? "…" : "");
}

const nhan = (x: any) => {
  const f = String(x?.file ?? "");
  const m = f.match(/^kb\/([a-z-]+)\//);
  return m ? m[1] : String(x?.nguon_van_ban ?? "").startsWith("hien-vat") ? "hiện vật" : "";
};

function veDong(x: any, i: number, q: string): string {
  return '<button class="tim-d" data-i="' + i + '" role="option" aria-selected="' + (i === 0) + '">'
    + '<span class="tim-bc">' + esc(x.heading_path) + "</span>"
    + '<span class="tim-l">' + esc(nhan(x)) + "</span>"
    + '<span class="tim-t">' + toSang(x.body, q) + "</span>"
    + '<span class="tim-a">' + esc(x.dia_chi) + "</span></button>";
}

/**
 * Thân panel theo TRẠNG THÁI. Bốn trạng thái đủ bộ NGAY đợt đầu (SCR-27 §2) — `rỗng` là trạng thái
 * thứ năm và nó có nghĩa riêng: chưa gõ đủ hai ký tự, panel không nói gì cả.
 */
function veThan(tt: string, d: any): string {
  const q = esc(d?.q ?? "");
  if (tt === "rong") return '<p class="tim-p">Gõ ít nhất hai ký tự để tìm trong toàn bộ bài.</p>';
  if (tt === "dang") return '<p class="tim-p tim-cho">Đang tìm “' + q + "”…</p>";
  if (tt === "loi") {
    return '<p class="tim-p tim-loi">Dịch vụ tìm không trả lời (' + esc(d?.ma ?? "lỗi mạng") + ")."
      + ' <button class="tim-lai" data-lai="1">Thử lại</button></p>';
  }
  const kq = d?.kq ?? {};
  const so = Number(kq.so_ban_ghi_trong_pham_vi ?? 0);
  const coLoc = Object.values(d?.loc ?? {}).some((v: any) => (v instanceof Set ? v.size : (v ?? []).length));
  if (tt === "khong") {
    return '<p class="tim-p">' + (coLoc
      ? "Không thấy trong " + so + " bản ghi đang lọc — nới phạm vi?"
      : "Không có trong kho.") + "</p>";
  }
  const ds = kq.ket_qua ?? [];
  return '<p class="tim-so">' + so + " bản ghi trong phạm vi</p>"
    + '<div class="tim-ds" role="listbox">' + ds.map((x: any, i: number) => veDong(x, i, d?.q ?? "")).join("") + "</div>"
    + '<p class="tim-ch"><span>↑↓ chọn · Enter mở · Esc đóng</span>'
    + (ds.length >= (d?.k ?? K) ? '<button class="tim-lai" data-them="1">Thêm ' + THEM + " kết quả</button>" : "")
    + "</p>";
}

/* ══ phần DOM ═══════════════════════════════════════════════════════════════════════════════ */

let o: any = null, hop: any = null, gio: any = null, huy: any = null, chon = 0, ketQua: any = null, kHien = K, phien = "";

const G = (id: string) => document.getElementById(id);

function dong() { if (hop) { hop.hidden = true; hop.innerHTML = ""; } }

function ve(tt: string, d: any) {
  if (!hop) return;
  hop.hidden = false;
  hop.innerHTML = veThan(tt, d);
  chon = 0;
}

function locHienTai(): any {
  const ra: any = {};
  document.querySelectorAll<HTMLElement>('[data-loc][data-gt][aria-pressed="true"]').forEach((b) => {
    const k = b.dataset.loc ?? "";
    if (!k || k === "reset") return;
    (ra[k] ??= []).push(b.dataset.gt ?? "");
  });
  return ra;
}

async function tim(q: string, k: number) {
  huy?.abort();
  huy = new AbortController();
  const loc = locHienTai();
  ve("dang", { q });
  try {
    const r = await fetch(duongTim(q, loc, k), { signal: huy.signal, headers: { "x-phien": phien } });
    if (!r.ok) return ve("loi", { q, ma: r.status });
    const j = await r.json();
    ketQua = j;
    kHien = k;
    ve((j.ket_qua ?? []).length ? "ket" : "khong", { q, kq: j, loc, k });
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    ve("loi", { q });
  }
}

function dat(i: number) {
  const ds = hop?.querySelectorAll(".tim-d") ?? [];
  if (!ds.length) return;
  chon = Math.max(0, Math.min(ds.length - 1, i));
  ds.forEach((b: any, j: number) => b.setAttribute("aria-selected", String(j === chon)));
  ds[chon]?.scrollIntoView({ block: "nearest" });
}

/** Mở bài rồi nhảy tới `id` heading — `id` do C3 (T03-149) sinh bằng CÙNG luật slug với anchor M13. */
async function moKetQua(i: number) {
  const x = (ketQua?.ket_qua ?? [])[i];
  if (!x) return;
  dong();
  await mw()?.moTheoSlug?.(String(x.file ?? "").replace(/^kb\//, "").replace(/\.md$/, ""));
  if (!x.anchor) return;
  setTimeout(() => { G(String(x.anchor))?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
}

function phim(e: any) {
  if (!hop || hop.hidden) return;
  if (e.key === "Escape") { dong(); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); dat(chon + 1); return; }
  if (e.key === "ArrowUp") { e.preventDefault(); dat(chon - 1); return; }
  if (e.key === "Enter" && document.activeElement === o) { e.preventDefault(); void moKetQua(chon); }
}

/** `multiwindow` gọi một lần khi ô `#q` nhận focus. */
function bat(oTim: any) {
  if (o) return;
  o = oTim;
  phien = String(Math.random()).slice(2);
  hop = document.createElement("div");
  hop.id = "tim-panel";
  hop.className = "tim-w";
  hop.hidden = true;
  o.parentElement?.append(hop);
  o.setAttribute("autocomplete", "off");
  o.addEventListener("input", () => {
    const q = String(o.value ?? "").trim();
    clearTimeout(gio);
    if (q.length < 2) { huy?.abort(); return ve("rong", { q }); }
    gio = setTimeout(() => void tim(q, K), NHIP);
  });
  hop.addEventListener("click", (e: any) => {
    const lai = e.target?.closest?.("[data-lai]");
    if (lai) return void tim(String(o.value ?? "").trim(), kHien);
    const them = e.target?.closest?.("[data-them]");
    if (them) return void tim(String(o.value ?? "").trim(), kHien + THEM);
    const d = e.target?.closest?.(".tim-d");
    if (d) void moKetQua(Number(d.dataset.i ?? 0));
  });
  document.addEventListener("keydown", phim);
  document.addEventListener("click", (e: any) => {
    if (hop && !hop.hidden && !hop.contains(e.target) && e.target !== o) dong();
  });
}

(globalThis as any).__GN_TIM__ = { bat, duongTim, toSang, veThan, boDauTim };
