import DoctorDashboardShell from "./components/DoctorDashboardShell";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DoctorDashboardShell>
      {children}
    </DoctorDashboardShell>
  );
}