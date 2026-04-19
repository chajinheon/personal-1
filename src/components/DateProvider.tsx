"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  // Use a fixed date for the initial state to match server and client
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 20)); // April 20, 2026

  useEffect(() => {
    // Update to actual current date only on client side after hydration
    setSelectedDate(new Date());
  }, []);

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useDate must be used within a DateProvider");
  }
  return context;
}
