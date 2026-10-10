# complete-deliverable

Read the event and affected records first. Use complete-deliverable for the requested internal change, supply the operator as --actor, then reread the affected records. Stop on ambiguity or validation failure; never bypass the check.

Use the single CLI:

`npm run events -- complete-deliverable`

Supported flags: --event --deliverable --evidence --actor. Flags take values as --name=value except --json and --dry-run. Read docs/cli.md and help for the complete interface.

State what the current records show, with names and dates. Drafts stay local. Never send, publish or take a payment.
