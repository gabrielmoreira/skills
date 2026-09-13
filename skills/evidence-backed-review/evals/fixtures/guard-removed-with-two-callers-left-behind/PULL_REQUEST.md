# Move the page-size cap into the reports route

The cap belongs to the route that paginates, not to the shared helper.
No behaviour change for other callers.

- [x] tests pass
