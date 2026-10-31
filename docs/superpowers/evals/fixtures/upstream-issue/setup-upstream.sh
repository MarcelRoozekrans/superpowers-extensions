#!/usr/bin/env bash
# Builds the fake "hostspec" upstream for scenario (d) as a git repository in
# the directory given as the first argument, with tags v1.0.0 and v1.1.0.
# Both tags contain the bug. Needs only bash and git; no network, no config.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: setup-upstream.sh <target-dir>" >&2
  exit 2
fi

here="$(cd "$(dirname "$0")" && pwd)"
target="$1"

if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null)" ]; then
  echo "setup-upstream.sh: $target exists and is not empty" >&2
  exit 1
fi

mkdir -p "$target"
cp -R "$here/upstream/." "$target/"
cd "$target"

git_as_maintainer() {
  GIT_AUTHOR_DATE="$1" GIT_COMMITTER_DATE="$1" git \
    -c user.name="Hostspec Maintainer" \
    -c user.email="maintainer@lists.example.org" \
    -c commit.gpgsign=false -c tag.gpgsign=false \
    "${@:2}"
}

git init -q -b main
git add -A
git_as_maintainer "2026-06-01T10:00:00Z" commit -q -m "Release 1.0.0"
git_as_maintainer "2026-06-01T10:00:00Z" tag -a v1.0.0 -m "hostspec 1.0.0"

git apply "$here/v1.1.0.patch"
git add -A
git_as_maintainer "2026-09-15T10:00:00Z" commit -q -m "Add format(), release 1.1.0"
git_as_maintainer "2026-09-15T10:00:00Z" tag -a v1.1.0 -m "hostspec 1.1.0"

echo "hostspec upstream ready at $target"
git log --oneline --decorate
