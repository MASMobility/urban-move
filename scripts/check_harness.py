#!/usr/bin/env python3
"""Checks that the agent harness is consistent and loadable by OpenCode and Claude Code.

    python scripts/check_harness.py

Exit code 1 if anything is wrong. Needs PyYAML (requirements.txt).
"""
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_MEMORY_LINES = 200
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def frontmatter(path: Path):
    """Parses the YAML frontmatter strictly, as OpenCode does. Returns (data, body) or (None, text)."""
    text = path.read_text(encoding="utf-8")
    match = re.match(r"---\r?\n(.*?)\r?\n---\r?\n(.*)", text, re.S)
    if not match:
        fail(f"{path.relative_to(ROOT)}: no frontmatter between --- lines")
        return None, text
    try:
        data = yaml.safe_load(match.group(1))
    except yaml.YAMLError as error:
        first = str(error).splitlines()[0]
        fail(f"{path.relative_to(ROOT)}: invalid YAML in frontmatter ({first}); quote values that contain ': '")
        return None, match.group(2)
    if not isinstance(data, dict):
        fail(f"{path.relative_to(ROOT)}: frontmatter must be a mapping")
        return None, match.group(2)
    return data, match.group(2)


def strip_jsonc(text: str) -> str:
    """Removes // and /* */ comments outside strings."""
    pattern = re.compile(r'("(?:\\.|[^"\\])*")|//[^\n]*|/\*.*?\*/', re.S)
    return pattern.sub(lambda m: m.group(1) or "", text)


def check_skills() -> set[str]:
    skills = set()
    for folder in sorted((ROOT / ".claude/skills").iterdir()):
        if not folder.is_dir():
            continue
        skills.add(folder.name)
        skill_file = folder / "SKILL.md"
        if not skill_file.exists():
            fail(f".claude/skills/{folder.name}: missing SKILL.md")
            continue
        data, _ = frontmatter(skill_file)
        if data is None:
            continue
        rel = f".claude/skills/{folder.name}/SKILL.md"
        name = data.get("name")
        if name != folder.name:
            fail(f"{rel}: name {name!r} must equal the folder name {folder.name!r}")
        if not isinstance(name, str) or not NAME.match(name) or len(name) > 64:
            fail(f"{rel}: name must match {NAME.pattern} and be at most 64 characters")
        description = data.get("description")
        if not isinstance(description, str) or not description.strip():
            fail(f"{rel}: description is required")
        elif len(description.strip()) > 1024:
            fail(f"{rel}: description has {len(description.strip())} characters (OpenCode accepts at most 1024)")
    return skills


def check_claude_agents(skills: set[str]) -> set[str]:
    names = set()
    folder = ROOT / ".claude/agents"
    for agent_file in sorted(folder.glob("*.md")) if folder.exists() else []:
        rel = f".claude/agents/{agent_file.name}"
        data, body = frontmatter(agent_file)
        if data is None:
            continue
        names.add(agent_file.stem)
        if data.get("name") != agent_file.stem:
            fail(f"{rel}: name {data.get('name')!r} must equal the file name {agent_file.stem!r}")
        for key in ("description", "tools"):
            if not data.get(key):
                fail(f"{rel}: missing {key}")
        for skill in data.get("skills") or []:
            if skill not in skills:
                fail(f"{rel}: preloads skill {skill!r}, which does not exist")
        for hook in re.findall(r"\.claude/hooks/[\w.-]+", agent_file.read_text(encoding="utf-8")):
            if not (ROOT / hook).exists():
                fail(f"{rel}: hook script {hook} does not exist")
        prompts = re.findall(r"`(\.opencode/prompts/[\w.-]+\.md)`", body)
        if not prompts:
            fail(f"{rel}: must point to its shared prompt in .opencode/prompts/")
        for prompt in prompts:
            if not (ROOT / prompt).exists():
                fail(f"{rel}: prompt {prompt} does not exist")
    return names


def check_opencode(claude_agents: set[str]) -> None:
    config_path = ROOT / "opencode.jsonc"
    if not config_path.exists():
        fail("opencode.jsonc is missing")
        return
    try:
        config = json.loads(strip_jsonc(config_path.read_text(encoding="utf-8")))
    except json.JSONDecodeError as error:
        fail(f"opencode.jsonc: invalid JSON ({error})")
        return

    agents = config.get("agent", {})
    for name, agent in agents.items():
        where = f"opencode.jsonc agent {name!r}"
        if not agent.get("description"):
            fail(f"{where}: missing description")
        if agent.get("mode") not in ("primary", "subagent"):
            fail(f"{where}: mode must be primary or subagent")
        if not isinstance(agent.get("permission"), dict):
            fail(f"{where}: permission must be an object (not a list)")
        match = re.fullmatch(r"\{file:(.+)\}", str(agent.get("prompt", "")))
        if not match:
            fail(f"{where}: prompt must be {{file:path}}")
        elif not (config_path.parent / match.group(1)).exists():
            fail(f"{where}: prompt file {match.group(1)} does not exist")
    if set(agents) != claude_agents:
        fail(f"agents differ between opencode.jsonc {sorted(agents)} and .claude/agents {sorted(claude_agents)}")

    legacy = ROOT / ".opencode/agents"
    if legacy.exists() and any(legacy.glob("*.md")):
        fail(".opencode/agents/*.md would load the agents twice (or be skipped); define them in opencode.jsonc")


def check_references(skills: set[str]) -> None:
    files = [ROOT / "AGENTS.md", ROOT / "CLAUDE.md", *sorted((ROOT / ".opencode/prompts").glob("*.md")), *sorted((ROOT / ".claude/agents").glob("*.md"))]
    pattern = re.compile(r"skill\s+`([a-z0-9-]+)`|`([a-z0-9-]+)`\s+skill")
    for path in files:
        if not path.exists():
            continue
        mentioned = {m.group(1) or m.group(2) for m in pattern.finditer(path.read_text(encoding="utf-8"))}
        for skill in sorted(mentioned - skills):
            fail(f"{path.relative_to(ROOT)}: refers to skill `{skill}`, which does not exist in .claude/skills/")


def check_entrypoints() -> None:
    if not (ROOT / "AGENTS.md").exists():
        fail("AGENTS.md is missing")
    claude = ROOT / "CLAUDE.md"
    if not claude.exists() or "@AGENTS.md" not in claude.read_text(encoding="utf-8"):
        fail("CLAUDE.md must import AGENTS.md with @AGENTS.md")
    memory = ROOT / "MEMORY.md"
    if memory.exists():
        lines = len(memory.read_text(encoding="utf-8").splitlines())
        if lines > MAX_MEMORY_LINES:
            fail(f"MEMORY.md has {lines} lines (maximum {MAX_MEMORY_LINES}): prune it")
    else:
        fail("MEMORY.md is missing")


def main() -> int:
    skills = check_skills()
    claude_agents = check_claude_agents(skills)
    check_opencode(claude_agents)
    check_references(skills)
    check_entrypoints()
    if errors:
        for message in errors:
            print(f"ERROR  {message}")
        print(f"\n{len(errors)} problem(s) in the agent harness.")
        return 1
    print(f"OK  {len(skills)} skills, {len(claude_agents)} agents (OpenCode and Claude Code in sync), memory and references fine.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
