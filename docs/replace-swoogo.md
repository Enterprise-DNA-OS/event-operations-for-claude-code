# Bring your Swoogo registration records across

Use a fresh database without the fictional demo seed. Export one event's Invitation & Registration report as CSV. Include registrant ID, first name, last name, email, company, registration status and event ID where available. [Vendor confirmation of CSV export](https://swoogo.events/product-updates/track-whats-changed-in-your-invitation-registration-report/). [Documented registrant fields](https://swoogo.readme.io/reference/getallregistrants). Checked 10 October 2026.

```bash
npm run migrate
npm run events -- add-event --code=FORUM --name="Partner Forum" --start=2027-03-01 --end=2027-03-01 --venue="Wellington" --capacity=200 --owner="Event manager" --actor="Migration operator"
npm run events -- import swoogo --event=FORUM --file=imports/registrants.csv --actor="Migration operator" --dry-run
npm run events -- import swoogo --event=FORUM --file=imports/registrants.csv --actor="Migration operator"
```

The final command imports the registration records in one transaction. Use `--json` for a machine-readable result. Compare counts and exceptions before cutover. A capacity error rolls back every row; choose capacity from the real event plan, not a guess.

| Record | Mapping |
|---|---|
| Identity | id / Registrant ID / Registration ID becomes source_id; local UUID stays separate |
| Name | first_name / First Name and last_name / Last Name |
| Contact | email / Email / Email Address, company / Company |
| Status | confirmed or complete becomes confirmed; waitlist or waitlisted becomes waitlisted; cancelled or canceled becomes cancelled; incomplete stays incomplete |
| Event | event_id / Event ID binds the first import to the local event; mixed files and later source-event mismatches are rejected |
| Other fields | Preserved verbatim in source_data, including custom answers; never silently treated as verified facts |

Unknown or missing statuses fail. Empty IDs, malformed emails, repeated IDs, repeated email addresses, bad CSV and changed source records fail the whole file. Existing local work is never overwritten by reimport. Identical repeats are skipped. One email per event is a deliberate base constraint; grouped registrations sharing an email require a reviewed migration before import.

For renamed headings, supply `--mapping=imports/mapping.json`, for example `{"id":"Registration number","first":"Given name","status":"Status"}`. Supported keys: id, first, last, email, company, status, event. Source JSON is preserved, so check it for sensitive information before retaining an import.

Sessions, speakers, sponsor commitments, attachments, historical check-ins, group bookings, payments, campaign history, logins and integrations are not reconstructed from this registration file. Map and reconcile their separate exports with Enterprise DNA or through `/customise`. Never infer consent, paid status or a session booking from a blank column. Review imported notice and retention records through `/compliance` before business use.

Run `export --out=exports/event-records.json` for all seven record sets. It is an interchange snapshot, not a restore command. Use database backups plus an independently tested restore procedure. Retain the incumbent service until your operators have reconciled the event plan and rehearsed the work they need.
