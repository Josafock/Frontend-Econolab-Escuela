import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/auth/dal";
import { Sidebar } from "@/components/ui/sidebar";
import Breadcrumbs from "@/components/ui/BreadCrumbs";
import ToastNotification from "@/components/ui/ToastNotification";

export const metadata: Metadata = {
  title: "Prediccion de perdidas - Econolab",
};

export default async function LossPredictionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await verifySession();

  if (user.rol !== "admin") {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar {...user} />
        <main className="min-h-screen overflow-y-auto bg-gray-50 p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <ToastNotification />
    </div>
  );
}
