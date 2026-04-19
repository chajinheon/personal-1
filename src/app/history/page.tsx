"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import { motion } from "motion/react";

export default function History() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("전체");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group by date
      const grouped = allLogs.reduce((acc: any, log: any) => {
        const date = log.date;
        if (!acc[date]) {
          acc[date] = { date, in: null, out: null, duration: 0 };
        }
        if (log.type === "IN") acc[date].in = log;
        if (log.type === "OUT") acc[date].out = log;
        if (log.studyDuration) acc[date].duration += log.studyDuration;
        return acc;
      }, {});

      setLogs(Object.values(grouped));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatus = (day: any) => {
    if (day.in && day.out) return "출석";
    if (day.in && !day.out) return "미퇴실";
    return "미출석";
  };

  const filteredLogs = logs.filter(day => {
    if (filterStatus === "전체") return true;
    return getStatus(day) === filterStatus;
  });

  return (
    <div className="flex h-screen bg-background w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="flex justify-between items-center w-full px-10 py-8 sticky top-0 bg-background/80 backdrop-blur-xl z-20">
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary">Attendance History</h2>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Record Tracker</p>
          </div>
        </header>

        <div className="px-10 pb-12 max-w-6xl space-y-10">
          {/* Summary Section */}
          <section className="bg-stone-900 text-white p-12 rounded-[2.5rem] shadow-2xl shadow-stone-900/20 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4">전체 통계</h3>
              <h2 className="text-5xl font-headline font-semibold mb-4">기록 조회</h2>
              <p className="text-white/60 text-sm max-w-md font-medium leading-relaxed">
                선택한 기간의 출석 기록과 학습 시간입니다. 꾸준함은 숙련의 기초입니다.
              </p>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <span className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">총 세션</span>
                <span className="text-4xl font-headline font-semibold">{logs.length}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">총 학습 시간</span>
                <span className="text-4xl font-headline font-semibold">
                  {Math.floor(logs.reduce((acc, c) => acc + c.duration, 0) / 60)}h
                </span>
              </div>
            </div>
          </section>

          {/* Table Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-outline-variant/30 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>전체</option>
                <option>출석</option>
                <option>미퇴실</option>
                <option>미출석</option>
              </select>
            </div>
            <button className="flex items-center gap-2 text-primary hover:bg-primary/5 px-6 py-2.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-lg">download</span>
              Export Records
            </button>
          </div>

          {/* History Table */}
          <section className="bg-white rounded-[2.5rem] border border-outline-variant/15 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-outline-variant/10">
                    <th className="py-6 px-10 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">날짜</th>
                    <th className="py-6 px-10 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">상태</th>
                    <th className="py-6 px-10 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">입실 시간</th>
                    <th className="py-6 px-10 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">퇴실 시간</th>
                    <th className="py-6 px-10 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">학습 시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredLogs.map((day, idx) => {
                    const status = getStatus(day);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={day.date} 
                        className="hover:bg-stone-50 transition-colors group"
                      >
                        <td className="py-6 px-10">
                          <div className="font-bold text-on-surface">{day.date}</div>
                          <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Weekday</div>
                        </td>
                        <td className="py-6 px-10">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            status === "출석" ? "bg-primary/5 text-primary border-primary/20" :
                            status === "미퇴실" ? "bg-orange-50 text-orange-600 border-orange-200" :
                            "bg-red-50 text-red-600 border-red-200"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-6 px-10 font-headline text-lg text-on-surface-variant">
                          {day.in ? new Date(day.in.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </td>
                        <td className="py-6 px-10 font-headline text-lg text-on-surface-variant">
                          {day.out ? new Date(day.out.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </td>
                        <td className="py-6 px-10 text-right font-headline text-2xl text-primary font-medium">
                          {Math.floor(day.duration / 60)}h {day.duration % 60}m
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-on-surface-variant font-medium opacity-50 italic">
                        No records found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
