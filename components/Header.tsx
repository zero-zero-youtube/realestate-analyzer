"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/analyze", label: "物件を分析する" },
  { href: "/saved",   label: "保存済み物件" },
  { href: "/guide",   label: "使い方" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <span className="text-2xl">🏠</span>
          <span className="font-bold text-white text-lg leading-tight hidden sm:block">不動産投資分析ツール</span>
          <span className="font-bold text-white text-base leading-tight sm:hidden">不動産分析</span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden sm:flex items-center gap-1">
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
                  {l.href === "/analyze" && "📊 "}{l.href === "/saved" && "💾 "}{l.href === "/guide" && "📖 "}
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
