# Event operations commands

Every command accepts `--json`. Changes require `--actor="Operator name"`. Flags use `--name=value`. Run reads before making a change. Dates use YYYY-MM-DD; session timestamps require a UTC offset. `help` shows all supported flags.

## events

`npm run events -- events`

## registrations

`npm run events -- registrations`

## sessions

`npm run events -- sessions`

## waitlist

`npm run events -- waitlist`

## speaker-chase

`npm run events -- speaker-chase`

## sponsor-chase

`npm run events -- sponsor-chase`

## run-sheet

`npm run events -- run-sheet`

## attention

`npm run events -- attention`

## compliance

`npm run events -- compliance`

## retention

`npm run events -- retention`

## attendance

`npm run events -- attendance`

## organisations

`npm run events -- organisations`

## activity

`npm run events -- activity`

## event

`npm run events -- event --event`

## weekly-review

`npm run events -- weekly-review`

## add-event

`npm run events -- add-event --code --name --start --end --venue --capacity --owner --timezone --actor`

## add-session

`npm run events -- add-session --event --name --room --start --end --capacity --speaker --actor`

## add-speaker

`npm run events -- add-speaker --event --name --owner --due --actor`

## register

`npm run events -- register --event --name --email --company --status --actor`

## confirm

`npm run events -- confirm --event --person --actor`

## cancel

`npm run events -- cancel --event --person --actor`

## allocate

`npm run events -- allocate --event --person --session --actor`

## unallocate

`npm run events -- unallocate --event --person --session --actor`

## check-in

`npm run events -- check-in --event --person --actor`

## receive-brief

`npm run events -- receive-brief --event --speaker --actor`

## add-deliverable

`npm run events -- add-deliverable --event --sponsor --item --owner --due --actor`

## complete-deliverable

`npm run events -- complete-deliverable --event --deliverable --evidence --actor`

## privacy-review

`npm run events -- privacy-review --event --person --notice --retention --actor`

## event-review

`npm run events -- event-review --event --notice --security-date --actor`

## log

`npm run events -- log --event --note --actor`

## draft-brief

`npm run events -- draft-brief --event`

## import

`npm run events -- import --event --file --mapping --dry-run --actor`

Add the positional source name: `import swoogo`. Read [the mapping guide](replace-swoogo.md).

## export

`npm run events -- export --out`

## help

`npm run events -- help`

