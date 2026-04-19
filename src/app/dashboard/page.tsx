"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useDate } from "@/components/DateProvider";
import Sidebar from "@/components/Sidebar";

// Define interfaces to eliminate red markers (type errors)
interface AttendanceLog {
  id: string;
  studentId: string | number;
  type: "IN" | "OUT";
  date: string;
  timestamp: Timestamp;
  studyDuration?: number;
}

interface DashboardStats {
  monthlySessions: number;
  totalMinutes: number;
  avgEntryTime: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedDate } = useDate();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    monthlySessions: 0,
    totalMinutes: 0,
    avgEntryTime: "18:42",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayCheck = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Only calculate this on the client
  const isSelectedToday = mounted ? todayCheck(selectedDate) : false;

  // Get the student ID from email
  const getStudentId = () => {
    if (!user?.email) return "";
    return user.email.split("@")[0];
  };

  // Fetch logs for the selected date
  useEffect(() => {
    if (!user || !mounted) return;
    setLoading(true);
    
    const studentIdStr = getStudentId();
    const studentIdNum = parseInt(studentIdStr);
    
    // Fix: Use local date string instead of toISOString (UTC) to avoid 1-day mismatch
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    console.log("Fetching logs for:", { studentIdStr, studentIdNum, dateStr });

    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [studentIdStr, studentIdNum]),
      where("date", "==", dateStr)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<AttendanceLog, "id">),
        }));

        data.sort((a, b) => {
          const tA = a.timestamp?.toMillis() || 0;
          const tB = b.timestamp?.toMillis() || 0;
          return tA - tB;
        });

        console.log("Daily logs fetched:", data);
        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error (daily logs):", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate, mounted]);

  // Fetch monthly stats
  useEffect(() => {
    if (!user || !mounted) return;
    
    const studentIdStr = getStudentId();
    const studentIdNum = parseInt(studentIdStr);

    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [studentIdStr, studentIdNum])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allLogs = snapshot.docs.map((doc) => doc.data() as AttendanceLog);

        const monthLogs = allLogs.filter((l) => {
          if (!l.timestamp) return false;
          const d = l.timestamp.toDate();
          return (
            d.getMonth() === selectedDate.getMonth() &&
            d.getFullYear() === selectedDate.getFullYear()
          );
        });

        const inLogs = monthLogs.filter((l) => l.type === "IN");
        const totalMin = monthLogs.reduce(
          (acc, curr) => acc + (curr.studyDuration || 0),
          0
        );
        
        setStats({
          monthlySessions: inLogs.length,
          totalMinutes: totalMin,
          avgEntryTime: "18:42",
        });
      },
      (error) => {
        console.error("Firestore error (monthly stats):", error);
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate, mounted]);

  // Parse log data
  const inLog = logs.find((l) => l.type === "IN");
  const outLog = logs.find((l) => l.type === "OUT");

  const formatTime = (log: AttendanceLog | undefined) => {
    if (!log?.timestamp) return "--:--";
    try {
      const d = log.timestamp.toDate();
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const calcDuration = () => {
    try {
      if (inLog && outLog) {
        const diff = outLog.timestamp.toMillis() - inLog.timestamp.toMillis();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        return {
          h, m, s,
          display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
        };
      } else if (inLog && isSelectedToday) {
        const diff = Date.now() - inLog.timestamp.toMillis();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        return {
          h, m, s,
          display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
        };
      }
    } catch (e) {
      console.error("Duration calc error:", e);
    }
    return { h: 0, m: 0, s: 0, display: "00:00:00" };
  };

  const duration = calcDuration();

  const dateLabel = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekday = selectedDate.toLocaleDateString("ko-KR", {
    weekday: "long",
  });

  // Hydration safety: Return a simple loading or shell before mount
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
            <a className="text-primary font-bold border-b-2 border-primary pb-1 text-sm uppercase font-label" href="/dashboard">Overview</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors pb-1 text-sm uppercase font-label" href="/history">History</a>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hidden md:block py-2 px-6 bg-primary text-on-primary rounded-full font-label uppercase font-bold text-xs active:opacity-80 transition-all shadow-md">Enter Study</button>
            <button className="text-primary hover:opacity-70 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-screen-2xl mx-auto w-full space-y-8">
          <div>
            <div className="font-headline text-4xl text-on-surface mb-2 font-semibold">야간 자율 학습 현황</div>
            <p className="text-on-surface-variant font-body">오늘도 목표를 향해 정진하세요.</p>
          </div>

          {isSelectedToday ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between shadow-sm border border-outline-variant/20">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-body font-semibold text-on-surface-variant text-xs uppercase tracking-widest mb-2">현재 상태 (Current Status)</h3>
                      <div className="font-headline text-5xl text-primary font-bold">
                        {inLog && !outLog ? "현재 입실 중" : outLog ? "퇴실 완료" : "입실 전"}
                      </div>
                    </div>
                    {inLog && !outLog && (
                      <div className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full font-label font-bold text-xs uppercase flex items-center space-x-2 border border-outline-variant/30">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span>학습 진행 중</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-body text-on-surface-variant text-sm mb-2 font-medium">현재 세션 시간 (Current Session)</div>
                    <div className="font-headline text-7xl text-on-surface font-semibold tracking-tight">
                      {duration.display.substring(0, 5)}
                      <span className="text-3xl text-on-surface-variant font-medium ml-1">:{duration.display.substring(6)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <StatCard icon="event_available" label="이번 달 총 참여" value={String(stats.monthlySessions)} unit="회" />
                  <StatCard icon="timer" label="누적 학습 시간" value={`${Math.floor(stats.totalMinutes / 60)}`} unit={`시간 ${stats.totalMinutes % 60} 분`} />
                  <StatCard icon="schedule" label="평균 입실 시간" value={stats.avgEntryTime} unit="" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/20">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-body font-bold text-on-surface text-lg uppercase tracking-tight">최근 기록</h3>
                    <a href="/history" className="text-primary font-label uppercase text-xs font-bold hover:underline decoration-2 underline-offset-4">전체 보기</a>
                  </div>
                  <div className="space-y-6">
                    <LogRow icon="login" iconBg="bg-primary-fixed text-primary" title="오늘 입실" date={dateLabel} time={formatTime(inLog)} />
                    <LogRow icon="logout" iconBg="bg-surface-container-highest text-on-surface-variant" title="오늘 퇴실" date={dateLabel} time={formatTime(outLog)} />
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/20 flex flex-col">
                  <h3 className="font-body font-bold text-on-surface text-lg mb-8 uppercase tracking-tight">주간 학습 시간</h3>
                  <div className="flex-1 flex items-end space-x-4 h-48 mt-auto px-2">
                    {["월", "화", "수", "목", "금", "오늘", "일"].map((day, idx) => (
                      <div key={day} className="flex flex-col items-center flex-1">
                        <div className={`w-full rounded-t-md transition-all duration-500 ease-out ${day === "오늘" ? "bg-primary shadow-lg shadow-primary/20" : idx === 6 ? "bg-surface-variant/30" : "bg-surface-container-highest"}`} style={{ height: ["50%", "75%", "60%", "80%", "40%", "100%", "10%"][idx] }}></div>
                        <span className={`font-label text-[10px] mt-3 uppercase tracking-tighter ${day === "오늘" ? "text-primary font-black" : "text-on-surface-variant font-bold"}`}>{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
                <MonthlyAttendance selectedDate={selectedDate} />
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <p className="font-label text-sm uppercase tracking-[0.2em] text-primary font-black mb-3">Daily Record Summary</p>
                <h2 className="font-headline text-5xl font-bold text-on-surface leading-tight tracking-tight">{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 학습 리포트</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/20 relative overflow-hidden">
                  <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-6 font-bold">입실 시간</p>
                  <h3 className="font-headline text-6xl font-bold text-primary tracking-tighter">{formatTime(inLog)}</h3>
                  <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-lg text-secondary">calendar_today</span>{dateLabel}</p>
                    <span className="material-symbols-outlined text-primary-fixed-dim text-4xl opacity-20">login</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/20 relative overflow-hidden">
                  <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-6 font-bold">퇴실 시간</p>
                  <h3 className="font-headline text-6xl font-bold text-secondary tracking-tighter">{formatTime(outLog)}</h3>
                  <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-lg text-primary">check_circle</span>{outLog ? "일정 정상 종료" : "퇴실 정보 없음"}</p>
                    <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl opacity-20">logout</span>
                  </div>
                </div>
                <div className="bg-primary rounded-2xl p-8 shadow-xl text-on-primary flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <p className="font-label text-xs uppercase tracking-widest font-black text-on-primary/70">총 학습 시간</p>
                      <span className="material-symbols-outlined text-on-primary/40">auto_awesome</span>
                    </div>
                    <h3 className="font-headline text-7xl font-bold tracking-tighter">{duration.h}<span className="text-3xl font-medium opacity-70 ml-1">h</span> {duration.m}<span className="text-3xl font-medium opacity-70 ml-1">m</span></h3>
                  </div>
                  <div className="mt-12 relative z-10">
                    <div className="w-full bg-on-primary/20 rounded-full h-2 mb-3 overflow-hidden">
                      <div className="bg-on-primary h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${Math.min(100, ((duration.h * 60 + duration.m) / 180) * 100)}%` }}></div>
                    </div>
                    <p className="font-body text-xs text-right text-on-primary/80 font-bold">오늘의 목표 대비 {Math.min(100, Math.round(((duration.h * 60 + duration.m) / 180) * 100))}% 달성</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-10 border border-outline-variant/20 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><span className="material-symbols-outlined text-9xl">menu_book</span></div>
                <span className="material-symbols-outlined text-4xl text-secondary mb-6 opacity-30">format_quote</span>
                <p className="font-headline text-2xl text-on-surface italic leading-relaxed max-w-3xl font-medium">"지속적인 노력은 천재성을 이깁니다. 오늘 집중한 한 시간은 내일의 흔들리지 않는 굳건한 기초가 될 것입니다."</p>
                <div className="mt-8 flex items-center space-x-3"><div className="w-8 h-1 bg-primary rounded-full"></div><p className="font-label text-xs uppercase tracking-[0.2em] text-primary font-black">Evergreen Academy 지도교사</p></div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */
function StatCard({ icon, label, value, unit }: { icon: string; label: string; value: string; unit: string; }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 group hover:border-primary/30 transition-all">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center"><span className="material-symbols-outlined text-primary text-xl">{icon}</span></div>
        <h3 className="font-body font-bold text-on-surface-variant text-xs uppercase tracking-tighter">{label}</h3>
      </div>
      <div className="font-headline text-4xl text-on-surface font-bold tracking-tight">{value}{unit && <span className="text-sm text-on-surface-variant font-body ml-2 font-medium">{unit}</span>}</div>
    </div>
  );
}

function LogRow({ icon, iconBg, title, date, time }: { icon: string; iconBg: string; title: string; date: string; time: string; }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-low transition-colors group">
      <div className="flex items-center space-x-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconBg}`}><span className="material-symbols-outlined text-xl">{icon}</span></div>
        <div>
          <div className="font-body font-bold text-on-surface group-hover:text-primary transition-colors">{title}</div>
          <div className="font-body text-xs text-on-surface-variant mt-0.5">{date}</div>
        </div>
      </div>
      <div className="font-headline text-2xl text-on-surface font-bold">{time}</div>
    </div>
  );
}

function MonthlyAttendance({ selectedDate }: { selectedDate: Date }) {
  const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h3 className="font-headline text-2xl font-bold text-on-surface">{monthNames[selectedDate.getMonth()]} 출석 현황</h3>
          <p className="text-xs text-on-surface-variant font-medium mt-1 uppercase tracking-widest">Attendance Roadmap</p>
        </div>
        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-tighter">
          <div className="flex items-center space-x-2 bg-primary/5 px-3 py-1.5 rounded-full text-primary border border-primary/10"><span className="w-2 h-2 rounded-full bg-primary"></span><span>정상 출석</span></div>
          <div className="flex items-center space-x-2 bg-secondary/5 px-3 py-1.5 rounded-full text-secondary border border-secondary/10"><span className="w-2 h-2 rounded-full bg-secondary"></span><span>지각 / 조퇴</span></div>
          <div className="flex items-center space-x-2 bg-stone-100 px-3 py-1.5 rounded-full text-stone-500 border border-stone-200"><span className="w-2 h-2 rounded-full bg-stone-400"></span><span>기록 없음</span></div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-3 md:gap-4 text-center">
        {["월", "화", "수", "목", "금", "토", "일"].map((d) => <div key={d} className="font-label text-[10px] text-on-surface-variant font-black uppercase mb-4">{d}</div>)}
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-2xl hover:bg-surface-container-highest transition-all cursor-default border border-transparent hover:border-outline-variant/30">
            <span className="font-headline text-lg font-bold text-on-surface/80">{i + 1}</span>
            {i < 20 && <div className={`w-1.5 h-1.5 rounded-full mt-2 ${i % 7 === 4 ? "bg-secondary" : i % 7 === 5 || i % 7 === 6 ? "bg-stone-300" : "bg-primary"}`}></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
