import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}
