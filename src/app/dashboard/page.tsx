"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [entryTime, setEntryTime] = useState("--:--");
  const [exitTime, setExitTime] = useState("--:--");
  const [studyHours, setStudyHours] = useState("--");
  const [studyMins, setStudyMins] = useState("--");
  const [aiMessage, setAiMessage] = useState("데이터를 불러오는 중입니다...");

  useEffect(() => {
    if (!loading && (!user || !user.email?.endsWith("@hmh.or.kr"))) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.email) return;

      try {
        const studentRef = collection(db, "students");
        const studentQ = query(studentRef, where("email", "==", user.email));
        const studentSnap = await getDocs(studentQ);

        if (!studentSnap.empty) {
          const studentData = studentSnap.docs[0].data();
          const studentId = studentSnap.docs[0].id;

          if (studentData.ai_motivation_message) {
            setAiMessage(studentData.ai_motivation_message);
          } else {
             setAiMessage("지속적인 노력은 천재성을 이깁니다. 오늘 집중은 내일의 흔들리지 않는 기초가 될 것입니다.");
          }

          // Fetch latest attendance
          const attRef = collection(db, "attendance");
          const attQ = query(attRef, where("student_id", "==", studentId), orderBy("date", "desc"), limit(1));
          const attSnap = await getDocs(attQ);

          if (!attSnap.empty) {
            const attData = attSnap.docs[0].data();
            
            if (attData.entry_time) {
               const entryDate = attData.entry_time.toDate();
               setEntryTime(`${entryDate.getHours().toString().padStart(2, "0")}:${entryDate.getMinutes().toString().padStart(2, "0")}`);
            }

            if (attData.exit_time) {
               const exitDate = attData.exit_time.toDate();
               setExitTime(`${exitDate.getHours().toString().padStart(2, "0")}:${exitDate.getMinutes().toString().padStart(2, "0")}`);
            }

            if (attData.total_study_minutes) {
                const totalMins = attData.total_study_minutes;
                setStudyHours(Math.floor(totalMins / 60).toString());
                setStudyMins((totalMins % 60).toString());
            } else if (attData.entry_time && attData.exit_time) {
                const diffMs = attData.exit_time.toDate().getTime() - attData.entry_time.toDate().getTime();
                const diffMins = Math.floor(diffMs / 60000);
                setStudyHours(Math.floor(diffMins / 60).toString());
                setStudyMins((diffMins % 60).toString());
            }
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data", err);
        setAiMessage("지속적인 노력은 천재성을 이깁니다. 오늘 집중은 내일의 흔들리지 않는 기초가 될 것입니다.");
      }
    }

    if (user && !loading) {
      fetchDashboardData();
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
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        <TopNav title="일일 기록" />
        
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/15 pb-6">
              <div>
                <p className="font-label text-sm uppercase tracking-widest text-primary mb-2 font-bold">일일 기록</p>
                <h2 className="font-headline text-4xl md:text-5xl font-semibold text-on-surface leading-tight">오늘 학습 요약</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-surface-container-highest text-primary px-4 py-2 rounded-full font-label text-sm font-bold hover:bg-surface-variant transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  보고서 다운로드
                </button>
              </div>
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Entry Time Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] relative overflow-hidden group border border-outline-variant/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "FILL 1" }}>login</span>
                </div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">입실 시간 (Entry Time)</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <h3 className="font-headline text-5xl font-medium text-primary">{entryTime}</h3>
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                  <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                    정규 시간보다 5분 일찍 도착
                  </p>
                </div>
              </div>

              {/* Exit Time Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_-12px_rgba(27,28,25,0.06)] relative overflow-hidden group border border-outline-variant/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-secondary" style={{ fontVariationSettings: "FILL 1" }}>logout</span>
                </div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4 font-bold relative z-10">퇴실 시간 (Exit Time)</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <h3 className="font-headline text-5xl font-medium text-secondary">{exitTime}</h3>
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant/15 relative z-10">
                  <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">done_all</span>
                    일일 목표 완료
                  </p>
                </div>
              </div>

              {/* Total Study Time Card */}
              <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 shadow-[0_12px_32px_-12px_rgba(35,66,42,0.3)] text-on-primary flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label text-xs uppercase tracking-wider text-on-primary/80 font-bold">총 학습 시간 (Total Time)</p>
                    <span className="material-symbols-outlined text-on-primary/60">hourglass_top</span>
                  </div>
                  <h3 className="font-headline text-5xl font-semibold mt-2">{studyHours}<span className="text-3xl font-medium">h</span> {studyMins}<span className="text-3xl font-medium">m</span></h3>
                </div>
                <div className="mt-8 relative z-10">
                  <div className="w-full bg-on-primary/20 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-on-primary h-1.5 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <p className="font-body text-xs text-on-primary/80 text-right">주간 목표의 85% 달성</p>
                </div>
              </div>
            </div>

            {/* Secondary Content Area */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notes / Quote section */}
              <div className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-3xl text-secondary/40 mb-4">format_quote</span>
                <p className="font-headline text-xl text-on-surface italic leading-relaxed">
                  "{aiMessage}"
                </p>
                <p className="font-label text-xs uppercase tracking-widest text-primary mt-6 font-bold">지도교사 코멘트</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

