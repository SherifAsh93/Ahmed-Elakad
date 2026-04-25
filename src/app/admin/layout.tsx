// Admin section has its own layout — no public navbar or footer
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
