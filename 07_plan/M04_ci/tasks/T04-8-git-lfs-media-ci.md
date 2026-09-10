> # ⛔ LỖI THỜI 2026-09-04 — `FR-060`
>
> Chủ dự án chốt: *"hiện tại ko commit video và ảnh lên git (lưu ở local) →
> lưu Video mp4 ở cloudflare. Và sau này tất cả dữ liệu đẩy lên Cloudflare hết."*
>
> Đơn vị này dựng git-lfs để media vào git mà không phình repo. **Media không
> vào git nữa**, nên git-lfs không giải bài nào — nó chỉ thêm một bước cài đặt
> cho mọi người clone.
>
> ⇒ **KHÔNG thi công.** Mở lại chỉ khi mốc R2 bị bỏ.
> `.gitignore` đã chặn video/audio tuyệt đối (`FR-060 §3`), và đó là phép chặn
> TRƯỚC khi có file đầu tiên — đo 2026-09-04: git có **0** file mp4/mov/webm.

# T04-8 — git-lfs cho kb/_media + CI không kéo media (FR-054 §9.3)

> Ba dòng giá đã đặt lên bàn (ô backlog): GitHub chặn >100MiB · lfs free 1GB
> ≈ MỘT video ở trần mới · CI kéo media = cổng B-C1 thành thứ đắt nhất dự án.

phạm_vi_ghi:
  - .gitattributes                     # kb/_media/** filter=lfs
  - .github/workflows/ci.yml           # GIT_LFS_SKIP_SMUDGE=1 + cài ./chungcat (đóng luôn ô chungcat-chưa-vào-CI)
  - .gitignore                         # chungcat/hang-doi/ + chungcat/log/ (ô dịch-vụ-ghi-repo, phần git)

verifiability: hard
tiêu_chí:
  - AC1: file >100KB add vào kb/_media đi qua lfs (pointer, không blob)
    cmd: bash -c "git check-attr filter kb/_media/x.mp4 | grep lfs"
  - AC2: CI cài ./chungcat và chạy đủ cổng M12; không bước nào kéo media thật
    cmd: grep -E "GIT_LFS_SKIP_SMUDGE|chungcat" .github/workflows/ci.yml
