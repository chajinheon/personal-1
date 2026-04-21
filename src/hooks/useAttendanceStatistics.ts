"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/firebase";
import { AttendanceLogRecord, groupAttendanceSessions } from "@/lib/attendance";
import {
  StudentAttendanceStatistics,
  buildStudentAttendanceStatistics,
} from "@/lib/attendance-statistics";
import type { AttendanceSession } from "@/lib/attendance";

const EMPTY_STATS: StudentAttendanceStatistics = {
  totalStudyMinutes: 0,
  monthlyStudyMinutes: 0,
  monthlyAttendanceCount: 0,
  monthlyAttendanceRate: {
    attendedDays: 0,
    operationalDays: 0,
    rate: 0,
  },
  averageDailyStudy: {
    averageMinutes: 0,
    studiedDays: 0,
    totalMinutes: 0,
  },
  streak: 0,
  averageEntryTime: "--:--",
  weeklyStudySeries: [],
};

export function useAttendanceStatistics(args: {
  enabled: boolean;
  studentSessions: AttendanceSession[];
  referenceDate: Date;
  now?: Date;
}) {
  const { enabled, studentSessions, referenceDate, now = new Date() } = args;
  const [allLogs, setAllLogs] = useState<AttendanceLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setAllLogs([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      query(collection(db, "attendance_logs")),
      (snapshot) => {
        const nextLogs = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<AttendanceLogRecord, "id">),
            }) as AttendanceLogRecord
        );

        setAllLogs(nextLogs);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("[AttendanceStatistics] Failed to load attendance logs:", snapshotError);
        setAllLogs([]);
        setLoading(false);
        setError("통계 데이터를 불러오지 못했습니다.");
      }
    );

    return () => unsubscribe();
  }, [enabled]);

  const allSessions = useMemo(() => groupAttendanceSessions(allLogs), [allLogs]);

  const stats = useMemo(() => {
    if (!enabled) return EMPTY_STATS;

    return buildStudentAttendanceStatistics({
      studentSessions,
      allSessions,
      referenceDate,
      now,
    });
  }, [allSessions, enabled, now, referenceDate, studentSessions]);

  return {
    stats,
    loading,
    error,
  };
}
