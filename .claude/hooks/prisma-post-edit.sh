#!/bin/bash
# PostToolUse hook: auto-validate and regenerate Prisma client after schema edits
# Receives tool input as JSON on stdin

FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.filePath // empty' < /dev/stdin)

# Only run for Prisma schema files
if [[ "$FILE_PATH" == *.prisma ]]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  echo "Prisma schema changed: $FILE_PATH" >&2
  echo "Running prisma validate..." >&2
  npx prisma validate 2>&1 >&2
  echo "Running prisma generate..." >&2
  npx prisma generate 2>&1 >&2
fi

exit 0
