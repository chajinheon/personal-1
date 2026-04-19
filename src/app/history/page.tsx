"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import StudentAccessPanel from "@/components/StudentAccessPanel";
import { useAuth } from "@/components/AuthProvider";
import { useResolvedStudentId } from "@/hooks/useResolvedStudentId";
import { useStudentAttendance } from "@/hooks/useStudentAttendance";
import {
  formatMinutesLabel,
  getLogTimestamp,
  getSessionCompletedMinutes,
  getSessionDurationDisplay,
  getSessionStatus,
} from "@/lib/attendance";

type FilterStatus = "전체" | "완료" | "진행 중" | "미퇴실";

function formatTime(date: Date | null): string {
  if (!date) return "--:--";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: ReturnType<typeof getSessionStatus>): FilterStatus {
  if (status === "completed") return "완료";
  if (status === "missing_checkout") return "미퇴실";
  return "진행 중";
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");

  const {
    studentId,
    source,
    manualStudentId,
    setManualStudentId,
    saveManualStudentId,
    clearManualStudentId,
  } = useResolvedStudentId(user?.email);
  const activeStudentId = authLoading ? "" : studentId;
  const { studentProfile, sessions, loading, error } = useStudentAttendance(activeStudentId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCompletedMinutes = useMemo(
    () =>
      sessions.reduce(
        (total, session) => total + getSessionCompletedMinutes(session),
        0
      ),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    if (filterStatus === "전체") return sessions;

    return sessions.filter(
      (session) => statusLabel(getSessionStatus(session, new Date())) === filterStatus
    );
  }, [filterStatus, sessions]);

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
                Attendance History
              </p>
              <h1 className="mt-2 font-headline text-4xl font-semibold text-on-surface">
                출석 이력
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

          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="총 기록 일수" value={`${sessions.length}일`} />
            <SummaryCard
              label="누적 학습 시간"
              value={formatMinutesLabel(totalCompletedMinutes)}
              accent="primary"
            />
            <SummaryCard
              label="완료 비율"
              value={
                sessions.length > 0
                  ? `${Math.round(
                      (sessions.filter(
                        (session) =>
                          getSessionStatus(session, new Date()) === "completed"
                      ).length /
                        sessions.length) *
                        100
                    )}%`
                  : "0%"
              }
            />
          </section>

          {error && (
            <section className="rounded-2xl border border-error/15 bg-error-container p-4 text-sm font-semibold text-on-surface">
              {error}
            </section>
          )}

          <section className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                  Session Archive
                </p>
                <h2 className="mt-2 font-headline text-3xl font-semibold text-on-surface">
                  저장된 학습 세션
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="history-filter"
                  className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant"
                >
                  상태 필터
                </label>
                <select
                  id="history-filter"
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(event.target.value as FilterStatus)
                  }
                  className="rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option>전체</option>
                  <option>완료</option>
                  <option>진행 중</option>
                  <option>미퇴실</option>
                </select>
              </div>
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
                  {filteredSessions.map((session) => {
                    const status = getSessionStatus(session, new Date());
                    return (
                      <tr
                        key={session.key}
                        className="rounded-2xl bg-surface-container-low"
                      >
                        <td className="rounded-l-2xl px-4 py-4 font-semibold text-on-surface">
                          {session.date}
                        </td>
                        <td className="px-4 py-4">
                          <StatusChip status={status} />
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
                          {getSessionDurationDisplay(session, new Date())}
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && filteredSessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-16 text-center text-sm font-semibold text-on-surface-variant"
                      >
                        조건에 맞는 출석 기록이 없습니다.
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

function SummaryCard({
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

function StatusChip({
  status,
}: {
  status: ReturnType<typeof getSessionStatus>;
}) {
  const config =
    status === "completed"
      ? { label: "완료", className: "bg-primary/10 text-primary" }
      : status === "missing_checkout"
        ? { label: "미퇴실", className: "bg-secondary/10 text-secondary" }
        : { label: "진행 중", className: "bg-primary-fixed text-primary" };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}
