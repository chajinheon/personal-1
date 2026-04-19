"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";

// Interfaces to eliminate red markers
interface AttendanceLog {
  id: string;
  studentId: string | number;
  type: "IN" | "OUT";
  date: string;
  timestamp: Timestamp;
  studyDuration?: number;
}

interface GroupedLog {
  date: string;
  in: AttendanceLog | null;
  out: AttendanceLog | null;
  duration: number;
}

export default function History() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<GroupedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStudentId = () => {
    if (!user?.email) return "";
    return user.email.split("@")[0];
  };

  useEffect(() => {
    if (!user || !mounted) return;
    setLoading(true);

    const studentIdStr = getStudentId();
    const studentIdNum = parseInt(studentIdStr);

    console.log("History: Fetching logs for studentId:", { studentIdStr, studentIdNum });

    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [studentIdStr, studentIdNum])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<AttendanceLog, "id">),
        }));

        const grouped: Record<string, GroupedLog> = {};
        allLogs.forEach((log) => {
          const date = log.date || "unknown";
          if (!grouped[date]) {
            grouped[date] = { date, in: null, out: null, duration: 0 };
          }
          if (log.type === "IN") grouped[date].in = log;
          if (log.type === "OUT") grouped[date].out = log;
          if (log.studyDuration) grouped[date].duration += log.studyDuration;
        });

        const sorted = Object.values(grouped).sort((a, b) => {
          return b.date.localeCompare(a.date);
        });

        setLogs(sorted);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error (history):", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, mounted]);

  const getStatus = (day: GroupedLog) => {
    if (day.in && day.out) return "출석";
    if (day.in && !day.out) return "미퇴실";
    return "미출석";
  };

  const filteredLogs = logs.filter((day) => {
    if (filterStatus === "전체") return true;
    return getStatus(day) === filterStatus;
  });

  const formatLogTime = (log: AttendanceLog | null) => {
    if (!log?.timestamp) return "--:--";
    try {
      return log.timestamp
        .toDate()
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto border-b border-outline-variant/10">
          <div className="hidden md:flex space-x-6">
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors pb-1 text-sm uppercase font-label" href="/dashboard">Overview</a>
            <a className="text-primary font-bold border-b-2 border-primary pb-1 text-sm uppercase font-label" href="/history">History</a>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center"><span className="material-symbols-outlined text-sm">person</span></div>
          </div>
        </header>

        <div className="p-8 max-w-screen-2xl mx-auto w-full space-y-8">
          <div className="bg-inverse-surface text-inverse-on-surface p-10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-end gap-8 shadow-xl">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-50">Attendance Archive</h3>
              <h2 className="text-5xl font-headline font-bold mb-4 tracking-tight">나의 학습 기록</h2>
              <p className="text-sm max-w-md font-medium leading-relaxed opacity-70">과거의 기록은 미래의 성장을 증명합니다. 선택한 기간 동안의 출석 현황과 총 학습 시간을 확인하세요.</p>
            </div>
            <div className="flex gap-12">
              <div className="text-right">
                <span className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">총 세션 수</span>
                <span className="text-5xl font-headline font-bold tracking-tighter">{logs.length}</span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">누적 학습 시간</span>
                <span className="text-5xl font-headline font-bold tracking-tighter">{Math.floor(logs.reduce((acc, c) => acc + c.duration, 0) / 60)}<span className="text-2xl font-medium opacity-50 ml-1">h</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
               <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Filter by:</span>
               <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                 <option>전체</option>
                 <option>출석</option>
                 <option>미퇴실</option>
                 <option>미출석</option>
               </select>
            </div>
            <button className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95">
              <span className="material-symbols-outlined text-lg">download</span> Export CSV
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                    <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">날짜 (Date)</th>
                    <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">상태 (Status)</th>
                    <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">입실 시간</th>
                    <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">퇴실 시간</th>
                    <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-right">학습량</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5 font-body">
                  {filteredLogs.map((day) => {
                    const status = getStatus(day);
                    return (
                      <tr key={day.date} className="hover:bg-surface-container-low/30 transition-colors group">
                        <td className="py-6 px-8"><div className="font-bold text-on-surface group-hover:text-primary transition-colors">{day.date}</div></td>
                        <td className="py-6 px-8"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === "출석" ? "bg-primary/5 text-primary border-primary/20" : status === "미퇴실" ? "bg-secondary/5 text-secondary border-secondary/20" : "bg-stone-100 text-stone-500 border-stone-200"}`}>{status}</span></td>
                        <td className="py-6 px-8 font-headline text-lg text-on-surface font-medium">{formatLogTime(day.in)}</td>
                        <td className="py-6 px-8 font-headline text-lg text-on-surface font-medium">{formatLogTime(day.out)}</td>
                        <td className="py-6 px-8 text-right font-headline text-2xl text-primary font-bold tracking-tighter">{Math.floor(day.duration / 60)}<span className="text-sm font-medium opacity-50 ml-0.5">h</span> {day.duration % 60}<span className="text-sm font-medium opacity-50 ml-0.5">m</span></td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan={5} className="py-32 text-center text-on-surface-variant font-bold italic opacity-30 tracking-widest text-sm">NO RECORDS FOUND IN THIS CATEGORY.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
