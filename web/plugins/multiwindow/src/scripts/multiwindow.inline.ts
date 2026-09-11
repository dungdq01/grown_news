/**
 * M03_web · FE multi-window + bàn biên tập.
 *
 * ═══ FILE NÀY ĐÃ ĐƯỢC KHÔI PHỤC TỪ BẢN BUILD ════════════════════════════════
 *
 * 2026-08-28 · Tôi (agent) chạy `git checkout -- <file>` để hoàn tác một phép
 * PHÁ trong kiểm hai chiều. Người dùng đã dặn "bỏ qua git, chưa cần commit",
 * nên `checkout` không lùi về "trước lúc phá" — nó lùi về commit 184514f, tức
 * TRƯỚC cả FR-036. Toàn bộ FE của super-update (FR-036 · FR-037 · FR-038 ·
 * FR-039) biến mất khỏi file .ts: 21 hàm.
 *
 * Khôi phục từ `multiwindow.inline.js` — bản build ngay trước đó, có đủ 86 hàm.
 * MÃ khôi phục nguyên vẹn; **CHÚ THÍCH và KIỂU thì mất** — esbuild lột cả hai.
 * Chú thích ở dự án này chở LÝ DO, nên đó là phần đắt nhất. Lý do của từng thay
 * đổi còn trong `.factory/worklog/WL-01K9N*` và `.factory/fr/FR-036..040`;
 * chú thích tại chỗ sẽ được đắp lại dần, không phải bản gốc.
 *
 * BÀI HỌC, ghi ở đây vì đây là chỗ nó xảy ra: `git` KHÔNG phải lệnh hoàn tác
 * khi cây làm việc chưa commit. Phá/hoàn tác phải dùng bản lưu BYTE
 * (`read_bytes`/`write_bytes`) rồi so sha256 — khuôn đã dùng đúng ở bốn lượt
 * trước và tôi bỏ ở lượt này.
 */

// Ba bảng khai vào bundle qua `define` của build-fe.mjs — KHÔNG nhúng cứng ở
// đây. Bản build có chúng dưới dạng literal (`var define_X_default = …`); dán
// literal đó trở lại là tạo bản gõ tay thứ hai, đúng thứ `check_khai_mot_noi`
// §3/§4 sinh ra để cấm.
declare const __KHUNG__: {
  phien_ban: number
  tran_tu_thu_vien: number
  tran_tu_mem: number
  tran_tu_cung: number
  tran_dan_nhap: number
  tinh_tuy: { toi_da: number; bullets: string[] }
  muc: Array<Record<string, unknown>>
}
declare const __XUAT__: {
  dang: Record<string, { ten: string; duoi: string | null }>;
  theo_loai: Record<string, string[]>;
};
declare const __MEDIA__: {
  loai: { mime: string; duoi: string; ten: string; xem_truoc: string }[]
  mac_dinh: { mime: string; duoi: string; ten: string; xem_truoc: string }
  tran_byte: number
  loai_thu_vien: string[]
  video_host: Array<{
    nhan: string; mien: string; nhung: string; id_mau: string; id_tu: string
  }>
}
declare const __DUONG__: Record<string, string>

const MAU = {
  repo: "var(--c-repo)",
  paper: "var(--c-paper)",
  video: "var(--c-video)",
  article: "var(--c-article)",
  docs: "var(--ink-2)",
  announcement: "var(--ink-2)"
};

// Bảng khai hành động của cụm nút tiện ích. `bat: false` = nút HIỆN nhưng
// disabled, kèm lý do đọc được — nút biến mất thì không nói cho ai biết vì sao.
const HANH_DONG_CHUNG_CAT = {
  "tai-lieu": { nhan: "\u2697 Chưng cất", bat: true, vi_sao: "" },
  // T03-108 · BẬT. `T03-92` để `false` kèm lý do *"đường đó chưa mở"*; C4b mở
  // rồi (`T12-16` worker chạy `sinh-transcript`, `T01-45` cho `.vtt` mime +
  // magic `WEBVTT`), nên giữ `false` là để lại một câu nói sai với người dùng.
  video: { nhan: "♫ Transcript", bat: true, vi_sao: "" },
  article: { nhan: "", bat: false, vi_sao: "" },
  docs: { nhan: "", bat: false, vi_sao: "" },
  paper: { nhan: "", bat: false, vi_sao: "" },
  repo: { nhan: "", bat: false, vi_sao: "" },
  announcement: { nhan: "", bat: false, vi_sao: "" }
};
// Bản `phan-tich` KHÔNG có nút: nó đã là sản phẩm.
// `.bt` chứ không `.wb`: `.wb` thiếu `:disabled{opacity}` ⇒ nút disabled trông
// y hệt nút bấm được.
/*
 * Bản ghi này ĐÃ có transcript chưa?
 *
 * Transcript là hiện vật `text/vtt` gắn trên bản ghi — không phải một bản ghi
 * riêng, nên phải đi qua `media[]`.
 */
function coTranscript(ban) {
  const ds = Array.isArray(ban?.media) ? ban.media : (ban?.media ? [ban.media] : []);
  return ds.some((m) => String(m?.mime) === "text/vtt");
}

/*
 * NÚT CHƯNG CẤT RIÊNG cho bản ghi video (`T03-123`).
 *
 * Từ `FR-070`, chưng cất một video ĐÒI transcript làm nguyên liệu. Một nút
 * bấm vào ra lỗi là một nút nói dối về việc nó làm được — người bấm mất một
 * vòng để biết điều lẽ ra NHÌN là thấy.
 *
 * BA trạng thái, ba câu KHÁC nhau. Gộp chúng là bỏ mất đúng thông tin người
 * cần: *chưa có* thì phải sinh, *đang sinh* thì phải đợi, *có rồi* thì bấm.
 *
 * Dùng act RIÊNG (`cc-rieng`), KHÔNG mượn act của nút sinh-transcript: nút ấy
 * của một
 * video đang mở phiếu TRANSCRIPT (`T03-108`), và mượn nó là sửa một đường đã
 * chốt. Chủ dự án dặn *"chỉ làm thêm, không sửa các tính năng đã chốt"*.
 */
function nutChungCatRieng(ban) {
  if (String(ban?.source_type) !== "video") return "";
  if (coTranscript(ban)) {
    // Bam duoc, va chua chac da chung cat lan nao ⇒ HONG.
    // `veNutBanChungCat` son vang neu tra ra co ban.
    return '<button class="bt ghost sm nut-chua" data-act="cc-rieng"'
      + ' title="chưng cất TỪ TRANSCRIPT — mở một cửa sổ riêng">⚗ Chưng cất</button>';
  }
  // Ca "đang sinh": việc transcript đang chạy. Màn không tra hàng đợi ở đây
  // (đó là một lời gọi mạng cho một cái nhãn) — `veNutChungCatRieng` vá sau.
  return '<button class="bt ghost sm tx-mo" data-act="cc-rieng" disabled'
    + ' title="cần transcript trước — nội dung video nằm ở transcript, phần mô tả'
    + ' không đủ để dựng một bài phân tích">⚗ cần transcript</button>';
}

function cumNutChungCat(ban) {
  const h = HANH_DONG_CHUNG_CAT[ban.source_type];
  if (!h || !h.nhan) return "";
  if (ban.ho_so && ban.ho_so !== "thu-vien") return "";
  /*
   * MỘT `data-act` cho hai lối, rẽ trong handler theo `source_type`.
   *
   * Bản đầu tôi tính `data-act` (`"sinh-tr"` | `"chung-cat"`) để đọc được lối
   * ngay trong markup. Đo được: `nut-song` quét `data-act="..."` như CHUỖI
   * NGUYÊN VĂN trong bundle, nên một `data-act` ghép chuỗi làm CẢ HAI nhánh
   * thành "mồ côi" — cổng mất khả năng thấy nút nào có thật. Giữ nguyên văn thì
   * cổng còn răng, và lối vẫn tường minh, chỉ tường minh ở handler.
   */
  /*
   * MAU la chieu HANH DONG (`SCR-24`), khong phai chieu trang thai ban ghi.
   *
   *   hong `--brand`  chua lam lan nao  -> "day la viec nen bam"
   *   vang `--warn`   DA co roi         -> "bam nua la tieu token lan nua"
   *
   * Nut TRANSCRIPT biet ngay: hien vat `.vtt` da nam tren `media[]`, nen
   * `coTranscript(ban)` tra loi tai cho — khong co ly do cho mang cho no.
   *
   * Nut CHUNG CAT thi KHONG: mot ban ghi chung cat duoc NHIEU lan nen khong
   * suy tu slug. Ve HONG truoc, `veNutBanChungCat` son vang sau khi
   * `/api/index` tra loi. Chan header cho mang thi tieu de trong nua giay —
   * te hon mot nut doi mau nua giay sau.
   */
  const roi = ban.source_type === "video" && coTranscript(ban);
  return '<button class="bt ghost sm ' + (roi ? "nut-roi" : "nut-chua")
    + '" data-act="chung-cat"' + (h.bat ? "" : " disabled")
    + ' title="' + (h.bat ? "chưng cất bản ghi này — toàn văn rời máy, có vết" : h.vi_sao)
    + '">' + h.nhan + "</button>" + nutChungCatRieng(ban);
}
/*
 * HỘP THOẠI chưng cất — thân nằm ở chunk `gn-cctab.js`, nạp lúc bấm.
 *
 * Cùng lập luận `FR-062` đã duyệt cho TAB, áp cho hộp thoại: đo được **2986
 * byte** trong `gn.js` cho một hộp thoại chỉ mở khi người bấm "Chưng cất", và
 * `gn.js` là bundle CHUNG của mọi trang — kể cả trang chỉ đọc. Không dọn chỗ
 * này thì năm dòng mime của `T01-45` không có chỗ (đo: 102460/102400).
 *
 * `moPhieuChungCat` ở lại đây vì bộ phân phối bấm gọi nó đồng bộ; nó chỉ nạp
 * chunk rồi giao việc.
 */
/** Nạp chunk rồi gọi một hàm của nó. Lỗi nạp ⇒ NÓI RA, không im lặng. */
async function goiChunk(ten, win, id) {
  globalThis.__GN_MW__ ??= _cau();
  try {
    (await capCctab())[ten](win, id);
  } catch (e) {
    bao(true, String(e.message ?? e));
  }
}

/* WO-075 · MOT ban cua header JSON, dung 11 cho.
   Khong phai gu ma: `mock/index.html` cham tran (272 384/272 384) va tinh nang
   tiep theo can ~100 byte. 11 ban sao cua cung mot object la cho re nhat de
   lay lai chung — 0 doi hanh vi, 0 cong nao phai doi.
   Hai loi viet `content-type` va `Content-Type` truoc day chi la khong nhat
   quan; HTTP header khong phan biet hoa thuong nen gop lai la vo hai. */
const HJ = { "content-type": "application/json" };
const TAB_CC = "cc";
const TAB_TR = "tr";

/*
 * Thân tab Chưng cất nằm ở CHUNK `gn-cctab.js`, nạp lúc bấm — không lúc tải
 * trang. `gn.js` là bundle chung của MỌI trang và `FR-061` cấm nới trần nó;
 * một tab chưa ai bấm không thuộc đường tải đầu của người đọc.
 *
 * `__V_CCTAB__` do `assets.mjs` chèn vào chính `gn.js` — nhờ vậy sửa chunk là
 * đổi cả dấu phiên bản, và không tốn một byte HTML nào của mỗi trang.
 *
 * Lỗi nạp ⇒ **xoá lời hứa** rồi ném: giữ một Promise đã reject nghĩa là bấm
 * lại vẫn hỏng vĩnh viễn dù mạng đã lên.
 */
let hua;
const capCctab = () => (hua ??= new Promise((xong, hong) => {
  const t = document.createElement("script");
  t.src = "/gn-cctab.js?v=" + (globalThis.__V_CCTAB__ ?? "");
  t.onload = () => xong(globalThis.__GN_CCTAB__);
  t.onerror = () => { hua = null; hong(new Error("không nạp được tab chưng cất")); };
  document.head.append(t);
}));

async function veTabChungCat(win) {
  /* Thứ tab cần từ multiwindow. Một chiều — chunk ĐỌC, không ghi vào.
   * Gán ở đây chứ không ở tầng module: `WIN`/`esc` khai bên dưới, nên một câu
   * gán trên cùng file đọc chúng trong TDZ ⇒ `ReferenceError` ngay lúc nạp
   * `gn.js`, tức TRẮNG cả trang chỉ vì một tab. */
  globalThis.__GN_MW__ ??= _cau();
  const doc = win.querySelector(".doc");
  try {
    (await capCctab()).ve(win);
  } catch (e) {
    if (doc) doc.innerHTML = '<p class="f-loi">' + esc(String(e.message ?? e)) + "</p>";
  }
}

/* Poll sống trong chunk ⇒ dừng nó qua chunk. Chunk chưa nạp thì cũng chưa có
 * poll nào chạy, nên `?.` ở đây là đúng chứ không phải che lỗi. */
const dungPoll = (win) => globalThis.__GN_CCTAB__?.dung(win);

/* Bấm hộ chính cái tab: bộ phân phối đã có vòng đặt `aria-current` + gọi
 * `veTabChungCat`. Viết lại hai bước đó ở đây là bản thứ hai của một luồng, và
 * nó lệch đúng ngày ai sửa một trong hai. */
/*
 * Nhãn tab — TIÊU ĐỀ, không phải `frontmatter.id` (`WO-060`).
 *
 * Ảnh chủ dự án 2026-09-06: hai tab đọc `src_thunghiemg` · `src_caidatvath`.
 * Đó là `id` — chuỗi máy dựng từ slug rồi cắt 10 ký tự. Nó định danh được cho
 * MÁY và không nói gì cho người mở hai cửa sổ cạnh nhau.
 *
 * Cắt ở 22 ký tự và cắt theo TỪ: cắt giữa từ cho ra `Thiên Đường Chu…`, đọc
 * vấp hơn là mất hẳn một từ. Tiêu đề đầy đủ nằm ở `title=` nên vẫn hỏi được
 * bằng cách rê chuột.
 */
function nhanTab(b) {
  const t = String(b.title || b.slug || b.id || "").trim();
  if (t.length <= 22) return t;
  const cat = t.slice(0, 22);
  const khoang = cat.lastIndexOf(" ");
  return (khoang > 12 ? cat.slice(0, khoang) : cat) + "…";
}

const moTabChungCat = (win) =>
  win.querySelector('[data-tab="' + TAB_CC + '"]')?.click();

const MIN_W = 340;
const MIN_H = 220;
const LECH = 28;
let BAI = [];
let N = 0;
let Z = 40;
const WIN = /* @__PURE__ */ new Map();
function banDangDoc(w) {
  const ban = w?.bai.bans[w.cur];
  if (!ban) {
    bao(true, "Không xác định được bản đang đọc — đóng rồi mở lại bài.");
    return null;
  }
  return ban;
}
let RZ = null;
let DG = null;
const hai = (n) => String(n).padStart(2, "0");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
/* Nội dung cầu — khai MỘT chỗ, ba nơi publish cùng gọi. `function` nên nó
   hoisted, dùng được cả ở hai chỗ `??=` đầu file. */
function _cau() {
  return { WIN, banDangDoc, esc, bao, moTab: moTabChungCat, mo, cap: capCctab, md,
    txCss, nhanCanh, nhanTrangThai, moTheoSlug, hoi, capNhin, tenBai, banTheoSlug: _timBan, mediaBang: () => MEDIA,
    viecNguoi, vatHong };
}

function md(src) {
  const ra = [];
  let trongBang = false;
  let trongList = false;
  const dongBang = () => {
    if (trongBang) {
      ra.push("</tbody></table>");
      trongBang = false;
    }
  };
  const dongList = () => {
    if (trongList) {
      ra.push("</ul>");
      trongList = false;
    }
  };
  const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<i>$2</i>").replace(/\[(§[^\]]+)\]/g, '<a class="loc">[$1]</a>');
  for (const dong2 of src.split(/\r?\n/)) {
    const d = dong2.trim();
    if (!d) {
      dongBang();
      dongList();
      continue;
    }
    if (d.startsWith("|")) {
      const o = d.slice(1, -1).split("|").map((x) => x.trim());
      if (o.every((x) => /^:?-+:?$/.test(x))) continue;
      if (!trongBang) {
        dongList();
        ra.push("<table><tbody>");
        trongBang = true;
      }
      ra.push("<tr>" + o.map((x) => "<td>" + inline(x) + "</td>").join("") + "</tr>");
      continue;
    }
    dongBang();
    const h = d.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      dongList();
      const c = Math.min(h[1].length, 4);
      ra.push(`<h${c}>` + inline(h[2]) + `</h${c}>`);
      continue;
    }
    const li = d.match(/^[-*]\s+(.*)$/) ?? d.match(/^\d+\.\s+(.*)$/);
    if (li) {
      if (!trongList) {
        ra.push("<ul>");
        trongList = true;
      }
      ra.push("<li>" + inline(li[1]) + "</li>");
      continue;
    }
    dongList();
    if (d.startsWith(">")) {
      ra.push('<p class="bg">' + inline(d.slice(1).trim()) + "</p>");
      continue;
    }
    ra.push("<p>" + inline(d) + "</p>");
  }
  dongBang();
  dongList();
  return ra.join("");
}
function mucCua(el) {
  return [...el.querySelectorAll<HTMLElement>(".doc h2")];
}
/*
 * WO-085 · TRA TIÊU ĐỀ theo slug — dùng lại chỉ mục ĐÃ NẠP, không tải bản hai.
 *
 * Màn `/chung-cat/` chỉ có `payload.slug` của mỗi việc, mà slug là khoá kỹ
 * thuật và trên thẻ nó còn bị cắt cụt giữa chừng. Tiêu đề thật nằm trong
 * `open-index` — thứ `nap()` đã tải và cache vào `BAI`.
 *
 * Ở ĐÂY chứ không trong chunk `chungcat`: một chỉ mục tải hai lần là hai bản
 * sẽ lệch, và bản của chunk kia nạp sau nên nó thắng ở những chỗ ngẫu nhiên.
 *
 * ĐỒNG BỘ, không `await`: người vẽ danh sách việc không đợi được một vòng
 * mạng. Chỉ mục chưa nạp ⇒ trả "" và bên gọi LÙI VỀ SLUG — thấy slug vẫn hơn
 * thấy một khối trống.
 */
const _timBan = (slug) => (slug
  ? BAI.flatMap((g) => g?.bans ?? []).find((b) => b?.slug === slug) ?? null
  : null);

/*
 * WO-092 · HAI LỚP VIỆC — khai MỘT chỗ, hai chunk cùng đọc.
 *
 * `WO-088` đặt phép này trong chunk `chungcat`, nên danh sách việc trong CỬA
 * SỔ (chunk `cctab`, một bộ vẽ khác) vẫn cõng `sinh-thumbnail` và `tai-video`.
 * Chủ dự án chụp lại: *"bảo bỏ hết chỉ có sinh transcript và chưng cất mà?"*
 *
 * Đưa lên cầu chứ không chép sang chunk thứ hai — chép là hai bản sẽ lệch, và
 * lần lệch này đã xảy ra thật.
 *
 * DANH SÁCH CHO PHÉP: việc nền THỨ BA ra đời sẽ không tự chen vào trạng thái
 * của người.
 */
// Danh sách nằm TRONG hàm: nó là hằng của đúng một phép, và tách ra thành một
// `const` ở tầng module tốn thêm byte trong bundle CHUNG mà không ai khác đọc.
// Dạng mũi tên + regex thay hai phép so: `gn.js` kịch trần, và 30 byte ở đây
// là 30 byte trên MỌI trang.
const viecNguoi = (v) => /^(sinh-transcript|chung-cat-mot-nguon)$/
  .test(String(v?.payload?.loai ?? v?.loai ?? ""));

/** Việc của MÁY mà HỎNG — lọc trơn là giấu một lỗi thật, nên nó vẫn nổi. */
const vatHong = (v) => !viecNguoi(v)
  && /^(dung|hong)$/.test(String(v?.giai_doan ?? ""));

const tenBai = (slug) => String(_timBan(slug)?.title ?? "");


async function nap() {
  if (BAI.length) return BAI;
  if (goc() === "/") {
    try {
      const r = await fetch("/api/index");
      if (r.ok) {
        BAI = (await r.json()).articles ?? [];
        return BAI;
      }
      bao(true, `Không đọc được chỉ mục từ API (${r.status}) — dữ liệu trên màn có thể thiếu.`);
    } catch {
      bao(true, "API không phản hồi — kiểm tra `npm run api` rồi tải lại trang.");
    }
    return [];
  }
  try {
    const r = await fetch("/mock/static/open-index.json");
    if (!r.ok) return [];
    BAI = (await r.json()).articles ?? [];
  } catch {
    BAI = [];
  }
  return BAI;
}
/*
 * `tuyChon.canh` — mở cửa sổ mới CẠNH một cửa sổ đang có (`T03-112`).
 *
 * Chỉ đạo: *"tôi vừa xem bản tài liệu vừa xem bản chưng cất BÊN CẠNH"*. Xếp
 * chồng theo bậc thang (hành vi mặc định) làm cửa sổ mới che bài đang đọc —
 * đúng thứ flow này sinh ra để tránh.
 *
 * Hẹp thì LÙI VỀ xếp chồng lệch, không ép: nhét hai cửa sổ 880px vào một màn
 * 1000px cho ra hai cột không đọc nổi. Người kéo được, và một bố cục kéo được
 * tốt hơn một bố cục ép.
 */
function mo(bai, tuyChon) {
  const id = "gnw" + N++;
  const n = WIN.size;
  const ox = n % 5 * LECH;
  const oy = n % 5 * 24;
  const canh = tuyChon?.canh;
  // Hai cửa sổ cạnh nhau cần ~2×420 + lề. Dưới ngưỡng đó thì xếp chồng.
  const doiCot = canh instanceof HTMLElement && innerWidth >= 1120;
  const w = doiCot
    ? Math.max(380, Math.min(620, (innerWidth - 120) / 2))
    : Math.min(880, innerWidth - 80);
  const h = Math.min(620, innerHeight - 140);
  const ban = bai.bans[0];
  const el = document.createElement("div");
  el.className = "bk";
  el.id = id;
  let x = Math.max(20, (innerWidth - w) / 2 - 90 + ox);
  let y = 90 + oy;
  if (doiCot) {
    const r = canh.getBoundingClientRect();
    // Ép NGUỒN về trái, MỚI sang phải: thứ tự đọc trái→phải, và bản gốc là thứ
    // người đang đọc dở.
    canh.style.left = "20px";
    canh.style.width = w + "px";
    x = 20 + w + 16;
    y = Math.max(20, r.top);
  }
  el.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px;z-index:" + ++Z;
  /*
   * T03-110 · TAB "Chưng cất" nằm trong CÙNG dải tab của cửa sổ.
   *
   * Chỉ đạo: *"không tự switch sang màn khác — làm thêm 1 Tab dạng multiwindow
   * để theo dõi"*. Một panel nổi riêng là một cửa sổ thứ hai; người vẫn phải
   * rời chỗ đang đọc. Cùng dải tab thì đổi tab là một cú bấm, và bấm lại là về.
   *
   * Chỉ hiện khi bản ghi CÓ nút chưng cất — `cumNutChungCat` trả rỗng cho bản
   * `phan-tich` và cho loại không chưng cất được, nên tab theo đúng điều kiện
   * đó thay vì một phép kiểm thứ hai sẽ lệch.
   */
  const coCC = cumNutChungCat(ban) !== "";
  /*
   * BA TRẠNG THÁI TÁCH BẠCH — chủ dự án chốt 2026-09-06:
   * *"xem · chưng cất · transcript, tách biệt hoàn toàn, không ghi lẫn nhau"*.
   *
   * Bản trước KHÔNG có tab "Xem": `tabBan` chỉ dựng khi bản ghi có >1 bản, nên
   * với một bản ghi thường, dải tab chỉ có *Chưng cất* và *Transcript*. Bấm
   * sang một trong hai là MẤT ĐƯỜNG VỀ bài đang đọc — chủ dự án bắt đúng điều
   * đó: *"lúc transcript hay chưng cất, tôi vẫn phải xem được tài liệu"*.
   *
   * Nhiều bản ⇒ mỗi bản một tab (nhãn là tiêu đề, `WO-060`). Một bản ⇒ đúng
   * một tab "Xem". Cả hai đều trỏ `data-tab` SỐ, tức cùng một đường `tai()` —
   * không nhánh thứ hai.
   */
  const tabBan = bai.bans.length > 1
    ? bai.bans.map((b, i) => '<button class="bk-tab" data-tab="' + i
        + '" title="' + esc(b.title || b.slug || "") + '" aria-current="'
        + (i === 0) + '">' + esc(nhanTab(b)) + "</button>").join("")
    : '<button class="bk-tab" data-tab="0" aria-current="true">Xem</button>';
  const tabs = (coCC || ban.source_type === "video" || bai.bans.length > 1)
    ? '<div class="bk-tabs">' + tabBan
      + (coCC ? '<button class="bk-tab" data-tab="' + TAB_CC
        + '" aria-current="false">Chưng cất</button>' : "")
      /* T03-108 · tab Transcript CHỈ cho bản ghi video. Hiện nó ở bản ghi tài
         liệu là một tab luôn rỗng, và một tab luôn rỗng dạy người dùng bỏ qua
         cả dải tab. */
      + (ban.source_type === "video"
        ? '<button class="bk-tab" data-tab="' + TAB_TR
          + '" aria-current="false">Transcript</button>' : "")
      + "</div>"
    : "";
  el.innerHTML = '<div class="bk-t" data-drag="' + id + '"><i class="ic" style="background:' + (MAU[ban.source_type] ?? "var(--ink-3)") + '"></i><span class="tt">' + ban.title + '</span><span class="ct">' + cumNutChungCat(ban) + '<button class="wb" data-act="min" aria-label="thu nho cua so">&minus;</button><button class="wb" data-act="max" aria-label="phong to cua so">&#9634;</button><button class="wb x" data-act="shut" aria-label="dong cua so">&times;</button></span></div><i class="bk-pg" aria-hidden="true"><i></i></i>' + tabs + '<div class="bk-b"><nav class="bk-toc"><div class="bk-mt" data-mount></div><div class="lb">Muc luc</div><ol></ol></nav><article class="doc"><p class="ld">Đang tải…</p></article></div><div class="bk-f"><div class="bt-bt" data-bt></div><div class="bk-fm"><span>' + ban.source_type + " &middot; " + ban.credibility_max + (ban.origin === "external" ? ' &middot; <b class="ex">ngoài</b>' : "") + '</span><span class="pg">&mdash;</span><span><button data-act="prev">&lsaquo; trước</button><button data-act="next">tiếp &rsaquo;</button></span></div></div>' + ["n", "s", "w", "e", "nw", "ne", "sw", "se"].map((d) => '<i class="rz rz-' + d + '" data-rz="' + d + '"></i>').join("");
  document.body.appendChild(el);
  WIN.set(id, { bai, el, cur: 0, muc: 0, moLuc: Date.now() });
  ganTienDo(el);
  /*
   * `tuyChon.kieu === "nhap"` ⇒ KHÔNG gọi `tai()`.
   *
   * `tai()` là đường của BÀI TRONG KHO: nó `fetch /api/articles/<loai>/<slug>`
   * rồi `veNutBienTap` phát bộ nút *Đưa lên site · Loại · Sửa · Bỏ khỏi kho*.
   * Một bản NHÁP không tồn tại trong kho — nó sống ở DB nháp, khoá `job_ulid`.
   *
   * Đo được trên màn thật (`T03-113`, ảnh chủ dự án): mở nháp
   * `phan-tich-xgboost-stap-by-step` ⇒ `GET /api/articles/article/phan-tich-…`
   * trả **404**, thân trống, và cả bốn nút chân cửa sổ chết cùng một lỗi.
   * Sai CỬA, không sai API.
   *
   * Người gọi tự đổ nội dung vào `.doc` và tự phát nút đúng vai.
   *
   * ── WO-087 · ĐẢO THÀNH DANH SÁCH CHO PHÉP ────────────────────────────
   *
   * Bản trước viết `tuyChon?.kieu !== "nhap"` — một danh sách LOẠI TRỪ có đúng
   * một phần tử. `T03-122` thêm cửa sổ `kieu: "transcript"`, ca mới lọt thẳng
   * qua, gọi `tai()`, nhận 404 — và bốn nút chân cửa sổ chết đúng cùng cái
   * cách đã chết một lần ở `T03-113`. Chủ dự án chụp lại 2026-09-10: hộp
   * *"Loại bài"* mở trên cửa sổ Transcript, bấm ra *"Không đọc được bài từ
   * API."*
   *
   * Cửa sổ BÀI KHO là cửa sổ KHÔNG khai `kieu` — nên điều kiện đúng là *"chỉ
   * khi không có `kieu`"*. Thêm loại cửa sổ thứ tư mà quên sửa đây thì nó hỏng
   * theo chiều AN TOÀN (thiếu nút) chứ không theo chiều 404 (nút chết).
   */
  if (!tuyChon?.kieu) void tai(id, 0);
  dock();
  return id;
}
function ganTienDo(el) {
  const than = el.querySelector<HTMLElement>(".bk-b");
  const bar = el.querySelector(".bk-pg > i");
  if (!than || !bar) return;
  let tick = false;
  const ve = () => {
    tick = false;
    const doan = than.scrollHeight - than.clientHeight;
    const p = doan > 2 ? Math.min(1, than.scrollTop / doan) : 0;
    bar.style.width = (p * 100).toFixed(2) + "%";
    bar.parentElement.style.opacity = doan > 2 ? "1" : "0";
  };
  const khi = () => {
    if (!tick) {
      tick = true;
      requestAnimationFrame(ve);
    }
  };
  than.addEventListener("scroll", khi, { passive: true });
  ve();
  const win = window;
  win.addCleanup?.(() => than.removeEventListener("scroll", khi));
}
async function tai(id, tabIdx) {
  const w = WIN.get(id);
  if (!w) return;
  w.cur = tabIdx;
  const ban = w.bai.bans[tabIdx];
  const doc = w.el.querySelector(".doc");
  const toc = w.el.querySelector(".bk-toc ol");
  if (!doc || !toc) return;
  const coH1 = /^#\s+\S/m.test(ban.than ?? "");
  const tieuDe = coH1 ? "" : "<h1>" + esc(ban.title) + "</h1>";
  const hv = xemTruocHienVat(ban);
  doc.innerHTML = ban.than ? tieuDe + hv + md(ban.than) : "<h1>" + esc(ban.title) + "</h1>" + hv + '<p class="ld">Bản này không có thân bài.</p>';
  napVanBanXemTruoc(doc);
  const h2 = mucCua(w.el);
  h2.forEach((h, j) => {
    h.id = id + "s" + j;
  });
  toc.innerHTML = h2.map((h, j) => '<li><button data-jmp="' + j + '"><span class="n">' + hai(j + 1) + "</span>" + h.textContent + "</button></li>").join("");
  const mt = w.el.querySelector<HTMLElement>(".bk-mt");
  if (mt) {
    const o = [
      ["loại", ban.source_type],
      ["tin cậy", ban.credibility_max],
      ["ưu tiên", String(ban.priority || "—")],
      ["ngày", ban.analyzed_at ?? "—"]
    ];
    mt.innerHTML = o.map(([k, v]) => '<span class="bk-mr"><i>' + esc(k) + "</i><b>" + esc(v) + "</b></span>").join("");
  }
  const mucTT = [...doc?.querySelectorAll("h3") ?? []].find((h) => /tinh\s*t[úuủ]y/i.test(h.textContent ?? ""));
  if (mucTT) {
    mucTT.classList.add("tt-h");
    for (let n = mucTT.nextElementSibling; n; n = n.nextElementSibling) {
      if (n.tagName === "H2" || n.tagName === "H3") break;
      if (n.tagName === "H4") n.classList.add("tt-b");
    }
  }
  veBienTap(w.el, ban);
  dongBo(id);
}
function dong(id) {
  WIN.get(id)?.el.remove();
  WIN.delete(id);
  dock();
}
function thu(id) {
  const w = WIN.get(id);
  if (!w) return;
  w.el.style.display = "none";
  w.min = true;
  dock();
}
function phuc(id) {
  const w = WIN.get(id);
  if (!w) return;
  w.el.style.display = "";
  w.min = false;
  w.el.style.zIndex = String(++Z);
  dock();
}
function dock() {
  let d = G("gn-dock");
  if (!d) {
    d = document.createElement("div");
    d.id = "gn-dock";
    d.className = "dock";
    document.body.appendChild(d);
  }
  const m = [...WIN.entries()].filter(([, w]) => w.min);
  d.innerHTML = m.length ? '<span class="lbl">dang mo</span>' + m.map(([k, w]) => '<button class="dk" data-rest="' + k + '"><i style="background:' + (MAU[w.bai.bans[0].source_type] ?? "var(--ink-3)") + '"></i><span>' + w.bai.bans[0].title + "</span></button>").join("") : "";
}
function nhay(id, j) {
  G(id + "s" + j)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function buoc(id, huong) {
  const w = WIN.get(id);
  if (!w) return;
  const n = mucCua(w.el).length;
  nhay(id, Math.max(0, Math.min(n - 1, w.muc + huong)));
}
function dongBo(id) {
  const w = WIN.get(id);
  if (!w?.el) return;
  const b = w.el.querySelector<HTMLElement>(".bk-b");
  if (!b) return;
  const h2 = mucCua(w.el);
  if (!h2.length) return;
  let cur = 0;
  h2.forEach((h, j) => {
    if (h.getBoundingClientRect().top - b.getBoundingClientRect().top < 60) cur = j;
  });
  w.muc = cur;
  const pg = w.el.querySelector(".pg");
  if (pg) pg.textContent = hai(cur + 1) + " / " + hai(h2.length);
  w.el.querySelectorAll(".bk-toc button").forEach((x, j) => x.setAttribute("aria-current", String(j === cur)));
  const truoc = w.el.querySelector('[data-act="prev"]');
  const tiep = w.el.querySelector('[data-act="next"]');
  if (truoc) truoc.disabled = cur === 0;
  if (tiep) tiep.disabled = cur === h2.length - 1;
}
function toanMan(id) {
  const w = WIN.get(id);
  if (!w) return;
  const el = w.el;
  if (el.classList.contains("max")) {
    el.classList.remove("max");
    if (w.prev) el.style.cssText = w.prev;
  } else {
    w.prev = el.style.cssText;
    el.classList.add("max");
  }
  el.style.zIndex = String(++Z);
  dongBo(id);
}
function gan() {
  const bam = (e) => {
    const t = e.target;
    const nut = t.closest("[data-nav]");
    if (nut?.dataset.nav) {
      e.preventDefault();
      doiView(nut.dataset.nav);
      return;
    }
    if (t.closest("#rc")) {
      e.preventDefault();
      datRail(!document.documentElement.classList.contains("rail-gon"));
      return;
    }
    if (t.closest("#tb")) {
      e.preventDefault();
      doiTone();
      return;
    }
    if (t.closest("#lang")) {
      e.preventDefault();
      doiNgu();
      return;
    }
    const nutSap = t.closest("[data-sap]");
    if (nutSap) {
      e.preventDefault();
      doiSap(nutSap.dataset.sap ?? "pri");
      return;
    }
    const nutLoc = t.closest("[data-loc]");
    if (nutLoc) {
      e.preventDefault();
      doiLoc(nutLoc);
      if (G("v-concepts")?.classList.contains("on")) {
        doiView("all");
        apLoc();
      }
      return;
    }
    const chep = t.closest("[data-copy]");
    if (chep) {
      e.preventDefault();
      const ma = chep.closest(".np-cmd")?.querySelector("[data-cmd]")?.textContent;
      if (ma) void navigator.clipboard?.writeText(ma).then(() => {
        const cu = chep.textContent;
        chep.textContent = "đã chép";
        setTimeout(() => {
          chep.textContent = cu;
        }, 1200);
      });
      return;
    }
    const moBai = t.closest("[data-open]");
    if (moBai) {
      e.preventDefault();
      const i = Number(moBai.dataset.open);
      if (BAI[i]) mo(BAI[i]);
      return;
    }
    const rest = t.closest("[data-rest]");
    if (rest) {
      phuc(rest.dataset.rest);
      return;
    }
    const ph = t.closest("[data-phuchoi]");
    if (ph) {
      void phucHoiRac(ph.dataset.phuchoi);
      return;
    }
    const nutKn = t.closest("[data-ketnap]");
    if (nutKn) {
      e.preventDefault();
      void ketNapKhaiNiem(nutKn.dataset.ketnap ?? "", Number(nutKn.dataset.so ?? 0));
      return;
    }
    const tabDm = t.closest("[data-dmtab]");
    if (tabDm) {
      e.preventDefault();
      moTabDm(tabDm.dataset.dmtab ?? "cpt");
      return;
    }
    // Dai loi nap — cung mot ham, khoa khac. Nhanh nay MAT khi file bi
    // `git checkout` pha, va thieu no thi hai trong ba loi khong vao duoc.
    const tabNap = t.closest("[data-naptab]");
    if (tabNap) {
      e.preventDefault();
      moTab("nap", tabNap.dataset.naptab ?? "");
      return;
    }
    const pgDm = t.closest("[data-dmpg]");
    if (pgDm) {
      e.preventDefault();
      const [ten, tr] = (pgDm.dataset.dmpg ?? "").split(":");
      DM_TRANG[ten] = Number(tr);
      veTrangDm(ten);
      return;
    }
    const nutMo = t.closest("[data-mopopup]");
    if (nutMo) {
      e.preventDefault();
      moPopupNhan(nutMo.dataset.mopopup === "cat" ? "cat" : "cpt");
      return;
    }
    if (t.closest("#hoi-ok")) {
      e.preventDefault();
      const o = G("hoi-nhap");
      const coONhap = !G("hoi-o")?.hidden;
      dongHoi(coONhap ? o?.value.trim() || null : true);
      return;
    }
    const nutDong = t.closest("[data-dlgdong]");
    if (nutDong) {
      e.preventDefault();
      nutDong.closest("dialog")?.close();
      return;
    }
    const nutSua = t.closest("[data-suanhan]");
    if (nutSua) {
      e.preventDefault();
      moPopupSua(
        nutSua.dataset.suanhan ?? "",
        nutSua.dataset.nhan ?? "",
        nutSua.dataset.gom ?? ""
      );
      return;
    }
    const nutXoa = t.closest("[data-xoanhan]");
    if (nutXoa) {
      e.preventDefault();
      void xoaNhanTuWeb(nutXoa.dataset.xoanhan ?? "", Number(nutXoa.dataset.dung ?? 0));
      return;
    }
    const win = t.closest(".bk");
    if (!win) return;
    win.style.zIndex = String(++Z);
    const nutAct = t.closest("[data-act]");
    const act = nutAct?.dataset.act;
    if (act === "shut") return dong(win.id);
    if (act === "min") return thu(win.id);
    if (act === "max") return toanMan(win.id);
    if (act === "prev") return buoc(win.id, -1);
    if (act === "next") return buoc(win.id, 1);
    /* Chưng cất RIÊNG — đường THỨ HAI, cạnh đường `chung-cat` đã chốt. */
    if (act === "cc-rieng") {
      const b2 = banDangDoc(WIN.get(win.id));
      if (!b2) return;
      if (!coTranscript(b2)) {
        return bao(true, "Bản ghi này chưa có transcript — bấm «Sinh "
          + "transcript» trước; nội dung video nằm ở transcript.");
      }
      return void goiChunk("moCuaSoChungCat", win, win.id);
    }
    if (act === "chung-cat") {
      // T03-108 · video đi lối TRANSCRIPT (nó chưa có chữ để chưng cất), còn
      // lại đi lối chưng cất. Hai việc tiêu tiền khác nhau nên phép rẽ phải ở
      // một chỗ đọc được, không rải trong chunk.
      const b = banDangDoc(WIN.get(win.id));
      return void goiChunk(
        b?.source_type === "video" ? "moPhieuTranscript" : "moPhieu",
        win, win.id);
    }
    // `cc-gui` KHÔNG ở đây: nút Gửi nay nằm trong `<dialog id="dlg-cc">` ở
    // `<body>`, ngoài `.bk`, nên chính hộp thoại nghe nó (`moPhieuChungCat`).
    if (act === "loai") return moPhieu(win, "loai");
    if (act === "dang") {
      void dangBai(win);
      return;
    }
    // Mở CỬA SỔ MỚI, không điều hướng trang — chủ dự án: *"nút click đó thì mở
    // luôn cửa sổ multi window để xem bài chưng cất tương ứng"*. `canh: win.id`
    // đặt nó CẠNH cửa sổ đang đọc, đúng khuôn `T03-112`.
    /* T03-121 · BẢN GỐC nhị phân — hỏi TRƯỚC, tải SAU.
     *
     * Người bấm không biết mình sắp kéo 2.8 MB hay 210 MB, và trên mạng yếu
     * khác biệt ấy là khác biệt giữa "tải" và "hỏng cả buổi". Chủ dự án chốt
     * hỏi cho MỌI bản gốc nhị phân, không ngưỡng byte: một cửa hỏi-đôi-khi là
     * một cửa người không đoán được.
     *
     * HUỶ ⇒ 0 request: mục này là `<button>`, không `<a download href>` — có
     * `href` là trình duyệt đã đi lấy file trước khi ai kịp hỏi gì.
     */
    /* Nút bản gốc KHÔNG mang `data-act` — nó mang `data-taigoc`. Bản đầu
     * tôi đọc qua `nutAct` (`closest("[data-act]")`) nên nó là `null` và
     * handler ném ngay ở dòng đầu; đo trên màn thật: hộp thoại không mở, 2 lỗi
     * console. Tìm ĐÚNG nút mình cần, không mượn nút của người khác. */
    const nutGoc = t.closest("[data-taigoc]");
    if (nutGoc) {
      const duong = String(nutGoc.dataset.taigoc);
      const nhan = String(nutGoc.dataset.nhan || "Bản gốc");
      const co = String(nutGoc.dataset.co || "");
      const ten = String(nutGoc.dataset.ten || "");
      void (async () => {
        const dongY = await hoi({
          tieuDe: "Tải bản gốc",
          chu: [nhan, co, ten].filter(Boolean).join(" · ")
            + "\n\nTải về máy bạn, không qua kho.",
          nutOk: co ? "Tải " + co : "Tải về",
        });
        if (!dongY) return;                       // 0 request
        const a = document.createElement("a");
        a.href = goc() + "api/xuat/" + duong + "?dang=goc";
        a.download = ten || "";
        a.click();
      })();
      return;
    }
    /* Bậc chất lượng ⇒ mở job `tai-video` (`T12-26`). Theo dõi ở tab Việc như
     * mọi job khác — một thanh tiến trình riêng cho menu này là một chỗ thứ
     * hai kể cùng một câu chuyện. */
    const nutBac = t.closest("[data-taibac]");
    if (nutBac) {
      const bac = String(nutBac.dataset.taibac);
      const sl = String(nutBac.dataset.slug || "");
      void (async () => {
        const r = await fetch(goc() + "api/job", {
          method: "POST", headers: HJ,
          body: JSON.stringify({ loai: "tai-video", slug: sl, chat_luong: bac === "goc" ? "goc" : Number(bac) }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return bao(true, "Không mở được việc tải: " + (d.loi ?? r.status));
        const id = String(d.viec_id || "");
        if (!id) return bao(true, "Cửa không trả `viec_id` — không theo dõi được.");
        theoDoiBac(nutBac, id, bac);
      })();
      return;
    }
    if (act === "goc" || act === "ban-cc") {
      const s2 = nutAct.dataset.goc || nutAct.dataset.cc;
      if (s2) void moTheoSlug(s2, win.id);
      return;
    }
    if (act === "xoa") {
      void xoaTuCua(win.id);
      return;
    }
    if (act === "sua") {
      void suaTuCua(win.id);
      return;
    }
    if (act === "phieu-gui") {
      void guiPhieu(win, win.id, nutAct.dataset.den);
      return;
    }
    if (act === "phieu-huy") {
      dongPhieu(win);
      return;
    }
    if (act === "nhung-video") {
      nhungVideo(nutAct);
      return;
    }
    if (act === "anh-bia") {
      void layLaiAnhBia(nutAct);
      return;
    }
    const jmp = t.closest("[data-jmp]");
    if (jmp) return nhay(win.id, Number(jmp.dataset.jmp));
    const tab = t.closest("[data-tab]");
    if (tab) {
      win.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-current", String(x === tab)));
      // `cc` KHÔNG phải một chỉ số bản ghi ⇒ không đi qua `tai()`.
      if (tab.dataset.tab === TAB_CC) return void veTabChungCat(win);
      if (tab.dataset.tab === TAB_TR) return void goiChunk("veTranscript", win, win.id);
      dungPoll(win);          // rời tab ⇒ dừng poll NGAY, không đợi timeout
      void tai(win.id, Number(tab.dataset.tab));
    }
  };
  const nhan = (e) => {
    const t = e.target;
    const rz = t.closest("[data-rz]");
    if (rz) {
      const el = rz.closest(".bk");
      if (el.classList.contains("max")) return;
      const r = el.getBoundingClientRect();
      RZ = {
        el,
        dir: rz.dataset.rz,
        x: e.clientX,
        y: e.clientY,
        w: r.width,
        h: r.height,
        l: r.left,
        t: r.top
      };
      el.classList.add("rs");
      el.style.zIndex = String(++Z);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const th = t.closest("[data-drag]");
    if (th && !t.closest(".wb")) {
      const el = th.closest(".bk");
      if (el.classList.contains("max")) return;
      const r = el.getBoundingClientRect();
      DG = { el, dx: e.clientX - r.left, dy: e.clientY - r.top };
      el.style.zIndex = String(++Z);
      e.preventDefault();
    }
  };
  const di = (e) => {
    if (RZ) {
      const d = RZ.dir, dx = e.clientX - RZ.x, dy = e.clientY - RZ.y, s = RZ.el.style;
      if (d.includes("e")) s.width = Math.max(MIN_W, Math.min(innerWidth - RZ.l - 8, RZ.w + dx)) + "px";
      if (d.includes("s")) s.height = Math.max(MIN_H, Math.min(innerHeight - RZ.t - 8, RZ.h + dy)) + "px";
      if (d.includes("w")) {
        const w2 = Math.max(MIN_W, Math.min(RZ.l + RZ.w - 8, RZ.w - dx));
        s.width = w2 + "px";
        s.left = RZ.l + RZ.w - w2 + "px";
      }
      if (d.includes("n")) {
        const h = Math.max(MIN_H, Math.min(RZ.t + RZ.h - 56, RZ.h - dy));
        s.height = h + "px";
        s.top = RZ.t + RZ.h - h + "px";
      }
      return;
    }
    if (DG) {
      DG.el.style.left = Math.max(78, Math.min(innerWidth - 120, e.clientX - DG.dx)) + "px";
      DG.el.style.top = Math.max(0, Math.min(innerHeight - 60, e.clientY - DG.dy)) + "px";
    }
  };
  const tha = () => {
    if (RZ) {
      RZ.el.classList.remove("rs");
      dongBo(RZ.el.id);
      RZ = null;
    }
    DG = null;
  };
  const phim = (e) => {
    if (hoiXong) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        G("hoi-ok")?.click();
      }
      return;
    }
    if (e.key !== "Escape") return;
    const ks = [...WIN.keys()].filter((k) => !WIN.get(k).min);
    if (ks.length) dong(ks[ks.length - 1]);
  };
  const khiDongHoi = () => {
    const tra = hoiXong;
    hoiXong = null;
    tra?.(G("hoi-o")?.hidden ? false : null);
  };
  nghe("dlg-hoi", "close", khiDongHoi);
  const cuon = (e) => {
    const el = e.target?.closest?.(".bk");
    if (el) dongBo(el.id);
  };
  const khiBack = () => doiView(manTuUrl(), false);
  window.addEventListener("popstate", khiBack);
  const khiGo = (e) => {
    const o = e.target;
    if (o?.id !== "q") return;
    TIM = o.value;
    if (!G("v-all")?.classList.contains("on")) doiView("all");
    apLoc();
  };
  document.addEventListener("input", khiGo);
  document.addEventListener("click", bam);
  document.addEventListener("mousedown", nhan);
  document.addEventListener("mousemove", di);
  document.addEventListener("mouseup", tha);
  document.addEventListener("keydown", phim);
  document.addEventListener("scroll", cuon, true);
  const w = window;
  w.addCleanup?.(() => {
    window.removeEventListener("popstate", khiBack);
    document.removeEventListener("input", khiGo);
    document.removeEventListener("click", bam);
    document.removeEventListener("mousedown", nhan);
    document.removeEventListener("mousemove", di);
    document.removeEventListener("mouseup", tha);
    document.removeEventListener("keydown", phim);
    document.removeEventListener("scroll", cuon, true);
    G("dlg-hoi")?.removeEventListener("close", khiDongHoi);
  });
}
let io;
function hienPanel() {
  io?.disconnect();
  io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.06 });
  const ds = [...document.querySelectorAll(".rise:not(.in)")];
  ds.forEach((e, i) => {
    e.style.transitionDelay = `${i % 3 * 70}ms`;
    io.observe(e);
  });
  const bars = [...document.querySelectorAll(".bars:not(.in)")];
  for (const e of bars) io.observe(e);
  requestAnimationFrame(() => {
    for (const e of [...ds, ...bars]) {
      const r = e.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) e.classList.add("in");
    }
  });
}
const EN = {
  // FR-027c · nhãn NGẮN cho rail 54px. "Pending"/"Library" vừa; "Catalog" 7 ký
  // tự ở 10.5px cũng vừa. Bản trước dài hơn vì thanh ngang có chỗ.
  // FR-027g · `nav.queue` DA XOA — tab "Duyệt" không còn (màn gộp vào Kho).
  // FR-033 · `pn.queue` XOA THEO — mục Chờ duyệt đã bỏ hẳn, không markup nào
  // còn mang `data-i18n="pn.queue"`. Một khoá dịch không ai tra là dòng chết,
  // và nó còn khai rằng app vẫn có thứ đó.
  "nav.home": "Home",
  "nav.all": "Posts",
  "nav.concepts": "Catalog",
  "nav.nap": "+ add source",
  "nav.kho": "Library",
  // T03-90 · ba khoá của màn Đợt hai. Khai đủ CẢ BA ngay: một khoá thiếu bản EN
  // thì đúng phần đó giữ tiếng Việt và lệch IM LẶNG (fallback mềm) — đúng thứ
  // ghi chú `pn.topics` dưới đây đã trả giá.
  "dothai.title": "Wave two",
  "dothai.dv": "Services",
  "dothai.canh": "Figures below come from sample contracts — not a running system yet.",
  "kho.title": "Library",
  "kho.bytype": "By source type",
  "kho.bynhom": "By content group",
  "kho.bystatus": "Review status",
  "pn.breaking": "Breaking",
  "pn.latest": "Latest",
  "pn.store": "Library",
  "pn.recent": "In the library",
  "pn.allposts": "All analyses",
  "pn.registry": "Concepts",
  "pn.pending": "Proposed by posts",
  "pn.ingest": "Add a source",
  // `pn.topics` THIẾU bản EN từ lượt thêm mốc Chủ đề — đổi sang EN thì panel đó
  // giữ tiếng Việt (fallback mềm nên không vỡ, chỉ lệch im lặng).
  "pn.catalog": "Catalog",
  "pn.topics": "Topics",
  "pn.addlabel": "Add a label",
  "kho.rac": "Recycle bin",
  // `more.concepts` đã xoá: không markup nào mang khoá đó (grep shell.html = 0).
  // Một khoá dịch không ai dùng là một dòng phải đọc mỗi lần sửa từ điển.
  "more.all": "see all",
  "np.h1": "Paste a link into Claude Code",
  "np.h2": "Drop a .md file into ",
  "np.h3": "Validate, then review",
  "np.dl": "⬇ download template .md",
  "np.copy": "copy",
  "skip": "Skip navigation"
};
let NGU = "vi";
const GOC = /* @__PURE__ */ new WeakMap();
function apNgu(ngu) {
  NGU = ngu;
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const k = el.getAttribute("data-i18n");
    if (!GOC.has(el)) GOC.set(el, el.textContent ?? "");
    el.textContent = ngu === "en" ? EN[k] ?? GOC.get(el) : GOC.get(el);
  }
  for (const el of document.querySelectorAll("[data-i18n-html]")) {
    const k = el.getAttribute("data-i18n-html");
    const dau = el.firstChild;
    if (!dau || dau.nodeType !== 3) continue;
    if (!GOC.has(el)) GOC.set(el, dau.textContent ?? "");
    dau.textContent = ngu === "en" ? EN[k] ?? GOC.get(el) : GOC.get(el);
  }
  document.documentElement.lang = ngu;
  const nut = G("lang");
  if (nut) nut.textContent = ngu === "en" ? "EN" : "VI";
  try {
    localStorage.setItem("gn-lang", ngu);
  } catch {
  }
}
function doiNgu() {
  apNgu(NGU === "vi" ? "en" : "vi");
}
function hienKQ(txt, loai) {
  const el = G("upkq");
  if (!el) return;
  el.textContent = txt;
  el.className = "up-kq " + loai;
  el.hidden = false;
}
/*
 * WO-057 · TEN FILE cho vao HEADER.
 *
 * Gia tri header HTTP chi cho **ISO-8859-1**. Mot ten tieng Viet (`Thay on.mp4`)
 * lam `fetch` nem `TypeError` NGAY LUC DUNG REQUEST — 0 byte roi may, va cai
 * `catch` phia duoi tung bao "may chu chua chay?" cho mot loi hoan toan phia
 * client. Do 2026-09-09 tren `:8787` that.
 *
 * Ca AM HON: `cafe.mp4` co dau nam TRONG dai latin1 nen no GUI DUOC, roi Node
 * doc header theo latin1 va ten vao frontmatter bi mojibake — thanh cong voi
 * du lieu sai, nen khong ai phat hien.
 *
 * Loi nay KHONG moi trong file: `x-bo-sung` da percent-encode tu WO-020. Hai
 * header ten file chi la cho bi bo sot.
 *
 * Ham CUC BO, khong dung chung giua hai chunk: `chunk-tu-chua.test.js` (WO-059)
 * cam chunk goi ham cua chunk khac — moi chunk boc IIFE rieng nen mot ham dung
 * chung nem `ReferenceError` ngay lan bam DAU TIEN.
 */
function tenChoHeader(ten) { return encodeURIComponent(String(ten ?? "")) }

async function nopFile(f) {
  if (!f.name.toLowerCase().endsWith(".md")) {
    hienKQ("Chỉ nhận file .md", "loi");
    return;
  }
  if (f.size > 1024 * 1024) {
    hienKQ(`File ${Math.round(f.size / 1024)} KB, vượt trần 1 MB.`, "loi");
    return;
  }
  hienKQ("Đang nộp và chạy cổng…", "ok");
  try {
    const r = await fetch("/api/inbox", {
      method: "POST",
            headers: {
        "content-type": "text/markdown", "x-ten-file": tenChoHeader(f.name),
        // WO-020 · ba o BO SUNG. Server chi dien khoa file THIEU — file thang.
        "x-bo-sung": encodeURIComponent(JSON.stringify({
          than: (G("up-mo") as HTMLTextAreaElement | null)
            ?.value.trim() ?? "",
          category: nhanCua("up", "cat"), concepts: nhanCua("up", "cpt"),
        })),
      },
      body: await f.text()
    });
    const d = await r.json();
    if (!r.ok) {
      hienKQ([d.loi, d.cach_sua].filter(Boolean).join("\n"), "loi");
      return;
    }
    hienKQ(
      `${d.ten}
${(d.gate_ra ?? "").trim()}`,
      d.vao_kho ? "ok" : "loi"
    );
  } catch {
    hienKQ(
      "Không gọi được /api/inbox.\n\nTrang này đang chạy bằng Quartz serve — nó chỉ đọc, không nhận POST.\nNộp file cần:\n  cd web && npm run build && npm run api\nrồi mở http://127.0.0.1:8787",
      "loi"
    );
  }
}
function ganNop() {
  const z = G("upz");
  const inp = G("upf");
  if (!z || !inp) return;
  if (z.dataset.ganRoi) return;
  z.dataset.ganRoi = "1";
  z.addEventListener("click", () => inp.click());
  inp.addEventListener("change", () => {
    const f = inp.files?.[0];
    if (f) void nopFile(f);
    inp.value = "";
  });
  for (const [sk, fn] of [
    ["dragover", (e) => {
      e.preventDefault();
      z.classList.add("keo");
    }],
    ["dragleave", () => z.classList.remove("keo")],
    ["drop", (e) => {
      e.preventDefault();
      z.classList.remove("keo");
      const f = e.dataTransfer?.files?.[0];
      if (f) void nopFile(f);
    }]
  ]) z.addEventListener(sk, fn);
}
const MEDIA = __MEDIA__;
const XUAT = __XUAT__;
/*
 * T03-104 · CÔNG BỐ bảng media cho chunk — DỮ LIỆU, MỘT CHIỀU.
 *
 * `napvideo.inline.ts` cần `MEDIA.video_host`. Nó KHÔNG tự khai `__MEDIA__`
 * được: esbuild thay cả token bằng JSON đầy đủ (**6590 byte**), và nhân đôi
 * con số đó vào chunk sẽ đẩy TỔNG tải đầu của trang nap vượt trần — đo được,
 * không đoán.
 *
 * Đây là ngoại lệ CÓ Ý THỨC với luật "chunk tự chứa" của T03-102, và nó hẹp:
 *   · chỉ DỮ LIỆU, không hàm — chunk không gọi ngược vào `gn.js`
 *   · chunk đọc LÚC GỌI, không lúc nạp ⇒ thứ tự nạp không thành ràng buộc
 *   · một chiều: `gn.js` không bao giờ đọc thứ gì của chunk
 */
globalThis.__GN_MEDIA__ = MEDIA;
/* Định dạng THẬT xem trước được — dẫn xuất từ `xem_truoc === "iframe"`, không
 * từ cả bảng. Bản cũ lấy MỌI `duoi` rồi nối chuỗi "xem trước được", nên từ lúc
 * bảng có mp4 · webm · m4a · mp3 · wav (T01-45) dòng gợi ý của ô nạp TÀI LIỆU
 * nói dối hai lần: kể định dạng của bản ghi video, và bảo chúng xem trước được
 * trong khi `xem_truoc` của chúng là `tai`. */
const DUOI_MEDIA = MEDIA.loai.filter((l) => l.xem_truoc === "iframe")
  .map((l) => l.duoi);
/* Vì sao KHÔNG quay lại `MEDIA.loai.map(l => l.duoi)`: câu gợi ý nối chuỗi
 * "xem trước được" vào danh sách này, và từ lúc bảng có mp4 · webm · m4a · mp3
 * · wav (T01-45) bản cũ nói dối hai lần — kể định dạng của bản ghi VIDEO ở ô
 * nạp TÀI LIỆU, và bảo chúng xem trước được trong khi `xem_truoc` là `tai`. */
let hienVatCho = null;
function kqTV(txt, loai, moc = "up-tv-kq") {
  /* C6b · `moc` mặc định giữ mọi chỗ gọi cũ nguyên văn. Màn nạp video dùng cùng
     hàm này với mốc của nó — hai hàm cho cùng một việc là hai chỗ để lệch, và
     `gn.js` đang sát trần nên nó cũng là byte trả giá không đổi lấy gì. */
  const el = G(moc);
  if (!el) return;
  el.textContent = txt;
  el.className = "up-kq " + loai;
  el.hidden = false;
}
const doGon = (n) => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
async function napHienVatFE(f) {
  const duoi = ("." + (f.name.split(".").pop() ?? "")).toLowerCase();
  const loai = MEDIA.loai.find((l) => l.duoi === duoi) ?? {
    mime: f.type || MEDIA.mac_dinh.mime,
    duoi,
    ten: MEDIA.mac_dinh.ten,
    xem_truoc: MEDIA.mac_dinh.xem_truoc
  };
  if (f.size > MEDIA.tran_byte) {
    kqTV(`File ${doGon(f.size)}, vượt trần ${doGon(MEDIA.tran_byte)}.`, "loi");
    return;
  }
  if (!f.size) {
    kqTV("File rỗng — không có byte nào để lưu.", "loi");
    return;
  }
  kqTV(`Đang nạp ${f.name} (${doGon(f.size)})…`, "ok");
  try {
    const r = await fetch("/api/articles/media", {
      method: "POST",
      headers: { "content-type": loai.mime, "x-ten-goc": tenChoHeader(f.name) },
      body: await f.arrayBuffer()
    });
    const d = await r.json();
    if (!r.ok || !d.sha256) {
      kqTV(d.loi ?? loiMay(r), "loi");
      return;
    }
    hienVatCho = {
      sha256: d.sha256,
      so_byte: d.so_byte ?? f.size,
      mime: d.mime ?? loai.mime,
      ten_goc: d.ten_goc ?? f.name
    };
    kqTV(`Đã nạp ${hienVatCho.ten_goc} · ${doGon(hienVatCho.so_byte)} · ${loai.ten}`, "ok");
    const meta = G("tv-meta");
    if (meta) meta.hidden = false;
    const hv = G("tv-hv");
    if (hv) hv.textContent = `sha256 ${hienVatCho.sha256.slice(0, 12)}… · ${loai.ten}`;
    // WO-028 · o `tv-slug` da go (WO-021); slug nay tu suy luc GUI.
  } catch {
    kqTV(
      "Không gọi được /api/articles/media.\n\nNạp tài liệu cần máy chủ:\n  cd web && npm run api",
      "loi"
    );
  }
}
/** Slug gợi ý từ câu tóm tắt — người dùng sửa được, máy không ép.
 * Nhà THẬT của hàm là đây (bundle chung — ba chỗ gọi: thư viện + form bài
 * viết); bản trong chunk `napvideo` là bản TỰ CHỨA của chunk (khuôn `kqTV`),
 * không phải nguồn. Hàm này từng ở đây tại HEAD, bị dời nhầm khi tách chunk
 * — hotfix 2026-09-05, ô backlog M03 giữ vế cổng chống tái diễn. */
function slugGoiY(cau: string): string {
  return cau.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}
async function ghiBanGhiThuVien() {
  if (!hienVatCho) {
    kqTV("Chưa nạp tài liệu nào.", "loi");
    return;
  }
  const oL = G("tv-1l");
  const motCau = (oL?.value ?? "").trim();
  // WO-028 · cung lo voi `ghiVideo`: o `tv-slug` da go o WO-021 ma ham nay
  // van doc, nen duong nap tai lieu cung chet han. Tu suy, mot cong thuc.
  const slug = slugGoiY(G("tv-title")?.value || motCau);
  if (!motCau) {
    kqTV(LOI_MOT_CAU, "loi");
    return;
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    kqTV(LOI_SLUG, "loi");
    return;
  }
  /*
   * WO-016 · nhãn của FORM NÀY (tiền tố `tv-`), không của form bài viết.
   *
   * Cổng server đòi ≥1 chủ đề + ≥1 khái niệm cho tài liệu. Nói ra ở đây chứ
   * không đợi 422: một câu lỗi sau vòng mạng là câu trả lời đúng ở chỗ sai,
   * và người dùng phải đoán ô nào trống.
   */
  const cat = nhanCua("tv", "cat");
  const cpt = nhanCua("tv", "cpt");
  if (!cat.length || !cpt.length) {
    kqTV(loiNhan("tài liệu"), "loi");
    return;
  }
  const nut = G("tv-gui");
  if (nut) {
    nut.disabled = true;
    nut.setAttribute("aria-busy", "true");
  }
  try {
    /*
     * WO-013/2 · đang SỬA ⇒ PUT vào đúng bản, giữ `If-Match`. Tạo mới ⇒ POST.
     * Không có nhánh này thì "Lưu thay đổi" tạo một bản THỨ HAI cùng slug và
     * server trả 409 — người dùng đọc ra "hỏng", không đọc ra "tôi bấm nhầm".
     */
    const r = SUA_TL ? await fetch("/api/tai-lieu/" + SUA_TL.duong, {
      method: "PUT",
      headers: { ...HJ, "if-match": SUA_TL.etag },
      // WO-031 · `title` phai nam TRONG `frontmatter`. Truoc day no la mot
      // khoa cua chinh `fetch(init)`, ma `fetch` BO QUA khoa la khong canh
      // bao gi — nen sua mot tai lieu la MAT TIEU DE, im lang.
      body: JSON.stringify({ frontmatter: { ...SUA_TL.fm, one_liner: motCau,
        title: G("tv-title")?.value.trim() || null,
        category: cat, concepts: cpt,
        // FR-052 · `media` là MẢNG (schema minItems 1) — object trần bị 422.
        media: [hienVatCho] }, body: thanTu("tv", motCau) }),
    // WO-031 · `/api/tai-lieu`, KHONG `/api/articles`. Bi danh van tao duoc
    // ban ghi nen tinh nang TRONG dung — ma cong rieng cua module tai lieu
    // khong chay. Cung cai bay `nap-video` da ghi cho duong video.
    }) : await fetch("/api/tai-lieu", {
      method: "POST",
      headers: HJ,
      body: JSON.stringify({
        frontmatter: {
          /* KHÔNG đặt `review_status` hay `origin`: server LỘT hai trường đó
             khỏi payload (M08-R5). Gửi lên chỉ để chúng bị xoá là một lời khai
             sai về ai quyết định. */
          id: "src_" + hienVatCho.sha256.slice(0, 10),
          slug,
          source_type: "tai-lieu",
          url: "kho://tai-lieu/" + slug,
          protocol_version: "2.0",
          analyzed_at: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          one_liner: motCau,
          credibility_max: "plausible",
          conformance: "B",
          ho_so: "thu-vien",
          category: cat,
          concepts: cpt,
          // FR-052 · `media` là MẢNG — hotfix 2026-09-05 cùng vụ slugGoiY.
          media: [hienVatCho]
        },
        body: thanTu("tv", motCau)
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      kqTV(d.loi_validate ?? d.loi ?? loiMay(r), "loi");
      return;
    }
    kqTV(`Đã ghi ${d.path} vào kho.`, "ok");
    hienVatCho = null;
    if (oL) oL.value = "";
    const meta = G("tv-meta");
    if (meta) meta.hidden = true;
  } catch {
    kqTV("Không gọi được /api/articles — máy chủ chưa chạy?", "loi");
  } finally {
    if (nut) {
      nut.disabled = false;
      nut.removeAttribute("aria-busy");
    }
  }
}
function ganNapThuVien() {
  const z = G("up-tv-z");
  const inp = G("up-tv-f");
  if (!z || !inp) return;
  inp.accept = "";
  const goi = G("up-tv-goi");
  if (goi) {
    goi.textContent = "hoặc kéo thả vào đây · mọi định dạng · tối đa " + doGon(MEDIA.tran_byte) + " · " + DUOI_MEDIA.join(" ") + " xem trước được";
  }
  if (z.dataset.ganRoi) return;
  z.dataset.ganRoi = "1";
  z.addEventListener("click", () => inp.click());
  inp.addEventListener("change", () => {
    const f = inp.files?.[0];
    if (f) void napHienVatFE(f);
    inp.value = "";
  });
  for (const [sk, fn] of [
    ["dragover", (e) => {
      e.preventDefault();
      z.classList.add("keo");
    }],
    ["dragleave", () => z.classList.remove("keo")],
    ["drop", (e) => {
      e.preventDefault();
      z.classList.remove("keo");
      const f = e.dataTransfer?.files?.[0];
      if (f) void napHienVatFE(f);
    }]
  ]) z.addEventListener(sk, fn);
  nghe("tv-gui", "click", () => void ghiBanGhiThuVien());
  // WO-013/2 · "Thay file…" mở lại chính input đã có — không dựng cơ chế thứ hai.
  const thay = G("tv-hv-thay")
  const inp2 = G("up-tv-f") as HTMLInputElement | null
  if (thay && inp2 && !thay.dataset.ganRoi) {
    thay.dataset.ganRoi = "1"
    thay.addEventListener("click", () => inp2.click())
  }
}
/*
 * ═══ C6b · ĐƯỜNG TẠO VIDEO ═══════════════════════════════════════════════════
 *
 * Trước đơn vị này đường tạo video KHÔNG TỒN TẠI: phần video đã có chỉ là XEM
 * (`idVideo()` · `nhungVideo()`), và đăng ký một video phải đi qua form viết bài
 * chung — tức đúng "gộp chung" người dùng cấm.
 *
 * DÙNG LẠI máy móc đã có, không phát minh cơ chế thứ hai: `kqTV()` báo kết quả ·
 * `MEDIA.video_host` whitelist · `idVideo()` tách host+id. `gn.js` đang 95/100 KB.
 *
 * KHÔNG tự tính `url_normalized`: `validate.py --fix` điền bằng `normalize_url()`
 * (T01-29). Viết lại phép chuẩn hoá bằng JS là bản THỨ HAI của một công thức đã
 * có — đúng lớp lỗi `dongBoThe`, nơi hai bên dựng cùng một khoá bằng hai đường.
 */

/*
 * Host kiểm TẠI CHỖ DÁN (M11-R3). `idVideo()` nhận dạng ĐÃ RÚT GỌN, còn ở đây
 * người dùng dán URL THÔ — nên so `hostname` với `mien` của bảng khai.
 *
 * So theo HẬU TỐ có dấu chấm, không `includes`: `includes("youtube.com")` khớp
 * cả `youtube.com.ke-xau.example`. Cùng phép so mà `cong-module.mjs` dùng ở
 * server — hai nơi, một luật, và luật đó nằm trong bảng khai.
 */
function idVideo(un) {
  /*
   * WO-022 · HA CHU THUONG CHI DE SO HOST, KHONG DE BOC ID.
   *
   * Truoc day ca url bi ha, nen `dQw4w9WgXcQ` thanh `dqw4w9wgxcq` — id sai
   * VAN khop `^[A-Za-z0-9_-]{11}$` nen khong cong nao keu, va iframe tro
   * vao mot video khac. Id YouTube la base64url, PHAN BIET hoa-thuong.
   *
   * Cung hinh dang `normalize_url()` phia Python da dung: ha rieng phan
   * host, giu nguyen phan con lai. Hai noi, mot luat.
   */
  const g = String(un ?? "");
  const s = g.toLowerCase();
  for (const h of MEDIA.video_host) {
    if (s !== h.mien && !s.startsWith(h.mien + "/") && !s.startsWith(h.mien + "?")) continue;
    const m = new RegExp(h.id_tu, "i").exec(g);
    if (!m) return null;
    if (!new RegExp(h.id_mau).test(m[1])) return null;
    // Tra CO/KHONG, khong tra chinh chuoi nhung: `media-cua-so` doi ham dung
    // markup KHONG cham `.nhung` — mot chuoi host di qua day la mot buoc gan
    // hon toi cho no lot vao markup, va luc do mo trang la goi ra ngoai.
    // `nhungVideo` tu tra lai dong host tu `MEDIA.video_host` theo `nhan`,
    // nen chuoi nay o day von da khong ai dung.
    return { nhan: h.nhan, nhungDuoc: !!h.nhung, id: m[1] };
  }
  return null;
}
/** T03-111 · đổ CHỮ của hiện vật van-ban vào <pre> — textContent, không HTML. */
function napVanBanXemTruoc(goc: HTMLElement) {
  for (const o of goc.querySelectorAll<HTMLElement>("[data-hv-txt]")) {
    const duong = o.dataset.hvTxt; delete o.dataset.hvTxt;   // mỗi ô fetch đúng một lần
    if (!duong) continue;
    fetch(duong).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => { o.textContent = t; })
      .catch(() => { o.textContent = "Không đọc được nội dung — dùng nút tải về."; });
  }
}
function xemTruocHienVat(ban) {
  /*
   * `FR-052` · `media` là MẢNG. Cửa sổ đọc chỉ hiện MỘT bản xem trước — nhưng
   * "một" phải là cái ĐÁNG XEM, không phải cái được nạp đầu.
   *
   * Bug chủ dự án bắt 2026-09-06: sinh transcript xong thì VIDEO BIẾN MẤT.
   * Đo trên bản ghi thật — `media = [ {text/vtt} ]`, còn `url` YouTube nguyên
   * vẹn. Không mất DỮ LIỆU; mất CHỖ: `media[0]` là `.vtt`, hàm thoát sớm ở đó,
   * và nhánh vẽ trình phát bên dưới không bao giờ chạy.
   *
   * Lọc theo cờ `chi_dan_xuat` của `media-mime.json` — cờ ĐÃ CÓ SẴN cho
   * `.vtt`, chỉ chưa ai đọc nó ở đây. Gõ cứng `text/vtt` thì loại dẫn xuất thứ
   * hai (giọng đọc, tóm tắt máy) lại chiếm chỗ y hệt.
   *
   * Hiện vật dẫn xuất KHÔNG bị giấu — nó có nhà riêng: tab Transcript
   * (`T03-108`), và nút tải ở đó.
   */
  const ds = (Array.isArray(ban.media) ? ban.media : [ban.media]).filter(Boolean);
  const danXuat = new Set((MEDIA.loai ?? [])
    .filter((l) => l.chi_dan_xuat).map((l) => l.mime));
  const m = ds.find((x) => !danXuat.has(String(x?.mime))) ?? null;
  if (m && /^[0-9a-f]{64}$/.test(String(m.sha256 ?? ""))) {
    // FR-039 · mime ngoài bảng vẫn NẠP được ⇒ viewer không được câm: rơi về
    // `mac_dinh` (thẻ + nút tải), đừng trả rỗng — hotfix 2026-09-05, cùng vụ
    // nạp .md; hiển thị NỘI DUNG văn bản là T03-111.
    const loai = MEDIA.loai.find((l) => l.mime === m.mime) ?? MEDIA.mac_dinh;
    const duong = "/api/articles/media/" + m.sha256;
    const ten = esc(String(m.ten_goc || loai.ten));
    const cong = `<a class="bt ghost sm" href="${duong}" download>tải về</a>`;
    if (loai.xem_truoc === "van-ban" && Number(m.so_byte) <= (MEDIA.tran_van_ban_byte ?? 524288)) {
      // T03-111 · fetch SAU khi cửa sổ dựng (napVanBanXemTruoc) — nội dung đổ
      // bằng textContent, không bao giờ thành DOM (no-dangerous-html).
      return `<div class="hv"><pre class="hv-txt" data-hv-txt="${duong}">Đang tải ${ten}…</pre><p class="hv-c"><span>${ten}</span>${cong}</p></div>`;
    }
    /*
     * WO-064 · PHAT bang the GOC cua trinh duyet.
     *
     * `FR-075` bien "mp4 trong kho" tu ca bien thanh duong CHINH, nen nam dong
     * nhom video doi `xem_truoc` tu `tai` sang `phat`. Truoc do khoi nay roi
     * xuong nhanh cuoi va noi *"Trinh duyet khong mo duoc dang nay"* cho mot
     * .mp4 — mot cau sai ve ky thuat, va nguoi doc tin no.
     *
     * `<audio>` cho `audio/*`, KHONG dung `<video>` cho ca hai: mot mp3 trong
     * the `<video>` la mot khung den, va nguoi dung se tuong file hong.
     *
     * `preload="metadata"`: du de co thoi luong + thanh keo, va KHONG tai ca
     * file khi mo cua so. Voi tran 1 GB (`FR-054`) thi `preload="auto"` la mot
     * lan tai ca gigabyte cho mot lan mo cua so.
     */
    /*
     * KHÔNG có nhánh `xem_truoc === "anh"`, và đó là CÓ CHỦ Ý.
     *
     * Ảnh khai `chi_dan_xuat: true` (máy sinh), nên phép tìm hiện vật CHÍNH ở
     * trên BỎ QUA nó — y như `.vtt`. Một bản ghi video có thumbnail thì cửa sổ
     * phải hiện TRÌNH PHÁT, không phải tấm ảnh bìa; ảnh là chuyện của THẺ.
     *
     * Tôi đã thêm một nhánh `anh` ở đây rồi GỠ trong cùng lượt: đo được nó
     * KHÔNG BAO GIỜ chạy (mọi mime ảnh đều `chi_dan_xuat`, và danh sách định
     * dạng người nạp được làm tài liệu không có ảnh). Mã chết + trần trang
     * đang âm = gỡ. Ngày nào ảnh thành hiện vật CHÍNH của một bản ghi, đây là
     * chỗ thêm lại.
     */
    if (loai.xem_truoc === "phat") {
      const the = String(m.mime ?? "").startsWith("audio/") ? "audio" : "video";
      return `<div class="hv"><${the} class="hv-p" src="${duong}" controls preload="metadata"></${the}><p class="hv-c"><span>${ten}</span>${cong}</p></div>`;
    }
    if (loai.xem_truoc === "iframe") {
      return `<div class="hv"><iframe class="hv-f" src="${duong}" title="${ten}" loading="lazy"></iframe><p class="hv-c"><span>${ten}</span>${cong}</p></div>`;
    }
    return `<div class="hv the"><p class="hv-c"><b>${ten}</b><span>${esc(loai.ten)} · ${doGon(Number(m.so_byte) || 0)}</span>${cong}</p><p class="ld">Trình duyệt không mở được dạng này — tải về để xem.</p></div>`;
  }
  /*
   * WO-075 · MOT khung, HAI ket cuc — thay vi hai khoi markup roi rac.
   *
   * Nen lay lai `.cd-n` cua THE ngoai danh sach: y het bo mask icon + mau theo
   * loai, 0 luat CSS moi. Anh that neu kho co (tiktok/fb/youtube); khong co thi
   * icon + mau (douyin — Argus chan, xem `media-mime.json`).
   *
   * Bam thi:
   *   host khai `nhung`      -> nhung TAI CHO, van chi goi ra ngoai khi NGUOI bam
   *   host khai `nhung: null` -> mo tab nguon
   *
   * Ca hai deu la mot nut tren cung mot poster, nen nguoi khong phai hoc hai
   * hinh dang cho cung mot viec. Va quyet dinh van o BANG KHAI: them mot nen
   * tang la sua mot dong, 0 dong ma.
   */
  const v = idVideo(ban.url_normalized);
  const ng = ban.url_normalized || "";
  if (!v && !ng.includes(".")) return "";
  const bia = (Array.isArray(ban.media) ? ban.media : [])
    .find((m) => String(m?.mime ?? "").startsWith("image/"))?.sha256;
  // `data-i` CHI khi KHONG co anh — dung luat `nenThe()` cua the ngoai danh
  // sach. Dat ca hai thi icon de len anh that, va do la thu vua nhin thay.
  const nen = bia
    ? `<span class="cd-n"><img src="/api/articles/media/${esc(bia)}" onerror="this.remove()"></span>`
    : `<span class="cd-n"${v ? ` data-i="${esc(v.nhan)}"` : ""}></span>`;
  // Nhan boc trong <b> de co mot vien thuoc DAC: no nam GIUA khung, ma o giua
  // la cho icon (hoac chi tiet anh) — chu tran khong doc noi tren ca hai.
  const xem = v?.nhungDuoc
    ? `<button class="hv-play" data-act="nhung-video" data-nhan="${esc(v.nhan)}" data-vid="${esc(v.id)}"><b>▶ Xem</b></button>`
    : `<a class="hv-play" href="https://${esc(ng)}" target="_blank" rel="noopener"><b>▶ Xem ở nguồn ↗</b></a>`;
  // `duong ?? slug` — HAI duong mo cua so mang hai hinh dang khac nhau, va do
  // duoc tren may that: mo tu DANH SACH thi `ban.slug` da la `<loai>/<slug>`
  // day du; mo TU URL (`moTheoSlug`) thi phong bi dat `slug` = `url_normalized`
  // (dung de hien thi) va duong that nam o `duong`. Chi doc mot trong hai thi
  // mot nua so cua so co mot cai nut khong lam gi.
  //
  // Nut lam lai anh bia CHI hien khi DA co anh — do la ca ca dung cua no:
  // "tam nay sai, lay lai". Ban ghi chua co anh thi LOI da tu xep viec roi, va
  // mot nut chay vao cho chac chan hong (douyin) la mot nut lua nguoi.
  const lai = bia
    ? `<button class="hv-lai" data-act="anh-bia" data-duong="${esc(ban.duong ?? ban.slug ?? "")}" title="lấy lại ảnh bìa">↻</button>`
    : "";
  return `<div class="hv vid" data-hv-vid>${nen}${xem}${lai}</div>`;
}
/* `ep: true` — CO EP, va no ton tai vi mot ca that: TikTok cong bo ba ban
   thumbnail va ban "tot nhat" theo yt-dlp la mot tam gradient TRONG. Khong co
   duong nay thi ban ghi KET vinh vien voi anh hong: moi lan chay lai deu bi
   chinh luat "da co anh ⇒ thoi" chan, kem cau loi nghe nhu dang lam dung.
   `ep` CHI mo dung luat ay — allowlist va loai tru douyin giu nguyen. */
async function layLaiAnhBia(nut) {
  const d = nut.dataset.duong;
  if (!d) return;
  nut.disabled = true;
  const cu = nut.textContent;
  nut.textContent = "…";
  try {
    const r = await fetch("/api/job", {
      method: "POST", headers: HJ,
      body: JSON.stringify({ loai: "sinh-thumbnail", slug: d, ep: true }),
    });
    nut.textContent = r.ok ? "✓" : "!";
    nut.title = r.ok ? "đã xếp việc — mở lại cửa sổ sau ít giây" : "không xếp được việc";
  } catch {
    nut.textContent = "!";
    nut.title = "không nối được máy chủ";
  }
  setTimeout(() => { nut.textContent = cu; nut.disabled = false; }, 4000);
}
function nhungVideo(nut) {
  const h = MEDIA.video_host.find((x) => x.nhan === nut.dataset.nhan);
  const id = String(nut.dataset.vid ?? "");
  // `!h.nhung`: host khai khong nhung duoc thi khong bao gio dung `src`.
  // Thieu phep nay thi `f.src = null + id` ra chuoi "null7543..." — mot
  // request rac ra chinh origin cua ta, va no im lang.
  if (!h || !h.nhung || !new RegExp(h.id_mau).test(id)) return;
  const o = nut.closest("[data-hv-vid]");
  if (!o) return;
  const f = document.createElement("iframe");
  f.className = "hv-f";
  f.title = "video";
  f.setAttribute("allowfullscreen", "");
  /*
   * WO-032 · `origin`, KHONG `no-referrer`.
   *
   * YouTube TU CHOI PHAT khi khung nhung khong gui `Referer` — do la Loi 153
   * *"Loi cau hinh trinh phat video"*. Do duoc tren trinh duyet that, hai
   * khung canh nhau, cung mot video, khac DUNG mot thuoc tinh:
   *   no-referrer  ->  Error 153
   *   origin       ->  video nap binh thuong
   *
   * `origin` la CHAT NHAT trong nhung gia tri con chay duoc: gui
   * `http://localhost:8787`, KHONG gui duong dan trang dang doc.
   * Mien nhung rieng cua YouTube giu nguyen — no chan cookie theo doi, khong
   * quan loi 153.
   */
  f.setAttribute("referrerpolicy", "origin");
  f.src = h.nhung + id;
  o.replaceChildren(f);
}
const TANG = ["cat", "loai", "cpt", "pl", "nguon"];
// WO-014 · `pl` (phân loại) và `nguon` (loại nguồn) là HAI chiều. Dựng LOC từ
// chính `TANG` thay vì liệt tay: hai danh sách cho cùng một tập khoá là hai
// chỗ để lệch, và lệch ở đây nghĩa là một facet bấm không ăn mà không lời nào.
const LOC = Object.fromEntries(TANG.map((k) => [k, new Set<string>()]))
let TIM = ""
const boDau = (s: string) => s.toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
let SAP = "pri"
function apSap() {
  for (const luoi of document.querySelectorAll(".grid")) {
    const the = [...luoi.querySelectorAll<HTMLElement>(".cd")]
    if (the.length < 2) continue
    const ngay = (e: HTMLElement) => e.dataset.ngay ?? ""
    const pri = (e: HTMLElement) => Number(e.dataset.pri ?? 0)
    the.sort((a, b) =>
      SAP === "pri"
        ? pri(b) - pri(a) || ngay(b).localeCompare(ngay(a))
        : SAP === "moi"
          ? ngay(b).localeCompare(ngay(a)) || pri(b) - pri(a)
          : ngay(a).localeCompare(ngay(b)) || pri(b) - pri(a))
    for (const e of the) luoi.appendChild(e)
  }
  for (const b of document.querySelectorAll("[data-sap]")) {
    b.setAttribute("aria-pressed", String(b.dataset.sap === SAP));
  }
}
function doiSap(kieu) {
  SAP = kieu === "moi" ? "moi" : kieu === "cu" ? "cu" : "pri";
  apSap();
}
function apLoc() {
  const co = (khoa) => LOC[khoa].size > 0;
  const tim = boDau(TIM.trim());
  for (const the of document.querySelectorAll(".cd")) {
    const datTang = TANG.every((k) => {
      if (!co(k)) return true;
      const gt = (the.dataset[k] ?? "").split(" ").filter(Boolean);
      return gt.some((v) => LOC[k].has(v));
    });
    const datTim = !tim || boDau(the.textContent ?? "").includes(tim);
    the.classList.toggle("off", !(datTang && datTim));
  }
  const tatCa = document.querySelector(".fl-all");
  tatCa?.setAttribute("aria-pressed", String(!TANG.some(co)));
  /*
   * WO-015/BUG-2 · ĐẾM TRONG TỪNG LƯỚI, không đếm cả trang.
   *
   * Bản cũ: `document.querySelectorAll(".cd:not(.off)")` — cả tài liệu. Mọi màn
   * nằm trong cùng một trang (shell mang cả các màn), nên con số là TỔNG của
   * Trang chủ + Tổng hợp + ba màn loại. Đo được trên kho tạm 4 bản ghi: nhãn
   * "14 bản" đứng cạnh một lưới có **7** thẻ.
   *
   * Mỗi lưới khai ô đếm của nó bằng `data-dem` trong shell, nên FE không gõ
   * `acount` cho mọi lưới — một id cứng nghĩa là lọc ở màn Video ghi số vào
   * nhãn của màn Tổng hợp.
   */
  for (const luoi of document.querySelectorAll<HTMLElement>(".grid[data-dem]")) {
    const nhan = G(luoi.dataset.dem ?? "")
    if (!nhan) continue
    const hien = luoi.querySelectorAll(".cd:not(.off)").length
    nhan.textContent = hien ? hien + " bản" : ""
  }
  /*
   * WO-082 · Trần đặt SAU phép đếm, và `datLai = true`.
   *
   * Sau, vì nhãn phải nói về tập ĐÃ LỌC — không về phần đang hiện. Đếm cả
   * `.qua` ra ngoài thì mở màn thấy "12 bản" trên một kho 30 bản (cùng lý lẽ
   * WO-015/BUG-2: một tổng kết đổi theo cái đang hiện thì không phải tổng kết).
   *
   * `datLai`, vì mỗi lần vào đây là một tập MỚI. Giữ trần đã nới của bộ lọc
   * trước nghĩa là bấm "xem thêm" một lần rồi thì mọi bộ lọc sau đó mở sẵn —
   * trần còn tên mà hết răng.
   */
  for (const luoi of document.querySelectorAll<HTMLElement>(".grid")) capNhin(luoi, true)
  ghiLocVaoUrl();
}

/*
 * WO-082 · TRẦN HIỂN THỊ — cắt cái NHÌN THẤY, không cắt ở server.
 *
 * Chủ dự án 2026-09-09: *"ko có cơ chế phân trang và limit size, nên khi dữ
 * liệu nhiều là bị tràn màn"*. `/tat-ca/` có phân trang thật (`trangTatCa`,
 * `NGUONG.moiTrang`); `grid2` thì không — `trang.mjs:590` đổ cả mảng.
 *
 * Vì sao KHÔNG thêm slice vào `grid2`: ba màn loại (`/video/`, `/tai-lieu/`,
 * `/kho/`) DÙNG CHUNG lưới ấy và lọc ở FE bằng class `.off`. Cắt 12 thẻ đầu ở
 * server nghĩa là một video xếp thứ 25 theo thứ tự chung KHÔNG TỒN TẠI trên
 * màn `/video/` — dù màn ấy chỉ có 4 video. Đó là mất dữ liệu trên màn.
 *
 * Nên trần đếm trên tập **chưa bị lọc**, và tính lại mỗi lần lọc.
 */
const TRAN_NHIN = 12;

function capNhin(o, datLai, chon) {
  if (!o) return;
  if (datLai) delete o.dataset.cap;
  const c = Number(o.dataset.cap) || TRAN_NHIN;
  /*
   * WO-086 · ĐƠN VỊ BỊ CẮT do bên gọi khai, không gõ cứng ở đây.
   *
   * Bản đầu neo cứng `.cd`. Đúng khi mọi lưới đều là lưới thẻ. Rồi `SCR-26`
   * đổi `/chung-cat/` sang DÒNG BÀI (`.cc-bai`) — và một `capNhin` neo `.cd`
   * sẽ vẫn chạy, vẫn không ném, chỉ là **không cắt gì cả** (hoặc tệ hơn: cắt
   * các CHẶNG bên trong dòng). Trần im lặng ngừng chạy là thứ không cổng nào
   * bắt được nếu phép đo cũng neo cứng cùng một chuỗi.
   */
  const ds = [];
  for (const e of o.querySelectorAll(chon || ".cd")) {
    e.classList.remove("qua");
    if (!e.classList.contains("off")) ds.push(e);
  }
  for (let i = c; i < ds.length; i++) ds[i].classList.add("qua");
  const du = ds.length - c;
  const s = o.nextElementSibling;
  let n = s && s.classList.contains("xem-them") ? s : null;
  if (du <= 0) return void n?.remove();
  if (!n) {
    n = document.createElement("button");
    n.className = "bt ghost sm xem-them";
    /*
     * Đọc LẠI `dataset.cap` trong tay nghe, không dùng `c` của biến đóng.
     * Nút dựng đúng một lần; bám vào `c` lúc dựng thì lần bấm thứ hai cộng
     * lại từ cùng con số cũ và danh sách đứng im — bẫy đã đo được.
     */
    n.onclick = () => {
      o.dataset.cap = String((Number(o.dataset.cap) || TRAN_NHIN) + TRAN_NHIN);
      // `sel` phải đi theo: quên nó thì lần bấm thứ hai cắt theo `.cd` trong
      // khi lần đầu cắt theo `.cc-bai` — hai phép cắt trên cùng một lưới.
      capNhin(o, false, chon);
    };
    o.after(n);
  }
  n.textContent = `xem thêm ${Math.min(TRAN_NHIN, du)} · còn ${du}`;
}
function ghiLocVaoUrl() {
  const p = new URLSearchParams();
  if (TIM.trim()) p.set("tim", TIM.trim());
  for (const k of TANG) {
    if (LOC[k].size) p.set(k, [...LOC[k]].join(","));
  }
  const q = p.toString();
  const moi = location.pathname + (q ? "?" + q : "");
  if (location.pathname + location.search !== moi) {
    history.replaceState(history.state, "", moi);
  }
}
function docLocTuUrl() {
  const p = new URLSearchParams(location.search);
  TIM = p.get("tim") ?? "";
  for (const k of TANG) {
    LOC[k].clear();
    for (const v of (p.get(k) ?? "").split(",").filter(Boolean)) LOC[k].add(v);
  }
  const o = G("q");
  if (o) o.value = TIM;
  document.querySelectorAll("[data-loc][data-gt]").forEach((b) => {
    const k = b.dataset.loc ?? "";
    b.setAttribute("aria-pressed", String(!!LOC[k]?.has(b.dataset.gt ?? "")));
  });
}
function doiLoc(nut) {
  const khoa = nut.dataset.loc ?? "";
  if (khoa === "reset") {
    for (const k of TANG) LOC[k].clear();
    document.querySelectorAll("[data-loc][data-gt]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    apLoc();
    return;
  }
  const bo = LOC[khoa];
  if (!bo) return;
  const gt = nut.dataset.gt ?? "";
  const bat = bo.has(gt);
  if (bat) bo.delete(gt);
  else bo.add(gt);
  nut.setAttribute("aria-pressed", String(!bat));
  apLoc();
}
const DUONG = __DUONG__
function goc() {
  return location.pathname.startsWith("/mock/") || location.pathname === "/mock" ? "/mock/" : "/";
}
function manTuUrl() {
  const p = location.pathname.replace(/^\/mock\/?/, "/").replace(/^\/+|\/+$/g, "");
  /*
   * KHOP CA DUONG, khong chi doan DAU — BUG DA THAY TREN TRINH DUYET.
   *
   * Ban cu lay `p.split("/")[0]`, nen `/tai-lieu/nap/` cho `tai-lieu` va khop
   * man DANH SACH `tailieu`. Hau qua: SSR tra dung man nap, roi `khoiDong()`
   * goi `doiView(manTuUrl())` va GHI DE. Tieu de trang noi "Nap tai lieu"
   * trong khi than trang hien danh sach rong.
   *
   * Sap theo DO DAI GIAM DAN roi lay khop dai nhat: `tai-lieu/nap` phai thang
   * `tai-lieu`, khong thi moi duong long nhau roi ve man cha.
   */
  const khop = Object.keys(DUONG)
    .filter((k) => DUONG[k] !== "" && (p === DUONG[k] || p.startsWith(DUONG[k] + "/")))
    .sort((a, b) => DUONG[b].length - DUONG[a].length)[0]
  return khop ?? "home";
}
function doiView(v, ghiUrl = true) {
  /*
   * VƯỢT MODULE ⇒ TẢI TRANG THẬT.
   *
   * Máy chủ chỉ phát header cho màn CÙNG MODULE (`phatHeaderCho`) — vì luật
   * *"ba module tách biệt ở mọi tầng"* cấm tài liệu `/tai-lieu/` chứa nút
   * *"viết bài"*, kể cả ẩn. Nên "không có header cho view đích" chính là dấu
   * hiệu ta đang vượt biên module.
   *
   * Đổi view mà không đổi được header là đúng bug chủ dự án bắt 2026-09-07:
   * URL nói `/tai-lieu/`, nút vẫn *ĐĂNG KÝ VIDEO*, và bấm vào là đi đăng ký
   * một video.
   */
  if (v in DUONG && !document.querySelector(`[data-napfor~="${CSS.escape(v)}"]`)) {
    const duong2 = goc() + (DUONG[v] ? DUONG[v] + "/" : "");
    if (location.pathname !== duong2) { location.href = duong2; return; }
  }
  if (v in DUONG && !G("v-" + v)) {
    const duong = goc() + (DUONG[v] ? DUONG[v] + "/" : "");
    if (location.pathname !== duong) location.href = duong;
    return;
  }
  document.querySelectorAll(".view").forEach((e) => e.classList.remove("on"));
  G("v-" + v)?.classList.add("on");
  document.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.v === v)));
  document.querySelectorAll("[data-nav]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.nav === v)));
  /*
   * HEADER đi theo màn (bug chủ dự án bắt 2026-09-07).
   *
   * Nút nạp và số đếm KHÔNG nằm trong `.view` nào, nên trước đợt này chúng
   * đứng lại ở màn render lúc tải trang: đứng ở `/tai-lieu/` mà nút vẫn là
   * *ĐĂNG KÝ VIDEO*, và bấm vào là đi đăng ký một video.
   *
   * Máy chủ đã phát SẴN header của mọi màn; ở đây chỉ đổi cờ `hidden`. Không
   * dựng HTML trong JS: luật "màn nào nút nào" đọc `man-hinh.json` ở máy chủ,
   * và chép nó sang FE là dựng bản thứ hai của một bảng khai.
   */
  {
    // NÚT NẠP: đổi bằng cờ `hidden` — máy chủ đã phát sẵn nút của mọi màn.
    // `data-napfor` mang DANH SÁCH view (nhiều màn dùng chung một nút) —
    // gộp như vậy vì phát mười ba bản rời làm vỡ trần HTML trang chủ.
    const co = (e, kh) => String(e.dataset[kh] || "").split(" ").includes(v);
    const ds = document.querySelectorAll("[data-napfor]");
    // Màn KHÔNG có nút nào (view chỉ tồn tại ở tài liệu khác) ⇒ giữ nguyên
    // cái đang hiện, không xoá trắng header.
    if ([...ds].some((e) => co(e, "napfor"))) {
      for (const e of ds) e.hidden = !co(e, "napfor");
    }
    // SỐ ĐẾM: chữ của màn đang mở là TEXT TRỰC TIẾP của `#tcount` (cổng
    // `real-vs-mock` đọc đúng chỗ ấy), các màn khác nằm trong `<i hidden>`.
    const tc = G("tcount");
    const nguon = tc?.querySelector(`[data-tcfor~="${CSS.escape(v)}"]`);
    if (tc && nguon) {
      const dau = [...tc.childNodes].find((n) => n.nodeType === 3);
      if (dau) dau.textContent = nguon.textContent ?? "";
      else tc.prepend(document.createTextNode(nguon.textContent ?? ""));
    }
  }
  window.scrollTo(0, 0);
  hienPanel();
  if (ghiUrl) {
    const duong = goc() + (DUONG[v] ? DUONG[v] + "/" : "");
    if (location.pathname !== duong) {
      history.pushState({ view: v }, "", duong + location.search);
    }
  }
}
function doiTone() {
  const r = document.documentElement;
  const dangToi = r.getAttribute("data-theme") === "dark";
  r.setAttribute("data-theme", dangToi ? "light" : "dark");
  r.setAttribute("saved-theme", dangToi ? "light" : "dark");
  const nut = G("tb");
  if (nut) nut.textContent = dangToi ? "☾" : "☀";
  try {
    localStorage.setItem("gn-theme", dangToi ? "light" : "dark");
  } catch {
  }
  document.dispatchEvent(new CustomEvent("gn-tone"));
}
/*
 * THU GON THANH BEN. Dat MOT class tren <html>, va CSS lo phan con lai qua
 * bien `--rail-w` — nen o day khong co mot con so hinh hoc nao.
 *
 * `aria-expanded` dat cung nhip: nut nay an ca mot vung dieu huong, va mot
 * nut noi sai trang thai cho trinh doc man hinh la mot nut noi doi.
 */
function datRail(gon) {
  document.documentElement.classList.toggle("rail-gon", gon);
  const n = G("rc");
  if (n) {
    n.setAttribute("aria-expanded", gon ? "false" : "true");
    n.setAttribute("aria-label", gon ? "mở thanh bên" : "đóng thanh bên");
  }
  try {
    localStorage.setItem("gn-rail", gon ? "gon" : "mo");
  } catch { }
}

let API_CO = false;
async function doTimApi() {
  const truoc = API_CO;
  if (goc() !== "/") {
    API_CO = false;
  } else {
    try {
      API_CO = (await fetch("/api/health")).ok;
    } catch {
      API_CO = false;
    }
  }
  document.body.classList.toggle("api-co", API_CO);
  if (goc() === "/" && !API_CO) {
    bao(true, "Mất kết nối API — nút ghi đã tắt. Kiểm tra `npm run api` rồi tải lại.");
  }
  if (API_CO && !truoc) {
    void napDanhMuc();
    void veRac();
    void dongBoThe();
  }
}
function bao(loi, chu) {
  document.querySelector(".gn-bao")?.remove();
  const b = document.createElement("div");
  b.className = "gn-bao" + (loi ? " loi" : "");
  b.textContent = chu;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 6e3);
}

/*
 * MỘT bảng chữ cho bốn giá trị `review_status` (`T03-119`).
 *
 * Chủ dự án báo *"toast mù"*, và câu cũ là `Đã ghi rejected vào kho`. Hai lỗi
 * chồng nhau: không có CHỦ NGỮ (bài nào?), và `rejected` là giá trị enum —
 * chữ của MÁY lọt thẳng ra câu cho NGƯỜI. Người vừa bấm ✕ Loại đọc câu ấy
 * không biết bài còn trong kho hay đã đi mất, nên họ F5 để tự kiểm.
 *
 * Một bảng, mọi chỗ đọc: hai bản dịch cho một enum là hai chỗ để lệch nhau.
 */
const NHAN_TT = {
  draft: "bản nháp trong kho",
  edited: "đã sửa, chưa lên site",
  approved: "đang trên site",
  rejected: "đã loại — vẫn ở trong kho",
};
const nhanTrangThai = (st) => NHAN_TT[String(st)] ?? String(st ?? "");

/*
 * Nhãn NGỮ CẢNH chân cửa sổ: bài này ĐANG Ở ĐÂU.
 *
 * `approved` là trạng thái duy nhất người ngoài THẤY được. Ba trạng thái còn
 * lại khác nhau về lý do nhưng giống nhau ở chỗ quan trọng nhất — chưa ai
 * ngoài kho đọc được — nên chúng chung một nhãn, phần khác nhau đã nằm ở
 * `NHAN_TT` và ở bộ nút.
 */
const nhanCanh = (st) =>
  String(st) === "approved" ? "ĐANG TRÊN SITE" : "KHO — chưa lên site";

/*
 * Câu báo sau một PHÁN QUYẾT — dựng ở MỘT chỗ.
 *
 * Mỗi câu phải trả lời đủ ba: bài nào · vừa thành gì · giờ nó nằm đâu. Vế thứ
 * ba là vế người đi F5 để tìm.
 */
function toastPhanQuyet(ban, den) {
  const t = String(ban?.title ?? "Bài");
  if (den === "approved")
    return bao(false, `Đã đưa "${t}" lên site — hiện ra sau lần dựng trang kế tiếp.`);
  if (den === "rejected")
    return bao(false, `Đã loại "${t}" — bài VẪN nằm trong kho kèm lý do, không mất đi đâu.`);
  bao(false, `Đã ghi "${t}" vào kho — ${nhanTrangThai(den)}.`);
}

/*
 * Thẻ ngoài lưới đổi TẠI CHỖ (`T03-119`).
 *
 * Cửa sổ đổi rồi mà lưới sau lưng còn trạng thái cũ thì màn đang nói hai điều
 * trái nhau, và người tin cái nào cũng có lý. F5 là cách họ hỏi lại — nghĩa là
 * màn vừa thú nhận nó không chắc mình vừa làm gì.
 *
 * `tt === null` ⇒ thẻ RỜI lưới (Bỏ khỏi kho). Gạch trước rồi mới gỡ: một thẻ
 * biến mất tức thì không cho mắt kịp thấy CÁI NÀO vừa đi.
 */
function capNhatThe(slug, tt) {
  let n = 0;
  for (const el of document.querySelectorAll(`[data-slug="${CSS.escape(String(slug))}"]`)) {
    n++;
    if (tt === null) {
      el.classList.add("the-bo");
      setTimeout(() => el.remove(), 450);
      continue;
    }
    if (/\bst-[a-z]+\b/.test(el.className))
      el.className = el.className.replace(/\bst-[a-z]+\b/g, `st-${tt}`);
    const mt = el.querySelector(".mt");
    if (!mt) continue;
    // Chữ trạng thái CŨ do máy dựng trang viết ra dưới dạng text node `· xxx`.
    for (const nut of [...mt.childNodes])
      if (nut.nodeType === 3 && /·\s*\S/.test(nut.textContent ?? ""))
        nut.textContent = (nut.textContent ?? "").replace(/·\s*\S+/, "");
    let chip = mt.querySelector(".tt-moi");
    if (tt === "approved") { chip?.remove(); continue; }
    if (!chip) {
      chip = document.createElement("span");
      chip.className = "tt-moi";
      mt.append(chip);
    }
    // Giữ ĐÚNG chữ máy dựng trang viết, không dịch sang tiếng người ở đây:
    // dựng lại trang là nó về `· rejected`, và hai chữ cho một thẻ là lệch.
    chip.textContent = " · " + tt;
  }
  return n;
}
let hoiXong = null;
function dongHoi(gt) {
  const d = G("dlg-hoi");
  const tra = hoiXong;
  hoiXong = null;
  if (d?.open) d.close();
  tra?.(gt);
}
function hoi(t) {
  const d = G("dlg-hoi");
  const oTieu = G("hoi-tieu");
  const oChu = G("hoi-chu");
  const oHang = G("hoi-o");
  const oNhap = G("hoi-nhap");
  const oNhan = G("hoi-nhan");
  const oOk = G("hoi-ok");
  const oCanh = G("hoi-canh");
  if (!d || !oTieu || !oChu || !oOk || !oNhap || !oHang || !oNhan) {
    return Promise.resolve(t.nhap ? prompt(t.chu) : confirm(t.chu));
  }
  dongHoi(t.nhap ? null : false);
  oTieu.textContent = t.tieuDe;
  oChu.textContent = t.chu;
  oOk.textContent = t.nutOk;
  oOk.classList.toggle("pha", !!t.pha);
  if (oCanh) oCanh.textContent = "";
  oHang.hidden = !t.nhap;
  if (t.nhap) {
    oNhan.textContent = t.nhap.nhan;
    oNhap.placeholder = t.nhap.mau ?? "";
    oNhap.value = t.nhap.sanCo ?? "";
  }
  d.showModal();
  (t.nhap ? oNhap : oOk).focus();
  return new Promise((tra) => {
    hoiXong = tra;
  });
}
function veBienTap(win, ban) {
  /*
   * Hai nhanh khong-API noi HAI ly do khac nhau, khong gop mot cau:
   *   ban THAT ⇒ API chua chay, bat bang `npm run api`
   *   ban MAU  ⇒ nut bien tap chi co o kho THAT (`kb/`); ban mau dung du
   *              lieu rieng nen khong co gi de sua
   * Gop mot cau la doan ho nguoi dung dang gap cai nao.
   *
   * `kb/` CO Y nam o chu thich chu khong o chu hien thi: `chu-giao-dien`
   * cam man hinh noi kien truc, va mot duong dan trong kho tren man dung
   * la kien truc. Chu thich la cho duy nhat thoa CA HAI cong.
   */
  const o = win.querySelector("[data-bt]");
  if (!o) return;
  if (!API_CO) {
    o.innerHTML = goc() === "/" ? '<em class="hint">Chưa nối được API — nút Duyệt · Loại · Sửa · Bỏ chỉ hiện khi <code>npm run api</code> đang chạy.</em>' : '<em class="hint">Bản mẫu, chỉ để xem. Nút biên tập chỉ có ở kho thật — bản mẫu dùng dữ liệu riêng, không phải kho của bạn.</em>';
    return;
  }
  const st = ban.review_status ?? "";
  const chuaLen = st === "draft" || st === "edited" || st === "rejected";
  /*
   * BA CỤM, trái → phải theo tần suất + vai (chốt với chủ dự án 2026-09-06):
   *
   *   CHÍNH   một nút DUY NHẤT, đổi theo trạng thái. `approved` không có nút
   *           chính — việc đã xong, chỗ ấy thành NHÃN. Một màn có hai nút cùng
   *           nổi là một màn không dám nói việc tiếp theo là gì.
   *   THƯỜNG  dùng hằng ngày, đứng giữa: Sửa · hai chiều · menu tải file.
   *   NGUY    tách hẳn sang phải, có KHOẢNG TRỐNG — khoảng trống ấy là thứ
   *           chặn cú bấm trượt. Nhẹ trước nặng: Loại (bài ở lại) trước Bỏ
   *           (bài rời kho), Bỏ ngoài cùng vì nó xa tay nhất.
   *
   * Màn hẹp: `.bt-nguy` xuống HÀNG RIÊNG (CSS), không bao giờ chen vào giữa
   * cụm thường — chen giữa là đúng cái cách người bấm nhầm.
   */
  const chinh = chuaLen
    ? '<button data-act="dang" title="bài lên site ngay — đổi trạng thái sang approved">✓ Đưa lên site…</button>'
    : `<em class="bt-nhan">${nhanCanh(st)}</em>`;
  o.innerHTML = `<div class="bt-chinh">${chinh}</div>`
    + `<div class="bt-thuong"><button data-act="sua" title="${st === "approved" ? "mở form sửa — bài Ở LẠI trên site sau khi lưu" : "mở form sửa ở màn Nạp nguồn với bài đã nạp sẵn"}">✎ Sửa…</button>`
    + nutHaiChieu(ban) + menuTai(ban) + "</div>"
    + '<div class="bt-nguy">'
    + (st !== "rejected" ? '<button data-act="loai" title="phán quyết: bài Ở LẠI kho với trạng thái rejected + lý do">✕ Loại (ghi lý do)…</button>' : "")
    + '<button data-act="xoa" title="chuyển bài vào thùng rác — rời khỏi kho, không phải một phán quyết">🗑 Bỏ khỏi kho…</button></div>'
    + (chuaLen ? `<em class="bt-nhan phu">${nhanCanh(st)}</em>` : "");
  // Chiều ĐI vẽ SAU, khi `/api/index` trả lời — không chặn thanh nút chờ mạng.
  void veNutBanChungCat(win, ban);
  // Hàm vá sống ở CHUNK `cctab`, không ở `gn.js`: nó chỉ chạy cho bản ghi
  // video và nó gọi mạng. Để trong bundle chung là bắt mọi trang tải một thứ
  // chỉ một loại màn dùng — và đo được: nó đẩy `gn.js` lên 102490/102400.
  if (String(ban?.source_type) === "video" && !coTranscript(ban)) {
    void goiChunk("veNutChungCatRieng", win, win.id);
  }
}

/*
 * HAI CHIỀU gốc ↔ bản chưng cất (`WO-056` · `T03-116`).
 *
 * Chiều VỀ (`nguon`) dựng được ngay: `FR-067` bắt buộc trường ấy với
 * `origin: pipeline`, và nó đã qua cả bốn builder tới đây.
 *
 * Chiều ĐI (gốc → bản chưng cất) KHÔNG suy từ slug. Chủ dự án chốt lối chỉ mục
 * ngược: một bài gốc chưng cất được NHIỀU lần (khác model, khác lượt), mà quy
 * ước `phan-tich-<gốc>` chỉ chứa đúng một bản — chọn lối slug là tự khoá vào
 * một-gốc-một-bản ngay từ đầu, và đổi tên bài là đứt liên kết mà không ai báo.
 *
 * Nút chiều đi vẽ SAU, khi `/api/index` trả lời: dựng nó ngay bây giờ thì hoặc
 * phải chặn thanh nút chờ mạng, hoặc phải đoán số bản. Nút chết là nút dạy
 * người bỏ qua nút.
 */
async function moTheoSlug(slug, canh) {
  /*
   * BÓC PHONG BÌ của cửa (`T03-118`).
   *
   * `/api/articles/<loai>/<slug>` trả `{frontmatter, body, etag}`; `mo()` đòi
   * `{bans:[ban]}` với thân nằm ở `than`. Bản trước truyền THẲNG phản hồi vào
   * `mo()`, nên `bai.bans` là `undefined` — cửa sổ dựng RỖNG, không lỗi nào
   * nổ, và người dùng thấy đúng hai triệu chứng chủ dự án báo: "Xem bài gốc"
   * bấm không ra gì, và "không có thân bài".
   *
   * Cùng lớp lỗi đã trúng `_doc_nguon` của `T12-24` (đọc `category` ở cấp cao
   * nhất thay vì trong `frontmatter`). Hai lần trong một tuần, một bài học:
   * đọc hình dạng THẬT của cửa, đừng đọc hình dạng mình tưởng.
   *
   * Bài gốc có thể ĐÃ BỊ XOÁ khỏi kho trong khi bản chưng cất còn trỏ về nó.
   * Nói ra bằng một câu đọc được, KHÔNG mở một cửa sổ trống — cửa sổ trống bắt
   * người tự đoán chuyện gì vừa xảy ra.
   */
  try {
    const r = await fetch(goc() + "api/articles/" + slug);
    if (!r.ok) {
      bao(true, `Bản ghi "${slug}" không còn trong kho.`);
      return;
    }
    const j = await r.json();
    const fm = j.frontmatter ?? {};
    const mang = (x) => (Array.isArray(x) ? x : []);
    mo({
      bans: [{
        slug: String(fm.url_normalized || slug),
        title: String(fm.title || slug.split("/").pop()),
        source_type: String(fm.source_type || slug.split("/")[0]),
        credibility_max: String(fm.credibility_max ?? ""),
        review_status: String(fm.review_status ?? ""),
        origin: String(fm.origin ?? ""),
        priority: Number(fm.priority) || 0,
        concepts: mang(fm.concepts),
        concepts_proposed: mang(fm.concepts_proposed),
        category: mang(fm.category),
        analyzed_at: String(fm.analyzed_at ?? ""),
        one_liner: String(fm.one_liner ?? ""),
        url_normalized: String(fm.url_normalized ?? ""),
        // `slug` cua phong bi la `url_normalized` (dung cho hien thi), KHONG
        // goi API duoc. `duong` la duong THAT `<loai>/<slug>` — nut lam lai
        // anh bia can no. Hai ten vi chung la hai thu.
        duong: slug,
        media: Array.isArray(fm.media) ? fm.media : null,
        nguon: mang(fm.nguon),
        // `body` của cửa ⇄ `than` của bản ghi: hai tên cho một thứ ở hai tầng.
        than: String(j.body ?? ""),
      }],
    }, { canh });
  } catch {
    bao(true, "Không nối được API — thử lại khi máy chủ đang chạy.");
  }
}

/*
 * MENU "Tải xuống ▾" — `T03-117`, theo wireframe `SCR-19` đã duyệt.
 *
 * DẪN XUẤT từ `xuat-dang.json` (`__XUAT__`): cửa API và menu cùng đọc MỘT
 * nguồn, nên thêm một dạng vào bảng là mục tự mọc và 422 của cửa tự đổi. Gõ
 * cứng ở đây là dựng nguồn sự thật thứ hai, và nó lệch vào đúng ngày ai đó
 * thêm dạng mới.
 *
 * GIỮ MENU kể cả khi chỉ còn MỘT mục (chủ dự án chốt): nút đứng cùng một chỗ,
 * cùng một hình ở mọi loại bản ghi — người học một lần rồi dùng ở khắp nơi,
 * còn đổi hình theo loại thì họ phải nhận diện lại mỗi lần mở kiểu khác.
 *
 * Mục tải là `<a href>` THẲNG cửa xuất. Trình duyệt tải bằng chính bộ tải của
 * nó: có thanh tiến trình, có thư mục Tải xuống, huỷ được. Một `Blob` +
 * `createObjectURL` thì ta phải tự dựng lại tất cả những thứ đó, và nó giữ cả
 * file trong RAM.
 *
 * `<details>` chứ không `confirm()` — `FR-022`.
 */
/*
 * BÊN TRONG `TX_CSS` KHÔNG ĐƯỢC CÓ MỘT CHỮ NÀO KHÔNG PHẢI CSS.
 *
 * Bản trước mở đầu bằng ba dòng văn xuôi — vốn là một chú thích `/* … *\/`
 * mà bộ cắt chú thích của build (`catBinhLuanJs`) gỡ mất cặp dấu, để lại chữ
 * TRẦN nằm trong chuỗi CSS. Bộ phân tích CSS nuốt cả đoạn ấy làm một selector
 * rác kéo dài tới dấu `{` đầu tiên, nên **rule đầu tiên biến mất**.
 *
 * Đo được trên màn thật 2026-09-06: `getComputedStyle(details.tx).position`
 * trả `static`, và menu bung ra giữa màn đè lên chữ — đúng bug chủ dự án chụp
 * ảnh. Đây cũng là lý do bản hotfix ở `prototype.css` từng tồn tại: nó không
 * thừa, nó là bản DUY NHẤT chạy.
 *
 * Cổng đọc mã `.ts` KHÔNG thấy được lỗi này (ở đó `/* *\/` còn nguyên), nên
 * `menu-tai-dot-hai.test.js` phải đo trên chuỗi ĐÃ DỰNG.
 *
 * Chú thích để ở ĐÂY, ngoài chuỗi. Không bao giờ ở trong.
 */
const TX_CSS = `
details.tx{position:relative;display:inline-block}
.tx>summary{list-style:none;cursor:pointer}
.tx>summary::-webkit-details-marker{display:none}
.tx-ds{position:absolute;right:0;bottom:100%;z-index:20;min-width:12rem;
  display:flex;flex-direction:column;background:var(--secondary);
  border:1px solid var(--line);border-radius:var(--radius-md);
  padding:var(--s-3xs);box-shadow:0 6px 20px rgba(0,0,0,.35)}
.tx-m{display:flex;justify-content:space-between;gap:var(--s-2xs);
  padding:var(--s-3xs) var(--s-2xs);font-size:var(--fs-small);color:var(--ink-2);
  text-decoration:none;border:0;background:0;cursor:pointer;text-align:left}
.tx-m:hover{color:var(--ink);background:var(--background)}
.tx-d{color:var(--ink-3);font-size:var(--fs-nano)}
.tx-nhom{display:block;padding:var(--s-3xs) var(--s-2xs);font-family:var(--f-ui);
  font-size:var(--fs-nano);letter-spacing:.08em;color:var(--ink-3);
  border-top:1px solid var(--line)}
.tx-ds>.tx-nhom:first-child{border-top:0}
button.tx-m{width:100%;font-family:inherit}
.tx-mo{color:var(--ink-3);font-style:var(--i-note)}
.tx-mo:hover{color:var(--ink-2)}
.tx-bac{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-3xs);
  padding:var(--s-3xs) var(--s-2xs)}
.tx-b{font-family:var(--f-ui);font-size:var(--fs-nano);
  padding:var(--s-3xs) var(--s-2xs);
  border:1px solid var(--border);border-radius:var(--radius-sm);
  background:0;color:var(--ink-2);cursor:pointer;text-decoration:none}
.tx-b:hover{color:var(--ink)}
.tx-b-co{border-color:var(--success);color:var(--success)}
.tx-b-chay{position:relative;overflow:hidden;border-color:var(--brand);
  color:var(--ink);min-width:8rem;text-align:center}
.tx-bt{position:absolute;inset:0 auto 0 0;width:0;background:var(--brand);
  opacity:.28;transition:width .4s linear}
.tx-bn{position:relative;font-weight:600}
.bt-bt{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2xs)}
.bt-chinh{display:flex;align-items:center}
/* CHINH = NEN DAC TRUNG TINH, khong dung --brand/--primary.
   Do duoc 2026-09-06: --primary la #C81E1E (do), va o he TOI --primary va
   --destructive la CUNG MOT gia tri #F87171. Nut chinh son mau thuong hieu
   thi no trong y het nut nguy hiem — man dang chi vao cho nguy hiem nhat
   bang chinh cai nut noi bat nhat. Muc luc cao ma khong tranh hue voi do. */
.bt-chinh>button{background:var(--ink);color:var(--background);
  border:0;font-weight:600}
.bt-chinh>button:hover{background:var(--ink-2)}
.bt-thuong button,.bt-thuong .bt{background:0;border:1px solid var(--border);
  color:var(--ink-2)}
.bt-thuong button:hover,.bt-thuong .bt:hover{color:var(--ink)}
/* NGUY: đỏ ở VIỀN, không đỏ đặc lúc nghỉ. Hai khối màu đặc trên một thanh
   chân thì mắt không biết đâu là việc chính — và đỏ đặc kéo mắt MẠNH hơn nút
   chính, tức thanh nút tự chỉ vào chỗ nguy hiểm nhất. */
.bt-nguy button{background:0;border:1px solid var(--destructive);
  color:var(--destructive)}
.bt-nguy button:hover{background:var(--destructive);
  color:var(--destructive-foreground)}
.bt-thuong{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-3xs)}
.bt-nguy{display:flex;align-items:center;gap:var(--s-3xs);margin-left:auto;
  padding-left:var(--s-m);border-left:1px solid var(--border)}
.bt-nhan{font-size:var(--fs-small);font-family:var(--f-ui);color:var(--ink-2);
  letter-spacing:.04em;font-style:normal}
.bt-nhan.phu{color:var(--ink-3)}
.the-bo{text-decoration:line-through;opacity:.35;transition:opacity .35s}
.nh-len{display:inline-flex;align-items:center;gap:var(--s-3xs);
  font-size:var(--fs-small);font-family:var(--f-ui);color:var(--ink-2);cursor:pointer}
.nh-len input{margin:0}
@media (max-width:640px){
  .bt-nguy{margin-left:0;width:100%;justify-content:flex-end;
    padding-left:0;border-left:0;border-top:1px solid var(--border);
    padding-top:var(--s-3xs);margin-top:var(--s-3xs)}
}
`;
/*
 * CSS của menu tải xuống — TIÊM lúc dựng menu lần đầu, không vào `prototype.css`.
 *
 * Đo được: đặt vào `prototype.css` đẩy `gn.css` lên 103140/102400 — vỡ 740
 * byte. `FR-061` cấm nới trần bundle CHUNG, và luật này chỉ dùng ở thanh chân
 * CỬA SỔ ĐỌC: người chỉ lướt danh sách không bao giờ thấy nó.
 *
 * Tiêm một lần, canh bằng `id` — `veNutBienTap` chạy mỗi lần vẽ lại thanh nút.
 */
function txCss() {
  if (G("tx-css")) return;
  const e = document.createElement("style");
  e.id = "tx-css";
  e.textContent = TX_CSS;
  document.head.appendChild(e);
}

/* ── T03-121 · nhãn của một BẢN GỐC, dựng từ dữ liệu THẬT ───────────────
 *
 * `goc` là một khoá KỸ THUẬT. Người bấm *File gốc* trên một bản ghi tài liệu
 * không biết mình sắp tải 2.8 MB PDF hay 210 MB MP4 — và trên mạng yếu, khác
 * biệt ấy là khác biệt giữa "tải" và "hỏng cả buổi".
 *
 * `media[]` đã mang đủ ba thứ cần: `mime` · `ten_goc` · `so_byte`.
 */
function cheByte(n) {
  const b = Number(n) || 0;
  if (b <= 0) return "";
  // Viết bằng LUỸ THỪA, không bằng số nguyên dài. Số nguyên của một GiB trùng
  // đúng với `tran_byte` của bảng khai nạp file, và cổng `thu-vien-nap` quét
  // NGUYÊN VĂN nguồn nên nó không phân biệt được một TRẦN gõ tay với một hằng
  // ĐỔI ĐƠN VỊ. Luỹ thừa đọc cũng rõ hơn, nên đây không phải nhượng bộ.
  const K = 1024, M = K ** 2, G = K ** 3;
  if (b < K) return b + " B";
  if (b < M) return (b / K).toFixed(b < 10 * K ? 1 : 0) + " KB";
  if (b < G) return (b / M).toFixed(b < 10 * M ? 1 : 0) + " MB";
  return (b / G).toFixed(1) + " GB";
}

/* Hiện vật NHỊ PHÂN của bản ghi — bỏ qua thứ do MÁY dẫn xuất (vtt sinh từ
 * ASR chẳng hạn): người bấm "bản gốc" muốn thứ họ ĐÃ NẠP. */
function hienVatGoc(ban) {
  const danXuat = new Set((MEDIA.loai ?? []).filter((l) => l.chi_dan_xuat).map((l) => l.mime));
  return (Array.isArray(ban?.media) ? ban.media : [])
    .find((m) => m && !danXuat.has(String(m.mime))) ?? null;
}

function nhanBanGoc(ban) {
  const hv = hienVatGoc(ban);
  if (!hv) {
    // Bản ghi VĂN BẢN: `goc` là chính file `.md`. Nhãn phải nói đúng CÁI KHÁC
    // BIỆT với `md` — đó là câu hỏi duy nhất người có ở chỗ ấy.
    return { ten: "Nguyên file (.md, có frontmatter)", duoi: "", co: "", nhiPhan: false };
  }
  const duoi = (String(hv.ten_goc ?? "").match(/\.[A-Za-z0-9]+$/) ?? [""])[0].toLowerCase();
  // MIME lạ ⇒ hiện ĐUÔI, không hiện chuỗi MIME trần: `application/vnd.oasis…`
  // không nói gì với ai.
  const ten = XUAT.mime_ten?.[String(hv.mime)] ?? (duoi ? duoi.slice(1).toUpperCase() : "Tệp");
  return { ten, duoi, co: cheByte(hv.so_byte), nhiPhan: true, hv };
}

/* ── Bậc chất lượng: CHỈ cho video có URL nguồn ─────────────────────────
 *
 * MP4 người TẢI LÊN chỉ có MỘT bản gốc. Bày `480p` cho nó là hứa một bậc
 * không tồn tại, và dựng bậc ấy nghĩa là transcode — tốn CPU, mất chất lượng,
 * và ra một file KHÔNG PHẢI thứ người đã nạp.
 */
const BAC_CL = [360, 480, 720, 1080, "goc"];
function laVideoUrl(ban) {
  return String(ban?.source_type ?? "") === "video"
    && !hienVatGoc(ban)
    && !!(ban?.url_normalized || ban?.url);
}

const nhom = (ten) => '<b class="tx-nhom">' + ten + "</b>";

function menuTai(ban) {
  txCss();
  /* Mục của một dạng DẪN XUẤT — `<a download href>` trỏ THẲNG cửa `api/xuat/`.
   *
   * Trình duyệt tải bằng chính bộ tải của nó: có thanh tiến trình, có thư mục
   * Tải xuống, có tiếp-tục-khi-đứt. Dựng blob trong JS thì mất cả ba, và một
   * file lớn còn phải nằm trọn trong bộ nhớ tab trước khi người thấy gì.
   *
   * Nằm TRONG `menuTai` là cố ý: cổng `T03-117` đọc thân hàm này và đòi thấy
   * đúng hình dạng ấy — một tính chất thật, không phải một chi tiết thi công.
   */
  const mucTai = (loai, slug, k, d, goc2) => {
    if (k === "in") {
      return '<a class="tx-m" target="_blank" rel="noopener" href="' + goc2
        + "api/xuat/" + esc(loai) + "/" + esc(slug) + '?dang=in">' + esc(d.ten) + "</a>";
    }
    return '<a class="tx-m" download href="' + goc2 + "api/xuat/" + esc(loai)
      + "/" + esc(slug) + "?dang=" + esc(k) + '">' + esc(d.ten)
      + (d.duoi ? '<i class="tx-d">' + esc(d.duoi) + "</i>" : "") + "</a>";
  };
  const loai = String(ban?.source_type ?? "");
  const ds = (XUAT.theo_loai?.[loai] ?? []);
  if (!ds.length) return "";
  const slug = String(ban?.slug ?? "").split("/").pop();
  const goc2 = goc();
  const laVideo = loai === "video";
  const bg = nhanBanGoc(ban);

  /* Mục BẢN GỐC nhị phân KHÔNG phải `<a download href>` trần: có `href` là
   * trình duyệt đã đi lấy file trước khi ai kịp hỏi gì, và lúc ấy hộp thoại
   * chỉ còn là trang trí. Nút + `data-taigoc` ⇒ hỏi TRƯỚC, tải SAU. */
  const mucGoc = bg.nhiPhan
    ? '<button class="tx-m" data-taigoc="' + esc(loai) + "/" + esc(slug)
      + '" data-nhan="' + esc(bg.ten) + '" data-co="' + esc(bg.co)
      + '" data-ten="' + esc(bg.hv?.ten_goc ?? "") + '">'
      + esc(bg.ten) + (bg.duoi ? " (" + esc(bg.duoi) + ")" : "")
      + (bg.co ? '<i class="tx-d">' + esc(bg.co) + "</i>" : "") + "</button>"
    : mucTai(loai, slug, "goc", { ten: bg.ten, duoi: "" }, goc2);

  let than;
  if (!laVideo) {
    than = ds.map((k) => k === "goc" ? mucGoc
      : (XUAT.dang?.[k] ? mucTai(loai, slug, k, XUAT.dang[k], goc2) : "")).join("");
  } else {
    /* Màn video có tới BA sản phẩm khác nhau. Gộp chúng vào một danh sách
     * phẳng thì `.txt` của transcript đứng cạnh `.docx` của bản chưng cất mà
     * không ai biết cái nào là cái nào. */
    const tsCo = (Array.isArray(ban?.media) ? ban.media : [])
      .some((m) => String(m?.mime) === "text/vtt");
    /* Chiều ĐI không suy được từ bản ghi — nó nằm ở CHỈ MỤC NGƯỢC, và chỉ
       mục là một lời gọi mạng. Nên nhóm này dựng RỖNG trước rồi vá sau
       (`vaNhomChungCat`), y như thanh nút không chặn chờ mạng. */
    const nguonUrl = String(ban?.url_normalized || ban?.url || "");

    than = nhom("VIDEO")
      + (nguonUrl ? '<a class="tx-m" target="_blank" rel="noopener" href="'
        + esc(nguonUrl) + '">Xem trên nguồn ↗</a>' : "")
      + (bg.nhiPhan ? mucGoc : "")
      /* Đường ĐẦY ĐỦ `<loại>/<slug>`, không phải slug trần: worker gọi
         `/api/articles/<slug>` để lấy URL nguồn, và slug trần là 404. Đây là
         lần THỨ BA cùng một lỗi trong đợt này (`FR-031` · `T03-118` ·
         `moCuaSoNhap`) — bất biến `duongBai` có lý do của nó. */
      + (laVideoUrl(ban) ? hangChatLuong(ban, String(ban?.slug ?? "")) : "")
      + nhom("TRANSCRIPT")
      + (tsCo
        ? ["srt", "txt", "docx"].map((k) => XUAT.dang?.[k]
          ? mucTai("transcript", slug, k, XUAT.dang[k], goc2) : "").join("")
        : chuaSinh("chưa sinh — Sinh transcript", "", "chung-cat"))
      + nhom("BẢN CHƯNG CẤT")
      + '<span data-nhomcc="' + esc(String(ban?.slug ?? "")) + '">'
      + chuaSinh("đang tra…", goc2 + "chung-cat/", "") + "</span>";
    void vaNhomChungCat(ban, goc2, mucTai);
    if (laVideoUrl(ban)) void vaBacDaCo(String(ban?.slug ?? ""));
  }
  return '<details class="tx"><summary class="bt ghost sm">⬇ Tải xuống</summary>'
    + '<div class="tx-ds">' + than + "</div></details>";
}

/*
 * Vá nhóm BẢN CHƯNG CẤT khi chỉ mục trả lời.
 *
 * Ba trạng thái, ba câu khác nhau — gộp chúng là bỏ mất đúng thông tin người
 * cần: `đang tra…` (chưa biết) · danh sách dạng (có) · `chưa sinh` (không có).
 */
async function vaNhomChungCat(ban, goc2, mucTai) {
  // ĐỢI MỘT NHỊP: hai hàm vá được gọi TỪ TRONG `menuTai`, tức trong lúc chuỗi
  // HTML còn đang dựng — `querySelector` lúc ấy tìm một nút CHƯA có trong
  // DOM. Đo được trên màn 2026-09-06: nhóm đứng mãi ở "đang tra…" và bậc đã
  // tải xong không bao giờ sáng.
  await new Promise((t) => setTimeout(t, 0));
  const slug = String(ban?.slug ?? "");
  const o = document.querySelector(`[data-nhomcc="${CSS.escape(slug)}"]`);
  if (!o) return;
  let ds = [];
  try { ds = await banChungCatCua(slug); } catch { /* mạng hỏng */ }
  if (!ds.length) {
    o.innerHTML = chuaSinh("chưa sinh — Chưng cất ngay", goc2 + "chung-cat/", "");
    return;
  }
  const sl = String(ds[0].slug ?? "").split("/").pop();
  const loai = String(ds[0].source_type ?? "article");
  o.innerHTML = ["md", "txt", "docx", "in"].map((k) => XUAT.dang?.[k]
    ? mucTai(loai, sl, k, XUAT.dang[k], goc2) : "").join("")
    + (ds.length > 1
      ? '<i class="tx-d" style="padding:var(--s-3xs) var(--s-2xs)">'
        + ds.length + " bản — mục trên là bản mới nhất</i>"
      : "");
}

/* Sản phẩm chưa có: MỜ, nhưng DẪN ĐƯỜNG.
 *
 *   giấu       ⇒ người không biết chức năng tồn tại, và họ đi hỏi thay vì bấm
 *   mục chết   ⇒ tệ nhất: màn hứa một thứ nó không giao
 *   mờ + đường ⇒ nói đủ ba vế: có thứ này · chưa có · lấy ở đâu
 */
function chuaSinh(chu, href, act) {
  /*
   * MỜ nhưng KHÔNG CHẾT.
   *
   * Bản đầu của tôi trả `<a href="#">` cho ca "chưa sinh transcript" — bấm
   * vào chỉ đổi URL thành `/video/#` và không làm gì. Đúng cái *mục chết* mà
   * `SCR-21` xếp là lối TỆ NHẤT ("màn hứa một thứ nó không giao"), và tôi tự
   * viết dòng ấy rồi tự vi phạm nó.
   *
   * Cổng cũng xanh oan: vế `4c` chỉ đòi "có `href`", mà `#` là một `href`.
   * Nay việc nằm ở `data-act` — cùng đường mà nút ⚗ ở thanh chân đã đi, nên
   * không có đường thứ hai để lệch.
   */
  if (act) {
    return '<button class="tx-m tx-mo" data-act="' + esc(act) + '">⌁ '
      + esc(chu) + " →</button>";
  }
  return '<a class="tx-m tx-mo" href="' + esc(href) + '">⌁ ' + esc(chu) + " →</a>";
}

/* Hàng bậc chất lượng — `T12-26` làm phần tải, đây chỉ là chỗ bấm. */
function hangChatLuong(ban, slug) {
  /* Bậc nào ĐÃ có file thì không biết được từ bản ghi — nó nằm ở HÀNG ĐỢI
     VIỆC, và đó là một lời gọi mạng. Dựng nút trước, vá sau (`vaBacDaCo`). */
  return '<div class="tx-bac" data-bacslug="' + esc(slug) + '">'
    + '<span class="tx-d">Tải về:</span>'
    + BAC_CL.map((b) =>
      '<button class="tx-b" data-taibac="' + esc(String(b))
      + '" data-slug="' + esc(slug) + '">'
      + esc(String(b)) + (b === "goc" ? "" : "p") + "</button>").join("")
    + "</div>";
}

/*
 * Bậc ĐÃ tải xong ⇒ nút thành ĐƯỜNG TẢI THẲNG, không mở job lần hai.
 *
 * Bản trước đọc `ban.tai_video` — một trường tôi TỰ NGHĨ RA, không có trong
 * bản ghi nào. Nên nhánh "đã có" chưa bao giờ chạy, và người bấm lại bậc cũ
 * sẽ tải lại từ đầu một file 36 MB đã nằm sẵn trên đĩa.
 *
 * Sự thật nằm ở hàng đợi việc: một việc `tai-video` đã `xong`, cùng `slug`,
 * mang `ket_qua.tep_tam`. Đọc đúng chỗ ấy.
 */
/*
 * TIẾN ĐỘ TẢI hiện NGAY CHỖ NGƯỜI VỪA BẤM.
 *
 * Chủ dự án 2026-09-06, sau khi tôi đã làm thanh tiến độ ở tab Việc:
 * *"tôi bảo phải hiện tiến trình download cơ mà… tôi vừa bấm tải 480p và sao
 * tôi biết nó đang tải và được bao nhiêu %?"*.
 *
 * Bản trước của tôi đúng phần THỢ (thợ có phát tiến độ) nhưng sai chỗ ĐẶT:
 * nó bắt người rời menu, mở tab Việc, tìm đúng dòng. Một tiến độ phải ở nơi
 * người đang nhìn — nút họ vừa bấm — chứ không ở nơi hệ thống thấy tiện.
 *
 * Nút bấm xong biến thành CHÍNH thanh tiến độ, rồi thành đường tải. Ba trạng
 * thái, một chỗ, không phải đi đâu.
 */
function theoDoiBac(nut, id, bac) {
  const nhan = bac + (bac === "goc" ? "" : "p");
  const o = document.createElement("span");
  o.className = "tx-b tx-b-chay";
  o.dataset.bacchay = id;
  o.innerHTML = '<i class="tx-bt"></i><b class="tx-bn"></b>';
  const thanh = o.querySelector(".tx-bt");
  const chu = o.querySelector(".tx-bn");
  chu.textContent = nhan + " · đang mở…";
  nut.replaceWith(o);

  let treo = 0;
  const nhip = setInterval(async () => {
    let v = null;
    try {
      const r = await fetch(goc() + "api/viec/" + encodeURIComponent(id));
      if (r.ok) v = await r.json();
    } catch { /* mạng chớp — thử lại nhịp sau */ }
    if (!v) {
      // 60 nhịp im lặng (~90 giây) mới bỏ cuộc: một lần mạng chớp KHÔNG
      // được phép xoá một tiến độ đang đúng.
      if (++treo > 60) {
        clearInterval(nhip);
        chu.textContent = nhan + " · mất liên lạc";
      }
      return;
    }
    treo = 0;
    const td = v.tien_do || {};
    const pt = typeof td.phan_tram === "number" ? td.phan_tram : null;
    if (v.giai_doan === "xong") {
      clearInterval(nhip);
      const a = document.createElement("a");
      a.className = "tx-b tx-b-co";
      a.download = "";
      a.href = goc() + "api/tai-video/" + id;
      a.textContent = nhan;
      a.title = "đã lưu về máy — bấm để lưu lại lần nữa";
      o.replaceWith(a);
      /*
       * TỰ LƯU VỀ MÁY, không bắt bấm lần hai (chủ dự án chốt 2026-09-07).
       *
       * Người đã bấm một lần để nói *tôi muốn file này*; bắt họ bấm lần nữa
       * sau khi chờ vài phút là hỏi lại một câu đã trả lời. Cú bấm đầu CHÍNH
       * là cử chỉ người dùng mà trình duyệt đòi, và lời tải này cùng gốc nên
       * nó đi thẳng vào thư mục Tải xuống.
       *
       * Vẫn GIỮ đường dẫn sau đó: tải trượt, hoặc người xoá nhầm file, thì
       * bấm lại được — một thứ tự lưu rồi biến mất là một thứ không lấy lại
       * được.
       */
      a.click();
      bao(false, `Đã tải xong bản ${nhan} và đang lưu về máy bạn.`);
      return;
    }
    if (v.giai_doan === "dung" || v.loi) {
      clearInterval(nhip);
      chu.textContent = nhan + " · hỏng";
      o.title = String(v.loi || "việc đã dừng");
      bao(true, `Tải ${nhan} hỏng: ` + String(v.loi || "việc đã dừng").slice(0, 160));
      return;
    }
    if (pt === null) {
      chu.textContent = nhan + " · đang mở…";
      return;
    }
    thanh.style.width = Math.max(0, Math.min(100, pt)).toFixed(0) + "%";
    chu.textContent = nhan + " · " + pt.toFixed(0) + "%"
      + (td.toc_do ? " · " + td.toc_do : "");
    o.title = [td.tong ? "cỡ " + td.tong : "", td.con_lai ? "còn " + td.con_lai : ""]
      .filter(Boolean).join(" · ");
  }, 1200);
}

async function vaBacDaCo(slug) {
  await new Promise((t) => setTimeout(t, 0));   // xem lý do ở `vaNhomChungCat`
  const o = document.querySelector(`[data-bacslug="${CSS.escape(slug)}"]`);
  if (!o) return;
  let ds = [];
  try {
    const r = await fetch(goc() + "api/job?n=200");
    if (!r.ok) return;                       // 403/500 ⇒ để nguyên nút, không nút chết
    const j = await r.json();
    // Cửa trả `{dong:[…]}` — đo được 2026-09-06. Đoán ba tên khác rồi rơi
    // về `[]` là cách một hàm im lặng không làm gì.
    ds = Array.isArray(j) ? j : (j.dong ?? []);
  } catch { return; }
  const theoBac = new Map();
  for (const v of ds) {
    const pl = v?.payload ?? {};
    if (pl.loai !== "tai-video" || String(pl.slug ?? "") !== slug) continue;
    if (v?.giai_doan !== "xong" || !v?.ket_qua?.tep_tam) continue;
    // Việc MỚI NHẤT thắng: một bậc tải nhiều lần thì bản sau là bản còn hạn.
    theoBac.set(String(pl.chat_luong), String(v.ulid ?? v.viec_id ?? ""));
  }
  for (const nut of o.querySelectorAll("[data-taibac]")) {
    const id = theoBac.get(String(nut.dataset.taibac));
    if (!id) continue;
    const a = document.createElement("a");
    a.className = "tx-b tx-b-co";
    a.download = "";
    a.href = goc() + "api/tai-video/" + id;
    a.textContent = nut.textContent;
    a.title = "đã tải xong — bấm để lưu về máy";
    nut.replaceWith(a);
  }
}

function nutHaiChieu(ban) {
  const ng = Array.isArray(ban?.nguon) ? ban.nguon : [];
  return ng.length
    ? `<button data-act="goc" data-goc="${esc(ng[0])}" title="mở bản ghi gốc đã chưng cất ra bài này">↩ Xem bài gốc…</button>`
    : "";
}

/*
 * CHIỀU ĐI: bản ghi gốc → những bản CHƯNG CẤT sinh ra từ nó.
 *
 * Tra bằng CHỈ MỤC NGƯỢC (`b.nguon` chứa slug của gốc) — không suy từ slug,
 * vì một gốc chưng cất được NHIỀU lần (khác model, khác lượt).
 *
 * Bản trước tự gọi `fetch` rồi bóc `j.bans || j.items || j` — mà `/api/index`
 * trả `{total, articles:[{bans:[…]}]}`. Cả ba nhánh đều trượt, `.filter` chạy
 * trên một OBJECT ⇒ ném ⇒ `catch` nuốt ⇒ **im lặng trả về rỗng**. Hậu quả đo
 * được 2026-09-06: nút ⚗ chưa bao giờ hiện, và menu Tải xuống báo *chưa sinh*
 * cho một video ĐÃ CÓ ba bản chưng cất.
 *
 * Nay dùng `nap()` — đúng một chỗ biết hình dạng chỉ mục.
 */
async function banChungCatCua(slug) {
  if (!slug) return [];
  const nhom = await nap();
  const ds = [];
  for (const g of nhom) {
    for (const b of (g?.bans ?? [])) {
      if (Array.isArray(b?.nguon) && b.nguon.includes(slug)) ds.push(b);
    }
  }
  ds.sort((a, b) => String(b.analyzed_at || "").localeCompare(String(a.analyzed_at || "")));
  return ds;
}

async function veNutBanChungCat(win, ban) {
  const slug = ban?.slug;
  if (!slug || (Array.isArray(ban.nguon) && ban.nguon.length)) return;
  const ds = await banChungCatCua(slug);
  if (!ds.length) return;      // chưa chưng cất lần nào ⇒ không nút
  const o = win.querySelector("[data-bt]");
  if (!o) return;
  // SON VANG nut header: da co ban chung cat ⇒ bam nua la tieu token nua.
  // Cung mot `ds` da fetch cho nut chan cua so — mot loi goi, hai be mat.
  for (const n of win.querySelectorAll('[data-act="chung-cat"],[data-act="cc-rieng"]')) {
    n.classList.remove("nut-chua");
    n.classList.add("nut-roi");
  }
  o.insertAdjacentHTML("beforeend",
    `<button data-act="ban-cc" data-cc="${esc(ds[0].slug)}" title="mở bản chưng cất mới nhất của bản ghi này">⚗ Bản chưng cất${ds.length > 1 ? ` (${ds.length})` : ""}…</button>`);
}
const duongBai = (b) => (
  // BẤT BIẾN: gọi bao nhiêu lần cũng ra một đường.
  //
  // BUG THẬT (FR-031 gây ra, người dùng báo lại "click vào như không"): cả hai
  // nguồn nuôi `nap()` đều trả `slug` ĐÃ CÓ tiền tố loại —
  //   `/api/index`          `chiMucMo` đặt `slug: \`${r.type}/${r.slug}\``
  //   `open-index.json`     emitter đặt slug = đường tương đối trong kho
  // nên cộng thêm `source_type` ra `repo/repo/hermes-agent` ⇒ 404 ⇒ BỐN nút
  // chết y như trước khi FR-031 sửa. Đo được: `repo/repo/…` 404 · `repo/…` 200.
  //
  // Vì sao răng của FR-031 không bắt: nó soi HÌNH DẠNG lời gọi trong bundle
  // ("không ghép bằng `.slug` trần") chứ không soi GIÁ TRỊ chạy ra. Hình đúng,
  // giá trị sai. Cùng lớp lỗi tôi đã ghi bốn lần: kiểm hình thức không suy ra
  // kiểm sự thật. Răng mới lấy slug THẬT từ `/api/index` rồi GET chính nó.
  b.slug.includes("/") ? b.slug : b.source_type + "/" + b.slug
);
async function docChiTiet(duong) {
  const r = await fetch("/api/articles/" + duong);
  if (!r.ok) return null;
  return await r.json();
}
function dongPhieu(win) {
  win.querySelector(".bk-phieu")?.remove();
  win.classList.remove("dang-phieu");
}
function moPhieu(win, kieu) {
  dongPhieu(win);
  win.classList.add("dang-phieu");
  const ph = document.createElement("div");
  ph.className = "bk-phieu";
  ph.dataset.kieu = kieu;
  ph.innerHTML = '<b>Loại bài — bài Ở LẠI kho, mang trạng thái rejected. Bắt buộc ghi lý do (≥5 ký tự)</b><textarea rows="2" data-f="reject_reason" placeholder="vì sao loại — để cùng loại rác không quay lại"></textarea><span class="f-act"><button data-act="phieu-gui" data-den="rejected">Loại</button><button data-act="phieu-huy">Đóng</button></span>';
  ph.append(Object.assign(document.createElement("pre"), { className: "f-kq", hidden: true }));
  win.querySelector(".bk-f")?.before(ph);
  ph.addEventListener("keydown", (e) => {
    const k = e;
    if (k.key !== "Enter" || k.shiftKey) return;
    k.preventDefault();
    ph.querySelector("[data-act='phieu-gui']")?.click();
  });
  ph.querySelector("input[type=number],textarea")?.focus();
}
async function guiPhieu(win, id, den) {
  const w = WIN.get(id);
  const ban = banDangDoc(w);
  const ph = win.querySelector(".bk-phieu");
  if (!ban || !ph) return;
  const kq = ph.querySelector(".f-kq");
  const body = { to: den };
  if (den === "approved") {
    body.insight_new = ph.querySelector('[data-f="insight_new"]').checked;
    body.skill_installed = ph.querySelector('[data-f="skill_installed"]').checked;
    const phut = ph.querySelector('[data-f="review_minutes"]').value;
    if (phut !== "") body.review_minutes = Number(phut);
  } else {
    body.reject_reason = ph.querySelector('[data-f="reject_reason"]').value;
  }
  const ct = await docChiTiet(duongBai(ban));
  if (!ct) {
    kq.hidden = false;
    kq.textContent = LOI_DOC_BAI;
    return;
  }
  const r = await fetch("/api/articles/" + duongBai(ban) + "/status", {
    method: "PATCH",
    headers: { ...HJ, "if-match": ct.etag },
    body: JSON.stringify(body)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    kq.hidden = false;
    kq.textContent = [d.loi, ...d.thieu ?? [], d.loi_validate].filter(Boolean).join("\n");
    return;
  }
  ban.review_status = den;
  dongPhieu(win);
  veBienTap(win, ban);
  capNhatThe(ban.slug, den);
  toastPhanQuyet(ban, den);
}
async function dangBai(win) {
  const w = WIN.get(win.id);
  const ban = banDangDoc(w);
  if (!ban) return;
  const tuLoai = ban.review_status === "rejected";
  const dongY = await hoi({
    tieuDe: "Đưa bài lên site",
    chu: `"${ban.title}" sẽ hiện trên site ngay sau lần dựng trang kế tiếp.` + (tuLoai ? "\n\nLý do loại cũ được bỏ — phán quyết đã thu hồi thì lý do của nó không còn mô tả hiện trạng." : ""),
    nutOk: "Đưa lên site"
  });
  if (!dongY) return;
  const ct = await docChiTiet(duongBai(ban));
  if (!ct) return bao(true, LOI_DOC_BAI);
  const r = await fetch("/api/articles/" + duongBai(ban) + "/status", {
    method: "PATCH",
    headers: { ...HJ, "if-match": ct.etag },
    body: JSON.stringify({ to: "approved" })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    return bao(true, [d.loi, ...d.thieu ?? [], d.loi_validate].filter(Boolean).join(" · ") || "Không đổi được trạng thái.");
  }
  ban.review_status = "approved";
  veBienTap(win, ban);
  capNhatThe(ban.slug, "approved");
  toastPhanQuyet(ban, "approved");
}
async function xoaTuCua(id) {
  const w = WIN.get(id);
  const ban = banDangDoc(w);
  if (!ban) return;
  const dongY = await hoi({
    tieuDe: "Bỏ bài khỏi kho",
    chu: `"${ban.title}" sẽ chuyển vào thùng rác — giữ nguyên nội dung, khôi phục được ở màn Kho.

Đây KHÔNG phải "loại bài": bài bỏ khỏi kho không còn nằm trong ô thống kê nào. Muốn ghi lại phán quyết "đã đọc, không đáng giữ" thì dùng ✕ Loại — bài ở lại kho kèm lý do.`,
    nutOk: "Bỏ khỏi kho",
    pha: true
  });
  if (!dongY) return;
  const ct = await docChiTiet(duongBai(ban));
  if (!ct) return bao(true, LOI_DOC_BAI);
  const r = await fetch("/api/articles/" + duongBai(ban), {
    method: "DELETE",
    headers: { "if-match": ct.etag }
  });
  if (!r.ok) return bao(true, "Xoá trượt: " + ((await r.json().catch(() => ({}))).loi ?? r.status));
  capNhatThe(ban.slug, null);
  dong(id);
  void veRac();
  bao(false, `Đã bỏ "${ban.title}" vào thùng rác — nội dung còn nguyên, khôi phục ở màn Kho.`);
}
let FM_GOC = null;
/*
 * WO-013/1 · MÀN NẠP của module chứa `loai`.
 *
 * `suaTuCua` trước đó gọi `doiView("napbaiviet")` KHÔNG ĐIỀU KIỆN, nên sửa một
 * TÀI LIỆU hay một VIDEO đưa người dùng sang màn nạp BÀI VIẾT — đúng "gộp chung
 * màn" người dùng cấm, và nhìn thấy được.
 *
 * Đích DẪN XUẤT từ hai bảng khai, y khuôn `nutNap()` phía SSR. Không gõ ba đường.
 *
 * Loại lạ ⇒ rơi về màn bài viết chứ KHÔNG ném: một `source_type` chưa biết không
 * được làm nút Sửa chết mà không lời nào.
 */
declare const __NAP_CUA__: Record<string, string>
function manNapCua(loai: string): string {
  return __NAP_CUA__[loai] ?? __NAP_CUA__[""]
}

/*
 * WO-013/2 · SỬA MỘT BẢN TÀI LIỆU — đường riêng, không dùng form viết bài.
 *
 * WO-013/1 đã đưa người dùng về đúng `/tai-lieu/nap/`; màn đó chỉ có lối NẠP
 * MỚI, nên không có chỗ nào hiện hiện vật đang gắn. `media` KHÔNG mất (đo ở
 * WL-01K9NNWO013) — đây là THIẾU TÍNH NĂNG.
 *
 * `hienVatCho` giữ con trỏ đang chọn: vào chế độ sửa thì nó là hiện vật CŨ, và
 * chỉ đổi khi người dùng bấm "Thay file…" rồi chọn file mới. Nhờ vậy "lưu mà
 * không đụng file" giữ nguyên `sha256` — vế nặng của cổng.
 */
/*
 * WO-045 · khoá ngữ cảnh SỬA trong `sessionStorage`.
 *
 * Khuôn nối-lại này đã có tiền lệ trong chính file: `khoiDong()` đọc
 * `document.body.dataset.moBai` để mở lại CỬA SỔ ĐỌC sau điều hướng. Chỗ khác
 * là ngữ cảnh sửa phải sống qua một lần TẢI TRANG, nên nó cần `sessionStorage`
 * chứ không phải một thuộc tính trên `body` do server phát.
 */
const KHOA_SUA = "gn-sua-tai-lieu"

let SUA_TL: { duong: string; etag: string; fm: Record<string, unknown> } | null = null

/**
 * Nối lại ngữ cảnh sửa sau khi `doiView` đã điều hướng.
 *
 * XOÁ NGAY sau khi đọc: để lại thì lần vào `/…/nap/` kế tiếp (bấm "+ nạp tài
 * liệu", KHÔNG phải Sửa) sẽ mở ra form đã điền sẵn của bài cũ — và người sẽ
 * ghi đè một bài họ không định đụng.
 */
function noiLaiSua() {
  let raw = null
  try { raw = sessionStorage.getItem(KHOA_SUA) } catch { return }
  if (!raw) return
  try { sessionStorage.removeItem(KHOA_SUA) } catch { /* riêng tư */ }
  // Không có form trên trang này ⇒ không phải trang nap; ngữ cảnh đã xoá ở trên
  // nên nó không đi lang thang sang lần điều hướng sau.
  if (!G("tv-1l")) return
  let nc
  try { nc = JSON.parse(raw) } catch { return }
  if (!nc?.duong) return
  SUA_TL = nc
  dienFormSua(nc)
}

/**
 * Điền form sửa tài liệu. Tách khỏi `suaTaiLieu` để `noiLaiSua()` dùng LẠI —
 * chép đôi mã thì chỗ thứ hai sẽ lệch, và lệch ở đây nghĩa là form nối lại
 * thiếu một ô mà không ai thấy.
 */
function dienFormSua(nc: { duong: string; etag: string; fm: Record<string, unknown> }) {
  // Tên hiển thị lấy từ ĐƯỜNG đã cất, không từ một biến ngoài — sau điều hướng
  // không còn `ban` nào để đọc.
  const ten = String(nc.duong).split("/").pop()?.replace(/\.md$/, "") ?? nc.duong
  // FR-052 · `media` la MANG. Form sua giu hien vat DAU; sua nhieu hien vat
  // cung luc la mot man rieng, chua co.
  type HV = { sha256: string; mime: string; ten_goc: string; so_byte: number }
  const mRaw = nc.fm.media as HV | HV[] | undefined
  const m = Array.isArray(mRaw) ? mRaw[0] : mRaw
  hienVatCho = m ?? null

  const dat = (id: string, v: string) => {
    const el = G(id)
    if (el) el.textContent = v
  }
  dat("tv-hv-ten", m?.ten_goc ?? "(chưa có file)")
  const loai = MEDIA.loai.find((l) => l.mime === m?.mime)
  dat("tv-hv-cd", m ? `${loai ? loai.ten : "tệp khác"} · ${doGon(m.so_byte)}` : "")
  const cu = G("tv-hv-cu")
  if (cu) cu.hidden = false

  const o1 = G("tv-1l") as HTMLInputElement | null
  if (o1) o1.value = String(nc.fm.one_liner ?? "")
  // WO-028 · khong con o `tv-slug` de dien. Sua mot ban GIU nguyen slug cu:
  // server tu choi doi `slug` qua PUT (M08-R5), nen khong co gi phai gui.
  const meta = G("tv-meta")
  if (meta) meta.hidden = false
  const gui = G("tv-gui")
  if (gui) gui.textContent = "Lưu thay đổi"
  kqTV(`Đang SỬA ${ten}. Không đụng file thì hiện vật giữ nguyên.`, "ok")
}

function suaTaiLieu(ban: { slug: string; source_type: string }, ct: {
  frontmatter: Record<string, unknown>; etag: string
}) {
  /*
   * WO-045 · CẤT NGỮ CẢNH TRƯỚC KHI `doiView` — sau đó là quá muộn.
   *
   * `doiView` CÓ THỂ ĐIỀU HƯỚNG: khi view không có trong DOM (và `v-naptailieu`
   * bị cắt khỏi MỌI trang không phải nap), nó `location.href = duong` rồi
   * return. Mọi dòng sau đây chạy trên một trang đang UNLOAD, nên `SUA_TL` và
   * các ô `tv-*` mất theo lần tải mới.
   *
   * Đo được trước khi sửa: `/tai-lieu/` → "✎ Sửa…" → tới `/tai-lieu/nap/` với
   * `tv-1l` RỖNG và nút vẫn "Ghi vào kho" — người bấm SỬA nhận form NẠP MỚI.
   *
   * `sessionStorage` chứ không `localStorage`: ngữ cảnh sửa là việc của MỘT
   * tab đang làm dở. `localStorage` sống qua cả lần đóng trình duyệt và dùng
   * chung mọi tab ⇒ tab thứ hai sẽ thấy "đang sửa" một bài mình chưa bấm.
   */
  const nguCanh = { duong: duongBai(ban), etag: ct.etag, fm: ct.frontmatter }
  try { sessionStorage.setItem(KHOA_SUA, JSON.stringify(nguCanh)) } catch { /* riêng tư */ }
  doiView("naptailieu")
  // Còn ở lại trang (view có sẵn ⇒ `doiView` KHÔNG điều hướng) thì ngữ cảnh vừa
  // cất là thừa — `noiLaiSua()` xoá nó ở lượt khởi động kế tiếp dù đường nào.
  SUA_TL = nguCanh
  dienFormSua(nguCanh)
}

async function suaTuCua(id) {
  const w = WIN.get(id);
  const ban = banDangDoc(w);
  if (!ban) return;
  const ct = await docChiTiet(duongBai(ban));
  if (!ct) return bao(true, LOI_DOC_BAI);
  dong(id);
  // Tài liệu đi đường RIÊNG: form viết bài không có ô hiện vật, và dùng lại nó
  // là gộp chung tính năng — đúng thứ WO-013/1 vừa tách ra.
  if (manNapCua(ban.source_type) === "naptailieu") {
    suaTaiLieu(ban, ct)
    return
  }
  /*
   * WO-045 · ca THỨ HAI của cùng lớp lỗi. `doiView` có thể ĐIỀU HƯỚNG, và mọi
   * dòng điền DOM sau nó chạy trên trang đang unload.
   *
   * Khác `suaTaiLieu` một điểm: form bài viết (`f-bai`) nằm trong view
   * `napbaiviet`, và view đó CŨNG bị cắt khỏi trang không phải nap. Nên cùng
   * một phép cất — `noiLaiSua()` chỉ điền khi tìm thấy form của nó.
   */
  try {
    sessionStorage.setItem(KHOA_SUA, JSON.stringify(
      { duong: duongBai(ban), etag: ct.etag, fm: ct.frontmatter }))
  } catch { /* riêng tư */ }
  doiView(manNapCua(ban.source_type));
  const form = G("f-bai");
  if (!form) return;
  form.hidden = false;
  form.dataset.sua = duongBai(ban);
  form.dataset.etag = ct.etag;
  FM_GOC = ct.frontmatter;
  await dienForm(ct.frontmatter, ct.body);
  soiThanBai();
  const che = G("f-che");
  if (che) {
    che.textContent = `Đang SỬA ${ban.slug} · trạng thái đi theo vòng đời — bài đã duyệt mà đổi nội dung sẽ chuyển sang edited`;
  }
  const gui = G("f-gui");
  if (gui) gui.textContent = "Lưu thay đổi";
  for (const k of ["f-id", "f-slug", "f-type"]) {
    G(k).disabled = true;
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}
function datLaiForm() {
  const form = G("f-bai");
  if (!form) return;
  form.reset();
  form.hidden = true;
  delete form.dataset.sua;
  delete form.dataset.etag;
  FM_GOC = null;
  for (const k of ["f-id", "f-slug", "f-type"]) {
    const el = G(k);
    if (el) el.disabled = false;
  }
  const che = G("f-che");
  if (che) che.textContent = "Viết bài mới · bài vào kho ở trạng thái draft, chờ người duyệt";
  const gui = G("f-gui");
  if (gui) gui.textContent = "Ghi vào kho";
  const kq = G("f-kq");
  if (kq) kq.hidden = true;
  const ngay = G("f-ngay");
  if (ngay) ngay.value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  soiThanBai();
}
/*
 * MOT ham cho MOI bo tab (`dm*` cua man Danh muc, `nap*` cua dai loi nap).
 *
 * Truoc do chi co ban `dm`, va handler cua `nap` KHONG TON TAI: do tren
 * Chromium, bam "Tu viet bai" o `/bai-viet/nap/` khong lam gi — ba panel giu
 * `link=hien · file=an · viet=an`, `#f-bai` van `hidden`. Tuc HAI trong ba loi
 * nap bai viet khong vao duoc, va khong ai viet duoc bai nao qua web.
 *
 * 66 file test bo lot vi chung kiem MARKUP ("nut co trong DOM", "panel co
 * trong DOM") — ca hai dung, thu sai la khong ai NOI chung lai.
 *
 * Viet chung mot ham chu khong hai ban: hai vong lap giong nhau tung chu la
 * hai cho de lech, va `gn.js` chi con 147 byte du.
 */
/*
 * MOT CAU, MOT CHO — cung nguyen tac cua LOI_HOST va LOI_DOC_BAI.
 *
 * Do tren ban build: hai mau nay xuat hien 5 va 3 lan (76 + 66 byte). Hop lai
 * de doi cho cho handler  vua phuc hoi —  vuot tran 81 byte
 * khi them handler naptab, va tran thi KHONG noi (tien le page-weight:85-89).
 */
const loiMa = (r: Response) => `Lỗi ${r.status}`
const loiMay = (r: Response) => `Máy chủ trả ${r.status}.`

/*
 * Gan mot lang nghe theo id — thay 13 ban cua
 * `G(id)?.addEventListener(...)`.
 *
 * Do tren ban build: doan `")?.addEventListener("` mot minh la 252 byte. Day
 * la phep BO, khong phai phep DOI: moi loi goi giu nguyen id, su kien va ham
 * xu ly, va `?.` van la dung — moc co the khong ton tai trong shell nao do.
 */
/*
 * `G` = `document.getElementById`.
 *
 * Do tren ban build: doan `document.getElementById(` dai 23 ky tu va xuat hien
 * **127 lan** — ~2.9 KB trong mot bundle tran 100 KB. Gom lai la phep BO:
 * moi loi goi giu nguyen id va ngu canh, ke ca `G("x") as HTMLElement | null`.
 *
 * Ten mot chu la co y: no xuat hien 127 lan, nen moi ky tu them vao no la 127
 * byte. Chu thich nay o day de khong ai phai doan `G` la gi.
 */
const G = (id: string) => document.getElementById(id)

function nghe(id: string, ev: string,
              fn: (e: Event) => void, opt?: AddEventListenerOptions) {
  G(id)?.addEventListener(ev, fn, opt)
}
function moTab(kho, ten) {
  for (const b of document.querySelectorAll(`[data-${kho}tab]`)) {
    b.setAttribute("aria-selected", String(b.dataset[kho + "tab"] === ten));
  }
  for (const p of document.querySelectorAll(`[data-${kho}view]`)) {
    p.hidden = p.dataset[kho + "view"] !== ten;
  }
}
const moTabDm = (ten) => moTab("dm", ten);
const DM_MOI_TRANG = 20;
const DM_TRANG = { cpt: 1, cat: 1, cho: 1 };
function veTrangDm(ten) {
  const moc = { cpt: "cchua", cat: "catlist", cho: "cprop" }[ten];
  const o = moc ? G(moc) : null;
  const nav = G("pg-" + ten);
  if (!o || !nav) return;
  const hang = [...o.children].filter((e) => e.classList.contains("rc-r") || e.tagName === "A");
  const soTrang = Math.max(1, Math.ceil(hang.length / DM_MOI_TRANG));
  const tr = Math.min(Math.max(1, DM_TRANG[ten] ?? 1), soTrang);
  DM_TRANG[ten] = tr;
  hang.forEach((e, i) => {
    const trang = Math.floor(i / DM_MOI_TRANG) + 1;
    e.hidden = trang !== tr;
  });
  nav.hidden = soTrang < 2;
  if (soTrang < 2) {
    nav.innerHTML = "";
    return;
  }
  nav.innerHTML = `<button type="button" data-dmpg="${ten}:${tr - 1}"${tr <= 1 ? " disabled" : ""}>‹ trước</button><span class="pgi">trang <b>${tr}</b> / ${soTrang} · ${hang.length} mục</span><button type="button" data-dmpg="${ten}:${tr + 1}"${tr >= soTrang ? " disabled" : ""}>tiếp ›</button>`;
}
function veDm() {
  for (const t of ["cpt", "cat", "cho"]) veTrangDm(t);
}
let DLG_LOAI = "cpt";
function moPopupNhan(loai) {
  const d = G("dlg-nhan");
  if (!d) return;
  DLG_LOAI = loai;
  const dat = (id, v) => {
    const el = G(id);
    if (el) el.textContent = v;
  };
  dat("dlg-tieu", loai === "cpt" ? "Khái niệm mới" : "Chủ đề mới");
  dat("dlg-canh", "");
  for (const [id, hien] of [["dlg-r-gom", loai === "cat"], ["dlg-r-alias", loai === "cpt"]]) {
    const el = G(id);
    if (el) el.hidden = !hien;
  }
  // WO-029 · `dlg-nhan-o`, KHONG `dlg-nhan`: id sau la cua chinh the
  // `<dialog>`, va `getElementById` tra phan tu DAU TIEN — vong nay tung dat
  // `.value` len cai dialog, nen o nhap KHONG BAO GIO duoc xoa giua hai lan mo.
  for (const id of ["dlg-id", "dlg-nhan-o", "dlg-gom", "dlg-alias"]) {
    const el = G(id);
    if (el) el.value = "";
  }
  d.showModal();
  G("dlg-id")?.focus();
}
async function guiPopupNhan(e) {
  e.preventDefault();
  const v = (id2) => G(id2)?.value.trim() ?? "";
  const id = v("dlg-id");
  // WO-029 · doc O NHAP (`dlg-nhan-o`). Truoc day doc `dlg-nhan` va trung id
  // voi the `<dialog>`, nen `.value` la `undefined` => `label_vi` LUON rong =>
  // server tra 422 *"can NGUOI khai: label_vi"* du nguoi dung DA dien.
  const than = { id, label_vi: v("dlg-nhan-o") };
  if (DLG_LOAI === "cat") {
    than.gom = v("dlg-gom");
    than.xac_nhan = true;
  } else {
    const al = v("dlg-alias").split(",").map((s) => s.trim()).filter(Boolean);
    if (al.length) than.aliases = al;
  }
  const o = { method: "POST", headers: HJ, body: JSON.stringify(than) };
  const r = DLG_LOAI === "cpt" ? await fetch("/api/concepts", o) : await fetch("/api/categories", o);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const canh = G("dlg-canh");
    const thieu = Array.isArray(d.thieu) ? " — " + d.thieu.join("; ") : "";
    if (canh) canh.textContent = String(d.loi ?? loiMa(r)) + thieu;
    return;
  }
  ;
  G("dlg-nhan")?.close();
  await napDanhMuc();
  bao(false, `Đã thêm "${id}"`);
}
const DUONG_NHAN: Record<string, string> = {
  cpt: "/api/concepts/", cat: "/api/categories/", nguon: "/api/loai-nguon/",
}
let SUA_KHOA = "";
let NHAN_CU = "";
function moPopupSua(khoa, nhanCu, gomCu) {
  const d = G("dlg-sua");
  if (!d) return;
  SUA_KHOA = khoa;
  NHAN_CU = nhanCu;
  const [loai, id] = khoa.split(":");
  const el = G("dlg-sua-id");
  if (el) el.textContent = id;
  const dat = (i, val) => {
    const x = G(i);
    if (x) x.value = val;
  };
  dat("dlg-sua-nhan", nhanCu);
  dat("dlg-sua-gom", gomCu);
  const rg = G("dlg-sua-r-gom");
  if (rg) rg.hidden = loai !== "cat";
  d.showModal();
  G("dlg-sua-nhan")?.focus();
}
async function guiPopupSua(e) {
  e.preventDefault();
  const [loai, id] = SUA_KHOA.split(":");
  const v = (i) => G(i)?.value.trim() ?? "";
  const than = {};
  if (v("dlg-sua-nhan")) than.label_vi = v("dlg-sua-nhan");
  if (loai === "cat" && v("dlg-sua-gom")) than.gom = v("dlg-sua-gom");
  const o = { method: "PATCH", headers: HJ, body: JSON.stringify(than) };
  // BANG TRA thay cho chuoi ternary: ba loai nhan, ba duong. Mot ternary hai
  // nhanh khong mo rong duoc cho cai thu ba ma khong them mot nhanh nua, va
  // moi nhanh la mot cho de quen.
  const r = await fetch(DUONG_NHAN[loai] + id, o);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return bao(true, String(d.loi ?? loiMa(r)));
  G("dlg-sua")?.close();
  if (loai === "cpt") doiNhan3D(NHAN_CU, than.label_vi ?? "");
  if (loai === "nguon") {
    /*
     * Danh sach loai nguon do SSR dung — khong co moc nao de `napDanhMuc`
     * lam moi. Do tren trinh duyet: PATCH thanh cong ma hang tren man giu chu
     * cu toi khi tai lai; "ghi ma doc khong ra", cung lop loi da bat o WO-016.
     *
     * Doi luon `data-nhan` cua nut: lan mo sau phai hien gia tri HIEN TAI, chu
     * khong phai gia tri luc trang duoc dung.
     */
    const nut = document.querySelector<HTMLElement>(
      `[data-suanhan="nguon:${id}"]`)
    const hang = nut?.closest(".ln-r")?.querySelector(".ln-n")
    if (hang && than.label_vi) hang.textContent = than.label_vi
    if (nut && than.label_vi) nut.dataset.nhan = than.label_vi
  }
  await napDanhMuc();
  bao(false, `Đã sửa "${id}"`);
}
function ganManDanhMuc() {
  nghe("f-nhan-moi", "submit", (e) => {
    void guiPopupNhan(e);
  });
  nghe("f-nhan-sua", "submit", (e) => {
    void guiPopupSua(e);
  });
  veDm();
}
async function dienForm(fm, than) {
  if (DANH_MUC) await DANH_MUC;
  const dat = (id, gt) => {
    const el = G(id);
    if (el) el.value = String(gt ?? "");
  };
  dat("f-title", fm.title);
  dat("f-id", fm.id);
  dat("f-slug", fm.slug);
  dat("f-type", fm.source_type);
  dat("f-url", fm.url);
  dat("f-cred", fm.credibility_max);
  dat("f-conf", fm.conformance);
  dat("f-ngay", fm.analyzed_at);
  dat("f-1l", fm.one_liner);
  dat("f-cptmoi", Array.isArray(fm.concepts_proposed) ? fm.concepts_proposed.join(", ") : "");
  const cats = Array.isArray(fm.category) ? fm.category : [];
  document.querySelectorAll("#f-cat input").forEach((c) => {
    c.checked = cats.includes(c.value);
  });
  const cpts = Array.isArray(fm.concepts) ? fm.concepts : [];
  document.querySelectorAll("#f-cpt input").forEach((c) => {
    c.checked = cpts.includes(c.value);
  });
  /*
   * WO-037 · CHOT AN TOAN thay cho luoi cu.
   *
   * Truoc day than khong khop khung thi roi ve che do THO de khoi mat noi
   * dung. Che do do da bo, nen phai co thu khac dung cho no — khong thi mo
   * form roi luu la GHI DE than bai bang rong, am tham.
   */
  if (than.trim()) {
    if (!doThan(than, `Thân bài không khớp khung ${KHUNG.muc.length} mục — không`
      + " mở được bằng form. Sửa file .md trực tiếp, hoặc viết lại theo khung.")) return;
  }
}
/*
 * WO-030 · NHAN PHAN TU, KHONG NHAN ID — va `null` la hop le.
 *
 * Truoc day ham nay thoat ngay khi khong tim thay mount, nen tren man Danh muc
 * (noi `catNap()` da cat het cac man nap, tuc khong con `[data-dm]` nao) API
 * KHONG duoc goi lan nao va danh sach luon hien "dang trong" — du DB co du
 * lieu that va KPI ngay tren cung man hien dung so.
 *
 * Man Danh muc can CHINH DU LIEU, khong can o tich cua man nap.
 */
async function napMotDanhMuc(o, duong) {
  const hong = (chu) => {
    if (o) o.innerHTML = `<i class="f-loi">${esc(chu)}</i>`;
  };
  try {
    const r = await fetch(duong);
    if (!r.ok) {
      hong(r.status === 404 ? `${duong} trả 404 — server API nhiều khả năng đang chạy bản cũ. Dừng nó (Ctrl+C) rồi chạy lại: npm run api` : `Không tải được danh mục (${r.status}).`);
      return null;
    }
    const d = await r.json();
    if (!d.items?.length) {
      hong("Danh mục đang trống.");
      return [];
    }
    // Ghi vao mount CHI KHI co mount — man Danh muc khong co, va van can `d.items`.
    if (o) {
      o.innerHTML = d.items.map((c) => `<label title="${esc(c.label_vi)}"><input type="checkbox" value="${esc(c.id)}">${esc(c.id)}</label>`).join("");
    }
    return d.items;
  } catch {
    hong("Không gọi được API — kiểm tra `npm run api` còn chạy không.");
    return null;
  }
}
function hangNhanFE(c, loai) {
  const n = c.dang_dung;
  const nhan = c.label_vi || c.id;
  return `<div class="rc-r r-${loai}${n ? " r-dung" : ""}"><time>${n ? `${n} bài` : "0 bài"}</time><span><b>${esc(nhan)}</b> <code>${esc(c.id)}</code>${c.gom ? ` · ${esc(c.gom)}` : ""}</span><span class="rc-act"><button type="button" class="bt ghost sm api-only" data-suanhan="${loai}:${esc(c.id)}" data-nhan="${esc(c.label_vi || "")}" data-gom="${esc(c.gom || "")}">sửa</button><button type="button" class="bt dstr sm api-only" data-xoanhan="${esc(loai)}:${esc(c.id)}" data-dung="${n}">xoá</button></span></div>`;
}
function barCptFE(c) {
  return `<div class="rc-r r-cpt r-dung"><button type="button"
     class="rc-loc" data-loc="cpt" data-gt="${esc(c.id)}" aria-pressed="false"
     title="lọc bài mang nhãn này"><time>${c.dang_dung} bài</time>
     <span><b>${esc(c.label_vi || c.id)}</b> <code>${esc(c.id)}</code></span>
     </button><span class="rc-act"><button type="button"
     class="bt ghost sm api-only" data-suanhan="cpt:${esc(c.id)}"
     data-nhan="${esc(c.label_vi || "")}" data-gom="">sửa</button><button
     type="button" class="bt dstr sm api-only" data-xoanhan="cpt:${esc(c.id)}"
     data-dung="${c.dang_dung}">xoá</button></span></div>`;
}
function datMoc(id, noiDung, khiRong = "") {
  const o = G(id);
  if (!o) return;
  o.innerHTML = noiDung.trim() || (khiRong ? `<p class="hint">${khiRong}</p>` : "");
}
function veDanhMuc(cpt, cat) {
  const daDung = cpt.filter((c) => c.dang_dung > 0);
  const chuaDung = cpt.filter((c) => !c.dang_dung);
  datMoc(
    "cb",
    daDung.slice().sort((a, b) => b.dang_dung - a.dang_dung).map((c) => barCptFE(c)).join(""),
    cpt.length ? `Danh mục có <b>${cpt.length}</b> khái niệm, chưa bài nào dùng tới.` : "Danh mục khái niệm đang trống."
  );
  datMoc("ccount", cpt.length ? `${daDung.length}/${cpt.length} đang dùng` : "");
  datMoc(
    "cchua",
    chuaDung.map((c) => hangNhanFE(c, "cpt")).join(""),
    cpt.length ? "Mọi khái niệm đều đã có bài dùng tới." : ""
  );
  datMoc(
    "catlist",
    cat.map((c) => hangNhanFE(c, "cat")).join(""),
    "Danh mục chủ đề đang trống."
  );
  datMoc("catcount", cat.length ? `${cat.length} mảng` : "");
  datMoc("dmn-cpt", cpt.length ? `${cpt.length} mục` : "");
  datMoc("dmn-cat", cat.length ? `${cat.length} mảng` : "");
  veDm();
}
function doiNhan3D(cu, moi) {
  if (!cu || cu === moi) return;
  for (const s of document.querySelectorAll("#mbdm .tw-l span")) {
    const t = s.textContent ?? "";
    if (t.endsWith(" " + cu)) s.textContent = t.slice(0, -cu.length) + moi;
  }
}
let DANH_MUC = null;
/*
 * WO-016 · nap MOI moc `[data-dm]`, khong hai id go cung.
 *
 * Ban truoc go `f-cpt` va `f-cat`. Ba form nap (bai viet · tai lieu · video)
 * moi form can hai moc, tuc sau id — va form nao bi quen thi IM LANG khong
 * duoc nap danh muc, roi nguoi dung thay `dang tai...` vinh vien. Dung benh
 * `#acount` cua WO-015, va cach chua cung hinh dang: moc TU KHAI bang mot
 * thuoc tinh, ma dem/nap thi VONG qua chung.
 *
 * Mot lan `fetch` cho moi LOAI, khong moi moc: ba form cung mot danh muc, va
 * ba lan goi la ba co hoi de ba form thay ba danh sach khac nhau.
 */
const DUONG_DM: Record<string, string> = {
  cpt: "/api/concepts", cat: "/api/categories",
}

/*
 * Nhan DA CHON trong dung form dang mo.
 *
 * Tien to (`tv-` / `vd-` / `f-`) la dia chi cua form. Doc `f-cat` tu ham gui
 * cua tai lieu thi no gui nhan cua form BAI VIET — mot loi khong bao gi, vi
 * ca hai deu la mang chuoi hop le.
 */
function nhanCua(tien: string, loai: string): string[] {
  return [...document.querySelectorAll<HTMLInputElement>(
    "#" + tien + "-" + loai + " input:checked")].map((c) => c.value)
}
/*
 * MỘT CÂU, MỘT CHỖ — cùng nguyên tắc `LOI_HOST` đã áp.
 *
 * Đo trên bản build: `Không đọc được bài từ API.` xuất hiện **4** lần (182
 * byte), hai câu kia mỗi câu 2 lần (110 byte). Hợp lại là 400 byte, và
 * `gn.js` vừa vượt trần 251 byte khi thêm ô nhãn — nên đây là SIẾT, không
 * phải nới (`page-weight.test.js:85-89` có tiền lệ).
 *
 * Lợi thật hơn byte: hai bản của một lời là hai chỗ để lệch, và lời sửa ở
 * bản này thì bản kia vẫn nói câu cũ.
 */
const LOI_DOC_BAI = "Không đọc được bài từ API."
const LOI_MOT_CAU = "Thiếu câu tóm tắt — nó là thứ người đọc thấy trước."
const LOI_SLUG = "Địa chỉ trong kho phải là chữ thường, số và dấu gạch nối."

/** Câu nhắc nhãn — khác nhau đúng một chữ, nên là một hàm chứ không hai câu. */
const loiNhan = (loai: string) =>
  "Chọn ít nhất một chủ đề và một khái niệm — hai nhãn đó là cách "
  + loai + " tìm lại được."
/*
 * MO TA -> THAN BAI.
 *
 * Truoc do hai duong nay gui `body: motCau`, tuc than bai LAP LAI cau tom tat
 * — mot ban ghi tu noi hai lan, va nguoi dung khong co cho nao de mo ta.
 *
 * Rong thi tra ve cau tom tat: mot ban ghi khong co than bai nao thi
 * `validate.py` doi ho so khac. Giu hanh vi cu lam DUONG LUI, khong bat buoc.
 */
function thanTu(tien: string, motCau: string): string {
  const o = G(tien + "-mo") as HTMLTextAreaElement | null
  const mo = (o?.value ?? "").trim()
  return mo || motCau
}

function napDanhMuc() {
  const moc: Record<string, HTMLElement[]> = { cpt: [], cat: [] }
  for (const o of document.querySelectorAll<HTMLElement>("[data-dm]")) {
    const k = o.dataset.dm ?? ""
    if (moc[k]) moc[k].push(o)
  }
  DANH_MUC = Promise.all(Object.keys(DUONG_DM).map((k) =>
    napLoaiDanhMuc(k, moc[k]))).then(([cpt, cat]) => {
    if (cpt && cat) veDanhMuc(cpt, cat);
  });
  return DANH_MUC;
}

/** Mot lan goi cho mot LOAI nhan, roi ve vao MOI moc cua loai do. */
async function napLoaiDanhMuc(loai: string, moc: HTMLElement[]) {
  // KHONG thoat som khi vang mount: man Danh muc khong co mount nao ma van can
  // du lieu. `moc[0]` la `undefined` o do, va `napMotDanhMuc` chap nhan dieu do.
  const ds = await napMotDanhMuc(moc[0] ?? null, DUONG_DM[loai])
  if (ds && moc.length > 1) {
    const html = moc[0].innerHTML
    for (const o of moc.slice(1)) o.innerHTML = html
  }
  return ds
}
async function ketNapKhaiNiem(id, so) {
  const nhan = await hoi({
    tieuDe: "Kết nạp khái niệm",
    chu: `${so} bài đã đề xuất "${id}". Máy không đặt nhãn hộ — nhãn là thứ người đọc thấy trên màn Danh mục.`,
    nutOk: "Thêm nhãn",
    nhap: { nhan: "Nhãn tiếng Việt", mau: "vd: Tính lũy đẳng" }
  });
  if (!nhan?.trim()) return;
  const r = await fetch("/api/concepts", {
    method: "POST",
    headers: HJ,
    body: JSON.stringify({ id, label_vi: nhan.trim() })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return bao(true, String(d.loi ?? loiMa(r)));
  await napDanhMuc();
  bao(false, `Đã thêm "${id}" — danh mục có ${d.so_muc} mục`);
}
async function xoaNhanTuWeb(khoa, dangDung = 0) {
  const [loai, id] = khoa.split(":");
  const dongY = await hoi({
    tieuDe: dangDung > 0 ? "Xoá nhãn ĐANG ĐƯỢC DÙNG" : "Xoá nhãn",
    chu: dangDung > 0 ? `${dangDung} bài đang dùng "${id}".

Xoá thì các bài đó trỏ vào một nhãn không còn tồn tại, và bạn sẽ KHÔNG sửa lại được chúng cho tới khi gán nhãn khác. Bài vẫn đọc được, vẫn ở nguyên chỗ cũ.

Không có thùng rác cho nhãn — muốn dùng lại phải thêm mới.` : `Xoá "${id}" khỏi danh mục? Không có thùng rác cho nhãn — muốn dùng lại phải thêm mới.`,
    nutOk: dangDung > 0 ? `Vẫn xoá (${dangDung} bài bị ảnh hưởng)` : "Xoá nhãn",
    pha: true
  });
  if (!dongY) return;
  const q = dangDung > 0 ? "?force=1" : "";
  const r = loai === "cpt" ? await fetch("/api/concepts/" + id + q, { method: "DELETE" }) : await fetch("/api/categories/" + id + q, { method: "DELETE" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const ds = Array.isArray(d.bai) ? d.bai : [];
    return bao(true, String(d.loi ?? loiMa(r)) + (ds.length ? " — " + ds.join(", ") : ""));
  }
  await napDanhMuc();
  const hong = Array.isArray(d.gay_hong) ? d.gay_hong : [];
  bao(
    hong.length > 0,
    `Đã xoá "${id}" — còn ${d.so_muc} mục` + (hong.length ? `. ${hong.length} bài cần gán nhãn khác: ${hong.join(", ")}` : "")
  );
}
const esc2 = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function theFE(b, i, ngay) {
  const cat = b.category ?? [];
  const cpt = b.concepts ?? [];
  return `<button type="button" class="cd st-${esc2(b.review_status)}" data-open="${i}" data-slug="${esc2(b.slug)}" data-loai="${esc2(b.source_type)}" data-cat="${esc2(cat.join(" "))}" data-cpt="${esc2(cpt.join(" "))}" data-ngay="${esc2(ngay)}" data-pri="${b.priority || 0}" style="--c:var(--c-${esc2(b.source_type)},var(--ink-2))"><i class="tg"><b>${esc2(b.source_type)}</b></i><h4>${esc2(b.title)}</h4><div class="mt"><span class="pr">${b.priority || "—"}</span> ${esc2(b.credibility_max)}` + (b.review_status !== "approved" ? ` · ${esc2(b.review_status)}` : "") + (b.origin === "external" ? '<span class="ex">ngoài</span>' : "") + "</div>" + (cat.length ? `<div class="cts">${cat.map((c) => `<span class="ctx">${esc2(c)}</span>`).join("")}</div>` : "") + "</button>";
}
async function dongBoThe() {
  if (!API_CO) return;
  const ds = await nap();
  if (!ds.length) return;
  const viTri = /* @__PURE__ */ new Map();
  ds.forEach((g, i) => {
    for (const b of g.bans) viTri.set(b.slug, i);
  });
  for (const el of document.querySelectorAll("[data-open][data-slug]")) {
    const i = viTri.get(el.dataset.slug ?? "");
    if (i !== void 0) el.dataset.open = String(i);
  }
  const luoi = G("grid2");
  if (luoi) {
    const co = new Set([...luoi.querySelectorAll(".cd")].map((e) => e.dataset.slug ?? ""));
    const them = [];
    ds.forEach((g, i) => {
      for (const b of g.bans) {
        if (co.has(b.slug)) continue;
        const ngay = b.analyzed_at ?? "";
        them.push(theFE(b, i, ngay));
      }
    });
    if (them.length) {
      luoi.querySelector(".empty,.hint")?.remove();
      luoi.insertAdjacentHTML("afterbegin", them.join(""));
      const dem = G("acount");
      if (dem) dem.textContent = `${luoi.querySelectorAll(".cd").length} bản`;
    }
  }
}
async function veRac() {
  const o = G("rac");
  if (!o || !API_CO) return;
  try {
    const r = await fetch("/api/recycle");
    if (!r.ok) return;
    const d = await r.json();
    const dem = G("rcount");
    if (dem) dem.textContent = d.items.length ? d.items.length + " bản" : "trống";
    const oKpiRac = G("kp-rac");
    if (oKpiRac) {
      oKpiRac.textContent = String(d.items.length).padStart(2, "0");
      oKpiRac.closest(".kp")?.classList.toggle("trong", d.items.length === 0);
      oKpiRac.closest(".kp")?.classList.toggle("bad", d.items.length > 0);
    }
    o.innerHTML = d.items.length ? d.items.map((it) => `<div class="rc-r"><time>${esc(it.deleted_at.slice(0, 10))}</time><span><b>${esc(it.slug)}</b> · ${esc(it.type)}/${esc(it.ten_file)}</span>` + (/\.\d+\.md$/.test(it.ten_file) ? "<em>trùng tên với bài đang có — cần đổi tên trước khi khôi phục</em>" : `<button class="bt ghost sm" data-phuchoi="${esc(it.type)}/${esc(it.slug)}">khôi phục</button>`) + "</div>").join("") : '<p class="note">thùng rác trống</p>';
  } catch {
  }
}
async function phucHoiRac(duong) {
  const r = await fetch("/api/articles/" + duong + "/restore", { method: "POST" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return bao(true, "Khôi phục trượt: " + (d.loi ?? r.status));
  void veRac();
  bao(false, "Đã khôi phục về kho");
}
const KHUNG = __KHUNG__;
const O_NHAP = KHUNG.muc.flatMap((m) => m.con?.length ? m.con.map((c) => ({
  so: c.so,
  ten: c.ten,
  nang: !!c.nang,
  goi_y: c.goi_y,
  cha: m
})) : [{ so: String(m.so), ten: m.ten, nang: !!m.nang, goi_y: m.goi_y }]);
// WO-038 · `TT_B` / `TT_MAX` / `TT_O` da bo. Muc tinh tuy thoi co cau truc
// con: no la mot o van xuoi nhu bay muc la kia, nen no khong con nhanh rieng
// o bat cu dau — dung khung, rai, rap, deu mot duong.
const DAN_NHAP = KHUNG.muc.filter((m) => m.dan_nhap).map((m) => String(m.so));
function dungKhung() {
  const o = G("f-o-muc");
  if (!o || o.dataset.dungRoi) return;
  o.dataset.dungRoi = "1";
  let chaDaVe = -1;
  const phan = [];
  for (const m of O_NHAP) {
    if (m.cha && m.cha.so !== chaDaVe) {
      chaDaVe = m.cha.so;
      phan.push(`<p class="f-mnhom"><b>${m.cha.so}</b>${esc(m.cha.ten)}</p>`);
    }
    phan.push(`<label class="f-m1${m.nang ? " nang" : ""}${m.cha ? " con" : ""}">
      <span><b>${esc(m.so)}</b>${esc(m.ten)}${m.nang ? ' <i class="f-req">mục nặng</i>' : ""}</span>
      <textarea data-muc="${esc(m.so)}" rows="${m.nang ? 6 : 2}" spellcheck="false"
        placeholder="${esc(m.goi_y)}"></textarea></label>`);
  }
  o.innerHTML = phan.join("");
  o.addEventListener("input", soiThanBai);
}
/*
 * WO-037 · TRA VE chuoi, khong ghi vao `#f-than`.
 *
 * `#f-than` truoc day vua la o soan tho vua la DICH LAP RAP — form gui gia tri
 * cua no di. Bo che do tho ma quen doi ham nay la mat duong gui than bai, va
 * no hong IM LANG: bai vao kho voi than rong, khong ai keu.
 */
function gomKhung() {
  const phan = [];
  for (const m of KHUNG.muc) {
    const con = m.con ?? [];
    if (!con.length) {
      const noi = layMuc(m.so);
      if (noi) phan.push(`## ${m.so}. ${m.ten}

${noi}`);
      continue;
    }
    const coCon = con.filter((c) => layMuc(c.so));
    if (!coCon.length) continue;
    phan.push(`## ${m.so}. ${m.ten}`);
    for (const c of coCon) phan.push(`### ${c.so} ${c.ten}

${layMuc(c.so)}`);
  }
  return phan.join("\n\n") + (phan.length ? "\n" : "");
}
/*
 * Do mot than bai vao form: rai o -> rai tinh tuy -> soi lai.
 *
 * Ba cho goi tung moi cho mot ban sao cua dung ba buoc nay. Ba ban sao cua
 * mot thu tu thi den ngay chung lech, va "lech" o day nghia la mot cho quen
 * rai tinh tuy — muc 3.4 bien mat, im lang.
 */
function doThan(md2, loi) {
  if (!raiKhung(md2)) { bao(true, loi); return false; }
  soiThanBai();
  return true;
}
function raiKhung(md2) {
  const { khuc, ngoai } = chiaKhuc(md2);  if (ngoai.trim() || !Object.keys(khuc).length) return false;
  for (const m of KHUNG.muc) {
    if (m.con?.length && (khuc[String(m.so)] ?? "").trim()) return false;
  }
  for (const m of O_NHAP) {
    const o = document.querySelector(`[data-muc="${m.so}"]`);
    if (o) o.value = (khuc[m.so] ?? "").trim();
  }
  return true;
}
/*
 * Che than bai thanh khuc theo `## n.` / `### n.m`.
 *
 * Chi `raiKhung` dung — huong NGUOC lai (`layMuc` lo huong o -> chu). Giu ten
 * rieng vi day la phep PHAN TICH van ban ngoai, khong phai phep doc form.
 */
/** Noi dung mot muc, doc THANG tu o. */
const layMuc = (so) =>
  ((document.querySelector(`[data-muc="${so}"]`) as HTMLTextAreaElement | null)
    ?.value ?? "").trim();

function chiaKhuc(md2) {
  const khuc = {};
  let ngoai = "";
  let dc = "";
  for (const d of md2.split(/\r?\n/)) {
    const h = d.match(/^###\s*(\d\.\d)\s/) ?? d.match(/^##\s*(\d)\s*\./);
    if (h) { dc = h[1]; khuc[dc] = ""; continue; }
    if (dc) khuc[dc] += d + "\n";
    else ngoai += d + "\n";
  }
  return { khuc, ngoai };
}

function soiThanBai() {
  const oMuc = G("f-muc");
  const oTu = G("f-tu");
  if (!oMuc || !oTu) return;
  /*
   * WO-037 · doc THANG tu o. Ban truoc rap markdown bang `gomKhung()` roi che
   * lai bang `chiaKhuc()` — mot vong tron de ve dung cho cu, va la mot cho de
   * thu HIEN len lech voi thu GUI di.
   */
  const khuc = {};
  for (const m of O_NHAP) khuc[m.so] = layMuc(m.so);
  const src = O_NHAP.map((m) => khuc[m.so]).join("\n");
  const demTu = (s) => s.replace(/```[\s\S]*?```/g, " ").replace(/^\s*#{1,6}\s.*$/gm, " ").replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean).length;
  const tong = demTu(src);
  const dan = DAN_NHAP.reduce((s, d) => s + demTu(khuc[d] ?? ""), 0);
  const tiLe = tong ? dan / tong : 0;
  oMuc.innerHTML = O_NHAP.map((m) => {
    const co = !!khuc[m.so];
    return `<li class="${co ? "co" : "thieu"}${m.cha ? " con" : ""}"><b>${esc(m.so)}</b>${esc(m.ten)}</li>`;
  }).join("");
  const thieu = O_NHAP.filter((m) => !khuc[m.so]).length;
  const tranPc = Math.round(KHUNG.tran_dan_nhap * 100);
  const dat = (dk, chu) => `<span class="${dk ? "co" : "thieu"}">${chu}</span>`;
  oTu.innerHTML = tong ? [
    dat(tong <= KHUNG.tran_tu_cung, `${tong} từ / trần ${KHUNG.tran_tu_cung}`),
    dat(
      tiLe <= KHUNG.tran_dan_nhap,
      `mục ${DAN_NHAP.join("+")}: ${Math.round(tiLe * 100)}% / trần ${tranPc}%`
    ),
    dat(thieu === 0, thieu ? `thiếu ${thieu} mục` : `đủ ${O_NHAP.length} mục`)
  ].join(" · ") : "chưa có chữ nào";
}
function ganForm() {
  const form = G("f-bai");
  if (!form || form.dataset.ganRoi) return;
  form.dataset.ganRoi = "1";
  dungKhung();
  nghe("f-mau", "click", () => {
    void dienMau();
  });
  const moNut = G("f-mo");
  moNut?.addEventListener("click", () => {
    datLaiForm();
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth" });
  });
  nghe("f-huy", "click", () => {
    if (!form.dataset.sua) {
      datLaiForm();
      return;
    }
    void hoi({
      tieuDe: "Đóng form",
      chu: "Thay đổi chưa lưu sẽ mất. Bài trong kho không đổi.",
      nutOk: "Đóng, bỏ thay đổi",
      pha: true
    }).then((dongY) => {
      if (dongY) datLaiForm();
    });
  });
  // WO-028 · o `f-slug` da go (WO-021); `guiFormThat` tu suy slug luc gui.
  nghe("f-1l", "input", () => {
    const o = G("f-dem");
    const v = G("f-1l").value;
    if (o) o.textContent = `${v.length}/160`;
  });
  nghe("f-khung", "click", async () => {
    try {
      const r = await fetch(goc() + "mau-nap-nguon.md");
      const chu = await r.text();
      // WO-037 · rai THANG vao cac o. Khong con textarea tho de ghi vao.
      const md2 = chu.includes("\n---\n")
        ? chu.split("\n---\n").slice(1).join("\n---\n").trim() + "\n" : chu;
      doThan(md2, "Bản mẫu không khớp khung.");
    } catch {
      bao(true, "Không tải được template.");
    }
  });
  // WO-028 · `veDuongGhi` ve mot dong "kb/<loai>/<slug>.md" vao the
  // `f-duong-v`. Ca the do LAN o `f-slug` deu da bi go o WO-021, nen ham nay
  // thoat ngay o dong dau va khong bao gio ve gi.

  form.addEventListener("keydown", (e) => {
    const k = e;
    if (k.key === "Enter" && (k.ctrlKey || k.metaKey)) {
      k.preventDefault();
      void guiForm(form);
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void guiForm(form);
  });
}
function ganFormChuDe() {
  nghe("f-catmoi-mo", "click", () => {
    const o = G("f-catmoi-o");
    if (o) o.hidden = !o.hidden;
  });
  nghe("f-catmoi-gui", "click", () => {
    void taoNhanhChuDe();
  });
}
async function taoNhanhChuDe() {
  const v = (id2) => G(id2)?.value.trim() ?? "";
  const id = v("f-catmoi-id");
  const r = await fetch("/api/categories", {
    method: "POST",
    headers: HJ,
    body: JSON.stringify({
      id,
      label_vi: v("f-catmoi-nhan"),
      gom: v("f-catmoi-gom"),
      xac_nhan: true
    })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const thieu = Array.isArray(d.thieu) ? " — " + d.thieu.join("; ") : "";
    return bao(true, String(d.loi ?? loiMa(r)) + thieu);
  }
  await napDanhMuc();
  const o = document.querySelector(`#f-cat input[value="${CSS.escape(id)}"]`);
  if (o) o.checked = true;
  for (const t of ["f-catmoi-id", "f-catmoi-nhan", "f-catmoi-gom"]) {
    const el = G(t);
    if (el) el.value = "";
  }
  const khu = G("f-catmoi-o");
  if (khu) khu.hidden = true;
  bao(false, `Đã thêm "${id}" và tích cho bài này`);
}
async function dienMau() {
  try {
    const r = await fetch("/mock/static/open-index.json");
    if (!r.ok) throw new Error("khong doc duoc");
    const ds = (await r.json()).articles;
    const ban = ds.flatMap((b) => b.bans).sort((a, c) => (c.than?.length ?? 0) - (a.than?.length ?? 0))[0];
    if (!ban?.than) throw new Error("khong co than bai");
    const dat = (id, gt) => {
      const el = G(id);
      if (el) el.value = gt;
    };
    dat("f-title", ban.title + " (mẫu — sửa lại)");
    dat("f-id", "src_" + Math.random().toString(36).slice(2, 10));
    dat("f-slug", boDau(ban.title).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) + "-mau");
    dat("f-type", ban.source_type);
    dat("f-url", "https://example.com/bai-mau");
    dat("f-cred", ban.credibility_max || "plausible");
    dat("f-1l", "Bài mẫu để xem khuôn — thay bằng một câu tóm tắt của bạn.");
    const o = G("f-1l");
    o?.dispatchEvent(new Event("input"));
    // WO-037 · bai mau rai THANG vao cac o; khong con textarea tho de ghi vao.
    if (!doThan(ban.than, "Bản mẫu không khớp khung — không đổ được vào form.")) return;
    bao(false, "Đã đổ một bài mẫu — sửa từng ô thành bài của bạn rồi ghi.");
  } catch {
    bao(true, "Không lấy được bài mẫu (cần bản /mock/ đã build).");
  }
}
async function guiForm(form) {
  const gt = (id) => G(id).value.trim();
  const chon = (id) => [...document.querySelectorAll(`#${id} input:checked`)].map((c) => c.value);
  const kq = G("f-kq");
  kq.hidden = false;
  kq.textContent = "Đang qua cổng validate…";
  const nutGui = G("f-gui");
  if (nutGui?.disabled) return;
  if (nutGui) {
    nutGui.disabled = true;
    nutGui.setAttribute("aria-busy", "true");
  }
  try {
    await guiFormThat(form, kq, gt, chon);
  } finally {
    if (nutGui) {
      nutGui.disabled = false;
      nutGui.removeAttribute("aria-busy");
    }
  }
}
async function guiFormThat(form, kq, gt, chon) {
  const fm = { ...FM_GOC ?? {} };
  Object.assign(fm, {
    /*
     * BON TRUONG MAY DIEN (WO-021).
     *
     * Nguoi dung go bon o khoi form — `Ma bai` · `Ten duong dan` ·
     * `Tin cay toi da` · `Muc day du` — vi *"ban chat ta tai bai viet len web
     * thi do chi la noi dung thoi"*.
     *
     * Nhung SCHEMA VAN DOI ca bon. Go o ma quen dien thi moi lan bam Ghi la
     * 422, va 422 do toi SAU khi nguoi dung go xong ca form. Cach dien giong
     * het duong tai lieu/video da lam tu truoc.
     *
     * `FM_GOC?.x ??` giu dia chi BAT BIEN khi SUA mot ban da co: doi `id` hay
     * `slug` qua PUT bi server tu choi (M08-R5), nen suy lai tu tieu de moi la
     * tu tao mot loi 400 khong ai doan duoc.
     */
    id: FM_GOC?.id ?? ("src_" + slugGoiY(gt("f-title") || gt("f-1l"))
      .replace(/-/g, "").padEnd(6, "0").slice(0, 12)),
    slug: FM_GOC?.slug ?? slugGoiY(gt("f-title") || gt("f-1l")),
    source_type: gt("f-type"),
    title: gt("f-title"),
    url: gt("f-url"),
    analyzed_at: gt("f-ngay"),
    one_liner: gt("f-1l"),
    credibility_max: FM_GOC?.credibility_max ?? "plausible",
    conformance: FM_GOC?.conformance ?? "B"
  });
  if (!FM_GOC) fm.protocol_version = "2.0";
  const cats = chon("f-cat");
  if (cats.length) fm.category = cats;
  else delete fm.category;
  const cpts = chon("f-cpt");
  if (cpts.length) fm.concepts = cpts;
  else delete fm.concepts;
  const moi = gt("f-cptmoi").split(",").map((s) => s.trim()).filter(Boolean);
  if (moi.length) fm.concepts_proposed = moi;
  else delete fm.concepts_proposed;
  const than = gomKhung();
  const sua = form.dataset.sua;
  const r = sua ? await fetch("/api/articles/" + sua, {
    method: "PUT",
    headers: { ...HJ, "if-match": form.dataset.etag ?? "" },
    body: JSON.stringify({ frontmatter: fm, body: than })
  }) : await fetch("/api/articles", {
    method: "POST",
    headers: HJ,
    body: JSON.stringify({ frontmatter: fm, body: than })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    kq.textContent = [d.loi, d.loi_validate].filter(Boolean).join("\n") || `Trượt (${r.status}).`;
    return;
  }
  kq.textContent = sua ? `Đã lưu ${sua} — trạng thái: ${d.review_status}` : `Đã vào kho: ${d.path} (draft)`;
  bao(false, kq.textContent);
  if (sua) {
    form.dataset.etag = d.etag;
  } else {
    datLaiForm();
  }
}
async function khoiDong() {
  try {
    const luu = localStorage.getItem("gn-theme");
    if (luu) {
      document.documentElement.setAttribute("data-theme", luu);
      document.documentElement.setAttribute("saved-theme", luu);
      const nut = G("tb");
      if (nut) nut.textContent = luu === "dark" ? "☀" : "☾";
    }
  } catch {
  }
  try {
    // Doc TRUOC khi ve: dat class sau khi trang da hien thi se cho ra mot cu
    // nhay rail — nguoi dung thay menu mo roi tu dong dong lai.
    datRail(localStorage.getItem("gn-rail") === "gon");
  } catch { }
  try {
    const lg = localStorage.getItem("gn-lang");
    apNgu(lg === "en" ? "en" : "vi");
  } catch {
    apNgu("vi");
  }
  const man = manTuUrl();
  if (man !== "home") doiView(man, false);
  docLocTuUrl();
  apLoc();
  hienPanel();
  ganNop();
  ganNapThuVien();
  ganForm();
  ganFormChuDe();
  ganManDanhMuc();
  void doTimApi();
  await nap();
  gan();
  // WO-045 · nối lại ngữ cảnh SỬA sau khi `doiView` đã điều hướng. Đặt cạnh
  // `data-moBai` vì cùng một khuôn: thứ phải sống qua một lần TẢI TRANG.
  noiLaiSua();
  const moBai = document.body.dataset.moBai;
  if (moBai && goc() === "/") {
    delete document.body.dataset.moBai;
    const bai = BAI.find((b) => b.bans?.some((x) => x.slug === moBai));
    if (bai) mo(bai);
    else bao(true, `Không tìm thấy bài \`${moBai}\` trong kho.`);
  }
}
/* ═══ T03-95 · KHỐI VIỆC trên Dashboard + BADGE rail ══════════════════════
 *
 * Ở BUNDLE CHUNG, không ở chunk `chungcat` — ngược `phạm_vi_ghi` của PM, và
 * lý do là phép đo, không phải sở thích:
 *   thẻ `<script>` chunk thêm vào HTML trang chủ  = +48 byte, mà nó dư **9**
 *   chunk cộng vào tổng tải đầu của `/`           = +8010 byte, mà nó dư **326**
 * `gn.js` nay dư **4123 byte** (sau `T03-104` dọn 3466) và khối này ~1512 ⇒
 * bundle chung là chỗ DUY NHẤT nó lọt. Ràng buộc thứ nhất KHÔNG đổi sau
 * T03-104: trang chủ vẫn chỉ dư **11 byte** HTML, mà một thẻ `<script>` tốn 48.
 * Badge còn một lý do riêng: rail nằm trên MỌI trang, nên mã badge thuộc bundle
 * mọi trang có — đặt trong chunk thì badge chỉ hiện ở một màn.
 *
 * BA ràng buộc byte quyết hình dạng khối này, không phải sở thích quyết
 * (đo 2026-09-04):
 *   trang chủ  61431 / 61440  ⇒ dư    9 byte ⇒ 0 byte HTML mới trong shell
 *   gn.css    102391 / 102400 ⇒ dư    9 byte ⇒ 0 luật CSS mới
 *   gn.js     100947 / 102400 ⇒ dư 1453 byte ⇒ JS đi theo CHUNK (T03-102)
 *
 * ⚠️ Con số PM ghi trong `T03-95` (*"gn.css 91380/102400, dư 11KB sau
 * T03-99"*) là **dự phóng, không phải phép đo**: `T03-99` CHƯA chạy — 8 luật
 * `.tb[data-nav]::before` còn nguyên trong `prototype.css`. Nên khối này viết
 * dưới trần THẬT, không dưới trần dự phóng.
 *
 * ⇒ Khối cắm vào `#kpi` — mốc ĐÃ CÓ của trang chủ — bằng ba ô `.kp` và một
 *   `.more`, đều là class đã có luật. Không thẻ mới trong shell, không class
 *   mới trong CSS.
 */
const ccDangChay = (v) => v.giai_doan === "cho" || v.giai_doan === "dang-chay";

function ccKhoiDongTrangChu() {
  const kpi = document.getElementById("kpi");
  if (!kpi || kpi.dataset.ccxong) return;
  // Không đợi `#kpi` được điền — chèn `beforeend` nên ba ô luôn ở CUỐI.
  kpi.dataset.ccxong = "1";
  void (async () => {
    let ds = [];
    try {
      const r = await fetch("/api/job?n=200");
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.loi ?? `dịch vụ trả ${r.status}`);
      ds = j.dong ?? [];
    } catch {
      // Dịch vụ chết ⇒ KHÔNG dựng ba ô. Ba số `0` trông y như "không có việc
      // nào", mà sự thật là "không hỏi được ai" — thà thiếu khối hơn nói sai.
      return;
    }
    const dung = ds.filter((v) => v.giai_doan === "dung").length;
    const o = [
      ["đang chạy", ds.filter(ccDangChay).length, ""],
      ["cần xử lý", dung, dung ? "warn" : ""],
      ["xong", ds.filter((v) => v.giai_doan === "xong").length, ""],
    ];
    // MỘT link, không một bảng: màn `/chung-cat/` là chỗ xem đủ. Lặp bảng chi
    // tiết ở trang chủ là hai chỗ hiển thị cùng một tập, và chỗ thứ hai sẽ lệch.
    /*
     * Nhãn "chưng cất" đi TRƯỚC ba ô. Không có nó, ba con số nằm dưới tiêu đề
     * panel **KHO** và người đọc sẽ hiểu "đang chạy 2" là 2 bản ghi kho — một
     * khối nói SAI vì chỗ đặt, dù mọi con số đều đúng.
     *
     * `.kp` với `.l` mà không `.v`: dùng lại class đã có, 0 byte CSS mới.
     */
    kpi.insertAdjacentHTML("beforeend",
      '<div class="kp"><div class="l">chưng cất</div></div>'
      + o.map(([l, v, c]) => `<div class="kp${c ? " " + c : ""}">`
        + `<div class="l">${l}</div><div class="v">${v}</div></div>`).join("")
      );
    kpi.insertAdjacentHTML("afterend",
      '<button class="more" data-nav="chungcat">mở màn Chưng cất</button>');
    ccBadge(dung);
  })();
}

/*
 * BADGE trên mục nav **Chưng cất** — đếm việc CẦN XỬ LÝ.
 *
 * `data-mount` + luật `[data-mount]:empty{display:none}` ĐÃ CÓ trong gn.css
 * (khuôn badge Kho, `FR-027g`): rỗng thì CSS tự ẩn, **0 nhánh điều kiện**. Hai
 * cơ chế cho một hành vi (CSS ẩn + JS `hidden`) là hai chỗ phải sửa, và chỗ
 * thứ hai sẽ lệch.
 *
 * Thẻ badge tạo bằng JS, không đặt trong shell: shell đi theo tám trang, và
 * trang chủ dư 9 byte.
 */
function ccBadge(so) {
  const nut = document.querySelector('[data-nav="chungcat"].tb');
  if (!nut) return;
  let b = nut.querySelector("[data-mount]");
  if (!b) {
    b = document.createElement("i");
    b.setAttribute("data-mount", "");
    nut.appendChild(b);
  }
  b.textContent = so > 0 ? String(so) : "";
}


const khiNav = () => {
  void khoiDong();
  ccKhoiDongTrangChu();     // T03-95 · khối ba số + badge, dựng lại mỗi lần đổi view
};
/*
 * CẦU công bố NGAY, không đợi ai mở cửa sổ đọc.
 *
 * Bản trước gán `__GN_MW__` một cách lười — bên trong `veTabChungCat` và
 * `moPhieuChungCat`, hai hàm chỉ chạy TRONG một cửa sổ đọc. Hệ quả đo được:
 * trên `/chung-cat/` (không có cửa sổ nào) `__GN_MW__` là `undefined`, nên bấm
 * một bản nháp báo *"chưa nạp được khung cửa sổ"* và không mở gì.
 *
 * Ở CUỐI file nên mọi `const`/`function` phía trên đã khởi tạo xong — đây là
 * chỗ duy nhất gán được mà không rơi vào TDZ.
 */
/*
 * MỘT NGUỒN cho nội dung cầu (`WO-062`).
 *
 * Có BA chỗ publish `__GN_MW__` — hai chỗ `??=` ở đầu file và chỗ này dùng `=`
 * (ghi đè, chạy cuối). Tôi thêm `md` vào hai chỗ đầu mà quên chỗ này, nên cầu
 * cuối cùng GHI ĐÈ mất `md` — chunk gọi `mw().md` nhận `undefined` và rơi về
 * chữ thô. Bundle có `md`, trình duyệt không: mất nửa buổi đổ cho cache.
 *
 * Ba bản của một danh sách là hai chỗ để quên. Nay danh sách nằm ở MỘT hàm.
 */
globalThis.__GN_MW__ = _cau();

document.addEventListener("nav", khiNav);
window.addEventListener("beforeunload", () => document.removeEventListener("nav", khiNav));
void khoiDong();
ccKhoiDongTrangChu();
