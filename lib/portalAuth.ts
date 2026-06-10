import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export interface PortalUser {
  id: string;          // MemberAccount.id
  memberId: string;
  associationId: string;
  email: string;
  name: string;        // Member.name
}

export async function getPortalUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("member-portal-token")?.value;
  if (!raw) return null;

  try {
    const payload = await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET! });
    if (!payload?.sub) return null;
    return {
      id:            payload.sub,
      memberId:      (payload.memberId      as string) ?? "",
      associationId: (payload.associationId as string) ?? "",
      email:         (payload.email         as string) ?? "",
      name:          (payload.name          as string) ?? "",
    };
  } catch {
    return null;
  }
}
