# Import notes

## Formats we accept

Two, and they arrived from different partners at different times.

**CSV.** Header row, comma separated, quoted fields where a value contains a
comma. Dates are ISO. Missing optional columns are allowed.

**Fixed width.** No header. Column positions come from a layout file the partner
ships separately, and the layout has changed twice in three years without
warning.

## How we are building them, decided in June

We considered pulling the shared parts out first, since both importers read a
file, validate rows, and write to the same table.

**We are not doing that.** Both get built out separately and fully, and stay
separate until each one works end to end against real partner files. Only then
do we look at what is genuinely common.

The reason is the layout file. Fixed width has a moving external contract that
CSV does not have, and the last time this team abstracted over two parsers before
one of them was finished, the abstraction encoded assumptions from the finished
one and the second parser fought it for a quarter.

**This is settled.** It is not a preference about code structure, it is a
sequencing decision made because of what the fixed width contract does. Reopening
it needs a new fact about that contract, not a tidier design.

## What done means for each

- Reads a real partner file end to end
- Rejects a malformed row with the row number
- Writes to the staging table
- Has a test built from a real file, trimmed
