import AppChrome from "@/components/layout/AppChrome";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // Server component that simply wraps children in the client AppChrome
  return <AppChrome>{children}</AppChrome>;
}
