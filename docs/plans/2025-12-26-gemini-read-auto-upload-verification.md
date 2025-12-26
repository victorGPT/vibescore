# Gemini Read + Auto Upload Verification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify Gemini token usage ingestion and auto upload via notify hook.

**Architecture:** Use existing tracker pipeline: discover Gemini session files -> parse token deltas -> enqueue UTC half-hour buckets -> auto upload triggered by notify hook running `sync --auto`.

**Tech Stack:** Node.js CLI (`bin/tracker.js`), local filesystem (`~/.gemini`, `~/.vibescore`).

### Task 1: Verify Gemini session discovery + parsing (isolated HOME)

**Files:**
- Modify: none
- Test: command-based verification

**Step 1: Run isolated sync to generate queue**

```bash
HOME="$(mktemp -d)" GEMINI_HOME="/Users/victor/.gemini" node bin/tracker.js sync
```

Expected: `Parsed files: >0` and `New 30-min buckets queued: >0`.

**Step 2: Validate queue contains gemini entries**

```bash
rg -n "\\\"source\\\":\\\"gemini\\\"" "$HOME/.vibescore/tracker/queue.jsonl" | head -n 3
```

Expected: at least one line with `"source":"gemini"`.

**Step 3: Record evidence**

Capture the first matching queue line and the sync summary output.

**Step 4: Commit**

No code changes; skip.

### Task 2: Verify notify hook triggers auto sync + upload

**Files:**
- Modify: none
- Test: command-based verification

**Step 1: Backup upload throttle file**

```bash
throttle=~/.vibescore/tracker/upload.throttle.json
backup=~/.vibescore/tracker/upload.throttle.json.bak.$(date +%s)
if [ -f "$throttle" ]; then cp "$throttle" "$backup"; fi
```

**Step 2: Reset throttle to allow immediate upload**

```bash
cat > "$throttle" <<'JSON'
{"version":1,"lastSuccessMs":0,"nextAllowedAtMs":0,"backoffUntilMs":0,"backoffStep":0,"lastErrorAt":null,"lastError":null,"updatedAt":null}
JSON
```

**Step 3: Trigger notify hook**

```bash
~/.vibescore/bin/notify.cjs --source=codex
sleep 3
node bin/tracker.js status
```

Expected: `Last notify` and `Last notify-triggered sync` updated to current time; `Last upload` updated if pending bytes > 0.

**Step 4: Validate queue/upload state**

```bash
node bin/tracker.js status
```

Expected: `Queue: ... bytes pending` decreases or `Last upload` changes to current time.

**Step 5: Restore throttle file**

```bash
if [ -f "$backup" ]; then mv "$backup" "$throttle"; fi
```

**Step 6: Commit**

No code changes; skip.

### Task 3: Report results

**Files:**
- Modify: none

**Step 1: Summarize evidence**

Report: gemini queue entries found, notify hook fired, auto upload attempt observed (timestamps/queue size).

**Step 2: Commit**

No code changes; skip.
