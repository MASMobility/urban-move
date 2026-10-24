# Provenance

Vendored from https://github.com/awslabs/agent-plugins (Apache-2.0, see LICENSE)
- skill: `plugins/deploy-on-aws/skills/aws-architecture-diagram` (commit fbefb37, 2026-10-09)
- helper scripts: `plugins/deploy-on-aws/scripts/lib` -> `scripts/lib`

Local changes (repo-relative paths now live under `.claude/skills/`): `${PLUGIN_ROOT}` paths rewritten to repo-relative paths; the PostToolUse
hook (Claude Code plugin only) was replaced by an explicit `post_process_drawio.py` step
so the skill behaves identically in Claude Code and OpenCode.
Reviewed before vendoring: no network calls except `drawio_url.py`, which only builds an
`app.diagrams.net/#create=` URL (diagram data stays in the URL fragment) and opens a browser.
