"use client";

import { useEffect, useMemo, useState } from "react";
import { useAttendanceStatistics } from "@/hooks/useAttendanceStatistics";
import { useCurrentStudentAttendance } from "@/hooks/useCurrentStudentAttendance";
import { useNow } from "@/hooks/useNow";
import {
  getLogTimestamp,
  getSessionDurationDisplay,
  getSessionStatus,
} from "@/lib/attendance";
import {
  formatMinutesLabel,
  formatPercentLabel,
  formatTimeLabel,
  getSessionAccumulatedMinutes,
  formatHoursMinutesShort,
} from "@/lib/attendance-statistics";

type FilterStatus = "전체" | "완료" | "진행 중" | "미퇴실";

function statusLabel(status: ReturnType<typeof getSessionStatus>): FilterStatus {
  if (status === "completed") return "완료";
  if (status === "missing_checkout") return "미퇴실";
  return "진행 중";
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
}

function buildLinePath(values: number[]): string {
  if (values.length === 0) return "";

  const maxValue = Math.max(...values, 1);
  const stepX = 720 / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = 40 + index * stepX;
      const y = 160 - (value / maxValue) * 120;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[]): string {
  if (values.length === 0) return "";

  const linePath = buildLinePath(values);
  const stepX = 720 / Math.max(values.length - 1, 1);
  const lastX = 40 + (values.length - 1) * stepX;

  return `${linePath} L ${lastX} 200 L 40 200 Z`;
}

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");
  const now = useNow();
  const { authLoading, activeStudentId, sessions } = useCurrentStudentAttendance();
  const { stats } = useAttendanceStatistics({
    enabled: Boolean(activeStudentId),
    studentSessions: sessions,
    referenceDate: now,
    now,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const monthKey = useMemo(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    [now]
  );

  const monthlySessions = useMemo(
    () => sessions.filter((session) => session.date.startsWith(monthKey)),
    [monthKey, sessions]
  );

  const filteredSessions = useMemo(() => {
    if (filterStatus === "전체") return monthlySessions;

    return monthlySessions.filter(
      (session) => statusLabel(getSessionStatus(session, now)) === filterStatus
    );
  }, [filterStatus, monthlySessions, now]);

  const weeklyValues = useMemo(
    () => stats.weeklyStudySeries.map((point) => point.minutes),
    [stats.weeklyStudySeries]
  );

  const linePath = useMemo(() => buildLinePath(weeklyValues), [weeklyValues]);
  const areaPath = useMemo(() => buildAreaPath(weeklyValues), [weeklyValues]);

  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto">
      <header className="flex justify-between items-center w-full px-10 py-6 bg-background/80 backdrop-blur-2xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-primary p-2 hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu</span>
          </button>
          <h2 className="text-2xl font-headline font-semibold text-primary">출석 기록</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors relative">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <div className="h-10 w-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
          </div>
        </div>
      </header>

      <div className="p-5 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6 md:gap-10">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-lowest p-6 md:p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/15">
          <div>
            <h3 className="text-label uppercase tracking-widest text-primary-container font-bold mb-2">월간 요약</h3>
            <h2 className="text-3xl md:text-4xl font-headline font-semibold text-on-surface mb-2 md:mb-4">{formatMonthLabel(now)} 기록</h2>
            <p className="text-body text-on-surface-variant max-w-md">운영일 규칙을 반영한 실제 출석 기록과 학습 시간입니다.</p>
          </div>
          <div className="flex gap-6 w-full md:w-auto mt-4 md:mt-0">
            <div className="bg-surface-container-low px-6 py-4 rounded-[1rem] flex-1 md:flex-none flex flex-col justify-center border border-outline-variant/10">
              <span className="text-label text-on-surface-variant uppercase text-xs font-bold tracking-wider mb-1">총 세션</span>
              <span className="text-3xl font-headline font-medium text-primary">{stats.monthlyAttendanceCount}</span>
            </div>
            <div className="bg-surface-container-low px-6 py-4 rounded-[1rem] flex-1 md:flex-none flex flex-col justify-center border border-outline-variant/10">
              <span className="text-label text-on-surface-variant uppercase text-xs font-bold tracking-wider mb-1">학습 시간</span>
              <span className="text-3xl font-headline font-medium text-primary">{formatMinutesLabel(stats.monthlyStudyMinutes)}</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-surface-container-lowest p-5 md:p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/15 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            </div>
            <span className="text-label text-on-surface-variant uppercase text-xs font-bold tracking-wider mb-2 block relative z-10">연속 학습</span>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl md:text-4xl font-headline font-bold text-primary">{stats.streak}</span>
              <span className="text-on-surface-variant font-medium text-sm">일</span>
            </div>
            <p className="text-xs text-secondary font-bold mt-4 flex items-center gap-1 relative z-10">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              운영일 기준 연속 학습일
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 md:p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/15 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            </div>
            <span className="text-label text-on-surface-variant uppercase text-xs font-bold tracking-wider mb-2 block relative z-10">이번 달 출석률</span>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl md:text-4xl font-headline font-bold text-primary">{formatPercentLabel(stats.monthlyAttendanceRate.rate)}</span>
              <span className="text-on-surface-variant font-medium text-sm">{stats.monthlyAttendanceRate.attendedDays}/{stats.monthlyAttendanceRate.operationalDays}</span>
            </div>
            <p className="text-xs text-secondary font-bold mt-4 flex items-center gap-1 relative z-10">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              주말과 휴무일 제외 기준
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-container p-5 md:p-6 rounded-[1.5rem] shadow-[0_12px_32px_-12px_rgba(35,66,42,0.3)] text-on-primary relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <span className="text-label text-on-primary/80 uppercase text-xs font-bold tracking-wider mb-2 block relative z-10">일일 평균 학습</span>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl md:text-4xl font-headline font-bold">{formatMinutesLabel(stats.averageDailyStudy.averageMinutes)}</span>
            </div>
            <p className="text-xs text-on-primary font-bold mt-4 flex items-center gap-1 relative z-10">
              <span className="material-symbols-outlined text-[14px]">star</span>
              완료된 운영일 기준 평균
            </p>
          </div>
        </section>

        <section className="bg-surface-container-lowest p-6 md:p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/15 overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-headline font-semibold text-on-surface">주간 학습 시간 추이</h3>
            <span className="text-xs font-label text-on-surface-variant uppercase tracking-wider font-bold">
              {stats.weeklyStudySeries[0] ? `${parseDateKey(stats.weeklyStudySeries[0].dateKey).getMonth() + 1}월 주간` : "이번 주"}
            </span>
          </div>
          <div className="w-full h-56 relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4" x1="0" x2="800" y1="160" y2="160"></line>
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4" x1="0" x2="800" y1="100" y2="100"></line>
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4" x1="0" x2="800" y1="40" y2="40"></line>
              <path d={areaPath} fill="url(#gradient)" opacity="0.3"></path>
              <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#23422a"></stop>
                  <stop offset="100%" stopColor="#23422a" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d={linePath} fill="none" stroke="#23422a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path>
              {stats.weeklyStudySeries.map((point, index) => {
                const maxValue = Math.max(...weeklyValues, 1);
                const stepX = 720 / Math.max(stats.weeklyStudySeries.length - 1, 1);
                const cx = 40 + index * stepX;
                const cy = 160 - (point.minutes / maxValue) * 120;

                return (
                  <circle
                    key={point.dateKey}
                    cx={cx}
                    cy={cy}
                    fill="#fbf9f4"
                    r="5"
                    stroke="#23422a"
                    strokeWidth="2.5"
                  ></circle>
                );
              })}
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between px-[30px] translate-y-8 text-xs font-label text-on-surface-variant font-medium">
              {stats.weeklyStudySeries.map((point) => (
                <span key={point.dateKey}>{point.isToday ? "오늘" : point.label}</span>
              ))}
            </div>
          </div>
          <div className="h-8"></div>
        </section>

        <section className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <select className="w-full appearance-none bg-surface-container-lowest border-b-2 border-outline-variant/30 text-on-surface py-3 pl-4 pr-10 rounded-t-md font-body text-sm focus:outline-none focus:border-primary focus:bg-surface-container-low transition-colors cursor-pointer">
                <option>{formatMonthLabel(now)}</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            <div className="relative w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
                className="w-full appearance-none bg-surface-container-lowest border-b-2 border-outline-variant/30 text-on-surface py-3 pl-4 pr-10 rounded-t-md font-body text-sm focus:outline-none focus:border-primary focus:bg-surface-container-low transition-colors cursor-pointer"
              >
                <option>전체</option>
                <option>완료</option>
                <option>진행 중</option>
                <option>미퇴실</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <button className="flex items-center gap-2 text-primary hover:bg-surface-container-low px-4 py-2 rounded-full transition-colors font-body text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">download</span>
            기록 내보내기
          </button>
        </section>

        <section className="bg-surface-container-lowest rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-outline-variant/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[25%]">날짜</th>
                  <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[20%]">상태</th>
                  <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[20%]">입실 시간</th>
                  <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[20%]">퇴실 시간</th>
                  <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[15%] text-right">학습 시간</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm divide-y divide-outline-variant/10">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => {
                    const status = getSessionStatus(session, now);
                    const date = parseDateKey(session.date);

                    return (
                      <tr key={session.key} className="hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface">
                              {date.toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              {date.toLocaleDateString("ko-KR", { weekday: "long" })}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              status === "completed"
                                ? "bg-[#c7ecca] text-[#02210c] border-[#abd0af]/50"
                                : status === "missing_checkout"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {statusLabel(status)}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-on-surface-variant font-medium group-hover:text-on-surface transition-colors">
                          {formatTimeLabel(getLogTimestamp(session.checkin))}
                        </td>
                        <td className="py-5 px-6 text-on-surface-variant font-medium group-hover:text-on-surface transition-colors">
                          {formatTimeLabel(getLogTimestamp(session.checkout ?? session.autoCheckout))}
                        </td>
                        <td className="py-5 px-6 text-right font-headline text-primary font-medium text-base">
                          {formatHoursMinutesShort(getSessionAccumulatedMinutes(session, now))}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center text-sm font-semibold text-on-surface-variant">
                      이번 달에 표시할 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="h-10"></div>
      </div>
    </div>
  );
}
