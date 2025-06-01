
import { AppHeader } from "@/components/editor/app-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <AppHeader /> {/* Using AppHeader without device-specific props */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
