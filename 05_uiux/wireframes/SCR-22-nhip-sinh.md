# SCR-22 · Nhịp SINH — sóng âm lúc phiên âm, mạch nghĩ lúc chưng cất

> `T03-124` bước 1. **Trạng thái: ĐÃ DUYỆT — chủ dự án, 2026-09-07.**
> Ba câu cuối chốt theo phương án đề xuất: dải theo NHỊP CUE (a) · chưng cất
> dùng VÒNG XOAY, không dải tần · **24 cột**. Bước 2 (mã) được phép chạy.
>
> Note của chủ dự án, chép nguyên văn để không rơi:
> *"UI và animation lúc transcript / chưng cất phải hiệu ứng 3D, superpower
> (kiểu dải tần số, hiệu ứng âm thanh...) vào nha. now, it's basic"*

---

## Câu hỏi khó nhất: dải tần số vẽ từ ĐÂU?

Đây là chỗ wireframe phải chọn một lối và nói vì sao, chứ không vẽ đẹp rồi
tính sau.

**Sự thật đo được:** FE **không có** byte audio. Audio sống ở thợ
(`chungcat/hang-doi/*.audio.mp3`), và nó không bao giờ tới trình duyệt — đó là
cả điểm của `M12-R1`. Không có `AudioContext`, không có FFT, không có phổ thật.

| lối | được | mất |
|---|---|---|
| (a) **dải theo NHỊP CUE THẬT** | mỗi cột nhảy khi có chữ mới về; im khi thợ im | không phải phổ âm thanh thật |
| (b) dải ngẫu nhiên | đẹp đều, mượt | **nó nói dối** — chuyển động không tương ứng việc gì |

**Chọn (a).** Một dải nhảy múa trong lúc thợ đã chết là thứ tệ hơn không có
dải: người ngồi đợi một thanh chạy cho một việc đã dừng. Chuyển động phải là
một PHÉP ĐO, không phải một lớp trang trí.

Cổng sẽ có vế cấm `Math.random()` trên đường vẽ.

---

## 1 · PHIÊN ÂM — "dải tần số" lấy nhịp từ cue

```
   ┌──────────────────────────────────────────────┐
   │  ♫  ĐANG PHIÊN ÂM        142 câu · tới 09:12  │
   │                                              │
   │    ▁▃▅█▆▃▁▂▄▆█▇▄▂▁▁▃▅▇█▅▂▁                  │   ← 24 cột
   │    └─ cột trái = cũ ······ phải = mới ─┘     │
   │                                              │
   │  …bạn sẽ thấy tốc độ tăng lên rõ rệt          │  ← cue mới trượt vào
   │  …và đó là lý do chúng ta cần cache           │
   └──────────────────────────────────────────────┘
```

**Dữ liệu nuôi dải:** mỗi nhịp poll (1.2s) tính `số cue mới` và `số ký tự mới`
so với nhịp trước. Hai số ấy → chiều cao cột mới nhất. Dải trượt trái một cột
mỗi nhịp.

- thợ đang chạy nhanh ⇒ cột cao
- thợ chậm lại ⇒ cột thấp dần
- thợ **đứng** ⇒ cột phẳng về đáy, và ĐÓ LÀ TÍN HIỆU — không phải lỗi hiển thị

**3D bằng gì:** `transform: scaleY()` + `perspective` trên khối cha, mỗi cột
lệch `translateZ` theo chỉ số. Không animate `height` — `AC6` của khuôn UI cấm
animate thuộc tính layout, và cấm có lý do: `height` bắt trình duyệt tính lại
bố cục 60 lần một giây.

---

## 2 · CHƯNG CẤT — mạch nghĩ, không phải sóng âm

Chưng cất **không có âm thanh**. Vẽ một dải tần số ở đây là mượn hình của một
việc khác — cùng lỗi "mượn màu của chiều phân loại khác" mà `SCR-20` đã cấm.

```
   ┌──────────────────────────────────────────────┐
   │  ⚗  ĐANG CHƯNG CẤT                            │
   │                                              │
   │      ◜◝                                      │
   │    ◜    ◝     ← ba vòng lệch pha, xoay chậm   │
   │      ◟◞         (rotateX/rotateY, 8s/vòng)   │
   │                                              │
   │  đọc nguồn ✓ → gọi model ⟳ → đối chiếu ○      │
   │  gemini-2.5-flash-lite · gửi 1/2              │
   └──────────────────────────────────────────────┘
```

**Không có thanh phần trăm.** Ta KHÔNG biết model còn bao lâu — bịa một con số
% là hứa một thứ mình không đo được. Cái đo được là **chặng** (`giai_doan`), và
dây chuyền bốn nấc đã có sẵn (`veDayChuyen`).

Ba vòng xoay nói *"đang nghĩ"* mà không nói *"còn 40%"*.

---

## 3 · `prefers-reduced-motion` — tắt HẲN, không làm chậm

```css
@media (prefers-reduced-motion: reduce) {
  .ns-cot, .ns-vong { animation: none; transition: none }
  /* dải vẫn hiện, vẫn ĐÚNG chiều cao — chỉ thôi chuyển động */
}
```

Người đã khai mình cần tắt chuyển động thì **vẫn phải đọc được tiến độ**. Tắt
cả khối là phạt họ hai lần: vừa không có hiệu ứng, vừa mất thông tin.

---

## 4 · Chỗ CSS sống, và ngân sách

| | |
|---|---|
| `gn.js` | **101 932 / 102 400** — còn **468 byte** |
| `gn.css` | 102 763 / 104 448 — còn 1 685 byte |

⇒ Hiệu ứng đi **hẳn** vào chunk (`KHOI_CSS` của `cctab`), **0 byte** vào bundle
chung. Cửa sổ transcript và cửa sổ chưng cất đều là chunk, nên không có lý do
nào để một pixel của nó nằm ở `gn.js`.

---

## 5 · Bốn AC đo được

1. **0 `Math.random()`** trên đường vẽ dải — chuyển động là phép đo
2. **0 thuộc tính layout** được animate (chỉ `transform`/`opacity`)
3. có khối `prefers-reduced-motion` và nó **giữ** thông tin, chỉ bỏ chuyển động
4. `gn.js`/`gn.css` không vượt trần

---

## Ba câu cần chủ dự án chốt

1. **Dải theo nhịp cue (a)** — chấp nhận rằng nó không phải phổ âm thanh thật?
   Hay bạn muốn (b) đẹp hơn dù nó không tương ứng gì?
2. **Chưng cất dùng vòng xoay, không dùng dải tần số** — hay bạn muốn cả hai
   màn cùng một hình cho nhất quán?
3. **24 cột** cho dải — nhiều hơn thì mượt hơn nhưng tốn nhịp vẽ; ít hơn thì
   thô. Đủ chưa?

**Chưa duyệt ⇒ chưa code.** `AC0` của `T03-124`.
