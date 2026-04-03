import { Metadata } from "next";
import { verifySession } from "@/auth/dal";
import ProtectedLayoutShell from "@/components/ui/ProtectedLayoutShell";

export const metadata: Metadata = {
  title: "Pacientes - Econolab",
};

export default async function PacientesLayout({ children }: { children: React.ReactNode }) {
    const { user } = await verifySession();

    return <ProtectedLayoutShell user={user}>{children}</ProtectedLayoutShell>;
}
