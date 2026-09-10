# T03-78 — WO-035: cổng canh nút cuối form + ô tích không dàn hai mép (đơn vị TEST)

> Tách khỏi T03-79 vì R1 — đơn vị không phải test thì không chạm `web/test/**`.
>
> Thêm răng vào `mo-ta-va-nut-nap.test.js` (WO-018 đã sở hữu "ô nhãn nhìn thấy
> được · nút nạp") chứ không dựng cổng thứ hai cho cùng một màn.
>
> §8 phải đo **THỨ TỰ TRONG DOM**, không đo "có nút hay không": phép kiểm có-mặt
> vẫn xanh y nguyên khi nút nằm sai chỗ — đúng lỗi đang phải chữa. Và màn bài
> viết là bản ĐÚNG, nên nó phải xanh ngay từ lượt đỏ đầu tiên; xanh cả ba màn
> hoặc đỏ cả ba màn đều là dấu hiệu phép đo hỏng.
>
> §9 phải đo **CẢ HAI VẾ**. Vế CSS một mình không nói được gì: `.f-row > span`
> chỉ giẫm lên `.f-chon` khi mốc ĐÚNG LÀ một `<span>` con trực tiếp của `.f-row`.
> Đổi mốc sang `<div>` cũng là một cách chữa hợp lệ, và lúc đó luật CSS kia
> không còn là điều phải cấm. Nên cổng đo tiền đề (markup) rồi mới đo kết luận.
>
> Bộ thuộc tính cấm phải **suy từ luật `.f-chon`**, không gõ tay: thêm một khai
> báo vào `.f-chon` mà cổng không biết là một lỗ mở lại.
>
> Cắt luật CSS bằng **quét ngoặc theo độ sâu**, KHÔNG dùng neo `(?:^|[};])` —
> neo đó nuốt dấu `}` của luật liền trước nên chỉ thấy cách một luật (WO-027).

phạm_vi_ghi:
  - web/test/mo-ta-va-nut-nap.test.js
verifiability: hard
tiêu_chí:
  - AC1: §8 đỏ khi nút `#tv-gui`/`#vd-gui` đứng TRƯỚC bất kỳ ô nào trong
      `title` · `cat` · `cpt`, và đòi nút sống trong `.f-act`; màn `nap-bai-viet`
      xanh ở cùng lượt đo (chống cổng đỏ oan)
    cmd: node web/test/mo-ta-va-nut-nap.test.js
  - AC2: §9 đo tiền đề markup (mốc `.f-chon` là `<span>` con trực tiếp của
      `.f-row`) TRƯỚC khi kết luận về CSS, và đỏ khi có luật nào khớp mốc đó mà
      khai lại thuộc tính `.f-chon` đã khai, hoặc khai `justify-content`
    cmd: node web/test/mo-ta-va-nut-nap.test.js
  - AC3: mọi phép so đều có chốt chống-xanh-vô-căn-cứ — số luật cắt được, số mốc
      tìm được, vị trí từng ô đều phải > 0 trước khi so
    cmd: node web/test/mo-ta-va-nut-nap.test.js
