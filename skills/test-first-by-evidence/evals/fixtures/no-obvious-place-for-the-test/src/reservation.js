export async function reserveSeat(db, showId, seatNumber) {
  const row = await db.query("SELECT held_by FROM seats WHERE show_id = $1 AND number = $2", [showId, seatNumber]);
  if (row?.held_by) return { reserved: false, reason: "taken" };
  await db.query("UPDATE seats SET held_by = $1 WHERE show_id = $2 AND number = $3", ["me", showId, seatNumber]);
  return { reserved: true };
}
