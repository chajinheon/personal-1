"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";

// Interfaces matching actual Firestore schema
interface AttendanceLog {
  id: string;
  studentId: string;
  entryType: "checkin" | "checkout"; // actual field in Firestore
  dateStr?: string; // computed from timestamp
  timestamp: Timestamp;
  studyDuration?: number | string;
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
    if (!studentIdStr) { setLoading(false); return; }

    console.log("[History] Fetching logs for studentId:", studentIdStr);

    // Query by string studentId only
    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "==", studentIdStr)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("[History] Total docs from Firestore:", snapshot.docs.length);

        const allLogs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          // Compute dateStr from timestamp (no separate date field in DB)
          const ts: Timestamp = data.timestamp;
          const dateObj = ts?.toDate ? ts.toDate() : new Date();
          const y = dateObj.getFullYear();
          const mo = String(dateObj.getMonth() + 1).padStart(2, "0");
          const d = String(dateObj.getDate()).padStart(2, "0");
          return {
            id: docSnap.id,
            ...(data as Omit<AttendanceLog, "id" | "dateStr">),
            dateStr: `${y}-${mo}-${d}`,
          };
        });

        const grouped: Record<string, GroupedLog> = {};
        allLogs.forEach((log) => {
          const date = log.dateStr || "unknown";
          if (!grouped[date]) {
            grouped[date] = { date, in: null, out: null, duration: 0 };
          }
          // entryType is "checkin"/"checkout" in actual Firestore
          if (log.entryType === "checkin") grouped[date].in = log;
          if (log.entryType === "checkout") grouped[date].out = log;
          const dur = typeof log.studyDuration === "number" ? log.studyDuration : 0;
          if (dur) grouped[date].duration += dur;
        });

        const sorted = Object.values(grouped).sort((a, b) =>
          b.date.localeCompare(a.date)
        );

        setLogs(sorted);
        setLoading(false);
      },
      (error) => {
        console.error("[History] Firestore error:", error.code, error.message);
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

  const totalStudyMinutes = logs.reduce((acc, curr) => acc + curr.duration, 0);

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
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-screen-2xl mx-auto w-full space-y-8">
          <div className="bg-inverse-surface text-inverse-on-surface p-10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-end gap-8 shadow-xl">
            <div>
              <p className="font-label text-xs uppercase tracking-[0.3em] opacity-60 mb-3 font-black">Archive Statistics</p>
              <h2 className="font-headline text-5xl font-bold tracking-tight">학습 아카이브</h2>
              <p className="mt-4 opacity-70 font-body max-w-md">지금까지 쌓아온 소중한 학습의 기록들입니다. 꾸준함이 당신의 가장 큰 무기입니다.</p>
            </div>
            <div className="flex gap-12">
              <div className="text-center md:text-left">
                <p className="font-label text-[10px] uppercase tracking-widest opacity-50 mb-2 font-bold">총 세션</p>
                <p className="font-headline text-4xl font-bold">{logs.length}<span className="text-sm ml-1 opacity-60">회</span></p>
              </div>
              <div className="text-center md:text-left border-l border-white/10 pl-12">
                <p className="font-label text-[10px] uppercase tracking-widest opacity-50 mb-2 font-bold">누적 시간</p>
                <p className="font-headline text-4xl font-bold">{Math.floor(totalStudyMinutes / 60)}<span className="text-sm ml-1 opacity-60">h</span></p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary">filter_list</span>
                <div className="flex bg-surface-container-low p-1 rounded-xl">
                  {["전체", "출석", "미퇴실", "미출석"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-6 py-2 rounded-lg text-xs font-label font-black transition-all ${filterStatus === status ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-primary"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Showing {filteredLogs.length} records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-left font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">
                    <th className="px-6 pb-2">학습 날짜</th>
                    <th className="px-6 pb-2">출결 상태</th>
                    <th className="px-6 pb-2">입실</th>
                    <th className="px-6 pb-2">퇴실</th>
                    <th className="px-6 pb-2 text-right">학습 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((day) => (
                    <tr key={day.date} className="group bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-5 rounded-l-2xl font-body font-bold text-on-surface group-hover:text-primary transition-colors">
                        {day.date}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={getStatus(day)} />
                      </td>
                      <td className="px-6 py-5 font-headline text-lg text-on-surface-variant">
                        {formatLogTime(day.in)}
                      </td>
                      <td className="px-6 py-5 font-headline text-lg text-on-surface-variant">
                        {formatLogTime(day.out)}
                      </td>
                      <td className="px-6 py-5 rounded-r-2xl text-right font-headline text-2xl font-bold text-primary">
                        {Math.floor(day.duration / 60)}h {day.duration % 60}m
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-4 block">folder_off</span>
                        <p className="font-body text-on-surface-variant font-medium">검색 결과가 없습니다.</p>
                      </td>
                    </tr>
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    "출석": "bg-primary/10 text-primary border-primary/20",
    "미퇴실": "bg-secondary/10 text-secondary border-secondary/20",
    "미출석": "bg-stone-100 text-stone-400 border-stone-200",
  }[status as "출석" | "미퇴실" | "미출석"];

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-label font-black uppercase border ${styles}`}>
      {status}
    </span>
  );
}

