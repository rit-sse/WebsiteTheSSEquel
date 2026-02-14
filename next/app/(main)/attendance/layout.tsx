export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Attendance is outside the dashboard, so this page remains publicly accessible.
  // Any privileged actions are still enforced by protected APIs.
  return <>{children}</>
}
