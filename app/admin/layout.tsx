import { ToastProvider } from "@/components/dashboard/toast";
import { AdminAccessProvider } from "@/components/admin/admin-access";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAccessProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AdminAccessProvider>
  );
}
