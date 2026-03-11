"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteUserButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this admin user? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 size={15} />
    </button>
  );
}
