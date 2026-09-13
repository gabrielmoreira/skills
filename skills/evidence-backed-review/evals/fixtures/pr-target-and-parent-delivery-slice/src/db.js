// Pre-existing storage helper. Rows are kept until something deletes them:
// no expiry, no retention window, no scheduled sweep exists here.
const rows = new Map();

export const db = {
  jobs: {
    async insert(row) { rows.set(row.id, row); return row; },
    async find(id) { return rows.get(id) ?? null; },
  },
};
