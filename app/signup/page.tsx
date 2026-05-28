"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message.includes("already") ? "このメールアドレスは既に登録されています。" : "登録に失敗しました。もう一度お試しください。");
    } else {
      setDone(true);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/analyze` },
    });
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">✉️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">確認メールを送信しました</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              <span className="text-white font-medium">{email}</span> に確認メールを送りました。<br />
              メール内のリンクをクリックして登録を完了してください。
            </p>
            <Link href="/login"
              className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              ログインページへ
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">新規登録</h1>
            <p className="text-slate-400 text-sm">無料アカウントで分析が無制限に</p>
          </div>

          {/* Googleログイン */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl mb-4 transition-colors disabled:opacity-60">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "リダイレクト中..." : "Googleで登録"}
          </button>

          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-white/10"/>
            <span className="text-slate-500 text-xs">またはメールで</span>
            <div className="flex-1 border-t border-white/10"/>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">メールアドレス</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-400/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">パスワード（6文字以上）</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-400/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"/>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
              {loading ? "登録中..." : "無料で登録する"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            既にアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">ログイン</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
