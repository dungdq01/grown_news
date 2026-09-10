/*
 * T03-102 · CHUNK RIÊNG cho màn `/chung-cat/` — tải CHỈ trên màn đó.
 *
 * VÌ SAO TÁCH (chủ dự án chọn lối (b) 2026-09-03)
 * `gn.js` là MỘT bundle cho MỌI màn, nên thêm một màn là thêm byte cho mọi
 * trang. Đo được: `gn.js` đã ở **102314 / 102400 — dư 86 byte** trước đợt này,
 * và T03-93 đẩy nó lên 106753 (vượt 4353). Trần đó tồn tại để giữ **đường tải
 * ĐẦU** nhẹ; mã của một màn mà người chưa mở thì không thuộc đường tải đầu của
 * họ. Tách là trả trần về đúng thứ nó đo, KHÔNG phải lách nó — và
 * `page-weight` đã đổi sang đo **tổng byte tải đầu của TỪNG trang** đúng vì
 * thế: tách mà tổng không giảm thì cổng vẫn đỏ.
 *
 * TỰ CHỨA. Chunk này KHÔNG dùng `esc2`/`bao` của multiwindow: cả hai sống
 * trong IIFE của file đó, không phải toàn cục. Nên nó khai lại hai helper nhỏ
 * (~200 byte) — cái giá của độc lập, và độc lập là điều kiện để tách có nghĩa:
 * một chunk phụ thuộc thứ tự nạp của chunk khác là một lỗi chờ xảy ra.
 *
 * Nguồn dữ liệu: `GET /api/job` + `GET /api/viec/<id>` của LÕI (T08-21).
 * KHÔNG gọi thẳng `:8790` — khoá dịch vụ ở env SERVER (`M12-R7` + `Z8`), nên
 * cả file này không chứa cổng đó ở đâu cả.
 */
/* Xuống dòng cho chuỗi hộp thoại — khai một chỗ. */
const NLC = String.fromCharCode(10)
const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/* Dùng lại class `.gn-bao` của gn.css — 0 byte CSS mới. */
function bao(loi, chu) {
  document.querySelector(".gn-bao")?.remove();
  const b = document.createElement("div");
  b.className = "gn-bao" + (loi ? " loi" : "");
  b.textContent = chu;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 6e3);
}

/*
 * BỐN bộ lọc, khai một bảng. Nhãn hiện ra là nhãn NGƯỜI đọc; giá trị gửi đi là
 * `giai_doan` của THỢ. Hai thứ khác nhau, nên chúng là hai cột — gộp là cách
 * một lần đổi nhãn làm vỡ phép lọc.
 */


/*
 * TRẠNG THÁI DUYỆT của một bản nháp — enum bốn giá trị, cưỡng chế ở DDL
 * (`CHECK`, T08-27). Khai theo ĐÚNG thứ tự vòng đời, không theo bảng chữ:
 * người đọc màn này đang theo dõi một dòng chảy, không tra từ điển.
 *
 * `M12-R2`: M12 KHÔNG chạm `trang_thai` — màn này chỉ ĐỌC và lọc.
 *
 * Khai Ở ĐÂY, trên `ccDungKhung`: nó dùng bảng này lúc DỰNG KHUNG, tức lúc
 * khởi động. Bản trước tôi để nó cạnh `CC_NHAP` (cuối file) và nhận
 * `ReferenceError: NH_LOC_DS is not defined` ngay khi mở màn — `const` ở tầng
 * module vẫn TDZ với mã chạy trước nó.
 */
const NH_LOC_DS = [
  { ma: "", nhan: "tất cả" },
  { ma: "nhap", nhan: "nháp" },
  { ma: "da_gui", nhan: "đã gửi duyệt" },
  { ma: "da_duyet", nhan: "đã duyệt" },
  { ma: "tra_lai", nhan: "trả lại" },
  { ma: "da_bo", nhan: "đã bỏ" },
];
let NH_LOC = "";

let CC_LOC = "";
let CC_DS = [];
let CC_HEN = null;

/*
 * BA trạng thái, không hai — `WO-048 §2` / chỉ đạo 2026-09-05.
 *
 * Bản cũ gọi `cho` là "đang chạy". Đo được: `cur/` có 13 việc, KPI nói *"ĐANG
 * CHẠY 6"*, và **không tiến trình nào** giữ việc nào — worker đã chết. Người
 * đọc màn kết luận "hệ đang làm việc" trong khi hệ đang đứng. Đó là con số nói
 * SAI, không phải con số chưa đẹp.
 *
 *   CHỜ      chưa ai chiếm, hoặc đã bỏ rơi   → `!dang_giu` và chưa kết thúc
 *   ĐANG CHẠY có worker đang giữ THẬT        → `dang_giu === true`
 *   XONG/DỪNG kết thúc                       → `giai_doan`
 *
 * `dang_giu` do THỢ tính từ lease (`vong.con_giu`), không do FE đoán: FE không
 * biết worker nào còn sống, và một phép đoán ở đây là đúng cái đã nói sai.
 */
const ccKetThuc = (v) => v.giai_doan === "xong" || v.giai_doan === "dung";
const ccDangChay = (v) => v.dang_giu === true && !ccKetThuc(v);
/* CHỜ gồm cả việc BỎ RƠI: với người dùng thì "chưa ai làm" và "có người nhận
 * rồi chết" là cùng một tình huống — việc của tôi chưa xong và chưa ai làm.
 * Phân biệt hai cái đó là việc của nhật ký, không của một con số KPI. */
const ccCho = (v) => !ccDangChay(v) && !ccKetThuc(v);

/*
 * KHUNG của màn dựng bằng JS, không nằm trong shell.
 *
 * Shell là MỘT file chứa MỌI view, và nó đi theo mọi trang — nên mỗi thẻ đặt
 * trong đó là byte trên đường tải đầu của cả bảy màn khác. Bản đầu của màn này
 * đặt cả bốn nút lọc + ba `<section>` vào shell và đẩy trang chủ lên
 * 62545/61440. Shell nay chỉ giữ một mốc rỗng; phần còn lại tới cùng chunk này.
 */
function ccDungKhung() {
  const view = document.getElementById("v-chungcat");
  if (!view || view.dataset.xong) return null;
  view.dataset.xong = "1";
  /*
   * Cả `<section class="pn rise">` cũng dựng ở đây, không đặt trong shell.
   * Lý do là một phép đo, không phải sở thích: trang chủ vượt trần **40 byte**
   * khi shell còn giữ thẻ đó — và shell đi theo cả tám màn, nên mọi thẻ trong
   * nó nhân với tám.
   */
  const goc = document.createElement("section");
  /*
   * `pn` KHÔNG kèm `rise`. Đo trên trình duyệt thật: `.rise` giữ
   * `opacity:0; transform:translateY(18px) scale(.985)` cho tới khi một
   * IntersectionObserver thêm class hiện — observer đó quét các panel CÓ SẴN
   * trong shell lúc khởi động. Một thẻ tạo bằng JS sau đó không ai quan sát,
   * nên nó nằm đúng chỗ, cao 813px, và **vô hình**.
   *
   * Đây là lớp lỗi không phép kiểm DOM nào bắt được: `innerHTML` có 3450 ký
   * tự, `getBoundingClientRect()` trả kích thước thật, `display: block` —
   * mọi thứ nói "có", chỉ `opacity` nói "không". Chỉ ẢNH CHỤP mới thấy.
   */
  goc.className = "pn";
  goc.id = "cc-goc";
  view.appendChild(goc);
  goc.innerHTML =
    '<div class="pn-h"><i class="dot"></i><h2>Chưng cất</h2><span class="ln"></span>'
    + '<span class="c" id="c-cc"></span></div>' 
    /* Dải NÓI THẬT khi không hỏi được dịch vụ — xem `ccNap()`. */
    + '<p class="al" id="cc-canh" hidden></p>'
    + '<div class="kpi" id="cckpi"></div>'
    /*
     * HAI TAB — chủ dự án: *"màn kết quả tách riêng tab, không để lộn vào màn
     * menu chưng cất"*. Tab TRONG màn, không phải một màn riêng: màn mới cần
     * một dòng `man-hinh.json` + markup trong shell, mà shell đi theo MỌI trang
     * và trần HTML trang chủ đang âm.
     */
    + '<div class="sortb cc-tabs" role="tablist">'
    + '<button type="button" role="tab" data-cctab="viec" aria-selected="true">'
    + 'Hàng việc</button>'
    + '<button type="button" role="tab" data-cctab="ketqua" aria-selected="false">'
    + 'Kết quả</button>'
    /* WO-070 · TAB THỨ BA. Việc hỏng vào ngăn `rac/` (WO-068) nên nó rời khỏi
       danh sách chính — không có tab này thì nó biến mất khỏi MỌI màn, và
       nút "chạy lại" của WO-067 thành một đường không ai tới được. */
    + '<button type="button" role="tab" data-cctab="rac" aria-selected="false">'
    + 'Thùng rác <span class="c" id="c-rac"></span></button></div>'
    + '<div id="pn-viec">'
    /*
     * WO-086 / SCR-26 · KHÔNG hàng nút nào.
     *
     * Trạng thái đọc bằng MÀU của chặng; thời gian đọc bằng MỐC NGÀY; bài gốc
     * chính là cái hàng. Ba chiều vào hết bố cục, nên thanh lọc không còn lý
     * do tồn tại. Lọc trạng thái vẫn làm được — qua ba số tổng kết ở `ccKpi`.
     */
    + '<div class="pn-h"><h2>Mọi việc</h2><span class="ln"></span></div>'
    + '<div class="grid" id="g-cc"></div><p class="empty" id="rong-cc" hidden></p>'
    + "</div>"
    /*
     * KẾT QUẢ — chỗ trả lời câu *"xong rồi thì kết quả ở đâu?"*.
     *
     * Đặt ở CHÍNH màn này, không phải một màn `/chung-cat/nhap/` riêng: chủ dự
     * án nói thẳng *"đáng ra nó phải ở màn /chung-cat/ chứ"*. Và một màn mới
     * cần một dòng `man-hinh.json` + markup trong shell — mà shell đi theo MỌI
     * trang, còn trần HTML trang chủ đang âm.
     */
    + '<div id="pn-ketqua" hidden>'
    + '<div class="pn-h"><h2>Bản nháp</h2><span class="ln"></span>'
    + '<span class="sortb" role="group" aria-label="Lọc trạng thái duyệt">'
    + NH_LOC_DS.map((x) => '<button type="button" data-nhlc="' + esc(x.ma)
      + '" aria-pressed="' + (x.ma === NH_LOC) + '">' + esc(x.nhan)
      + "</button>").join("")
    + '</span><span class="c" id="c-nhap"></span></div>'
    + '<div class="bc" id="cc-bochung"></div>'
    + '<div id="g-nhap"></div><p class="empty" id="rong-nhap" hidden></p>'
    + "</div>"
    /* THÙNG RÁC — việc HỎNG, giữ nguyên tiến độ, chạy lại hoặc xoá hẳn. */
    + '<div id="pn-rac" hidden>'
    + '<div class="pn-h"><h2>Việc hỏng</h2><span class="ln"></span></div>'
    + '<p class="ld">Việc hỏng nằm đây thay vì mất hẳn: phần đã phiên âm vẫn'
    + ' giữ, nên chạy lại là chạy TIẾP, không từ đầu.</p>'
    + '<div id="g-rac"></div><p class="empty" id="rong-rac" hidden></p>'
    + "</div>";
  /*
   * WO-048 · CHI TIẾT VIỆC là panel NỔI, ngoài luồng, ngoài `#cc-goc`.
   *
   * Bản cũ đặt nó là một khối cuối lưới. Ba chỗ đo được là hỏng, không phải
   * chuyện thẩm mỹ: mở một việc ĐẨY TRANG DÀI THÊM (mất chỗ đang đứng) · với
   * nhiều việc thì thẻ ở đầu trang còn chi tiết ở dưới màn hình (hai thứ của
   * một việc không thấy cùng lúc) · mỗi lần mở là MỘT request kể cả khi chỉ
   * muốn nhìn qua.
   *
   * Gắn vào `<body>`, KHÔNG vào `#cc-goc`: `position: fixed` bị một cha có
   * `transform`/`filter` biến thành neo mới, và `.pn` của trang này có
   * `transform` trong hiệu ứng `rise`. Đó là lớp lỗi chỉ ảnh chụp thấy — panel
   * nằm đúng toạ độ tính ra, nhưng so với một gốc khác.
   */
  if (!document.getElementById("cc-hv")) {
    const hv = document.createElement("div");
    hv.id = "cc-hv";
    ccCss();

    hv.hidden = true;
    document.body.appendChild(hv);
  }
  return goc;
}

/*
 * Việc CŨ = cùng `loai`+`slug`, có một việc `xong` MỚI HƠN.
 *
 * Tính TRONG danh sách việc, không hỏi kho: kho đã dọn bản cũ vào thùng rác
 * nên hỏi nó chỉ ra "không thấy", mà "không thấy" còn có nghĩa *chưa duyệt
 * bao giờ*. Hai nghĩa một câu trả lời là chỗ đoán sai.
 *
 * Cùng một phép với `cctab` — hai màn nói cùng một sự thật thì phải tính nó
 * bằng cùng một phép, không thì có ngày chúng nói khác nhau.
 */
/*
 * Bản nháp nào CÒN SỐNG?
 *
 * Chủ dự án 2026-09-07: *"1 video nhưng tồn tại 2"*. Đo trên máy thật: việc
 * `75b5157b` mang `nhap_id = e3be6337`, và
 * `GET /api/nhap-chung-cat/e3be6337` trả `{"loi":"không có nháp …"}` — nháp
 * ấy đã bị `donNhapCu` dọn. Nhưng dòng việc VẪN mời *"xem bản nháp ›"*.
 *
 * Gạch đỏ nói *bản này cũ*; nút bấm được nói *vẫn xem được*. Hai câu trái
 * nhau trên cùng một dòng, và người tin câu nào cũng có lý — đúng MỤC CHẾT mà
 * `SCR-21` xếp là lối TỆ NHẤT.
 *
 * Hỏi DANH SÁCH một lần (`GET /api/nhap-chung-cat`), không hỏi từng nháp: n
 * dòng thì n lời gọi, và mỗi lời gọi trả 404 vẫn là một lời gọi.
 */
async function nhapConSong() {
  try {
    const r = await fetch("/api/nhap-chung-cat");
    if (!r.ok) return null;            // không biết ⇒ KHÔNG đoán, giữ nguyên nút
    const j = await r.json();
    const ds = Array.isArray(j) ? j : (j.dong ?? j.ds ?? []);
    return new Set(ds
      .filter((x) => x.trang_thai !== "da_bo")
      .map((x) => String(x.job_ulid ?? x.ulid ?? "")));
  } catch { return null; }
}

let NHAP_CON = null;

/*
 * MỘT bảng chữ cho `loai` việc.
 *
 * Chủ dự án 2026-09-07 nhìn hai thẻ cùng nguồn và hỏi *"sao vẫn tồn tại 2
 * bản?"*. Chúng KHÔNG phải hai bản: một là `chung-cat-mot-nguon` (sinh bản
 * nháp để duyệt), một là `sinh-transcript` (sinh `.vtt` gắn thẳng vào bản
 * ghi). Hai việc khác hẳn nhau — mà thẻ chỉ hiện `slug` + tên model, nên
 * chúng trông y hệt nhau.
 *
 * Đây không phải lỗi của người đọc. Một màn bày hai việc khác loại bằng cùng
 * một hình dạng là màn đang giấu chiều thông tin quan trọng nhất.
 *
 * Loại LẠ rơi về chính chuỗi enum: một loại việc mới ra đời không được làm
 * thẻ trống chữ.
 */
/*
 * DẤU + MÀU cho từng loại việc.
 *
 * Chủ dự án 2026-09-07: *"phải đổi màu sắc hoặc đánh dấu gì đó để tôi phân
 * biệt chứ?"*. Chữ bắt người ĐỌC; màu cho người THẤY.
 *
 * MÀU LÀ KÊNH THỨ HAI, không phải kênh duy nhất — cùng luật `SCR-20`: ~8%
 * đàn ông không phân biệt đỏ–xanh, và một hệ chỉ-màu nói với họ rằng hai thẻ
 * giống nhau. Nên mỗi loại có một DẤU riêng đi kèm.
 */
const DAU_LOAI = {
  "chung-cat-mot-nguon": "\u2697",   // ⚗ bình chưng cất
  "sinh-transcript": "\u266B",       // ♫ âm thanh → chữ
  "tai-video": "\u2B07",             // ⬇ tải về
  "tong-hop": "\u2211",              // ∑ gộp nhiều nguồn
};
const MAU_LOAI = {
  "chung-cat-mot-nguon": "var(--vl-chungcat)",
  "sinh-transcript": "var(--vl-transcript)",
  "tai-video": "var(--vl-taivideo)",
  "tong-hop": "var(--vl-chungcat)",
};
const dauLoai = (l) => DAU_LOAI[String(l)] ?? "\u25CF";
const mauLoai = (l) => MAU_LOAI[String(l)] ?? "var(--ink-3)";

const NHAN_LOAI = {
  "chung-cat-mot-nguon": "CHƯNG CẤT",
  "sinh-transcript": "TRANSCRIPT",
  "tai-video": "TẢI VIDEO",
  "tong-hop": "TỔNG HỢP",
};
const tenLoai = (l) => NHAN_LOAI[String(l)] ?? String(l ?? "—");

function danhDauCu(ds) {
  const moiNhat = new Map();
  for (const v of ds) {
    const pl = v.payload || {};
    if (v.giai_doan !== "xong" || !pl.slug) continue;
    const kh = String(pl.loai) + "|" + String(pl.slug);
    const c = moiNhat.get(kh);
    if (!c || Number(v.nhan_luc || 0) > Number(c.nhan_luc || 0)) moiNhat.set(kh, v);
  }
  const cu = new Set();
  for (const v of ds) {
    const pl = v.payload || {};
    if (v.giai_doan !== "xong" || !pl.slug) continue;
    if (moiNhat.get(String(pl.loai) + "|" + String(pl.slug)) !== v) cu.add(v);
  }
  return cu;
}

/* ═══ WO-080 · CHUỖI NỐI TIẾP — hiện rõ trên thẻ ═══════════════════════
 *
 * Chủ dự án 2026-09-09: *"phải hiển thị rõ trên UI — để còn biết hỏng tại đâu,
 * chạy lại từ đâu ra sao"*. Ba câu, ba mảnh:
 *
 *   hỏng tại đâu?   thẻ rác: chặng + lý do (đã có) + `tiến tới mm:ss` (MỚI)
 *   chạy lại từ đâu? thẻ việc kế: `nối tiếp từ mm:ss`
 *   ra sao?          cả hai: `nối tiếp n/N` + 10 ký tự đầu của ULID kia
 *
 * Không dựng component mới: dùng `.mt` và `.ld` — hai class thẻ đã có.
 */
function ccGiay(g) {
  const n = Math.max(0, Math.floor(Number(g) || 0));
  return String(Math.floor(n / 60)).padStart(2, "0") + ":"
    + String(n % 60).padStart(2, "0");
}

/** Dải "nối tiếp n/N từ <ulid>" — rỗng nếu việc này không thuộc chuỗi nào. */
function ccDaiChuoi(v) {
  const lan = Number(v?.payload?.lan_noi_tiep || 0);
  if (!lan) return "";
  const tu = String(v?.payload?.noi_tiep_tu ?? "");
  const giay = Number(v?.payload?.tiep_tu_giay || 0);
  return '<div class="mt"><b class="vc-loai" style="--vl:var(--brand)">↻ nối tiếp '
    + lan + "</b><span>từ " + ccGiay(giay)
    + (tu ? " · việc " + esc(tu.slice(0, 10)) : "") + "</span></div>";
}

/*
 * WO-085 · GỘP VIỆC THEO BÀI GỐC.
 *
 * Chủ dự án 2026-09-10: *"tôi cần biết bài chưng cất, transcript đó thuộc bài
 * gốc nào?"*. Ảnh chụp: năm thẻ đầu đều là một video, nằm rải, và slug trên
 * thẻ bị cắt cụt giữa chừng.
 *
 * `tenBai` truyền VÀO chứ không gọi thẳng: hàm này thuần, nên cổng chạy được
 * nó mà không cần cầu `__GN_MW__` lẫn DOM.
 *
 * XẾP THEO VIỆC MỚI NHẤT trong nhóm, không theo tên bài: sắp theo tên thì một
 * bài vừa chạy xong có thể nằm cuối màn chỉ vì nó bắt đầu bằng chữ "v".
 */
function ccNhom(ds, tenBai) {
  const theo = /* @__PURE__ */ new Map();
  for (const v of ds ?? []) {
    const slug = String(v?.payload?.slug ?? "");
    let g = theo.get(slug);
    if (!g) {
      /*
       * LÙI VỀ SLUG khi tra trượt. Bản ghi bị xoá, bị đổi slug, hay chỉ mục
       * chưa nạp xong đều là ca THƯỜNG. Để trống đầu khối — hay tệ hơn, bỏ cả
       * khối — là cắt đường tới một việc đang chạy.
       */
      g = { slug, ten: String(tenBai?.(slug) || "") || slug, viec: [], moi: "" };
      theo.set(slug, g);
    }
    g.viec.push(v);
    const t = String(v?.tao_luc ?? "");
    if (t > g.moi) g.moi = t;
  }
  const ra = [...theo.values()];
  for (const g of ra) g.viec.sort((a, b) => String(b.tao_luc ?? "").localeCompare(String(a.tao_luc ?? "")));
  ra.sort((a, b) => b.moi.localeCompare(a.moi));
  return ra;
}


/*
 * WO-092 · Phép lọc hai lớp việc DỜI LÊN CẦU (`__GN_MW__`) — chunk `cctab`
 * cũng cần nó, và chép sang đó là hai bản sẽ lệch. Ở đây chỉ còn hai vỏ mỏng.
 *
 * Cầu vắng ⇒ coi MỌI việc là của người: thà hiện thừa còn hơn giấu mất một
 * việc đang chạy.
 */
const ccViecNguoi = (v) => globalThis.__GN_MW__?.viecNguoi?.(v) ?? true;
const ccVatHong = (v) => globalThis.__GN_MW__?.vatHong?.(v) ?? false;

/*
 * WO-088 / SCR-26 §5.3a · Mỗi cặp `(slug, loai)` chỉ giữ lần chạy MỚI NHẤT.
 *
 * Chủ dự án: *"chỉ hiển thị các bài cuối thôi … đã bỏ / lỗi / loại thì để hết
 * ở thùng rác, ko hiển thị lên hàng này"*. Đo được: 25 việc / 15 cặp, và
 * `ecomerce-skill-claude` một mình có BỐN lần chạy transcript đứng thành bốn
 * thẻ.
 *
 * Chọn theo `tao_luc`, KHÔNG theo trạng thái. Một `xong` cũ cạnh một
 * `đang chạy` mới mà ưu tiên `xong` thì màn báo "xong" trong lúc máy đang
 * chạy — sai theo cách người tin ngay và không nghi ngờ.
 *
 * Lần chạy bị thay thế không biến mất khỏi hệ: nó ở tab `Kết quả` và thùng
 * rác. Cái bị bỏ khỏi Hàng việc là LỊCH SỬ, không phải trạng thái hiện thời.
 */
function ccBanCuoi(ds) {
  const giu = /* @__PURE__ */ new Map();
  for (const v of ds ?? []) {
    const k = String(v?.payload?.slug ?? "") + "::" + String(v?.payload?.loai ?? "");
    const cu = giu.get(k);
    if (!cu || String(v?.tao_luc ?? "") > String(cu.tao_luc ?? "")) giu.set(k, v);
  }
  return [...giu.values()];
}

/*
 * WO-086 / SCR-26-C · MỐC NGÀY làm tiêu đề nhóm.
 *
 * Thay cho chip `hôm nay · 7 ngày · 30 ngày`: cuộn tới đâu là biết ngày tới
 * đó, nên chiều thời gian nằm trong BỐ CỤC chứ không trên thanh lọc.
 *
 * `bayGio` truyền VÀO, không gọi `Date.now()` bên trong: một hàm đọc đồng hồ
 * là một hàm cổng không neo được — nó đổi kết quả theo giờ chạy, và sẽ đỏ lúc
 * nửa đêm mà không ai hiểu vì sao.
 */
function ccTheoNgay(nhom, bayGio) {
  const ngay0 = (ms) => {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  const nay = ngay0(bayGio);
  const ra = [];
  let cuoi = null;
  for (const g of nhom ?? []) {
    const t = Date.parse(String(g?.moi ?? ""));
    const d = Number.isFinite(t) ? ngay0(t) : null;
    if (cuoi === null || d !== cuoi) {
      const lech = d === null ? null : Math.round((nay - d) / 86400000);
      const nhan = d === null ? "không rõ ngày"
        : lech <= 0 ? "Hôm nay"
          : lech === 1 ? "Hôm qua"
            : new Date(d).toISOString().slice(5, 10);
      ra.push({ nhan, ngay: d, nhom: [] });
      cuoi = d;
    }
    ra[ra.length - 1].nhom.push(g);
  }
  return ra;
}

/*
 * Loại nguồn rút từ slug (`video/…` · `tai-lieu/…` · `article/…`) để bìa lấy
 * đúng lớp màu của `SCR-25`. Rút từ slug chứ không thêm một trường mới: slug
 * đã mang tiền tố ấy, và một trường thứ hai là một chỗ để lệch.
 */
/*
 * WO-089 · LOẠI NGUỒN của một bản ghi — khoá tra icon (`[data-i=…]`).
 *
 * Chủ dự án 2026-09-10: *"icon … dùng luôn icon của loại nguồn tương ứng"*.
 * `WO-086` đặt `data-i` bằng TIỀN TỐ SLUG (`video`), mà bảng icon
 * (`prototype.css:939+`) khai theo LOẠI NGUỒN (`youtube` · `pdf` · …) — nên ô
 * bìa trống trơn.
 *
 * Ở CHUNK này, không ở `gn.js`: chỉ màn `/chung-cat/` cần nó, và đo được đặt
 * vào bundle chung thì `gn.js` vượt trần 279 byte. Cầu chỉ đưa DỮ LIỆU sang
 * (`banTheoSlug` + `mediaBang`), phép suy nằm cùng màn dùng nó.
 *
 * THUẦN, `MB` truyền vào: cổng chạy được mà không cần DOM lẫn chỉ mục đã nạp.
 *
 * ── Vì sao KHÔNG dùng `idVideo` ────────────────────────────────────────────
 * Nó trả `null` khi `id_tu` không khớp, nên một URL youtube lạ dạng (playlist,
 * shorts chưa khai) mất icon dù host đúng rành rành. Icon nói NGUỒN, không nói
 * *"đã bóc được id hay chưa"* — khớp HOST tách hẳn khỏi phép bóc id.
 */
function nhanTuBan(ban, MB) {
  if (!ban) return "";
  const loai = String(ban.source_type ?? "");
  if (loai === "tai-lieu") {
    const hv = Array.isArray(ban.media) ? ban.media[0] : ban.media;
    const l = (MB?.loai ?? []).find((x) => x.mime === hv?.mime);
    return l?.duoi ? String(l.duoi).replace(/^\./, "") : loai;
  }
  const u = String(ban.url_normalized ?? "").toLowerCase();
  for (const h of MB?.video_host ?? []) {
    const m = String(h?.mien ?? "");
    if (m && (u === m || u.startsWith(m + "/") || u.startsWith(m + "?"))) {
      return String(h.nhan ?? loai);
    }
  }
  return loai;
}

/** Tra `slug` qua cầu rồi suy nhãn. Cầu vắng ⇒ "" và bên gọi tự lùi. */
function nhanNguon(slug) {
  const c = globalThis.__GN_MW__;
  return c?.banTheoSlug ? nhanTuBan(c.banTheoSlug(slug), c.mediaBang?.()) : "";
}

function ccLoaiNguon(slug) {
  return String(slug ?? "").split("/")[0] || "khac";
}

/*
 * WO-086 / SCR-26-A · Trạng thái một CHẶNG, đọc từ `giai_doan` của chính việc.
 *
 * Bốn lớp, bốn màu — cả điểm của hướng A là trạng thái đọc được bằng MẮT, nên
 * gán cứng một lớp ở đây là biến dải ống thành trang trí.
 */
function ccChangLop(v) {
  const gd = String(v?.giai_doan ?? "");
  if (gd === "xong") return "xong";
  if (gd === "dung" || gd === "hong") return "hong";
  if (gd === "cho" || gd === "") return "trong";
  return "chay";
}

function ccThe(v, laCu) {
  const gd = String(v.giai_doan ?? "?");
  /*
   * `st-*` là class ĐÃ CÓ của `.cd` (viền trên đổi màu). Dùng đúng ba tên mà
   * CSS biết: `dung` → `st-rejected` (đỏ) · `xong` → `st-approved` (xanh) ·
   * còn lại `st-draft`. Đặt tên mới ở đây là đặt một class không có luật, và
   * `markup-matches-css` bắt đúng chỗ đó.
   */
  const st = gd === "dung" ? "st-rejected" : gd === "xong" ? "st-approved" : "st-draft";
  /*
   * Màu nhãn qua style INLINE, đúng khuôn thẻ kho (`background:var(--c-<loại>)`)
   * — 0 byte CSS mới. Không có nền thì chữ nhãn mờ gần như vô hình: đo được
   * trên ảnh chụp thật, không suy ra từ mã.
   */
  const mau = gd === "dung" ? "var(--warn)" : gd === "xong" ? "var(--ok)" : "var(--ink-3)";
  /*
   * Thẻ `xong` mang `data-ccnhap` ⇒ bấm là mở THẲNG bản chưng cất, không phải
   * mở panel rồi tìm tiếp. `?nhap=` cũng vào URL để chia sẻ được.
   *
   * `ket_qua.nhap_id` do worker ghi (`WO-052`). Việc cũ không có ⇒ giữ hành vi
   * cũ (mở panel chi tiết) thay vì đoán theo slug: đoán sai là mở nhầm bản của
   * một lần chạy khác.
   */
  /*
   * Thẻ của một việc CŨ gạch đỏ — cùng dấu hiệu với dòng trong tab Chưng cất
   * và với bài bị loại ở lưới kho.
   *
   * Chủ dự án 2026-09-07: nhìn màn `/chung-cat/` thấy BỐN thẻ xanh y hệt nhau
   * trong khi tab bên kia đã gạch. Cùng một sự thật hiện ở hai màn thì phải
   * hiện GIỐNG NHAU, không thì người phải nhớ màn nào nói thật.
   */
  const cu = laCu ? " cct-cu" : "";
  const nhapId = v.ket_qua?.nhap_id;
  // Nháp đã dọn ⇒ KHÔNG mở thẻ bằng `data-ccnhap`: nó sẽ ra "không có nháp".
  const nhapCon = !NHAP_CON || (nhapId && NHAP_CON.has(String(nhapId)));
  /* Việc TRANSCRIPT không có nháp — sản phẩm của nó là `.vtt` gắn thẳng vào
     bản ghi. Trước đợt này thẻ ấy không mở được gì (chủ dự án bắt đúng); nay
     nó mở CÙNG cửa sổ transcript mà tab dùng — một đường, không hai. */
  if (gd === "xong" && String(v.payload?.loai) === "sinh-transcript") {
    return `<button type="button" class="cc-chang ${ccChangLop(v)}${cu}"`
      + ` data-cctr="${esc(String(v.payload?.slug ?? ""))}"`
      + ` data-gd="${esc(gd)}" title="xem transcript">`
      + `<b class="vc-loai" style="--vl:${mauLoai(v.payload?.loai)}">`
      + `${dauLoai(v.payload?.loai)}</b> ${esc(tenLoai(v.payload?.loai))}`
      + "</button>";
  }
  if (gd === "xong" && nhapId && nhapCon) {
    return `<button type="button" class="cc-chang ${ccChangLop(v)}${cu}"`
      + ` data-ccnhap="${esc(nhapId)}" data-gd="${esc(gd)}"`
      + ` title="mở bản chưng cất · ${esc(v.payload?.model ?? v.model ?? "—")}`
      + ` · gửi ${Number(v.lan_gui ?? 0)}/2">`
      + `<b class="vc-loai" style="--vl:${mauLoai(v.payload?.loai)}">`
      + `${dauLoai(v.payload?.loai)}</b> ${esc(tenLoai(v.payload?.loai))}`
      + "</button>";
  }
  /*
   * WO-086 · Chặng thường. Model + số lần gửi + chuỗi nối tiếp xuống `title`:
   * chúng là chi tiết của MỘT việc, mà dòng bài phải đọc được ở tầm liếc. Ai
   * cần chi tiết thì bấm — chặng vẫn mở đúng việc ấy qua `data-ccmo`.
   */
  return `<button type="button" class="cc-chang ${ccChangLop(v)}${cu}"`
    + ` data-ccmo="${esc(v.ulid)}" data-gd="${esc(gd)}"`
    + ` title="${esc(gd)} · ${esc(v.payload?.model ?? v.model ?? "—")}`
    + ` · gửi ${Number(v.lan_gui ?? 0)}/2">`
    + `<b class="vc-loai" style="--vl:${mauLoai(v.payload?.loai)}">${dauLoai(v.payload?.loai)}</b>`
    + ` ${esc(tenLoai(v.payload?.loai))}`
    + "</button>";
}

/*
 * BIỂU ĐỒ, không phải năm ô số.
 *
 * Chỉ đạo 2026-09-05: *"Bảng summary ở bên trên cần là biểu đồ, animation. Không
 * phải summary theo con số trông không đẹp"*.
 *
 * Chọn THANH XẾP LỚP (một thanh, bốn đoạn) chứ không donut/sparkline:
 *   · câu hỏi thật của màn này là *"bao nhiêu phần hàng đợi đang chạy / còn
 *     chờ / đã xong"* — một TỈ LỆ của một tổng, và thanh xếp lớp là hình đúng
 *     cho tỉ lệ của một tổng;
 *   · donut cần nhãn dẫn ra ngoài hoặc chú giải rời, tốn chỗ ngang mà màn này
 *     đang cần cho lưới thẻ bên dưới;
 *   · sparkline cần CHUỖI THỜI GIAN, và `/api/job` trả trạng thái HIỆN TẠI —
 *     vẽ một đường từ dữ liệu không có trục thời gian là vẽ một con số bịa.
 *
 * Bề rộng đoạn đặt bằng `transform:scaleX()`, KHÔNG bằng `width`: `width` là
 * thuộc tính LAYOUT, animate nó là reflow mỗi frame và `AC6` cấm.
 */
const CC_LOP = [
  ["chay", "đang chạy", "var(--brand)"],
  ["cho", "chờ", "var(--ink-3)"],
  ["dung", "cần xử lý", "var(--warn)"],
  ["xong", "xong", "var(--ok)"],
];

/*
 * DANH SÁCH BẢN NHÁP — kết quả của những việc đã xong.
 *
 * Hai link mỗi dòng, và cả hai đều là câu trả lời cho một câu hỏi thật:
 *   "xem bản nháp"  → nội dung model sinh ra, mở ngay trong panel nổi
 *   "bài gốc"       → bản ghi ĐÃ CHƯNG CẤT, để đối chiếu
 *
 * `nguon` tới từ frontmatter của chính bản nháp (`tomTatNhap` phía server), nên
 * link trỏ đúng bản ghi mà model đã đọc — không phải một phép đoán từ tên.
 */
let CC_NHAP = [];
/* `CC_DS` = CẢ hàng đợi (tổng kết đọc nó) · `CC_HIEN` = phần đang xem (lưới
 * đọc nó). Hai biến chứ không một: gộp lại là tổng kết đổi theo bộ lọc, đúng
 * lỗi trên ảnh chụp. */
let CC_HIEN = [];

/* Nhóm của một việc cho BỘ LỌC — cùng phép phân loại với tổng kết, không phải
 * `giai_doan` trần. Lọc theo `giai_doan` thì nút `chờ` bỏ sót việc bỏ rơi (nó
 * mang `dang-goi-model`), và hai chỗ phân loại khác nhau là hai chỗ để lệch. */
function nhomLoc(v) {
  if (v.giai_doan === "xong") return "xong";
  if (v.giai_doan === "dung") return "dung";
  /* WO-070 · `hong` TƯỜNG MINH. Không có nhánh này nó rơi về `"cho"` — hôm nay
     vô hại vì việc hỏng nằm trong `rac/` và `GET /api/job` không kể rác, nhưng
     đó là vô hại DO HOÀN CẢNH, không do thiết kế. */
  if (v.giai_doan === "hong") return "hong";
  return ccDangChay(v) ? "dang-chay" : "cho";
}

/*
 * Đổi tab: ẩn/hiện hai khối, và ĐỌC LẠI khối vừa hiện.
 *
 * Đọc lại chứ không tin bản đã vẽ: hàng đợi đổi trong lúc người xem tab kia,
 * và một danh sách cũ hiện ra như mới là cách người dùng tin vào một trạng thái
 * đã hết đúng.
 */
function ccDoiTab(ten) {
  for (const b of document.querySelectorAll("[data-cctab]")) {
    b.setAttribute("aria-selected", String(b.dataset.cctab === ten));
  }
  const viec = document.getElementById("pn-viec");
  const kq = document.getElementById("pn-ketqua");
  const rc = document.getElementById("pn-rac");
  if (viec) viec.hidden = ten !== "viec";
  if (kq) kq.hidden = ten !== "ketqua";
  if (rc) rc.hidden = ten !== "rac";
  if (ten === "ketqua") void ccNapNhap();
  else if (ten === "rac") void ccNapRac();
  else void ccNap();
}

async function ccNapNhap() {
  const o = document.getElementById("g-nhap");
  const rong = document.getElementById("rong-nhap");
  const dem = document.getElementById("c-nhap");
  if (!o) return;
  try {
    /*
     * WO-090 · `gom_da_bo=1` — tab này là LỊCH SỬ, không phải hàng đợi việc.
     *
     * Trước đợt này nó gọi cửa TRẦN, mà cửa mặc định lược `da_bo` (cố ý, để
     * bảo vệ hàng đợi việc của `T03-94`). Hệ quả đo được: chip `tất cả` hiện 3
     * trong khi DB có 8, và chip `đã bỏ` hiện 0 vĩnh viễn — nó lọc client trên
     * một tập đã bị server lọc.
     *
     * `n=200` là trần của cửa: tab lịch sử phải thấy hết, không cắt ở 50.
     */
    const r = await fetch("/api/nhap-chung-cat?n=200&gom_da_bo=1");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? ("dịch vụ trả " + r.status));
    CC_NHAP = j.dong ?? [];
  } catch (e) {
    o.innerHTML = '<p class="al">' + esc(String(e.message ?? e)) + "</p>";
    return;
  }
  const hien = NH_LOC
    ? CC_NHAP.filter((v) => v.trang_thai === NH_LOC) : CC_NHAP;
  /*
   * T03-112 AC4 · BỐN SỐ TÁCH, không gộp.
   *
   * Gộp `nháp + đã sửa + trả lại + đã vào kho` thành một con số *"N bản nháp"*
   * là câu trả lời cho một câu hỏi không ai hỏi: người vào đây để biết *còn
   * bao nhiêu việc phải làm*, và ba trong bốn nhóm đó KHÔNG phải việc phải làm.
   *
   * Đếm trên `CC_NHAP` (toàn bộ), không trên `hien` (đã lọc) — cùng bài học
   * `WO-053`: một tổng kết đổi theo bộ lọc thì không phải tổng kết.
   */
  const bd = document.getElementById("cc-bochung");
  if (bd) {
    const d4 = {
      nhap: 0, da_gui: 0, tra_lai: 0, da_duyet: 0, da_bo: 0,
    };
    for (const v of CC_NHAP) {
      if (v.trang_thai in d4) d4[v.trang_thai] += 1;
    }
    bd.innerHTML = [
      ["nháp", d4.nhap, "nhap"],
      ["đã gửi duyệt", d4.da_gui, "da_gui"],
      ["trả lại", d4.tra_lai, "tra_lai"],
      ["đã vào kho", d4.da_duyet, "da_duyet"],
    ].map(([nhan, so, ma]) =>
      '<button type="button" class="bc-o" data-nhlc="' + esc(ma) + '">'
      + '<span class="bc-s">' + so + "</span>"
      + '<span class="bc-n">' + esc(nhan) + "</span></button>").join("")
      + '<a class="bt ghost sm bc-l" href="/chung-cat/nhap/">mở hàng nháp &rsaquo;</a>';
  }
  if (dem) {
    dem.textContent = hien.length === CC_NHAP.length
      ? CC_NHAP.length + " bản nháp"
      : hien.length + "/" + CC_NHAP.length + " bản nháp";
  }
  if (rong) {
    rong.hidden = hien.length > 0;
    // Hai câu KHÁC nhau: "chưa có gì" và "bộ lọc không khớp gì" dẫn tới hai
    // hành động khác nhau, và một câu chung cho cả hai làm người bấm đi sai.
    rong.textContent = CC_NHAP.length
      ? "Không bản nháp nào ở trạng thái này."
      : "Chưa có bản nháp nào. Chưng cất một bản ghi để tạo.";
  }
  /*
   * WO-090 / SCR-26 · Vẽ THEO CÙNG BỘ HÌNH với tab Hàng việc.
   *
   * Trước đợt này đây là một `<ul>` phẳng — tab thứ hai của cùng một màn nói
   * một ngôn ngữ hình khác, tức hai thứ người phải học cho một việc.
   *
   * Khác Hàng việc ĐÚNG MỘT điều: KHÔNG gọi `ccBanCuoi`. Tab này là LỊCH SỬ,
   * nên mọi bản đều hiện — kể cả bản đã bị thay thế. Gộp về bản cuối ở đây là
   * giấu đúng thứ tab này sinh ra để hiện.
   */
  const nhomN = ccNhom(
    hien.map((v) => ({
      ulid: v.job_ulid,
      giai_doan: v.trang_thai,
      tao_luc: v.tao_luc,
      payload: { slug: v.nguon ?? "", loai: "chung-cat-mot-nguon" },
      _n: v,
    })),
    (sl) => (globalThis.__GN_MW__?.tenBai ? globalThis.__GN_MW__.tenBai(sl) : ""),
  );
  o.innerHTML = ccTheoNgay(nhomN, Date.now()).map((m) =>
    '<div class="cc-ngay"><span class="nh">' + esc(m.nhan) + "</span>"
    + '<span class="ln"></span><span class="n">'
    + m.nhom.reduce((a, g) => a + g.viec.length, 0) + " bản</span></div>"
    + m.nhom.map((g) => {
      const lnhom = ccLoaiNguon(g.slug);
      return '<div class="cc-bai" data-n="' + esc(lnhom) + '">'
        + '<span class="cc-song"></span>'
        + '<span class="cc-bia" data-i="' + esc(nhanNguon(g.slug) || lnhom) + '"></span>'
        + '<div class="cc-t"><p class="ten" title="' + esc(g.slug) + '">'
        + esc(g.ten) + "</p>"
        + '<div class="duoi"><span>' + g.viec.length + " bản</span></div></div>"
        + '<div class="cc-ong">' + g.viec.map((x) => {
          const v = x._n;
          const tt = NH_LOC_DS.find((y) => y.ma === v.trang_thai);
          const lop = v.trang_thai === "da_bo" ? "trong"
            : v.trang_thai === "da_duyet" ? "xong"
              : v.trang_thai === "tra_lai" ? "hong" : "";
          const cs = v.citations_sampled;
          const cv = v.citations_verified;
          return '<button type="button" class="cc-chang ' + lop
            + '" data-ccnhap="' + esc(v.job_ulid) + '" title="'
            + esc(v.model_da_dung ?? "—")
            + (cv != null && cs != null ? " · " + cv + "/" + cs + " trích dẫn" : "")
            + '">' + esc(tt?.nhan ?? String(v.trang_thai ?? "?")) + "</button>";
        }).join("") + "</div></div>";
    }).join("")).join("");
}

/*
 * Mở bản nháp thành MỘT CỬA SỔ, đúng như bài viết / tài liệu / video.
 *
 * Chủ dự án: *"tôi muốn bản chưng cất cũng xem dạng multi window như các bài
 * viết hay tài liệu, video cơ mà?"*. Bản trước tôi đổ nó vào panel nổi — panel
 * đó không kéo được, không đổi cỡ, không mở song song hai bản để so.
 *
 * Dùng LẠI `mo()` của `multiwindow` qua cầu một chiều, không dựng cửa sổ thứ
 * hai: kéo · đổi cỡ · thu nhỏ · mục lục · phân trang đều đã có ở đó, và một
 * bản thứ hai của cửa sổ là một bản sẽ lệch.
 *
 * `bai.bans[0]` là hình dạng một BẢN GHI mà `mo()` đọc. Bản nháp không phải bản
 * ghi trong kho, nên các trường ngữ cảnh (`credibility_max`, `priority`) khai
 * trung thực là "—"/0 chứ không bịa: một `credibility_max: "high"` gán bừa cho
 * một bản chưa ai duyệt là một lời khai sai ngay trên thanh trạng thái.
 */
/*
 * T03-113 · mở bản nháp bằng CỬA SỔ NHÁP của chunk `cctab`.
 *
 * Bản trước gọi thẳng `mw.mo(bai)` — cửa sổ BÀI-KHO generic. Nó chạy `tai()`,
 * fetch `/api/articles/article/<slug>` cho một bản KHÔNG có trong kho (404),
 * và phát bộ nút của bài đã lên site. Sai cửa, không sai API.
 */
async function ccMoNhap(id) {
  const mw = globalThis.__GN_MW__;
  // Màn này KHÔNG có cửa sổ đọc nào, nên chưa ai nạp chunk `cctab`. Nạp qua
  // chính loader của `multiwindow` — một phép nạp, một chỗ.
  let cc = globalThis.__GN_CCTAB__;
  if (!cc && mw?.cap) {
    try { cc = await mw.cap(); } catch { /* nói ở dưới */ }
  }
  if (!cc || !cc.moCuaSoNhap) {
    bao(true, "Chưa nạp được khung cửa sổ — tải lại trang.");
    return;
  }
  await cc.moCuaSoNhap(id, null);
}

function ccKpi() {
  const o = document.getElementById("cckpi");
  if (!o) return;
  ccCss();
  const dem = {
    chay: CC_DS.filter(ccDangChay).length,
    cho: CC_DS.filter(ccCho).length,
    dung: CC_DS.filter((v) => v.giai_doan === "dung").length,
    xong: CC_DS.filter((v) => v.giai_doan === "xong").length,
  };
  const tong = CC_DS.length;
  o.className = "cc-bd";
  o.innerHTML =
    '<div class="cc-bd-h"><b>' + tong + "</b><span>việc trong hàng đợi</span>"
    + (dem.chay
      ? '<i class="cct-live" aria-hidden="true"></i><span class="cc-bd-s">'
        + "nhà máy đang chạy</span>"
      : "")
    + "</div>"
    /* `role="img"` + `aria-label`: thanh là HÌNH. Người đọc bằng screen reader
       phải nhận được cùng thông tin bằng chữ, không phải một div rỗng. */
    + '<div class="cc-bd-t" role="img" aria-label="'
    + esc(CC_LOP.map(([k, n]) => n + " " + dem[k]).join(", ")) + '">'
    + CC_LOP.map(([k, , mau]) => {
      // `tong === 0` ⇒ 0 chứ không NaN. Một `scaleX(NaN)` làm cả thanh biến mất
      // và trông y như "không có dữ liệu" — hai trạng thái khác nhau.
      const ti = tong ? dem[k] / tong : 0;
      return '<i class="cc-bd-d" data-k="' + k + '" style="background:' + mau
        + ";--ti:" + ti.toFixed(4) + '"></i>';
    }).join("") + "</div>"
    /*
     * WO-086 / SCR-26 §2.1 · BA SỐ NÀY BẤM ĐƯỢC.
     *
     * Hướng A bỏ hàng nút `tất cả · chờ · đang chạy · dừng · xong`. Bỏ trơn
     * thì mất khả năng lọc, và với 40 bài thì "tìm bài đang hỏng" lại thành
     * cuộn tay. Nên khả năng ấy về đúng chỗ đã hiển thị con số — đây là bản
     * tóm tắt vốn đã nằm đó, nay bấm được, KHÔNG phải một hàng nút thứ tư.
     *
     * `<button>` chứ không `<li>` gắn `onclick`: bàn phím phải tới được, và
     * `aria-pressed` mới có chỗ đứng.
     */
    + '<ul class="cc-bd-cg">' + CC_LOP.map(([k, nhan, mau]) =>
      '<li' + (dem[k] ? "" : ' class="rong"') + '>'
      + '<button type="button" data-cckpi="' + k + '" aria-pressed="'
      + (CC_LOC === k) + '"><i style="background:' + mau + '"></i>'
      + esc(nhan) + "<b>" + dem[k] + "</b></button></li>").join("")
    + "</ul>";
}

async function ccNap() {
  const canh = document.getElementById("cc-canh");
  const luoi = document.getElementById("g-cc");
  const rong = document.getElementById("rong-cc");
  const dem = document.getElementById("c-cc");
  if (!luoi) return;
  try {
    /*
     * LẤY TOÀN BỘ, lọc ở FE. Không truyền `giai_doan` xuống dịch vụ nữa.
     *
     * Đo được 2026-09-05 (ảnh chụp chủ dự án): bấm bộ lọc `chờ` thì tổng kết
     * đổi thành *"3 việc · đang chạy 3 · chờ 0 · xong 0"* — nó tính lại trên
     * TẬP ĐÃ LỌC. Một tổng kết đổi theo bộ lọc thì không phải tổng kết: hai ảnh
     * chụp cùng một hàng đợi cho hai bộ số, và người đọc không biết tin cái nào.
     *
     * Tổng kết phải nói về CẢ hàng đợi, lưới nói về phần đang xem. Một lời gọi
     * phục vụ cả hai, và không có ca nào hai bên lệch nhau vì chúng đọc CÙNG
     * một mảng.
     */
    const r = await fetch("/api/job?n=200");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? `dịch vụ trả ${r.status}`);
    CC_DS = j.dong ?? [];
    CC_HIEN = CC_LOC ? CC_DS.filter((v) => nhomLoc(v) === CC_LOC) : CC_DS;
    if (canh) canh.hidden = true;
    /* Đánh dấu việc CŨ trước khi vẽ — cùng phép tính với tab Chưng cất:
       cùng `loai`+`slug`, có việc `xong` mới hơn thì bản này là bản cũ. */
    const cuSet = danhDauCu(CC_HIEN);
    void nhapConSong().then((x) => { NHAP_CON = x; });
    /*
     * WO-085 · VẼ THEO KHỐI, mỗi bài gốc một khối, tiêu đề thật làm đầu khối.
     *
     * `tenBai` đi qua cầu: chỉ mục `open-index` do `multiwindow` nạp và cache,
     * và tải bản thứ hai ở đây là hai bản sẽ lệch. Cầu vắng ⇒ `() => ""` và
     * `ccNhom` tự lùi về slug — thấy slug vẫn hơn thấy một khối trống.
     */
    /*
     * WO-086 / SCR-26 · MỘT BÀI MỘT DÒNG, nhóm dưới MỐC NGÀY.
     *
     * Bản `WO-085` gộp bằng một `<h3>` chen vào lưới phẳng — vách ngăn, không
     * phải bố cục — và thêm hàng nút thứ ba. Chủ dự án từ chối, đúng.
     *
     * `tenBai` đi qua cầu; cầu vắng ⇒ `ccNhom` tự lùi về slug.
     */
    const traTen = globalThis.__GN_MW__?.tenBai;
    const nhom = ccNhom(CC_HIEN, (s) => (traTen ? traTen(s) : ""));
    luoi.innerHTML = ccTheoNgay(nhom, Date.now()).map((m) =>
      `<div class="cc-ngay"><span class="nh">${esc(m.nhan)}</span>`
      + '<span class="ln"></span>'
      + `<span class="n">${m.nhom.reduce((a, g) => a + g.viec.length, 0)} việc</span></div>`
      + m.nhom.map((g) => {
        const dau = g.viec[0] ?? {};
        const gio = String(dau.tao_luc ?? "").slice(11, 16);
        /*
         * WO-088 · Chỉ BẢN CUỐI, và ống chỉ chứa việc của NGƯỜI. Việc của máy
         * xuống hàng meta thành nhãn mờ; nó chỉ nổi thành chip đỏ khi HỎNG —
         * lúc ấy mới cần người.
         */
        const cuoi = ccBanCuoi(g.viec);
        const ong = cuoi.filter(ccViecNguoi);
        const may = cuoi.filter((v) => !ccViecNguoi(v));
        const hong = may.filter(ccVatHong);
        const nen = may.length - hong.length;
        /*
         * WO-089 · `data-i` phải là LOẠI NGUỒN (`youtube` · `pdf` · …), không
         * phải tiền tố slug (`video`) — bảng icon khai theo loại nguồn, nên
         * tiền tố slug cho ra một ô bìa trống.
         *
         * `data-n` (màu cột sống) vẫn theo tiền tố slug: màu nói NHÓM, icon
         * nói NGUỒN. Hai câu khác nhau, hai khoá khác nhau.
         */
        const lnhom = ccLoaiNguon(g.slug);
        const lnguon = nhanNguon(g.slug) || lnhom;
        return `<div class="cc-bai" data-n="${esc(lnhom)}">`
          + '<span class="cc-song"></span>'
          + `<span class="cc-bia" data-i="${esc(lnguon)}"></span>`
          + `<div class="cc-t"><p class="ten" title="${esc(g.slug)}">${esc(g.ten)}</p>`
          + `<div class="duoi"><span>${esc(dau.payload?.model ?? dau.model ?? "—")}</span>`
          + `<span>${esc(gio)}</span>`
          + (nen ? `<span class="vat">+${nen} việc nền</span>` : "")
          + "</div></div>"
          + `<div class="cc-ong">${ong.map((v) => ccThe(v, cuSet.has(v))).join("")}`
          + hong.map((v) => `<button type="button" class="cc-chang hong cc-vat-hong"`
            + ` data-ccmo="${esc(v.ulid)}" title="việc nền hỏng — bấm để xem">`
            + `✕ ${esc(tenLoai(v.payload?.loai))}</button>`).join("")
          + "</div></div>";
      }).join("")).join("");
    /*
     * WO-082 · 23 việc đổ một lượt là chính cái ảnh chủ dự án chụp. `capNhin`
     * sống ở chunk `multiwindow`; chunk này là IIFE riêng nên phải đi qua cầu,
     * gọi thẳng `capNhin` ở đây là một `ReferenceError` ngay lần vẽ đầu.
     *
     * `?.` cả hai nấc: `/chung-cat/` mở được khi chunk kia chưa nạp xong, và
     * một danh sách 23 việc *chưa cắt* vẫn tốt hơn một danh sách không vẽ.
     */
    globalThis.__GN_MW__?.capNhin?.(luoi, true, ".cc-bai");
    if (rong) {
      // `.empty` mang padding + viền gạch, nên để CHỮ rỗng vẫn vẽ một ô trống
      // to giữa màn (thấy trên ảnh chụp). Ẩn bằng `hidden`, không bằng "".
      rong.hidden = CC_HIEN.length > 0;
      rong.textContent = CC_HIEN.length ? ""
        : "Chưa có việc nào — mở một tài liệu rồi bấm CHƯNG CẤT.";
    }
    if (dem) {
      const t = Number(j.tong ?? CC_DS.length);
      dem.textContent = CC_HIEN.length === t
        ? `${t} việc` : `${CC_HIEN.length}/${t} việc`;
    }
  } catch (e) {
    /*
     * "Không có việc nào" và "không hỏi được ai cả" là HAI CÂU khác nhau, và
     * hai hành động khác nhau. Một màn để chung một câu cho cả hai ca sẽ nói
     * SAI ở ca thứ hai — người đọc kết luận hàng đợi rỗng trong khi dịch vụ
     * đang chết.
     */
    CC_DS = [];
    luoi.innerHTML = "";
    if (rong) { rong.hidden = true; rong.textContent = ""; }
    if (canh) {
      canh.hidden = false;
      canh.textContent = "KHÔNG hỏi được dịch vụ chưng cất — " + String(e.message ?? e)
        + ". Đây KHÔNG phải 'không có việc nào': danh sách trống vì chưa hỏi"
        + " được ai, không vì hàng đợi rỗng.";
    }
  }
  ccKpi();
  void ccNapNhap();
  ccHenLai();
}

/* ═══ WO-070 · THÙNG RÁC VIỆC ═══════════════════════════════════════════ */

function ccTheRac(v) {
  const gd = esc(String(v.giai_doan_hong ?? "?"));
  const ly = esc(String(v.loi ?? "hỏng, không rõ lý do"));
  const gui = Number(v.lan_gui || 0);
  const u = esc(String(v.ulid ?? ""));
  return '<div class="cd st-rejected" data-gd="hong">'
    + '<i class="tg"><b style="background:var(--destructive)">hỏng</b></i>'
    + "<h4>" + esc(String(v.payload?.slug ?? v.slug ?? v.ulid)) + "</h4>"
    + '<div class="mt"><b class="vc-loai" style="--vl:' + mauLoai(v.payload?.loai)
    + '">' + dauLoai(v.payload?.loai) + " " + esc(tenLoai(v.payload?.loai))
    + "</b><span>hỏng ở: " + gd + " · gửi " + gui + "/2</span></div>"
    + ccDaiChuoi(v)
    /* "hỏng tại đâu" phải là một CON SỐ. `giữa chừng` không nói cho ai biết
       đã mua được bao nhiêu giây, và đó chính là thứ quyết định có đáng chạy
       tiếp hay không. */
    + (Number(v.tien_toi_giay || 0)
      ? '<div class="mt"><span>đã phiên âm tới ' + ccGiay(v.tien_toi_giay)
        + "</span></div>"
      : "")
    + '<p class="ld">' + ly + "</p>"
    /* Hết 2 lần gửi thì KHÔNG bày nút chạy lại: bấm vào sẽ ăn 409 của
       `M12-R6`, và một nút chỉ để báo lỗi là một nút nói dối. */
    + (gui < 2
      ? '<button type="button" class="bt sm" data-ccrlai="' + u + '">↻ Chạy lại (gửi '
        + (gui + 1) + "/2)</button>"
      /* ĐÃ tự tạo việc tiếp thì câu "tạo việc mới nếu cần" là SAI — và một
         câu sai ở đây đẩy người đi tạo một việc thứ hai trùng lặp. */
      : v.da_noi_tiep
        ? '<span class="ld">✓ hệ đã tự tạo việc nối tiếp <b>'
          + esc(String(v.da_noi_tiep).slice(0, 10)) + "</b> — chạy tiếp từ "
          + ccGiay(v.tien_toi_giay) + "</span>"
        : '<span class="ld">hết 2 lần gửi — tạo việc mới nếu cần</span>')
    + ' <button type="button" class="bt ghost sm" data-ccrxoa="' + u + '">🗑 Xoá hẳn</button>'
    + "</div>";
}

async function ccNapRac() {
  const luoi = document.getElementById("g-rac");
  const rong = document.getElementById("rong-rac");
  const dem = document.getElementById("c-rac");
  if (!luoi) return;
  try {
    const r = await fetch("/api/job?rac=1&n=200");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? `dịch vụ trả ${r.status}`);
    const ds = j.dong ?? [];
    luoi.innerHTML = ds.map(ccTheRac).join("");
    if (rong) {
      rong.hidden = ds.length > 0;
      rong.textContent = ds.length ? "" : "Thùng rác trống.";
    }
    if (dem) dem.textContent = ds.length ? String(ds.length) : "";
  } catch (e) {
    luoi.innerHTML = '<p class="f-loi">KHÔNG hỏi được dịch vụ — '
      + esc(String(e.message ?? e)) + "</p>";
  }
}

async function ccRacLai(u, nut) {
  nut.disabled = true;
  try {
    const r = await fetch("/api/viec/" + encodeURIComponent(u) + "/lai", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? "HTTP " + r.status);
    bao(false, "Đã xếp lại — chạy TIẾP từ chỗ đã có, không từ đầu.");
    void ccNapRac();
    void ccNap();
  } catch (e) {
    nut.disabled = false;
    bao(true, "Không chạy lại được: " + String(e.message ?? e));
  }
}

async function ccRacXoa(u, nut) {
  /*
   * Câu xác nhận NÓI RA THỨ KHÔNG MẤT.
   *
   * Xoá việc KHÔNG xoá `egress.*.jsonl` — vết chi phí là một sổ riêng. Không
   * nói ra thì người dùng tưởng bấm xoá là mất luôn con số đã tiêu, và họ sẽ
   * giữ rác lại vì sợ mất sổ tiền.
   */
  if (!globalThis.confirm(
    "Xoá hẳn việc này khỏi thùng rác?" + NLC + NLC
    + "Phần transcript đã phiên âm sẽ mất. VẾT CHI PHÍ VẪN GIỮ — sổ egress là "
    + "một file riêng, nên câu 'đã tiêu bao nhiêu' vẫn trả lời được.")) return;
  nut.disabled = true;
  try {
    const r = await fetch("/api/viec/" + encodeURIComponent(u), { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? "HTTP " + r.status);
    bao(false, "Đã xoá. Sổ chi phí giữ nguyên.");
    void ccNapRac();
  } catch (e) {
    nut.disabled = false;
    bao(true, "Không xoá được: " + String(e.message ?? e));
  }
}

/*
 * Poll CHỈ khi có việc đang chạy. Poll vô điều kiện là gọi một dịch vụ mỗi 4
 * giây suốt thời gian tab mở, kể cả khi không có gì đổi — và nhịp đó không ai
 * thấy nên không ai tắt.
 */
function ccHenLai() {
  if (CC_HEN) { clearTimeout(CC_HEN); CC_HEN = null; }
  if (!document.getElementById("g-cc")) return;
  if (!CC_DS.some(ccDangChay)) return;
  CC_HEN = setTimeout(() => { void ccNap(); }, 4000);
}

/*
 * ĐẶT panel cạnh thẻ, tự lật để không ra ngoài khung nhìn.
 *
 * `transform: translate(x,y)` chứ không `top`/`left`: hai thuộc tính đó là
 * LAYOUT, và animate/đổi chúng liên tục là reflow mỗi frame — panel sẽ bò theo
 * con trỏ thay vì nhảy tới chỗ.
 */
/*
 * CSS của panel — CHUNK tự tiêm, không khai trong `prototype.css`.
 *
 * Vì sao không ở `prototype.css`: nó đi vào `gn.css`, bundle CHUNG của MỌI
 * trang, và `gn.css` đang dư 17 byte. `FR-061` cấm nới bundle chung. Panel của
 * MỘT màn, do chunk của màn đó tạo ⇒ CSS của nó thuộc chunk đó, và byte của nó
 * tính vào tổng tải đầu của `/chung-cat/` (276 KB / 293 KB — còn chỗ).
 *
 * VÌ SAO PHẢI VIẾT LẠI: bản trước dùng lại `class="gem"` cho gọn. Đo trên ảnh
 * chụp thật của chủ dự án — `.gem` có `background: var(--glass-2)` = `--card` =
 * `rgba(21,23,25,.7)` và **KHÔNG có `backdrop-filter`**, nên 30% nền là các thẻ
 * việc phía sau: chữ của panel và chữ của thẻ chồng lên nhau, không đọc được.
 * Và `.gem dt/dd` xếp DỌC (nhãn một dòng, giá trị dòng dưới) nên panel dài gấp
 * đôi mà vẫn khó quét mắt.
 *
 * Đây là bài học *"dùng lại cho gọn"*: `.gem` là thẻ TRONG luồng, có nền phía
 * sau nó là trang. Một panel NỔI thì nền phía sau là nội dung khác — cùng bộ
 * luật, hai ngữ cảnh, và một trong hai sẽ sai.
 */
function ccCss() {
  if (document.getElementById("cc-hv-css")) return;
  const st = document.createElement("style");
  st.id = "cc-hv-css";
  st.textContent = `
/* WO-088 · CSS cua MAN /chung-cat/ tiem tu CHINH chunk cua man.
   No tung nam o prototype.css, tuc di theo MOI trang. Do duoc 2026-09-10:
   khoi nay 2096 byte va gn.css chi du 5 — them mau la vo tran ngay.
   Cung loi TX_CSS da dung cho thanh nut cua so: ma cua mot man di cung man
   ay. Nguoi chi luot danh sach khong tai mot byte nao cua no. */
#g-cc{display:block}
.cc-ngay{display:flex;align-items:center;gap:var(--s-sm);margin:var(--s-md) 0 0}
.cc-ngay .nh,.cc-ngay .n,.cc-bai .duoi{font-size:var(--fs-meta)}
.cc-ngay .n,.cc-bai .duoi,.cc-chang.trong{color:var(--ink-3)}
.cc-chang.trong{opacity:.62}
.cc-ngay .nh{font-family:var(--f-ui);letter-spacing:var(--tr-lb);
  text-transform:uppercase;color:var(--ink-2)}
.cc-ngay .ln{flex:1;border-top:1px solid var(--edge)}
.cc-bai{display:grid;grid-template-columns:3px 40px 1fr auto;gap:var(--s-sm);
  align-items:center;padding:var(--s-xs) 0;border-bottom:1px solid var(--edge)}
.cc-bai.qua{display:none}
.cc-bia,.cc-chang{background:var(--card);border:1px solid var(--edge)}
.cc-bai{--c:var(--c-video)}
.cc-bai[data-n=tai-lieu]{--c:var(--c-paper)}
.cc-bai[data-n=article]{--c:var(--c-article)}
.cc-song{align-self:stretch;border-radius:var(--r-sm);background:var(--c);opacity:.55;
  transition:opacity .18s,box-shadow .18s}
.cc-bai:hover .cc-song{opacity:1;box-shadow:0 0 12px -1px var(--c)}
.cc-bia{width:40px;aspect-ratio:1;border-radius:var(--r-sm);color:var(--c);
  display:grid;place-items:center}
.cc-bia[data-i]::before{content:"";width:52%;aspect-ratio:1;
  background:currentColor;mask-size:contain;mask-repeat:no-repeat;
  mask-position:center}
.cc-bai .ten{margin:0;font-size:var(--fs-card);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cc-bai .duoi{display:flex;gap:var(--s-sm);flex-wrap:wrap}
.cc-ong{display:flex;overflow-x:auto}
.cc-chang{display:inline-flex;align-items:center;gap:var(--s-2xs);cursor:pointer;
  padding:var(--s-2xs) var(--s-xs);white-space:nowrap;font-size:var(--fs-meta);
  border-right:0;color:var(--ink-2)}
.cc-ong .cc-chang:first-child{border-radius:var(--r-sm) 0 0 var(--r-sm)}
.cc-ong .cc-chang:last-child{border-right:1px solid var(--edge);
  border-radius:0 var(--r-sm) var(--r-sm) 0}
.cc-chang.xong{color:var(--ink)}
.cc-chang.chay{color:var(--warn);border-color:currentColor;
  animation:cc-tho 1.3s ease-in-out infinite}
@keyframes cc-tho{50%{opacity:.55}}
.cc-chang.hong{color:var(--destructive);border-color:currentColor}
.cc-bd-cg button{display:inline-flex;align-items:center;gap:var(--s-2xs);
  background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer}
.cc-bd-cg [aria-pressed=true]{font-weight:600}
.vc-loai{font-family:var(--f-ui);font-size:var(--fs-nano);letter-spacing:.06em;
  color:var(--vl,var(--ink-2))}
.cd.cct-cu h4{text-decoration:line-through;
  text-decoration-color:var(--destructive);text-decoration-thickness:2px}
.cd.cct-cu{opacity:.72}
#cc-hv{position:fixed;top:0;left:0;z-index:60;width:23rem;
  max-width:calc(100vw - 2rem);max-height:75vh;overflow:auto;
  /* ĐỤC hơn '.gem' rất nhiều + blur: panel nổi phải ĐỌC ĐƯỢC trên bất kỳ nền,
     và nền của nó là các thẻ việc đầy chữ. */
  background:var(--glass);
  background-image:linear-gradient(var(--glass),var(--glass));
  backdrop-filter:var(--blur-lift);
  border:1px solid var(--edge);border-radius:var(--r);
  box-shadow:var(--e-2),var(--e-top);
  font-family:var(--f-ui);font-size:var(--fs-meta);color:var(--ink)}
#cc-hv .hv-h{display:flex;align-items:center;gap:var(--s-2xs);
  padding:var(--s-xs) var(--s-sm);border-bottom:1px solid var(--edge)}
#cc-hv .hv-h b{font-family:var(--f-ui);font-size:var(--fs-nano);letter-spacing:var(--tr-lb);
  text-transform:uppercase;color:var(--ink-3);font-weight:var(--w-head)}
#cc-hv .hv-x{margin-left:auto;background:none;border:0;cursor:pointer;
  color:var(--ink-3);font-size:var(--fs-read);line-height:1;padding:0 var(--s-3xs)}
#cc-hv .hv-x:hover{color:var(--ink)}
/* HAI CỘT: nhãn hẹp bên trái, giá trị chiếm phần còn lại. 'minmax(0,1fr)' chứ
   không '1fr' — không có nó thì một ULID 32 ký tự nở cột ra và panel tràn. */
#cc-hv dl{display:grid;grid-template-columns:5.5rem minmax(0,1fr);
  gap:var(--s-3xs) var(--s-xs);margin:0;padding:var(--s-xs) var(--s-sm)}
#cc-hv dt{font-family:var(--f-ui);color:var(--ink-3);font-size:var(--fs-nano);letter-spacing:var(--tr-lb);
  text-transform:uppercase}
#cc-hv dd{margin:0;min-width:0;overflow-wrap:anywhere;color:var(--ink)}
#cc-hv dd.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:var(--fs-nano);color:var(--ink-2)}
#cc-hv .hv-gd{display:inline-block;padding:0 var(--s-2xs);
  border-radius:var(--r-pill);background:var(--brand-bg);color:var(--brand);
  font-size:var(--fs-nano);font-weight:var(--w-head)}
#cc-hv .hv-f{padding:var(--s-2xs) var(--s-sm) var(--s-xs);
  border-top:1px solid var(--edge);color:var(--ink-3);font-size:var(--fs-nano)}
#cc-hv .al{margin:0 var(--s-sm) var(--s-xs)}
#cckpi.cc-bd{display:block;margin:var(--s-sm) 0 var(--s-md)}
.cc-bd-h{display:flex;align-items:center;gap:var(--s-2xs);
  margin-bottom:var(--s-2xs)}
.cc-bd-h b{font-size:var(--fs-stat);font-weight:var(--w-bold);line-height:1}
.cc-bd-h span{color:var(--ink-2);font-size:var(--fs-meta)}
.cc-bd-s{color:var(--ok)}
.cc-bd-t{display:flex;height:var(--s-2xs);border-radius:var(--r-pill);
  overflow:hidden;background:var(--edge);gap:1px}
/* 'flex-basis' cho chỗ, 'scaleX' cho hiệu ứng: đổi 'flex-basis' một lần lúc
   render không phải animation; animate 'scaleX' thì chạy trên compositor. */
.cc-bd-d{flex:0 0 calc(var(--ti) * 100%);transform-origin:left center}
.cc-bd-cg{list-style:none;display:flex;flex-wrap:wrap;gap:var(--s-xs);
  margin:var(--s-2xs) 0 0;padding:0;font-size:var(--fs-meta);color:var(--ink-2)}
.cc-bd-cg li{display:flex;align-items:center;gap:var(--s-3xs)}
.cc-bd-cg li.rong{opacity:.4}
.cc-bd-cg i{width:var(--s-2xs);height:var(--s-2xs);border-radius:var(--r-sm);
  flex:0 0 auto}
.cc-bd-cg b{color:var(--ink);font-variant-numeric:tabular-nums}
.cct-live{width:var(--s-2xs);height:var(--s-2xs);border-radius:50%;
  background:var(--ok);flex:0 0 auto}
@media (prefers-reduced-motion: no-preference) {
  /* Thanh CHẠY VÀO lúc render — một lần, không lặp. Lặp mãi ở một biểu đồ
     trạng thái là nhiễu, không phải thông tin. */
  .cc-bd-d{animation:bd-vao .5s cubic-bezier(.2,.8,.2,1) both}
  .cct-live{animation:bd-tho 1.6s ease-in-out infinite}
}
@keyframes bd-vao{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes bd-tho{0%,100%{transform:scale(1);opacity:1}
  50%{transform:scale(1.55);opacity:.45}}
.nh-l{list-style:none;margin:0;padding:0}
.nh-i{display:flex;align-items:center;gap:var(--s-xs);padding:var(--s-2xs) 0;
  border-bottom:1px solid var(--line)}
.nh-x{flex:1 1 auto;min-width:0;text-align:left;background:none;border:0;
  padding:0;cursor:pointer;color:var(--ink);display:flex;flex-direction:column}
.nh-x b{font-size:var(--fs-meta)}
.nh-m{color:var(--ink-3);font-size:var(--fs-nano);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.nh-c{color:var(--ok)}
.nh-g{flex:0 0 auto;font-size:var(--fs-meta)}
.nh-g.rong{color:var(--ink-3)}
.nh-t{white-space:pre-wrap;word-break:break-word;margin:0;padding:var(--s-xs);
  font-size:var(--fs-nano);color:var(--ink-2);max-height:55vh;overflow:auto}
.cc-tabs{margin:0 0 var(--s-sm)}
.nh-tt{flex:0 0 auto;padding:0 var(--s-2xs);border-radius:var(--r-pill);
  background:var(--edge);color:var(--ink-2);font-size:var(--fs-nano);
  font-style:normal}
.nh-i[data-tt="da_duyet"] .nh-tt{background:var(--ok);color:var(--bg)}
.nh-i[data-tt="tra_lai"] .nh-tt{background:var(--warn);color:var(--bg)}
.nh-i[data-tt="da_bo"]{opacity:.55}
.bc{display:flex;flex-wrap:wrap;gap:var(--s-xs);align-items:center;
  margin:0 0 var(--s-sm)}
.bc-o{display:flex;flex-direction:column;align-items:flex-start;
  padding:var(--s-2xs) var(--s-xs);border:1px solid var(--edge);
  border-radius:var(--r-sm);background:none;cursor:pointer;color:var(--ink)}
.bc-s{font-size:var(--fs-stat);line-height:1;font-variant-numeric:tabular-nums}
.bc-n{color:var(--ink-3);font-size:var(--fs-nano)}
.bc-l{margin-left:auto}`;
  document.head.appendChild(st);
}

function ccDatCho(hv, the) {
  const r = the.getBoundingClientRect();
  const w = hv.offsetWidth || 320;
  const h = hv.offsetHeight || 200;
  const LE = 8;
  // Ưu tiên BÊN PHẢI thẻ; hết chỗ thì sang trái. Với thẻ ở cột cuối của lưới
  // thì "luôn bên phải" là panel nằm nửa ngoài màn hình.
  let x = r.right + LE;
  if (x + w > innerWidth - LE) x = r.left - w - LE;
  if (x < LE) x = LE;
  // Thẳng hàng ĐỈNH thẻ, rồi kéo lên nếu tràn đáy — không căn giữa: căn giữa
  // làm panel của thẻ hàng đầu trồi lên khỏi màn hình.
  let y = r.top;
  if (y + h > innerHeight - LE) y = innerHeight - h - LE;
  if (y < LE) y = LE;
  hv.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}

/** `dl` của một việc — MỘT khuôn cho cả xem nhanh và bản ghim. */
function ccBangViec(v, ghim) {
  const lan = Number(v.lan_gui ?? 0);
  /*
   * `dang_giu` hiện THÀNH CHỮ, không để người suy từ `giai_doan`. Một việc bỏ
   * rơi mang `dang-goi-model` trông y hệt một việc đang gọi model — đó là con
   * số nói sai mà `WO-050` vừa sửa ở KPI, và panel là chỗ thứ hai nó nói sai.
   */
  const giu = v.dang_giu === true;
  const ket = v.giai_doan === "xong" || v.giai_doan === "dung";
  const hang = [
    ["giai đoạn", null, "gd"],
    ["trạng thái", ket ? "đã kết thúc" : giu ? "worker đang giữ" : "chờ — không ai giữ"],
    ["nguồn", v.payload?.slug ?? v.slug],
    ["model", v.payload?.model ?? v.model],
    ["lần gửi", `${lan}/2`],
    // ULID đầy đủ ở bản GHIM (người cần copy nó), rút gọn ở bản xem nhanh.
    ["việc", ghim ? v.ulid : String(v.ulid ?? "").slice(0, 12) + "…", "mono"],
  ];
  return '<div class="hv-h"><b>Chi tiết việc</b>'
    + (ghim ? '<button class="hv-x" data-ccdong aria-label="Đóng">&times;</button>' : "")
    + "</div><dl>"
    + hang.map(([a, b, lop]) =>
      lop === "gd"
        ? `<dt>${esc(a)}</dt><dd><span class="hv-gd">`
          + `${esc(String(v.giai_doan ?? "?"))}</span></dd>`
        : `<dt>${esc(a)}</dt><dd${lop ? ` class="${lop}"` : ""}>`
          + `${b == null || b === "" ? "—" : esc(String(b))}</dd>`).join("")
    + "</dl>"
    /*
     * `lan_gui` KHÔNG reset, trần 2 (`M12-R6`). Chạm trần thì câu đúng KHÔNG
     * phải "thử lại" — nó là "tạo việc mới". Nói sai ở đây là mời người bấm
     * một nút không thể hoạt động.
     */
    + (lan >= 2
      ? '<p class="al">Đã gửi 2/2 lần — trần `M12-R6`, và nó KHÔNG reset.'
        + " Cần gửi thêm thì tạo VIỆC MỚI (ULID mới, log egress riêng)."
        + " Chạy lại việc này sẽ không gửi được.</p>"
      : "");
}

/*
 * XEM NHANH — hover hoặc focus. **0 request.**
 *
 * Dữ liệu lấy từ `CC_DS`, danh sách vừa tải cho chính lưới này. Một `fetch`
 * mỗi lần trỏ chuột qua một thẻ là hàng chục request khi người chỉ đang rê mắt
 * xuống lưới — và không một request nào trong số đó nói thêm điều gì so với
 * danh sách đã có trong tay.
 *
 * Bản GHIM thì khác: nó đọc lại từ dịch vụ, vì đó là bản người sẽ đọc kỹ.
 */
function ccXemNhanh(ulid, the) {
  const hv = document.getElementById("cc-hv");
  if (!hv || hv.dataset.ghim) return;
  const v = CC_DS.find((x) => String(x.ulid) === String(ulid));
  if (!v) return;
  hv.innerHTML = ccBangViec(v, false)
    + '<p class="ld">Bấm để ghim và đọc bản mới nhất từ dịch vụ.</p>';
  hv.hidden = false;
  ccDatCho(hv, the);
}

function ccAnXemNhanh() {
  const hv = document.getElementById("cc-hv");
  if (hv && !hv.dataset.ghim) hv.hidden = true;
}

/*
 * GHIM — bấm. `?job=` vào URL + đọc lại từ DỊCH VỤ.
 *
 * Deep-link giữ nguyên từ bản cũ: mở lại tab vẫn thấy đúng việc, và đó là cách
 * duy nhất dẫn người khác tới một việc cụ thể.
 */
async function ccMoChiTiet(ulid, the) {
  const hv = document.getElementById("cc-hv");
  if (!hv) return;
  hv.dataset.ghim = "1";
  hv.hidden = false;
  hv.innerHTML = '<p class="ld">Đang đọc…</p>';
  if (the) ccDatCho(hv, the);
  const u = new URL(location.href);
  u.searchParams.set("job", ulid);
  history.replaceState(null, "", u);
  try {
    const r = await fetch("/api/viec/" + encodeURIComponent(ulid));
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) {
      hv.innerHTML = `<p class="al">Không có việc <code>${esc(ulid)}</code>.`
        + " Nó chưa bao giờ tồn tại, hoặc hàng đợi đã bị dựng lại.</p>";
    } else if (!r.ok) {
      throw new Error(j.loi ?? `dịch vụ trả ${r.status}`);
    } else {
      hv.innerHTML = ccBangViec(j, true)
        + '<button class="bt ghost sm" data-ccdong>Đóng</button>';
    }
  } catch (e) {
    hv.innerHTML = `<p class="al">${esc(String(e.message ?? e))}</p>`;
  }
  // Đặt lại chỗ SAU khi có nội dung thật: chiều cao vừa đổi, và toạ độ tính
  // theo chiều cao cũ là panel tràn đáy đúng lúc nó dài ra.
  if (the) ccDatCho(hv, the);
}

function ccDongChiTiet() {
  const hv = document.getElementById("cc-hv");
  if (hv) {
    delete hv.dataset.ghim;
    hv.hidden = true;
  }
  const u = new URL(location.href);
  u.searchParams.delete("job");
  history.replaceState(null, "", u);
}

/* Escape đóng bản ghim. Một panel nổi không đóng được bằng bàn phím là một
 * panel bẫy người dùng bàn phím ở đó. */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("cc-hv")?.dataset.ghim) {
    ccDongChiTiet();
  }
});

/*
 * HOVER và FOCUS, cả hai.
 *
 * Chỉ `mouseenter` thì người dùng bàn phím và người dùng cảm ứng KHÔNG BAO GIỜ
 * đọc được chi tiết — hover không phải một API mọi thiết bị có. Thẻ vốn là
 * `<button>` nên nó đã nhận được tiêu điểm; chỉ cần nghe thêm `focusin`.
 *
 * Nghe trên `document` (bắt sự kiện nổi lên) chứ không gắn từng thẻ: lưới vẽ
 * lại mỗi 4 giây theo nhịp poll, và listener gắn từng thẻ sẽ rụng theo mỗi lần
 * vẽ lại — rồi hover thôi hoạt động mà không ai thấy vì sao.
 */
for (const [su, chay] of [
  ["mouseenter", true], ["focusin", true],
  ["mouseleave", false], ["focusout", false],
]) {
  document.addEventListener(su, (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const the = t.closest("[data-ccmo]");
    if (!the) return;
    if (chay) ccXemNhanh(the.dataset.ccmo, the);
    else ccAnXemNhanh();
  }, true);
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  const the = t.closest("[data-ccmo]");
  if (the) {
    e.preventDefault();
    /*
     * BẤM THẺ ⇒ MỞ BẢN CHƯNG CẤT trong cửa sổ, không mở panel chi tiết
     * (chủ dự án chốt 2026-09-06).
     *
     * Panel "CHI TIẾT VIỆC" nói giai đoạn · model · lần gửi — mà **rê chuột đã
     * nói đủ những thứ đó** (`WO-048`). Nên cú bấm đang tiêu vào việc lặp lại
     * một thông tin sẵn có, trong khi thứ người mở màn này muốn là ĐỌC bản
     * chưng cất và duyệt nó.
     *
     * Việc chưa xong thì chưa có bản nháp để mở — lúc đó panel chi tiết vẫn là
     * câu trả lời đúng, nên giữ nó cho đúng ca ấy.
     */
    const v = CC_DS.find((x) => String(x.ulid) === String(the.dataset.ccmo));
    const nhapId = v && v.ket_qua && v.ket_qua.nhap_id;
    if (nhapId) void ccMoNhap(String(nhapId));
    else void ccMoChiTiet(the.dataset.ccmo ?? "", the);
    return;
  }
  const rlai = t.closest("[data-ccrlai]");
  if (rlai) { void ccRacLai(rlai.dataset.ccrlai ?? "", rlai); return; }
  const rxoa = t.closest("[data-ccrxoa]");
  if (rxoa) { void ccRacXoa(rxoa.dataset.ccrxoa ?? "", rxoa); return; }
  const tab = t.closest("[data-cctab]");
  if (tab) {
    e.preventDefault();
    ccDoiTab(tab.dataset.cctab ?? "viec");
    return;
  }
  const nhlc = t.closest("[data-nhlc]");
  if (nhlc) {
    e.preventDefault();
    NH_LOC = nhlc.dataset.nhlc ?? "";
    for (const n of document.querySelectorAll("[data-nhlc]")) {
      n.setAttribute("aria-pressed", String(n === nhlc));
    }
    void ccNapNhap();
    return;
  }
  /* Thẻ TRANSCRIPT mở cửa sổ transcript — cùng cửa sổ mà tab dùng.
     `moCuaSoTranscript` sống ở chunk `cctab`, nên đi qua `__GN_MW__.cap()`
     (cùng đường `goiChunk` của multiwindow đã đi). Chunk này KHÔNG có helper
     `mw()` — đó là của `cctab`, và chép nhầm thói quen ấy đã ra
     `ReferenceError: mw is not defined` ngay cú bấm đầu. */
  /*
   * DAT CUA MAN NAY: NGOAI cua so doc. Mot the transcript nam TRONG mot `.bk`
   * la dat cua `cctab` — xem ghi chu doi ung o `cctab.inline.ts`. Thieu phep
   * chan nay thi tren `/chung-cat/` mot cu click mo HAI cua so, va do la bug
   * chu du an bat 2026-09-07.
   */
  const tr = t.closest("[data-cctr]");
  if (tr && !t.closest(".bk")) {
    e.preventDefault();
    void (async () => {
      const c = await globalThis.__GN_MW__?.cap?.();
      c?.moCuaSoTranscript?.(String(tr.dataset.cctr || ""), null);
    })();
    return;
  }
  const nhap = t.closest("[data-ccnhap]");
  if (nhap) {
    e.preventDefault();
    void ccMoNhap(nhap.dataset.ccnhap ?? "");
    return;
  }
  const nk = t.closest("[data-cckpi]");
  if (nk) {
    e.preventDefault();
    const k = nk.dataset.cckpi ?? "";
    CC_LOC = CC_LOC === k ? "" : k;
    void ccNap();
    return;
  }
  if (t.closest("[data-ccdong]")) {
    e.preventDefault();
    ccDongChiTiet();
  }
});

function ccKhoiDong() {
  if (!ccDungKhung()) return;
  void ccNap().then(() => {
    const job = new URL(location.href).searchParams.get("job");
    /* Deep-link: neo vào CHÍNH thẻ của việc đó nếu nó có trong lưới. Không có
       (đã lọc mất, hoặc quá trang) thì `ccDatCho` bỏ qua và panel nằm ở góc
       theo `transform` mặc định của CSS — vẫn đọc được, chỉ không neo. */
    if (job) {
      void ccMoChiTiet(job,
        document.querySelector(`[data-ccmo="${CSS.escape(job)}"]`));
    }
  });
}

/*
 * `nav` chỉ nổ khi NGƯỜI đổi view. Vào thẳng `/chung-cat/` bằng URL thì không
 * có sự kiện nào, nên phải gọi một lần ở đây — cùng lý do `multiwindow` gọi
 * tay `khoiDong()` sau khi đăng ký listener.
 */
/* ═══ T03-94 · MÀN HÀNG ĐỢI NHÁP `/chung-cat/nhap/` (FR-046) ═════════════
 *
 * Nguồn: năm cửa `T08-22` (`web/api/nhap-cua.mjs`) — cửa của NGƯỜI, không mang
 * khoá dịch vụ. Chi tiết trả CẢ HAI bản trong MỘT lời gọi, nên diff dựng được
 * mà không phải hỏi lần thứ hai.
 *
 * ĐÂY LÀ MÀN NGƯỜI KÝ DUYỆT một bản do máy viết. Ba quyết định đều từ đó:
 *
 *   1 · `⚠ đã tỉa N` dựng **TRƯỚC** nút Duyệt. Một bản bị cắt bớt khẳng định mà
 *       không nói ra thì người duyệt ký vào bản đã bị tỉa và tin đó là bản đầy
 *       đủ — không hiện là NÓI DỐI, không phải thiếu sót.
 *   2 · Bản chưa ai sửa **NÓI RA** "trùng bản AI gốc". Im lặng đọc ra như "chưa
 *       tải xong", và người sẽ đợi một thứ không bao giờ tới.
 *   3 · BA nút, không bốn. `FR-046 §1` chưa có trạng thái nào nghĩa "đã bỏ" nên
 *       `T08-22` cố ý không mở cửa Xoá — `S18` cấm render nút gọi đường chưa có.
 *
 * 0 BYTE HTML/CSS MỚI: khung dựng ở đây, cắm vào `v-chungcatnhap` (mốc rỗng);
 * mọi class là class đã có (`.pn` · `.kp` · `.cd` · `.al` · `.bt` · `.empty`).
 */
let NHAP_DS = [];
let NHAP_CHON = null;

function nhapThe(v) {
  const tt = String(v.trang_thai ?? "nhap");
  /* `st-*` là class ĐÃ CÓ của `.cd`. Bốn trạng thái FR-046 ánh xạ về ba màu mà
     CSS biết — `tra_lai` đỏ vì nó là thứ người phải xử lý lại. */
  const st = tt === "tra_lai" ? "st-rejected" : tt === "da_duyet" ? "st-approved" : "st-draft";
  const mau = tt === "tra_lai" ? "var(--warn)" : tt === "da_duyet" ? "var(--ok)" : "var(--ink-3)";
  /* Số khẳng định bị tỉa — cột `khang_dinh_bi_tia` là JSON, `null` khi CHƯA ĐO.
     `null` và `{so:0}` đọc ra hai câu khác nhau, nên không gộp chúng. */
  const tia = nhapDemTia(v.khang_dinh_bi_tia);
  /*
   * MỘT MỐC cho một việc: `data-ccnhap` (`WO-062`).
   *
   * Bug chủ dự án bắt 2026-09-06: bấm thẻ ở hàng đợi nháp KHÔNG mở được bản
   * chưng cất. Gốc: thẻ mang `data-nhapmo` còn phép mở cửa sổ nghe
   * `data-ccnhap` — hai mốc cho một việc, và mốc thứ hai không ai nối dây.
   *
   * TIÊU ĐỀ là SLUG NGUỒN, không phải ULID cắt 12 ký tự. `c2817aee42ca` định
   * danh được cho máy và không nói gì cho người đang chọn bản nào để duyệt.
   */
  const ten = String(v.slug_nhap || v.nguon || v.job_ulid || "");
  /*
   * KHÔNG `${cu}` ở đây — đó là vết copy từ `viecThe` (thẻ HÀNG VIỆC), nơi có
   * `const cu = laCu ? " cct-cu" : ""`. Ở hàng NHÁP khái niệm *"bản cũ"* không
   * tồn tại: nháp cũ đã vào `da_bo` qua `donBanCu`, và danh sách này đọc từ DB
   * chứ không phải từ hàng đợi.
   *
   * `ReferenceError: cu is not defined` — chủ dự án bắt 2026-09-07. Nó qua được
   * mọi cổng vì hàm này chỉ CHẠY khi có dữ liệu: suốt lúc hàng nháp trống, nó
   * không được gọi lần nào. Bản chưng cất đầu tiên vào kho là lần đầu nó chạy,
   * và đó đúng là lúc chủ dự án mở màn.
   */
  return `<button type="button" class="cd ${st}" data-ccnhap="${esc(v.job_ulid)}"`
    + ` style="border-top-color:${mau}" title="${esc(ten)}">`
    + `<i class="tg"><b style="background:${mau}">${esc(tt)}</b></i>`
    + `<h4>${esc(ten.length > 42 ? ten.slice(0, 42) + "…" : ten)}</h4>`
    + (tia > 0 ? `<div class="mt"><span class="ex">⚠ đã tỉa ${tia}</span></div>` : "")
    + (v.ly_do ? `<div class="mt">${esc(String(v.ly_do).slice(0, 60))}</div>` : "")
    + "</button>";
}

/** Số khẳng định bị tỉa. Trả `-1` khi CHƯA ĐO — khác hẳn `0` (đo ra không có). */
function nhapDemTia(raw) {
  if (raw == null) return -1;
  try {
    const j = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof j?.so === "number") return j.so;
    return Array.isArray(j) ? j.length : -1;
  } catch { return -1; }
}

function nhapDungKhung() {
  const view = document.getElementById("v-chungcatnhap");
  if (!view || view.dataset.xong) return null;
  view.dataset.xong = "1";
  const goc = document.createElement("section");
  goc.className = "pn";
  goc.id = "nhap-goc";
  view.appendChild(goc);
  goc.innerHTML =
    '<div class="pn-h"><i class="dot"></i><h2>Hàng đợi nháp</h2><span class="ln"></span>'
    + '<span class="c" id="nhap-dem"></span></div>' 
    + '<p class="al" id="nhap-canh" hidden></p>'
    + '<div class="grid" id="nhap-ds"></div><p class="empty" id="nhap-rong" hidden></p>'
    + '<div class="pn-h" id="nhap-ct-h" hidden><h2>Bản nháp</h2><span class="ln"></span>'
    + '<button class="bt ghost sm" data-nhapdong>Đóng</button></div>' 
    + '<div id="nhap-ct" hidden></div>';
  return goc;
}

async function nhapNap() {
  const luoi = document.getElementById("nhap-ds");
  if (!luoi) return;
  const canh = document.getElementById("nhap-canh");
  const rong = document.getElementById("nhap-rong");
  const dem = document.getElementById("nhap-dem");
  try {
    const r = await fetch("/api/nhap-chung-cat?n=50");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? `dịch vụ trả ${r.status}`);
    NHAP_DS = j.dong ?? [];
    if (canh) canh.hidden = true;
    luoi.innerHTML = NHAP_DS.map(nhapThe).join("");
    if (rong) {
      rong.hidden = NHAP_DS.length > 0;
      rong.textContent = NHAP_DS.length ? ""
        : "Chưa có bản nháp nào — chưng cất một tài liệu rồi quay lại.";
    }
    if (dem) dem.textContent = `${j.tong ?? NHAP_DS.length} nháp`;
  } catch (e) {
    /* "Không có nháp nào" và "không hỏi được ai cả" là HAI CÂU, và hai hành
       động. Gộp chúng là nói SAI ở ca thứ hai. */
    NHAP_DS = [];
    luoi.innerHTML = "";
    if (rong) { rong.hidden = true; rong.textContent = ""; }
    if (canh) {
      canh.hidden = false;
      canh.textContent = "KHÔNG hỏi được hàng đợi nháp — " + String(e.message ?? e)
        + ". Đây KHÔNG phải 'chưa có nháp nào'.";
    }
  }
}

/** Diff thô theo DÒNG — del/ins, đủ để thấy người đã sửa gì so với bản máy. */
function nhapDiff(goc, moi) {
  const a = String(goc ?? "").split("\n");
  const b = String(moi ?? "").split("\n");
  const setA = new Set(a);
  const setB = new Set(b);
  const ra = [];
  for (const d of a) if (!setB.has(d)) ra.push(`<div class="mt">− ${esc(d)}</div>`);
  for (const d of b) if (!setA.has(d)) ra.push(`<div class="mt">+ ${esc(d)}</div>`);
  return ra.join("");
}

async function nhapMo(ulid) {
  const h = document.getElementById("nhap-ct-h");
  const o = document.getElementById("nhap-ct");
  if (!h || !o) return;
  h.hidden = false;
  o.hidden = false;
  o.innerHTML = '<p class="ld">Đang đọc…</p>';
  const u = new URL(location.href);
  u.searchParams.set("nhap", ulid);
  history.replaceState(null, "", u);
  try {
    const r = await fetch("/api/nhap-chung-cat/" + encodeURIComponent(ulid));
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) {
      o.innerHTML = `<p class="al">Không có nháp <code>${esc(ulid)}</code>.</p>`;
      return;
    }
    if (!r.ok) throw new Error(j.loi ?? `dịch vụ trả ${r.status}`);
    NHAP_CHON = j;
    const tia = nhapDemTia(j.khang_dinh_bi_tia);
    const giong = j.ban_goc_ai === j.ban_hien_tai;
    /*
     * THỨ TỰ DỰNG LÀ CẢ LUẬT: cảnh báo "đã tỉa" đứng TRƯỚC cụm nút. Người
     * duyệt đọc từ trên xuống, và một cảnh báo nằm dưới nút Duyệt là một cảnh
     * báo họ thấy SAU khi đã ký.
     */
    o.innerHTML =
      (tia > 0
        ? `<p class="al">⚠ đã tỉa ${tia} khẳng định khỏi bản này — bản bạn sắp`
          + " duyệt KHÔNG phải bản máy viết ra ban đầu.</p>"
        : tia === 0
          ? '<p class="mt">Không khẳng định nào bị tỉa.</p>'
          : '<p class="al">CHƯA ĐO số khẳng định bị tỉa — khác với "không có".</p>')
      + `<dl><dt>việc</dt><dd>${esc(j.job_ulid)}</dd>`
      + `<dt>trạng thái</dt><dd>${esc(j.trang_thai)}</dd>`
      + (j.ly_do ? `<dt>lý do trả lại</dt><dd>${esc(j.ly_do)}</dd>` : "")
      + "</dl>"
      + '<div class="pn-h"><h2>Khác gì bản AI?</h2><span class="ln"></span></div>'
      + (giong
        ? '<p class="mt">Trùng bản AI gốc — chưa ai sửa dòng nào.</p>'
        : nhapDiff(j.ban_goc_ai, j.ban_hien_tai))
      /* BA nút. Xoá KHÔNG có: `FR-046` chưa khai trạng thái "đã bỏ", nên
         `T08-22` chưa mở cửa đó, và `S18` cấm render nút gọi đường chưa có. */
      + '<span class="f-act"><button class="bt" data-nhapact="cc-duyet">Duyệt vào kho</button>'
      + '<button class="bt ghost" data-nhapact="cc-sua">Sửa</button>'
      + '<button class="bt ghost" data-nhapact="cc-tra">Trả lại…</button></span>'
      + '<pre class="f-kq" id="nhap-kq" hidden></pre>';
  } catch (e) {
    o.innerHTML = `<p class="al">${esc(String(e.message ?? e))}</p>`;
  }
}

function nhapKq(chu, loi) {
  const o = document.getElementById("nhap-kq");
  if (!o) return;
  o.hidden = false;
  o.textContent = chu;
  o.className = "f-kq" + (loi ? " loi" : "");
}

async function nhapHanhDong(act) {
  if (!NHAP_CHON) return;
  const ulid = NHAP_CHON.job_ulid;
  if (act === "cc-sua") {
    /* Sửa mở đúng bản hiện tại để người biên tập. Chưa có màn soạn riêng cho
       nháp, nên lượt này chỉ gửi lại bản hiện tại — cửa `…/sua` đã có, và màn
       soạn là một đơn vị khác. Nói thẳng thay vì làm một nút giả. */
    nhapKq("Màn soạn nháp chưa dựng — cửa `…/sua` đã có, đơn vị sau nối vào.", true);
    return;
  }
  if (act === "cc-tra") {
    /* `<dialog>`, KHÔNG `prompt()` — `FR-022` cấm hộp thoại của trình duyệt.
     *
     * Chỗ này sót lại sau `FR-022`, và cổng `chunk-tu-chua` (`WO-059`) tìm ra
     * nó vì `prompt` là một định danh chunk không tự khai. Bản `cctab` đã hỏi
     * bằng `<dialog>` từ `T03-113`; đây là bản còn dùng hộp thoại cũ.
     *
     * `prompt()` không chỉ xấu: nó KHOÁ CỨNG cả tab, không theo được giao
     * diện, và trên vài trình duyệt bị chặn hẳn — lúc đó nút im lặng không làm
     * gì, đúng kiểu hỏng người dùng không giải thích được. */
    hoiLyDoTra(ulid);
    return;
  }
  await nhapGoi(`/api/nhap-chung-cat/${encodeURIComponent(ulid)}/duyet`, {});
}

function hoiLyDoTra(ulid) {
  const d = document.createElement("dialog");
  d.className = "dlg";
  d.innerHTML = '<form method="dialog"><div class="dlg-h"><h3>Trả lại bản nháp</h3></div>'
    + '<p class="dlg-canh">Ghi rõ phải sửa gì — người nhận chỉ đọc câu này.</p>'
    + '<textarea class="f-in" data-ly rows="3" placeholder="Ví dụ: mục 4 chưa dẫn nguồn"></textarea>'
    + '<span class="f-act"><button class="bt" data-huy>Đóng</button>'
    + '<button class="bt pri" data-gui>Trả lại</button></span></form>';
  document.body.append(d);
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("[data-huy]")) return d.close();
    if (!t.closest("[data-gui]")) return;
    e.preventDefault();
    const ly = String(d.querySelector("[data-ly]")?.value || "").trim();
    // Ngưỡng 5 ký tự giữ nguyên từ bản `prompt` — nó là LUẬT, không phải chi
    // tiết của hộp thoại, nên đổi cách hỏi không được đổi nó.
    if (ly.length < 5) { nhapKq("Lý do quá ngắn — cần ít nhất 5 ký tự.", true); return; }
    void nhapGoi(`/api/nhap-chung-cat/${encodeURIComponent(ulid)}/tra-lai`,
      { ly_do: ly }).then(() => d.close());
  });
  d.showModal();
}

async function nhapGoi(duong, than) {
  try {
    const r = await fetch(duong, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(than),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      /* `loi_validate` là NGUYÊN VĂN từng cổng đỏ. Rút gọn nó thành "không hợp
         lệ" là lấy đi đúng thứ người duyệt cần để sửa. */
      nhapKq(j.loi_validate ?? j.loi ?? `dịch vụ trả ${r.status}`, true);
      return;
    }
    nhapKq(j.path ? `Đã ghi vào kho: ${j.path}` : `Xong — trạng thái ${j.trang_thai}`, false);
    await nhapNap();
    await nhapMo(NHAP_CHON.job_ulid);
  } catch (e) {
    nhapKq(String(e.message ?? e), true);
  }
}

function nhapKhoiDong() {
  if (!nhapDungKhung()) return;
  void nhapNap().then(() => {
    const id = new URL(location.href).searchParams.get("nhap");
    if (id) void nhapMo(id);
  });
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  /* `data-nhapmo` KHÔNG còn thẻ nào phát ra — giữ nhánh cho đường sâu
     `?nhap=<ulid>` (mở panel trong trang khi người dán thẳng URL). */
  const the = t.closest("[data-nhapmo]");
  if (the) { e.preventDefault(); void nhapMo(the.dataset.nhapmo ?? ""); return; }
  const act = t.closest("[data-nhapact]");
  if (act) { e.preventDefault(); void nhapHanhDong(act.dataset.nhapact ?? ""); return; }
  if (t.closest("[data-nhapdong]")) {
    e.preventDefault();
    for (const id of ["nhap-ct-h", "nhap-ct"]) {
      const x = document.getElementById(id);
      if (x) x.hidden = true;
    }
    const u = new URL(location.href);
    u.searchParams.delete("nhap");
    history.replaceState(null, "", u);
  }
});

document.addEventListener("nav", () => { nhapKhoiDong(); });
nhapKhoiDong();

document.addEventListener("nav", () => { ccKhoiDong(); });
ccKhoiDong();
