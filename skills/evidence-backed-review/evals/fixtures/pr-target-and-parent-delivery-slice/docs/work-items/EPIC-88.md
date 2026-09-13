# EPIC-88 Export jobs

## Acceptance criteria
1. A user can create an export job. (TASK-412, this delivery)
2. A worker processes a queued job. (TASK-413, later)
3. A user can download a finished export. (TASK-414, later)

## Constraints that apply to every delivery
- A job record must not keep the requester email address for more than 30 days.
- Requester identity must never be written to application logs.
- Job identifiers must be unguessable, because the download link is emailed.
