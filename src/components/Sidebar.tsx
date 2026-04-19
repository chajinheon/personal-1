"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/firebase";

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="hidden md:flex flex-col h-screen w-80 rounded-r-[2rem] sticky top-0 bg-surface-container-low transition-colors duration-300 py-10 z-30 overflow-y-auto">
      {/* Header */}
      <div className="px-10 mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-4 shadow-sm border border-outline-variant/15">
          <span className="material-symbols-outlined text-3xl text-primary">account_balance</span>
        </div>
        <h1 className="text-lg font-headline font-bold text-primary mb-1">
          The Scholarly Atelier
        </h1>
        <p className="text-xs font-label text-on-surface-variant uppercase tracking-[0.15em]">
          Spring Session 2024
        </p>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-1 mb-8">
        <Link
          href="/dashboard"
          className={`flex items-center gap-4 px-10 py-3 transition-all ${
            pathname === "/dashboard"
              ? "bg-gradient-to-br from-primary to-primary-container text-white rounded-full mx-6 shadow-xl shadow-emerald-900/10 active:scale-[0.98]"
              : "text-stone-600 hover:text-[#3A5A40] hover:translate-x-1"
          }`}
        >
          <span className={`material-symbols-outlined text-xl ${pathname === "/dashboard" ? "fill" : ""}`}>
            dashboard
          </span>
          <span className="font-body font-semibold text-sm">Dashboard</span>
        </Link>
        <Link
          href="/history"
          className={`flex items-center gap-4 px-10 py-3 transition-all ${
            pathname === "/history"
              ? "bg-gradient-to-br from-primary to-primary-container text-white rounded-full mx-6 shadow-xl shadow-emerald-900/10 active:scale-[0.98]"
              : "text-stone-600 hover:text-[#3A5A40] hover:translate-x-1"
          }`}
        >
          <span className={`material-symbols-outlined text-xl ${pathname === "/history" ? "fill" : ""}`}>
            history
          </span>
          <span className="font-body font-semibold text-sm">Attendance History</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-4 text-stone-600 px-10 py-3 hover:text-[#3A5A40] hover:translate-x-1 transition-transform duration-300"
        >
          <span className="material-symbols-outlined text-xl">menu_book</span>
          <span className="font-body font-semibold text-sm">Study Materials</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-4 text-stone-600 px-10 py-3 hover:text-[#3A5A40] hover:translate-x-1 transition-transform duration-300"
        >
          <span className="material-symbols-outlined text-xl">self_improvement</span>
          <span className="font-body font-semibold text-sm">Focus Hub</span>
        </Link>
      </div>

      {/* Footer Links */}
      <div className="flex flex-col gap-2 mt-auto border-t border-outline-variant/15 pt-6 mx-6">
        <button className="flex items-center gap-4 text-stone-600 px-4 py-2 hover:text-[#3A5A40] text-sm text-left">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="font-body">Settings</span>
        </button>
        <button onClick={handleLogout} className="flex items-center gap-4 text-stone-600 px-4 py-2 hover:text-[#3A5A40] text-sm text-left">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-body">Logout</span>
        </button>
      </div>
    </nav>
  );
}

