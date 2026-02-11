export default function PurchasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Purchasing is outside the dashboard, so this page remains publicly accessible.
  // Sensitive mutations are still guarded at API level.
  return <>{children}</>
}
