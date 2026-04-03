import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/auth/dal";
import ProtectedLayoutShell from "@/components/ui/ProtectedLayoutShell";

export const metadata: Metadata = {
  title: "Monitoreo BD - Econolab",
};

export default async function DatabaseMonitoringLayout({
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
