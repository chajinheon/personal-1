"use client";

import { useMemo, useState } from "react";
import type { StudentIdSource } from "@/hooks/useResolvedStudentId";
import { isStudentId, normalizeStudentId } from "@/lib/student-id";

interface StudentAccessPanelProps {
  email?: string | null;
  source: StudentIdSource;
  resolvedStudentId: string;
  studentName?: string;
  draftStudentId: string;
  onDraftChange: (value: string) => void;
  onSave: (value: string) => boolean;
  onClear: () => void;
}

export default function StudentAccessPanel({
  email,
  source,
  resolvedStudentId,
  studentName,
  draftStudentId,
  onDraftChange,
  onSave,
  onClear,
}: StudentAccessPanelProps) {
  const [feedback, setFeedback] = useState("");

  const helperText = useMemo(() => {
    if (source === "email") {
      return "학교 계정 이메일에서 학번을 자동으로 인식했습니다.";
    }
    if (source === "manual") {
      return "저장된 학번으로 조회 중입니다. 다른 학번이 필요하면 아래에서 바꿀 수 있습니다.";
    }
    return "이메일에서 학번을 찾지 못했습니다. 5자리 학번을 입력해 주세요.";
  }, [source]);

  const handleSave = () => {
    const nextStudentId = normalizeStudentId(draftStudentId);
    if (!isStudentId(nextStudentId)) {
      setFeedback("학번 5자리를 입력해 주세요.");
      return;
    }

    const saved = onSave(nextStudentId);
    setFeedback(saved ? "학번을 저장했습니다." : "학번을 저장하지 못했습니다.");
  };

  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Student Access
          </p>
          <h3 className="font-headline text-2xl font-semibold text-on-surface">
            {studentName ? `${studentName} 학생 조회 중` : "조회 대상 확인"}
          </h3>
          <p className="text-sm text-on-surface-variant">{helperText}</p>
          <p className="text-xs text-on-surface-variant">
            현재 계정: {email || "익명 조회"}
            {" · "}
            현재 학번: {resolvedStudentId || "미설정"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="학번 5자리"
            value={draftStudentId}
            onChange={(event) => {
              setFeedback("");
              onDraftChange(normalizeStudentId(event.target.value));
            }}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-40"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition hover:opacity-90"
          >
            학번 저장
          </button>
          {source === "manual" && (
            <button
              type="button"
              onClick={() => {
                setFeedback("");
                onClear();
              }}
              className="rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
            >
              저장 해제
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <p className="mt-3 text-sm font-semibold text-primary">{feedback}</p>
      )}
    </section>
  );
}
