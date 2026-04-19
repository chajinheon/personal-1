"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  AttendanceLogRecord,
  groupAttendanceSessions,
} from "@/lib/attendance";
import { isStudentId } from "@/lib/student-id";

interface StudentProfile {
  id: string;
  studentId: string;
  name?: string;
  grade?: string | number;
}

export function useStudentAttendance(studentId: string) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [logs, setLogs] = useState<AttendanceLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isStudentId(studentId)) {
      setStudentProfile(null);
      setLogs([]);
      setLoading(false);
      setError("");
      return;
    }

    let isActive = true;
    setLoading(true);
    setError("");

    const loadStudentProfile = async () => {
      try {
        const directSnap = await getDoc(doc(db, "students", studentId));
        if (!isActive) return;

        if (directSnap.exists()) {
          setStudentProfile({
            id: directSnap.id,
            ...(directSnap.data() as Omit<StudentProfile, "id">),
          });
          return;
        }

        const fallbackSnap = await getDocs(
          query(
            collection(db, "students"),
            where("studentId", "==", studentId),
            limit(1)
          )
        );

        if (!isActive) return;

        if (!fallbackSnap.empty) {
          const profileDoc = fallbackSnap.docs[0];
          setStudentProfile({
            id: profileDoc.id,
            ...(profileDoc.data() as Omit<StudentProfile, "id">),
          });
          return;
        }

        setStudentProfile(null);
      } catch (profileError) {
        console.error("[StudentAttendance] Failed to load student profile:", profileError);
        if (isActive) {
          setStudentProfile(null);
        }
      }
    };

    void loadStudentProfile();

    const unsubscribe = onSnapshot(
      query(collection(db, "attendance_logs"), where("studentId", "==", studentId)),
      (snapshot) => {
        if (!isActive) return;

        const nextLogs = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<AttendanceLogRecord, "id">),
            }) as AttendanceLogRecord
        );

        setLogs(nextLogs);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("[StudentAttendance] Failed to load attendance logs:", snapshotError);
        if (!isActive) return;

        setError("출석 데이터를 불러오지 못했습니다.");
        setLogs([]);
        setLoading(false);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [studentId]);

  const sessions = useMemo(() => groupAttendanceSessions(logs), [logs]);

  return {
    studentProfile,
    logs,
    sessions,
    loading,
    error,
  };
}
