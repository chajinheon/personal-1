"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudentMobileNav() {
  const pathname = usePathname();

  const navLinks = [
    { name: "홈", href: "/student/overview", icon: "home" },
    { name: "요약", href: "/student/summary", icon: "auto_awesome_mosaic" },
    { name: "기록", href: "/student/history", icon: "history" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-around items-center px-2 py-3 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      {navLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors ${isActive ? "bg-primary/10" : ""}`}>
              <span 
                className="material-symbols-outlined text-[24px]" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {link.icon}
              </span>
            </div>
            <span className={`text-[10px] font-label font-bold mt-1 ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
              {link.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
