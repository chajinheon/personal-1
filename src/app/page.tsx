"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && user.email?.endsWith("@hmh.or.kr")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: "hmh.or.kr",
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (email && !email.endsWith("@hmh.or.kr")) {
        await auth.signOut();
        setError("효명고등학교(@hmh.or.kr) 계정으로만 로그인할 수 있습니다.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("구글 로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = result.user.email;
      
      if (userEmail && !userEmail.endsWith("@hmh.or.kr")) {
        await auth.signOut();
        setError("효명고등학교(@hmh.or.kr) 계정으로만 로그인할 수 있습니다.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Email login error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#FDFCFB] text-[#3A5A40]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FDFCFB] overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg mx-4 z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6"
            >
              <span className="material-symbols-outlined text-3xl text-primary font-bold">account_balance</span>
            </motion.div>
            <h1 className="font-headline text-4xl font-bold text-stone-900 mb-2 tracking-tight">The Scholarly Atelier</h1>
            <p className="font-label text-stone-500 uppercase tracking-widest text-xs font-bold">Spring Session 2024</p>
          </div>

          <AnimatePresence mode="wait">
            {!isEmailLogin ? (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google 계정으로 로그인
                </button>
                <button
                  onClick={() => setIsEmailLogin(true)}
                  className="w-full py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all active:scale-[0.98]"
                >
                  학번으로 로그인
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailLogin}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="24293@hmh.or.kr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-primary/20"
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmailLogin(false)}
                  className="w-full py-2 text-stone-400 text-sm font-medium hover:text-stone-600 transition-colors"
                >
                  뒤로 가기
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <div className="mt-10 pt-8 border-t border-stone-100 text-center">
            <p className="text-stone-400 text-xs font-medium">
              효명고등학교 스마트 출결 시스템 v2.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

