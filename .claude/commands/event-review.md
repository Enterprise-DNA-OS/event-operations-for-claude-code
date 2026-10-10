# event-review

Read the event and affected records first. Use event-review for the requested internal change, supply the operator as --actor, then reread the affected records. Stop on ambiguity or validation failure; never bypass the check.

Use the single CLI:

`npm run events -- event-review`

Supported flags: --event --notice --security-date --actor. Flags take values as --name=value except --json and --dry-run. Read docs/cli.md and help for the complete interface.

State what the current records show, with names and dates. Drafts stay local. Never send, publish or take a payment.
