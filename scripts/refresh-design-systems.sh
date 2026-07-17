#!/usr/bin/env bash
# Refresh the vendored design system catalog from VoltAgent/awesome-design-md (MIT).
#
# - Run from repo root: bash scripts/refresh-design-systems.sh
# - Requires `gh` authenticated (locally) or GH_TOKEN env var (CI).
# - Atomic per-system: writes to a tempdir first, only replaces the on-disk
#   DESIGN.md when the download succeeded and the file is non-empty. A failed
#   network call cannot leave a stale or empty file behind.
# - Removes systems no longer present upstream. To preserve a removed system,
#   rename its directory to `<name>-archived/`; any directory whose name ends
#   in `-archived` is never refreshed and never deleted.
# - Refuses to delete the catalog if the upstream listing comes back empty
#   (network glitch or auth failure should not nuke local files).

set -euo pipefail

UPSTREAM="VoltAgent/awesome-design-md"
SOURCE_PATH="design-md"
DEST="plugins/ui-design-system/skills/ui-design-system/design-systems"

if [ ! -d "$DEST" ]; then
  echo "Run from repo root; expected $DEST to exist." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found on PATH." >&2
  exit 1
fi

echo "Fetching upstream system list from $UPSTREAM/$SOURCE_PATH..."
SYSTEMS=$(gh api "repos/$UPSTREAM/contents/$SOURCE_PATH" --jq '.[] | select(.type=="dir") | .name')

if [ -z "$SYSTEMS" ]; then
  echo "Empty system list from upstream — aborting (refusing to delete catalog)." >&2
  exit 1
fi

UPSTREAM_COUNT=$(echo "$SYSTEMS" | wc -l | tr -d ' ')
echo "Upstream has $UPSTREAM_COUNT systems."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# Track which names exist upstream
SEEN_FILE="$TMPDIR/seen.txt"
: > "$SEEN_FILE"

# Download each system in parallel; write to a temp file, then move into place
# only on a successful, non-empty download. Bash subshell isolates the per-job
# error so one bad download doesn't fail the whole pass.
for sys in $SYSTEMS; do
  echo "$sys" >> "$SEEN_FILE"
  TMP="$TMPDIR/$sys.md"
  (
    if gh api "repos/$UPSTREAM/contents/$SOURCE_PATH/$sys/DESIGN.md" --jq '.content' 2>/dev/null \
      | base64 -d > "$TMP" 2>/dev/null; then
      if [ -s "$TMP" ]; then
        mkdir -p "$DEST/$sys"
        mv "$TMP" "$DEST/$sys/DESIGN.md"
      else
        echo "  empty:  $sys" >&2
      fi
    else
      echo "  failed: $sys" >&2
    fi
  ) &
done
wait

# Remove systems no longer present upstream. Directories renamed to
# `<name>-archived/` are deliberate local keeps of a system upstream dropped —
# they are absent from the upstream listing by definition, so skip them here
# rather than deleting the very copy the rename was meant to preserve.
removed=0
kept=0
shopt -s nullglob
for dir in "$DEST"/*/; do
  name=$(basename "$dir")
  case "$name" in
    *-archived)
      kept=$((kept + 1))
      continue
      ;;
  esac
  if ! grep -qx "$name" "$SEEN_FILE"; then
    echo "Removing $name (no longer in upstream)"
    rm -rf "$dir"
    removed=$((removed + 1))
  fi
done

echo "Refresh complete. Upstream count: $UPSTREAM_COUNT. Removed locally: $removed. Archived (skipped): $kept."
