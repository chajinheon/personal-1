"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAttendanceStatistics } from "@/hooks/useAttendanceStatistics";
import { useCurrentStudentAttendance } from "@/hooks/useCurrentStudentAttendance";
import { useNow } from "@/hooks/useNow";
import { getRandomQuote, Quote } from "@/lib/quotes";
import {
  formatDateKey,
  getLogTimestamp,
  getSessionExitLog,
  getSessionStatus,
} from "@/lib/attendance";
import {
  formatTimeLabel,
} from "@/lib/attendance-statistics";

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatEventDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

function getHeroTimerParts(
  session: ReturnType<typeof useCurrentStudentAttendance>["sessions"][number] | null,
  now: Date
) {
  if (!session?.checkin) {
    return { hours: "0", minutes: "00", totalMinutes: 0 };
  }

  const checkinTime = getLogTimestamp(session.checkin);
  if (!checkinTime) {
    return { hours: "0", minutes: "00", totalMinutes: 0 };
  }

  const exitTime = getLogTimestamp(getSessionExitLog(session));
  const status = getSessionStatus(session, now);
  const endTime =
    exitTime ??
    (status === "missing_checkout" ? new Date(`${session.date}T23:59:59`) : now);
  const totalSeconds = Math.max(
    0,
    Math.floor((endTime.getTime() - checkinTime.getTime()) / 1000)
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    hours: String(hours),
    minutes: String(minutes).padStart(2, "0"),
    totalMinutes: Math.floor(totalSeconds / 60)
  };
}

export default function OverviewPage() {
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const now = useNow();
  const todayKey = useMemo(() => formatDateKey(now), [now]);
  const {
    authLoading,
    activeStudentId,
    sessions,
  } = useCurrentStudentAttendance();
  const { stats } = useAttendanceStatistics({
    enabled: Boolean(activeStudentId),
    studentSessions: sessions,
    referenceDate: now,
    now,
  });

  useEffect(() => {
    setMounted(true);
    setQuote(getRandomQuote());
  }, []);

  const todaySession = useMemo(
    () => sessions.find((session) => session.date === todayKey) ?? null,
    [sessions, todayKey]
  );

  const heroTimer = useMemo(() => getHeroTimerParts(todaySession, now), [now, todaySession]);
  
  const entryTimeLabel = useMemo(() => {
    if (!todaySession?.checkin) return "--:--";
    const t = getLogTimestamp(todaySession.checkin);
    return t ? formatTimeLabel(t).replace(/(AM|PM)/, "") : "--:--";
  }, [todaySession]);

  const entryPeriod = useMemo(() => {
    if (!todaySession?.checkin) return "";
    const t = getLogTimestamp(todaySession.checkin);
    return t ? (t.getHours() >= 12 ? "PM" : "AM") : "";
  }, [todaySession]);

  const exitTimeLabel = useMemo(() => {
    const exitLog = getSessionExitLog(todaySession);
    if (!exitLog) return "--:--";
    const t = getLogTimestamp(exitLog);
    return t ? formatTimeLabel(t).replace(/(AM|PM)/, "") : "--:--";
  }, [todaySession]);

  const exitPeriod = useMemo(() => {
    const exitLog = getSessionExitLog(todaySession);
    if (!exitLog) return "";
    const t = getLogTimestamp(exitLog);
    return t ? (t.getHours() >= 12 ? "PM" : "AM") : "";
  }, [todaySession]);

  const progressPercent = useMemo(() => {
    // Assuming a 4-hour goal (240 minutes) for demonstration
    const goal = 240;
    return Math.min(Math.round((heroTimer.totalMinutes / goal) * 100), 100);
  }, [heroTimer.totalMinutes]);

  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative z-10">
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-8 py-4 bg-background z-30 sticky top-0 md:bg-transparent">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-primary p-2 -ml-2 rounded-full hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline text-2xl italic font-semibold text-primary md:hidden">Evergreen Academy</h1>
          <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 hover:bg-surface-container-high transition-colors cursor-text min-w-[300px]">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <span className="font-body text-sm text-outline">Search records...</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-primary rounded-full hover:bg-surface-container-highest transition-colors scale-95 active:duration-150">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-primary rounded-full hover:bg-surface-container-highest transition-colors scale-95 active:duration-150">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden ml-2 border border-surface-container-highest shadow-[0_4px_12px_rgba(27,28,25,0.04)] cursor-pointer bg-surface-container-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/15 pb-6">
            <div>
              <p className="font-label text-sm uppercase tracking-widest text-primary mb-2 font-bold">일일 기록</p>
              <h2 className="font-headline text-4xl md:text-5xl font-semibold text-on-surface leading-tight">{formatEventDate(todayKey)} 학습 요약</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-surface-container-highest text-primary px-4 py-2 rounded-full font-label text-sm font-bold hover:bg-surface-variant transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">download</span>
                보고서 다운로드
              </button>
            </div>
          </div>

          {/* Main Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Entry Time Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              </div>
              <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">입실 시간 (Entry Time)</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <h3 className="font-headline text-5xl font-medium text-primary">{entryTimeLabel}</h3>
                <span className="font-body text-sm text-outline font-medium">{entryPeriod}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  {todaySession?.checkin ? "정상 입실 처리됨" : "입실 기록 대기 중"}
                </p>
              </div>
            </div>

            {/* Exit Time Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
              </div>
              <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">퇴실 시간 (Exit Time)</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <h3 className="font-headline text-5xl font-medium text-secondary">{exitTimeLabel}</h3>
                <span className="font-body text-sm text-outline font-medium">{exitPeriod}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">done_all</span>
                  {getSessionExitLog(todaySession) ? "퇴실 완료" : "학습 진행 중"}
                </p>
              </div>
            </div>

            {/* Total Study Time Card */}
            <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 shadow-[0_12px_32px_-12px_rgba(35,66,42,0.3)] text-on-primary flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-label text-xs uppercase tracking-wider text-on-primary/80 font-bold">총 학습 시간 (Total Time)</p>
                  <span className="material-symbols-outlined text-on-primary/60">hourglass_top</span>
                </div>
                <h3 className="font-headline text-5xl font-semibold mt-2">
                  {heroTimer.hours}<span className="text-3xl font-medium">h</span> {heroTimer.minutes}<span className="text-3xl font-medium">m</span>
                </h3>
              </div>
              <div className="mt-8 relative z-10">
                <div className="w-full bg-on-primary/20 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-on-primary h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="font-body text-xs text-on-primary/80 text-right">일일 목표의 {progressPercent}% 달성</p>
              </div>
            </div>
          </div>

          {/* Secondary Content Area */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quote section */}
            <div className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-center border border-outline-variant/10">
              <span className="material-symbols-outlined text-3xl text-secondary/40 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
              <p className="font-headline text-xl text-on-surface italic leading-relaxed">
                "{quote?.text}"
              </p>
              <p className="font-label text-xs uppercase tracking-widest text-primary mt-6 font-bold">{quote?.author || "지도교사 코멘트"}</p>
            </div>

            {/* Monthly Stats Summary */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] flex flex-col justify-between">
              <div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold">이번 달 참여 현황</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-headline text-on-surface">{stats.monthlyAttendanceCount} 회</div>
                    <div className="text-xs font-body text-on-surface-variant">출석 횟수</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-headline text-primary">{Math.floor(stats.totalStudyMinutes / 60)}h</div>
                    <div className="text-xs font-body text-on-surface-variant">총 학습 시간</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                {stats.weeklyStudySeries.slice(-7).map((point) => (
                  <div key={point.dateKey} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-sm h-12 bg-surface-container-high relative overflow-hidden`}>
                      <div 
                        className={`absolute bottom-0 left-0 w-full ${point.isToday ? 'bg-primary' : 'bg-primary/30'}`} 
                        style={{ height: `${Math.min((point.minutes / 240) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

