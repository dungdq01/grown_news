# -*- coding: utf-8 -*-
"""Sinh bộ prototype ĐỢT HAI — theo MA TRẬN `05_uiux/ma-tran-module-man.md` v2.

Hai mặt UI: [N] len lỏi (cửa sổ đọc là trung tâm — rail phải 2 tab Hỏi/Sinh,
bôi đen thành chip ngữ cảnh, nút one-click) · [Q] quản lý theo LOẠI VIỆC
(Xưởng · Hàng đợi duyệt · Hội thoại · Kênh & tài khoản · Cấu hình).
Nối hai mặt: job id + toast-có-Xem + badge + deep-link ?job=.

Quyết định đã chốt 2026-09-02: nháp lưu DB (FR-046) · checkpoint giai đoạn
(Chạy-lại từ giai-đoạn-hỏng). Dữ liệu: contracts *.sample.v2.json.
Sinh lại:  python 05_uiux/prototype/sinh_dot_hai.py
"""
import json
import pathlib

DAY = pathlib.Path(__file__).resolve().parent
RA = DAY / "dot-hai"
RA.mkdir(exist_ok=True)
C = DAY.parent / "contracts"

# dọn bản cũ đã bị thay hình
for cu in list(RA.glob("m1*-*.html")) + [RA / "cua-so-chat.html"]:
    if isinstance(cu, pathlib.Path) and cu.exists():
        cu.unlink()

DATA = {ten: json.loads((C / f"{ten}.sample.v2.json").read_text(encoding="utf-8"))
        for ten in ("chungcat", "truyhoi", "chatbot", "kenh", "artifact")}
DATA_JS = json.dumps(DATA, ensure_ascii=False)

CSS = r"""
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{font:400 14px/1.55 Inter,"Segoe UI",system-ui,sans-serif;
  background:var(--background,#fcf9f2);color:var(--foreground,var(--ink,#1c1917));display:flex}
button{font:inherit;cursor:pointer}
a{color:inherit}
.sb{width:214px;flex:none;border-right:1px solid var(--border,#dbd3c0);
  padding:14px 10px;display:flex;flex-direction:column;gap:3px;
  background:var(--card,rgba(250,246,237,.72))}
.sb .logo{width:34px;height:34px;border-radius:9px;background:var(--brand,#c81e1e);
  color:#fff;font-weight:700;display:grid;place-items:center;margin-bottom:10px}
.sb a{display:block;padding:6px 10px;border:1px solid transparent;border-radius:8px;
  font-weight:600;text-decoration:none;position:relative}
.sb a.on{border-color:color-mix(in srgb,var(--brand,#c81e1e) 55%,var(--border,#dbd3c0));
  background:var(--accent,#f4ede1)}
.sb .nhom{font-size:10px;letter-spacing:.08em;color:var(--ink-2,#78716c);margin:8px 0 2px;text-transform:uppercase}
.sb .chu{margin-top:auto;font-size:11px;font-style:italic;color:var(--ink-2,#78716c)}
.sb button{display:block;width:100%;text-align:left;padding:6px 10px;border:none;background:none;color:inherit}
.badge{position:absolute;right:8px;top:6px;background:var(--brand,#c81e1e);color:#fff;
  border-radius:99px;font-size:10px;font-weight:700;padding:0 6px}
main{flex:1;overflow:auto;padding:20px 24px}
.man{max-width:1120px;margin:0 auto}
h1{font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.sub{font-style:italic;color:var(--ink-2,#78716c);margin-bottom:14px}
.hang{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}
.cot1{flex:1 1 280px}.cot2{flex:2 1 460px}
.panel{background:var(--card,rgba(250,246,237,.72));border:1px solid var(--border,#dbd3c0);
  border-radius:12px;padding:14px;margin-bottom:14px}
.panel h2{font-size:14px;font-weight:700;margin-bottom:8px}
.bd{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:600}
.bd-new{background:var(--muted,#f0eadc)}.bd-run{background:#fde68a}
.bd-ok{background:#bbf7d0}.bd-loi{background:#fecaca}
.gd{display:inline-flex;gap:3px;align-items:center}
.gd i{width:24px;height:6px;border-radius:3px;background:var(--muted,#f0eadc)}
.gd i.qua{background:var(--brand,#c81e1e);opacity:.55}
.gd i.nay{background:var(--brand,#c81e1e)}
.chip{display:inline-block;padding:2px 9px;border-radius:99px;font-size:12px;
  border:1px solid var(--border,#dbd3c0);background:var(--secondary,#f0eadc);cursor:pointer}
.chip.cit{border-color:color-mix(in srgb,var(--brand,#c81e1e) 45%,var(--border,#dbd3c0));font-weight:600}
.chip.on{background:var(--brand,#c81e1e);color:#fff}
.mono{font-family:Consolas,monospace;font-size:12px}
.ghi{font-style:italic;color:var(--ink-2,#78716c);font-size:12px}
table{border-collapse:collapse;width:100%;font-size:13px}
td,th{padding:6px 8px;border-bottom:1px solid var(--border,#dbd3c0);text-align:left;vertical-align:top}
th{font-weight:700;font-size:12px}
tr.diem>td{background:var(--accent,#f4ede1)}
mark{background:color-mix(in srgb,var(--brand,#c81e1e) 22%,transparent);border-radius:3px;padding:0 2px}
.the{border:1px solid var(--border,#dbd3c0);border-radius:10px;padding:10px 12px;margin-bottom:10px;
  background:var(--popover,var(--card,#faf6ed))}
.the .dau{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.the .att{margin-top:5px;font-size:12px;color:var(--ink-2,#78716c)}
.nl{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:8px}
.nl:hover{background:var(--accent,#f4ede1)}
.nl input{accent-color:var(--brand,#c81e1e)}
/* ── CỬA SỔ ĐỌC trung tâm: 2 vùng — nội dung + rail phải gập ── */
.cso{border:1px solid color-mix(in srgb,var(--brand,#c81e1e) 55%,var(--edge,#dbd3c0));
  border-radius:12px;background:var(--popover,var(--card,#fcf9f2));
  box-shadow:0 18px 50px rgba(0,0,0,.18);overflow:hidden}
.cso .tb{display:flex;align-items:center;gap:8px;padding:8px 12px;
  border-bottom:1px solid var(--border,#dbd3c0);font-weight:700}
.cso .tb .nut{margin-left:auto;display:flex;gap:6px;align-items:center}
.cso .tb .nut .ovl{width:22px;height:22px;border-radius:6px;border:1px solid var(--border,#dbd3c0);background:none}
.cso .body{display:flex;min-height:430px}
.cso .noidung{flex:1;padding:14px 18px;overflow:auto;max-height:60vh}
.cso .noidung h3{font-size:14px;font-weight:700;margin:14px 0 6px;scroll-margin-top:12px}
.cso .noidung h3.diem{outline:2px solid var(--brand,#c81e1e);outline-offset:4px;border-radius:4px}
.cso .noidung p{margin-bottom:8px}
.rail{width:320px;flex:none;border-left:1px solid var(--border,#dbd3c0);display:flex;flex-direction:column}
.rail.gap{display:none}
.rail .tabs{display:flex;border-bottom:1px solid var(--border,#dbd3c0)}
.rail .tabs button{flex:1;padding:7px;border:none;background:none;font-weight:700;font-size:12px;
  letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2,#78716c)}
.rail .tabs button.on{color:var(--ink,#1c1917);box-shadow:inset 0 -2px var(--brand,#c81e1e)}
.rail .ruot{flex:1;overflow:auto;padding:10px}
.tile{display:flex;gap:8px;align-items:center;border:1px solid var(--border,#dbd3c0);
  border-radius:10px;padding:9px 11px;margin-bottom:8px;background:var(--card,#faf6ed);width:100%;text-align:left}
.tile b{font-size:13px}
.tile .m{margin-left:auto;font-size:11px;color:var(--ink-2,#78716c);text-align:right}
.tile[disabled]{opacity:.55;cursor:not-allowed}
/* chat trong rail */
.chat{display:flex;flex-direction:column;gap:8px}
.msg{max-width:92%;padding:8px 10px;border-radius:10px;font-size:13px}
.msg.q{align-self:flex-end;background:var(--accent,#f4ede1);border:1px solid var(--border,#dbd3c0)}
.msg.a{align-self:flex-start;background:var(--card,#faf6ed);border:1px solid var(--border,#dbd3c0)}
.msg.tc{align-self:flex-start;font-style:italic;border:1px solid var(--border,#dbd3c0);
  background:var(--muted,#f0eadc);border-left:3px solid var(--brand,#c81e1e)}
.blk{margin-bottom:6px}
.blk.co{border:1px dashed var(--brand,#c81e1e);padding:5px 7px;border-radius:8px;font-style:italic;opacity:.92}
.blk.co::before{content:"⚑ chưa xác minh";display:block;font-size:10px;font-weight:700;
  color:var(--brand,#c81e1e);font-style:normal}
.hanh-dong{font-size:12px;font-weight:600;font-style:normal;display:block;margin-top:4px}
.chip-nc{display:inline-flex;gap:6px;align-items:center;border:1px dashed var(--brand,#c81e1e);
  border-radius:8px;padding:3px 8px;font-size:12px;margin-bottom:6px;max-width:100%}
.chip-nc span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* toolbar nổi khi bôi đen */
.selbar{position:fixed;z-index:70;display:none;gap:6px;background:var(--popover,#fff);
  border:1px solid var(--border,#dbd3c0);border-radius:10px;padding:5px 7px;
  box-shadow:0 8px 26px rgba(0,0,0,.22)}
.selbar.on{display:flex}
/* toast + tray */
.toast{position:fixed;right:20px;bottom:20px;z-index:80;background:var(--popover,#fff);
  border:1px solid var(--border,#dbd3c0);border-left:3px solid var(--brand,#c81e1e);
  border-radius:10px;padding:10px 14px;box-shadow:0 10px 30px rgba(0,0,0,.25);display:none;gap:10px;align-items:center}
.toast.on{display:flex}
.toast a{color:var(--brand,#c81e1e);font-weight:700;text-decoration:underline}
/* diff */
.diff del{background:#fecaca;text-decoration:line-through;border-radius:3px;padding:0 2px}
.diff ins{background:#bbf7d0;text-decoration:none;border-radius:3px;padding:0 2px}
/* hàng đợi duyệt 2 cột */
.trai-item{border:1px solid var(--border,#dbd3c0);border-radius:10px;padding:9px 11px;margin-bottom:8px;cursor:pointer}
.trai-item.on{border-color:color-mix(in srgb,var(--brand,#c81e1e) 55%,var(--border,#dbd3c0));background:var(--accent,#f4ede1)}
/* popover hỏi trước */
.md-hoi{position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;place-items:center;z-index:90}
.md-hoi.on{display:grid}
.md-hoi .hop{background:var(--card,#faf6ed);border:1px solid var(--border,#dbd3c0);border-radius:12px;
  padding:18px;max-width:min(540px,90vw)}
.md-hoi .hop h3{font-size:14px;font-weight:700;margin-bottom:8px}
.md-hoi .hop p{margin-bottom:10px}
.tg{max-width:520px;margin:0 auto;background:#1e2a36;border-radius:14px;padding:14px;color:#e7edf3}
.tg .tieu{font-weight:700;padding-bottom:8px;border-bottom:1px solid #31414f;margin-bottom:10px}
.tg .m{max-width:86%;padding:8px 11px;border-radius:10px;margin-bottom:8px;font-size:13px;line-height:1.5}
.tg .m.nguoi{margin-left:auto;background:#2b5278}
.tg .m.bot{background:#182533}
.tg .m .ai{font-size:11px;color:#8fa6b8;display:block;margin-bottom:2px}
.tg .canh{font-size:11px;color:#8fa6b8;text-align:center;margin:12px 0 6px;font-style:italic}
"""

JS_CHUNG = r"""
var DATA = __DATA__;
var GIAI_DOAN = DATA.chungcat.giai_doan_enum;
var GD_NHAN = {"cho":"chờ","dang-doc-nguon":"đang đọc nguồn","dang-goi-model":"đang gọi model",
  "dang-verify":"đang đối chiếu","xong":"xong","dung":"dừng"};
function veGd(gd){
  var i = GIAI_DOAN.indexOf(gd);
  var thanh = GIAI_DOAN.slice(0, 5).map(function(g, k){
    return '<i class="'+(k < i ? "qua" : k === i ? "nay" : "")+'"></i>';
  }).join("");
  var mau = gd === "xong" ? "bd-ok" : gd === "dung" ? "bd-loi" : gd === "cho" ? "bd-new" : "bd-run";
  return '<span class="bd '+mau+'">'+(GD_NHAN[gd]||gd)+'</span> <span class="gd" title="giai đoạn đếm được — không %">'+thanh+"</span>";
}
function toast(chu, href, nhanLink){
  var t = document.getElementById("toast");
  t.querySelector("span").textContent = chu;
  var a = t.querySelector("a");
  if (href){ a.style.display = ""; a.href = href; a.textContent = nhanLink || "Xem tiến độ"; }
  else a.style.display = "none";
  t.classList.add("on");
}
var tDong = document.getElementById("toast-dong");
if (tDong) tDong.onclick = function(){ document.getElementById("toast").classList.remove("on"); };
document.getElementById("theme").onclick = function(){
  var r = document.documentElement;
  r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark";
};
function hoiTruoc(tieuDe, noiDung, luaChon, xong){
  var md = document.getElementById("md-hoi");
  md.querySelector("h3").textContent = tieuDe;
  md.querySelector("p").innerHTML = noiDung;
  var o = md.querySelector(".o"); o.innerHTML = "";
  luaChon.forEach(function(l){
    var b = document.createElement("button"); b.className = "chip"; b.textContent = l;
    b.style.margin = "0 8px 6px 0";
    b.onclick = function(){ md.classList.remove("on"); if (l !== "thôi") xong(l); };
    o.appendChild(b);
  });
  md.classList.add("on");
}
"""

TRANG = [
    ("index.html", "tq", "Tổng quan"),
    ("cua-so-doc.html", "doc", "Cửa sổ đọc  ← trung tâm"),
    ("man-tai-lieu.html", "tl", "Tài liệu"),
    ("man-tong-hop.html", "th", "Tổng hợp"),
    ("dashboard.html", "db", "Dashboard"),
    ("xuong.html", "xuong", "Xưởng (việc nền)"),
    ("hang-doi-duyet.html", "hdd", "Hàng đợi duyệt"),
    ("hoi-thoai.html", "ht", "Hội thoại"),
    ("tin-nhan-kenh.html", "kenh", "Tin nhắn kênh"),
    ("cau-hinh.html", "ch", "Cấu hình"),
]
NHOM = {"tq": "", "doc": "mặt [N] — len lỏi", "tl": "", "th": "", "db": "",
        "xuong": "mặt [Q] — quản lý", "hdd": "", "ht": "", "kenh": "", "ch": ""}

def chrome(active, tieu_de, than, js_trang):
    nav = []
    for f, k, t in TRANG:
        if NHOM.get(k):
            nav.append(f'  <div class="nhom">{NHOM[k]}</div>')
        badge = '<span class="badge" id="nav-badge">1</span>' if k == "xuong" else ""
        nav.append(f'  <a href="{f}"{" class=\"on\"" if k == active else ""}>{t}{badge}</a>')
    nav = "\n".join(nav)
    return f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{tieu_de} — mock đợt hai</title>
<link rel="stylesheet" href="../../tokens.css">
<style>{CSS}</style>
</head>
<body>
<nav class="sb">
  <div class="logo">G</div>
{nav}
  <button id="theme">◐ sáng/tối</button>
  <div class="chu">s5 theo ma trận v2 + FR-046.<br>badge "1" = 1 việc cần xử lý.<br>Dữ liệu: contracts v2.</div>
</nav>
<main><div class="man">
{than}
</div></main>
<div class="toast" id="toast"><span></span><a href="#"></a><button id="toast-dong" class="chip">×</button></div>
<div class="md-hoi" id="md-hoi"><div class="hop"><h3></h3><p></p><div class="o"></div></div></div>
<script>
{JS_CHUNG.replace("__DATA__", DATA_JS)}
{js_trang}
</script>
</body>
</html>
"""

# ═══ index ═══════════════════════════════════════════════════════════════════
THAN_TQ = """
<h1>Đợt hai — hai mặt UI</h1>
<p class="sub">theo ma trận module×màn v2 · [N] len lỏi vào màn đã có — nhanh, tại chỗ · [Q] trang quản lý theo LOẠI VIỆC — chi tiết, sửa, lịch sử</p>
<div class="hang">
<div class="cot2 panel"><h2>Mặt [N] — bấm ngay lúc đọc</h2>
<table>
<tr><th>ở đâu</th><th>gì</th></tr>
<tr><td><a href="cua-so-doc.html"><b>Cửa sổ đọc</b></a> ← mock trung tâm</td><td>nút <b>Chưng cất</b> one-click + <b>Hỏi bài này</b> trên thanh tiêu đề · rail phải 2 tab <b>Hỏi/Sinh</b> · <b>bôi đen</b> đoạn văn → chip ngữ cảnh đính vào chat</td></tr>
<tr><td><a href="man-tai-lieu.html">Danh sách Tài liệu</a></td><td>nút Chưng cất trên thẻ → toast "đã xếp hàng" + link Xưởng</td></tr>
<tr><td><a href="man-tong-hop.html">Tổng hợp</a></td><td>chọn ≥2 → Tổng hợp chủ đề</td></tr>
<tr><td><a href="dashboard.html">Dashboard</a></td><td>khối việc RÚT GỌN → link Xưởng</td></tr>
<tr><td><a href="tin-nhan-kenh.html">Telegram/Discord</a></td><td>tin nhắn là hợp đồng — 5 luật nội dung</td></tr>
</table></div>
<div class="cot1 panel"><h2>Mặt [Q] — theo loại việc</h2>
<table>
<tr><td><a href="xuong.html"><b>Xưởng</b></a></td><td>job M12+M16: list-filter · chi tiết-timeline · log · Cần xử lý</td></tr>
<tr><td><a href="hang-doi-duyet.html"><b>Hàng đợi duyệt</b></a></td><td>nháp AI (DB — FR-046): duyệt · sửa · trả lại · diff bản AI</td></tr>
<tr><td><a href="hoi-thoai.html">Hội thoại</a></td><td>phiên theo tài khoản</td></tr>
<tr><td><a href="cau-hinh.html">Cấu hình</a></td><td>read-only, trỏ file</td></tr>
</table>
<p class="ghi" style="margin-top:8px">Nối hai mặt: job id bền · toast có "Xem" ·
badge trên đúng MỘT mục nav (Xưởng) · deep-link hai chiều.</p></div>
</div>
"""

# ═══ cửa sổ đọc — TRUNG TÂM ═══════════════════════════════════════════════════
THAN_DOC = """
<h1>Cửa sổ đọc <span class="ghi">— trung tâm của mặt len-lỏi</span></h1>
<p class="sub">một cụm entry point ở thanh tiêu đề · rail phải gập được 2 tab · bôi đen đoạn văn trong bài để thấy toolbar nổi</p>
<div style="display:flex;gap:8px;margin-bottom:10px">bài đang mở:
  <button class="chip on" data-bai="approved">xgboost-taylor-bac-hai · ĐÃ LÊN</button>
  <button class="chip" data-bai="thuvien">xgboost-stap-by-step · THU-VIEN</button>
  <button class="chip" data-bai="draft">arxiv-2410-99999 · NHÁP</button>
</div>
<div class="cso">
  <div class="tb"><span id="cso-ten">xgboost-taylor-bac-hai</span>
    <span class="nut">
      <button class="chip" id="nut-cc">Chưng cất</button>
      <button class="chip" id="nut-hoi-bai">Hỏi bài này</button>
      <button class="ovl" id="nut-rail" title="gập/mở rail">▐</button>
      <button class="ovl">−</button><button class="ovl">□</button><button class="ovl">×</button>
    </span></div>
  <div class="body">
    <div class="noidung" id="noidung"></div>
    <div class="rail" id="rail">
      <div class="tabs">
        <button class="on" data-tab="hoi">Hỏi</button>
        <button data-tab="sinh">Sinh</button>
      </div>
      <div class="ruot" id="rail-hoi">
        <p class="ghi" style="margin-bottom:6px">phạm vi = bài này · <span id="pv-so"></span></p>
        <div id="chip-nc-cho"></div>
        <div class="chat" id="chat"></div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <input id="hoi" style="flex:1;min-width:0;padding:6px 10px;border:1px solid var(--input,#dbd3c0);border-radius:8px;background:var(--background,#fff);color:inherit" placeholder="hỏi về bài này…">
          <button class="chip" id="nut-hoi">Hỏi</button>
        </div>
        <p class="ghi" style="margin-top:6px">mẫu: <span id="ds-cau"></span></p>
      </div>
      <div class="ruot" id="rail-sinh" style="display:none">
        <div id="tiles"></div>
        <p class="ghi" style="margin:8px 0 4px">artifact đã sinh của bài</p>
        <div id="af-cua-bai"></div>
      </div>
    </div>
  </div>
</div>
<p class="ghi" style="margin-top:10px">Luật đã áp: tác vụ GIÂY (hỏi) trả ngay trong
rail · tác vụ PHÚT (chưng cất/sinh) hỏi-trước rồi toast + theo dõi ở Xưởng ·
nút chỉ hiện khi hợp lệ (bài nháp không sinh được; bản phân tích không chưng lại).</p>
<div class="selbar" id="selbar">
  <button class="chip" id="sel-hoi">Hỏi đoạn này</button>
  <button class="chip" id="sel-cc">Chưng cất từ đoạn này</button>
</div>
"""
JS_DOC = r"""
var BAI_ND = {
  approved: {ten: "xgboost-taylor-bac-hai", muc: [
    ["3.2 Vì sao bậc hai", "Gradient bậc nhất chỉ cho biết hướng dốc. Khai triển bậc hai giữ được thông tin độ cong của hàm mất mát quanh dự đoán hiện tại, nên mỗi vòng boosting bước chuẩn hơn."],
    ["3.4 Trọng số lá", "Với xấp xỉ bậc hai, mỗi lá có nghiệm đóng — không cần line search."],
    ["4. Đối chiếu thực nghiệm", "Trên bốn bộ dữ liệu bảng, chênh lệch rõ nhất ở dữ liệu nhiều nhiễu."]]},
  thuvien: {ten: "xgboost-stap-by-step", muc: [
    ["Nguyên liệu PDF · 23 trang", "Bản thu-vien: chưa có bản phân tích. Đây là chỗ nút Chưng cất có nghĩa."]]},
  draft: {ten: "arxiv-2410-99999", muc: [
    ["Bản nháp", "Bài đang ở nháp — chưa lên kho. Không sinh artifact được từ bài nháp."]]},
};
var baiOn = "approved";
function veBai(){
  var b = BAI_ND[baiOn];
  document.getElementById("cso-ten").textContent = b.ten;
  document.getElementById("noidung").innerHTML = b.muc.map(function(m, i){
    return '<h3 id="m-'+i+'">'+m[0]+"</h3><p>"+m[1]+"</p>";
  }).join("");
  // nút hợp lệ theo loại bài
  var cc = document.getElementById("nut-cc");
  cc.style.display = baiOn === "thuvien" ? "" : "none";
  veTiles(); veAfBai(); veCauMau();
  document.getElementById("pv-so").textContent = "1 bản ghi";
}
document.querySelectorAll("[data-bai]").forEach(function(x){
  x.onclick = function(){
    document.querySelectorAll("[data-bai]").forEach(function(y){y.classList.remove("on")});
    x.classList.add("on"); baiOn = x.dataset.bai;
    document.getElementById("chat").innerHTML = "";
    veBai();
  };
});
// rail gập + tab
document.getElementById("nut-rail").onclick = function(){
  document.getElementById("rail").classList.toggle("gap");
};
document.querySelectorAll(".rail .tabs button").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll(".rail .tabs button").forEach(function(x){x.classList.remove("on")});
    b.classList.add("on");
    document.getElementById("rail-hoi").style.display = b.dataset.tab === "hoi" ? "" : "none";
    document.getElementById("rail-sinh").style.display = b.dataset.tab === "sinh" ? "" : "none";
  };
});
function moTabSinh(){ document.querySelector('.rail .tabs button[data-tab="sinh"]').click();
  document.getElementById("rail").classList.remove("gap"); }
function moTabHoi(){ document.querySelector('.rail .tabs button[data-tab="hoi"]').click();
  document.getElementById("rail").classList.remove("gap"); }
document.getElementById("nut-hoi-bai").onclick = moTabHoi;
// tiles Sinh — hỏi trước khi tốn (nhịp PHÚT: fire-and-track)
function veTiles(){
  var t = document.getElementById("tiles");
  if (baiOn === "draft"){
    t.innerHTML = '<p class="ghi">Bài đang ở nháp — đưa lên kho trước rồi mới sinh được. Nút không hiện để khỏi mời bạn vào một đường sẽ bị từ chối.</p>';
    return;
  }
  if (baiOn === "thuvien"){
    t.innerHTML = '<button class="tile" id="tile-cc"><b>Chưng cất</b><span class="m">bản nháp 5 mục · ~2 phút</span></button>';
    document.getElementById("tile-cc").onclick = batCc;
    return;
  }
  t.innerHTML = [
    '<button class="tile" data-af="slide"><b>Slide</b><span class="m">~1 phút</span></button>',
    '<button class="tile" data-af="audio"><b>Giọng đọc</b><span class="m">~4 phút</span></button>',
    '<button class="tile" data-af="video"><b>Video</b><span class="m">~8 phút</span></button>',
  ].join("");
  t.querySelector('[data-af="slide"]').onclick = function(){
    hoiTruoc("Tạo slide", DATA.artifact.canh_bao_truoc_khi_sinh.slide,
      ["Marp (nhanh, chữ là ảnh)", "PowerPoint thật (sửa được chữ)", "thôi"], daXepHang);
  };
  t.querySelector('[data-af="audio"]').onclick = function(){
    hoiTruoc("Tạo giọng đọc", DATA.artifact.canh_bao_truoc_khi_sinh.audio_cloud,
      ["giọng tại chỗ — 0 byte rời máy", "giọng đám mây — toàn văn rời máy (ghi vết)", "thôi"], daXepHang);
  };
  t.querySelector('[data-af="video"]').onclick = function(){
    hoiTruoc("Tạo video", DATA.artifact.canh_bao_truoc_khi_sinh.video, ["bắt đầu", "thôi"], daXepHang);
  };
}
function daXepHang(){
  toast("Đã xếp hàng — việc chạy nền, bạn ở lại bài này.", "xuong.html?job=moi", "Xem tiến độ");
  moTabSinh();
}
function batCc(){
  hoiTruoc("Chưng cất bản này",
    "Model: claude-sonnet-5 · ước ~$0.06 · <b>toàn văn tài liệu sẽ rời máy</b> (ghi vết sha256 từng lần). Bản nháp dừng ở Hàng đợi duyệt.",
    ["chạy", "thôi"], function(){
      toast("Đã xếp hàng chưng cất.", "xuong.html?job=moi", "Xem tiến độ");
    });
}
document.getElementById("nut-cc").onclick = batCc;
// artifact của bài (tab Sinh)
function veAfBai(){
  var slug = BAI_ND[baiOn].ten;
  var box = document.getElementById("af-cua-bai");
  var ds = DATA.artifact.jobs.filter(function(a){return a.bai_slug === slug && a.giai_doan === "xong"});
  box.innerHTML = ds.length ? ds.map(function(a){
    return '<div class="the"><div class="dau"><span class="bd bd-ok">xong</span><b>'+a.loai+"</b>"
      + '<span class="ghi">'+(a.files||[]).map(function(f){return f.ten}).join(" · ")+"</span></div>"
      + (a.sidecar ? '<div class="att">mốc quay về: '+a.sidecar.map(function(r){return r.t}).join(" · ")+"</div>" : "")
      + "</div>";
  }).join("") : '<p class="ghi">chưa có</p>';
}
// chat tab Hỏi — nhịp GIÂY, inline
var chipNc = null;
var TC = {"khong-co-trong-kho":{n:"KHÔNG CÓ TRONG KHO",l:"nạp nguồn về chủ đề đó"},
  "co-nhung-mau-thuan":{n:"CÓ NHƯNG MÂU THUẪN",l:"đọc HAI địa chỉ, tự quyết"},
  "ngoai-pham-vi":{n:"NGOÀI PHẠM VI",l:"mở rộng bộ lọc"}};
function veCauMau(){
  var el = document.getElementById("ds-cau"); el.innerHTML = "";
  DATA.chatbot.hoi_dap.filter(function(h){return h.phien === "ph-01"}).slice(0, 3).forEach(function(h){
    var a = document.createElement("a"); a.href = "#"; a.textContent = "«"+h.cau_hoi.slice(0, 26)+"…»";
    a.style.marginRight = "8px";
    a.onclick = function(e){ e.preventDefault(); hoi(h.cau_hoi); };
    el.appendChild(a);
  });
}
function hoi(cau){
  var chat = document.getElementById("chat");
  var q = document.createElement("div"); q.className = "msg q";
  q.textContent = (chipNc ? "[kèm đoạn đã chọn] " : "") + cau;
  chat.appendChild(q);
  if (chipNc){ document.getElementById("chip-nc-cho").innerHTML = ""; chipNc = null; }
  var h = DATA.chatbot.hoi_dap.find(function(x){return x.cau_hoi === cau});
  var a = document.createElement("div");
  if (!h){ a.className = "msg tc"; a.textContent = "câu này chưa có trong data sample."; }
  else if (h.tu_choi){
    a.className = "msg tc";
    var t = TC[h.tu_choi.ly_do];
    a.innerHTML = '<span class="bd bd-loi">'+t.n+'</span><span class="hanh-dong">→ '+t.l+"</span>"
      + (h.tu_choi.dia_chi.length ? "<div style='margin-top:4px'>"+h.tu_choi.dia_chi.map(function(x){
          return '<span class="chip cit" data-a="'+x.split("#")[1]+'">'+x+"</span>"}).join(" ")+"</div>" : "");
  } else {
    a.className = "msg a";
    a.innerHTML = h.blocks.map(function(b){
      var cit = b.citations.map(function(c){
        return '<span class="chip cit" data-a="'+c.anchor+'" title="nguyên văn: '+(c.cited_text||"")+'">#'+c.anchor+"</span>";
      }).join(" ");
      return '<div class="blk'+(b.trang_thai === "chua-xac-minh" ? " co" : "")+'">'+b.text+(cit ? "<br>"+cit : "")+"</div>";
    }).join("");
  }
  chat.appendChild(a);
  a.querySelectorAll(".chip.cit").forEach(function(c){
    c.onclick = function(){
      // trích dẫn bấm-nhảy-về-đoạn TRONG bài đang mở
      var hs = document.querySelectorAll("#noidung h3");
      hs.forEach(function(x){x.classList.remove("diem")});
      var dich = hs[0]; if (dich){ dich.classList.add("diem"); dich.scrollIntoView({block:"center"}); }
    };
  });
  a.scrollIntoView({block:"end"});
}
document.getElementById("nut-hoi").onclick = function(){
  var v = document.getElementById("hoi").value.trim(); if (v) hoi(v);
  document.getElementById("hoi").value = "";
};
// bôi đen → toolbar nổi → chip ngữ cảnh (mẫu Dia/Notion — KHÔNG replace)
var selbar = document.getElementById("selbar");
document.getElementById("noidung").addEventListener("mouseup", function(){
  var s = window.getSelection();
  var chu = s ? String(s).trim() : "";
  if (chu.length > 8){
    var r = s.getRangeAt(0).getBoundingClientRect();
    selbar.style.left = Math.max(10, r.left) + "px";
    selbar.style.top = (r.top - 40) + "px";
    selbar.classList.add("on");
    selbar.dataset.chu = chu;
  } else selbar.classList.remove("on");
});
document.addEventListener("mousedown", function(e){
  if (!selbar.contains(e.target)) selbar.classList.remove("on");
});
document.getElementById("sel-hoi").onclick = function(){
  chipNc = selbar.dataset.chu;
  document.getElementById("chip-nc-cho").innerHTML =
    '<span class="chip-nc">đoạn đã chọn: <span>«'+chipNc.slice(0, 42)+'…»</span></span>';
  selbar.classList.remove("on"); moTabHoi();
  document.getElementById("hoi").focus();
};
document.getElementById("sel-cc").onclick = function(){
  selbar.classList.remove("on");
  hoiTruoc("Chưng cất từ đoạn đã chọn",
    "Chỉ đoạn đã chọn rời máy (không phải toàn văn) · ghi vết sha256.",
    ["chạy", "thôi"], function(){ toast("Đã xếp hàng.", "xuong.html?job=moi", "Xem tiến độ"); });
};
veBai();
"""

# ═══ Xưởng ════════════════════════════════════════════════════════════════════
THAN_XUONG = """
<h1>Xưởng <span class="ghi">— [Q] việc nền M12 + M16</span></h1>
<p class="sub">4 vùng: lọc · danh sách · chi tiết-timeline-log (mở cửa sổ nổi) · hành động — mã việc bền, đóng tab mở lại vẫn còn</p>
<div class="panel" id="can-xu-ly" style="border-left:3px solid var(--brand,#c81e1e)">
  <h2>Cần xử lý <span class="bd bd-loi" id="cxl-so"></span></h2>
  <div id="cxl"></div>
</div>
<div class="panel">
  <h2>Mọi việc</h2>
  <div style="margin-bottom:8px" id="loc">
    lọc: <button class="chip on" data-l="all">tất cả</button>
    <button class="chip" data-l="dung">dừng</button>
    <button class="chip" data-l="xong">xong</button>
    <button class="chip" data-l="chay">đang chạy</button>
  </div>
  <table id="bg-viec"></table>
</div>
<div class="cso" id="ct" style="display:none;max-width:720px">
  <div class="tb"><span id="ct-ten"></span>
    <span class="nut"><button class="ovl" id="ct-dong">×</button></span></div>
  <div style="padding:14px 18px">
    <div id="ct-gd" style="margin-bottom:8px"></div>
    <table id="ct-log"></table>
    <div style="margin-top:10px" id="ct-hanh-dong"></div>
  </div>
</div>
"""
JS_XUONG = r"""
var VIEC = DATA.chungcat.jobs.map(function(j){
  return {id:j.ulid, loai:"chưng cất", ten:(j.loai==="tong-hop-chu-de"?"tổng hợp "+j.nguon.join(" + "):j.nguon_slug),
    gd:j.giai_doan, lan:j.lan_thu, ld:j.ly_do_dung, model:j.model_da_dung, chon:j.model_chon};
}).concat(DATA.artifact.jobs.map(function(a){
  return {id:a.job_id, loai:"artifact "+a.loai, ten:a.bai_slug,
    gd:(a.giai_doan==="xong"?"xong":a.giai_doan==="dung"?"dung":"dang-goi-model"),
    buoc:a.giai_doan, lan:1, ld:a.that_bai||null, loiNv:a.loi_nguyen_van||null};
}));
// deep-link ?job=
var qJob = new URLSearchParams(location.search).get("job");
function veCxl(){
  var ds = VIEC.filter(function(v){return v.gd === "dung"});
  document.getElementById("cxl-so").textContent = ds.length;
  document.getElementById("cxl").innerHTML = ds.map(function(v){
    var ld = DATA.chungcat.ly_do_dung_enum[v.ld] || DATA.artifact.that_bai_enum[v.ld] || "";
    return '<div class="the"><div class="dau"><span class="bd bd-loi">'+v.ld+"</span><b>"+v.ten+"</b>"
      + '<button class="chip" style="margin-left:auto" data-mo="'+v.id+'">mở chi tiết</button></div>'
      + '<div class="att">'+ld+(v.loiNv ? " · nguyên văn: "+v.loiNv : "")+"</div></div>";
  }).join("") || '<p class="ghi">sạch — không việc nào chờ bạn</p>';
}
var locOn = "all";
function veBang(){
  var ds = VIEC.filter(function(v){
    if (locOn === "all") return true;
    if (locOn === "dung") return v.gd === "dung";
    if (locOn === "xong") return v.gd === "xong";
    return v.gd !== "dung" && v.gd !== "xong";
  });
  document.getElementById("bg-viec").innerHTML =
    "<tr><th>mã việc</th><th>loại</th><th>việc</th><th>giai đoạn</th><th>lần</th><th></th></tr>"
    + ds.map(function(v){
      return '<tr'+(v.id === qJob ? ' class="diem"' : "")+'><td class="mono">'+v.id+"</td><td>"+v.loai+"</td><td>"+v.ten
        + "</td><td>"+veGd(v.gd)+(v.buoc && v.gd !== "xong" && v.gd !== "dung" ? ' <span class="ghi">'+v.buoc+"</span>" : "")
        + "</td><td>"+v.lan+'</td><td><button class="chip" data-mo="'+v.id+'">chi tiết</button></td></tr>';
    }).join("");
  ganMo();
}
document.querySelectorAll("#loc .chip").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll("#loc .chip").forEach(function(x){x.classList.remove("on")});
    b.classList.add("on"); locOn = b.dataset.l; veBang();
  };
});
function ganMo(){
  document.querySelectorAll("[data-mo]").forEach(function(b){
    b.onclick = function(){ moChiTiet(b.dataset.mo); };
  });
}
function moChiTiet(id){
  var v = VIEC.find(function(x){return x.id === id});
  document.getElementById("ct").style.display = "";
  document.getElementById("ct-ten").textContent = v.loai+" · "+v.ten+" · "+id;
  document.getElementById("ct-gd").innerHTML = veGd(v.gd)
    + (v.model ? ' · model đã dùng: <b>'+v.model+"</b>"
      + (v.chon && v.model !== v.chon ? ' <span style="color:var(--brand)">(dự phòng — chọn: '+v.chon+")</span>" : "") : "");
  var log = DATA.chungcat.log_mau[id] || [];
  document.getElementById("ct-log").innerHTML = log.length
    ? "<tr><th>lúc</th><th>giai đoạn</th><th>ghi</th></tr>"
      + log.map(function(l){return "<tr><td class='mono'>"+l.luc+"</td><td>"+(GD_NHAN[l.giai_doan]||l.giai_doan)+"</td><td>"+l.chu+"</td></tr>"}).join("")
    : "<tr><td class='ghi'>log lưu theo mã việc trong DB — mock chỉ có mẫu cho 2 việc</td></tr>";
  var hd = document.getElementById("ct-hanh-dong");
  if (v.gd === "dung"){
    var tu = DATA.chungcat.chay_lai_tu[id];
    hd.innerHTML = (tu ? '<button class="chip" id="cl-cp">Chạy lại từ «'+(GD_NHAN[tu]||tu)+'»</button> ' : "")
      + '<button class="chip">Chạy lại từ đầu</button> <button class="chip">Xoá</button>'
      + '<p class="ghi" style="margin-top:6px">mặc định chạy lại từ giai-đoạn-hỏng (checkpoint) — từ-đầu là lựa chọn phụ vì mỗi lần từ-đầu là toàn văn rời máy thêm một lần</p>';
    var cl = document.getElementById("cl-cp");
    if (cl) cl.onclick = function(){ toast("Đã xếp hàng chạy lại từ checkpoint.", null); };
  } else if (v.gd === "xong" && v.loai === "chưng cất"){
    hd.innerHTML = '<a class="chip" href="hang-doi-duyet.html">mở bản nháp trong Hàng đợi duyệt</a>';
  } else hd.innerHTML = '<button class="chip">Huỷ</button>';
  document.getElementById("ct").scrollIntoView({block:"center"});
}
document.getElementById("ct-dong").onclick = function(){ document.getElementById("ct").style.display = "none"; };
veCxl(); veBang();
if (qJob === "moi") toast("Việc vừa xếp hàng sẽ hiện ở đây khi hệ thật chạy — mock chưa thêm dòng mới.", null);
else if (qJob) moChiTiet(qJob);
"""

# ═══ Hàng đợi duyệt ══════════════════════════════════════════════════════════
THAN_HDD = """
<h1>Hàng đợi duyệt <span class="ghi">— [Q] nháp AI · FR-046: nháp sống trong DB</span></h1>
<p class="sub">hai cột kiểu triage: trái = nháp, phải = xem + sửa + diff bản AI · duyệt xong mới ghi file vào kho — từ giây đó file là chân lý</p>
<div class="hang">
  <div class="cot1 panel"><h2>Nháp (<span id="so-nhap"></span>)</h2><div id="ds-nhap"></div></div>
  <div class="cot2 panel" id="xem">
    <h2 id="x-ten"></h2>
    <p><span id="x-tt"></span> · địa chỉ <b id="x-s"></b>/<b id="x-v"></b> đối chiếu
      · <span id="x-tia" style="color:var(--brand)"></span></p>
    <p id="x-tra" class="ghi"></p>
    <div class="the"><div id="x-noidung"></div></div>
    <p><button class="chip" id="nut-diff">khác gì bản AI?</button></p>
    <div class="the diff" id="x-diff" style="display:none"></div>
    <div style="margin-top:10px">
      <button class="chip" id="nut-duyet">Duyệt → vào kho</button>
      <button class="chip">Sửa</button>
      <button class="chip">Trả lại (kèm lý do)</button>
      <button class="chip">Xoá</button>
    </div>
    <p class="ghi" style="margin-top:6px">Duyệt = kiểm chặt chẽ tự động chạy trước,
    pass mới ghi file — không đường nào tự vào kho.</p>
  </div>
</div>
"""
JS_HDD = r"""
var NHAP = DATA.chungcat.nhap;
var TT_NHAN = {nhap:["bd-new","nháp"], da_sua:["bd-run","đã sửa"], tra_lai:["bd-loi","trả lại"], da_duyet:["bd-ok","đã vào kho"]};
var nhapOn = 0;
function veList(){
  document.getElementById("so-nhap").textContent = NHAP.length;
  document.getElementById("ds-nhap").innerHTML = NHAP.map(function(n, i){
    var t = TT_NHAN[n.trang_thai];
    return '<div class="trai-item'+(i === nhapOn ? " on" : "")+'" data-i="'+i+'">'
      + '<span class="bd '+t[0]+'">'+t[1]+"</span> <b>"+n.title+"</b>"
      + '<div class="ghi">'+n.job_ulid+(n.sua_luc ? " · sửa "+n.sua_luc.slice(0, 10) : "")+"</div></div>";
  }).join("");
  document.querySelectorAll(".trai-item").forEach(function(x){
    x.onclick = function(){ nhapOn = Number(x.dataset.i); veList(); veXem(); };
  });
}
function veXem(){
  var n = NHAP[nhapOn];
  var t = TT_NHAN[n.trang_thai];
  document.getElementById("x-ten").textContent = n.title;
  document.getElementById("x-tt").innerHTML = '<span class="bd '+t[0]+'">'+t[1]+"</span>";
  document.getElementById("x-s").textContent = n.citations_verified;
  document.getElementById("x-v").textContent = n.citations_sampled;
  document.getElementById("x-tia").textContent = n.khang_dinh_bi_tia
    ? "⚠ đã tỉa "+n.khang_dinh_bi_tia.so+" ("+n.khang_dinh_bi_tia.ly_do+")" : "";
  document.getElementById("x-tra").textContent = n.ly_do_tra ? "lý do trả lại: "+n.ly_do_tra : "";
  document.getElementById("x-noidung").textContent = n.ban_hien_tai;
  document.getElementById("x-diff").style.display = "none";
}
document.getElementById("nut-diff").onclick = function(){
  var n = NHAP[nhapOn];
  var d = document.getElementById("x-diff");
  d.style.display = "";
  d.innerHTML = n.ban_goc_ai === n.ban_hien_tai
    ? '<p class="ghi">chưa sửa gì — bản hiện tại trùng bản AI gốc</p>'
    : "<p><del>"+n.ban_goc_ai+"</del></p><p><ins>"+n.ban_hien_tai+"</ins></p>"
      + '<p class="ghi">bản AI gốc bất biến trong DB — diff luôn trả lời được "người đã đổi gì"</p>';
};
document.getElementById("nut-duyet").onclick = function(){
  var n = NHAP[nhapOn];
  n.trang_thai = "da_duyet"; veList(); veXem();
  toast("Kiểm tự động pass — đã ghi file vào kho. File giờ là chân lý; bản DB thành lịch sử.", null);
};
veList(); veXem();
"""

# ═══ Hội thoại ═══════════════════════════════════════════════════════════════
THAN_HT = """
<h1>Hội thoại <span class="ghi">— [Q] phiên theo tài khoản (web + kênh về cùng chỗ)</span></h1>
<p class="sub">hai người hỏi cùng bot = hai phiên, không thấy ngữ cảnh của nhau</p>
<div class="hang">
  <div class="cot1 panel"><h2>Phiên</h2><table id="bg-phien"></table></div>
  <div class="cot2 panel"><h2 id="p-ten">chọn một phiên</h2>
    <div class="chat" id="p-chat"></div>
    <p style="margin-top:8px"><button class="chip" id="nut-json">xem JSON</button>
      <button class="chip">Xoá phiên</button></p>
  </div>
</div>
<div class="md-hoi" id="md-json2" style="z-index:95"><div class="hop" style="max-width:min(720px,92vw)">
  <h3>JSON</h3><pre style="max-height:60vh;overflow:auto;font-size:12px" id="json-pre"></pre>
  <p><button class="chip" onclick="document.getElementById('md-json2').classList.remove('on')">đóng</button></p></div></div>
"""
JS_HT = r"""
var phienOn = null;
document.getElementById("bg-phien").innerHTML = "<tr><th>phiên</th><th>tài khoản</th><th>kênh</th><th>lượt</th><th>cập nhật</th></tr>"
  + DATA.chatbot.lich_su_phien.map(function(p){
    return '<tr data-p="'+p.id+'" style="cursor:pointer"><td class="mono">'+p.id+"</td><td><b>"+p.nguoi_dung
      + "</b></td><td>"+p.kenh+"</td><td>"+p.so_luot+"</td><td>"+p.cap_nhat.slice(0, 10)+"</td></tr>";
  }).join("");
document.querySelectorAll("[data-p]").forEach(function(r){
  r.onclick = function(){
    phienOn = r.dataset.p;
    document.getElementById("p-ten").textContent = "Phiên "+phienOn;
    var ds = DATA.chatbot.hoi_dap.filter(function(h){return h.phien === phienOn});
    document.getElementById("p-chat").innerHTML = ds.length ? ds.map(function(h){
      var dap = h.tu_choi ? '<div class="msg tc">'+h.tu_choi.ly_do+"</div>"
        : '<div class="msg a">'+h.blocks.map(function(b){
            return '<div class="blk'+(b.trang_thai==="chua-xac-minh" ? " co" : "")+'">'+b.text+"</div>"}).join("")+"</div>";
      return '<div class="msg q">'+h.cau_hoi+"</div>"+dap;
    }).join("") : '<p class="ghi">phiên cũ — transcript mẫu không có trong contracts</p>';
  };
});
document.getElementById("nut-json").onclick = function(){
  document.getElementById("json-pre").textContent = JSON.stringify(
    DATA.chatbot.hoi_dap.filter(function(h){return h.phien === phienOn})[0] || DATA.chatbot.hoi_dap[0], null, 2);
  document.getElementById("md-json2").classList.add("on");
};
"""

# ═══ Cấu hình ════════════════════════════════════════════════════════════════
THAN_CH = """
<h1>Cấu hình <span class="ghi">— [Q] read-only: bảng khai trong repo, sửa bằng sửa file + review</span></h1>
<p class="sub">không form — một ô sửa được trên UI là một đường ghi ngoài review</p>
<div class="hang">
<div class="cot1 panel"><h2>Model theo tác vụ × ngôn ngữ</h2>
<table>
<tr><th>tác vụ</th><th>ngôn ngữ</th><th>model</th><th>dự phòng (cùng khu vực)</th></tr>
<tr><td>chưng cất</td><td>vi/en</td><td>claude-sonnet-5</td><td>gemini-3.7-flash</td></tr>
<tr><td>chưng cất</td><td>zh ≥ ngưỡng</td><td>kimi</td><td>deepseek</td></tr>
<tr><td>hỏi đáp</td><td>vi/en</td><td>claude-sonnet-5</td><td>—</td></tr>
</table>
<p class="ghi">ngôn ngữ do MÁY đếm tỉ lệ ký tự — model không tự khai · dự phòng
chỉ rơi trong cùng khu vực pháp lý · model thật dùng ghi vào vết từng lần</p>
<p class="ghi">sửa ở: bảng khai model trong repo</p></div>
<div class="cot1 panel"><h2>Trần & ngưỡng</h2>
<table>
<tr><td>thử lại tối đa</td><td>2 lần</td></tr>
<tr><td>trần file Telegram</td><td>50 MB</td></tr>
<tr><td>trần file Discord</td><td>10 MiB</td></tr>
<tr><td>quota giọng đám mây</td><td>500K ký tự/tháng</td></tr>
</table>
<p class="ghi">sửa ở: bảng khai dịch vụ trong repo</p></div>
</div>
"""

# ═══ các màn giữ từ bản trước (rút gọn + nối toast) ═══════════════════════════
THAN_TL = """
<h1>Tài liệu <span class="ghi">— màn đã có · nút Chưng cất trên thẻ</span></h1>
<p class="sub">bấm → hỏi-trước → toast có link Xưởng · thẻ đổi "đã xếp hàng" tại chỗ, bạn ở lại danh sách</p>
<div class="panel"><h2>Bản ghi thu-vien</h2><div id="ds-nl"></div></div>
"""
JS_TL = r"""
var NL = [
  {slug:"xgboost-stap-by-step", loai:"pdf · 23 trang"},
  {slug:"quartz-plugin-api", loai:"docs"},
  {slug:"storm-multi-perspective", loai:"paper"},
];
document.getElementById("ds-nl").innerHTML = NL.map(function(x, i){
  return '<div class="the"><div class="dau"><b>'+x.slug+'</b><span class="ghi">'+x.loai+'</span>'
    + '<button class="chip" style="margin-left:auto" data-cc="'+i+'">Chưng cất</button></div></div>';
}).join("");
document.querySelectorAll("[data-cc]").forEach(function(b){
  b.onclick = function(){
    hoiTruoc("Chưng cất", "Model claude-sonnet-5 · ~$0.06 · toàn văn rời máy (ghi vết sha256).",
      ["chạy", "thôi"], function(){
        b.textContent = "đã xếp hàng"; b.disabled = true;
        toast("Đã xếp hàng — theo dõi ở Xưởng.", "xuong.html?job=moi", "Xem tiến độ");
      });
  };
});
"""

THAN_TH = """
<h1>Tổng hợp <span class="ghi">— màn đã có · chọn ≥2 → Tổng hợp chủ đề</span></h1>
<p class="sub">một bản N nguồn: khai đủ nguồn, mọi địa chỉ mang tên nguồn</p>
<div class="panel"><h2>Chọn bản ghi</h2><div id="ds-chon"></div>
  <button class="chip" id="nut-th" disabled style="margin-top:10px">Tổng hợp chủ đề (chọn ≥ 2)</button></div>
"""
JS_TH = r"""
var DS = ["xgboost-stap-by-step","thien-duong-chuot-tuong-lai-nhan-loai-giai-ma-loi-tien-tri-d","quartz-plugin-api","storm-multi-perspective"];
var box = document.getElementById("ds-chon");
DS.forEach(function(s){
  var l = document.createElement("label"); l.className = "nl";
  l.innerHTML = '<input type="checkbox" value="'+s+'"> <span class="mono">'+s+'</span>';
  box.appendChild(l);
});
box.addEventListener("change", function(){
  document.getElementById("nut-th").disabled = box.querySelectorAll("input:checked").length < 2;
});
document.getElementById("nut-th").onclick = function(){
  hoiTruoc("Tổng hợp chủ đề", "Các nguồn đã chọn rời máy (ghi vết từng lần) · bản nháp dừng ở Hàng đợi duyệt.",
    ["chạy", "thôi"], function(){ toast("Đã xếp hàng tổng hợp.", "xuong.html?job=moi", "Xem tiến độ"); });
};
"""

THAN_DB = """
<h1>Dashboard <span class="ghi">— màn đã có · khối việc RÚT GỌN</span></h1>
<p class="sub">chỉ tóm tắt + một link — chi tiết sống ở Xưởng, không lặp hai nơi</p>
<div class="panel"><h2>Việc nền</h2><div id="tomtat"></div>
  <p style="margin-top:8px"><a class="chip" href="xuong.html">mở Xưởng</a></p></div>
<div class="panel"><h2>Tín hiệu tra cứu</h2>
  <p>truy vấn 0-kết-quả tuần này: <b>2</b> <span class="ghi">— được đếm, là tín hiệu
  cân nhắc nâng cấp tìm kiếm (điểm rẽ đã khai sẵn)</span></p></div>
"""
JS_DB = r"""
var dem = {chay: 0, dung: 0, xong: 0};
DATA.chungcat.jobs.concat(DATA.artifact.jobs.map(function(a){
  return {giai_doan: a.giai_doan === "xong" ? "xong" : a.giai_doan === "dung" ? "dung" : "chay"};
})).forEach(function(j){
  if (j.giai_doan === "xong") dem.xong++;
  else if (j.giai_doan === "dung") dem.dung++;
  else dem.chay++;
});
document.getElementById("tomtat").innerHTML =
  '<span class="bd bd-run">'+dem.chay+' đang chạy</span> '
  + '<span class="bd bd-loi">'+dem.dung+' cần xử lý</span> '
  + '<span class="bd bd-ok">'+dem.xong+' xong hôm nay</span>';
"""

THAN_KENH = """
<h1>Tin nhắn kênh <span class="ghi">— giao diện ta KHÔNG sở hữu</span></h1>
<p class="sub">ta chỉ quyết NỘI DUNG tin nhắn — năm cảnh dưới là năm luật. Trang quản lý kênh & tài khoản (FR-045) port sau cùng M17.</p>
<div class="hang">
  <div class="cot2"><div class="tg"><div class="tieu">Grown_news bot · Telegram</div><div id="hoi-thoai"></div></div></div>
  <div class="cot1 panel"><h2>Adapter</h2><div id="ds-adapter"></div>
    <h2 style="margin-top:12px">Định danh</h2><table id="bg-dd"></table></div>
</div>
"""
JS_KENH = r"""
document.getElementById("hoi-thoai").innerHTML = DATA.kenh.hoi_thoai_mau.map(function(h){
  return '<div class="canh">— '+h.canh+' —</div>'
    + '<div class="m nguoi"><span class="ai">'+h.tu+"</span>"+h.nguoi_gui+"</div>"
    + '<div class="m bot"><span class="ai">bot</span>'+h.bot_tra_loi+"</div>"
    + '<div class="canh" style="text-align:left">luật: '+h["$luat"]+"</div>";
}).join("");
document.getElementById("ds-adapter").innerHTML = DATA.kenh.adapters.map(function(a){
  return '<div class="the"><div class="dau"><span class="bd '+(a.trang_thai==="dang-poll"?"bd-ok":"bd-new")+'">'
    + (a.trang_thai==="dang-poll"?"ĐANG POLL":"TẮT")+"</span><b>"+a.kenh+"</b>"
    + '<span class="ghi">trần file '+a.tran_file+"</span></div></div>";
}).join("");
document.getElementById("bg-dd").innerHTML = "<tr><th>chat</th><th>tài khoản</th></tr>"
  + DATA.kenh.dinh_danh_kenh.map(function(r){
    return '<tr><td class="mono">'+r.chat_id+"</td><td><b>"+r.nguoi_dung+"</b></td></tr>";
  }).join("");
"""

BODY = {"tq": (THAN_TQ, ""), "doc": (THAN_DOC, JS_DOC), "tl": (THAN_TL, JS_TL),
        "th": (THAN_TH, JS_TH), "db": (THAN_DB, JS_DB), "xuong": (THAN_XUONG, JS_XUONG),
        "hdd": (THAN_HDD, JS_HDD), "ht": (THAN_HT, JS_HT), "kenh": (THAN_KENH, JS_KENH),
        "ch": (THAN_CH, "")}

for f, k, t in TRANG:
    than, js = BODY[k]
    (RA / f).write_text(chrome(k, t.split("  ")[0], than, js), encoding="utf-8")
    print("wrote", f, (RA / f).stat().st_size, "bytes")
