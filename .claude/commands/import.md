# import

Read docs/replace-swoogo.md. Use import swoogo with --dry-run, reconcile the summary, then apply the same file. Never infer payment or consent.

Use the single CLI:

`npm run events -- import swoogo`

Supported flags: --event --file --mapping --dry-run --actor. Flags take values as --name=value except --json and --dry-run. Read docs/cli.md and help for the complete interface.

State what the current records show, with names and dates. Drafts stay local. Never send, publish or take a payment.
