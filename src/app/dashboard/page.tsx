"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import StudentAccessPanel from "@/components/StudentAccessPanel";
import { useDate } from "@/components/DateProvider";
import { useAttendanceStatistics } from "@/hooks/useAttendanceStatistics";
import { useCurrentStudentAttendance } from "@/hooks/useCurrentStudentAttendance";
import { useNow } from "@/hooks/useNow";
import {
  formatDateKey,
  getLogTimestamp,
  getSessionDurationDisplay,
  getSessionStatus,
} from "@/lib/attendance";
import {
  formatMinutesLabel,
  formatPercentLabel,
} from "@/lib/attendance-statistics";

function formatTime(date: Date | null): string {
  if (!date) return "--:--";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function DashboardPage() {
  const { selectedDate } = useDate();
  const [mounted, setMounted] = useState(false);
  const now = useNow();

  const {
    user,
    authLoading,
    studentId,
    source,
    manualStudentId,
    setManualStudentId,
    saveManualStudentId,
    clearManualStudentId,
    activeStudentId,
    studentProfile,
    sessions,
    loading,
    error,
  } = useCurrentStudentAttendance();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { stats, loading: statsLoading, error: statsError } = useAttendanceStatistics({
    enabled: Boolean(activeStudentId),
    studentSessions: sessions,
    referenceDate: selectedDate,
    now,
  });

  const selectedDateKey = useMemo(
    () => formatDateKey(selectedDate),
    [selectedDate]
  );
  const todayKey = useMemo(() => formatDateKey(now), [now]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.date === selectedDateKey) ?? null,
    [selectedDateKey, sessions]
  );

  const statusText = useMemo(() => {
    if (!selectedSession?.checkin) return "기록 없음";

    const status = getSessionStatus(selectedSession, now);
    if (status === "completed") return "학습 종료";
    if (status === "missing_checkout") return "미퇴실";
    return "학습 중";
  }, [now, selectedSession]);

  const combinedError = error || statsError;
  const isLoading = loading || statsLoading;

  const needsStudentAccessPanel =
    mounted && (source !== "email" || !studentProfile);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex min-h-screen flex-1 flex-col md:ml-72">
        <header className="border-b border-outline-variant/10 px-8 py-5">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                Personal Learning Lookup
              </p>
              <h1 className="mt-2 font-headline text-4xl font-semibold text-on-surface">
                개인 학습 조회
              </h1>
            </div>
            <div className="text-right text-sm text-on-surface-variant">
              <p>{studentProfile?.name ?? user?.displayName ?? "학생"}</p>
              <p>{studentId || "학번 미설정"}</p>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 p-8">
          {needsStudentAccessPanel && (
            <StudentAccessPanel
              email={user?.email}
              source={source}
              resolvedStudentId={studentId}
              studentName={studentProfile?.name}
              draftStudentId={manualStudentId}
              onDraftChange={setManualStudentId}
              onSave={saveManualStudentId}
              onClear={clearManualStudentId}
            />
          )}

          {combinedError && (
            <section className="rounded-2xl border border-error/15 bg-error-container p-4 text-sm font-semibold text-on-surface">
              {combinedError}
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <article className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                Selected Day
              </p>
              <h2 className="mt-3 font-headline text-3xl font-semibold text-on-surface">
                {formatDateLabel(selectedDate)}
              </h2>

              {isLoading ? (
                <div className="mt-10 flex items-center gap-3 text-on-surface-variant">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="font-semibold">출석 데이터를 불러오는 중입니다.</span>
                </div>
              ) : (
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  <MetricCard label="상태" value={statusText} accent="primary" />
                  <MetricCard
                    label="입실 시간"
                    value={formatTime(getLogTimestamp(selectedSession?.checkin ?? null))}
                  />
                  <MetricCard
                    label="퇴실 시간"
                    value={formatTime(
                      getLogTimestamp(
                        selectedSession?.checkout ??
                          selectedSession?.autoCheckout ??
                          null
                      )
                    )}
                  />
                </div>
              )}

              <div className="mt-8 rounded-2xl bg-surface-container-low p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                  Today Focus
                </p>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant">
                      {selectedSession?.checkin
                        ? "선택한 날짜의 누적 학습 시간입니다."
                        : "선택한 날짜의 입실 기록이 아직 없습니다."}
                    </p>
                    <p className="mt-2 font-headline text-5xl font-semibold text-primary">
                      {selectedSession
                        ? getSessionDurationDisplay(selectedSession, now)
                        : "0분"}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-on-surface-variant">
                    {selectedDateKey === todayKey
                      ? "오늘 데이터는 실시간으로 반영됩니다."
                      : "지난 기록은 저장된 출석 로그 기준으로 표시됩니다."}
                  </div>
                </div>
              </div>
            </article>

            <aside className="grid gap-4">
              <MetricCard
                label="이번 달 출석률"
                value={formatPercentLabel(stats.monthlyAttendanceRate.rate)}
                accent="primary"
              />
              <MetricCard
                label="일일 평균 학습"
                value={formatMinutesLabel(stats.averageDailyStudy.averageMinutes)}
              />
              <MetricCard label="연속 학습" value={`${stats.streak}일`} />
            </aside>
          </section>

          <section className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                  Recent Sessions
                </p>
                <h2 className="mt-2 font-headline text-3xl font-semibold text-on-surface">
                  최근 학습 기록
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant">
                `ATTENDENCE APP FINAL`과 동일하게 `date`, `entryType`, 레거시 문서키를 함께 해석합니다.
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                    <th className="px-4">날짜</th>
                    <th className="px-4">상태</th>
                    <th className="px-4">입실</th>
                    <th className="px-4">퇴실</th>
                    <th className="px-4">학습 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 10).map((session) => (
                    <tr
                      key={session.key}
                      className="rounded-2xl bg-surface-container-low"
                    >
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-on-surface">
                        {session.date}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={getSessionStatus(session, now)} />
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">
                        {formatTime(getLogTimestamp(session.checkin))}
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">
                        {formatTime(
                          getLogTimestamp(session.checkout ?? session.autoCheckout)
                        )}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 font-semibold text-primary">
                        {getSessionDurationDisplay(session, now)}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && sessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-16 text-center text-sm font-semibold text-on-surface-variant"
                      >
                        불러온 출석 기록이 없습니다.
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

function MetricCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "primary";
}) {
  const className =
    accent === "primary"
      ? "border-primary/10 bg-primary text-on-primary"
      : "border-outline-variant/20 bg-surface-container-lowest text-on-surface";

  const labelClassName =
    accent === "primary" ? "text-on-primary/70" : "text-on-surface-variant";

  return (
    <article className={`rounded-2xl border p-6 shadow-sm ${className}`}>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${labelClassName}`}>
        {label}
      </p>
      <p className="mt-4 font-headline text-4xl font-semibold">{value}</p>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: ReturnType<typeof getSessionStatus>;
}) {
  const content =
    status === "completed"
      ? { label: "완료", className: "bg-primary/10 text-primary" }
      : status === "missing_checkout"
        ? { label: "미퇴실", className: "bg-secondary/10 text-secondary" }
        : { label: "진행 중", className: "bg-primary-fixed text-primary" };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${content.className}`}
    >
      {content.label}
    </span>
  );
}
