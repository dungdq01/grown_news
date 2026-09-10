#!/bin/sh
# AC-2.5.1 và AC-2.5.2 của M04_ci — bề mặt S4.
#
# Chạy hook thật trên một file .md hỏng, trong một kho git TẠM.
# Không đụng kho thật: hook đọc `git diff --cached`, nên phải có index thật.
#
#   bash .githooks/test-hook.sh                   AC-2.5.1 hook chặn
#   bash .githooks/test-hook.sh --no-verify-case  AC-2.5.2 --no-verify bỏ qua được

set -e
GOC=$(cd "$(dirname "$0")/.." && pwd)
PY=${PYTHON:-python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Kho tạm có đủ thứ hook cần: core/, .githooks/, kb/ + concepts.yaml
#
# concepts.yaml BẮT BUỘC: thiếu nó thì validator từ chối chạy vì cổng chống tự
# sinh khái niệm đang tắt — và nó đúng khi từ chối. Lượt đầu tôi quên chép, nên
# test báo "hook chặn cả file đạt chuẩn" trong khi hook không có lỗi gì.
mkdir -p "$TMP/kb/paper"
cp -r "$GOC/core" "$TMP/core"
cp -r "$GOC/.githooks" "$TMP/.githooks"
cp "$GOC/kb/concepts.yaml" "$TMP/kb/concepts.yaml"
cd "$TMP"
git init -q . && git config user.email t@t && git config user.name t
git config core.hooksPath .githooks
git add -A && git commit -qm base --no-verify

# File .md hỏng: có frontmatter nhưng thiếu trường bắt buộc
cat > kb/paper/hong.md <<'EOF'
---
id: src_hong01
slug: ban-hong
---
# Bản thiếu gần hết trường bắt buộc
EOF
git add kb/paper/hong.md

if [ "$1" = "--no-verify-case" ]; then
  # AC-2.5.2 · --no-verify PHẢI bỏ qua được. Đây là khẳng định, không phải lỗi:
  # nó là lý do CI (S3) phải chạy lại validate.
  if PYTHON="$PY" git commit -qm "bo qua" --no-verify 2>/dev/null; then
    echo "pass · --no-verify bỏ qua được hook"
    echo "       ⇒ đúng lý do CI phải chạy lại validate (S3 ≠ S4)"
    exit 0
  fi
  echo "FAIL · --no-verify KHÔNG bỏ qua được — hook đang chặn sai cách"
  exit 1
fi

# AC-2.5.1 · commit thường PHẢI bị chặn
if PYTHON="$PY" git commit -qm "file hong" >/dev/null 2>&1; then
  echo "FAIL · hook KHÔNG chặn file .md sai format"
  echo "       S4 mất răng: file hỏng vào kho mà không ai biết"
  exit 1
fi
echo "pass · hook chặn commit file .md sai format"

# Và file đạt chuẩn PHẢI qua được — cổng đỏ giả cũng làm người ta bỏ qua hook
git reset -q
cp "$GOC/core/tests/fixtures/dat-chuan.md" kb/paper/tot.md
rm -f kb/paper/hong.md
git add -A
if PYTHON="$PY" git commit -qm "file tot" >/dev/null 2>&1; then
  echo "pass · file đạt chuẩn qua được — hook không đỏ giả"
  exit 0
fi
echo "FAIL · hook chặn cả file ĐẠT CHUẨN — đỏ giả, người ta sẽ tắt hook"
exit 1
