"use client";

import Image from "next/image";
import { useAuth } from "./AuthProvider";

export default function TopNav({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="flex justify-between items-center w-full px-10 py-6 bg-background/80 backdrop-blur-2xl sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-primary p-2 hover:bg-surface-container-low rounded-full transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-2xl font-headline font-semibold text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <div className="h-10 w-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 ring-primary/20 transition-all">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Profile"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined">person</span>
          )}
        </div>
      </div>
    </header>
  );
}

