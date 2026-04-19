import type { Timestamp } from "firebase/firestore";

export type AttendanceEntryType = "checkin" | "checkout";
export type AttendanceSessionStatus =
  | "completed"
  | "in_progress"
  | "missing_checkout";

export interface AttendanceLogRecord {
  id: string;
  studentId: string;
  studentName?: string;
  date?: string;
  entryType?: AttendanceEntryType;
  studyDuration?: number | string;
  autoCheckout?: boolean;
  grade?: number | string;
  timestamp?: Timestamp | { toDate: () => Date } | null;
}

export interface AttendanceSession {
  key: string;
  date: string;
  studentId: string;
  studentName?: string;
  checkin: AttendanceLogRecord | null;
  checkout: AttendanceLogRecord | null;
  autoCheckout: AttendanceLogRecord | null;
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getLogTimestamp(log?: AttendanceLogRecord | null): Date | null {
  if (!log?.timestamp) return null;
  if (typeof log.timestamp.toDate === "function") {
    return log.timestamp.toDate();
  }
  return null;
}

export function getLogEntryType(log: AttendanceLogRecord): AttendanceEntryType {
  if (log.entryType === "checkout") return "checkout";
  if (log.id.endsWith("_out")) return "checkout";
  return "checkin";
}

export function getLogDateKey(log: AttendanceLogRecord): string {
  if (log.date && DATE_KEY_PATTERN.test(log.date)) {
    return log.date;
  }

  const idMatch = log.id.match(/_(\d{4}-\d{2}-\d{2})(?:_|$)/);
  if (idMatch) {
    return idMatch[1];
  }

  const timestamp = getLogTimestamp(log);
  return timestamp ? formatDateKey(timestamp) : "";
}

export function parseStudyDurationMinutes(
  value?: number | string | null
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value !== "string") return 0;

  const text = value.trim();
  if (!text) return 0;

  const colonMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (colonMatch) {
    const hours = Number(colonMatch[1] ?? 0);
    const minutes = Number(colonMatch[2] ?? 0);
    return Math.max(0, hours * 60 + minutes);
  }

  const hourMatch = text.match(/(\d+)\s*시간/);
  const minuteMatch = text.match(/(\d+)\s*분/);
  if (hourMatch || minuteMatch) {
    const hours = Number(hourMatch?.[1] ?? 0);
    const minutes = Number(minuteMatch?.[1] ?? 0);
    return Math.max(0, hours * 60 + minutes);
  }

  const numericMatch = text.match(/^\d+$/);
  if (numericMatch) {
    return Number(text);
  }

  return 0;
}

export function formatMinutesLabel(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  return `${minutes}분`;
}

export function getSessionExitLog(
  session: AttendanceSession
): AttendanceLogRecord | null {
  return session.checkout ?? session.autoCheckout ?? null;
}

export function getSessionCompletedMinutes(session: AttendanceSession): number {
  const explicitDuration =
    session.checkout?.studyDuration ?? session.autoCheckout?.studyDuration;
  const parsedDuration = parseStudyDurationMinutes(explicitDuration);
  if (parsedDuration > 0) {
    return parsedDuration;
  }

  const checkinTime = getLogTimestamp(session.checkin);
  const checkoutTime = getLogTimestamp(getSessionExitLog(session));

  if (!checkinTime || !checkoutTime) return 0;

  return Math.max(
    0,
    Math.floor((checkoutTime.getTime() - checkinTime.getTime()) / 60000)
  );
}

export function getSessionStatus(
  session: AttendanceSession,
  now = new Date()
): AttendanceSessionStatus {
  if (session.checkout) return "completed";
  if (session.autoCheckout) return "missing_checkout";
  if (session.date < formatDateKey(now)) return "missing_checkout";
  return "in_progress";
}

export function getSessionDurationDisplay(
  session: AttendanceSession,
  now = new Date()
): string {
  const status = getSessionStatus(session, now);
  const explicitDuration =
    session.checkout?.studyDuration ?? session.autoCheckout?.studyDuration;
  if (typeof explicitDuration === "string" && explicitDuration.trim()) {
    return explicitDuration;
  }

  const completedMinutes = getSessionCompletedMinutes(session);
  if (completedMinutes > 0) {
    return formatMinutesLabel(completedMinutes);
  }

  const checkinTime = getLogTimestamp(session.checkin);
  if (!checkinTime) return "--";

  if (status === "missing_checkout") {
    const endOfDay = new Date(`${session.date}T23:59:59`);
    const missedCheckoutMinutes = Math.max(
      0,
      Math.floor((endOfDay.getTime() - checkinTime.getTime()) / 60000)
    );
    return formatMinutesLabel(missedCheckoutMinutes);
  }

  const liveMinutes = Math.max(
    0,
    Math.floor((now.getTime() - checkinTime.getTime()) / 60000)
  );
  return formatMinutesLabel(liveMinutes);
}

function pickEarlierLog(
  currentLog: AttendanceLogRecord | null,
  nextLog: AttendanceLogRecord
): AttendanceLogRecord {
  const currentTime = getLogTimestamp(currentLog)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const nextTime = getLogTimestamp(nextLog)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return nextTime <= currentTime ? nextLog : (currentLog ?? nextLog);
}

function pickLaterLog(
  currentLog: AttendanceLogRecord | null,
  nextLog: AttendanceLogRecord
): AttendanceLogRecord {
  const currentTime = getLogTimestamp(currentLog)?.getTime() ?? -1;
  const nextTime = getLogTimestamp(nextLog)?.getTime() ?? -1;

  return nextTime >= currentTime ? nextLog : (currentLog ?? nextLog);
}

export function groupAttendanceSessions(
  logs: AttendanceLogRecord[]
): AttendanceSession[] {
  const sessions = new Map<string, AttendanceSession>();

  for (const log of logs) {
    const dateKey = getLogDateKey(log);
    if (!dateKey) continue;

    const sessionKey = `${log.studentId}_${dateKey}`;
    const session = sessions.get(sessionKey) ?? {
      key: sessionKey,
      date: dateKey,
      studentId: log.studentId,
      studentName: log.studentName,
      checkin: null,
      checkout: null,
      autoCheckout: null,
    };

    if (getLogEntryType(log) === "checkout") {
      if (log.autoCheckout) {
        session.autoCheckout = pickLaterLog(session.autoCheckout, log);
      } else {
        session.checkout = pickLaterLog(session.checkout, log);
      }
    } else {
      session.checkin = pickEarlierLog(session.checkin, log);
    }

    session.studentName = log.studentName ?? session.studentName;
    sessions.set(sessionKey, session);
  }

  return [...sessions.values()].sort((left, right) => {
    const leftTime =
      getLogTimestamp(left.checkout)?.getTime() ??
      getLogTimestamp(left.autoCheckout)?.getTime() ??
      getLogTimestamp(left.checkin)?.getTime() ??
      0;
    const rightTime =
      getLogTimestamp(right.checkout)?.getTime() ??
      getLogTimestamp(right.autoCheckout)?.getTime() ??
      getLogTimestamp(right.checkin)?.getTime() ??
      0;

    return rightTime - leftTime;
  });
}
