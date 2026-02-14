# Retrospectives (Progressive Disclosure)

This folder is structured for **fast triage first, deep reading only when needed**.

## Structure

- `docs/retrospective/_index.md`
  - Global card index (L1).
  - Use this first to filter by repo, layer, module, and severity.
- `docs/retrospective/<repo>/_index.md`
  - Repo-local index (L1).
- `docs/retrospective/<repo>/<date>-<slug>.md`
  - Full postmortem (L2 + L3).
- `docs/retrospective/TEMPLATE.md`
  - Required template for new retros.

## Progressive Disclosure Levels

### L1 — Card (30s)
One-line metadata card in `_index.md`:
- repo
- layer (`frontend` | `backend` | `fullstack` | `infra`)
- module
- severity (`S1..S4`)
- design mismatch (`yes|no`)
- detection gap (`yes|no`)
- short summary

### L2 — Brief (2 min)
Inside each postmortem:
- What happened
- Why design mismatched reality
- Why it was not detected
- What fixed it
- Reuse guidance (which modules should read this)

### L3 — Full Detail (10+ min)
Timeline, evidence, root causes, action items, prevention rules, follow-up.

## Mandatory Metadata (top of each postmortem)

```yaml
repo: <repo>
layer: <frontend|backend|fullstack|infra>
module: <module-name>
severity: <S1|S2|S3|S4>
design_mismatch: <yes|no>
detection_gap: <yes|no>
reusable_for:
  - <module-a>
  - <module-b>
owner: <name>
status: <open|mitigated|closed>
```

## Reading Order Rule

Never read all retros blindly.

1. Filter in `_index.md` by **repo + layer + module**.
2. Read L2 brief only for matching candidates.
3. Open L3 full detail only if action/risk overlaps with current task.
