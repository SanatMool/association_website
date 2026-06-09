import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { redirect, notFound } from "next/navigation";
import AssociationEditForm from "./AssociationEditForm";

export const dynamic = "force-dynamic";

export default async function EditAssociationPage({ params }: { params: { id: string } }) {
  const user = await getPlatformUser();
  if (!user) redirect("/platform/login");

  const association = await prisma.association.findUnique({ where: { id: params.id } });
  if (!association) notFound();

  return (
    <div className="max-w-xl">
      <AssociationEditForm association={association} />
    </div>
  );
}
