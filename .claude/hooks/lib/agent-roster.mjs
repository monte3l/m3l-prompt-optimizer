/**
 * The writer-spoke roster for `guard-readonly-bash.mjs`. This repo has no
 * writer spokes: every agent in `.claude/agents/` is read-only, so the set is
 * empty. It lives here, not in `bin/lib/`, because a plugin root's `bin/` is
 * put on the Bash `PATH`.
 */
export const WRITER_SPOKES = new Set();
