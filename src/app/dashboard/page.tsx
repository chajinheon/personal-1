"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useDate } from "@/components/DateProvider";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "motion/react";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedDate } = useDate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlySessions: 0,
    totalMinutes: 0,
    avgEntryTime: "18:30"
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Extract studentId from email (e.g., 24293 from 24293@hmh.or.kr)
    const studentIdFromEmail = user.email?.split('@')[0] || "";
    
    // Fetch logs for the selected date
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Try querying by studentId (from email) first, as it's common in this school system
    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [user.uid, studentIdFromEmail]),
      where("date", "==", dateStr),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  // Fetch monthly stats
  useEffect(() => {
    if (!user) return;
    
    const studentIdFromEmail = user.email?.split('@')[0] || "";
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [user.uid, studentIdFromEmail]),
      where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
      where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => doc.data());
      const inLogs = allLogs.filter((l: any) => l.type === "IN");
      const totalMin = allLogs.reduce((acc, curr: any) => acc + (curr.studyDuration || 0), 0);
      
      setStats({
        monthlySessions: inLogs.length,
        totalMinutes: totalMin,
        avgEntryTime: "18:42" // Placeholder or calculated
      });
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  const getDaySummary = () => {
    const inLog = logs.find(l => l.type === "IN");
    const outLog = logs.find(l => l.type === "OUT");
    
    const entryTime = inLog ? new Date(inLog.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
    const exitTime = outLog ? new Date(outLog.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
    
    let durationStr = "0h 0m";
    if (inLog && outLog) {
      const diff = outLog.timestamp.toDate().getTime() - inLog.timestamp.toDate().getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      durationStr = `${h}h ${m}m`;
    } else if (inLog && isToday(selectedDate)) {
      // Living duration
      const diff = new Date().getTime() - inLog.timestamp.toDate().getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      durationStr = `${h}h ${m}m`;
    }

    return { entryTime, exitTime, durationStr, inLog, outLog };
  };

  const { entryTime, exitTime, durationStr, inLog, outLog } = getDaySummary();

  return (
    <div className="flex h-screen bg-background w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top bar */}
        <header className="flex justify-between items-center w-full px-10 py-8 sticky top-0 bg-background/80 backdrop-blur-xl z-20">
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary">Dashboard</h2>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Overview • {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 text-primary bg-primary/5 rounded-2xl hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <div className="h-12 w-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white font-headline text-lg font-bold shadow-lg shadow-stone-900/20">
              {user?.displayName?.[0] || "S"}
            </div>
          </div>
        </header>

        <div className="px-10 pb-12 space-y-10 max-w-6xl">
          {/* Header section */}
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-headline font-semibold text-on-surface mb-2"
            >
              야간 자율 학습 현황
            </motion.h1>
            <p className="text-on-surface-variant font-body text-sm font-medium">오늘도 목표를 향해 정진하세요.</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDate.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Main Summary Card */}
              <div className="md:col-span-2 bg-stone-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-stone-900/30">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <span className="material-symbols-outlined text-[10rem]">menu_book</span>
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3">현재 상태</h3>
                    <div className="text-4xl font-headline font-semibold">
                      {isToday(selectedDate) ? (inLog && !outLog ? "현재 입실 중" : "입실 전") : "기록 요약"}
                    </div>
                  </div>
                  {isToday(selectedDate) && inLog && !outLog && (
                    <div className="bg-primary-container text-on-primary-container px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-[#acd0af] animate-pulse"></span>
                      학습 진행 중
                    </div>
                  )}
                </div>

                <div className="mt-16 relative z-10">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3">학습 시간</p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-7xl font-headline font-semibold">{durationStr.split(' ')[0]}</span>
                    <span className="text-3xl text-white/50 font-headline">{durationStr.split(' ')[1]}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Stats Column */}
              <div className="flex flex-col gap-6">
                <StatCard 
                  icon="event_available" 
                  label="이번 달 총 참여" 
                  value={stats.monthlySessions} 
                  unit="회" 
                />
                <StatCard 
                  icon="timer" 
                  label="누적 학습 시간" 
                  value={Math.floor(stats.totalMinutes / 60)} 
                  unit={`시간 ${stats.totalMinutes % 60}분`} 
                />
                <StatCard 
                  icon="schedule" 
                  label="평균 입실 시간" 
                  value={stats.avgEntryTime} 
                  unit="" 
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Detailed Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* History Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-outline-variant/15 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline text-2xl font-semibold text-on-surface">입퇴실 상세</h3>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Selected Day</span>
              </div>
              <div className="space-y-8">
                <LogItem 
                  type="IN" 
                  time={entryTime} 
                  label={isToday(selectedDate) ? "오늘 입실" : "입실 시각"} 
                  date={selectedDate.toLocaleDateString()} 
                />
                <LogItem 
                  type="OUT" 
                  time={exitTime} 
                  label={isToday(selectedDate) ? "퇴실 예정" : "퇴실 시각"} 
                  date={selectedDate.toLocaleDateString()} 
                />
              </div>
            </div>

            {/* Quote Card */}
            <div className="bg-primary text-white rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col justify-center">
              <span className="material-symbols-outlined text-5xl text-white/10 mb-6 italic">format_quote</span>
              <p className="font-headline text-2xl italic leading-relaxed text-white/90 mb-8">
                "지속적인 노력은 천재성을 이깁니다. 오늘 집중한 시간은 내일의 흔들리지 않는 기초가 될 것입니다."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">school</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Atelier Guidance</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: string; label: string; value: any; unit: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/15 shadow-sm flex-1">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        </div>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-headline font-semibold text-on-surface">{value}</span>
        <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{unit}</span>
      </div>
    </div>
  );
}

function LogItem({ type, time, label, date }: { type: "IN" | "OUT"; time: string; label: string; date: string }) {
  const isOut = type === "OUT";
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          isOut ? "bg-stone-100 text-stone-400" : "bg-primary/10 text-primary"
        }`}>
          <span className="material-symbols-outlined text-xl">{isOut ? "logout" : "login"}</span>
        </div>
        <div>
          <div className="text-sm font-bold text-on-surface mb-0.5">{label}</div>
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider opacity-50">{date}</div>
        </div>
      </div>
      <div className="text-3xl font-headline font-semibold text-on-surface">{time}</div>
    </div>
  );
}
