"use client";

import { useState } from "react";
import Link from "next/link";
import { useSavedProperties } from "@/lib/useSavedProperties";
import Header from "@/components/Header";
import { useAuth } from "@/lib/useAuth";
import { useAnalyses } from "@/lib/useAnalyses";
import type { AnalysisResult } from "@/lib/calculator";

function formatYen(v: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(v)));
}

const verdictConfig = {
  excellent: { text: "text-emerald-400", label: "優良物件", icon: "🏆" },
  good:      { text: "text-blue-400",    label: "標準",     icon: "✅" },
  consider:  { text: "text-amber-400",   label: "要検討",   icon: "⚠️" },
  pass:      { text: "text-red-400",     label: "見送り",   icon: "❌" },
};

// DB物件をSavedProperty互換の形に整形
function toDisplayItem(a: { id: string; name: string; created_at: string; input: Record<string, number>; result: Record<string, unknown> }) {
  return {
    id: a.id,
    name: a.name,
    savedAt: new Date(a.created_at).toLocaleDateString("ja-JP"),
    input: a.input as unknown as import("@/lib/calculator").PropertyInput,
    result: a.result as unknown as AnalysisResult,
    source: "db" as const,
  };
}

export default function SavedPage() {
  const { user } = useAuth();
  const { items: localItems, remove: removeLocal } = useSavedProperties();
  const { items: dbItems, loading: dbLoading, remove: removeFromDb } = useAnalyses(user);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ログイン時はDB優先、未ログインはlocalStorage
  const displayItems = user
    ? dbItems.map(toDisplayItem)
    : localItems.map(i => ({ ...i, source: "local" as const }));

  function handleRemove(id: string, source: "db" | "local") {
    if (confirmId === id) {
      if (source === "db") removeFromDb(id);
      else removeLocal(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* タイトル */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">保存済み物件</h1>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            {user
              ? <><span className="text-emerald-400 text-xs">●</span> クラウド保存（{displayItems.length}件）</>
              : <><span className="text-slate-500 text-xs">●</span> ローカル保存（{displayItems.length}件 / 最大10件）</>
            }
          </p>
          {!user && (
            <p className="text-xs text-blue-400 mt-1">
              <Link href="/login" className="underline hover:no-underline">ログインするとクラウドに保存</Link>されどこでも参照できます
            </p>
          )}
        </div>

        {/* ローディング（DB取得中） */}
        {user && dbLoading && (
          <div className="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
        )}

        {/* 空状態 */}
        {!dbLoading && displayItems.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-16 text-center">
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏠</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">まだ物件が保存されていません</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              気になる物件を分析して保存しましょう。<br />
              複数の物件を比較検討できます。
            </p>
            <Link href="/analyze"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/30">
              <span>📊</span>
              <span>最初の物件を分析する</span>
            </Link>
            <p className="text-slate-600 text-xs mt-4">無料・登録不要</p>
          </div>
        )}

        {/* 物件一覧 */}
        {!dbLoading && displayItems.length > 0 && (
          <div className="space-y-4">
            {/* テーブルヘッダー（デスクトップ） */}
            <div className="hidden sm:grid grid-cols-7 gap-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-2">物件名</div>
              <div className="text-right">価格</div>
              <div className="text-right">表面利回り</div>
              <div className="text-right">月間CF</div>
              <div className="text-right">スコア</div>
              <div/>
            </div>

            {displayItems.map((p) => {
              const vc = verdictConfig[p.result.verdict];
              const cfPlus = p.result.monthlyCashFlow >= 0;
              return (
                <div key={p.id}
                  className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all">

                  {/* モバイルレイアウト */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-white text-base">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.savedAt}保存</div>
                      </div>
                      <span className={`text-sm font-bold ${vc.text}`}>{vc.icon} {vc.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">物件価格</div>
                        <div className="text-sm font-bold text-white">{p.input.propertyPrice.toLocaleString()}万</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">表面利回り</div>
                        <div className="text-sm font-bold text-emerald-400">{p.result.grossYield.toFixed(1)}%</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">月間CF</div>
                        <div className={`text-sm font-bold ${cfPlus ? "text-emerald-400" : "text-red-400"}`}>
                          {cfPlus ? "+" : "−"}{formatYen(p.result.monthlyCashFlow)}円
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">スコア</span>
                        <span className={`text-xl font-bold ${vc.text}`}>{p.result.score}点</span>
                      </div>
                      <button onClick={() => handleRemove(p.id, p.source)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          confirmId === p.id
                            ? "bg-red-500/20 border-red-400/40 text-red-300"
                            : "border-white/10 text-slate-400 hover:border-red-400/40 hover:text-red-400"
                        }`}>
                        {confirmId === p.id ? "本当に削除？" : "削除"}
                      </button>
                    </div>
                  </div>

                  {/* デスクトップレイアウト */}
                  <div className="hidden sm:grid grid-cols-7 gap-3 items-center">
                    <div className="col-span-2">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.savedAt}保存</div>
                    </div>
                    <div className="text-right text-white text-sm font-medium">
                      {p.input.propertyPrice.toLocaleString()}万円
                    </div>
                    <div className="text-right text-emerald-400 font-bold">
                      {p.result.grossYield.toFixed(2)}%
                    </div>
                    <div className={`text-right font-bold ${cfPlus ? "text-emerald-400" : "text-red-400"}`}>
                      {cfPlus ? "+" : "−"}{formatYen(p.result.monthlyCashFlow)}円
                    </div>
                    <div className={`text-right font-bold text-lg ${vc.text}`}>
                      {p.result.score}点
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => handleRemove(p.id, p.source)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          confirmId === p.id
                            ? "bg-red-500/20 border-red-400/40 text-red-300"
                            : "border-white/10 text-slate-400 hover:border-red-400/40 hover:text-red-400"
                        }`}>
                        {confirmId === p.id ? "本当に削除？" : "削除"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 比較サマリー（2件以上の場合） */}
        {displayItems.length >= 2 && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">📊 保存物件の比較サマリー</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "最高スコア", value: `${Math.max(...displayItems.map(p => p.result.score))}点`, color: "text-emerald-400" },
                { label: "最高利回り", value: `${Math.max(...displayItems.map(p => p.result.grossYield)).toFixed(1)}%`, color: "text-blue-400" },
                { label: "最高CF（月間）", value: `+${formatYen(Math.max(...displayItems.map(p => p.result.monthlyCashFlow)))}円`, color: "text-amber-400" },
                { label: "保存件数", value: `${displayItems.length}件`, color: "text-slate-300" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-white/5 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-slate-600">
            ⚠️ 保存データはこのブラウザのみに保存されます。投資判断はご自身の責任で行ってください。
          </p>
        </div>
      </footer>
    </div>
  );
}
