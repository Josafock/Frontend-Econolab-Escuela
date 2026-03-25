import { redirect } from "next/navigation";

export default function DatabaseMonitoringPage() {
  redirect("/admin/database?tab=monitorizacion");
}
