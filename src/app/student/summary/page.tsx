"use client";

import { useEffect, useMemo, useState } from "react";
import { useAttendanceStatistics } from "@/hooks/useAttendanceStatistics";
import { useCurrentStudentAttendance } from "@/hooks/useCurrentStudentAttendance";
import { useNow } from "@/hooks/useNow";
import {
  formatDateKey,
  getLogTimestamp,
  getSessionDurationDisplay,
  getSessionStatus,
} from "@/lib/attendance";
import { formatPercentLabel } from "@/lib/attendance-statistics";
import { getRandomQuote, Quote } from "@/lib/quotes";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatSummaryDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatTimeParts(date: Date | null) {
  if (!date) {
    return { time: "--:--", meridiem: "" };
  }

  const fullLabel = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const match = fullLabel.match(/(오전|오후)\s*(\d{1,2}:\d{2})/);

  return {
    time: match?.[2] ?? fullLabel,
    meridiem: match?.[1] ?? "",
  };
}

export default function SummaryPage() {
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const now = useNow();
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

  const todayKey = useMemo(() => formatDateKey(now), [now]);
  const requestedDateKey = useMemo(() => {
    if (!mounted || typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("date");
  }, [mounted]);

  const selectedDateKey = useMemo(() => {
    if (requestedDateKey && DATE_KEY_PATTERN.test(requestedDateKey)) {
      return requestedDateKey;
    }

    return sessions[0]?.date ?? todayKey;
  }, [requestedDateKey, sessions, todayKey]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.date === selectedDateKey) ?? null,
    [selectedDateKey, sessions]
  );

  const entryTime = useMemo(
    () => formatTimeParts(getLogTimestamp(selectedSession?.checkin ?? null)),
    [selectedSession]
  );

  const exitTime = useMemo(
    () =>
      formatTimeParts(
        getLogTimestamp(selectedSession?.checkout ?? selectedSession?.autoCheckout ?? null)
      ),
    [selectedSession]
  );

  const exitStatusText = useMemo(() => {
    if (!selectedSession?.checkin) return "입실 기록이 없습니다.";

    const status = getSessionStatus(selectedSession, now);
    if (status === "completed") return "정상 퇴실이 기록되었습니다.";
    if (status === "missing_checkout") return "퇴실 기록이 없어 자동 처리 기준으로 계산됩니다.";
    return "현재 학습이 진행 중입니다.";
  }, [now, selectedSession]);

  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative z-10 overflow-y-auto">
      <header className="flex justify-between items-center w-full px-5 py-4 md:px-8 md:py-4 bg-background z-30 transition-all sticky top-0">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-primary p-2 -ml-2 rounded-full hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline text-2xl italic font-semibold text-primary">Evergreen Academy</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-surface-container-low rounded-full px-4 py-2 hover:bg-surface-container-high transition-colors cursor-text">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <span className="font-body text-sm text-outline">Search records...</span>
          </div>
          <button className="p-2 text-primary rounded-full hover:bg-surface-container-highest transition-colors scale-95 active:duration-150">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden ml-2 border border-surface-container-highest shadow-[0_4px_12px_rgba(27,28,25,0.04)] cursor-pointer flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 md:px-12 md:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 border-b border-outline-variant/15 pb-4 md:pb-6">
            <div>
              <p className="font-label text-xs md:text-sm uppercase tracking-widest text-primary mb-1 md:mb-2 font-bold">일일 기록</p>
              <h2 className="font-headline text-3xl md:text-5xl font-semibold text-on-surface leading-tight">{formatSummaryDate(selectedDateKey)} 학습 요약</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-surface-container-highest text-primary px-4 py-2 rounded-full font-label text-sm font-bold hover:bg-surface-variant transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">download</span>
                보고서 다운로드
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-5 md:p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-5xl md:text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              </div>
              <p className="font-label text-[10px] md:text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">입실 시간 (Entry Time)</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <h3 className="font-headline text-4xl md:text-5xl font-medium text-primary">{entryTime.time}</h3>
                <span className="font-body text-sm text-outline font-medium">{entryTime.meridiem}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  저장된 입실 로그 기준으로 표시됩니다.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 md:p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-5xl md:text-6xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
              </div>
              <p className="font-label text-[10px] md:text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">퇴실 시간 (Exit Time)</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <h3 className="font-headline text-4xl md:text-5xl font-medium text-secondary">{exitTime.time}</h3>
                <span className="font-body text-sm text-outline font-medium">{exitTime.meridiem}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">done_all</span>
                  {exitStatusText}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-5 md:p-6 shadow-[0_12px_32px_-12px_rgba(35,66,42,0.3)] text-on-primary flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-label text-[10px] md:text-xs uppercase tracking-wider text-on-primary/80 font-bold">총 학습 시간 (Total Time)</p>
                  <span className="material-symbols-outlined text-on-primary/60">hourglass_top</span>
                </div>
                <h3 className="font-headline text-4xl md:text-5xl font-semibold mt-2">{selectedSession ? getSessionDurationDisplay(selectedSession, now) : "0분"}</h3>
              </div>
              <div className="mt-8 relative z-10">
                <div className="w-full bg-on-primary/20 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-on-primary h-1.5 rounded-full" style={{ width: `${Math.round(stats.monthlyAttendanceRate.rate * 100)}%` }}></div>
                </div>
                <p className="font-body text-xs text-on-primary/80 text-right">이번 달 출석률 {formatPercentLabel(stats.monthlyAttendanceRate.rate)}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-center border border-outline-variant/10">
              <span className="material-symbols-outlined text-3xl text-secondary/40 mb-4">format_quote</span>
              <p className="font-headline text-xl text-on-surface italic leading-relaxed">
                "{quote?.text}"
              </p>
              <div className="mt-6 flex justify-between items-center border-t border-outline-variant/10 pt-4">
                <p className="font-label text-xs uppercase tracking-widest text-primary font-bold">그날의 한 문장</p>
                <p className="font-label text-sm uppercase tracking-widest text-on-surface-variant font-bold text-right">
                  - {quote?.author}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
