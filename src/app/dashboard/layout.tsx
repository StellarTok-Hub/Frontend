import { Navbar } from '@/components/Navbar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardGate } from '@/components/DashboardGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <DashboardGate>
        <div className="mx-auto flex w-full max-w-6xl flex-1">
          <DashboardSidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </DashboardGate>
    </div>
  );
}
