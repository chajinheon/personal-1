import {
  AttendanceSession,
  formatDateKey,
  formatMinutesLabel,
  getLogTimestamp,
  getSessionCompletedMinutes,
  getSessionExitLog,
  getSessionStatus,
} from "@/lib/attendance";

export { formatMinutesLabel } from "@/lib/attendance";

export interface AttendanceRateSummary {
  attendedDays: number;
  operationalDays: number;
  rate: number;
}

export interface AttendanceAverageSummary {
  averageMinutes: number;
  studiedDays: number;
  totalMinutes: number;
}

export interface WeeklyStudyPoint {
  dateKey: string;
  label: string;
  minutes: number;
  isToday: boolean;
}

export interface StudentAttendanceStatistics {
  totalStudyMinutes: number;
  monthlyStudyMinutes: number;
  monthlyAttendanceCount: number;
  monthlyAttendanceRate: AttendanceRateSummary;
  averageDailyStudy: AttendanceAverageSummary;
  streak: number;
  averageEntryTime: string;
  weeklyStudySeries: WeeklyStudyPoint[];
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthDateKeys(referenceDate: Date): string[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    formatDateKey(new Date(year, month, index + 1))
  );
}

export function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWeekendDateKey(dateKey: string): boolean {
  return isWeekendDate(parseDateKey(dateKey));
}

export function formatTimeLabel(date: Date | null): string {
  if (!date) return "--:--";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHoursMinutesShort(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function formatPercentLabel(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function getSessionAccumulatedMinutes(
  session: AttendanceSession,
  now = new Date()
): number {
  const completedMinutes = getSessionCompletedMinutes(session);
  if (completedMinutes > 0) {
    return completedMinutes;
  }

  const checkinTime = getLogTimestamp(session.checkin);
  if (!checkinTime) return 0;

  const exitTime = getLogTimestamp(getSessionExitLog(session));
  if (exitTime) {
    return Math.max(
      0,
      Math.floor((exitTime.getTime() - checkinTime.getTime()) / 60000)
    );
  }

  const status = getSessionStatus(session, now);
  if (status === "missing_checkout") {
    const endOfDay = new Date(`${session.date}T23:59:59`);
    return Math.max(
      0,
      Math.floor((endOfDay.getTime() - checkinTime.getTime()) / 60000)
    );
  }

  return Math.max(0, Math.floor((now.getTime() - checkinTime.getTime()) / 60000));
}

function getParticipantCountsByDate(
  allSessions: AttendanceSession[]
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const session of allSessions) {
    if (!session.checkin) continue;
    counts.set(session.date, (counts.get(session.date) ?? 0) + 1);
  }

  return counts;
}

function getAttendedDateSet(studentSessions: AttendanceSession[]): Set<string> {
  return new Set(
    studentSessions.filter((session) => session.checkin).map((session) => session.date)
  );
}

function isOperationalDate(
  dateKey: string,
  participantCounts: Map<string, number>,
  now: Date
): boolean {
  if (isWeekendDateKey(dateKey)) return false;

  const todayKey = formatDateKey(now);
  if (dateKey > todayKey) {
    return true;
  }

  return (participantCounts.get(dateKey) ?? 0) >= 2;
}

export function calculateMonthlyAttendanceRate(
  studentSessions: AttendanceSession[],
  allSessions: AttendanceSession[],
  referenceDate: Date,
  now = new Date()
): AttendanceRateSummary {
  const participantCounts = getParticipantCountsByDate(allSessions);
  const attendedDates = getAttendedDateSet(studentSessions);

  let attendedDays = 0;
  let operationalDays = 0;

  for (const dateKey of getMonthDateKeys(referenceDate)) {
    if (!isOperationalDate(dateKey, participantCounts, now)) continue;

    operationalDays += 1;
    if (attendedDates.has(dateKey)) {
      attendedDays += 1;
    }
  }

  return {
    attendedDays,
    operationalDays,
    rate: operationalDays > 0 ? attendedDays / operationalDays : 0,
  };
}

export function calculateAverageDailyStudy(
  studentSessions: AttendanceSession[],
  allSessions: AttendanceSession[]
): AttendanceAverageSummary {
  const participantCounts = getParticipantCountsByDate(allSessions);

  let totalMinutes = 0;
  let studiedDays = 0;

  for (const session of studentSessions) {
    if (!session.checkin) continue;
    if (isWeekendDateKey(session.date)) continue;
    if ((participantCounts.get(session.date) ?? 0) < 2) continue;
    if (!session.checkout) continue;

    totalMinutes += getSessionCompletedMinutes(session);
    studiedDays += 1;
  }

  return {
    averageMinutes: studiedDays > 0 ? Math.round(totalMinutes / studiedDays) : 0,
    studiedDays,
    totalMinutes,
  };
}

export function calculateAttendanceStreak(
  studentSessions: AttendanceSession[],
  allSessions: AttendanceSession[],
  now = new Date()
): number {
  const participantCounts = getParticipantCountsByDate(allSessions);
  const attendedDates = getAttendedDateSet(studentSessions);
  const earliestDateKey = [...participantCounts.keys()].sort()[0];

  if (!earliestDateKey) return 0;

  const today = startOfDay(now);
  const todayKey = formatDateKey(today);
  const earliestDate = parseDateKey(earliestDateKey);

  let streak = 0;
  let cursor = today;

  while (cursor >= earliestDate) {
    const dateKey = formatDateKey(cursor);

    if (!isOperationalDate(dateKey, participantCounts, now)) {
      cursor = addDays(cursor, -1);
      continue;
    }

    if (attendedDates.has(dateKey)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    if (dateKey === todayKey) {
      cursor = addDays(cursor, -1);
      continue;
    }

    break;
  }

  return streak;
}

export function calculateAverageEntryTime(
  sessions: AttendanceSession[]
): string {
  const checkinTimes = sessions
    .map((session) => getLogTimestamp(session.checkin))
    .filter((value): value is Date => value instanceof Date);

  if (checkinTimes.length === 0) return "--:--";

  const averageMinutes = Math.round(
    checkinTimes.reduce(
      (total, date) => total + date.getHours() * 60 + date.getMinutes(),
      0
    ) / checkinTimes.length
  );

  return `${String(Math.floor(averageMinutes / 60)).padStart(2, "0")}:${String(
    averageMinutes % 60
  ).padStart(2, "0")}`;
}

export function buildWeeklyStudySeries(
  studentSessions: AttendanceSession[],
  referenceDate: Date,
  now = new Date()
): WeeklyStudyPoint[] {
  const sessionMap = new Map(
    studentSessions.map((session) => [session.date, session] as const)
  );
  const weekAnchor = startOfDay(referenceDate);
  const weekStart = addDays(weekAnchor, -((weekAnchor.getDay() + 6) % 7));
  const todayKey = formatDateKey(now);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const dateKey = formatDateKey(date);
    const session = sessionMap.get(dateKey);

    return {
      dateKey,
      label: date.toLocaleDateString("ko-KR", { weekday: "short" }).replace(".", ""),
      minutes: session ? getSessionAccumulatedMinutes(session, now) : 0,
      isToday: dateKey === todayKey,
    };
  });
}

export function buildStudentAttendanceStatistics(args: {
  studentSessions: AttendanceSession[];
  allSessions: AttendanceSession[];
  referenceDate: Date;
  now?: Date;
}): StudentAttendanceStatistics {
  const { studentSessions, allSessions, referenceDate, now = new Date() } = args;
  const monthKey = getMonthKey(referenceDate);
  const monthlySessions = studentSessions.filter((session) =>
    session.date.startsWith(monthKey)
  );

  return {
    totalStudyMinutes: studentSessions.reduce(
      (total, session) => total + getSessionAccumulatedMinutes(session, now),
      0
    ),
    monthlyStudyMinutes: monthlySessions.reduce(
      (total, session) => total + getSessionAccumulatedMinutes(session, now),
      0
    ),
    monthlyAttendanceCount: monthlySessions.filter((session) => session.checkin).length,
    monthlyAttendanceRate: calculateMonthlyAttendanceRate(
      studentSessions,
      allSessions,
      referenceDate,
      now
    ),
    averageDailyStudy: calculateAverageDailyStudy(studentSessions, allSessions),
    streak: calculateAttendanceStreak(studentSessions, allSessions, now),
    averageEntryTime: calculateAverageEntryTime(monthlySessions),
    weeklyStudySeries: buildWeeklyStudySeries(studentSessions, referenceDate, now),
  };
}
