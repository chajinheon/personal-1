"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDate } from "./DateProvider";
import { useAuth } from "./AuthProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedDate, setSelectedDate } = useDate();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  React.useEffect(() => {
    setMounted(true);
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  if (!mounted) return null;

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const renderCalendarDays = () => {
    const totalDays = daysInMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    const firstDay = startDayOfMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    const cells = [];

    // Previous month trailing days
    const prevMonthDays = daysInMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(
        <div key={`prev-${i}`} className="py-1 text-on-surface-variant opacity-40 text-center text-[10px]">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const selected = isSelected(d);
      const today = isToday(d);
      cells.push(
        <div
          key={d}
          onClick={() =>
            setSelectedDate(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                d
              )
            )
          }
          className={`py-1 text-center text-[10px] cursor-pointer rounded-lg transition-all duration-300 ${
            selected
              ? "text-on-primary bg-primary font-bold shadow-sm"
              : today
              ? "text-primary font-bold bg-primary/10"
              : "text-on-surface hover:bg-surface-container-high"
          }`}
        >
          {d}
        </div>
      );
    }

    return cells;
  };

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 rounded-r-[2rem] bg-surface-container-low p-8 space-y-8 z-50 overflow-y-auto border-r border-outline-variant/10">
      {/* Brand */}
      <div>
        <div className="font-headline font-semibold italic text-2xl text-primary mb-10 tracking-tight">
          Evergreen Academy
        </div>

        {/* Profile */}
        <div className="flex items-center space-x-4 mb-10 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-2xl">
                person
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-headline font-bold text-base text-on-surface truncate">
              {user?.displayName || "Student"}
            </h2>
            <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest font-black truncate">
              {user?.email?.split("@")[0] || "ID"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 space-y-3">
        <NavItem
          href="/dashboard"
          icon="dashboard"
          label="Overview"
          active={pathname === "/dashboard"}
        />
        <NavItem
          href="/history"
          icon="history"
          label="History"
          active={pathname === "/history"}
        />
        <NavItem
          href="#"
          icon="auto_stories"
          label="Curriculum"
          active={false}
        />
        <NavItem
          href="#"
          icon="insights"
          label="Analytics"
          active={false}
        />
      </div>

      {/* Mini Calendar */}
      <div className="mt-auto pt-8 border-t border-outline-variant/10 space-y-8">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-headline font-bold text-on-surface text-xs tracking-tight">
              {monthNames[currentMonth.getMonth()]}{" "}
              {currentMonth.getFullYear()}
            </h4>
            <div className="flex space-x-1">
              <button
                onClick={handlePrevMonth}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-xs">
                  chevron_left
                </span>
              </button>
              <button
                onClick={handleNextMonth}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
              <div
                key={d}
                className="text-[8px] font-label text-on-surface-variant/60 uppercase font-black"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-body">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Help Center */}
        <div className="pb-4">
          <a
            className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 transition-all duration-300 rounded-xl"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">help_outline</span>
            <span className="font-label uppercase font-black text-[10px] tracking-widest">
              Support
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 ease-in-out ${
        active
          ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]"
          : "text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 transition-all duration-300"
      }`}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="font-label uppercase font-black text-xs tracking-[0.1em]">{label}</span>
    </Link>
  );
}

