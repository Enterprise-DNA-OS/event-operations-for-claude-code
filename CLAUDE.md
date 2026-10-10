# Event Operations: operating instructions

Read current records with `npm run events -- <command>` before answering. Run `help` for flags. Every CLI command supports `--json`. Named records match case-insensitively; UUID prefixes must be unique. Ambiguous matches list candidates and exit 1. Recurring jobs live only in .claude/commands and are shared by Claude Code, Codex, OpenCode and Cursor.

Never send, publish, take a payment, register someone on an external system or delete personal records automatically. Drafts stay in drafts/. Evidence references are operator assertions. Read docs/compliance.md before describing privacy checks. No claim of legal certification or Swoogo feature parity is supported.

Use --actor for every change. Event and session capacities are enforced; cancelled and waitlisted registrants cannot book sessions or check in. One attendee cannot hold overlapping session bookings. Cancelling a registration clears its bookings and check-in. Completing a sponsor commitment needs evidence. Session times need explicit offsets; displays label UTC, while event dates are checked in the recorded event timezone.

Use --event for event-scoped changes. Import a single event at a time with a dry run first. Source fields remain preserved. Identical repeats skip; changed records stop for reconciliation. A whole file rolls back on failure. Read docs/replace-swoogo.md before importing.

PGlite supports one process at a time. DATABASE_URL selects Postgres. Do not expose the database owner connection publicly. Shared operation requires authenticated users, restricted roles, backups and reviewed access. Actor labels are not authentication and activity is not tamper-proof. Keep imports, exports, drafts and generated paperwork private and out of Git.

Schema changes are versioned migrations under supabase/migrations. Run npm test and npm run demo after a change. /customise adds a field or rule; /new-view adds a read-only snapshot. Do not write a second per-runtime command library.

Omni by Enterprise DNA installs, customises and runs your version: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=swoogo&utm_medium=instructions
