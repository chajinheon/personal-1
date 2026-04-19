"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Login() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && user.email?.endsWith("@hmh.or.kr")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: "hmh.or.kr", // Restrict to specific domain
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // Additional domain check just in case
      if (email && !email.endsWith("@hmh.or.kr")) {
        await auth.signOut();
        setError("효명고등학교(@hmh.or.kr) 계정으로만 로그인할 수 있습니다.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("로그인 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-on-surface">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <div className="bg-surface-container-lowest rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-outline-variant/15">
        <div className="font-headline font-bold text-3xl tracking-widest text-primary mb-2">
          MAKE
        </div>
        <div className="text-xs uppercase tracking-wider text-on-surface-variant border border-outline-variant/30 px-3 py-1 rounded-md inline-block mb-8">
          Hyomyeong High School
        </div>

        <h2 className="text-xl mb-6 text-on-surface font-semibold font-body">
          학생 자기주도학습 시스템
        </h2>

        {error && (
          <div className="text-error text-sm mb-4 font-body">{error}</div>
        )}

        <button
          onClick={handleLogin}
          className="w-full py-4 bg-primary text-on-primary border-none rounded-xl text-base font-bold cursor-pointer hover:bg-primary-container transition-colors"
        >
          Google 계정으로 로그인
        </button>

        <p className="mt-6 text-xs text-on-surface-variant font-body">
          @hmh.or.kr 도메인 계정만 사용 가능합니다.
        </p>
      </div>
    </div>
  );
}

