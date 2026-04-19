"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";

export default function History() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("전체");

  const getStudentId = () => {
    if (!user?.email) return "";
    return user.email.split("@")[0];
  };

  useEffect(() => {
    if (!user) return;
    const studentId = getStudentId();

    // Simple query without orderBy
    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "==", studentId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Group by date client-side
        const grouped: Record<string, any> = {};
        allLogs.forEach((log: any) => {
          const date = log.date || "unknown";
          if (!grouped[date]) {
            grouped[date] = { date, in: null, out: null, duration: 0 };
          }
          if (log.type === "IN") grouped[date].in = log;
          if (log.type === "OUT") grouped[date].out = log;
          if (log.studyDuration) grouped[date].duration += log.studyDuration;
        });

        // Sort by date descending
        const sorted = Object.values(grouped).sort((a: any, b: any) => {
          return b.date.localeCompare(a.date);
        });

        setLogs(sorted);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore query error (history):", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getStatus = (day: any) => {
    if (day.in && day.out) return "출석";
    if (day.in && !day.out) return "미퇴실";
    return "미출석";
  };

  const filteredLogs = logs.filter((day) => {
    if (filterStatus === "전체") return true;
    return getStatus(day) === filterStatus;
  });

  const formatLogTime = (log: any) => {
    if (!log?.timestamp?.toDate) return "--:--";
    try {
      return log.timestamp
        .toDate()
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="hidden md:flex space-x-6">
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors pb-1 text-sm uppercase font-label"
              href="/dashboard"
            >
              Overview
            </a>
            <a
              className="text-primary font-bold border-b-2 border-primary pb-1 text-sm uppercase font-label"
              href="/history"
            >
              History
            </a>
          </div>
        </header>

        <div className="p-8 max-w-screen-2xl mx-auto w-full space-y-8">
          {/* Summary */}
          <div className="bg-inverse-surface text-inverse-on-surface p-10 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                전체 통계
              </h3>
              <h2 className="text-4xl font-headline font-semibold mb-4">
                기록 조회
              </h2>
              <p className="text-sm max-w-md font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                선택한 기간의 출석 기록과 학습 시간입니다. 꾸준함은 숙련의
                기초입니다.
              </p>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  총 세션
                </span>
                <span className="text-4xl font-headline font-semibold">
                  {logs.length}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  총 학습 시간
                </span>
                <span className="text-4xl font-headline font-semibold">
                  {Math.floor(
                    logs.reduce((acc, c) => acc + c.duration, 0) / 60
                  )}
                  h
                </span>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex justify-between items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none"
            >
              <option>전체</option>
              <option>출석</option>
              <option>미퇴실</option>
              <option>미출석</option>
            </select>
            <button className="flex items-center gap-2 text-primary px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-all">
              <span className="material-symbols-outlined text-lg">
                download
              </span>
              Export Records
            </button>
          </div>

          {/* History Table */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      날짜
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      상태
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      입실 시간
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      퇴실 시간
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">
                      학습 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredLogs.map((day) => {
                    const status = getStatus(day);
                    return (
                      <tr
                        key={day.date}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="py-5 px-6">
                          <div className="font-bold text-on-surface">
                            {day.date}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              status === "출석"
                                ? "bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim"
                                : status === "미퇴실"
                                ? "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim"
                                : "bg-error-container text-on-error-container border-error"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-5 px-6 font-headline text-lg text-on-surface-variant">
                          {formatLogTime(day.in)}
                        </td>
                        <td className="py-5 px-6 font-headline text-lg text-on-surface-variant">
                          {formatLogTime(day.out)}
                        </td>
                        <td className="py-5 px-6 text-right font-headline text-xl text-primary font-medium">
                          {Math.floor(day.duration / 60)}h{" "}
                          {day.duration % 60}m
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-20 text-center text-on-surface-variant font-medium italic"
                        style={{ opacity: 0.5 }}
                      >
                        기록이 없습니다.
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
