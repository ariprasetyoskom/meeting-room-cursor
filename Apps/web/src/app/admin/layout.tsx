import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="page-content admin-page">{children}</div>
    </AdminGuard>
  );
}
