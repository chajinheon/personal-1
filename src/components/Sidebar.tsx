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

  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

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
        <div key={`prev-${i}`} className="py-1 text-on-surface-variant opacity-40 text-center text-xs">
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
          className={`py-1 text-center text-xs cursor-pointer rounded transition-colors ${
            selected
              ? "text-on-primary bg-primary font-bold shadow-md"
              : today
              ? "text-primary font-bold"
              : "text-on-surface hover:bg-surface-variant"
          }`}
        >
          {d}
        </div>
      );
    }

    return cells;
  };

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 rounded-r-2xl bg-surface-container-low p-6 space-y-6 z-50 overflow-y-auto">
      {/* Brand */}
      <div>
        <div className="font-headline font-semibold italic text-xl text-primary mb-8">
          Evergreen Academy
        </div>

        {/* Profile */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
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
          <div>
            <h2 className="font-headline font-semibold text-lg text-on-surface">
              {user?.displayName || "Student"}
            </h2>
            <p className="text-sm font-label text-on-surface-variant uppercase font-bold">
              {user?.email?.split("@")[0] || "ID"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 space-y-2">
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
          icon="campaign"
          label="Notices"
          active={false}
        />
        <NavItem
          href="#"
          icon="settings"
          label="Settings"
          active={false}
        />
      </div>

      {/* Mini Calendar */}
      <div className="mt-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-body font-semibold text-on-surface text-sm">
              {monthNames[currentMonth.getMonth()]}{" "}
              {currentMonth.getFullYear()}
            </h4>
            <div className="flex space-x-1 text-on-surface-variant">
              <button
                onClick={handlePrevMonth}
                className="hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              <button
                onClick={handleNextMonth}
                className="hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
              <div
                key={d}
                className="text-[10px] font-label text-on-surface-variant uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-body">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Help Center */}
        <div>
          <a
            className="flex items-center space-x-3 px-4 py-2 text-on-surface-variant hover:bg-surface-variant hover:translate-x-1 transition-transform duration-200 rounded-xl"
            href="#"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span className="font-label uppercase font-bold text-sm">
              Help Center
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
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out ${
        active
          ? "bg-primary text-on-primary shadow-[0_24px_48px_rgba(0,0,0,0.04)]"
          : "text-on-surface-variant hover:bg-surface-variant hover:translate-x-1 transition-transform duration-200"
      }`}
    >
      <span
        className="material-symbols-outlined"
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="font-label uppercase font-bold text-sm">{label}</span>
    </Link>
  );
}
