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
    { name: "Dashboard", href: "/student/overview", icon: "dashboard" },
    { name: "Attendance History", href: "/student/history", icon: "history" },
  ];

  // Mini Calendar Logic
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // For simplicity, generate days for current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    
    // Reset hours to compare dates properly
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
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 rounded-r-[2rem] bg-surface-container-low p-6 z-50 overflow-y-auto transition-colors duration-300">
      <div className="px-4 mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-4 shadow-sm border border-outline-variant/15">
          <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
        </div>
        <h1 className="text-lg font-headline font-bold text-primary mb-1 italic">The Scholarly Atelier</h1>
        <p className="text-xs font-label text-on-surface-variant uppercase tracking-[0.15em]">Spring Session 2024</p>
      </div>

      <div className="flex-1 space-y-2 mb-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-4 px-6 py-3 transition-all duration-300 ease-in-out ${
                isActive
                  ? "bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-xl shadow-emerald-900/10 active:scale-[0.98]"
                  : "text-on-surface-variant hover:text-primary hover:translate-x-1 rounded-xl"
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {link.icon}
              </span>
              <span className="font-label uppercase font-bold text-sm">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-body font-semibold text-on-surface text-sm">
              {currentYear}년 {currentMonth + 1}월
            </h4>
            <div className="flex space-x-1 text-on-surface-variant">
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[10px] font-label text-on-surface-variant uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-body">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="py-1 text-on-surface-variant opacity-40"></div>
            ))}
            {days.map(day => {
              const isToday = day === today.getDate();
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = activeDate === dateStr || (pathname === '/student/overview' && isToday);
              
              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`py-1 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary text-on-primary font-bold shadow-md"
                      : isToday
                      ? "border border-primary text-primary font-bold"
                      : "text-on-surface hover:bg-surface-variant"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <a className="flex items-center space-x-4 px-6 py-2 text-on-surface-variant hover:text-primary hover:translate-x-1 transition-transform duration-200 rounded-xl cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label uppercase font-bold text-sm">Logout</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
