# T06-3 — sinh SKILL.md nháp, thân RỖNG

phạm_vi_ghi:
  - 06_skillgen/**
verifiability: hard
tiêu_chí:
  - AC1: nháp có đủ 4 phần và thân rỗng
    cmd: python 06_skillgen/test_draft_shape.py
  - AC2: không nháp nào có nội dung thân > 0 dòng thật
    cmd: python 06_skillgen/test_draft_shape.py -k than_rong

phụ_thuộc: T06-2

## Nháp gồm đúng bốn phần

1. frontmatter `name` + `description` — từ `draft_trigger`
2. mục "Khi nào dùng" — từ `why_now`
3. **con trỏ ngược** về bản `.md` nguồn kèm số dòng
4. thân trống + `<!-- TODO: viết sau khi có nguồn thứ 2 -->`

## AC2 chống CHÍNH MODULE NÀY

`M06-R2` là rule tự-kiềm-chế: dễ nhất khi implement là "sinh luôn cho tiện", và
kết quả trông tốt hơn hẳn — cho tới lúc cài vào agent.

Sinh từ **một** nguồn thì chỉ chép lại nguồn đó. Skill thật cần thứ học được sau
3 nguồn và một lần va thất bại.

## Cấm

Tự cài skill vào agent (`M06-R4`). Máy đề xuất, **người quyết định cài** — PRD U7.
