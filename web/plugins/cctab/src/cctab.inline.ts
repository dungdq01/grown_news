/*
 * T03-110 · TAB "Chưng cất" của cửa sổ đọc — thân hàm, nạp THEO YÊU CẦU.
 *
 * VÌ SAO Ở CHUNK RIÊNG, KHÔNG Ở `gn.js`
 * `gn.js` là bundle CHUNG: mọi trang tải nó, kể cả trang chỉ đọc. Trần 102400
 * của nó tồn tại để giữ **đường tải ĐẦU** nhẹ, và `FR-061` nói rõ nó KHÔNG được
 * nới ("nới nó là nới cho mọi trang"). Mã của một tab người chưa bấm không
 * thuộc đường tải đầu của người đó — cùng lập luận `T03-102` đã dùng cho chunk
 * theo màn.
 *
 * Đánh đổi phải nói ra: ai bấm tab thì trả thêm một lượt tải (~1 KB). Đó là
 * đúng người trả đúng lúc, thay vì mọi người đọc báo trả trước.
 *
 * Nạp bởi `multiwindow.inline.ts#capCctab()`; KHÔNG trang nào phát thẻ
 * `<script>` cho nó.
 */

const NHIP_POLL = 4000;

/*
 * Giai đoạn còn CHẠY = `cho` hoặc `dang-*`. Phép so TIỀN TỐ, không một mảng
 * bốn chuỗi: thêm một giai đoạn `dang-…` sau này thì phép so này đã đúng, còn
 * mảng thì phải nhớ sửa — quên thì poll dừng sớm, tức tab đứng im trong khi
 * việc vẫn chạy. `xong` và `dung` KHÔNG khớp, đúng ý.
 */
const conChayGd = (gd) => gd === "cho" || String(gd).startsWith("dang-");

/** Thứ của multiwindow mà tab cần. Một chiều: chunk ĐỌC, không ghi vào. */
const mw = () => globalThis.__GN_MW__;

function dungPoll(win) {
  const w = mw().WIN.get(win.id);
  if (w?.pollCC) {
    clearInterval(w.pollCC);
    w.pollCC = null;
  }
}

/*
 * Danh sách việc M12 CỦA CHÍNH bản ghi đang mở.
 *
 * Lọc theo `slug` ở FE vì `GET /api/job` trả cả hàng đợi: một cửa sổ của bài A
 * hiện việc của bài B là người đọc tin đó là việc của bài mình.
 *
 * Chip là ENUM `giai_doan`, KHÔNG phần trăm. Một % suy từ bốn giai đoạn là con
 * số không ai đo được, và nó tạo cảm giác biết chính xác còn bao lâu.
 */
/*
 * CSS của TAB + TRANSCRIPT — chunk tự tiêm, không vào `gn.css`.
 *
 * `.cct*` chỉ dùng ở tab Chưng cất, `.tr*` chỉ ở tab Transcript — cả hai sống
 * trong CHÍNH file này. Khai chúng ở `prototype.css` là gửi ~330 byte tới MỌI
 * trang cho hai tab chưa ai bấm, và `gn.css` đo được 102524/102400 vì đúng
 * chỗ đó. `FR-061` cấm nới bundle chung.
 *
 * Cùng lập luận `#cc-hv` của `WO-048`, cùng lập luận `T03-102` cho JS theo màn.
 */
function trCss() {
  if (document.getElementById("cc-tr-css")) return;
  const st = document.createElement("style");
  st.id = "cc-tr-css";
  st.textContent = KHOI_CSS;
  document.head.appendChild(st);
}

const KHOI_CSS = `
.cct,.tr{list-style:none;margin:0;padding:0}
.cct-tg{margin-top:var(--s-2xs);font-size:var(--fs-nano);color:var(--ink-3);
  background:0;border:0;cursor:pointer;padding:var(--s-3xs) 0;text-align:left}
.cct-tg:hover{color:var(--ink-2)}
.vc-loai{letter-spacing:.06em;color:var(--vl,var(--ink-2))}
.cct-cu{text-decoration:line-through;text-decoration-color:var(--destructive);
  text-decoration-thickness:2px;opacity:.72}
.cct-h{display:flex;align-items:center;gap:var(--s-2xs);margin:0 0 var(--s-xs);
  color:var(--ink-2);font-size:var(--fs-meta)}
/* Đèn NHỊP của 'nhà máy đang chạy'. 'transform'+'opacity' only — AC6 cấm
   animate thuộc tính layout, và một đèn animate 'width' là reflow mỗi frame. */
.cct-live{width:var(--s-2xs);height:var(--s-2xs);border-radius:50%;
  background:var(--ok);flex:0 0 auto}
.cct-i{display:flex;align-items:center;gap:var(--s-xs);
  padding:var(--s-2xs) 0;border-bottom:1px solid var(--line)}
.cct-i[data-gd="dung"]{opacity:.65}
/* WO-066 · việc HỎNG: vạch đỏ, không mờ — hỏng là thứ phải THẤY, dừng thì mờ được. */
.cct-i[data-gd="hong"]{box-shadow:inset 3px 0 0 var(--destructive)}
.cct-i[data-gd="hong"] .cct-t>b{color:var(--destructive)}
/* DÂY CHUYỀN — năm hạt, hạt đã qua sáng, hạt đang chạy nảy nhịp. */
.cct-day{display:inline-flex;gap:var(--s-3xs);flex:0 0 auto}
.cct-b{width:var(--s-2xs);height:var(--s-3xs);border-radius:var(--r-pill);
  background:var(--ink-3);opacity:.35}
.cct-b.qua{background:var(--ok);opacity:1}
.cct-b.nay{background:var(--brand);opacity:1}
.cct-t{display:flex;flex-direction:column;min-width:0}
.cct-t b{font-size:var(--fs-meta)}
.cct-m{color:var(--ink-3);font-size:var(--fs-nano);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.cct-w{margin-left:auto;color:var(--brand);font-size:var(--fs-nano)}
.cct-e{margin-left:auto;color:var(--warn);font-size:var(--fs-nano)}
.cct-l{margin-left:auto;font-size:var(--fs-meta)}
.tr-i{display:flex;gap:var(--s-xs);align-items:baseline;
  padding:var(--s-2xs) 0;border-bottom:1px solid var(--line)}
.tr-t{background:none;border:0;padding:0;color:var(--brand);cursor:pointer;
  font-size:var(--fs-meta);font-variant-numeric:tabular-nums}

/* ══ CHUYỂN ĐỘNG — TẤT CẢ nằm trong khối này ══════════════════════════════
 *
 * Mặc định KHÔNG chuyển động. Chỉ bật khi người dùng KHÔNG khai 'giảm chuyển
 * động'. Viết chiều này (opt-in) chứ không chiều tắt-sau: quên một luật trong
 * chiều tắt-sau là một animation lọt qua, còn quên ở đây thì chỉ là tĩnh.
 *
 * Và chỉ 'transform'/'opacity' — hai thuộc tính chạy trên compositor, không
 * gây reflow. 'AC6' cấm animate width/height/top/left vì đúng lý do đó.
 */
@media (prefers-reduced-motion: no-preference) {
  .cct-live{animation:cct-tho 1.6s ease-in-out infinite}
  .cct-b.nay{animation:cct-nay .9s ease-in-out infinite}
  .cct-w::after{content:"";display:inline-block;width:var(--s-2xs);
    animation:cct-cham 1.2s steps(4,end) infinite}
}
@keyframes cct-tho{
  0%,100%{transform:scale(1);opacity:1}
  50%{transform:scale(1.55);opacity:.45}
}
@keyframes cct-nay{
  0%,100%{transform:scaleX(1);opacity:1}
  50%{transform:scaleX(1.9);opacity:.7}
}
@keyframes cct-cham{
  0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}
}
/* ── T03-112 · CỬA SỔ VIỆC: dây chuyền + kết quả + duyệt ─────────────────── */
.vc{padding:var(--s-sm) 0}
.vc-h{display:flex;align-items:center;gap:var(--s-2xs);margin-bottom:var(--s-sm)}
.vc-h b{font-size:var(--fs-lead)}
.vc-den{width:var(--s-2xs);height:var(--s-2xs);border-radius:50%;
  background:var(--ink-3);flex:0 0 auto}
.vc-den.chay{background:var(--ok)}
.vc-dh{margin-left:auto;color:var(--ink-2);font-variant-numeric:tabular-nums;
  font-size:var(--fs-meta)}
.vc-ct{margin-left:auto;color:var(--ok);font-size:var(--fs-meta)}
/* DÂY CHUYỀN dọc: mỗi chặng một dòng, đọc được cả khi cửa sổ hẹp. Cột ngang
   trong một cửa sổ 420px thì năm nhãn chồng lên nhau. */
.vc-b{list-style:none;margin:0 0 var(--s-sm);padding:0;
  display:grid;gap:var(--s-2xs)}
.vc-b li{display:flex;align-items:center;gap:var(--s-xs);color:var(--ink-3)}
.vc-b li i{width:var(--s-xs);height:var(--s-xs);border-radius:50%;
  background:var(--ink-3);opacity:.4;flex:0 0 auto}
.vc-b li.qua{color:var(--ink-2)}
.vc-b li.qua i{background:var(--ok);opacity:1}
.vc-b li.nay{color:var(--ink);font-weight:var(--w-head)}
.vc-b li.nay i{background:var(--brand);opacity:1}
.vc-m{color:var(--ink-3);font-size:var(--fs-meta);margin:0}
.vc-xong{font-size:var(--fs-lead);margin:0 0 var(--s-2xs)}
.vc-tick{width:var(--s-xs);height:var(--s-xs);border-radius:50%;
  background:var(--ok);flex:0 0 auto}
.vc-t{margin:0 0 var(--s-sm)}
.vc-act{display:flex;align-items:center;gap:var(--s-xs);flex-wrap:wrap}
.vc-tt{color:var(--ink-3);font-size:var(--fs-meta)}
.vc.da-vao .vc-tt{color:var(--ok);font-weight:var(--w-head)}

/* MỌI chuyển động trong khối này — mặc định TĨNH (AC6). Chỉ transform/opacity:
   hai thuộc tính chạy trên compositor, không gây reflow. */
@media (prefers-reduced-motion: no-preference) {
  .vc-den.chay{animation:vc-tho 1.6s ease-in-out infinite}
  .vc-b li.nay i{animation:vc-nhip 1.1s ease-in-out infinite}
  .vc-b li.qua i{animation:vc-nay .32s cubic-bezier(.2,1.6,.4,1) both}
  .vc.xong{animation:vc-hien .45s ease-out both}
  .vc-tick{animation:vc-nay .4s cubic-bezier(.2,1.6,.4,1) both}
}
@keyframes vc-tho{0%,100%{transform:scale(1);opacity:1}
  50%{transform:scale(1.6);opacity:.4}}
@keyframes vc-nhip{0%,100%{transform:scale(1);opacity:1}
  50%{transform:scale(1.45);opacity:.65}}
@keyframes vc-nay{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes vc-hien{from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:none}}
.td-k{margin-top:var(--s-md);border-top:1px solid var(--line);
  padding-top:var(--s-xs)}
.td-h{display:flex;align-items:baseline;gap:var(--s-2xs);
  margin-bottom:var(--s-2xs)}
.td-s{color:var(--ink-3);font-size:var(--fs-nano);
  font-variant-numeric:tabular-nums}
.td-thanh{height:6px;border-radius:var(--radius-xs);background:var(--line);overflow:hidden;
  margin:var(--s-3xs) 0}
.td-thanh>i{display:block;height:100%;background:var(--brand);
  transition:width .25s linear}
.td-so{margin:0;font-family:var(--f-ui);font-size:var(--fs-nano);
  color:var(--ink-3)}
.td-l{max-height:40vh;overflow:auto}
@media (prefers-reduced-motion: no-preference) {
  /* Câu mới trượt vào — chỉ transform/opacity, và chỉ MỘT lần mỗi lần vẽ. */
  .td-l .tr-i:last-child{animation:td-vao .35s ease-out both}
}
@keyframes td-vao{from{opacity:0;transform:translateY(4px)}
  to{opacity:1;transform:none}}

/* ══ T03-124 · NHỊP SINH (SCR-22, chủ dự án duyệt 2026-09-07) ═════════════
 *
 * Note nguyên văn: *"UI và animation lúc transcript / chưng cất phải hiệu ứng
 * 3D, superpower (kiểu dải tần số, hiệu ứng âm thanh...) vào nha"*.
 *
 * Dải KHÔNG phải phổ âm thanh — FE không bao giờ cầm byte audio ('M12-R1'),
 * nên không có AudioContext, không có FFT. Chiều cao cột là NHỊP SINH THẬT:
 * bao nhiêu cue và bao nhiêu chữ vừa về trong nhịp poll vừa rồi.
 *
 * Đánh đổi đã chọn ở 'SCR-22': một dải ngẫu nhiên đẹp hơn, và nó NÓI DỐI —
 * nó vẫn nhảy múa khi thợ đã chết. Thợ đứng ⇒ cột phẳng về đáy, và đó là
 * TÍN HIỆU, không phải lỗi hiển thị.
 *
 * 3D bằng 'perspective' + 'translateZ' theo chỉ số cột; cao thấp bằng
 * 'scaleY', KHÔNG bằng 'height' — 'AC6' cấm animate thuộc tính layout, vì
 * 'height' bắt trình duyệt tính lại bố cục 60 lần một giây.
 */
.ns-dai{display:flex;align-items:flex-end;gap:var(--s-3xs);height:34px;
  margin:var(--s-2xs) 0 var(--s-xs);perspective:280px;
  perspective-origin:50% 130%;transform-style:preserve-3d}
/* Cột VUÔNG, không bo góc: một token bo nhỏ nhất (--radius-xs) trên một cột
   rộng ~13px là một cái vòm, không phải một cột. Và gõ tay '1px' để né điều
   đó là đúng thứ token-only cấm — bảng token là hợp đồng, không phải gợi ý. */
.ns-cot{flex:1 1 0;min-width:0;height:100%;
  background:linear-gradient(to top,var(--ok),var(--brand));
  transform-origin:50% 100%;
  transform:scaleY(var(--h,.06)) translateZ(var(--z,0))}
/* Chưng cất KHÔNG có âm thanh. Vẽ dải tần ở đây là mượn hình của một việc
   khác — cùng lỗi "mượn màu của chiều phân loại khác" mà 'SCR-20' đã cấm.
   Ba vòng nói *đang nghĩ* mà KHÔNG nói *còn 40%*: ta không đo được model còn
   bao lâu, và bịa một con số phần trăm là hứa một thứ mình không đo được. */
.ns-nghi{display:grid;place-items:center;height:66px;
  margin:0 0 var(--s-xs);perspective:320px}
.ns-vong{grid-area:1/1;width:52px;height:52px;border-radius:50%;
  border:1.5px solid var(--brand);border-right-color:transparent;
  border-bottom-color:transparent;opacity:.75;transform:rotateX(62deg)}
.ns-vong+.ns-vong{width:38px;height:38px;border-color:var(--ok);
  border-left-color:transparent;border-top-color:transparent;opacity:.6;
  transform:rotateY(70deg)}
.ns-vong+.ns-vong+.ns-vong{width:24px;height:24px;border-color:var(--ink-3);
  border-right-color:transparent;opacity:.5;
  transform:rotateX(28deg) rotateY(28deg)}
/* Cùng chiều opt-in với ba khối trên: mặc định TĨNH, chỉ bật khi người dùng
   KHÔNG khai 'giảm chuyển động'. Người đã khai vẫn ĐỌC ĐƯỢC mọi thứ — dải
   vẫn đúng chiều cao, vòng vẫn đúng tư thế, chỉ thôi chuyển động. Giấu cả
   khối là phạt họ hai lần. */
@media (prefers-reduced-motion: no-preference) {
  .ns-cot{transition:transform .38s cubic-bezier(.2,.9,.3,1)}
  .ns-vong{animation:ns-xoay 8s linear infinite}
  .ns-vong+.ns-vong{animation:ns-xoay-b 6s linear infinite}
  .ns-vong+.ns-vong+.ns-vong{animation:ns-xoay-c 4.5s linear infinite}
}
@keyframes ns-xoay{from{transform:rotateX(62deg) rotateZ(0)}
  to{transform:rotateX(62deg) rotateZ(360deg)}}
@keyframes ns-xoay-b{from{transform:rotateY(70deg) rotateZ(360deg)}
  to{transform:rotateY(70deg) rotateZ(0)}}
@keyframes ns-xoay-c{from{transform:rotateX(28deg) rotateY(28deg) rotateZ(0)}
  to{transform:rotateX(28deg) rotateY(28deg) rotateZ(360deg)}}
/* T03-116 · o chi dan. CSS trong CHUNK, khong prototype.css: gn.css du
   22 byte, va mot luat chi dung trong MOT hop thoai ma nam o bundle chung
   thi moi doc gia tai no.
   KHONG dau huyen nguoc trong khoi nay: no o trong mot template literal,
   nen mot dau huyen nguoc KET THUC chuoi va build chet o dong sau. */
.cd-o{margin-top:var(--s-2xs);border-top:1px solid var(--line);
  padding-top:var(--s-2xs)}
.cd-o > summary{cursor:pointer;font-size:var(--fs-meta);color:var(--ink-2);
  list-style:none}
.cd-o > summary::-webkit-details-marker{display:none}
.cd-o > summary::before{content:"▸ ";color:var(--ink-3)}
.cd-o[open] > summary::before{content:"▾ "}
.cd-ta{width:100%;margin-top:var(--s-2xs);font:inherit;
  font-size:var(--fs-small);color:var(--ink);background:var(--background);
  border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:var(--s-3xs) var(--s-2xs);resize:vertical}
.cd-ta.qua{border-color:var(--negative,#e5484d)}
.cd-chips{display:flex;flex-wrap:wrap;gap:var(--s-3xs);margin-top:var(--s-3xs)}
.cd-chip{font:inherit;font-size:var(--fs-nano);color:var(--ink-2);cursor:pointer;
  background:var(--background);border:1px solid var(--border);
  border-radius:var(--r-pill);padding:2px var(--s-2xs)}
.cd-chip:hover{border-color:var(--accent);color:var(--ink)}
/* ══ SCR-23 (dao lai 2026-09-07) · PHIEU = MODEL + PROMPT ════════════════
 *
 * Chu du an: *"xoa het text comment, mo ta thua thai di. Toi chi can chon
 * model, viet prompt la duoc, ma o viet prompt lam cho to ti."*
 *
 * Bo het: khoi (1) GUI GI (thanh + phan tram) · ba nhan danh so (1)(2)(3) ·
 * khung canh bao ba dong · cau *"Chi dan KHONG doi duoc khung muc"*. Chung la
 * thu toi them, khong phai thu duoc xin.
 *
 * Giu DUNG mot dong cong bo egress (spec §4.0c frozen) va o prompt TO.
 */
.pc-h{display:flex;align-items:center;gap:var(--s-2xs)}
.pc-ico{font-size:var(--fs-lead);line-height:1;opacity:.85}

/* Cong bo egress — MOT dong. spec §4.0c doi khu_vuc phai HIEN; FR-053 §1.4
   doi hien NGUYEN VAN slug. Mot dong ngan van la hien, xoa han moi la im. */
.pc-mp{justify-self:start;padding:0 var(--s-2xs);
  border:1px solid var(--ok);border-radius:var(--radius-lg);
  color:var(--ok);font-size:var(--fs-nano);font-weight:var(--w-head);
  font-family:var(--f-ui);letter-spacing:normal;text-transform:lowercase}
.pc-kv{margin:var(--s-2xs) 0 0;font-size:var(--fs-nano);color:var(--ink-3)}
.pc-kv i{font-style:normal;color:var(--warn,#f5a524)}
.pc-kv b{font-family:var(--f-ui);font-weight:var(--w-head);color:var(--ink-2)}

/* O PROMPT — thu chinh thu hai cua phieu, nen no to. 'rows=8' cho chieu cao
   khoi diem; 'min-height' chan truong hop font nho lam 8 dong van thap. */
.pc-cd{margin-top:var(--s-sm);padding-top:var(--s-sm);
  border-top:1px solid var(--line);display:grid;gap:var(--s-2xs)}
.pc-lb{display:flex;align-items:baseline;font-size:var(--fs-meta);
  font-family:var(--f-ui);letter-spacing:var(--tr-lb);text-transform:uppercase;
  color:var(--ink-2)}
.pc-dem{margin-left:auto;font-style:normal;font-size:var(--fs-nano);
  letter-spacing:normal;text-transform:none;color:var(--ink-3);
  font-variant-numeric:tabular-nums}
.pc-dem.qua{color:var(--negative,#e5484d);font-weight:var(--w-head)}
.pc-ta{display:block;width:100%;box-sizing:border-box;
  font-family:var(--f-ui);font-size:var(--fs-body);line-height:1.55;
  resize:vertical;min-height:11em;padding:var(--s-xs)}
/* CHIP la NUT, nen no phai trong bam duoc. Giu lai vi day khong phai van
   xuoi — ba nhan ngan, va chung la cach viet prompt nhanh nhat. */
.pc-chip{border:1px solid var(--line);border-radius:var(--radius-lg);
  background:transparent;color:var(--ink-2);cursor:pointer;
  padding:var(--s-3xs) var(--s-2xs);font-size:var(--fs-nano);
  font-family:var(--f-ui)}
.pc-chip:hover{border-color:var(--brand);color:var(--ink)}
.pc-chip:active{transform:translateY(1px)}

/* ── CHUYEN DONG — chi giu hai cai con y nghia ────────────────────────────
 * Mac dinh TINH; chi bat khi nguoi dung KHONG khai giam-chuyen-dong. Hai
 * hieu ung cua khoi (1) da di theo khoi ay. */
@media (prefers-reduced-motion: no-preference) {
  .dlg#dlg-cc{animation:pc-vao .24s cubic-bezier(.2,.8,.3,1) both}
  .pc-kv.pc-nhay{animation:pc-nhay .5s ease-out}
}
.dlg#dlg-cc{perspective:900px}
@keyframes pc-vao{from{opacity:0;transform:rotateX(6deg) translateY(-8px)}
  to{opacity:1;transform:none}}
@keyframes pc-nhay{0%{opacity:.4}40%{opacity:1}100%{opacity:1}}
.cd-dem{margin-top:var(--s-3xs);text-align:right;font-size:var(--fs-nano);
  color:var(--ink-3);font-variant-numeric:tabular-nums}
.cd-dem.qua{color:var(--negative,#e5484d)}
.cd-nho{margin-top:var(--s-3xs);font-size:var(--fs-nano);color:var(--ink-3)}
/* dòng meta ở cửa sổ kết quả */
.cd-meta{font-size:var(--fs-nano);color:var(--ink-3);margin-top:var(--s-3xs)}
.cd-meta b{color:var(--ink-2);font-weight:600}
/* Khoi doc ban nhap — dung ngon ngu cua bai trong kho. */
.vc-md{padding:var(--s-xs) 0}
.vc-md h1,.vc-md h2,.vc-md h3{margin:var(--s-sm) 0 var(--s-2xs)}
.vc-md p,.vc-md li{line-height:1.65}
.vc-md pre{overflow-x:auto}`;


/* ── DÂY CHUYỀN: giai đoạn nào ĐANG chạy, còn mấy chặng ───────────────────
 *
 * Chỉ đạo 2026-09-05: *"phải hiển thị tiến trình + animation lông lẫy running
 * chứ — kiểu như nhà máy đang làm việc hãy chờ kết quả"*.
 *
 * Bản cũ hiện MỘT chip chữ (`dang-verify`) và không nói gì về *còn bao xa*.
 * Với một việc chạy 20 giây thì một chip tĩnh không phân biệt được "đang chạy"
 * với "đứng im" — và đó đúng là câu người bấm muốn trả lời.
 *
 * KHÔNG dùng phần trăm: bốn chặng không cho ra một %, và một % bịa từ bốn nấc
 * là con số không ai đo được (cùng lý do `T03-110` đã chốt chip ENUM). Dây
 * chuyền nói ĐÚNG thứ biết được: chặng nào xong, chặng nào đang chạy.
 */
const CHANG = [
  ["cho", "xếp hàng"],
  ["dang-doc-nguon", "đọc nguồn"],
  ["dang-goi-model", "gọi model"],
  ["dang-verify", "đối chiếu"],
  ["xong", "xong"],
];

function nhanNhaMay(ds) {
  const chay = ds.filter((v) => conChayGd(v.giai_doan)).length;
  const xong = ds.filter((v) => v.giai_doan === "xong").length;
  if (chay) {
    return '<i class="cct-live" aria-hidden="true"></i>Nhà máy đang chạy '
      + chay + " việc — kết quả hiện ngay tại đây, không cần chờ ở màn khác.";
  }
  return xong
    ? "Xong " + xong + " việc. Bấm một dòng để mở bản nháp."
    : "Không việc nào đang chạy.";
}

/*
 * Đánh dấu dòng việc CŨ — bản chưng cất của nó không còn trong kho.
 *
 * Chủ dự án chốt 2026-09-07: *"tab chưng cất các bản cũ (old) gạch ngang đỏ
 * luôn đi (giống các bài viết mà bị loại)"*. Cùng ngôn ngữ với `st-rejected`
 * ở lưới, nên người không phải học một dấu hiệu thứ hai.
 *
 * "Cũ" tính TRONG chính danh sách việc: cùng `payload.slug`, cùng `loai`, và
 * có một việc `xong` MỚI HƠN. Không hỏi kho — kho đã dọn bản cũ vào thùng rác
 * (`nhap-cua.mjs::donBanCu`), nên hỏi nó chỉ ra "không thấy", mà "không thấy"
 * còn có nghĩa *chưa duyệt bao giờ*. Hai nghĩa một câu trả lời là chỗ đoán sai.
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

let NHAP_CON = null;      // Set id nháp còn sống; `null` = chưa biết

/*
 * Dòng việc CŨ ẩn MẶC ĐỊNH (chủ dự án chốt 2026-09-07).
 *
 * ẨN, không XOÁ. Một tab chỉ hiện bản mới nhất là một tab không trả lời được
 * *"đã chạy mấy lần, tốn bao nhiêu"* — mà đó là câu hàng đợi việc sinh ra để
 * trả lời. Vết công việc vẫn còn, nó chỉ thôi chen vào mắt người đang tìm
 * bản đang dùng.
 *
 * Và ẩn thì phải ĐẾM: giấu một thứ mà không nói đã giấu bao nhiêu là để người
 * không biết mình đang không thấy gì.
 */
let CU_HIEN = false;

function danhDauCu(ds) {
  const moiNhat = new Map();
  for (const v of ds) {
    const pl = v.payload || {};
    if (v.giai_doan !== "xong" || !pl.slug) continue;
    const kh = String(pl.loai) + "|" + String(pl.slug);
    const cu = moiNhat.get(kh);
    if (!cu || Number(v.nhan_luc || 0) > Number(cu.nhan_luc || 0)) moiNhat.set(kh, v);
  }
  const cu = new Set();
  for (const v of ds) {
    const pl = v.payload || {};
    if (v.giai_doan !== "xong" || !pl.slug) continue;
    const kh = String(pl.loai) + "|" + String(pl.slug);
    if (moiNhat.get(kh) !== v) cu.add(v);
  }
  return cu;
}

function cctDong(v, cu, nhapCon) {
  const { esc } = mw();
  const gd = String(v.giai_doan ?? "?");
  const ly = v.ly_do ?? v.loi ?? "";
  const vt = CHANG.findIndex(([m]) => m === gd);
  const chay = conChayGd(gd);
  const dung = gd === "dung";
  // WO-066 · `hong` KHÔNG nằm trong dây chuyền. Trước đó `gd` lạ rơi về
  // CHANG[0] = "xếp hàng" — tức một việc đã chết hiện chữ "xếp hàng", và
  // đó chính là câu chủ dự án hỏi ba lần: "sao vẫn chờ".
  const hong = gd === "hong";

  /* `aria-label` nói TRẠNG THÁI bằng chữ: dây chuyền là hình, và một người
     đọc bằng screen reader không thấy hình. */
  const day = '<span class="cct-day" role="img" aria-label="'
    + esc(vt >= 0 ? "chặng " + (vt + 1) + "/" + CHANG.length + ": "
      + CHANG[vt][1] : gd) + '">'
    + CHANG.map(([ma, nhan], k) => {
      const xong_ = vt > k || gd === "xong";
      const nay = vt === k && chay;
      return '<i class="cct-b' + (xong_ ? " qua" : nay ? " nay" : "")
        + '" title="' + esc(nhan) + '"></i>';
    }).join("") + "</span>";

  return '<li class="cct-i' + (cu ? " cct-cu" : "") + '" data-gd="' + esc(gd) + '"'
    + (cu ? ' title="bản cũ — bản chưng cất của việc này đã vào thùng rác"' : "") + '>'
    + day
    + '<span class="cct-t"><b>' + esc(hong ? "hỏng" : CHANG[vt >= 0 ? vt : 0][1]) + "</b>"
    // LOẠI VIỆC đứng TRƯỚC tên model: hai việc khác loại cùng nguồn chỉ khác
    // nhau ở đây, và người đọc quét mắt từ trái sang.
    + '<span class="cct-m"><b class="vc-loai" style="--vl:'
    + mauLoai(v.payload?.loai) + '">' + dauLoai(v.payload?.loai) + " "
    + esc(tenLoai(v.payload?.loai))
    + "</b> · " + esc(String(v.model ?? v.payload?.model ?? "?"))
    + "</span></span>"
    + (gd === "xong"
      /*
       * RẼ THEO LOẠI ở ĐÂY NỮA (`WO-061` vòng hai).
       *
       * Lượt trước tôi sửa `veKetQua` (cửa sổ việc) mà QUÊN dòng việc trong
       * tab — nên nó vẫn mời "xem bản nháp" cho một việc `sinh-transcript`,
       * và bấm vào ra "không có nháp <ulid>". Chủ dự án gặp đúng câu đó.
       *
       * Cùng một sự thật phải nói ở HAI CHỖ là hai chỗ để quên một chỗ. Nay cả
       * hai đọc chung `LOAI_KHONG_NHAP`.
       *
       * MỞ CỬA SỔ, không điều hướng: rời trang là mất cả cửa sổ nguồn đang đọc
       * lẫn cửa sổ việc — mà cả điểm của flow là *vừa xem bản gốc vừa duyệt
       * bản chưng cất bên cạnh*.
       */
      ? (LOAI_KHONG_NHAP.has(String(v.payload && v.payload.loai))
        ? '<button type="button" class="cct-l" data-cctr="'
          + mw().esc(String(v.payload?.slug ?? "")) + '">xem transcript &rsaquo;</button>'
        : (function () {
          const nid = String((v.ket_qua && v.ket_qua.nhap_id) || v.ulid || "");
          // `null` = không hỏi được danh sách ⇒ KHÔNG đoán, giữ nút.
          const con = !nhapCon || nhapCon.has(nid);
          return con
            ? '<button type="button" class="cct-l" data-ccxem="' + esc(nid)
              + '">xem bản nháp &rsaquo;</button>'
            : '<em class="cct-e">bản nháp đã dọn — bản mới hơn đã thay</em>';
        })())
      : hong || dung || ly ? '<em class="cct-e">' + esc(String(ly || (hong ? "hỏng, không rõ lý do" : "đã dừng"))) + "</em>"
        : '<span class="cct-w">đang làm…</span>')
    + "</li>";
}

/* ══ T03-112 · CỬA SỔ VIỆC CHẠY SONG SONG ═════════════════════════════════
 *
 * Flow chốt (chủ dự án 2026-09-05): *"đang đọc bài → bấm Chưng cất → mở một
 * cửa sổ chạy SONG SONG bên cạnh → xong thì kết quả trải ra ngay trong cửa sổ
 * đó → nút DUYỆT ở luôn đó"*.
 *
 * Vì sao CỬA SỔ chứ không tab của cửa sổ đang đọc (đè hình dạng `T03-110`):
 * một tab thì người phải RỜI bài đang đọc để xem tiến trình, rồi rời tiến
 * trình để xem lại bài. Hai cửa sổ cạnh nhau là *"vừa xem bản gốc vừa xem bản
 * chưng cất"* — chính câu chỉ đạo.
 *
 * Tab `T03-110` GIỮ, nhưng đổi vai: nó là LỊCH SỬ việc của bản ghi (mặt tra
 * cứu), còn cửa sổ này là mặt trải nghiệm.
 */

const NHIP_VIEC = 3000;

/** Cửa sổ việc đang mở: `ulid → {id, hen, t0}`. */
const VIEC_MO = new Map();

function dungHen(u) {
  const x = VIEC_MO.get(u);
  if (x && x.hen) { clearInterval(x.hen); x.hen = null; }
  NHIP_DAI.delete(u);
}

/*
 * MỞ cửa sổ cho một việc vừa xếp hàng.
 *
 * `nguon` là phần tử cửa sổ ĐANG ĐỌC — truyền xuống `mo()` để nó đặt cạnh.
 * Không có (bấm từ `/chung-cat/`) thì `mo()` xếp chồng như thường.
 */
/*
 * `loai` đi cùng cửa sổ (`WO-061`).
 *
 * Bug chủ dự án bắt: một việc `sinh-transcript` mở ra cửa sổ mang nhãn
 * "Chưng cất", rồi kết thúc bằng câu *"tìm ở hàng nháp"* — nơi một việc
 * transcript KHÔNG BAO GIỜ sinh nháp. Chủ dự án đi tới đó, thấy `0 nháp`, và
 * báo là lỗi. Đúng là lỗi: màn nói sai việc nó vừa làm.
 */
/* Nhãn theo LOẠI. Bảng ở đây, không rải `if` — thêm một loại việc là thêm một
   dòng, và mọi chỗ hiện nhãn đổi cùng lúc. */
const NHAN = { "sinh-transcript": "Sinh transcript" };
/* Loại việc KHÔNG sinh bản nháp. Một tập, hai chỗ đọc (dòng việc + cửa sổ kết
   quả) — thêm một loại là thêm một chuỗi, và cả hai chỗ đổi cùng lúc. */
const LOAI_KHONG_NHAP = new Set(["sinh-transcript"]);
const NHAN_VIEC = (l) => NHAN[String(l)] || "Chưng cất";

function moCuaSoViec(ulid, ban, nguon, loai) {
  trCss();
  const w = globalThis.__GN_MW__;
  if (!w || !w.mo) return null;
  const id = w.mo({
    bans: [{
      slug: "viec/" + String(ulid).slice(0, 10),
      title: NHAN_VIEC(loai) + " · " + String((ban && (ban.slug || ban.title)) || ""),
      source_type: "article",
      credibility_max: "—", review_status: "draft", origin: "manual",
      priority: 0, concepts: [], concepts_proposed: [], category: [],
      analyzed_at: "", one_liner: "",
      than: "",
    }],
  }, { canh: nguon, kieu: "nhap" });
  VIEC_MO.set(ulid, { id, hen: null, t0: Date.now(), loai });
  void veViec(ulid);
  const x = VIEC_MO.get(ulid);
  if (x) x.hen = setInterval(() => void veViec(ulid), NHIP_VIEC);
  return id;
}

function oViec(ulid) {
  const x = VIEC_MO.get(ulid);
  const mwx = globalThis.__GN_MW__;
  const w = x && mwx && mwx.WIN ? mwx.WIN.get(x.id) : null;
  // Cửa sổ đã đóng ⇒ DỪNG poll. Không có phép này thì đóng cửa sổ vẫn gọi API
  // mãi — đúng thứ ma trận UI cấm ("không poll nền vô hạn").
  if (!w) { dungHen(ulid); VIEC_MO.delete(ulid); return null; }
  return w.el ? w.el.querySelector(".doc") : null;
}

/** `ms → 0:07` — đồng hồ elapsed, thứ nói "nó còn đang chạy". */
function dongHo(ms) {
  const g = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(g / 60) + ":" + String(g % 60).padStart(2, "0");
}

async function veViec(ulid) {
  const doc = oViec(ulid);
  if (!doc) return;
  const x = VIEC_MO.get(ulid);
  let v = null;
  try {
    const r = await fetch("/api/viec/" + encodeURIComponent(ulid));
    if (r.status === 404) throw new Error("việc không còn trong hàng đợi");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi || ("dịch vụ trả " + r.status));
    v = j;
  } catch (e) {
    /*
     * MẠNG CHỚP KHÔNG ĐƯỢC GIẾT MỘT CỬA SỔ ĐANG ĐÚNG.
     *
     * Bản trước dừng poll ở nhịp lỗi ĐẦU TIÊN. Đo 2026-09-07 (log
     * `api-loi.jsonl` + `wmic`): một lần `chay.sh` restart làm cổng chết ~4
     * giây, và cửa sổ chưng cất của chủ dự án chết hẳn với chuỗi thô
     * *"Failed to fetch"* — trong khi việc bên dưới vẫn chạy đúng và xong.
     *
     * `theoDoiChungCat` cùng file đã làm đúng từ đầu: 60 nhịp (~90 giây) mới
     * bỏ cuộc. Hai đường theo dõi mà hai hành vi là một khác biệt KHÔNG AI
     * CHỌN — tức một khác biệt do quên. Nay cùng một ngưỡng.
     *
     * Ca `404` KHÔNG chờ: *"việc không còn trong hàng đợi"* là một câu trả
     * lời DỨT KHOÁT của server, không phải một lần mạng chớp.
     */
    const dut = String(e.message || "").includes("không còn trong hàng đợi");
    if (x) x.treo = (x.treo ?? 0) + 1;
    if (!dut && x && x.treo <= 60) {
      // Giữ NGUYÊN thân đang hiện — đừng xoá tiến độ người đang đọc để thay
      // bằng một câu tạm. Chỉ thêm một dòng nói đang thử lại.
      let n = doc.querySelector(".vc-chop");
      if (!n) {
        n = document.createElement("p");
        n.className = "al vc-chop";
        doc.appendChild(n);
      }
      n.textContent = "Mất liên lạc với dịch vụ — đang thử lại…";
      return;
    }
    doc.innerHTML = '<p class="f-loi"></p>';
    const o = doc.querySelector(".f-loi");
    if (o) {
      o.textContent = dut
        ? String(e.message || e)
        : "Mất liên lạc với dịch vụ sau 60 lần thử. Việc có thể vẫn đang chạy "
          + "— mở lại thẻ của nó ở hàng việc để xem.";
    }
    dungHen(ulid);
    return;
  }
  if (x) x.treo = 0;                 // nối lại được ⇒ xoá bộ đếm chịu-đựng
  doc.querySelector(".vc-chop")?.remove();
  const gd = String(v.giai_doan || "?");
  if (gd === "xong") {
    dungHen(ulid);
    await veKetQua(doc, v, ulid);
    return;
  }
  if (gd === "dung") dungHen(ulid);
  doc.innerHTML = veDayChuyen(gd, dongHo(Date.now() - ((x && x.t0) || Date.now())), v)
    /*
     * T03-108 + T12-19 · SINH TỚI ĐÂU HIỆN TỚI ĐÓ.
     *
     * Chỉ đạo: *"nó sinh chữ tới đâu thì show tới đó"*. `tien_do` do THỢ tính
     * từ file checkpoint (`T12-19`), nên FE không phải đoán tiến độ từ giai
     * đoạn — nó đọc số cue THẬT đã phiên âm.
     *
     * Chỉ hiện khi CÓ: một khung transcript rỗng trong lúc chờ nói *"chưa có
     * gì"* mạnh hơn là nói *"đang chạy"*, và người sẽ tưởng hỏng.
     */
    + veTienDo(v);
}

/* PHA ĐANG CHẠY — dây chuyền + đồng hồ. Cùng bảng `CHANG` với tab lịch sử: hai
 * bảng cho một chuỗi giai đoạn là hai chỗ để lệch. */
/*
 * TIẾN ĐỘ transcript — cue đã sinh, hiện ngay trong cửa sổ việc.
 *
 * Đổ bằng `textContent` như mọi nội dung model sinh. Cắt 12 cue CUỐI: người
 * đang xem muốn biết *nó vừa nghe được gì*, không phải đọc lại từ đầu — và
 * một khung dài vô hạn tự cuộn là khung không đọc được.
 */
/*
 * TIẾN ĐỘ TẢI FILE (`T12-27`) — thanh + số, không phải một câu.
 *
 * Chủ dự án 2026-09-06: *"phải có tab hiển thị tiến trình tải chứ chỉ hiện
 * thông báo thì sao biết tải về được hay chưa?"*.
 *
 * Một câu "đang tải…" rồi im lặng năm phút là một màn không phân biệt được
 * với một màn đã chết — và với file hàng trăm MB, khoảng im lặng ấy đủ dài để
 * người bấm lại, tạo một job thứ hai tải cùng một thứ.
 *
 * Ba con số vì mỗi con trả lời một câu khác nhau: phần trăm (*bao xa rồi*),
 * cỡ (*bao lớn*), tốc độ + ETA (*còn bao lâu*). Bỏ hai con sau thì thanh chạy
 * vẫn không nói được điều người thật sự hỏi.
 */
function veTienDoTai(v) {
  const td = v && v.tien_do;
  if (!td || typeof td.phan_tram !== "number") return "";
  const esc = mw().esc;
  const pt = Math.max(0, Math.min(100, Number(td.phan_tram)));
  const xong = td.xong === true || pt >= 100;
  return '<div class="td-k"><div class="td-h"><b>'
    + (xong ? "Tải xong" : "Đang tải")
    + (td.chat_luong ? " · " + esc(String(td.chat_luong))
      + (String(td.chat_luong) === "goc" ? "" : "p") : "")
    + '</b><span class="td-s">' + pt.toFixed(1) + "%"
    + (td.tong ? " của " + esc(String(td.tong)) : "") + "</span></div>"
    + '<div class="td-thanh"><i style="width:' + pt.toFixed(1) + '%"></i></div>'
    + '<p class="td-so">'
    + (td.toc_do ? esc(String(td.toc_do)) : "")
    + (td.con_lai ? " · còn " + esc(String(td.con_lai)) : "")
    + "</p></div>";
}

/*
 * DẢI NHỊP SINH — 24 cột, chiều cao là một PHÉP ĐO.
 *
 * Mỗi nhịp poll (1.2s) đẩy vào một cột mới: bao nhiêu cue và bao nhiêu ký tự
 * SINH THÊM kể từ nhịp trước. Dải trượt trái một cột mỗi nhịp, nên cột phải
 * cùng là mới nhất.
 *
 * KHÔNG `Math.random()`. `SCR-22` chọn lối này và nói rõ vì sao: một dải
 * nhảy múa trong lúc thợ đã chết tệ hơn không có dải — người ngồi đợi một
 * thanh chạy cho một việc đã dừng. Chuyển động phải là phép đo, không phải
 * một lớp trang trí.
 *
 * `aria-hidden`: dải là HÌNH của con số đã nằm ngay trên nó ("142 câu · tới
 * 09:12"). Đọc lại nó bằng giọng nói là bắt người dùng nghe hai lần một
 * thông tin, lần thứ hai vô nghĩa.
 */
const NHIP_DAI = new Map();
const SO_COT = 24;

function veDaiSong(v) {
  const td = v && v.tien_do;
  const ulid = String((v && v.ulid) || "");
  if (!td || !ulid) return "";
  const cue = Number(td.cue_xong || 0);
  const ky = String(td.vtt_tung_phan || "").length;
  let s = NHIP_DAI.get(ulid);
  if (!s) {
    s = { cot: new Array(SO_COT).fill(0), cue: cue, ky: ky };
    NHIP_DAI.set(ulid, s);
  }
  const dCue = Math.max(0, cue - s.cue);
  const dKy = Math.max(0, ky - s.ky);
  s.cue = cue; s.ky = ky;
  // Hai phép đo, hai thang. Chuẩn hoá rồi lấy cái LỚN HƠN: một nhịp về ít cue
  // nhưng cue dài vẫn là một nhịp làm việc thật.
  const m = Math.min(1, Math.max(dCue / 4, dKy / 260));
  s.cot.push(m);
  s.cot.shift();
  return '<div class="ns-dai" aria-hidden="true">' + s.cot.map(function (h, i) {
    return '<i class="ns-cot" style="--h:' + (0.06 + h * 0.94).toFixed(3)
      + ";--z:" + (i - SO_COT / 2).toFixed(0) + 'px"></i>';
  }).join("") + "</div>";
}

/** Ba vòng lệch pha — *đang nghĩ*, không phải *còn 40%*. Xem `.ns-vong`. */
function veVongNghi() {
  return '<div class="ns-nghi" aria-hidden="true">'
    + '<i class="ns-vong"></i><i class="ns-vong"></i><i class="ns-vong"></i>'
    + "</div>";
}

function veTienDo(v) {
  // `tai-video` và `sinh-transcript` đi CHUNG khoá `tien_do` nhưng KHÁC hình
  // dạng. Rẽ theo hình dạng dữ liệu, không theo tên việc: cùng một hàm đọc
  // hai thứ mà đoán theo tên là thêm một chỗ để lệch.
  if (v && v.tien_do && typeof v.tien_do.phan_tram === "number") {
    return veTienDoTai(v);
  }
  const td = v && v.tien_do;
  if (!td || !td.cue_xong) return "";
  const cue = docVtt(String(td.vtt_tung_phan || "")).slice(-12);
  const esc = mw().esc;
  return '<div class="td-k"><div class="td-h"><b>Đang phiên âm</b>'
    + '<span class="td-s">' + Number(td.cue_xong) + " câu · tới "
    + mmss(Number(td.giay_xong || 0)) + "</span></div>"
    + veDaiSong(v)
    + '<ol class="tr td-l">' + cue.map((c) =>
      '<li class="tr-i"><span class="tr-t">' + mmss(c.tu) + "</span>"
      + "<span>" + esc(c.text) + "</span></li>").join("") + "</ol></div>";
}

function veDayChuyen(gd, dh, v) {
  const esc = mw().esc;
  const vt = CHANG.findIndex(([m]) => m === gd);
  const chay = conChayGd(gd);
  const dung = gd === "dung";
  const hong = gd === "hong";
  return '<div class="vc">'
    + '<div class="vc-h"><i class="vc-den' + (chay ? " chay" : "") + '"></i>'
    + "<b>" + (hong ? "Việc hỏng" : dung ? "Đã dừng" : "Nhà máy đang chạy") + "</b>"
    + '<span class="vc-dh">' + esc(dh) + "</span></div>"
    + '<ol class="vc-b">' + CHANG.map(function (c, k) {
      const qua = vt > k;
      const nay = vt === k && chay;
      return '<li class="' + (qua ? "qua" : nay ? "nay" : "") + '">'
        + "<i></i><span>" + esc(c[1]) + "</span></li>";
    }).join("") + "</ol>"
    + '<p class="vc-m">' + esc(String((v.payload && v.payload.model) || v.model || ""))
    + " · gửi " + Number(v.lan_gui || 0) + "/2</p>"
    + (hong
      ? '<p class="al">🗑 Đã chuyển vào thùng rác. '
        + esc(String(v.loi || "Việc hỏng, không rõ lý do."))
        + (v.giai_doan_hong ? " (hỏng ở chặng: " + esc(String(v.giai_doan_hong)) + ")" : "")
        + " Transcript đã có tới đâu vẫn giữ.</p>"
        + (Number(v.lan_gui || 0) < 2
          ? '<button type="button" class="bt sm" data-cclai="' + esc(String(v.ulid || "")) + '">'
            + "↻ Chạy lại từ chỗ hỏng (gửi " + (Number(v.lan_gui || 0) + 1) + "/2)</button>"
          : '<p class="al">Đã dùng hết 2 lần gửi (M12-R6). Cần nữa thì tạo VIỆC MỚI.</p>')
      : dung
      ? '<p class="al">Việc đã dừng. Trần M12-R6 không reset — cần chạy lại thì tạo VIỆC MỚI.</p>'
      : "")
    + "</div>";
}

/*
 * PHA XONG — kết quả trải ra NGAY trong cửa sổ, kèm nút DUYỆT.
 *
 * `nhap_id` lấy từ `ket_qua` mà worker ghi vào việc (`WO-052`). Việc cũ chưa
 * có trường đó ⇒ nói thẳng, KHÔNG đoán theo slug: đoán sai là mở nhầm bản nháp
 * của một lần chạy khác, và người bấm Duyệt lên nhầm bản.
 */
async function veKetQua(doc, v, ulid) {
  const esc = mw().esc;
  const loai = String((v.payload && v.payload.loai)
    || (VIEC_MO.get(ulid) || {}).loai || "");
  /*
   * RẼ THEO LOẠI trước khi nói gì (`WO-061`).
   *
   * Việc `sinh-transcript` KHÔNG BAO GIỜ sinh bản nháp — nó gắn một hiện vật
   * `.vtt` vào chính bản ghi. Câu cũ chỉ mọi người sang "hàng nháp" bất kể
   * loại việc, nên sau một lần sinh transcript, chủ dự án đi tới đó và thấy
   * `0 nháp`. Chỉ người tới một nơi chắc chắn trống là tệ hơn không chỉ gì.
   */
  if (LOAI_KHONG_NHAP.has(loai)) {
    /*
     * MỜI CHƯNG CẤT NGAY (chủ dự án 2026-09-07: *"sau khi sinh transcript
     * xong thì hiển thị luôn thông báo «bạn có muốn chưng cất nội dung video
     * luôn không?» → chưng cất"*).
     *
     * Đặt lời mời ở ĐÂY vì đây là chỗ người đang nhìn khi việc xong. Bắt họ
     * đi tìm nút ở một cửa sổ khác là bắt họ nhớ hộ hệ thống — và `FR-070`
     * vừa làm cho *"transcript xong"* thành đúng điều kiện của bước sau.
     *
     * `slug` đi qua `data-slug`, KHÔNG qua biến đóng: thân này là chuỗi HTML
     * đổ vào `innerHTML`, nên bộ nghe phải đọc lại slug từ DOM.
     */
    const sl = String((v.payload && v.payload.slug) || "");
    /*
     * WO-081 · HIỆN CHÍNH TRANSCRIPT, không hiện một tờ giấy chỉ đường.
     *
     * Chủ dự án 2026-09-09: *"transcript đã xong là hiển thị kết quả transcript
     * luôn — thông báo lại cái hiệu ứng xanh lá cây đơn giản thôi"*.
     *
     * Bản cũ chiếm cả cửa sổ bằng một đoạn văn bảo người *"mở tab Transcript ở
     * cửa sổ bản ghi"* — tức bắt người đi một chặng nữa để xem thứ vừa làm
     * xong, trong khi chỗ họ đang nhìn thừa sức hiện nó. Câu ấy nay rút thành
     * một dòng xanh: nó vẫn nói `transcript là hiện vật của bản ghi, không vào
     * hàng nháp` — một sự thật cần biết — nhưng không đứng chắn nữa.
     */
    doc.innerHTML = '<div class="vc">'
      + '<p class="vc-ok">✓ Đã xong · transcript gắn vào bản ghi, không vào hàng nháp</p>'
      + '<div class="vc-tr"><p class="ld">Đang đọc transcript…</p></div></div>';
    const o = doc.querySelector(".vc-tr");
    /*
     * ⚠️ TRANSCRIPT TRƯỚC, NÚT SAU — và mỗi việc một `try` riêng.
     *
     * Bản đầu của tôi gọi `veNutChungCatTuTranscript` NGOÀI `try`, phía trên
     * phần đọc transcript. Chủ dự án chụp lại hậu quả: panel đứng ở *"Đang đọc
     * transcript…"* vĩnh viễn, nút footer không hiện, console SẠCH.
     *
     * Sạch vì `await veKetQua(...)` ở dòng ~712 nằm trong một `try` mà `catch`
     * của nó viết cho ca *"mất liên lạc với dịch vụ"*. Một lỗi bất kỳ trong
     * panel rơi vào đó và bị nuốt câm — DOM đứng nguyên ở dòng cuối đã ghi.
     *
     * Nên: thứ NGƯỜI ĐANG CHỜ (transcript) dựng trước và tự bảo vệ; nút là
     * phần thêm, hỏng thì mất nút chứ không được kéo theo transcript.
     */
    try {
      const cue = await docTranscriptTheoSlug(sl);
      o.innerHTML = cue.length
        ? '<ol class="tr">' + cue.map((c) =>
          '<li class="tr-i"><button class="tr-t" data-t="' + mmss(c.tu) + '">'
          + mmss(c.tu) + "</button><span>" + esc(c.text) + "</span></li>").join("")
          + "</ol>"
        : '<p class="empty">File transcript rỗng — không cue nào đọc được.</p>';
    } catch (e) {
      // Đọc hỏng KHÔNG được nuốt thành màn trắng: việc đã xong thật, và người
      // phải phân biệt "chưa có" với "có mà tôi không đọc được".
      o.innerHTML = '<p class="f-loi">Không đọc được transcript: '
        + esc(String(e.message ?? e)) + "</p>";
    }
    // Nút là phần THÊM: `try` riêng, và hỏng thì chỉ mất nút.
    try {
      if (sl) veNutChungCatTuTranscript(doc, sl);
    } catch (e) {
      console.warn("[cctab] không dựng được nút chưng cất:", e);
    }
    return;
  }
  const nhap = v.ket_qua && v.ket_qua.nhap_id;
  if (!nhap) {
    doc.innerHTML = '<div class="vc"><p class="vc-xong">Đã xong</p>'
      + '<p class="al">Việc này chạy trước khi hệ ghi con trỏ kết quả, nên '
      + 'không mở thẳng được bản nháp. Tìm ở <a href="/chung-cat/nhap/">hàng nháp</a>.</p></div>';
    return;
  }
  doc.innerHTML = '<div class="vc"><p class="ld">Đang đọc bản chưng cất…</p></div>';
  try {
    const r = await fetch("/api/nhap-chung-cat/" + encodeURIComponent(nhap));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi || ("dịch vụ trả " + r.status));
    const cit = (v.ket_qua && v.ket_qua.citations) || {};
    const daVao = j.trang_thai === "da_duyet";
    doc.innerHTML = '<div class="vc xong" data-nhap="' + esc(nhap) + '">'
      + '<div class="vc-h"><i class="vc-tick"></i><b>Xong</b>'
      + '<span class="vc-ct">' + Number(cit.citations_verified || 0) + "/"
      + Number(cit.citations_sampled || 0) + " trích dẫn đối chiếu</span></div>"
      + '<div class="vc-md vc-t"></div>'
      + '<div class="vc-act">'
      + '<button class="bt pri" data-ccduyet="' + esc(nhap) + '"'
      + (daVao ? " disabled" : "") + ">Duyệt vào kho</button>"
      + '<a class="bt ghost sm" href="/chung-cat/nhap/">mở hàng nháp</a>'
      + '<span class="vc-tt">' + (daVao ? "ĐÃ VÀO KHO" : "đang là bản nháp")
      + "</span></div></div>";
    /*
     * Dựng MARKDOWN, và vẫn giữ nguyên phép chặn của `AC2`.
     *
     * Chú thích cũ ở đây đúng về ràng buộc: thân do MODEL sinh, `<script>`
     * phải hiện ra như CHỮ. Đã kiểm `md()` trước khi đổi — `inline()` chạy
     * `esc()` TRƯỚC mọi phép dựng thẻ, nên `<script>` thành `&lt;script&gt;`
     * và không bao giờ thành DOM. Đổi cách HIỆN, không đổi phép chặn.
     *
     * Vì sao phải đổi: chủ dự án — *"format lại result view như các bài viết,
     * hiển thị markdown thế ai xem?"*. Người duyệt phải ĐỌC bản này để quyết;
     * một khối `# ## **` chưa dựng thì đọc bằng mắt rất mệt, và mệt thì người
     * duyệt qua loa.
     */
    const o = doc.querySelector(".vc-t");
    if (o) veThanNhap(o, String(j.ban_hien_tai || j.ban_goc_ai || ""));
  } catch (e) {
    doc.innerHTML = '<p class="f-loi"></p>';
    const o = doc.querySelector(".f-loi");
    if (o) o.textContent = String(e.message || e);
  }
}

/*
 * DUYỆT TẠI CHỖ — gọi ĐÚNG cửa duyệt sẵn có
 * (`POST /api/nhap-chung-cat/<id>/duyet`).
 *
 * FE chỉ thêm một cái NÚT, KHÔNG thêm đường ghi: `api-guard` whitelist không
 * đổi vì đơn vị này, và mọi phép kiểm của cửa (validate → ghiSauValidate) vẫn
 * chạy y như khi duyệt từ màn nhập.
 */
async function duyetTaiCho(nhap, nut) {
  if (nut) nut.disabled = true;
  try {
    const r = await fetch("/api/nhap-chung-cat/" + encodeURIComponent(nhap) + "/duyet",
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi_validate || j.loi || ("dịch vụ trả " + r.status));
    const goc = nut ? nut.closest(".vc") : null;
    const tt = goc ? goc.querySelector(".vc-tt") : null;
    if (tt) tt.textContent = "ĐÃ VÀO KHO";
    if (goc) goc.classList.add("da-vao");
    mw().bao(false, "Đã duyệt vào kho.");
  } catch (e) {
    if (nut) nut.disabled = false;
    mw().bao(true, "Không duyệt được: " + String(e.message || e));
  }
}

/* WO-067 · CHẠY LẠI việc hỏng từ đúng chặng. Một lần bấm = lần gửi thứ hai
   (`M12-R6`) — nút đã in "gửi n/2" nên người bấm biết mình đang tiêu gì.
   Mã của THỢ đi nguyên: 409 (chạm trần / không ở `hong`) phải hiện đúng câu. */
async function chayLaiViec(ulid, nut) {
  nut.disabled = true;
  nut.textContent = "↻ đang xếp lại…";
  try {
    const r = await fetch("/api/viec/" + encodeURIComponent(ulid) + "/lai", { method: "POST" });
    let j = null;
    try { j = await r.json(); } catch { /* thân rỗng */ }
    if (!r.ok) throw new Error(String((j && j.loi) || ("HTTP " + r.status)));
    mw().bao(false, "Đã xếp lại — chạy tiếp từ chỗ đã có, không từ đầu.");
    void veViec(ulid);
  } catch (e) {
    nut.disabled = false;
    nut.textContent = "↻ Chạy lại từ chỗ hỏng";
    mw().bao(true, "Không chạy lại được: " + String(e.message || e));
  }
}

document.addEventListener("click", function (e) {
  const xem = e.target instanceof Element && e.target.closest("[data-ccxem]");
  if (xem) {
    e.preventDefault();
    void moCuaSoNhap(String(xem.dataset.ccxem || ""), null);
    return;
  }
  const lai = e.target instanceof Element && e.target.closest("[data-cclai]");
  if (lai) {
    e.preventDefault();
    void chayLaiViec(String(lai.dataset.cclai || ""), lai);
    return;
  }
  const t = e.target;
  if (!(t instanceof Element)) return;
  const d = t.closest("[data-ccduyet]");
  if (d) {
    e.preventDefault();
    void duyetTaiCho(d.dataset.ccduyet || "", d);
  }
});

/* ══ T03-113 · CỬA SỔ NHÁP — đúng cửa, đúng bộ nút ════════════════════════
 *
 * Bản nháp KHÔNG nằm trong kho. Nó sống ở DB nháp, khoá `job_ulid`, đọc bằng
 * `GET /api/nhap-chung-cat/<id>` — một lời gọi trả CẢ `ban_goc_ai` lẫn
 * `ban_hien_tai` (`T08-22`).
 *
 * Và bộ nút phải đúng VAI: một bản chưa vào kho không có "Đưa lên site" hay
 * "Bỏ khỏi kho" — hai nút đó là đời sống của bài ĐÃ vào kho. Vai của nháp là
 * Duyệt · Sửa · Trả lại · Bỏ.
 */
const NHAP_MO = new Map();

async function moCuaSoNhap(id, nguon) {
  const w = globalThis.__GN_MW__;
  if (!w || !w.mo) return null;
  trCss();
  let j = null;
  try {
    const r = await fetch("/api/nhap-chung-cat/" + encodeURIComponent(id));
    const t = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(t.loi || ("dịch vụ trả " + r.status));
    j = t;
  } catch (e) {
    mw().bao(true, String(e.message || e));
    return null;
  }
  /*
   * `da_duyet` ⇒ bài ĐÃ vào kho, và lúc này đường `/api/articles/…` mới đúng.
   * Mở cửa sổ bài-kho thật để người có đủ bộ nút của bài trên site.
   */
  if (j.trang_thai === "da_duyet") {
    /*
     * ĐI CỬA THẬT, không bịa bản ghi.
     *
     * Bản trước dựng tay một `ban` với `than: ""` và mọi trường trống rồi
     * giao cho `mo()`. Kết quả trên màn: *"Bản này không có thân bài."* —
     * cùng một bài mà mở từ `/bai-viet/` thì đủ chữ, mở từ đây thì rỗng.
     * Một cửa sổ dựng từ bản ghi bịa thì SAI MỌI TRƯỜNG, không riêng thân.
     *
     * `moTheoSlug` (`T03-118`) đã đọc cửa thật và bóc phong bì
     * `{frontmatter, body}`. Dùng lại nó là dùng lại một đường đã có cổng
     * canh; bịa một đường thứ hai là dựng hai sự thật cho một bài.
     */
    const duong = duongDayDu(j);
    if (duong && w.moTheoSlug) {
      void w.moTheoSlug(duong, nguon);
      return null;
    }
    if (duong) {
      mw().bao(true, "Bản này đã vào kho — mở nó ở màn Bài viết (" + duong + ").");
      return null;
    }
  }
  const wid = w.mo({
    bans: [{
      slug: "nhap/" + String(id).slice(0, 10),
      title: "Nháp · " + (tomSlug(j) || String(id).slice(0, 10)),
      source_type: "article", credibility_max: "—",
      review_status: j.review_status || "draft", origin: "pipeline",
      priority: 0, concepts: [], concepts_proposed: [], category: [],
      analyzed_at: String(j.tao_luc || "").slice(0, 10), one_liner: "",
      than: "",
    }],
  }, { canh: nguon, kieu: "nhap" });
  NHAP_MO.set(id, wid);
  veCuaSoNhap(wid, id, j);
  return wid;
}

/** `slug:` trong frontmatter của bản nháp — không parse YAML cho một dòng. */
function tomSlug(j) {
  const t = String(j.ban_hien_tai || j.ban_goc_ai || "");
  const m = /^slug:\s*(.+)$/m.exec(t);
  return m ? m[1].trim() : "";
}

/*
 * ĐƯỜNG BÀI ĐẦY ĐỦ `<loại>/<slug>` — `FR-031` + bất biến `duongBai`.
 *
 * `tomSlug` trả slug TRẦN vì frontmatter của bản nháp khai `slug:` không kèm
 * loại. Đưa slug trần vào `/api/articles/…` là 404, và 404 ở đây KHÔNG hiện
 * thành câu lỗi — nó hiện thành một cửa sổ trống câm, nên không ai biết nó
 * vừa 404 (chủ dự án bắt đúng ca này 2026-09-06).
 *
 * Mặc định `article`: `T12-20` chốt bản nháp chưng cất luôn dựng
 * `source_type: article`. Vẫn ĐỌC frontmatter trước — mặc định là lối cuối,
 * không phải lối đầu.
 */
function duongDayDu(j) {
  const slug = tomSlug(j);
  if (!slug) return "";
  if (slug.includes("/")) return slug;          // đã đủ, không bọc hai lần
  const t = String(j.ban_hien_tai || j.ban_goc_ai || "");
  const m = /^source_type:\s*(.+)$/m.exec(t);
  // Dấu nháy viết bằng "/', KHÔNG viết trần trong regex.
  //
  // Cổng `chunk-tu-chua` bỏ chuỗi bằng regex mà KHÔNG hiểu regex literal:
  // một dấu " nằm trong `/…/` bị nó tưởng là mở chuỗi, và từ đó nó LỆCH PHA
  // toàn file — đo được 2026-09-06: nó tố `model(` và `local(`, hai mảnh
  // nằm giữa hai câu chữ CÓ SẴN cách đó hàng nghìn ký tự.
  /*
   * Dấu nháy viết bằng `\x22`/`\x27`, KHÔNG viết trần trong regex.
   *
   * Cổng `chunk-tu-chua` bỏ chuỗi bằng một regex mà nó KHÔNG hiểu regex
   * literal: một dấu `"` nằm trong `/…/` bị tưởng là mở chuỗi, và từ đó nó
   * LỆCH PHA cả file. Đo được 2026-09-06: nó tố `model(` và `local(` — hai
   * mảnh nằm giữa hai câu chữ CÓ SẴN, cách chỗ tôi sửa hàng nghìn ký tự.
   * Cổng sai, nhưng chữa cổng là việc của đơn vị test; ở đây tôi viết cách
   * không giẫm vào nó, và mở ô nợ.
   */
  const loai = m ? m[1].trim().replace(/^[\x22\x27]|[\x22\x27]$/g, "") : "article";
  return loai + "/" + slug;
}

/*
 * Bản nháp hiện như MỘT BÀI, không như một khối chữ thô (`WO-062`).
 *
 * Chủ dự án: *"format lại result view như các bài viết, hiển thị markdown thế
 * ai xem?"*. Đúng — người duyệt phải ĐỌC bản này để quyết, mà một khối
 * `# ## **` chưa dựng thì đọc bằng mắt rất mệt, và mệt thì người duyệt qua loa.
 *
 * Dùng `md()` của `gn.js` qua cầu — CÙNG bộ dựng với bài trong kho, nên bản
 * nháp trông đúng như nó sẽ trông sau khi duyệt. Hai bộ dựng cho một loại nội
 * dung là hai chỗ để lệch, và người duyệt sẽ duyệt trên một hình dạng khác
 * hình dạng cuối.
 *
 * FRONTMATTER cắt bỏ khỏi phần đọc: nó là siêu dữ liệu, không phải bài. Nhưng
 * KHÔNG giấu — dòng meta chỉ dẫn ở trên đã nói phần cần biết.
 */
function veThanNhap(o, ban) {
  const t = String(ban || "");
  const than = t.startsWith("---") ? t.split("---").slice(2).join("---") : t;
  const md = mw().md;
  if (typeof md !== "function") {
    // Cầu chưa có `md` (bản `gn.js` cũ) ⇒ rơi về chữ thô, KHÔNG để trống.
    const pre = document.createElement("pre");
    pre.className = "hv-txt";
    pre.textContent = than.trim();
    o.replaceChildren(pre);
    return;
  }
  o.innerHTML = md(than.trim());
}

function veMetaChiDan(j) {
  const cd = String(j?.chi_dan || docChiDanTuBan(j) || "").trim();
  if (!cd) return "";               // không có ⇒ VẮNG HẲN, không dòng rỗng
  const esc = mw().esc;
  const gon = cd.length > 60 ? cd.slice(0, 60).trimEnd() + "…" : cd;
  return '<p class="cd-meta" title="' + esc(cd) + '"><b>Chưng theo chỉ dẫn:</b> '
    + esc(gon) + "</p>";
}

/* `chi_dan` sống trong FRONTMATTER bản nháp (`T12-25` — không thêm cột DDL cho
   một dữ liệu đã có đường đi). Đọc nó ra bằng một phép quét dòng, không parse
   YAML: ta cần đúng một trường, và kéo một trình phân tích YAML vào chunk là
   trả vài KB cho một dòng. */
function docChiDanTuBan(j) {
  const t = String(j?.ban_hien_tai || j?.ban_goc_ai || "");
  const m = /^chi_dan:\s*(.+)$/m.exec(t.split("---")[1] || "");
  if (!m) return "";
  const v = m[1].trim();
  try { return v.startsWith('"') ? JSON.parse(v) : v; } catch { return v; }
}

function veCuaSoNhap(wid, id, j) {
  const w = globalThis.__GN_MW__?.WIN?.get(wid);
  const el = w && w.el;
  if (!el) return;
  const doc = el.querySelector(".doc");
  const chan = el.querySelector("[data-bt]");
  if (doc) {
    /*
     * DÒNG META "chưng theo chỉ dẫn" (`T03-116`).
     *
     * Người duyệt phải biết bài này được chưng theo yêu cầu nào — một bản viết
     * "cho dev" đọc khác hẳn một bản viết cho người đọc rộng, và chấm cả hai
     * bằng cùng một thước là chấm sai.
     *
     * CẮT ~60 ký tự + `title=` xem đủ (chốt lúc duyệt `SCR-18`): chỉ dẫn dài
     * 500 ký tự đổ nguyên vào đây thì nó đè phần người mở cửa sổ THẬT SỰ muốn
     * đọc — bản chưng, không phải yêu cầu vừa gõ.
     */
    doc.innerHTML = veMetaChiDan(j) + '<div class="vc-md"></div>';
    const o = doc.querySelector(".vc-md");
    if (o) veThanNhap(o, String(j.ban_hien_tai || j.ban_goc_ai || ""));
  }
  if (chan) {
    /*
     * BA CỤM, cùng luật với cửa sổ bài kho (`T03-119`):
     *   CHÍNH  Duyệt vào kho — việc tiếp theo của một bản nháp, chỉ MỘT nút nổi
     *   THƯỜNG Sửa ở hàng nháp
     *   NGUY   Trả lại (bài còn) trước Bỏ nháp (bài đi) — tách phải, có gap
     *
     * Ô "Đưa lên site luôn": làm hộ CÚ BẤM THỨ HAI, không thay quyết định.
     * Mặc định TẮT — máy tự `approve` là máy chấm bài của chính nó (`M12-R2`).
     */
    const tt = String(j.trang_thai || "nhap");
    const xong = tt === "da_duyet";
    mw().txCss?.();
    chan.innerHTML =
      '<div class="bt-chinh">'
      + (xong
        ? '<em class="bt-nhan">ĐÃ VÀO KHO</em>'
        : '<button data-nhduyet="' + mw().esc(id) + '" title="ghi bài vào kho">'
          + "✓ Duyệt vào kho…</button>")
      + "</div>"
      + '<div class="bt-thuong"><a class="bt ghost sm" href="/chung-cat/nhap/">✎ Sửa ở hàng nháp…</a>'
      + (xong ? "" : '<label class="nh-len"><input type="checkbox" data-nhlen>'
        + " Duyệt xong cho hiện trên site luôn</label>")
      + "</div>"
      + '<div class="bt-nguy">'
      + '<button data-nhtra="' + mw().esc(id) + '" title="trả về người sửa, kèm lý do">'
      + "↩ Trả lại (ghi lý do)…</button>"
      + '<button data-nhbo="' + mw().esc(id) + '" title="bỏ bản nháp này">'
      + "🗑 Bỏ nháp…</button></div>"
      + '<em class="bt-nhan phu nh-tt2">' + (xong ? "KHO — chưa lên site" : "BẢN NHÁP") + "</em>";
  }
}

async function hanhDongNhap(id, hanh, than) {
  try {
    const r = await fetch("/api/nhap-chung-cat/" + encodeURIComponent(id)
      + "/" + hanh, {
      method: "POST", headers: { "content-type": "application/json" },
      // `len_site` là lựa chọn của MÀN — cửa duyệt không có trường ấy, và gửi
      // một trường lạ vào một cửa `strict` là tự chuốc 422.
      body: JSON.stringify(((({ len_site, ...con }) => con))(than || {})),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi_validate || j.loi || ("dịch vụ trả " + r.status));
    const wid = NHAP_MO.get(id);
    const el = wid && globalThis.__GN_MW__?.WIN?.get(wid)?.el;
    const ten = String(el?.querySelector(".bk-t .tt")?.textContent || "Bản nháp").trim();

    /*
     * "Đưa lên site luôn" — cú bấm THỨ HAI, không phải một quyết định của máy.
     *
     * Cửa duyệt trả sẵn `path` + `etag`, nên không cần đọc lại bài: đọc lại là
     * mở một khe cho một phiên khác chen vào giữa hai lời gọi.
     */
    let daLen = false;
    if (hanh === "duyet" && than?.len_site && j.path) {
      const duong = String(j.path).replace(/\.md$/, "");
      const r2 = await fetch("/api/articles/" + duong + "/status", {
        method: "PATCH",
        headers: { "content-type": "application/json", "if-match": String(j.etag || "") },
        body: JSON.stringify({ to: "approved" }),
      });
      daLen = r2.ok;
      if (!r2.ok) {
        const d2 = await r2.json().catch(() => ({}));
        // Nháp ĐÃ vào kho rồi — nói rõ vế nào xong, vế nào không, để người
        // không đi duyệt lại một bản đã nằm trong kho.
        mw().bao(true, `Đã duyệt "${ten}" vào kho, nhưng KHÔNG đưa lên site được: `
          + ([d2.loi, ...(d2.thieu ?? []), d2.loi_validate].filter(Boolean).join(" · ")
            || ("dịch vụ trả " + r2.status))
          + ". Mở bài trong Kho rồi bấm ✓ Đưa lên site.");
      }
    }
    if (!(hanh === "duyet" && than?.len_site && !daLen)) {
      mw().bao(false, hanh === "duyet"
        ? (daLen
          ? `Đã duyệt "${ten}" vào kho VÀ đưa lên site — hiện ra sau lần dựng trang kế tiếp.`
          : `Đã duyệt "${ten}" vào kho — bài nằm trong Kho, CHƯA lên site. Mở bài rồi bấm ✓ Đưa lên site.`)
        : `Đã cập nhật "${ten}".`);
    }
    const tt = el && el.querySelector(".nh-tt2");
    if (tt) tt.textContent = hanh === "duyet"
      ? (daLen ? "ĐANG TRÊN SITE" : "KHO — chưa lên site")
      : "BẢN NHÁP";
    return true;
  } catch (e) {
    mw().bao(true, "Không xong: " + String(e.message || e));
    return false;
  }
}

/* "Trả lại" BẮT lý do, và hỏi bằng `<dialog>` chứ không `prompt()` — `FR-022`
 * cấm hộp thoại của trình duyệt. Lý do rỗng ⇒ không gửi: một bản trả lại không
 * kèm lý do là một bản người nhận không biết phải sửa gì. */
function hoiLyDo(id) {
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
    if (t.closest("[data-gui]")) {
      e.preventDefault();
      const ly = String(d.querySelector("[data-ly]")?.value || "").trim();
      if (!ly) { mw().bao(true, "Phải ghi lý do trả lại."); return; }
      void hanhDongNhap(id, "tra-lai", { ly_do: ly }).then(() => d.close());
    }
  });
  d.showModal();
}

document.addEventListener("click", function (e) {
  const t = e.target;
  if (!(t instanceof Element)) return;
  /*
   * DAT CUA `cctab`: TRONG mot cua so doc (`.bk`).
   *
   * Bug chu du an bat 2026-09-07: *"click vao 1 the transcript o chung-cat thi
   * bi double window… chi Transcript bi, con chung cat thi khong"*.
   *
   * `[data-cctr]` co HAI bo nghe, ca hai o tang `document` — mot cua chunk nay
   * (tab trong cua so doc), mot cua `chungcat` (man `/chung-cat/`). Trang
   * `/chung-cat/` nap CA HAI chunk, nen mot cu click chay ca hai. Chung cat
   * khong bi vi act cua no chi co MOT chu.
   *
   * KHONG va bang `stopImmediatePropagation` hay mot co "da mo roi": ca hai
   * chi CHE chuyen co hai chu, va bug thu hai cua cung goc se toi ma khong ai
   * hieu. Va bang cach chia DAT — day nghe trong `.bk`, `chungcat` nghe ngoai.
   */
  const tr = t.closest("[data-cctr]");
  const bk = tr && tr.closest(".bk");
  if (tr && bk) {
    e.preventDefault();
    void moCuaSoTranscript(String(tr.dataset.cctr || ""), bk.id ?? null);
    return;
  }
  const tg = t.closest("[data-cctgcu]");
  if (tg) {
    e.preventDefault();
    CU_HIEN = !CU_HIEN;
    // Vẽ lại ĐÚNG cửa sổ đang chứa nút, không vẽ lại tất cả: mỗi cửa sổ đọc
    // một bản ghi khác nhau.
    const win = tg.closest(".bk");
    if (win) void veViecCuaBan(win);
    return;
  }
  const a = t.closest("[data-nhduyet]");
  if (a) {
    e.preventDefault();
    const oLen = a.closest("[data-bt]")?.querySelector("[data-nhlen]");
    void hanhDongNhap(a.dataset.nhduyet, "duyet", { len_site: !!oLen?.checked });
    return;
  }
  const b = t.closest("[data-nhtra]");
  if (b) { e.preventDefault(); hoiLyDo(b.dataset.nhtra); return; }
  const c = t.closest("[data-nhbo]");
  if (c) { e.preventDefault(); void hanhDongNhap(c.dataset.nhbo, "bo"); }
});

async function veViecCuaBan(win) {
  trCss();
  const { WIN, banDangDoc, esc } = mw();
  const w = WIN.get(win.id);
  const ban = banDangDoc(w);
  const doc = win.querySelector(".doc");
  if (!ban || !doc) return;
  doc.innerHTML = '<p class="ld">Đang đọc hàng việc…</p>';
  let ds = [];
  try {
    const r = await fetch("/api/job?n=50");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? ("dịch vụ trả " + r.status));
    /*
     * WO-092 · Lọc HAI tầng: đúng bản ghi, VÀ đúng lớp việc.
     *
     * Bản trước chỉ lọc `slug`, nên `sinh-thumbnail` + `tai-video` — việc MÁY
     * tự xếp (`tho-cua.mjs:203`) — lên thẳng danh sách của người. Chủ dự án
     * chụp lại đúng chỗ này.
     *
     * Phép lọc lấy QUA CẦU, không chép: `WO-088` đã sửa ở màn `/chung-cat/` và
     * quên chỗ này, tức một luật hai bản. Việc của máy HỎNG vẫn giữ — lọc trơn
     * là giấu một lỗi thật.
     */
    const _c = globalThis.__GN_MW__;
    const _nguoi = _c?.viecNguoi ?? (() => true);
    const _hong = _c?.vatHong ?? (() => false);
    ds = (j.dong ?? [])
      .filter((v) => (v.payload?.slug ?? v.slug) === ban.slug)
      .filter((v) => _nguoi(v) || _hong(v));
  } catch (e) {
    doc.innerHTML = '<p class="f-loi">' + esc(String(e.message ?? e)) + "</p>";
    dungPoll(win);
    return;
  }
  NHAP_CON = await nhapConSong();
  doc.innerHTML = ds.length
    ? '<p class="cct-h">' + nhanNhaMay(ds) + "</p>"
      + (function () {
        const cu = danhDauCu(ds);
        const hien = CU_HIEN ? ds : ds.filter((v) => !cu.has(v));
        const an = ds.length - hien.length;
        return '<ol class="cct">'
          + hien.map((v) => cctDong(v, cu.has(v), NHAP_CON)).join("")
          + "</ol>"
          + (an || CU_HIEN
            ? '<button type="button" class="cct-l cct-tg" data-cctgcu>'
              + (CU_HIEN ? "ẩn bản cũ" : an + " bản cũ đang ẩn — hiện")
              + "</button>"
            : "");
      })()
    : '<p class="empty">Chưa có việc chưng cất nào cho bản ghi này.</p>';
  // Poll CHỈ khi còn việc đang chạy. Hết việc chạy ⇒ dừng, không poll nền.
  const conChay = ds.some((v) => conChayGd(v.giai_doan));
  dungPoll(win);
  if (conChay && w) {
    w.pollCC = setInterval(() => {
      // Tab đã rời ⇒ dừng. Không có phép này thì đóng tab vẫn gọi API mãi.
      const dang = win.querySelector('[data-tab="cc"]');
      if (dang?.getAttribute("aria-current") !== "true") return dungPoll(win);
      void veViecCuaBan(win);
    }, NHIP_POLL);
  }
}


/* ══ HỘP THOẠI chưng cất — dời từ `gn.js` sang đây ═══════════════════════════
 *
 * 2986 byte cho một hộp thoại chỉ mở khi người bấm "Chưng cất". Trong bundle
 * CHUNG thì mọi người đọc báo trả trước; ở đây chỉ người bấm trả. Cùng lập
 * luận `FR-062` đã duyệt cho tab, và phép dọn này là thứ cho `T01-45` chỗ để
 * thêm năm dòng mime video (đo trước khi dọn: `gn.js` 102460/102400).
 */
/*
 * Bộ chọn model — MỘT lần fetch cho cả phiên.
 *
 * `GET /api/model` của LÕI (T08-20), KHÔNG gọi thẳng `:8790`: khoá dịch vụ ở
 * env SERVER và không bao giờ ra trình duyệt (`M12-R7` + `Z8`). Đó là lý do
 * mã dưới đây KHÔNG chứa chuỗi `x-khoa-loi` ở đâu cả — cổng đo đúng điều đó.
 */
let MODEL_DS = null;
async function dsModel() {
  if (MODEL_DS) return MODEL_DS;
  const r = await fetch("/api/model");
  const j = await r.json().catch(() => ({}));
  // Câu lỗi của SERVER đi ra, không phải một mã số FE tự nghĩ.
  if (!r.ok) throw new Error(j.loi ?? ("không đọc được danh mục model (" + r.status + ")"));
  MODEL_DS = j;
  return j;
}
function nhomTheoNha(dong) {
  const m = {};
  for (const d of dong) (m[d.nha_cung_cap] ??= []).push(d);
  return m;
}
async function moPhieuChungCat(win, id) {
  /*
   * TIEM CSS CUA CHUNK — mot dong, va thieu no thi CA PHIEU khong co style.
   *
   * Do 2026-09-07 sau khi chu du an bao *"cai UI nhu cut vay"*: moi luat CSS
   * cua phieu nam trong KHOI_CSS, va KHOI_CSS chi vao trang khi ai do goi
   * trCss(). Ham nay KHONG goi. Nen phieu chay bang style MAC DINH cua trinh
   * duyet: textarea hep + font mono, chip la nut xam tran, so dem thanh mot
   * dong rieng. Dung sau chu khong phai mot chuoi loi.
   *
   * Va no lo ra rang cong cua toi do sai thu: no kiem LUAT CSS CO TON TAI, chu
   * khong kiem STYLESHEET CO DUOC GAN VAO. Mot luat khong bao gio duoc tiem
   * thi giong het mot luat khong ton tai — tru viec cong bao xanh.
   */
  trCss();
  const ban = mw().banDangDoc(mw().WIN.get(id));
  if (!ban) return;
  const d = document.createElement("dialog");
  d.className = "dlg";
  d.id = "dlg-cc";
  /*
   * SCR-23 · PHIẾU LÀ MỘT BẢN KHAI EGRESS, không phải một hộp thoại cài đặt.
   *
   * Đây là chỗ duy nhất trong hệ mà dữ liệu RỜI KHỎI MÁY, nên người phải đọc
   * theo đúng thứ tự *gửi cái gì · tới đâu · rồi mới bấm*. Ba khối có ĐÁNH SỐ
   * chứ không chỉ tách khoảng trắng: khoảng trắng nói "đây là ba nhóm", con số
   * nói "đọc theo thứ tự này" — và với một phiếu mà bấm sai là tiêu token
   * thật, thứ tự đọc là thứ đáng cưỡng chế.
   *
   * Chẩn đoán của `SCR-23 §0`: phiếu cũ KHÔNG thiếu hiệu ứng, nó thiếu THỨ
   * BẬC — mọi phần tử cùng một trọng lượng nên mắt không biết đọc gì trước.
   * Thêm animation vào một bố cục phẳng chỉ làm nó nhoè hơn.
   */
  d.innerHTML = '<form method="dialog">'
    + '<div class="dlg-h pc-h"><span class="pc-ico" aria-hidden="true">\u2697</span>'
    + "<h3>Chưng cất</h3></div>"
    + '<p class="dlg-id">' + mw().esc(ban.slug) + "</p>"
    + '<div id="cc-than"><p class="ld">Đang đọc danh mục model…</p></div>'
    + '<span class="f-act"><button class="bt" data-act="phieu-huy">Đóng</button>'
    + '<button class="bt pri pc-gui" data-act="cc-gui">'
    + '<span aria-hidden="true">\u2697</span> Gửi đi chưng cất</button></span></form>';
  document.body.append(d);
  d.__win = win;          // cửa sổ đã mở hộp thoại — `guiChungCat` mở tab của nó
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "phieu-huy") return d.close();
    if (act === "cc-gui") {
      e.preventDefault();
      return void guiChungCat(d, ban);
    }
  });
  d.showModal();
  const than = d.querySelector("#cc-than");
  try {
    const j = await dsModel();
    const dong = j.dong ?? [];
    if (!dong.length) throw new Error("danh mục model rỗng");
    const nhom = nhomTheoNha(dong);
    /*
     * MODEL + PROMPT. Het.
     *
     * Chu du an 2026-09-07: *"xoa het text comment, mo ta thua thai di. Toi chi
     * can chon model, viet prompt la duoc, ma o viet prompt lam cho to ti."*
     *
     * Dao lai `SCR-23`: khoi (1) GUI GI (thanh + phan tram) va ba nhan danh so
     * BO HET. Chung la thu toi them vao, khong phai thu nguoi dung xin — va mot
     * phieu ba khoi cho hai truong la chinh cai *"mo ta thua thai"* bi bao.
     *
     * GIU dung MOT dong cong bo egress. `spec §4.0c` (frozen) doi *"chon model
     * la chon KHU VUC PHAP LY — phai hien, khong duoc im"*, va `FR-053 §1.4`
     * doi hien NGUYEN VAN slug. Mot dong ngan VAN LA hien; xoa han moi la im.
     * Do la cho khong duoc gon hoa, va no dai dung mot dong.
     */
    than.innerHTML =
      '<div class="cc-o"><label for="cc-nha">Nhà cung cấp</label>'
      + '<select id="cc-nha" data-f="nha">'
      + Object.keys(nhom).sort().map((n) => "<option>" + mw().esc(n) + "</option>").join("")
      + '</select><label for="cc-model">Model</label>'
      + '<select id="cc-model" data-f="model"></select>'
      + '<b class="pc-mp" data-f="mp" hidden></b></div>'
      + '<p class="pc-kv"><span data-f="kvo"><i aria-hidden="true">\u26A0</i> '
      + 'rời khỏi máy · khu vực <b class="cc-kv" data-f="kv"></b></span></p>'
      + veOChiDan(j);
    const md = dong.find((x) => x.la_mac_dinh) ?? dong[0];
    const sel = than.querySelector("[data-f=nha]");
    sel.value = md.nha_cung_cap;
    veModelTheoNha(than, nhom, md.nha_cung_cap, dong, md.model);
    sel.onchange = (e) => veModelTheoNha(than, nhom, e.target.value, dong);
    than.querySelector("[data-f=model]").onchange = () => veKhuVuc(than, dong);
    ganOChiDan(than, j);
  } catch (e) {
    than.innerHTML = '<p class="f-loi">' + mw().esc(String(e.message ?? e)) + "</p>";
    d.querySelector('[data-act="cc-gui"]').disabled = true;
  }
}
function veModelTheoNha(o, nhom, nha, dong, chon) {
  const sel = o.querySelector("[data-f=model]");
  /*
   * `value` KHAI RIENG, va no chi mang TEN MODEL.
   *
   * Bug chu du an bat 2026-09-07, payload thuc te:
   *   model: "gemini-2.5-flash-lite \u00b7 free"
   *   → {loi: "khong co trong bang khai — khong tao job"}
   *
   * Mot <option> khong khai `value` thi trinh duyet lay TEXT lam value. Nhan
   * cu mang hau to " \u00b7 free", nen ten model gui di co dan mot chuoi hien
   * thi vao — va cua tu choi, DUNG.
   *
   * No chi no voi model MIEN PHI: model thuong khong co hau to nen di qua
   * duoc. Vi the no song lau — duong thu cua toi dung `deepseek-v4-flash`.
   *
   * Chi dao: *"model `gemini-2.5-flash-lite`, con free la dang danh dau thoi,
   * dung chen text `free` vao"*. Mot <option> chi chua duoc text, nen MOI cach
   * nhet dau vao no deu la nhet CHU. Dau song NGOAI <select>: xem `data-f=mp`.
   */
  sel.innerHTML = (nhom[nha] ?? [])
    .map((m) => '<option value="' + mw().esc(m.model) + '">'
      + mw().esc(m.model) + "</option>").join("");
  if (chon) sel.value = chon;
  veKhuVuc(o, dong);
}
// `khu_vuc` hiện NGUYÊN VĂN, kể cả `khong-xac-dinh` (FR-053 §1.4).
function veKhuVuc(o, dong) {
  const m = o.querySelector("[data-f=model]")?.value;
  const d = dong.find((x) => x.model === m);
  const oo = o.querySelector("[data-f=kv]");
  if (oo) oo.textContent = d ? d.khu_vuc : "—";
  // DAU mien phi — mot o rieng, khong phai chu trong ten model. Cai gia phai
  // hien truoc cu bam: vi con it, nen mot model khong-free la mot job chet vi
  // het tien. Cap nhat cung nhip voi khu vuc: ca hai deu la HE QUA cua model
  // dang chon, nen mot lan doc bang khai tra loi ca hai.
  const mp = o.querySelector("[data-f=mp]");
  if (mp) {
    mp.textContent = d && d.mien_phi ? "free" : "";
    mp.hidden = !(d && d.mien_phi);
  }

  /*
   * NHÁY khung một nhịp khi khu vực đổi.
   *
   * Đổi model xong mà khu vực đổi IM LẶNG là thứ tệ nhất có thể ở đúng ô này:
   * người vừa đổi nơi dữ liệu tới mà không thấy gì. Nháy là một PHÉP ĐO —
   * *"con số vừa đổi vì bạn vừa chọn khác"*.
   *
   * Gỡ class rồi ép reflow trước khi gắn lại: không làm vậy thì lần đổi thứ
   * hai sang cùng một giá trị không chạy lại animation.
   */
  const kh = o.querySelector("[data-f=kvo]");
  if (kh) {
    kh.classList.remove("pc-nhay");
    void kh.offsetWidth;
    kh.classList.add("pc-nhay");
  }
}

/*
 * CÂU BÁO cho NGƯỜI, không phải cho log.
 *
 * Bản cũ đọc: *"Đã nhận việc e0431f6f6ba24d249534892cdd18887d · model
 * google/gemini-2.5-flash-lite · khu vực khong-xac-dinh — mở
 * /chung-cat/?job=e0431f6f…"*. Chủ dự án đã yêu cầu bỏ hai lần.
 *
 * Ba thứ sai trong một câu: một ULID 32 ký tự không ai đọc được và không ai
 * copy nổi từ một toast tự tắt; `khong-xac-dinh` là từ vựng NỘI BỘ của
 * `FR-053 §1.4`; và một ĐƯỜNG DẪN dán vào câu chữ bắt người tự ghép URL.
 *
 * Cả ba dữ kiện đó vẫn còn — ở panel chi tiết và nhật ký, nơi chúng dùng được.
 * Toast chỉ trả lời đúng một câu: *việc đã nhận chưa, và tôi xem ở đâu*.
 */
/*
 * Ô CHỈ DẪN THÊM — `T03-116` bước 2, theo wireframe `SCR-18` chủ dự án đã
 * duyệt 2026-09-06.
 *
 * GẤP mặc định (`<details>`, không `open`). Ô mở sẵn biến một hộp thoại XÁC
 * NHẬN thành một cái FORM: người bấm "Chưng cất" đã quyết rồi, và bắt 100%
 * người đi qua một ô trống nữa để phục vụ số ít có yêu cầu riêng là đổi sai
 * chiều. `<details>` của trình duyệt lo phần gấp/mở — 0 dòng JS, 0 byte CSS
 * cho hành vi ấy.
 *
 * Chips và trần đều DẪN XUẤT từ `GET /model` (`T12-25`): thêm một dòng
 * `chi-dan-mau.json` là chip mới mọc, 0 dòng mã. Gõ cứng ở đây là phá đúng
 * tính chất `AC4` của T12-25 khoá.
 */
function veOChiDan(j) {
  const mau = Array.isArray(j?.chi_dan_mau) ? j.chi_dan_mau : [];
  const tran = Number(j?.tran_chi_dan_ky_tu) || 0;
  if (!tran) return "";            // cửa cũ chưa trả trần ⇒ KHÔNG dựng ô nửa vời
  const esc = mw().esc;
  /*
   * KHỐI ③ · bốn chỗ xấu của `SCR-23 §0` vá ở đây:
   *
   *  (4) SỐ ĐẾM lên cùng hàng với nhãn, bên phải — trước đó nó là một dòng văn
   *      xuôi rời (`còn 500 ký tự`) nằm giữa ô nhập và câu chú thích, đẩy nút
   *      chính xuống dưới màn.
   *  (1) `textarea` FULL-WIDTH, 4 dòng. Trước đó ô nhập nhỏ hơn placeholder
   *      của chính nó, nên chữ mẫu bị cắt giữa câu và người đọc thấy một ô
   *      HỎNG chứ không thấy một lời mời.
   *  (3) CHIP lên TRƯỚC ô nhập: chúng là gợi ý *viết gì vào đây*, nên đọc
   *      chúng trước rồi mới gõ. Và chúng là NÚT, nên CSS cho chúng trông như
   *      nút (`.pc-chip`), không như tab đang tắt.
   *  (2) placeholder ngắn lại và dùng font UI của phiếu — xem `KHOI_CSS`.
   *
   * `<details>` giữ nguyên: chỉ dẫn là TUỲ CHỌN, mở sẵn nó là bắt mọi người
   * đọc một thứ phần lớn sẽ bỏ qua.
   */
  /*
   * O PROMPT: MO SAN va TO.
   *
   * `T03-116` chon `<details>` gap san, ly le: *"o mo san bien mot hop thoai
   * XAC NHAN thanh mot FORM"*. Ly le do dung khi chi dan la mot thu it nguoi
   * dung. Nay chu du an khai nguoc lai — *"toi chi can chon model, viet prompt
   * la duoc"* — tuc prompt la MOT TRONG HAI thu chinh cua phieu. Mot thu chinh
   * ma phai bam de mo la mot thu bi giau.
   *
   * Chu so hUu quyet lai thi lam theo, va ghi ra day de nguoi sau khong tuong
   * `T03-116` bi bo quen.
   */
  return '<div class="cd-o pc-cd">'
    + '<span class="pc-lb">Prompt <em class="pc-dem" data-f="cddem" data-tran="'
    + tran + '"></em></span>'
    + (mau.length
      ? '<div class="cd-chips">' + mau.map((m) =>
        '<button type="button" class="cd-chip pc-chip" data-cd="'
        + esc(m.chi_dan) + '">' + esc(m.ten) + "</button>").join("") + "</div>"
      : "")
    + '<textarea class="cd-ta pc-ta" data-f="chidan" rows="8" maxlength="'
    + (tran * 2) + '" placeholder="Muốn bài viết theo góc nào?"></textarea>'
    + "</div>";
}

/*
 * `maxlength` đặt GẤP ĐÔI trần, không bằng trần.
 *
 * Bằng trần thì trình duyệt CẮT ÂM THẦM đúng thứ server từ chối bằng 422 kèm
 * lời giải thích — người gõ quá tay không bao giờ biết câu mình viết đã cụt.
 * Gấp đôi cho người gõ xong, THẤY "vượt N ký tự", rồi tự rút. Vẫn có trần vì
 * một ô không giới hạn là một ô dán được cả quyển sách vào.
 */
function ganOChiDan(than, j) {
  const ta = than.querySelector("[data-f=chidan]");
  const dem = than.querySelector("[data-f=cddem]");
  if (!ta || !dem) return;
  const tran = Number(dem.dataset.tran) || 0;
  const soat = () => {
    const n = ta.value.length;
    // ĐẾM NGƯỢC: câu hỏi của người đang gõ là *"tôi còn bao nhiêu chỗ"*, không
    // phải *"tôi đã gõ bao nhiêu"*.
    // SCR-23: dang `488/500` — no ngoi CUNG HANG voi nhan, nen phai NGAN.
    // Mot cau van xuoi ("con 500 ky tu") o vi tri ay se day nhan xuong dong.
    // Vuot tran thi noi ro bang dau `+`, khong doi cach doc.
    dem.textContent = n > tran
      ? "+" + (n - tran) + " quá trần " + tran
      : n + "/" + tran;
    dem.classList.toggle("qua", n > tran);
    ta.classList.toggle("qua", n > tran);
  };
  ta.addEventListener("input", soat);
  than.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cd]");
    if (!c) return;
    e.preventDefault();
    // Chip ĐIỀN, không GỬI. Một nút làm hai việc thì người bấm nhầm không có
    // đường lùi. Con trỏ về cuối để gõ tiếp được ngay.
    ta.value = c.dataset.cd;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    soat();
  });
  soat();
}

async function guiChungCat(d, ban) {
  const model = d.querySelector("[data-f=model]")?.value;
  const nut = d.querySelector('[data-act="cc-gui"]');
  const cd = (d.querySelector("[data-f=chidan]")?.value ?? "").trim();
  if (!ban || !model) return;
  if (nut) nut.disabled = true;
  try {
    // Thân KHÔNG mang `nguoi_dung_id` — LÕI gán từ phiên (AC-1.5).
    const r = await fetch("/api/job", {
      method: "POST", headers: { "content-type": "application/json" },
      // `chi_dan` chỉ vào body KHI CÓ. Gửi chuỗi rỗng thì MỌI job mang thêm
      // một trường — nó vào `sha256`, vào `egress`, và làm `T12-25 AC2`
      // (*job không chi_dan chạy y như cũ*) thành lời nói suông.
      body: JSON.stringify({
        loai: "chung-cat-mot-nguon", slug: ban.slug, model,
        ...(cd ? { chi_dan: cd } : {}),
      })
    });
    const j = await r.json().catch(() => ({}));
    // Xử theo LỚP 2xx, không rẽ theo `201` cứng — mã cho ca nạp lại chưa chốt.
    if (!r.ok) throw new Error(j.loi ?? ("dịch vụ trả " + r.status));
    d.close();
    /*
     * T03-110 · đổi hành vi của `T03-92 AC3`: từ *ở-lại-màn + toast* thành
     * *ở-lại-CỬA-SỔ + đổi tab*. Người vẫn không rời trang, nhưng thấy NGAY
     * việc vừa xếp hàng thay vì phải tự đi tìm. Toast giữ — nó mang `viec_id`.
     *
     * Nằm SAU `if (!r.ok) throw`: đổi tab trước khi biết kết quả là báo thành
     * công cho một việc chưa ai nhận.
     */
    /*
     * T03-112 · MỞ CỬA SỔ SONG SONG, không đổi tab của cửa sổ đang đọc.
     *
     * Cửa sổ nguồn giữ NGUYÊN bài đang đọc — đó là cả điểm của flow: *"vừa xem
     * bản tài liệu vừa xem bản chưng cất bên cạnh"*. Tab `T03-110` vẫn còn và
     * vẫn cập nhật, nhưng nó là mặt TRA CỨU; không tự nhảy sang nó nữa.
     */
    if (j.viec_id) moCuaSoViec(j.viec_id, ban, d.__win, "chung-cat-mot-nguon");
    mw().bao(false, "Đã xếp hàng — nhà máy đang chưng cất. Theo dõi ở tab "
      + "“Chưng cất” của cửa sổ này.");
  } catch (e) {
    if (nut) nut.disabled = false;
    mw().bao(true, "Không gửi được: " + String(e.message ?? e));
  }
}


/* ══ T03-108 · SINH TRANSCRIPT + XEM TRANSCRIPT ══════════════════════════════
 *
 * `T03-92` dựng nút ở trạng thái disabled kèm lý do *"đường đó chưa mở"*. C4b
 * mở: worker chạy `sinh-transcript` (`T12-16`), `.vtt` có mime + magic `WEBVTT`
 * (`T01-45`). Đơn vị này bật nút và cho người XEM kết quả.
 */

const CANH_BAO_TR = "AUDIO của video này RỜI KHỎI MÁY nếu chọn lối qua cửa,"
  + " và lần gửi đó CÓ VẾT. Lối local (faster-whisper) không gửi gì ra ngoài.";

/* `giây → mm:ss`. Vì sao không in số giây trần: `[t=754]` không phải một địa
 * chỉ người đọc được, và `validate.py` đối chiếu `[t=..]` với thời lượng `.vtt`
 * theo DẠNG MỐC — một con số giây ở đó là một địa chỉ nó không phân giải nổi. */
function mmss(giay) {
  const g = Math.max(0, Math.floor(Number(giay) || 0));
  return String(Math.floor(g / 60)).padStart(2, "0") + ":"
    + String(g % 60).padStart(2, "0");
}

/** Hiện vật TRANSCRIPT của một bản ghi — lọc theo `.vtt`, không lấy cái đầu. */
function hienVatVtt(ban) {
  /* Lấy hiện vật ĐẦU TIÊN thì một bản ghi có cả mp4 và vtt sẽ hiện mp4 làm
     transcript — và `<pre>` của một file mp4 là vài trăm KB byte nhị phân. */
  /* Và lấy bản CUỐI trong các vtt — bản ghi sinh-lại đang mang nhiều entry
     (worker THÊM thay vì THAY, ô backlog M12 2026-09-08); find() đầu = bản CŨ. */
  return (ban?.media ?? []).filter((m) =>
    String(m.mime ?? "") === "text/vtt"
    || String(m.ten_goc ?? "").toLowerCase().endsWith(".vtt")).at(-1) ?? null;
}

async function moPhieuTranscript(win, id) {
  const { WIN, banDangDoc, esc } = mw();
  const ban = banDangDoc(WIN.get(id));
  if (!ban) return;
  const d = document.createElement("dialog");
  d.className = "dlg";
  d.id = "dlg-tr";
  d.innerHTML = '<form method="dialog">'
    + '<div class="dlg-h pc-h"><span class="pc-ico" aria-hidden="true">\u266B</span>'
    + "<h3>Sinh transcript</h3></div>"
    + '<p class="dlg-id">' + esc(ban.slug) + "</p>"
    + '<div id="tr-than"><p class="ld">Đang đọc danh mục model…</p></div>'
    + '<span class="f-act"><button class="bt" data-act="phieu-huy">Đóng</button>'
    + '<button class="bt pri pc-gui" data-act="tr-gui">'
    + '<span aria-hidden="true">\u266B</span> Sinh transcript</button></span></form>';
  document.body.append(d);
  d.__win = win;
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "phieu-huy") return d.close();
    if (act === "tr-gui") {
      e.preventDefault();
      return void guiTranscript(d, ban);
    }
  });
  d.showModal();

  /*
   * BO CHON MODEL — cùng hình dạng phiếu chưng cất (`SCR-23`), nhưng LỌC.
   *
   * Chủ dự án 2026-09-08: *"tab sinh transcript… không có input chọn model?"*.
   *
   * LỌC `ho_tro_audio` là vế nặng nhất, không phải một phép lọc cho gọn: đo
   * 2026-09-08, **22/100** dòng nhận audio, và cái bẫy nằm ngay ở tên mặc
   * định — `gemini-2.5-flash-lite` KHÔNG nhận, `google/gemini-2.5-flash-lite`
   * CÓ. Bày cả 100 dòng là mời người bấm vào 78 dòng sẽ chết, và chết ÂM THẦM:
   * cửa BỎ QUA phần media rồi vẫn trả về một thứ trông như bản phiên âm, bịa
   * từ prompt (`beeknoee-api-guide §2.5`).
   */
  const than = d.querySelector("#tr-than");
  try {
    const j = await dsModel();
    const dong = (j.dong ?? []).filter((x) => x.ho_tro_audio);
    if (!dong.length) {
      throw new Error("danh mục không có model nào nhận audio — cửa chưa khai "
        + "`ho_tro_audio` cho dòng nào, hoặc bảng khai chưa đồng bộ");
    }
    const nhom = nhomTheoNha(dong);
    than.innerHTML = '<div class="cc-o"><label for="tr-nha">Nhà cung cấp</label>'
      + '<select id="tr-nha" data-f="nha">'
      + Object.keys(nhom).sort().map((n) => "<option>" + esc(n) + "</option>").join("")
      + '</select><label for="tr-model">Model</label>'
      + '<select id="tr-model" data-f="model"></select>'
      + '<b class="pc-mp" data-f="mp" hidden></b></div>'
      + '<p class="pc-kv" data-f="kvo"><span><i aria-hidden="true">\u26A0</i> '
      + 'audio rời khỏi máy · khu vực <b class="cc-kv" data-f="kv"></b></span></p>';
    const md = dong.find((x) => x.la_mac_dinh) ?? dong[0];
    const sel = than.querySelector("[data-f=nha]");
    sel.value = md.nha_cung_cap;
    veModelTheoNha(than, nhom, md.nha_cung_cap, dong, md.model);
    sel.onchange = (e) => veModelTheoNha(than, nhom, e.target.value, dong);
    than.querySelector("[data-f=model]").onchange = () => veKhuVuc(than, dong);
  } catch (e) {
    than.innerHTML = '<p class="f-loi">' + esc(String(e.message ?? e)) + "</p>";
    d.querySelector('[data-act="tr-gui"]').disabled = true;
  }
}

async function guiTranscript(d, ban) {
  const nut = d.querySelector('[data-act="tr-gui"]');
  if (!ban) return;
  if (nut) nut.disabled = true;
  try {
    const r = await fetch("/api/job", {
      method: "POST", headers: { "content-type": "application/json" },
      // GỬI ĐI ĐÚNG model người chọn. Có ô chọn mà không gửi là một ô trang
      // trí — và tệ hơn: người tưởng mình đã chọn, còn thợ vẫn chạy mặc định.
      //
      // Chỉ thêm khoá `model` KHI CÓ, cùng khuôn `chi_dan` của `guiChungCat`:
      // gửi `null` thì mọi job mang thêm một trường, và nó vào `sha256`, vào
      // `egress` — làm hỏng phép so của những job không chọn model.
      body: JSON.stringify({
        loai: "sinh-transcript", slug: ban.slug,
        ...(d.querySelector("[data-f=model]")?.value
          ? { model: d.querySelector("[data-f=model]").value } : {}),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.loi ?? ("dịch vụ trả " + r.status));
    d.close();
    /*
     * T03-112 · MỞ CỬA SỔ SONG SONG, không đổi tab của cửa sổ đang đọc.
     *
     * Cửa sổ nguồn giữ NGUYÊN bài đang đọc — đó là cả điểm của flow: *"vừa xem
     * bản tài liệu vừa xem bản chưng cất bên cạnh"*. Tab `T03-110` vẫn còn và
     * vẫn cập nhật, nhưng nó là mặt TRA CỨU; không tự nhảy sang nó nữa.
     */
    if (j.viec_id) moCuaSoViec(j.viec_id, ban, d.__win, "sinh-transcript");
    mw().bao(false, "Đã xếp hàng sinh transcript — theo dõi ở tab "
      + "“Chưng cất” của cửa sổ này.");
  } catch (e) {
    if (nut) nut.disabled = false;
    mw().bao(true, "Không gửi được: " + String(e.message ?? e));
  }
}

/*
 * TAB transcript của cửa sổ đọc video.
 *
 * Cue bấm được thì chèn `[t=mm:ss]` vào ô đang gõ. Mốc thời gian là ĐỊA CHỈ
 * của một câu trong video — không chèn được thì người phải gõ tay, và gõ tay là
 * đúng chỗ mốc lệch khỏi transcript.
 */
/*
 * CỬA SỔ TRANSCRIPT RIÊNG (`T03-122`).
 *
 * Chủ dự án 2026-09-07: *"sau khi xong thì cửa sổ multi window hiển thị bản
 * sinh transcript luôn — đó là cửa sổ riêng của transcript"*.
 *
 * VÌ SAO CẦN dù đã có tab: tab nằm TRONG cửa sổ bản ghi, nên xem transcript
 * là MẤT CHỖ ĐANG ĐỌC. Cả điểm của flow là *vừa xem video, vừa đọc
 * transcript, vừa duyệt bản chưng cất* — ba thứ CẠNH nhau.
 *
 * `kieu: "transcript"` ⇒ `mo()` KHÔNG chạy `tai()`. Transcript không phải một
 * bản ghi trong kho; gọi `/api/articles/<slug>` cho nó là 404 và bốn nút
 * chết — đúng bug `T03-113` đã trúng một lần với bản nháp.
 */
/*
 * CỬA SỔ CHƯNG CẤT RIÊNG (`T03-123`).
 *
 * Chủ dự án 2026-09-07: *"nó sẽ ra 1 cửa sổ multi window khác… và cửa sổ
 * chưng cất này mới hiển thị tiến trình và kết quả chưng cất"*.
 *
 * Ba cửa sổ CẠNH nhau — `Xem` · `Transcript` · `Chưng cất`. Bắt người mở một
 * tab khác để xem việc mình vừa bấm là bắt họ đi tìm, mà cả điểm của flow là
 * ba thứ cùng trong tầm mắt.
 *
 * `win` · `id` là chữ ký `goiChunk` truyền vào — giữ đúng khuôn ấy, không đẻ
 * một chữ ký thứ hai cho cùng một cơ chế.
 */
/*
 * Vá nút Chưng cất cho ca ĐANG SINH transcript.
 *
 * Ba trạng thái cần ba câu, mà trạng thái thứ ba (`đang sinh`) chỉ biết được
 * từ HÀNG ĐỢI VIỆC — một lời gọi mạng. Nên nút dựng bằng hai trạng thái tra
 * được ngay, rồi vá sau; không chặn thanh tiêu đề chờ mạng.
 *
 * Không hỏi được hàng đợi ⇒ GIỮ NGUYÊN nút. Đoán `đang sinh` khi không biết
 * là nói một điều mình không đo được.
 */
async function veNutChungCatRieng(win, id) {
  const ban = mw().banDangDoc(mw().WIN.get(id));
  if (!ban) return;
  const nut = win.querySelector('[data-act="cc-rieng"]');
  if (!nut) return;

  // CA MỘT: việc đã xong và `.vtt` đã gắn — chỉ là vật trong bộ nhớ chưa biết.
  // Bản trước bỏ trọn ca này (`if (!chay) return`), nên nút không bao giờ tự
  // sáng: nó có ca *đang sinh*, không có ca *đã xong*. Một nút disabled vĩnh
  // viễn cho một việc LÀM ĐƯỢC là nút nói dối, và người tin nó sẽ không bấm.
  await lamMoiHienVat(ban);
  if (hienVatVtt(ban)) {
    nut.disabled = false;
    nut.classList.remove("tx-mo");
    nut.textContent = "⚗ Chưng cất…";
    nut.title = "chưng cất TỪ TRANSCRIPT — mở một cửa sổ riêng";
    return;
  }

  // CA HAI: chưa có vtt — hỏi hàng đợi xem có đang sinh không, để nhãn nói
  // *đợi* thay vì *thiếu*.
  try {
    const r = await fetch("/api/job?n=50");
    if (!r.ok) return;
    const j = await r.json();
    const ds = Array.isArray(j) ? j : (j.dong ?? []);
    const chay = ds.some((v) => {
      const pl = v?.payload ?? {};
      return pl.loai === "sinh-transcript"
        && String(pl.slug ?? "") === String(ban.slug)
        && v.giai_doan !== "xong" && v.giai_doan !== "dung" && v.giai_doan !== "hong";
    });
    if (!chay) return;
    nut.textContent = "⚗ đang sinh transcript…";
    nut.title = "transcript đang chạy — xong thì nút này sáng";
  } catch { /* mạng hỏng ⇒ giữ nguyên nút */ }
}


/*
 * ĐƯỜNG VIDEO → CHÍNH phiếu của đường tài liệu (chủ dự án 2026-09-07:
 * *"sao nút chưng cất tài liệu và video khác nhau vậy"*).
 *
 * Bản trước hàm này tự dựng một hộp thoại riêng bằng `hoi()`: một ô text
 * trần, KHÔNG chọn nhà, KHÔNG chọn model, KHÔNG hiện khu vực, KHÔNG cảnh báo
 * egress. Vế cuối là vế nặng — `spec §4.0c` khai *"chọn model là chọn KHU VỰC
 * PHÁP LÝ, phải hiện, không được im"* (NĐ 356/2025 Điều 14). Đường video gửi
 * transcript đi bằng model MẶC ĐỊNH mà người bấm không được nói cho biết dữ
 * liệu đi đâu.
 *
 * Không có lý do kỹ thuật nào cho hai phiếu: `guiChungCat` post
 * `{loai:"chung-cat-mot-nguon", slug, model, chi_dan}` — Y HỆT cho video, vì
 * `FR-070` để THỢ chọn nguyên liệu theo LOẠI bản ghi. Hai phiếu chỉ là hai
 * lần tôi viết cùng một thứ, và bản thứ hai nghèo hơn.
 *
 * Giữ tên hàm: `multiwindow` gọi qua `goiChunk("moCuaSoChungCat", …)` và act
 * `cc-rieng` là đường đã chốt của `T03-123`.
 */
/*
 * Bấm "Chưng cất từ transcript" ở cửa sổ việc transcript vừa xong.
 *
 * Mở CỬA SỔ BẢN GHI trước, rồi mở phiếu trên nó — không mở phiếu "trần". Phiếu
 * cần một `ban` để biết slug, loại (⇒ câu cảnh báo đúng) và để `guiChungCat`
 * mở cửa sổ việc cạnh đúng cửa sổ nguồn. Đi qua `moTheoSlug` nghĩa là dữ liệu
 * đọc từ CỬA, không phải từ một vật dựng tay — bài học `T03-118`.
 */
async function chungCatTuTranscript(slug) {
  const w = globalThis.__GN_MW__;
  if (!w?.moTheoSlug) return;
  const wid = await w.moTheoSlug(slug, null);
  if (!wid) return;
  const win = w.WIN?.get(wid)?.el;
  if (win) void moPhieuChungCat(win, wid);
}

async function moCuaSoChungCat(win, id) {
  return moPhieuChungCat(win, id);
}

/*
 * Theo dõi tiến trình NGAY TRONG cửa sổ chưng cất.
 *
 * Cùng nhịp 1.2s và cùng cách chịu mạng-chớp với `theoDoiBac` của `T03-121`:
 * 60 nhịp im lặng (~90 giây) mới bỏ cuộc. Một lần mạng chớp không được phép
 * xoá một tiến trình đang đúng.
 */
function theoDoiChungCat(wid, viecId) {
  const w = globalThis.__GN_MW__;
  const el = w?.WIN?.get(wid)?.el;
  const doc = el && el.querySelector(".doc");
  if (!doc) return;
  const { esc } = mw();
  let treo = 0;
  const nhip = setInterval(async () => {
    let v = null;
    try {
      const r = await fetch("/api/viec/" + encodeURIComponent(viecId));
      if (r.ok) v = await r.json();
    } catch { /* mạng chớp */ }
    if (!v) {
      if (++treo > 60) {
        clearInterval(nhip);
        doc.innerHTML = '<p class="f-loi">Mất liên lạc với dịch vụ chưng cất.</p>';
      }
      return;
    }
    treo = 0;
    const gd = String(v.giai_doan ?? "?");
    if (gd === "xong") {
      clearInterval(nhip);
      const nid = String(v.ket_qua?.nhap_id ?? "");
      if (nid) return void veCuaSoNhapVaoDay(wid, nid);
      doc.innerHTML = '<p class="empty">Xong, nhưng việc không trả `nhap_id`.</p>';
      return;
    }
    if (gd === "dung" || v.loi) {
      clearInterval(nhip);
      doc.innerHTML = '<p class="f-loi">' + esc(String(v.loi || "việc đã dừng")) + "</p>";
      return;
    }
    doc.innerHTML = veVongNghi() + veDayChuyen(gd, "đang chưng cất", v)
      + veTienDo(v);
  }, 1200);
}

/** Việc xong ⇒ đổ CHÍNH bản nháp vào cửa sổ này, kèm bộ nút duyệt. */
async function veCuaSoNhapVaoDay(wid, nhapId) {
  try {
    const r = await fetch("/api/nhap-chung-cat/" + encodeURIComponent(nhapId));
    if (!r.ok) throw new Error("dịch vụ trả " + r.status);
    const j = await r.json();
    NHAP_MO.set(nhapId, wid);
    veCuaSoNhap(wid, nhapId, j);
  } catch (e) {
    const el = globalThis.__GN_MW__?.WIN?.get(wid)?.el;
    const doc = el && el.querySelector(".doc");
    if (doc) doc.innerHTML = '<p class="f-loi">' + mw().esc(String(e.message ?? e)) + "</p>";
  }
}

async function moCuaSoTranscript(slug, canh) {
  const w = globalThis.__GN_MW__;
  if (!w || !w.mo) return null;
  trCss();
  const { esc } = mw();

  // Tra hiện vật `text/vtt` qua cửa bản ghi — một lời gọi, không đoán sha.
  let hv = null;
  let tieuDe = String(slug).split("/").pop();
  try {
    const r = await fetch("/api/articles/" + slug);
    if (r.ok) {
      const j = await r.json();
      const fm = j.frontmatter ?? {};
      tieuDe = String(fm.title || tieuDe);
      const ds = Array.isArray(fm.media) ? fm.media : (fm.media ? [fm.media] : []);
      // HOTFIX 2026-09-08 (chủ dự án dính): bản ghi sinh-lại transcript đang
      // mang NHIỀU entry vtt (worker THÊM thay vì THAY — ô backlog M12).
      // Lấy bản CUỐI = mới nhất; find() lấy bản đầu là hiện đúng bản CŨ.
      hv = ds.filter((m) => String(m?.mime) === "text/vtt").at(-1) ?? null;
    }
  } catch { /* mạng hỏng — xử như chưa có */ }

  if (!hv?.sha256) {
    // KHÔNG mở một cửa sổ trống: nó bắt người tự đoán vì sao nó trống.
    mw().bao(true, `Bản ghi "${tieuDe}" chưa có transcript — bấm `
      + "«Sinh transcript» ở cửa sổ đọc để xếp một việc.");
    return null;
  }

  const wid = w.mo({
    bans: [{
      slug: "transcript/" + String(slug).split("/").pop(),
      title: "Transcript · " + tieuDe,
      source_type: "transcript", credibility_max: "—",
      review_status: "", origin: "pipeline", priority: 0,
      concepts: [], concepts_proposed: [], category: [],
      analyzed_at: "", one_liner: "", media: [hv], than: "",
    }],
  }, { canh, kieu: "transcript" });

  void veThanTranscript(wid, hv.sha256);
  return wid;
}

/** Đổ cue vào thân cửa sổ transcript. */
async function veThanTranscript(wid, sha) {
  trCss();                 // ve markup cua chunk ⇒ phai tiem CSS cua chunk
  const w = globalThis.__GN_MW__;
  const el = w?.WIN?.get(wid)?.el;
  const doc = el && el.querySelector(".doc");
  if (!doc) return;
  const { esc } = mw();
  doc.innerHTML = '<p class="ld">Đang đọc transcript…</p>';
  let cue = [];
  try {
    const r = await fetch("/api/articles/media/" + sha);
    if (!r.ok) throw new Error("máy trả " + r.status);
    cue = docVtt(await r.text());
  } catch (e) {
    doc.innerHTML = '<p class="f-loi">' + esc(String(e.message ?? e)) + "</p>";
    return;
  }
  doc.innerHTML = cue.length
    ? '<ol class="tr">' + cue.map((c) =>
      '<li class="tr-i"><span class="tr-t">' + mmss(c.tu) + "</span>"
      + "<span>" + esc(c.text) + "</span></li>").join("") + "</ol>"
    : '<p class="empty">Transcript rỗng.</p>';
}

/*
 * BẢN GHI TRONG BỘ NHỚ CÓ THỂ LẠC HẬU — hỏi lại kho trước khi nói "chưa có".
 *
 * Chủ dự án báo 2026-09-07: transcript sinh xong rồi mà nút Chưng cất vẫn là
 * *"cần transcript trước"* và tab Transcript vẫn trống, *"F5 (Ctrl+Shift+R)
 * mới có"*. Câu cuối chính là phép đo chỉ thẳng vào gốc.
 *
 * `BAI` nạp từ `/api/index` MỘT LẦN lúc tải trang. Việc `sinh-transcript` xong
 * SAU đó và gắn `.vtt` vào bản ghi — nhưng không gì đọc lại, nên `ban.media`
 * đứng nguyên ở giá trị của quá khứ. Cả hai bề mặt đều hỏi đúng câu, chỉ là
 * hỏi một vật đã cũ.
 *
 * GHI ĐÈ vào chính `ban` chứ không trả một bản sao: `WIN` giữ THAM CHIẾU tới
 * vật này, nên mọi bề mặt của cửa sổ ấy cùng thấy một câu trả lời. Mỗi bề mặt
 * tự hỏi riêng là hai lời gọi mạng cho một câu, và hai câu trả lời lệch nhau
 * lúc mạng chớp.
 *
 * ĐÃ có vtt ⇒ về ngay, KHÔNG gọi mạng: hàm này chạy mỗi lần mở tab.
 */
async function lamMoiHienVat(ban) {
  if (!ban || hienVatVtt(ban)) return ban;
  try {
    const r = await fetch("/api/articles/" + String(ban.slug ?? ""));
    if (!r.ok) return ban;
    const fm = (await r.json()).frontmatter ?? {};
    if (Array.isArray(fm.media)) ban.media = fm.media;
  } catch { /* mạng chớp ⇒ giữ thứ đang cầm, đừng xoá */ }
  return ban;
}

/* ═══ WO-081 · đọc transcript của một bản ghi theo `slug` ════════════════
 *
 * Cửa sổ VIỆC không có `ban` trong tay như cửa sổ bản ghi — nó chỉ có `slug`
 * trong payload. Nên đi hai chặng: bản ghi → sha của hiện vật `text/vtt` →
 * byte. Cùng hai cửa mà tab Transcript đã dùng, không mở đường đọc thứ ba.
 */
async function docTranscriptTheoSlug(sl) {
  const r = await fetch("/api/articles/" + sl);
  if (!r.ok) throw new Error("bản ghi trả " + r.status);
  const j = await r.json();
  const ds = (j && j.frontmatter && j.frontmatter.media) || [];
  const hv = (Array.isArray(ds) ? ds : [ds])
    .filter(Boolean).filter((m) => String(m.mime) === "text/vtt").at(-1);
  if (!hv) throw new Error("bản ghi chưa có hiện vật transcript");
  const r2 = await fetch("/api/articles/media/" + hv.sha256);
  if (!r2.ok) throw new Error("máy trả " + r2.status);
  return docVtt(await r2.text());
}

/* Nút CHƯNG CẤT xuống FOOTER, màu xanh lam.
 *
 * Chủ dự án 2026-09-09: *"đổi sang màu Xanh Lam và để ở footer"*. Footer là
 * chỗ mọi cửa sổ đặt hành động chính (`.bt-bt`, cùng khe nút "Duyệt vào kho"),
 * nên để nó ở giữa thân là đặt một hành động ở chỗ không ai tìm — và nó đẩy
 * transcript xuống dưới màn hình.
 *
 * `--c-video`: xanh lam đã khai trong `tokens.css`, và đúng nghĩa — đây là
 * hành động trên một bản ghi video. Không thêm token mới cho một sắc thái.
 */
function veNutChungCatTuTranscript(doc, sl) {
  // `esc` lấy qua cầu `mw()`, KHÔNG dùng trần: chunk này là một IIFE riêng, nên
  // một tên của `gn.js` gọi thẳng ở đây ném `ReferenceError` ngay lần bấm đầu.
  // `chunk-tu-chua` bắt đúng chỗ đó — và nó vừa bắt tôi.
  const { esc } = mw();
  const win = doc.closest(".bk");
  const khe = win && win.querySelector(".bk-f .bt-bt");
  if (!khe) return;
  khe.innerHTML = '<button data-act="cc-tu-tr" data-slug="' + esc(sl)
    + '">⚗ Chưng cất từ transcript</button>';
  khe.querySelector('[data-act="cc-tu-tr"]')?.addEventListener(
    "click", () => void chungCatTuTranscript(sl));
}

async function veTranscript(win) {
  trCss();
  const { WIN, banDangDoc, esc } = mw();
  const ban = banDangDoc(WIN.get(win.id));
  const doc = win.querySelector(".doc");
  if (!ban || !doc) return;
  // Hỏi kho TRƯỚC khi kết luận: kết luận trước khi hỏi thì câu trả lời là của
  // quá khứ, và người dùng phải Ctrl+Shift+R mới thấy sự thật.
  await lamMoiHienVat(ban);
  const hv = hienVatVtt(ban);
  if (!hv) {
    doc.innerHTML = '<p class="empty">Chưa có transcript. Bấm '
      + "<b>Sinh transcript</b> ở thanh tiêu đề để xếp một việc.</p>";
    return;
  }
  doc.innerHTML = '<p class="ld">Đang đọc transcript…</p>';
  let cue = [];
  try {
    const r = await fetch("/api/articles/media/" + hv.sha256);
    if (!r.ok) throw new Error("máy trả " + r.status);
    cue = docVtt(await r.text());
  } catch (e) {
    doc.innerHTML = '<p class="f-loi">' + esc(String(e.message ?? e)) + "</p>";
    return;
  }
  doc.innerHTML = cue.length
    ? '<ol class="tr">' + cue.map((c) =>
      '<li class="tr-i"><button class="tr-t" data-t="' + mmss(c.tu) + '">'
      + mmss(c.tu) + "</button><span>" + esc(c.text) + "</span></li>").join("")
      + "</ol>"
    : '<p class="empty">File transcript rỗng — không cue nào đọc được.</p>';
  doc.onclick = (e) => {
    const t = e.target.closest("[data-t]");
    if (t) chenMoc(t.dataset.t);
  };
}

/*
 * `WEBVTT` → `[{tu, text}]`.
 *
 * Đọc `HH:MM:SS.mmm --> …` và gộp mọi dòng chữ của cue. KHÔNG dùng thư viện:
 * đây là mười dòng, và một phụ thuộc mới trong chunk là byte mọi người bấm tab
 * phải tải.
 */
function docVtt(noi) {
  const ra = [];
  for (const khoi of String(noi).split(/\r?\n\r?\n/)) {
    const dong = khoi.split(/\r?\n/).filter(Boolean);
    const i = dong.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    const m = /(\d+):(\d\d):(\d\d)[.,](\d+)/.exec(dong[i]);
    if (!m) continue;
    ra.push({
      tu: Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]),
      text: dong.slice(i + 1).join(" ").trim(),
    });
  }
  return ra;
}

/* Chèn vào ô ĐANG GÕ. Không có ô nào thì NÓI RA — chèn im lặng vào một chỗ
 * người không thấy là mất một cú bấm mà không ai biết vì sao. */
function chenMoc(moc) {
  const o = document.activeElement;
  const chip = "[t=" + moc + "]";
  if (!o || !("selectionStart" in o)) {
    mw().bao(true, "Đặt con trỏ vào ô đang soạn rồi bấm mốc — " + chip
      + " cần một chỗ để chèn vào.");
    return;
  }
  const a = o.selectionStart ?? o.value.length;
  o.value = o.value.slice(0, a) + chip + o.value.slice(o.selectionEnd ?? a);
  o.selectionStart = o.selectionEnd = a + chip.length;
  o.dispatchEvent(new Event("input", { bubbles: true }));
}

globalThis.__GN_CCTAB__ = { ve: veViecCuaBan, dung: dungPoll, moPhieu: moPhieuChungCat,
  moCuaSoNhap,
  moCuaSoViec,
  moPhieuTranscript, veTranscript, moCuaSoTranscript, moCuaSoChungCat,
  veNutChungCatRieng, chungCatTuTranscript };
