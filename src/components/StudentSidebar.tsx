"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setActiveDate(new URLSearchParams(window.location.search).get("date"));
  }, []);

  const navLinks = [
    { name: "Curriculum", href: "#", icon: "auto_stories" },
    { name: "Attendance", href: "/student/history", icon: "calendar_check" },
    { name: "Study Atelier", href: "/student/overview", icon: "timer" },
    { name: "Library", href: "#", icon: "local_library" },
    { name: "Analytics", href: "#", icon: "insights" },
  ];

  // Mini Calendar Logic
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (clickedDate.getTime() === todayDateOnly.getTime()) {
      router.push("/student/overview");
    } else if (clickedDate.getTime() < todayDateOnly.getTime()) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      router.push(`/student/summary?date=${dateStr}`);
    }
  };

  if (!mounted) return null;

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 rounded-r-3xl bg-surface-container-low text-primary z-20 py-8 shadow-none transition-all ease-in-out duration-300">
      {/* Header */}
      <div className="px-8 mb-8 flex flex-col items-start">
        <div className="w-12 h-12 rounded-full overflow-hidden mb-4 border-2 border-surface-container-highest">
          <img 
            alt="Evergreen Crest" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW5Z9QxWZ-YzB3aryFh61UIcX6m41GeRkrMr7VVEaQVPNZAvOQs_hdvMb8CCKmfsdpgeS2xGX9eAZQuMtGAuZuJGLJDnROeEIHbVMuh9tSpdsc_4IqMDd_DsylkKBR_o916kG93m8q3Jj_ICc3DHCNX1UGaEWzmVJXXNTWrzf6XG_69LwYpicd_248pbyFXcfRORaJfqcf6lF5oNryHRH0bkw8oTKGOL_T9uDK24uLSo--zTBK18Be4ozvxp3tr2BF7WOdMEz3MA4"
          />
        </div>
        <h1 className="font-headline text-xl text-primary font-semibold italic">The Atelier</h1>
        <p className="font-label text-sm tracking-wide uppercase font-bold text-on-surface-variant mt-1">Academic Year 2024</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 overflow-y-auto w-full px-2">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 py-3 px-4 mx-2 rounded-xl transition-all ${
                    isActive
                      ? "bg-surface-container-lowest text-primary shadow-[0_4px_12px_rgba(27,28,25,0.03)]"
                      : "text-on-surface-variant hover:text-primary hover:translate-x-1"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {link.icon}
                  </span>
                  <span className="font-label text-sm tracking-wide font-bold">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mini Calendar Widget */}
        <div className="mt-8 mx-4 p-4 rounded-xl bg-surface-container-highest/50">
          <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-3 font-bold">Mini Calendar</p>
          <div className="grid grid-cols-7 gap-1 text-center font-body text-xs text-on-surface-variant mb-2">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center font-body text-sm">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="text-outline-variant/30 text-xs"></div>
            ))}
            {days.map(day => {
              const isToday = day === today.getDate();
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = activeDate === dateStr || (pathname === '/student/overview' && isToday);
              
              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`cursor-pointer w-7 h-7 flex items-center justify-center mx-auto transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary rounded-full shadow-sm font-bold"
                      : isToday
                      ? "border border-primary text-primary rounded-full font-bold"
                      : "text-on-surface hover:bg-surface-container-highest rounded-full"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <button className="mt-4 w-full text-center text-xs font-label uppercase tracking-wide text-primary hover:text-primary-container transition-colors">
            View Full Records
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto px-2 pt-4 border-t border-outline-variant/15">
        <ul className="space-y-1">
          <li>
            <a className="flex items-center gap-3 text-on-surface-variant py-2 px-4 mx-2 rounded-xl hover:text-primary transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span className="font-label text-sm tracking-wide font-bold">Support</span>
            </a>
          </li>
          <li>
            <a className="flex items-center gap-3 text-on-surface-variant py-2 px-4 mx-2 rounded-xl hover:text-primary transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="font-label text-sm tracking-wide font-bold">Sign Out</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

