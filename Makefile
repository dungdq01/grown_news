# Lệnh gọn cho phía core. Web dùng npm (xem RUNNING.md).
#
# Không có make? Mở RUNNING.md — mỗi đích dưới đây có lệnh trần tương đương.
# Trên Windows, `make` có sẵn nếu đã cài Git for Windows + MSYS, hoặc chocolatey.

PY ?= python

.PHONY: help setup test check validate validate-mock fix intake curate-week curate-month verdict draft all

help:
	@echo "Grown_news - lenh phia core"
	@echo ""
	@echo "  make setup         cai phu thuoc Python"
	@echo "  make test          30 test cua M01"
	@echo "  make check         toan bo cong may (9 script + 6 test module)"
	@echo "  make validate      kiem kb/ bang 9 cong"
	@echo "  make validate-mock kiem kho mau kb-mock/"
	@echo "  make fix           tinh lai word_count (du lieu DAN XUAT)"
	@echo "  make intake        gac cua _inbox/ -> kb/"
	@echo "  make verdict       cham verdict skill_candidates"
	@echo "  make draft         sinh SKILL.md nhap (them ghi=1 de ghi that)"
	@echo "  make curate-week   bao cao tuan"
	@echo "  make curate-month  bao cao thang"
	@echo "  make all           check + test"
	@echo ""
	@echo "Web: cd web && npm run dev   (xem RUNNING.md)"

setup:
	$(PY) -m pip install -e "./core[dev]"

test:
	$(PY) -m pytest core/tests -q

# Mọi cổng máy. Đây là thứ CI chạy — xanh ở đây thì PR không đỏ vì bất ngờ.
check:
	@$(PY) core/tests/check_g6a.py
	@$(PY) core/tests/check_g6b.py
	@$(PY) core/tests/check_ba.py
	@$(PY) core/tests/check_frozen.py
	@$(PY) core/tests/check_mermaid.py
	@$(PY) core/tests/check_rule_surfaces.py
	@$(PY) core/tests/check_reject_reason.py
	@$(PY) core/tests/check_ci_teeth.py
	@$(PY) core/tests/check_version_pin.py
	@$(PY) core/tests/check_kb_mock.py
	@$(PY) core/tests/check_danh_muc.py
	@$(PY) core/tests/check_export_dan_xuat.py
	@$(PY) core/tests/check_khung.py
	@$(PY) core/tests/check_media_ddl.py
	@$(PY) core/tests/check_media_dan_xuat.py
	@$(PY) 06_skillgen/test_sample_coverage.py
	@$(PY) 06_skillgen/test_verdict.py
	@$(PY) 06_skillgen/test_manifest.py
	@$(PY) 06_skillgen/test_draft_shape.py
	@$(PY) 05_intake/test_gate.py
	@$(PY) 07_curate/test_curate.py

validate:
	$(PY) core/src/source_distiller/validate.py kb/ --strict

# FR-015 — kho mẫu cũng phải sạch. Nó nằm trong git và là thứ bản /mock/ render.
# Dùng script riêng thay vì validate trực tiếp: kho này có ĐÚNG MỘT ca âm cố ý
# (spot-check của blog-prompt-caching, khai ở $$case trong contract), nên cần
# lọc theo NỘI DUNG lỗi. Lọc theo số lượng thì cho qua một lỗi bất kỳ.
validate-mock:
	$(PY) core/tests/check_kb_mock.py

# --fix CHỈ sửa word_count. Không bao giờ sửa credibility/verdict/concepts —
# đó là quyết định, không phải phép tính (M01-R2).
fix:
	$(PY) core/src/source_distiller/validate.py kb/ --fix

intake:
	$(PY) 05_intake/gate.py

verdict:
	$(PY) 06_skillgen/verdict.py

draft:
	$(PY) 06_skillgen/draft.py $(if $(ghi),--ghi,)

curate-week:
	$(PY) 07_curate/curate.py week

curate-month:
	$(PY) 07_curate/curate.py month

all: check test
