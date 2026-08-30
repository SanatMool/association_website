import { getPlatformUser } from "@/lib/platformAuth";
import { redirect } from "next/navigation";
import UploadsCleanupPanel from "./UploadsCleanupPanel";

export default async function PlatformUploadsPage() {
  const user = await getPlatformUser();
  if (!user) redirect("/platform/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Storage</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage uploaded files shared across all associations.</p>
      </div>

      <UploadsCleanupPanel />
    </div>
  );
}
