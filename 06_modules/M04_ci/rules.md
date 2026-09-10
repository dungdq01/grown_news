# M04_ci — rules

```yaml
- id: M04-R1
  vi_phạm: "một bước trong workflow có continue-on-error: true, hoặc CI xanh khi test đỏ"
  bề_mặt: S3          # check_rule_surfaces.py — quét workflow tìm chỗ nuốt lỗi
  why: >
    Cổng luôn xanh không phải cổng, là trang trí. Và tệ hơn không có gì: nó tạo
    cảm giác được bảo vệ. R2 đòi "kết quả máy xanh" — nếu xanh là mặc định thì
    câu đó vô nghĩa và mọi đơn vị việc đi qua nhịp ④ mà không bị chặn gì.

- id: M04-R2
  vi_phạm: "workflow sửa file trong core/ hoặc kb/ (kể cả chạy --fix rồi commit)"
  bề_mặt: S4          # git diff của CI bot — thấy ngay trong lịch sử
  why: >
    Luật gốc: không ai được sở hữu thứ dùng để đánh giá mình. CI --fix rồi commit
    thì lỗi biến mất khỏi log mà nguyên nhân còn nguyên — lần sau lại sai như cũ,
    và không ai thấy vì nó "tự khỏi".

- id: M04-R3
  vi_phạm: "bật ci.yml khi 4 lệnh hard của spec chưa xanh trên máy"
  bề_mặt: S2
  why: >
    CI đỏ ngay từ commit đầu sẽ bị người ta bỏ qua theo thói quen, và từ đó S3
    mất răng vĩnh viễn — đỏ thành trạng thái bình thường.
    Đây là lý do s4 để dạng .template chứ không phải quên bật.

- id: M04-R4
  vi_phạm: "python-version của workflow khác requires-python của pyproject.toml"
  bề_mặt: S3          # check_version_pin.py
  why: >
    ADR-02. Hai số khác nhau thì CI kiểm một môi trường, người phát triển chạy
    môi trường khác, và lỗi chỉ lộ trên CI — chỗ đắt nhất để phát hiện.
    HIỆN ĐANG VI PHẠM: workflow 3.11 vs pyproject >=3.9. Nợ của B1.
```

## Rule đang đỏ — khai thẳng

`M04-R4` **đang vi phạm ngay lúc viết spec này**. `check_version_pin.py` chạy ra
exit 1, in đúng cách sửa.

Không sửa lén ở s6: đây là nợ của đơn vị việc B1, và spec phải mô tả trạng thái
thật. Sửa ở s6 thì s7 không biết việc đó tồn tại.
