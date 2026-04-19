export const STUDENT_ID_STORAGE_KEY = "personal-attendance-student-id";

export function normalizeStudentId(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 5);
}

export function isStudentId(value?: string | null): boolean {
  return /^\d{5}$/.test(value ?? "");
}

export function deriveStudentIdFromEmail(email?: string | null): string {
  const prefix = (email ?? "").split("@")[0] ?? "";
  return isStudentId(prefix) ? prefix : "";
}
