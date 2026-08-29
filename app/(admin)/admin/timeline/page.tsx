import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import TimelineClient from "./TimelineClient";

export const metadata = { title: "Timeline — Admin" };

export default async function TimelinePage() {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) redirect("/admin/login");

  const entries = await prisma.timelineEntry.findMany({
    where: { associationId: ctx.associationId },
    orderBy: [{ order: "asc" }, { year: "asc" }],
  });

  const rows = entries.map((e) => ({
    id: e.id,
    year: e.year,
    title: e.title,
    titleNe: e.titleNe,
    description: e.description,
    descriptionNe: e.descriptionNe,
    stat: e.stat,
    highlighted: e.highlighted,
    order: e.order,
  }));

  return <TimelineClient initialEntries={rows} />;
}
