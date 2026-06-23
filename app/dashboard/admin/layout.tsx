import AdminSidebar from "@/components/dashboard/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-8 bg-slate-50">
        {children}
      </main>
    </div>
  );
}