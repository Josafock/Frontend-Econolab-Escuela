import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/auth/dal";
import ProtectedLayoutShell from "@/components/ui/ProtectedLayoutShell";

export const metadata: Metadata = {
  title: "Clustering de estudios - Econolab",
};

export default async function StudyClusteringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await verifySession();

  if (user.rol !== "admin") {
    redirect("/home");
  }

  return <ProtectedLayoutShell user={user}>{children}</ProtectedLayoutShell>;
}
