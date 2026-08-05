# 🤖 AGENT.md — start here, agent

> **Point any agent (Claude / Codex / Gemini / a dev-through-an-agent) at this file and it can start
> developing.** This is the onboarding contract for **mac-studio-ai-server-kit**. Keep it current — it's the first
> thing an incoming agent reads. Human teammates: this doubles as the repo's quickstart.

## 1 · What this repo is
<One paragraph: what it does, who it's for, why it exists. No jargon.>

## 2 · What you're working on (current focus)
<The active goal — the next thing to build. This is the "get rolling" section.>
- **Now:** <the current objective / the branch>
- **Task board / open items:** <link or command, e.g. `docs/…-HANDOFF.md`, an issue tracker, a board>
- **Latest context:** <link to a handoff/status doc so you don't re-derive anything>

## 3 · How to work here (the rules — non-negotiable)
- Branch off `<main>`, work in a worktree, open a PR — **never commit to `<protected>` directly.**
- **Never commit secrets.** They live in `<where, e.g. ~/.ziggy/secrets.env>`, outside the repo.
- **Do not touch:** <control planes / generated files / third-party clones / real user data>.
- Match the surrounding code's style, naming, and comment density.
- Full multi-agent discipline: <link to AGENTS.md or this repo's equivalent>.

## 4 · Run + verify
```
<clone / install>
<how to run it locally>
<how to test / how to confirm a change actually works>
```

## 5 · Who you are (identity & handshake)
- **Declare yourself** on every change: your agent name + one line on what you're doing, in the commit
  trailer (`Co-Authored-By: <you>`) and any run log. Honesty about what you did/verified is the rule.
- **(Emerging) verifiable identity:** signing commits with a per-agent keypair and registering the
  public key is the direction we're heading — start with a declared name; we'll standardize keys as the
  fleet grows. Don't block on it now.

## 6 · Pointers
- **Docs index:** <link>  · **Owner / who to ask:** <name/contact>  · **Related repos:** <links>

<!-- Fill %-status when you touch this: repo maturity, has-agent? which, last reviewed. -->
_Meta: maturity `<early|growing|established>` · agent(s) `<none|which>` · last reviewed `<date>`._
