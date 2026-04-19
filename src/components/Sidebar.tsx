"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDate } from "./DateProvider";
import { useAuth } from "./AuthProvider";
import { motion } from "motion/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedDate, setSelectedDate } = useDate();
  const { user } = useAuth();
  
  // Calendar logic
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const renderDays = () => {
    const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const firstDay = startDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const days = [];

    // Empty spaces for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="py-2"></div>);
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const active = isSelected(d);
      days.push(
        <div
          key={d}
          onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
          className={`py-1.5 text-sm cursor-pointer rounded-full transition-all flex items-center justify-center w-8 h-8 mx-auto ${
            active 
              ? "bg-primary text-white font-bold shadow-md shadow-primary/20" 
              : isToday(d)
                ? "text-primary font-bold border border-primary/20"
                : "text-on-surface hover:bg-surface-variant"
          }`}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  return (
    <nav className="hidden md:flex flex-col h-screen w-80 bg-surface-container-low border-r border-outline-variant/15 py-10 z-30">
      {/* Header */}
      <div className="px-8 mb-10 flex flex-col items-start">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/10">
          <span className="material-symbols-outlined text-2xl text-primary font-bold">account_balance</span>
        </div>
        <h1 className="font-headline text-2xl text-primary font-bold italic">The Atelier</h1>
        <p className="font-label text-[10px] tracking-[0.2em] uppercase font-bold text-on-surface-variant mt-1">Spring Session 2024</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-1">
        <NavLink 
          href="/dashboard" 
          active={pathname === "/dashboard"} 
          icon="dashboard" 
          label="Dashboard" 
        />
        <NavLink 
          href="/history" 
          active={pathname === "/history"} 
          icon="history" 
          label="Attendance History" 
        />
        <NavLink 
          href="#" 
          active={false} 
          icon="menu_book" 
          label="Study Materials" 
        />
        <NavLink 
          href="#" 
          active={false} 
          icon="self_improvement" 
          label="Focus Hub" 
        />
      </div>

      {/* Mini Calendar */}
      <div className="px-6 mb-8 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/15">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-body font-bold text-on-surface text-xs uppercase tracking-wider">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex space-x-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-[10px] font-bold text-on-surface-variant/50">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {renderDays()}
          </div>
        </div>
      </div>

      {/* User / Footer */}
      <div className="px-6 pt-6 border-t border-outline-variant/15">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/50 rounded-2xl mb-4 border border-outline-variant/10">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">{user?.displayName || "Student"}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => {}} 
          className="w-full flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

function NavLink({ href, active, icon, label }: { href: string; active: boolean; icon: string; label: string }) {
  return (
    <Link href={href} className="block">
      <div className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 group ${
        active 
          ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10" 
          : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
      }`}>
        <span className={`material-symbols-outlined text-xl ${active ? "fill" : ""}`} style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
          {icon}
        </span>
        <span className="font-body font-bold text-sm tracking-tight">{label}</span>
      </div>
    </Link>
  );
}
