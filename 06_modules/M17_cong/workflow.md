# M17_cong — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — ba lý do ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước.

## 1 · Ba chỗ M17 khác trình tự chuẩn

**a · NGÔN NGỮ CHƯA CHỌN.** `spec §0`: Caddy · nginx · tự viết — **s4 quyết**. Đây
là module duy nhất trong sáu chưa biết mình viết bằng gì. Hệ quả với trình tự: mọi
cổng của M17 phải đo **HÀNH VI**, không đo hình dạng mã — một cổng `grep` sẽ đúng
với đường tự-viết và **đỏ oan** với Caddy.

⚠️ Đây không phải một chi tiết kỹ thuật để hoãn: câu *"chọn gì"* kéo theo câu *"lộ
ra Internet tới đâu"*, và đó là một quyết định an ninh, không phải một lựa chọn công cụ.

**b · SÁU trong bảy nợ nằm NGOÀI M17.** Module này **phụ thuộc nhiều nhất và tự
làm được ít nhất**. `FR-047` (đã duyệt) mở bốn cửa nó cần: `C3` `C4` `C6` `C7`.
Trước khi bốn cửa đó có, M17 **không thi công được** — và đường đi vòng là **đọc DB
trực tiếp**, tức `Z4` chết trong khi mọi cổng vẫn xanh.

**c · BA AC là lỗ trong một FR ĐÃ DUYỆT, chưa ai cho phép thi công.**
`AC-3.4` (rate limit) · `AC-3.5` (entropy ≥128 bit) · `AC-3.6` (log thất bại) đến
từ `security_baseline §8.1` — một lỗ tìm thấy **sau** khi `FR-045` duyệt. Chúng
viết được testcase, nhưng cần **FR bổ sung** trước khi thành task.

## 2 · Thứ tự trong module

```
1. quyết ngôn ngữ (s4)                                        ← CHẶN mọi thứ dưới
2. cổng bảng khai: đúng MỘT nghe_ngoai · can_key_model false  ← 0 phụ thuộc, làm được NGAY
3. chuyển tiếp nguyên vẹn 443 → 127.0.0.1:8787                ← cần 1
4. xác thực bằng `phien` (FR-047 C6)                          ← cần 3 + FR-047
5. buộc chat_id bằng `ma_moi` (FR-047 C4 + C7)                ← cần 4
6. audit mọi lần thử, kể cả thất bại (FR-047 C5)              ← cần 4
7. rate limit + entropy — CHỜ FR bổ sung                      ← cần 5 + FR mới
```

**Bước 2 làm được NGAY, trước cả khi chọn ngôn ngữ** — nó chỉ đọc
`core/assets/dich-vu.json`. Làm nó sớm có giá trị thật: nó là cổng canh `Z3`, và
`Z3` có thể bị phá **trước khi** M17 có một dòng mã nào (ai đó đặt `nghe_ngoai: true`
cho một dịch vụ khác).

**Bước 6 trước bước 7** vì log là thứ cho biết **có đang bị dò không** — dựng rate
limit trước khi có log thì không ai biết ngưỡng đặt đúng chưa.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py
python core/tests/check_ba.py
python core/tests/check_rule_surfaces.py
cd web && node test/api-guard.test.js    # AC-1.2 — web PHẢI vẫn bind loopback
```

⚠️ `api-guard.test.js` chạy sau **mỗi** đơn vị của M17, và nó phải **0 dòng đổi**.
Sửa nó để M17 qua là đúng thứ M17 tồn tại để khỏi phải làm.

## 4 · Chỗ DỪNG riêng của M17

- định sửa `api-guard.test.js` hoặc `M08-R1` để M17 qua ⇒ **DỪNG** — đó là dấu hiệu
  bề mặt Internet đang bị đặt nhầm chỗ
- định đọc DB trực tiếp vì cửa chưa có ⇒ DỪNG (`Z4`); chờ `FR-047`
- định dùng **chung** khoá service-to-service với khoá session ⇒ DỪNG
  (`CVE-2025-41258`, `FR-047 L3`)
- định thêm một trang lỗi HTML ⇒ DỪNG (`AC-2.3`) — nó rò tên dịch vụ + version
- thông báo phân biệt được *"chat_id lạ"* với *"chat_id có nhưng chưa buộc"* ⇒ DỪNG:
  đó là một phép **đếm tài khoản** cho người lạ (`FR-047 V6`)
- định thi công `AC-3.4/3.5/3.6` trước khi có FR bổ sung ⇒ DỪNG
