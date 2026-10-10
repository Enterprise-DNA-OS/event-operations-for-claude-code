# Event Operations for Claude Code

Know which sessions are full, which speaker briefs are late and which sponsor promises still need an owner. Keep the event plan in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT licensed. Try the fictional forum and its weekly review. | Your registration fields, programme rules, paperwork and Swoogo mappings. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=swoogo&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=swoogo&utm_medium=managed) |

For the organiser running conferences, partner briefings and internal forums. Works with Claude Code, Codex, OpenCode or Cursor. This base handles internal operations from imported or staff-entered registrations. Swoogo is a broader event platform with participant websites, mobile tools and integrations. [Scope and sources](docs/research.md).

## Quick start

Node 20 or later on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/event-operations-for-claude-code.git
cd event-operations-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Local PGlite persists under .data/db and supports one process at a time. DATABASE_URL selects Postgres 15 or later. The fictional Harbour forum contains a full session, a waiting registrant, an overdue speaker brief, an overdue sponsor commitment and a stale security review. The Spring briefing has a due retention review. Seed dates are relative to the first run; repeat seeds preserve existing work.

For real records, use a fresh DATA_DIR or database, run migrations without the demo seed, then follow the [switching guide](docs/replace-swoogo.md).

## Five weekly jobs

1. `/waitlist`: review demand and confirm people only when places exist.
2. `/speaker-chase`: collect missing briefs before the programme deadline.
3. `/sponsor-chase`: follow up commitments by owner and due date.
4. `/run-sheet`: check sessions, rooms, speakers and allocations.
5. `/weekly-review`: combine capacity, outstanding work and privacy reviews.

There are 34 CLI commands and 35 slash recipes. Every CLI command accepts --json. `npm run events -- help` lists commands and flags. [Command reference](docs/cli.md).

Names match without case; UUID prefixes must be unique. Ambiguous matches list candidates and exit 1. Every mutation requires an actor. Capacities, attendee overlaps and room or speaker conflicts are checked before a change. Event locks serialize changes in Postgres; the local database is for one process. Cancelling clears session allocations and recorded check-in. Speaker receipt and sponsor completion are explicit actions. Sponsor completion requires an evidence reference.

## Ten questions for your event meeting

These are questions the CLI answers today. Swoogo already offers custom reporting and conversational data access; we do not claim these questions are exclusive to this base.

| Question | Command |
|---|---|
| Which events have waiting attendees and spare places? | events |
| Which sessions have reached capacity? | sessions |
| Who is waiting, and in what order did they register? | waitlist |
| Which speaker briefs are late and who is chasing them? | speaker-chase |
| Which sponsor promises are overdue? | sponsor-chase |
| What is the programme by room and speaker? | run-sheet |
| Which confirmed attendees have a recorded arrival? | attendance |
| Which organisations appear across our events? | organisations |
| Which records need a notice or retention review? | compliance |
| What must we resolve at Monday's event meeting? | weekly-review |

## Your first hour: ten things to ask for

1. Put our name and colours on the event paperwork.
2. Show the sessions with no remaining places.
3. List speaker briefs due before the next event.
4. Find the oldest sponsor promise still open.
5. Draft an internal briefing for the event manager.
6. Test our Swoogo registration export without saving it.
7. Give our imported records a privacy review date.
8. Add a track field through `/customise`.
9. Add a regional event snapshot through `/new-view`.
10. Record an arrival and refresh the attendance sheet.

## Bring your history

```bash
npm run events -- import swoogo --event=YOUR_EVENT --file=imports/registrants.csv --actor="Migration operator" --dry-run
npm run events -- import swoogo --event=YOUR_EVENT --file=imports/registrants.csv --actor="Migration operator"
```

Create the destination event first. One command imports one event's registration report. Source fields are preserved. Identical repeats skip; changes stop for reconciliation. Invalid files roll back completely. Column mappings cover renamed headings. No import infers privacy consent, payments or historical check-ins. Sessions, speakers and sponsor records require separate reconciliation. The included fixture is synthetic. [Mappings and cutover](docs/replace-swoogo.md).

## Paperwork, views and privacy

`npm run docs` writes branded run sheets, speaker checklists, sponsor fulfilment records and internal attendance sheets. `npm run view` writes two read-only reports for the week and programme. Change brand.json once for your business name, logo and colours. Print HTML to PDF from a browser. Generated files remain local and private.

`/compliance` flags missing notices, security review reminders, imported-notice assessments and retention reviews. These are evidence prompts, not compliance certification. [Rules, limits and primary sources](docs/compliance.md). No email, payment, external registration or publication action exists.

`/customise` changes fields and rules through a migration. `/new-view` adds a read-only report. [What a front end gives you](docs/why-no-front-end.md).

## Verification and operation

`npm test` creates a temporary database and exercises every command. It checks capacities, schedule conflicts, cancellations, failed-file rollback, repeat imports, source preservation, CSV edge cases, ambiguous names, exit codes, drafts, exports and escaped HTML. GitHub checks run on Linux and Windows, plus a disposable Postgres database. Use TEST_DATABASE_URL only with a fresh disposable database; tests refuse one containing the application schema.

`export` includes all seven record sets. It is an interchange snapshot, not an automatic restore. Back up the database and referenced evidence separately, and rehearse recovery. Shared operation needs authenticated users, restricted roles and access controls. The database owner connection is never a public service credential. See [operating rules](CLAUDE.md).

MIT licence. Not affiliated with Swoogo or Anthropic. Hosting and agent use have separate costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=swoogo&utm_medium=readme).
