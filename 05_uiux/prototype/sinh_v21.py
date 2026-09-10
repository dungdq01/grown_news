# -*- coding: utf-8 -*-
"""Sinh `app-v21.html` — mock đợt hai (M12–M16), s5-prototype.

Vì sao SINH chứ không viết tay: dữ liệu mock phải là CHÍNH các file
`contracts/*.sample.v1.json` (data contract có version). Chép tay JSON vào HTML
là hai nguồn sự thật — lệch im lặng. Script này inline contracts lúc sinh;
đổi contract thì chạy lại:  python 05_uiux/prototype/sinh_v21.py

app-v20.html là FROZEN v1 (đợt một) — KHÔNG đụng. v21 là bản đợt hai, file mới.
Token: link ../tokens.css tương đối — mở bằng file:// vẫn ăn token thật.
"""
import json
import pathlib

DAY = pathlib.Path(__file__).resolve().parent
C = DAY.parent / "contracts"

data = {ten: json.loads((C / f"{ten}.sample.v1.json").read_text(encoding="utf-8"))
        for ten in ("chungcat", "truyhoi", "chatbot", "kenh", "artifact")}

TEMPLATE = r"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grown_news — mock đợt hai (M12–M16)</title>
<link rel="stylesheet" href="../tokens.css">
<style>
/* Mock đợt hai — token từ ../tokens.css, fallback cho token thiếu.
   Luật chữ (DESIGN): menu ĐẬM THẲNG · header = nội dung cùng cỡ khác weight ·
   ghi chú/cảnh báo NGHIÊNG. */
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{font:400 14px/1.55 Inter,"Segoe UI",system-ui,sans-serif;
  background:var(--background,#fcf9f2);color:var(--foreground,var(--ink,#1c1917));
  display:flex}
button{font:inherit;cursor:pointer}
/* ── sidebar ── */
.sb{width:200px;flex:none;border-right:1px solid var(--border,#dbd3c0);
  padding:14px 10px;display:flex;flex-direction:column;gap:4px;
  background:var(--card,rgba(250,246,237,.72))}
.sb .logo{width:34px;height:34px;border-radius:9px;background:var(--brand,#c81e1e);
  color:#fff;font-weight:700;display:grid;place-items:center;margin-bottom:10px}
.sb button{display:block;width:100%;text-align:left;padding:8px 10px;
  border:1px solid transparent;border-radius:8px;background:none;
  font-weight:600;color:inherit}
.sb button.on{border-color:color-mix(in srgb,var(--brand,#c81e1e) 55%,var(--border,#dbd3c0));
  background:var(--accent,#f4ede1)}
.sb .chu{margin-top:auto;font-size:11px;font-style:italic;color:var(--ink-2,#78716c)}
/* ── khung màn ── */
main{flex:1;overflow:auto;padding:20px 24px}
.man{display:none;max-width:1060px;margin:0 auto}
.man.on{display:block}
h1{font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.sub{font-style:italic;color:var(--ink-2,#78716c);margin-bottom:14px}
.hang{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}
.cot1{flex:1 1 260px}.cot2{flex:2 1 480px}
.panel{background:var(--card,rgba(250,246,237,.72));border:1px solid var(--border,#dbd3c0);
  border-radius:12px;padding:14px;margin-bottom:14px}
.panel h2{font-size:14px;font-weight:700;margin-bottom:8px}
/* ── state switcher (giàn giáo duyệt 3 state) ── */
.states{display:flex;gap:6px;margin-bottom:14px}
.states button{padding:3px 10px;border-radius:99px;border:1px solid var(--border,#dbd3c0);
  background:none;font-size:12px;font-weight:600}
.states button.on{background:var(--brand,#c81e1e);color:#fff;border-color:var(--brand,#c81e1e)}
.empty,.err{font-style:italic;color:var(--ink-2,#78716c);padding:18px;text-align:center}
.err{color:var(--brand,#c81e1e)}
.skel{height:14px;border-radius:6px;background:var(--muted,#f0eadc);margin:10px 0;
  animation:tho 1.1s ease 1}
@keyframes tho{0%{opacity:.35}55%{opacity:1}100%{opacity:.7}}
/* ── badge/chip ── */
.bd{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:600}
.bd-new{background:var(--muted,#f0eadc)}
.bd-run{background:#fde68a}
.bd-ok{background:#bbf7d0}
.bd-loi{background:#fecaca}
.chip{display:inline-block;padding:2px 9px;border-radius:99px;font-size:12px;
  border:1px solid var(--border,#dbd3c0);background:var(--secondary,#f0eadc);cursor:pointer}
.chip.cit{border-color:color-mix(in srgb,var(--brand,#c81e1e) 45%,var(--border,#dbd3c0));font-weight:600}
.mono{font-family:Consolas,monospace;font-size:12px}
.ghi{font-style:italic;color:var(--ink-2,#78716c);font-size:12px}
table{border-collapse:collapse;width:100%;font-size:13px}
td,th{padding:5px 8px;border-bottom:1px solid var(--border,#dbd3c0);text-align:left;vertical-align:top}
th{font-weight:700;font-size:12px}
/* ── job card (SCR-07) ── */
.job{border:1px solid var(--border,#dbd3c0);border-radius:10px;padding:10px 12px;margin-bottom:10px;background:var(--popover,var(--card,#faf6ed))}
.job .dau{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.job .att{margin-top:6px;font-size:12px;color:var(--ink-2,#78716c)}
.nl{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:8px}
.nl:hover{background:var(--accent,#f4ede1)}
.nl input{accent-color:var(--brand,#c81e1e)}
/* ── kết quả tra cứu (SCR-08) ── */
.kq{padding:10px 4px;border-bottom:1px solid var(--border,#dbd3c0)}
.kq b{font-weight:600}
.kq .dc{font-size:12px;color:var(--ink-2,#78716c)}
.kq .dc a{color:var(--brand,#c81e1e);cursor:pointer;text-decoration:underline}
mark{background:color-mix(in srgb,var(--brand,#c81e1e) 22%,transparent);border-radius:3px;padding:0 2px}
/* ── chat (SCR-09) ── */
.chat{display:flex;flex-direction:column;gap:10px;min-height:220px}
.msg{max-width:82%;padding:9px 12px;border-radius:12px}
.msg.q{align-self:flex-end;background:var(--accent,#f4ede1);border:1px solid var(--border,#dbd3c0)}
.msg.a{align-self:flex-start;background:var(--card,#faf6ed);border:1px solid var(--border,#dbd3c0)}
.msg.tc{align-self:flex-start;font-style:italic;border:1px solid var(--border,#dbd3c0);
  background:var(--muted,#f0eadc);border-left:3px solid var(--brand,#c81e1e)}
.msg .blk{margin-bottom:6px}
.msg .blk.co{border:1px dashed var(--brand,#c81e1e);padding:6px 8px;border-radius:8px;font-style:italic}
.msg .blk.co::before{content:"⚑ thiếu nguồn — không được tính là trả lời";display:block;
  font-size:11px;font-weight:700;color:var(--brand,#c81e1e);font-style:normal;margin-bottom:3px}
.phien button{margin-right:6px}
/* ── cửa sổ đọc (multiwindow mock) ── */
.cs{position:fixed;right:28px;top:48px;width:min(560px,80vw);max-height:78vh;z-index:50;
  background:var(--popover,var(--card,#fcf9f2));border-radius:12px;display:none;flex-direction:column;
  border:1px solid color-mix(in srgb,var(--brand,#c81e1e) 55%,var(--edge,#dbd3c0));
  box-shadow:0 18px 50px rgba(0,0,0,.28)}
.cs.on{display:flex}
.cs .tb{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border,#dbd3c0);font-weight:700}
.cs .tb .nut{margin-left:auto;display:flex;gap:6px}
.cs .tb .nut button{width:22px;height:22px;border-radius:6px;border:1px solid var(--border,#dbd3c0);background:none}
.cs .than{overflow:auto;padding:14px 16px}
.cs .than h3{font-size:14px;font-weight:700;margin:14px 0 6px;scroll-margin-top:12px}
.cs .than h3.diem{outline:2px solid var(--brand,#c81e1e);outline-offset:4px;border-radius:4px}
.cs .than p{margin-bottom:8px}
/* ── modal JSON ── */
.md-json{position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;place-items:center;z-index:60}
.md-json.on{display:grid}
.md-json pre{background:var(--card,#faf6ed);border:1px solid var(--border,#dbd3c0);border-radius:12px;
  padding:16px;max-width:min(720px,90vw);max-height:80vh;overflow:auto;font-size:12px}
.audit{background:var(--accent,#f4ede1);border-left:3px solid var(--brand,#c81e1e);
  padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;display:inline-block}
</style>
</head>
<body>
<nav class="sb">
  <div class="logo">G</div>
  <button data-m="m12" class="on">Chưng cất</button>
  <button data-m="m13">Tra cứu kho</button>
  <button data-m="m14">Hỏi kho</button>
  <button data-m="m15">Kênh</button>
  <button data-m="m16">Artifact</button>
  <button id="theme" style="font-weight:400">◐ sáng/tối</button>
  <div class="chu">MOCK đợt hai · s5<br>app-v20 = đợt một (frozen)</div>
</nav>
<main>

<section class="man on" id="m12">
  <h1>Chưng cất — M12</h1>
  <p class="sub">nguyên liệu thu-vien → bản nháp 5 mục vào _inbox/ · mỗi lần gọi model = một dòng sha256 (FR-043 bậc 4) · retry cap 2</p>
  <div class="states" data-cho="m12"><button class="on" data-s="du">dữ liệu</button><button data-s="empty">empty</button><button data-s="loading">loading</button><button data-s="error">error</button></div>
  <div data-state="du">
    <div class="hang">
      <div class="cot1 panel">
        <h2>Nguyên liệu (thu-vien)</h2>
        <div id="ds-nl"></div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="chip" id="nut-chung">Chưng cất</button>
          <button class="chip" id="nut-tong" disabled>Tổng hợp (chọn ≥ 2)</button>
        </div>
        <p class="ghi" style="margin-top:8px">Tổng hợp = hồ sơ tong-hop (FR-044): nguon ≥ 2, địa chỉ mang tên nguồn [slug:p.7]</p>
      </div>
      <div class="cot2 panel">
        <h2>Hàng đợi (_inbox/ · Maildir · ULID = idempotency key)</h2>
        <div id="ds-job"></div>
      </div>
    </div>
    <div class="panel" id="xem-nhap" style="display:none">
      <h2>Xem trước bản nháp — <span id="nhap-title"></span></h2>
      <p>citations_sampled = <b id="nhap-s"></b> · citations_verified = <b id="nhap-v"></b>
        <span class="ghi">— số do MÁY đếm (B-A6), màn chỉ hiển thị</span></p>
      <p id="nhap-muc" style="margin-top:6px"></p>
      <button class="chip" style="margin-top:8px">→ đẩy vào _inbox/ (dừng ở draft — M05-R1)</button>
    </div>
  </div>
  <div data-state="empty" style="display:none" class="panel"><p class="empty">Kho không còn nguyên liệu thu-vien chưa chưng. Nạp thêm ở màn Bài viết / Tài liệu / Video.</p></div>
  <div data-state="loading" style="display:none" class="panel"><div class="skel" style="width:70%"></div><div class="skel" style="width:45%"></div><div class="skel" style="width:60%"></div></div>
  <div data-state="error" style="display:none" class="panel"><p class="err">Worker chưng cất không chạy — bật:  python chungcat/worker.py · hàng đợi vẫn giữ job, không mất.</p></div>
</section>

<section class="man" id="m13">
  <h1>Tra cứu kho — M13</h1>
  <p class="sub">trả về ĐOẠN kèm địa chỉ file#anchor + dòng · phạm vi là control hiển thị · bm25 càng âm càng khớp</p>
  <div class="states" data-cho="m13"><button class="on" data-s="du">dữ liệu</button><button data-s="empty">empty</button><button data-s="loading">loading</button><button data-s="error">error</button></div>
  <div data-state="du" class="panel">
    <div style="display:flex;gap:8px">
      <input id="q" style="flex:1;padding:8px 12px;border:1px solid var(--input,#dbd3c0);border-radius:8px;background:var(--background,#fff);color:inherit" placeholder="hỏi kho…">
      <button class="chip" id="nut-tim">Tìm</button>
    </div>
    <div id="phamvi" style="margin:8px 0"></div>
    <p class="ghi">thử: <a href="#" class="qmau">vì sao khai triển bậc hai</a> · <a href="#" class="qmau">bac hai khong dau</a> · <a href="#" class="qmau">記憶體 最佳化</a> · <a href="#" class="qmau">retry vô hạn</a></p>
    <div id="kq"></div>
  </div>
  <div data-state="empty" style="display:none" class="panel"><p class="empty">0 kết quả trên TOÀN KHO cho «…» — kho hiện có 3 bản ghi · 8 đoạn.</p></div>
  <div data-state="loading" style="display:none" class="panel"><div class="skel" style="width:80%"></div><div class="skel" style="width:65%"></div><div class="skel" style="width:72%"></div></div>
  <div data-state="error" style="display:none" class="panel"><p class="err">Chỉ mục chưa dựng. Chỉ mục là dữ liệu DẪN XUẤT — dựng lại được từ kho:  python truyhoi/danh_chi_muc.py</p></div>
</section>

<section class="man" id="m14">
  <h1>Hỏi kho — M14</h1>
  <p class="sub">mọi khẳng định kèm địa chỉ bấm được · ngoài kho ⇒ từ chối CÓ PHÂN LOẠI · web chỉ là client #1 của service</p>
  <div class="states" data-cho="m14"><button class="on" data-s="du">dữ liệu</button><button data-s="empty">empty</button><button data-s="loading">loading</button><button data-s="error">error</button></div>
  <div data-state="du" class="panel">
    <div class="phien" style="margin-bottom:10px">phiên:
      <button class="chip on" data-ph="ph-01">dung.dang · web</button>
      <button class="chip" data-ph="ph-02">dong.nghiep-a · telegram</button>
      <span class="ghi">— hai account, hai phiên, không thấy ngữ cảnh của nhau (FR-045)</span>
    </div>
    <div class="chat" id="chat"></div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <input id="hoi" style="flex:1;padding:8px 12px;border:1px solid var(--input,#dbd3c0);border-radius:8px;background:var(--background,#fff);color:inherit" placeholder="hỏi trên kho…">
      <button class="chip" id="nut-hoi">Hỏi</button>
      <button class="chip" id="nut-json">xem JSON</button>
    </div>
    <p class="ghi" style="margin-top:6px">câu mẫu: <span id="ds-cau"></span></p>
  </div>
  <div data-state="empty" style="display:none" class="panel"><p class="empty">Chưa có hội thoại. Bốn câu mẫu ở dưới là lối vào.</p></div>
  <div data-state="loading" style="display:none" class="panel"><p class="ghi">đang truy hồi…</p><div class="skel" style="width:55%"></div><p class="ghi">đang soạn…</p><div class="skel" style="width:75%"></div></div>
  <div data-state="error" style="display:none" class="panel"><p class="err">Service chatbot không chạy (cổng 8791) — đây là LỖI HẠ TẦNG, khác với TỪ CHỐI của bot.</p></div>
</section>

<section class="man" id="m15">
  <h1>Kênh — M15</h1>
  <p class="sub">adapter chỉ GỌI RA (long-poll / gateway) — không mở cổng nghe · định danh chat_id ↔ account thay allowlist phẳng (FR-045)</p>
  <div class="states" data-cho="m15"><button class="on" data-s="du">dữ liệu</button><button data-s="empty">empty</button><button data-s="loading">loading</button><button data-s="error">error</button></div>
  <div data-state="du">
    <div class="hang">
      <div class="cot1"><div class="panel"><h2>Adapter</h2><div id="ds-adapter"></div></div>
      <div class="panel"><h2>Định danh kênh</h2><table id="bg-dinhdanh"></table>
        <button class="chip" style="margin-top:8px">+ mã mời (ma_moi — một lần, hết hạn)</button></div></div>
      <div class="cot2 panel"><h2>Sự kiện (mới nhất trên)</h2><table id="bg-sukien"></table></div>
    </div>
  </div>
  <div data-state="empty" style="display:none" class="panel"><p class="empty">Chưa buộc chat_id nào. Tạo mã mời rồi nhắn mã đó cho bot từ tài khoản của bạn.</p></div>
  <div data-state="loading" style="display:none" class="panel"><p class="ghi">telegram: đang bắt tay getUpdates…</p><div class="skel" style="width:50%"></div></div>
  <div data-state="error" style="display:none" class="panel"><p class="err">Poll lỗi 3 lần liên tiếp (mạng). Update phía Telegram còn giữ 24h — chưa mất tin.</p></div>
</section>

<section class="man" id="m16">
  <h1>Artifact — M16</h1>
  <p class="sub">bài approved → slide · giọng đọc · video · artifact QUAY NGƯỢC làm input: file mang đường về nguồn (metadata + sidecar)</p>
  <div class="states" data-cho="m16"><button class="on" data-s="du">dữ liệu</button><button data-s="empty">empty</button><button data-s="loading">loading</button><button data-s="error">error</button></div>
  <div data-state="du">
    <div class="panel">chọn bài approved:
      <select id="chon-bai" style="padding:6px 10px;border:1px solid var(--input,#dbd3c0);border-radius:8px;background:var(--background,#fff);color:inherit">
        <option>xgboost-taylor-bac-hai</option><option>thien-duong-chuot-tuong-lai…</option>
      </select>
      <button class="chip">Slide</button> <button class="chip">Audio</button> <button class="chip">Video</button>
    </div>
    <div id="ds-af"></div>
  </div>
  <div data-state="empty" style="display:none" class="panel"><p class="empty">Kho chưa có bài approved — duyệt bài ở cửa sổ đọc trước.</p></div>
  <div data-state="loading" style="display:none" class="panel"><p class="ghi">đang sinh video — ffmpeg ghép slide + audio (bước 2/3) · job chạy PHÚT, hiện bước chứ không hiện %</p><div class="skel" style="width:66%"></div></div>
  <div data-state="error" style="display:none" class="panel"><p class="err">marp-cli exit 1 — heading cấp 4 vượt khung outline. Sửa outline rồi chạy lại.</p></div>
</section>

</main>

<div class="cs" id="cs">
  <div class="tb"><span id="cs-title">Cửa sổ đọc</span>
    <span class="nut"><button>−</button><button>□</button><button id="cs-dong">×</button></span></div>
  <div class="than" id="cs-than"></div>
</div>

<div class="md-json" id="md-json"><pre id="json-pre"></pre></div>

<script>
var DATA = __DATA__;

/* ── điều hướng + theme + state switcher ───────────────────── */
document.querySelectorAll(".sb button[data-m]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll(".sb button[data-m]").forEach(function(x){x.classList.remove("on")});
    document.querySelectorAll(".man").forEach(function(x){x.classList.remove("on")});
    b.classList.add("on");
    document.getElementById(b.dataset.m).classList.add("on");
  };
});
document.getElementById("theme").onclick = function(){
  var r = document.documentElement;
  r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark";
};
document.querySelectorAll(".states").forEach(function(sw){
  var man = sw.closest(".man");
  sw.querySelectorAll("button").forEach(function(b){
    b.onclick = function(){
      sw.querySelectorAll("button").forEach(function(x){x.classList.remove("on")});
      b.classList.add("on");
      man.querySelectorAll("[data-state]").forEach(function(k){
        k.style.display = k.dataset.state === b.dataset.s ? "" : "none";
      });
    };
  });
});

/* ── cửa sổ đọc: mở đúng anchor, highlight cited_text ──────── */
var BAI = {
  "vi-sao-bac-hai": {h:"3.2 Vì sao bậc hai", p:"Gradient bậc nhất chỉ cho biết hướng dốc. Khai triển bậc hai giữ được thông tin độ cong của hàm mất mát quanh dự đoán hiện tại, nên bước đi mỗi vòng chuẩn hơn. [xgboost-stap-by-step.pdf:p.7]"},
  "trong-so-la": {h:"3.4 Trọng số lá", p:"Với xấp xỉ bậc hai, mỗi lá có nghiệm đóng w* = -G/(H+lambda) — không cần line search. [xgboost-stap-by-step.pdf:p.9]"},
  "loi-tien-tri": {h:"2. Lời tiên tri", p:"Thí nghiệm Universe 25 thường bị đọc thành lời tiên tri cho xã hội loài người; bản ghi này tách phần dữ liệu khỏi phần suy diễn. [t=03:15]"},
  "muc-tieu-huan-luyen": {h:"Mục tiêu huấn luyện", p:"Hàm mất mát cộng regularization trên số lá và độ lớn trọng số — mục tiêu là cân bằng khớp dữ liệu với độ phức tạp cây. [p.2]"},
  "ket-luan": {h:"Kết luận", p:"Với chuỗi thời gian, walk-forward giữ thứ tự thời gian nên ước lượng sát vận hành thật hơn k-fold."},
  "danh-gia": {h:"Đánh giá", p:"Trong thí nghiệm của bài này, k-fold cho phương sai thấp hơn và không thua về bias trên tập tĩnh."}
};
function moCuaSo(doc, anchor, cited){
  var cs = document.getElementById("cs");
  document.getElementById("cs-title").textContent = (doc||"").split("/").pop();
  var than = document.getElementById("cs-than");
  than.innerHTML = "";
  Object.keys(BAI).forEach(function(a){
    var h = document.createElement("h3"); h.id = "a-"+a; h.textContent = BAI[a].h;
    if (a === anchor) h.className = "diem";
    var p = document.createElement("p");
    var text = BAI[a].p;
    if (a === anchor && cited && text.indexOf(cited) === -1) {
      text += " " + cited;   // đảm bảo cited_text nhìn thấy được trong mock
    }
    if (a === anchor && cited) {
      p.innerHTML = text.replace(cited, "<mark>"+cited+"</mark>");
    } else { p.textContent = text; }
    than.appendChild(h); than.appendChild(p);
  });
  cs.classList.add("on");
  var dich = document.getElementById("a-"+anchor);
  if (dich) dich.scrollIntoView({block:"start"});
}
document.getElementById("cs-dong").onclick = function(){ document.getElementById("cs").classList.remove("on"); };

/* ── SCR-07 Chưng cất ──────────────────────────────────────── */
var NL = ["xgboost-stap-by-step","thien-duong-chuot-tuong-lai-nhan-loai-giai-ma-loi-tien-tri-d","quartz-plugin-api","storm-multi-perspective"];
var dsNl = document.getElementById("ds-nl");
NL.forEach(function(s){
  var l = document.createElement("label"); l.className = "nl";
  l.innerHTML = '<input type="checkbox" value="'+s+'"> <span class="mono">'+s+'</span>';
  dsNl.appendChild(l);
});
dsNl.addEventListener("change", function(){
  var n = dsNl.querySelectorAll("input:checked").length;
  document.getElementById("nut-tong").disabled = n < 2;
});
var TT = {"new":["bd-new","NEW"],"processing":["bd-run","ĐANG CHẠY"],"done":["bd-ok","XONG"],"failed":["bd-loi","LỖI"]};
function veJobs(){
  var box = document.getElementById("ds-job"); box.innerHTML = "";
  DATA.chungcat.jobs.slice().reverse().forEach(function(j){
    var d = document.createElement("div"); d.className = "job";
    var tt = TT[j.trang_thai];
    var dau = '<div class="dau"><span class="bd '+tt[0]+'">'+tt[1]+'</span>'
      + '<span class="mono">'+j.id+'</span>'
      + '<b>'+(j.ho_so==="tong-hop" ? "tổng hợp: "+j.nguon.join(" + ") : (j.nguon_slug||""))+'</b></div>';
    var att = j.attempts.map(function(a,i){
      return '<div class="att">attempt '+(i+1)+' · '+a.model+' · sha256 <span class="mono">'+a.sha256_payload+'</span>'
        + (a.chi_phi_usd ? ' · $'+a.chi_phi_usd : '') + ' · '+a.ket_qua+'</div>';
    }).join("");
    var duoi = "";
    if (j.loi_hien_thi) duoi = '<p class="ghi" style="color:var(--brand)">'+j.loi_hien_thi+'</p>';
    if (j.trang_thai === "done") duoi = '<button class="chip" data-xem="'+j.id+'">xem bản nháp</button>';
    d.innerHTML = dau + att + duoi;
    box.appendChild(d);
  });
  box.querySelectorAll("[data-xem]").forEach(function(b){
    b.onclick = function(){
      var nx = DATA.chungcat.nhap_xem_truoc;
      document.getElementById("xem-nhap").style.display = "";
      document.getElementById("nhap-title").textContent = nx.title;
      document.getElementById("nhap-s").textContent = nx.citations_sampled;
      document.getElementById("nhap-v").textContent = nx.citations_verified;
      document.getElementById("nhap-muc").innerHTML = "<b>"+nx.muc[0].ten+"</b> — địa chỉ: "
        + nx.muc[0].dia_chi.map(function(x){return '<span class="mono">'+x+'</span>'}).join(" · ");
    };
  });
}
veJobs();
document.getElementById("nut-chung").onclick = function(){
  var chon = dsNl.querySelector("input:checked");
  var slug = chon ? chon.value : NL[3];
  var j = {id:"01K9W2MOCK"+String(DATA.chungcat.jobs.length+1).padStart(2,"0"), nguon_slug:slug,
    ho_so:"phan-tich", trang_thai:"new", attempts:[], ra_inbox:null};
  DATA.chungcat.jobs.push(j); veJobs();
  setTimeout(function(){ j.trang_thai="processing";
    j.attempts.push({model:"claude-sonnet-5", sha256_payload:"m0ck01…"+String(Date.now()%9999), chi_phi_usd:null, ket_qua:"dang-chay"});
    veJobs(); }, 900);
  setTimeout(function(){ j.trang_thai="done"; j.attempts[0].ket_qua="ok"; j.attempts[0].chi_phi_usd=0.058; veJobs(); }, 2600);
};
document.getElementById("nut-tong").onclick = function(){
  var chon = Array.prototype.map.call(dsNl.querySelectorAll("input:checked"), function(x){return x.value});
  var j = {id:"01K9W2MOCKTH", nguon_slug:null, ho_so:"tong-hop", nguon:chon, trang_thai:"processing",
    attempts:[{model:"gemini-3.7-flash", sha256_payload:"m0ckth…77", chi_phi_usd:null, ket_qua:"dang-chay"}], ra_inbox:null};
  DATA.chungcat.jobs.push(j); veJobs();
  setTimeout(function(){ j.trang_thai="done"; j.attempts[0].ket_qua="ok"; j.attempts[0].chi_phi_usd=0.036; veJobs(); }, 2200);
};

/* ── SCR-08 Tra cứu ────────────────────────────────────────── */
function veChip(pv){
  var el = document.getElementById("phamvi"); el.innerHTML = "";
  Object.keys(pv||{}).forEach(function(k){
    var c = document.createElement("span"); c.className = "chip";
    c.textContent = k+": "+pv[k]+" ×"; c.style.marginRight = "6px";
    el.appendChild(c);
  });
  if (!Object.keys(pv||{}).length) el.innerHTML = '<span class="ghi">phạm vi: toàn kho (bấm chip để bỏ)</span>';
}
veChip({});
function tim(q){
  var mau = DATA.truyhoi.truy_van_mau.find(function(m){return m.q === q});
  var kq = document.getElementById("kq"); kq.innerHTML = "";
  veChip(mau ? mau.pham_vi : {});
  if (!mau || !mau.ket_qua.length){
    var pv = mau && Object.keys(mau.pham_vi).length;
    kq.innerHTML = '<p class="empty">0 kết quả '+(pv ? 'trong phạm vi trên — <a href="#" style="color:var(--brand)">tìm toàn kho</a>' : 'trên TOÀN KHO')+' cho «'+q+'» · kho hiện có 3 bản ghi</p>';
    return;
  }
  mau.ket_qua.forEach(function(r){
    var c = DATA.truyhoi.chunks.find(function(x){return x.id === r.chunk_id});
    var d = document.createElement("div"); d.className = "kq";
    d.innerHTML = "<b>"+c.heading_path+"</b><br>"
      + r.snippet.replace(/«([^»]+)»/g, "<mark>$1</mark>") + '<div class="dc">'
      + '<a data-f="'+c.file+'" data-a="'+c.anchor+'">'+c.file+"#"+c.anchor+"</a>"
      + " · dòng "+c.line_start+"–"+c.line_end+" · bm25 "+r.bm25+"</div>";
    kq.appendChild(d);
  });
  kq.querySelectorAll("a[data-a]").forEach(function(a){
    a.onclick = function(e){ e.preventDefault(); moCuaSo(a.dataset.f, a.dataset.a, null); };
  });
}
document.getElementById("nut-tim").onclick = function(){ tim(document.getElementById("q").value.trim()); };
document.querySelectorAll(".qmau").forEach(function(a){
  a.onclick = function(e){ e.preventDefault(); document.getElementById("q").value = a.textContent; tim(a.textContent); };
});

/* ── SCR-09 Hỏi kho ────────────────────────────────────────── */
var phienOn = "ph-01";
var TC_NHAN = {"khong-co-trong-kho":"KHÔNG CÓ TRONG KHO","co-nhung-mau-thuan":"CÓ NHƯNG MÂU THUẪN","ngoai-pham-vi":"NGOÀI PHẠM VI"};
function veCauMau(){
  var el = document.getElementById("ds-cau"); el.innerHTML = "";
  DATA.chatbot.hoi_dap.filter(function(h){return h.phien === phienOn}).forEach(function(h){
    var a = document.createElement("a"); a.href = "#"; a.textContent = "«"+h.cau_hoi+"»";
    a.style.marginRight = "10px";
    a.onclick = function(e){ e.preventDefault(); hoi(h.cau_hoi); };
    el.appendChild(a);
  });
}
function hoi(cau){
  var chat = document.getElementById("chat");
  var q = document.createElement("div"); q.className = "msg q"; q.textContent = cau;
  chat.appendChild(q);
  var h = DATA.chatbot.hoi_dap.find(function(x){return x.cau_hoi === cau && x.phien === phienOn});
  var a = document.createElement("div");
  if (!h){ a.className = "msg tc"; a.innerHTML = '<span class="bd bd-new">MOCK</span> câu này chưa có trong data sample — dùng 4 câu mẫu.'; }
  else if (h.tu_choi){
    a.className = "msg tc";
    var dc = (h.tu_choi.dia_chi||[]).map(function(d){
      return '<span class="chip cit" data-f="'+d.doc_id+'" data-a="'+d.anchor+'">'+d.doc_id.split("/").pop()+"#"+d.anchor+"</span>";
    }).join(" ");
    a.innerHTML = '<span class="bd bd-loi">'+TC_NHAN[h.tu_choi.ly_do]+"</span> "+h.tu_choi.giai_thich
      + (dc ? "<br>"+dc : "")
      + (h.sha256_payload ? "" : '<br><span class="ghi">chặn trước retrieval — không gọi model, không có sha256</span>');
  } else {
    a.className = "msg a";
    a.innerHTML = h.blocks.map(function(b){
      var cit = b.citations.map(function(c){
        return '<span class="chip cit" data-f="'+c.doc_id+'" data-a="'+c.anchor+'" data-t="'+(c.cited_text||"")+'" title="'+(c.cited_text||"")+'">'
          + c.doc_id.split("/").pop().replace(".md","")+"#"+c.anchor+"</span>";
      }).join(" ");
      return '<div class="blk'+(b.citations.length ? "" : " co")+'">'+b.text+(cit ? "<br>"+cit : "")+"</div>";
    }).join("");
  }
  chat.appendChild(a);
  a.querySelectorAll(".chip.cit").forEach(function(c){
    c.onclick = function(){ moCuaSo(c.dataset.f, c.dataset.a, c.dataset.t || null); };
  });
  a.scrollIntoView({block:"end"});
}
document.querySelectorAll(".phien .chip[data-ph]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll(".phien .chip[data-ph]").forEach(function(x){x.classList.remove("on")});
    b.classList.add("on"); phienOn = b.dataset.ph;
    document.getElementById("chat").innerHTML = "";
    veCauMau();
  };
});
veCauMau();
document.getElementById("nut-hoi").onclick = function(){
  var v = document.getElementById("hoi").value.trim(); if (v) hoi(v);
  document.getElementById("hoi").value = "";
};
document.getElementById("nut-json").onclick = function(){
  document.getElementById("json-pre").textContent = JSON.stringify(DATA.chatbot.hoi_dap[0], null, 2);
  document.getElementById("md-json").classList.add("on");
};
document.getElementById("md-json").onclick = function(){ this.classList.remove("on"); };

/* ── SCR-10 Kênh ───────────────────────────────────────────── */
var ad = document.getElementById("ds-adapter");
DATA.kenh.adapters.forEach(function(a){
  var d = document.createElement("div"); d.className = "job";
  d.innerHTML = '<div class="dau"><span class="bd '+(a.trang_thai==="dang-poll"?"bd-ok":"bd-new")+'">'
    + (a.trang_thai==="dang-poll"?"ĐANG POLL":"TẮT")+"</span><b>"+a.kenh+"</b></div>"
    + (a.offset ? '<div class="att">offset <span class="mono">'+a.offset+"</span> · update cuối "+a.update_cuoi.slice(11,19)+"</div>" : "")
    + '<p class="ghi">'+a.ghi_chu+"</p>";
  ad.appendChild(d);
});
document.getElementById("bg-dinhdanh").innerHTML = "<tr><th>chat_id</th><th>account</th></tr>"
  + DATA.kenh.dinh_danh_kenh.map(function(r){
    return '<tr><td class="mono">'+r.chat_id+"</td><td><b>"+r.nguoi_dung+"</b></td></tr>";
  }).join("");
var KQ_NHAN = {"draft":["bd-ok","→ draft"],"tu-choi-dinh-danh":["bd-loi","TỪ CHỐI"],"tra-loi":["bd-ok","trả lời"],"loi-dinh-dang":["bd-run","SAI ĐỊNH DẠNG"],"gui-than-bai":["bd-run","GỬI THÂN BÀI"]};
document.getElementById("bg-sukien").innerHTML = "<tr><th>lúc</th><th>từ</th><th>nội dung</th><th>kết quả</th></tr>"
  + DATA.kenh.su_kien.slice().reverse().map(function(s){
    var n = KQ_NHAN[s.ket_qua];
    var duoi = s.audit ? '<div class="ghi">'+s.audit+"</div>" : "";
    if (s.thieu) duoi += '<div class="ghi">thiếu: <b>'+s.thieu.join(", ")+"</b></div>";
    if (s.audit_log) duoi += '<div class="audit">audit: '+s.audit_log.ai_nhan+" ← "+s.audit_log.bai+"</div>";
    return "<tr><td>"+s.luc.slice(11,16)+'</td><td class="mono">'+s.chat_id+"</td><td>"+s.noi_dung
      + '</td><td><span class="bd '+n[0]+'">'+n[1]+"</span>"+duoi+"</td></tr>";
  }).join("");

/* ── SCR-11 Artifact ───────────────────────────────────────── */
var AF_TT = {"xong":["bd-ok","XONG"],"dang-sinh":["bd-run","ĐANG SINH"],"loi":["bd-loi","LỖI"]};
var afBox = document.getElementById("ds-af");
DATA.artifact.artifacts.forEach(function(a){
  var d = document.createElement("div"); d.className = "panel";
  var tt = AF_TT[a.trang_thai];
  var files = (a.files||[]).map(function(f){
    return '<span class="chip">'+f.ten+" · "+f.kb+'KB</span> <span class="ghi">'+f.link_nguon+"</span>";
  }).join("<br>");
  var sc = "";
  if (a.sidecar) sc = '<table style="margin-top:8px"><tr><th>t</th><th>→ nguồn (bấm được)</th></tr>'
    + a.sidecar.map(function(r){
      var anchor = (r.url.split("#")[1]||"");
      return '<tr><td class="mono">'+r.t+'</td><td><a href="#" data-a="'+anchor+'" style="color:var(--brand)">'+r.url+"</a></td></tr>";
    }).join("") + "</table>";
  var tts = a.tts ? '<p class="ghi">TTS '+a.tts.provider+" · "+a.tts.ky_tu+" ký tự · "
    + (a.tts.sha256_payload ? 'text RỜI MÁY — sha256 <span class="mono">'+a.tts.sha256_payload+"</span>" : "<b>0 byte rời máy</b> (local)")+"</p>" : "";
  var eng = a.engine ? '<p class="ghi">outline '+a.engine.outline+' — sha256 <span class="mono">'+a.engine.sha256_payload+"</span> · render "+a.engine.render+"</p>" : "";
  d.innerHTML = '<div class="dau"><span class="bd '+tt[0]+'">'+tt[1]+"</span> <b>"+a.loai+"</b> · "
    + a.bai_slug+(a.thoi_gian_sinh_s ? " · "+a.thoi_gian_sinh_s+"s" : "")
    + (a.buoc_hien_tai ? ' · <span class="ghi">'+a.buoc_hien_tai+"</span>" : "")+"</div>"
    + (a.loi_hien_thi ? '<p class="err" style="text-align:left;padding:6px 0">'+a.loi_hien_thi+"</p>" : "")
    + eng + tts + (files ? "<p style='margin-top:6px'>"+files+"</p>" : "") + sc;
  afBox.appendChild(d);
});
afBox.querySelectorAll("a[data-a]").forEach(function(a){
  a.onclick = function(e){ e.preventDefault(); moCuaSo("kb/docs/xgboost-taylor-bac-hai.md", a.dataset.a || "vi-sao-bac-hai", null); };
});
</script>
</body>
</html>
"""

html = TEMPLATE.replace("__DATA__", json.dumps(data, ensure_ascii=False))
out = DAY / "app-v21.html"
out.write_text(html, encoding="utf-8")
print("wrote", out, out.stat().st_size, "bytes")
