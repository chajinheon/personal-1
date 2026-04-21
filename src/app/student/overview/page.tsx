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
  formatMinutesLabel,
  formatPercentLabel,
  formatTimeLabel,
} from "@/lib/attendance-statistics";

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatEventDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getHeroTimerParts(
  session: ReturnType<typeof useCurrentStudentAttendance>["sessions"][number] | null,
  now: Date
) {
  if (!session?.checkin) {
    return { main: "00:00", seconds: ":00" };
  }

  const checkinTime = getLogTimestamp(session.checkin);
  if (!checkinTime) {
    return { main: "00:00", seconds: ":00" };
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
  const seconds = totalSeconds % 60;

  return {
    main: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    seconds: `:${String(seconds).padStart(2, "0")}`,
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

  const heroTitle = useMemo(() => {
    if (!todaySession?.checkin) return "오늘 입실 전";

    const status = getSessionStatus(todaySession, now);
    if (status === "completed") return "오늘 학습 종료";
    if (status === "missing_checkout") return "미퇴실 기록";
    return "현재 입실 중";
  }, [now, todaySession]);

  const heroBadge = useMemo(() => {
    if (!todaySession?.checkin) {
      return {
        label: "대기 중",
        className:
          "bg-surface-container-high text-on-surface-variant px-3 py-1.5 md:px-4 md:py-2 rounded-full font-label font-bold text-[10px] md:text-xs uppercase flex items-center space-x-1",
        dotClassName: "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-on-surface-variant",
      };
    }

    const status = getSessionStatus(todaySession, now);
    if (status === "completed") {
      return {
        label: "학습 종료",
        className:
          "bg-primary/10 text-primary px-3 py-1.5 md:px-4 md:py-2 rounded-full font-label font-bold text-[10px] md:text-xs uppercase flex items-center space-x-1",
        dotClassName: "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary",
      };
    }

    if (status === "missing_checkout") {
      return {
        label: "미퇴실",
        className:
          "bg-secondary-container text-on-secondary-container px-3 py-1.5 md:px-4 md:py-2 rounded-full font-label font-bold text-[10px] md:text-xs uppercase flex items-center space-x-1",
        dotClassName: "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-secondary",
      };
    }

    return {
      label: "학습 진행 중",
      className:
        "bg-secondary-container text-on-secondary-container px-3 py-1.5 md:px-4 md:py-2 rounded-full font-label font-bold text-[10px] md:text-xs uppercase flex items-center space-x-1",
      dotClassName: "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse",
    };
  }, [now, todaySession]);

  const recentEvents = useMemo(() => {
    return sessions
      .flatMap((session) => {
        const items = [];
        const checkinTime = getLogTimestamp(session.checkin);
        const exitLog = getSessionExitLog(session);
        const exitTime = getLogTimestamp(exitLog);

        if (checkinTime) {
          items.push({
            key: `${session.key}-checkin`,
            icon: "login",
            iconClassName: "bg-primary/10 text-primary",
            title: session.date === todayKey ? "오늘 입실" : "입실",
            dateLabel: formatEventDate(session.date),
            timeLabel: formatTimeLabel(checkinTime),
            sortKey: checkinTime.getTime(),
          });
        }

        if (exitTime) {
          items.push({
            key: `${session.key}-checkout`,
            icon: exitLog?.autoCheckout ? "logout" : "logout",
            iconClassName: exitLog?.autoCheckout
              ? "bg-outline-variant/30 text-on-surface-variant"
              : "bg-outline-variant/30 text-on-surface-variant",
            title: exitLog?.autoCheckout ? "자동 퇴실" : "퇴실",
            dateLabel: formatEventDate(session.date),
            timeLabel: formatTimeLabel(exitTime),
            sortKey: exitTime.getTime(),
          });
        }

        return items;
      })
      .sort((left, right) => right.sortKey - left.sortKey)
      .slice(0, 3);
  }, [sessions, todayKey]);

  const weeklyMaxMinutes = useMemo(
    () => Math.max(...stats.weeklyStudySeries.map((point) => point.minutes), 1),
    [stats.weeklyStudySeries]
  );

  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto bg-surface-container-low md:bg-transparent">
        <div className="md:hidden font-headline font-semibold italic text-xl text-primary">Evergreen Academy</div>
        <div className="hidden md:flex space-x-6">
          <span className="text-primary font-bold border-b-2 border-primary pb-1 text-sm uppercase font-label">Overview</span>
          <Link href="/student/history" className="text-on-surface-variant font-medium hover:text-primary transition-colors pb-1 text-sm uppercase font-label cursor-pointer">History</Link>
        </div>
        <div className="flex items-center space-x-4">
          <button className="hidden md:block py-2 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label uppercase font-bold text-xs scale-95 active:opacity-80 transition-all">
            Enter Study
          </button>
          <button className="text-primary hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 flex items-center justify-center bg-surface-container-highest md:hidden">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
        </div>
      </header>

      <div className="p-5 md:p-8 max-w-screen-2xl mx-auto w-full space-y-8 md:space-y-12">
        <div>
          <div className="font-headline text-3xl md:text-4xl text-on-surface mb-2">야간 자율 학습 현황</div>
          <p className="text-on-surface-variant font-body">오늘도 목표를 향해 정진하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 shadow-[0_24px_48px_rgba(27,28,25,0.05)] pointer-events-none rounded-xl"></div>
            <div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h3 className="font-body font-semibold text-on-surface-variant text-sm uppercase mb-1">현재 상태</h3>
                  <div className="font-headline text-4xl md:text-5xl text-primary font-semibold">{heroTitle}</div>
                </div>
                <div className={heroBadge.className}>
                  <span className={heroBadge.dotClassName}></span>
                  <span>{heroBadge.label}</span>
                </div>
              </div>
              <div className="relative z-10">
                <div className="font-body text-on-surface-variant text-sm mb-2">현재 세션 시간</div>
                <div className="font-headline text-5xl md:text-6xl text-on-surface">
                  {heroTimer.main}
                  <span className="text-2xl md:text-3xl text-on-surface-variant">{heroTimer.seconds}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 md:mt-8 pt-6 border-t border-outline-variant/20 flex items-start gap-4">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-primary/40 mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
              <div className="flex-1">
                <p className="font-headline text-xl md:text-2xl text-on-surface italic leading-relaxed mb-3">
                  "{quote?.text}"
                </p>
                <p className="font-label text-sm uppercase tracking-widest text-on-surface-variant font-bold text-right">
                  - {quote?.author}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col justify-between">
            <div className="bg-surface-container-lowest rounded-xl p-6 relative">
              <div className="absolute inset-0 shadow-[0_24px_48px_rgba(27,28,25,0.03)] pointer-events-none rounded-xl"></div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">calendar_today</span>
                <h3 className="font-body font-semibold text-on-surface-variant text-sm">이번 달 총 참여</h3>
              </div>
              <div className="font-headline text-4xl text-on-surface flex items-baseline gap-1">
                {stats.monthlyAttendanceCount} <span className="text-xl text-on-surface-variant">회</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 relative">
              <div className="absolute inset-0 shadow-[0_24px_48px_rgba(27,28,25,0.03)] pointer-events-none rounded-xl"></div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">timer</span>
                <h3 className="font-body font-semibold text-on-surface-variant text-sm">누적 학습 시간</h3>
              </div>
              <div className="font-headline text-4xl text-on-surface flex items-baseline gap-1">
                {Math.floor(stats.totalStudyMinutes / 60)} <span className="text-xl text-on-surface-variant">시간</span> {stats.totalStudyMinutes % 60} <span className="text-xl text-on-surface-variant">분</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 relative">
              <div className="absolute inset-0 shadow-[0_24px_48px_rgba(27,28,25,0.03)] pointer-events-none rounded-xl"></div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">schedule</span>
                <h3 className="font-body font-semibold text-on-surface-variant text-sm">평균 입실 시간</h3>
              </div>
              <div className="font-headline text-4xl text-on-surface">
                {stats.averageEntryTime}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest rounded-xl p-8 relative">
            <div className="absolute inset-0 shadow-[0_24px_48px_rgba(27,28,25,0.03)] pointer-events-none rounded-xl"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-body font-semibold text-on-surface text-lg">최근 기록</h3>
              <Link href="/student/history" className="text-primary font-label uppercase text-xs font-bold hover:text-primary-container">전체 보기</Link>
            </div>
            <div className="space-y-6">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div key={event.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.iconClassName}`}>
                        <span className="material-symbols-outlined text-sm">{event.icon}</span>
                      </div>
                      <div>
                        <div className="font-body font-semibold text-on-surface">{event.title}</div>
                        <div className="font-body text-xs text-on-surface-variant">{event.dateLabel}</div>
                      </div>
                    </div>
                    <div className="font-headline text-xl text-on-surface">{event.timeLabel}</div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-sm font-semibold text-on-surface-variant">
                  표시할 최근 출석 기록이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 relative flex flex-col">
            <div className="absolute inset-0 shadow-[0_24px_48px_rgba(27,28,25,0.03)] pointer-events-none rounded-xl"></div>
            <h3 className="font-body font-semibold text-on-surface text-lg mb-6">주간 학습 시간</h3>
            <div className="flex-1 flex items-end space-x-2 md:space-x-4 h-48 mt-auto">
              {stats.weeklyStudySeries.map((point) => {
                const heightRatio = point.minutes > 0 ? Math.max(point.minutes / weeklyMaxMinutes, 0.08) : 0.08;
                const height = `${Math.round(heightRatio * 100)}%`;

                return (
                  <div key={point.dateKey} className={`flex flex-col items-center flex-1 ${point.isToday ? "" : point.minutes === 0 ? "opacity-70" : ""}`}>
                    <div
                      className={`w-full rounded-t-sm ${point.isToday ? "bg-primary shadow-[0_0_15px_rgba(35,66,42,0.2)]" : "bg-surface-container-highest"}`}
                      style={{ height }}
                    ></div>
                    <span className={`font-label text-xs mt-2 uppercase ${point.isToday ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                      {point.isToday ? "오늘" : point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
