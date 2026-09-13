# Deploy runbook

## Production
A production deploy waits for a manual approval in the `prod` environment.
Two reviewers must approve before the deploy job starts. If a release must go
out without approval, page the on-call owner and record the reason here.

## Rollback
Re-run the previous successful deploy job.
