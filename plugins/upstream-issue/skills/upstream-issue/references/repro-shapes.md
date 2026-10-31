# Repro shapes

Used in phase 5. The repro is what a maintainer runs first, so it has to be small, pinned and already seen to fail. Pick the shape by reading the upstream project, not by guessing.

## Order of preference

1. **A failing test in upstream's own test framework.** Maintainers can drop it into their suite and run it. It also shows where the behaviour lives.
2. **A minimal standalone project.** A few files with a manifest that pins versions and one command that runs it.
3. **A single script.** Use it when upstream has no test setup you can reuse and the bug needs no project structure.

Take the first shape upstream supports. Do not pick a lower one because it is quicker to write.

## Which shape upstream supports

Look in the upstream repository for:

- the test directory, and what an existing test looks like: framework, naming, helpers and fixtures
- `CONTRIBUTING`, which often says how to add a test or report a bug
- CI configuration, which shows the exact commands and versions upstream runs
- the issue template, which may ask for a specific repro form

If the tests need the whole upstream checkout to run, the failing test is for a clone of upstream at the version you report. Say so in the run instructions. If upstream has no tests you can reuse, go to the next shape.

## Pin exact versions

- Pin the upstream project to an exact version, not a range. Use the latest release found in phase 3.
- Pin the runtime too: the language version or runtime image.
- Pin direct dependencies the bug can depend on, and commit the lockfile when the ecosystem has one.
- Write the install and run commands out in full. The clean runner follows them exactly.

## Minimisation checklist

Remove until the failure disappears, then put back the last thing removed.

- Remove your own application code. Only calls into upstream remain.
- Remove unrelated dependencies, plugins and middleware.
- Remove config keys that do not change the result.
- Shrink the input to the smallest one that still triggers the failure.
- Replace real data with invented values. Use documentation values such as `example.com` and `192.0.2.1`.
- Remove anything that points at your setup: home paths, hostnames, device names, tokens.
- Run it once more after the last cut and confirm the failure text is unchanged.

## Inline or separate repo

A repro of one file of at most about 60 lines, plus its run command, goes inline in the issue body. Anything larger goes in a new public repo under the user's account, created only after the user approves. Both are shown to the user before anything is public.

## Ecosystem hints

Check each against the upstream project's own setup.

- **npm.** Use `package.json` with exact versions and `npm ci` or `npm install --save-exact`. Use the test runner upstream uses, such as `node --test`, vitest or jest. Note the Node version.
- **pip.** Use a fresh virtual environment and `pip install pkg==X.Y.Z`. Tests usually run with `pytest`. Note the Python version.
- **dotnet.** Use a small project with `PackageReference` set to an exact version and `dotnet test` or `dotnet run`. Note the SDK version, from `dotnet --version`.
- **cargo.** Use `Cargo.toml` with `=X.Y.Z` pins and commit `Cargo.lock`. Run with `cargo test` or `cargo run`. Note the toolchain.
- **go.** Use `go.mod` with the exact module version and run `go test`. Note the Go version.
- **CLI tools.** Give the exact install command and version, the full command line, any input file inline, and the exit code with the full output. Keep the environment minimal.
