"use client";

import { useEffect, useMemo, useState } from "react";
import {
  STUDENT_ID_STORAGE_KEY,
  deriveStudentIdFromEmail,
  isStudentId,
  normalizeStudentId,
} from "@/lib/student-id";

export type StudentIdSource = "email" | "manual" | "missing";

export function useResolvedStudentId(email?: string | null) {
  const emailStudentId = useMemo(() => deriveStudentIdFromEmail(email), [email]);
  const [manualStudentId, setManualStudentId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fromQuery = normalizeStudentId(
      new URLSearchParams(window.location.search).get("studentId")
    );
    const fromStorage = normalizeStudentId(
      window.localStorage.getItem(STUDENT_ID_STORAGE_KEY)
    );

    const nextStudentId = isStudentId(fromQuery)
      ? fromQuery
      : isStudentId(fromStorage)
        ? fromStorage
        : "";

    if (nextStudentId) {
      window.localStorage.setItem(STUDENT_ID_STORAGE_KEY, nextStudentId);
    }

    setManualStudentId(nextStudentId);
  }, []);

  const studentId = manualStudentId || emailStudentId;
  const source: StudentIdSource = manualStudentId
      ? "manual"
      : emailStudentId
        ? "email"
        : "missing";

  const saveManualStudentId = (value: string) => {
    const nextStudentId = normalizeStudentId(value);
    if (!isStudentId(nextStudentId) || typeof window === "undefined") {
      return false;
    }

    window.localStorage.setItem(STUDENT_ID_STORAGE_KEY, nextStudentId);
    setManualStudentId(nextStudentId);
    return true;
  };

  const clearManualStudentId = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STUDENT_ID_STORAGE_KEY);
    }
    setManualStudentId("");
  };

  return {
    studentId,
    source,
    emailStudentId,
    manualStudentId,
    setManualStudentId,
    saveManualStudentId,
    clearManualStudentId,
  };
}
