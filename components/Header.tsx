"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

const navLinks = [
  { href: "/analyze", label: "物件を分析する" },
  { href: "/saved",   label: "保存済み物件" },
  { href: "/guide",   label: "使い方" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <span className="text-2xl">🏠</span>
          <span className="font-bold text-white text-lg leading-tight hidden sm:block">不動産投資分析ツール</span>
          <span className="font-bold text-white text-base leading-tight sm:hidden">不動産分析</span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* 認証エリア（デスクトップ） */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {loading ? (
            <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse"/>
          ) : user ? (
            <>
              <span className="text-xs text-slate-400 max-w-[140px] truncate">{user.email}</span>
              <button onClick={signOut}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-sm px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-medium">
                ログイン
              </Link>
              <Link href="/signup"
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors">
                新規登録
              </Link>
            </>
          )}
        </div>

        {/* ハンバーガー（スマホ） */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="メニューを開く">
          <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${open ? "rotate-45 translate-y-2" : ""}`}/>
          <span className={`block w-5 h-0.5 bg-white transition-opacity duration-200 ${open ? "opacity-0" : ""}`}/>
          <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`}/>
        </button>
      </div>

      {/* モバイルメニュー */}
      {open && (
        <div className="sm:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-sm">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}>
                  {l.href === "/analyze" && "📊 "}
                  {l.href === "/saved"   && "💾 "}
                  {l.href === "/guide"   && "📖 "}
                  {l.label}
                </Link>
              );
            })}

            {/* 認証（モバイル） */}
            <div className="border-t border-white/10 pt-2 mt-1">
              {!loading && (user ? (
                <>
                  <p className="text-xs text-slate-500 px-4 py-1 truncate">{user.email}</p>
                  <button onClick={() => { signOut(); setOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/10 transition-colors">
                    🚪 ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/10 transition-colors">
                    🔑 ログイン
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-blue-300 hover:bg-blue-500/10 transition-colors">
                    ✨ 新規登録（無料）
                  </Link>
                </>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
