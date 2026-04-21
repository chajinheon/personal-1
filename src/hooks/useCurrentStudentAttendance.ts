"use client";

import { useAuth } from "@/components/AuthProvider";
import { useResolvedStudentId } from "@/hooks/useResolvedStudentId";
import { useStudentAttendance } from "@/hooks/useStudentAttendance";

export function useCurrentStudentAttendance() {
  const { user, loading: authLoading } = useAuth();
  const resolvedStudentId = useResolvedStudentId(user?.email);
  const activeStudentId = authLoading ? "" : resolvedStudentId.studentId;
  const attendance = useStudentAttendance(activeStudentId);

  return {
    user,
    authLoading,
    activeStudentId,
    ...resolvedStudentId,
    ...attendance,
  };
}
