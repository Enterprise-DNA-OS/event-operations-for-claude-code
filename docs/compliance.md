# Record checks and their sources

Checked 10 October 2026. These checks support a New Zealand event organiser's records. They are prompts for an operator to review evidence and applicability, not legal determinations or certification. Australian deployments need their own rules review before use.

| Check | Meaning | Source |
|---|---|---|
| Event notice missing | Record the notice used and check what registrants were told about collection and use. A reference does not prove delivery. | [NZ Privacy Principle 3](https://www.privacy.org.nz/privacy-principles/3/) |
| Imported notice review missing | Decide whether information was collected indirectly, whether IPP 3A applies and whether an exception applies. Record the reason. Importing your own existing records is not automatically a new indirect collection. | [NZ Privacy Principle 3A](https://www.privacy.org.nz/privacy-principles/3a/) |
| Security review missing or stale | Record an assessment of access controls, sharing, backups and safeguards. The 90-day reminder is local policy, not a statutory deadline. | [NZ Privacy Principle 5](https://www.privacy.org.nz/privacy-principles/5/) |
| Retention review absent or due | Decide whether a lawful purpose still justifies retaining the record. The review date is an operator choice, not a legal retention period. No automatic deletion runs. | [NZ Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) |

Run `npm run events -- compliance`. Use `event-review` and `privacy-review` to record evidence. A completed check means a record exists, not that a lawyer has approved it. IPP 3A took effect on 1 May 2026. This application sends no notices and files no statutory reports.

Attendance sheets omit email addresses; internal registration reads and full exports contain personal information. Limit access to the database and generated files. Import originals, source_data, exports, backups and drafts all need retention decisions. References to evidence must point to private storage, never to committed customer documents.

Local PGlite is a single-operator tool. A shared Postgres deployment requires authenticated operators and restricted roles. The schema is private by default and has row security without public policies. The owner connection is powerful and must never be put behind a public unauthenticated endpoint. Actor labels are assertions, not authentication. Activity is change history, not tamper-proof evidence.
