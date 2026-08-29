import { prisma } from "@/lib/prisma";

// Grace period after an event ends before it's auto-flipped to "past" —
// admins can still edit/re-open an event the same day without a race
// against this job.
const GRACE_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Event.status is set once by EventForm (auto or manual) and never
 * re-derived afterward, so an event left in "upcoming" after it ends stays
 * that way forever on every read path (admin list, public site, portal
 * dashboard) until someone re-saves the form. Call this before reading
 * events on any of those paths to self-heal stale rows.
 *
 * Only ever flips "upcoming" -> "past"; never touches other status values
 * or events an admin has already marked "past".
 */
export async function autoArchivePastEvents(associationId?: string | null): Promise<void> {
  const cutoff = new Date(Date.now() - GRACE_MS);
  const scope = associationId ? { associationId } : {};

  await prisma.event.updateMany({
    where: { ...scope, status: "upcoming", endDate: { lt: cutoff } },
    data: { status: "past" },
  });
  await prisma.event.updateMany({
    where: { ...scope, status: "upcoming", endDate: null, date: { lt: cutoff } },
    data: { status: "past" },
  });
}
