import StudentSidebar from "@/components/StudentSidebar";
import StudentMobileNav from "@/components/StudentMobileNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <StudentSidebar />
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen relative z-10 pb-20 md:pb-0">
        {children}
      </main>
      <StudentMobileNav />
    </div>
  );
}
