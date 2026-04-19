"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface AttendanceRecord {
  id: string;
  date: string; // ISO String
  status: "출석" | "미출석" | "미퇴실";
  entryTime: string | null;
  exitTime: string | null;
  studyMins: number;
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalStudyMins, setTotalStudyMins] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !user.email?.endsWith("@hmh.or.kr"))) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchHistoryData() {
      if (!user?.email) return;
      try {
        const studentRef = collection(db, "students");
        const studentQ = query(studentRef, where("email", "==", user.email));
        const studentSnap = await getDocs(studentQ);

        if (!studentSnap.empty) {
          const studentId = studentSnap.docs[0].id;
          
          const attRef = collection(db, "attendance");
          const attQ = query(attRef, where("student_id", "==", studentId), orderBy("date", "desc"));
          const attSnap = await getDocs(attQ);

          const fetchedRecords: AttendanceRecord[] = [];
          let sessionsCount = 0;
          let studyMinsSum = 0;

          attSnap.forEach((doc) => {
            const data = doc.data();
            const dateObj = data.date.toDate();
            
            let status: AttendanceRecord["status"] = "미출석";
            let entry = null;
            let exit = null;
            let currentStudyMins = data.total_study_minutes || 0;

            if (data.entry_time) {
                const eTime = data.entry_time.toDate();
                entry = `${eTime.getHours().toString().padStart(2,"0")}:${eTime.getMinutes().toString().padStart(2,"0")} PM`;
                status = "미퇴실";
            }
            if (data.exit_time) {
                const exTime = data.exit_time.toDate();
                exit = `${exTime.getHours().toString().padStart(2,"0")}:${exTime.getMinutes().toString().padStart(2,"0")} PM`;
                status = "출석";
            }

            if (!currentStudyMins && data.entry_time && data.exit_time) {
                currentStudyMins = Math.floor((data.exit_time.toDate().getTime() - data.entry_time.toDate().getTime()) / 60000);
            }

            if (status === "출석" || status === "미퇴실") {
                sessionsCount++;
            }
            studyMinsSum += currentStudyMins;

            fetchedRecords.push({
               id: doc.id,
               date: dateObj.toISOString(),
               status,
               entryTime: entry,
               exitTime: exit,
               studyMins: currentStudyMins
            });
          });

          setRecords(fetchedRecords);
          setTotalSessions(sessionsCount);
          setTotalStudyMins(studyMinsSum);
        }
      } catch (err) {
         console.error("Error fetching history", err);
      }
    }

    if (user && !loading) {
        fetchHistoryData();
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-on-surface">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <TopNav title="출석 기록" />

        <div className="p-10 max-w-7xl mx-auto w-full flex flex-col gap-10">
          {/* Summary Header */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/15">
            <div>
              <h3 className="text-label uppercase tracking-widest text-primary-container font-bold mb-2">월간 요약</h3>
              <h2 className="text-4xl font-headline font-semibold text-on-surface mb-4">전체 기록</h2>
              <p className="text-body text-on-surface-variant max-w-md">선택한 기간의 출석 기록과 학습 시간입니다. 꾸준함은 숙련의 기초입니다.</p>
            </div>
            <div className="flex gap-6 w-full md:w-auto mt-4 md:mt-0">
              <div className="bg-surface-container-low px-6 py-4 rounded-[1rem] flex-1 md:flex-none flex flex-col justify-center border border-outline-variant/10">
                <span className="text-label text-on-surface-variant uppercase text-xs font-bold tracking-wider mb-1">총 세션</span>
                <span className="text-3xl font-headline font-medium text-primary">{totalSessions}</span>
              </div>
              <div className="bg-surface-container-low px-6 py-4 rounded-[1rem] flex-1 md:flex-none flex flex-col justify-center border border-outline-variant/10">
                <span className="text-label text-on-surface-variant uppercase text-xs font-bold tracking-wider mb-1">학습 시간</span>
                <span className="text-3xl font-headline font-medium text-primary">{Math.floor(totalStudyMins / 60)}<span className="text-lg text-primary-container/70 ml-1">h</span> {totalStudyMins % 60}<span className="text-lg text-primary-container/70 ml-1">m</span></span>
              </div>
            </div>
          </section>

          {/* Detailed Attendance Table */}
          <section className="bg-surface-container-lowest rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-outline-variant/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20">
                    <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[25%]">날짜</th>
                    <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[20%]">상태</th>
                    <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[20%]">입실 시간</th>
                    <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[20%]">퇴실 시간</th>
                    <th className="py-5 px-6 font-label uppercase tracking-widest text-[11px] text-on-surface-variant w-[15%] text-right">학습 시간</th>
                  </tr>
                </thead>
                <tbody className="font-body text-sm divide-y divide-outline-variant/10">
                   {records.map((record) => {
                      const d = new Date(record.date);
                      const dayName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][d.getDay()];
                      const dateString = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
                      
                      let statusClasses = "";
                      if (record.status === "출석") {
                        statusClasses = "bg-[#c7ecca] text-[#02210c] border-[#abd0af]/50";
                      } else if (record.status === "미퇴실") {
                        statusClasses = "bg-orange-100 text-orange-800 border-orange-200";
                      } else {
                        statusClasses = "bg-error-container text-on-error-container border-error/20";
                      }

                      return (
                        <tr key={record.id} className="hover:bg-surface-container-low/50 transition-colors group">
                            <td className="py-5 px-6">
                            <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">{dateString}</span>
                                <span className="text-xs text-on-surface-variant">{dayName}</span>
                            </div>
                            </td>
                            <td className="py-5 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClasses}`}>
                                {record.status}
                            </span>
                            </td>
                            <td className="py-5 px-6 text-on-surface-variant font-medium group-hover:text-on-surface transition-colors">{record.entryTime || "--:--"}</td>
                            <td className="py-5 px-6 text-on-surface-variant font-medium group-hover:text-on-surface transition-colors">{record.exitTime || "--:--"}</td>
                            <td className="py-5 px-6 text-right font-headline text-primary font-medium text-base">{Math.floor(record.studyMins / 60)}h {record.studyMins % 60}m</td>
                        </tr>
                      )
                   })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="h-10"></div>
        </div>
      </main>
    </div>
  );
}
