"use client";

import { useState } from "react";
import Link from "next/link";
import { useSavedProperties } from "@/lib/useSavedProperties";

function formatYen(v: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(v)));
}

const verdictConfig = {
  excellent: { text: "text-emerald-400", label: "優良物件", icon: "🏆" },
  good:      { text: "text-blue-400",    label: "標準",     icon: "✅" },
  consider:  { text: "text-amber-400",   label: "要検討",   icon: "⚠️" },
  pass:      { text: "text-red-400",     label: "見送り",   icon: "❌" },
};

export default function SavedPage() {
  const { items, remove } = useSavedProperties();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleRemove(id: string) {
    if (confirmId === id) {
      remove(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">

      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-white text-lg">不動産投資分析ツール</span>
          </Link>
          <Link href="/analyze"
            className="bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 text-blue-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            ＋ 新しい物件を分析
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* タイトル */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">保存済み物件</h1>
          <p className="text-slate-400 text-sm">
            {items.length > 0 ? `${items.length}件 / 最大10件` : "保存された物件はありません"}
          </p>
        </div>

        {/* 空状態 */}
        {items.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-slate-300 font-semibold mb-2">まだ物件が保存されていません</p>
            <p className="text-slate-500 text-sm mb-6">分析結果の「この物件を保存する」ボタンから保存できます</p>
            <Link href="/analyze"
              className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              物件を分析する
            </Link>
          </div>
        )}

        {/* 物件一覧 */}
        {items.length > 0 && (
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

            {items.map((p) => {
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
                      <div className="flex gap-2">
                        <button onClick={() => handleRemove(p.id)}
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
                      <button onClick={() => handleRemove(p.id)}
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
        {items.length >= 2 && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">📊 保存物件の比較サマリー</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "最高スコア", value: `${Math.max(...items.map(p => p.result.score))}点`, color: "text-emerald-400" },
                { label: "最高利回り", value: `${Math.max(...items.map(p => p.result.grossYield)).toFixed(1)}%`, color: "text-blue-400" },
                { label: "最高CF（月間）", value: `+${formatYen(Math.max(...items.map(p => p.result.monthlyCashFlow)))}円`, color: "text-amber-400" },
                { label: "保存件数", value: `${items.length} / 10件`, color: "text-slate-300" },
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

      {/* フッター */}
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
