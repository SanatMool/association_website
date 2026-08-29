/**
 * Persists whether the last email to a given record's address succeeded or
 * failed, so admins can see "this email has a problem" in the relevant list
 * instead of the failure only ever reaching a server console log.
 *
 * `update` should be a closure over the specific Prisma model/id, e.g.
 *   (data) => prisma.ticketRegistration.update({ where: { id }, data })
 */
export async function recordEmailResult(
  update: (data: { emailFailedAt: Date | null; emailError: string | null }) => Promise<unknown>,
  error: unknown,
): Promise<void> {
  try {
    if (error) {
      await update({
        emailFailedAt: new Date(),
        emailError: error instanceof Error ? error.message : String(error),
      });
    } else {
      await update({ emailFailedAt: null, emailError: null });
    }
  } catch (updateErr) {
    // Never let flag-tracking itself break the caller — this is best-effort bookkeeping.
    console.error("[emailFailureTracking] failed to persist email status:", updateErr);
  }
}
