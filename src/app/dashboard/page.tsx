"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useDate } from "@/components/DateProvider";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedDate } = useDate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlySessions: 0,
    totalMinutes: 0,
    avgEntryTime: "18:42",
  });

  const todayCheck = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedToday = todayCheck(selectedDate);

  // Fetch logs for the selected date
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const studentIdFromEmail = user.email?.split("@")[0] || "";
    const dateStr = selectedDate.toISOString().split("T")[0];

    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [user.uid, studentIdFromEmail]),
      where("date", "==", dateStr),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  // Fetch monthly stats
  useEffect(() => {
    if (!user) return;
    const studentIdFromEmail = user.email?.split("@")[0] || "";
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const q = query(
      collection(db, "attendance_logs"),
      where("studentId", "in", [user.uid, studentIdFromEmail]),
      where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
      where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map((doc) => doc.data());
      const inLogs = allLogs.filter((l: any) => l.type === "IN");
      const totalMin = allLogs.reduce(
        (acc, curr: any) => acc + (curr.studyDuration || 0),
        0
      );
      setStats({
        monthlySessions: inLogs.length,
        totalMinutes: totalMin,
        avgEntryTime: "18:42",
      });
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  // Parse log data
  const inLog = logs.find((l) => l.type === "IN");
  const outLog = logs.find((l) => l.type === "OUT");

  const formatTime = (log: any) => {
    if (!log) return "--:--";
    const d = log.timestamp.toDate();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calcDuration = () => {
    if (inLog && outLog) {
      const diff =
        outLog.timestamp.toDate().getTime() -
        inLog.timestamp.toDate().getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return { h, m, s, display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
    } else if (inLog && isSelectedToday) {
      const diff =
        new Date().getTime() - inLog.timestamp.toDate().getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return { h, m, s, display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="hidden md:flex space-x-6">
            <a
              className="text-primary font-bold border-b-2 border-primary pb-1 text-sm uppercase font-label"
              href="/dashboard"
            >
              Overview
            </a>
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors pb-1 text-sm uppercase font-label"
              href="/history"
            >
              History
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hidden md:block py-2 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label uppercase font-bold text-xs active:opacity-80 transition-all">
              Enter Study
            </button>
            <button className="text-primary hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-screen-2xl mx-auto w-full space-y-8">
          <div>
            <div className="font-headline text-4xl text-on-surface mb-2">
              야간 자율 학습 현황
            </div>
            <p className="text-on-surface-variant font-body">
              오늘도 목표를 향해 정진하세요.
            </p>
          </div>

          {/* ===== TODAY VIEW ===== */}
          {isSelectedToday ? (
            <>
              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hero Status Card */}
                <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-body font-semibold text-on-surface-variant text-sm uppercase mb-1">
                        현재 상태
                      </h3>
                      <div className="font-headline text-5xl text-primary font-semibold">
                        {inLog && !outLog
                          ? "현재 입실 중"
                          : outLog
                          ? "퇴실 완료"
                          : "입실 전"}
                      </div>
                    </div>
                    {inLog && !outLog && (
                      <div className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full font-label font-bold text-xs uppercase flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span>학습 진행 중</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-body text-on-surface-variant text-sm mb-2">
                      현재 세션 시간
                    </div>
                    <div className="font-headline text-6xl text-on-surface">
                      {duration.display.substring(0, 5)}
                      <span className="text-3xl text-on-surface-variant">
                        :{duration.display.substring(6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                  <StatCard
                    icon="event_available"
                    label="이번 달 총 참여"
                    value={String(stats.monthlySessions)}
                    unit="회"
                  />
                  <StatCard
                    icon="timer"
                    label="누적 학습 시간"
                    value={`${Math.floor(stats.totalMinutes / 60)}`}
                    unit={`시간 ${stats.totalMinutes % 60} 분`}
                  />
                  <StatCard
                    icon="schedule"
                    label="평균 입실 시간"
                    value={stats.avgEntryTime}
                    unit=""
                  />
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Records */}
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-body font-semibold text-on-surface text-lg">
                      최근 기록
                    </h3>
                    <button className="text-primary font-label uppercase text-xs font-bold hover:text-primary-container">
                      전체 보기
                    </button>
                  </div>
                  <div className="space-y-6">
                    <LogRow
                      icon="login"
                      iconBg="bg-primary/10 text-primary"
                      title="오늘 입실"
                      date={dateLabel}
                      time={formatTime(inLog)}
                    />
                    <LogRow
                      icon="logout"
                      iconBg="bg-outline-variant/30 text-on-surface-variant"
                      title="오늘 퇴실"
                      date={dateLabel}
                      time={formatTime(outLog)}
                    />
                  </div>
                </div>

                {/* Weekly Chart Placeholder */}
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col">
                  <h3 className="font-body font-semibold text-on-surface text-lg mb-6">
                    주간 학습 시간
                  </h3>
                  <div className="flex-1 flex items-end space-x-4 h-48 mt-auto">
                    {["월", "화", "수", "목", "금", "오늘", "일"].map(
                      (day, idx) => {
                        const heights = [
                          "50%", "75%", "60%", "80%", "40%", "100%", "10%",
                        ];
                        const isActive = day === "오늘";
                        return (
                          <div
                            key={day}
                            className="flex flex-col items-center flex-1"
                          >
                            <div
                              className={`w-full rounded-t-sm ${
                                isActive
                                  ? "bg-primary shadow-[0_0_15px_rgba(35,66,42,0.2)]"
                                  : idx === 6
                                  ? "bg-surface-variant opacity-50"
                                  : "bg-surface-container-highest"
                              }`}
                              style={{ height: heights[idx] }}
                            ></div>
                            <span
                              className={`font-label text-xs mt-2 uppercase ${
                                isActive
                                  ? "text-primary font-bold"
                                  : "text-on-surface-variant"
                              }`}
                            >
                              {day}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Calendar */}
              <MonthlyAttendance selectedDate={selectedDate} />
            </>
          ) : (
            /* ===== PAST DATE VIEW ===== */
            <>
              <div className="mb-4">
                <p className="font-label text-sm uppercase tracking-widest text-primary-container font-bold mb-2">
                  일일 기록
                </p>
                <h2 className="font-headline text-4xl md:text-5xl font-semibold text-on-surface leading-tight">
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                  학습 요약
                </h2>
              </div>

              {/* Entry / Exit / Total cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Entry Time */}
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span
                      className="material-symbols-outlined text-6xl text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      login
                    </span>
                  </div>
                  <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">
                    입실 시간 (Entry Time)
                  </p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <h3 className="font-headline text-5xl font-medium text-primary">
                      {formatTime(inLog)}
                    </h3>
                  </div>
                  <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        schedule
                      </span>
                      {dateLabel} ({weekday})
                    </p>
                  </div>
                </div>

                {/* Exit Time */}
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span
                      className="material-symbols-outlined text-6xl text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      logout
                    </span>
                  </div>
                  <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">
                    퇴실 시간 (Exit Time)
                  </p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <h3 className="font-headline text-5xl font-medium text-secondary">
                      {formatTime(outLog)}
                    </h3>
                  </div>
                  <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        done_all
                      </span>
                      {outLog ? "일일 목표 완료" : "퇴실 기록 없음"}
                    </p>
                  </div>
                </div>

                {/* Total Study Time */}
                <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 shadow-lg text-on-primary flex flex-col justify-between relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10 mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "radial-gradient(#ffffff 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-label text-xs uppercase tracking-wider text-on-primary/80 font-bold">
                        총 학습 시간 (Total Time)
                      </p>
                      <span className="material-symbols-outlined text-on-primary/60">
                        hourglass_top
                      </span>
                    </div>
                    <h3 className="font-headline text-5xl font-semibold mt-2">
                      {duration.h}
                      <span className="text-3xl font-medium">h</span>{" "}
                      {duration.m}
                      <span className="text-3xl font-medium">m</span>
                    </h3>
                  </div>
                  <div className="mt-8 relative z-10">
                    <div className="w-full bg-on-primary/20 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className="bg-on-primary h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((duration.h * 60 + duration.m) / 180) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="font-body text-xs text-on-primary/80 text-right">
                      목표 3시간 대비{" "}
                      {Math.min(
                        100,
                        Math.round(
                          ((duration.h * 60 + duration.m) / 180) * 100
                        )
                      )}
                      % 달성
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-3xl text-secondary/40 mb-4">
                  format_quote
                </span>
                <p className="font-headline text-xl text-on-surface italic leading-relaxed">
                  "지속적인 노력은 천재성을 이깁니다. 오늘 집중한 시간은
                  내일의 흔들리지 않는 기초가 될 것입니다."
                </p>
                <p className="font-label text-xs uppercase tracking-widest text-primary mt-6 font-bold">
                  지도교사 코멘트
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-2">
        <span className="material-symbols-outlined text-primary text-xl">
          {icon}
        </span>
        <h3 className="font-body font-semibold text-on-surface-variant text-sm">
          {label}
        </h3>
      </div>
      <div className="font-headline text-3xl text-on-surface">
        {value}
        {unit && (
          <span className="text-lg text-on-surface-variant font-body ml-1">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function LogRow({
  icon,
  iconBg,
  title,
  date,
  time,
}: {
  icon: string;
  iconBg: string;
  title: string;
  date: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
        >
          <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <div>
          <div className="font-body font-semibold text-on-surface">{title}</div>
          <div className="font-body text-xs text-on-surface-variant">
            {date}
          </div>
        </div>
      </div>
      <div className="font-headline text-xl text-on-surface">{time}</div>
    </div>
  );
}

function MonthlyAttendance({ selectedDate }: { selectedDate: Date }) {
  const monthNames = [
    "1월","2월","3월","4월","5월","6월",
    "7월","8월","9월","10월","11월","12월",
  ];

  return (
    <div className="bg-surface-container-low rounded-xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-body font-semibold text-on-surface text-lg">
          {monthNames[selectedDate.getMonth()]} 출석부
        </h3>
        <div className="flex space-x-4 text-sm font-label">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>정상</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>지각</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
            <span>결석/미대상</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 md:gap-4 text-center">
        {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
          <div
            key={d}
            className="font-label text-xs text-on-surface-variant uppercase mb-2"
          >
            {d}
          </div>
        ))}
        {/* Placeholder days - in production, this would be dynamically generated */}
        {Array.from({ length: 28 }, (_, i) => (
          <div
            key={i}
            className="py-4 flex flex-col items-center justify-center"
          >
            <span className="font-body text-sm">{i + 1}</span>
            {i < 20 && (
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  i % 7 === 4
                    ? "bg-secondary"
                    : i % 7 === 5 || i % 7 === 6
                    ? "bg-outline-variant"
                    : "bg-primary"
                }`}
              ></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
