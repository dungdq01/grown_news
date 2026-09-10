# T01-45 — ba bảng khai M01 đón transcript (đất M01 — FR-054 §9)

> Ba việc nhỏ cùng chủ đất, gom một đơn vị. Nợ đã ghi ở backlog M12
> (ô §8.6-sai-chỗ · ô dia-chi-slug-moc). KHÔNG chạm frontmatter.schema.json
> (FROZEN — phần đó ở T12-14, NGƯỜI ký).

phạm_vi_ghi:
  - core/assets/media-mime.json        # +text/vtt (magic WEBVTT)
  - core/assets/kho.schema.sql         # media +cột kieu_moc TEXT (la_asr | nguoi_sua | NULL)
  - core/assets/dia-chi.json           # slug-moc: mot_phan → day_du + bat_link_gay (kiểm bằng cue cuối .vtt)
  - core/src/source_distiller/validate.py   # [t=..] đối chiếu thời lượng .vtt khi có + QUYẾT 2: tai-lieu cấm media mime video/*|audio/* (video được)

verifiability: hard
tiêu_chí:
  - AC1: .vtt fixture qua cửa media nhận đúng mime; file magic sai ⇒ 422
    cmd: node web/test/media-cua-so.test.js
  - AC2: schema mới parse + dung_lai_db round-trip fixture (thư mục tạm)
    cmd: python core/tests/check_khung.py
  - AC3: [t=03:15] trỏ QUÁ thời lượng .vtt ⇒ validate đỏ; trong thời lượng ⇒ xanh
    cmd: python core/tests/check_dinh_dang_mo.py
  - AC4: bản ghi tai-lieu mang media mime video/mp4 ⇒ validate ĐỎ nói rõ "video
      thuộc bản ghi video"; bản ghi video mang cùng media ⇒ XANH (quyết 2 —
      đóng lỗ MP4-lạc-bảng của backlog M12)
    cmd: python core/src/source_distiller/validate.py --strict kb-mock/ 2>&1 | head -3; python core/tests/check_dinh_dang_mo.py
