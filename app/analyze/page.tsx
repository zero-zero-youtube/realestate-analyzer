"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { analyze, type PropertyInput, type AnalysisResult } from "@/lib/calculator";
import { useSavedProperties } from "@/lib/useSavedProperties";
import Header from "@/components/Header";
import { useAuth, getDailyUsage, incrementDailyUsage, isLimitReached } from "@/lib/useAuth";
import { useAnalyses } from "@/lib/useAnalyses";
import { trackAnalyzeProperty, trackSaveProperty, trackShareResult } from "@/lib/gtag";

const defaultInput: PropertyInput = {
  propertyPrice: 2000,
  monthlyRent: 80000,
  monthlyManagement: 8000,
  monthlyRepair: 5000,
  annualTax: 80000,
  loanAmount: 1600,
  loanRate: 1.5,
  loanYears: 35,
};

function formatYen(v: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(v)));
}

// ---- 円形ゲージ ----
function CircularGauge({ score }: { score: number }) {
  const r = 72; const cx = 92; const cy = 92;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color  = score >= 72 ? "#10b981" : score >= 55 ? "#3b82f6" : score >= 38 ? "#f59e0b" : "#ef4444";
  const lcolor = score >= 72 ? "text-emerald-400" : score >= 55 ? "text-blue-400" : score >= 38 ? "text-amber-400" : "text-red-400";
  const rank   = score >= 72 ? "優良" : score >= 55 ? "標準" : score >= 38 ? "要検討" : "見送り";
  return (
    <div className="flex flex-col items-center">
      <svg width="184" height="112" viewBox="0 0 184 112">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition:"stroke-dashoffset 0.9s ease" }}/>
      </svg>
      <div className="-mt-10 text-center">
        <div className="text-6xl font-bold text-white">{score}</div>
        <div className="text-sm text-slate-400 mt-0.5">/ 100点</div>
        <div className={`text-sm font-bold mt-1 ${lcolor}`}>{rank}</div>
      </div>
    </div>
  );
}

// ---- 判定バッジ ----
const verdictConfig = {
  excellent: { bg:"bg-emerald-500/20", border:"border-emerald-400/40", text:"text-emerald-300", icon:"🏆", desc:"優秀な投資候補です" },
  good:      { bg:"bg-blue-500/20",    border:"border-blue-400/40",    text:"text-blue-300",    icon:"✅", desc:"バランスのよい物件です" },
  consider:  { bg:"bg-amber-500/20",   border:"border-amber-400/40",   text:"text-amber-300",   icon:"⚠️", desc:"慎重な検討が必要です" },
  pass:      { bg:"bg-red-500/20",     border:"border-red-400/40",     text:"text-red-300",     icon:"❌", desc:"リスクが高い水準です" },
};
function VerdictBadge({ verdict, label }: { verdict: AnalysisResult["verdict"]; label: string }) {
  const c = verdictConfig[verdict];
  return (
    <div className={`inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl border ${c.bg} ${c.border}`}>
      <div className={`flex items-center gap-2 text-xl font-bold ${c.text}`}><span>{c.icon}</span><span>{label}</span></div>
      <div className={`text-xs ${c.text} opacity-80`}>{c.desc}</div>
    </div>
  );
}

// ---- テキスト入力フィールド ----
interface InputFieldProps { label:string; unit:string; value:number; onChange:(v:number)=>void; step?:number; min?:number; hint?:string; }
function InputField({ label, unit, value, onChange, step=1, min=0, hint }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}{hint && <span className="ml-1 text-xs text-slate-500">（{hint}）</span>}</label>
      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400/60 transition-all">
        <input type="number" value={value} min={min} step={step} onChange={(e)=>onChange(Number(e.target.value))}
          className="flex-1 px-4 py-2.5 text-right text-white bg-transparent outline-none text-base"/>
        <span className="px-3 py-2.5 text-slate-400 text-sm border-l border-white/10 whitespace-nowrap bg-white/5">{unit}</span>
      </div>
    </div>
  );
}

// ---- スライダーフィールド ----
interface SliderFieldProps { label:string; unit:string; value:number; onChange:(v:number)=>void; min:number; max:number; step:number; }
function SliderField({ label, unit, value, onChange, min, max, step }: SliderFieldProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-base font-bold text-white bg-white/10 border border-white/10 rounded-lg px-3 py-0.5 min-w-[72px] text-center">
          {value}{unit}
        </span>
      </div>
      <div className="relative flex items-center h-6">
        {/* トラック背景 */}
        <div className="absolute w-full h-1.5 rounded-full bg-white/10"/>
        {/* 塗り部分 */}
        <div className="absolute h-1.5 rounded-full bg-blue-400" style={{ width:`${pct}%` }}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e)=>onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-400
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-400
            [&::-moz-range-thumb]:cursor-pointer"/>
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ---- プリセットボタン群 ----
function PresetGroup({ label, options, onSelect }: { label:string; options:{label:string; value:number}[]; onSelect:(v:number)=>void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.label} onClick={()=>onSelect(o.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 text-slate-300
              hover:bg-blue-500/30 hover:border-blue-400/50 hover:text-blue-300 transition-all">
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- ダークサマリーカード ----
function DarkCard({ label, value, sub, color="text-white" }: { label:string; value:string; sub?:string; color?:string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ---- スコアカード（ライト） ----
function ScoreCard({ title, score, comment }: { title:string; score:number; comment:string }) {
  const c = score >= 75 ? { bar:"bg-emerald-500", text:"text-emerald-700", bg:"bg-emerald-50 border-emerald-200", lbl:"優秀" }
          : score >= 55 ? { bar:"bg-blue-500",    text:"text-blue-700",    bg:"bg-blue-50 border-blue-200",    lbl:"良好" }
          : score >= 35 ? { bar:"bg-amber-400",   text:"text-amber-700",   bg:"bg-amber-50 border-amber-200",  lbl:"普通" }
          :               { bar:"bg-red-400",     text:"text-red-700",     bg:"bg-red-50 border-red-200",      lbl:"低水準" };
  return (
    <div className={`rounded-2xl border p-5 ${c.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-700">{title}</span>
        <span className={`text-2xl font-bold ${c.text}`}>{score}<span className="text-sm font-normal text-gray-400 ml-0.5">点</span></span>
      </div>
      <div className="w-full h-2.5 bg-white/70 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${c.bar}`} style={{ width:`${score}%`, transition:"width 0.7s ease" }}/>
      </div>
      <div className={`text-xs font-semibold mb-2 ${c.text}`}>{c.lbl}</div>
      <p className="text-xs text-gray-600 leading-relaxed">{comment}</p>
    </div>
  );
}

// ---- CF棒グラフ ツールチップ ----
function CfTooltip({ active, payload }: { active?:boolean; payload?:{value:number; name:string}[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 shadow text-sm">
      <div className="font-semibold text-slate-200">{item.name}</div>
      <div className="text-white">{item.value >= 0 ? "+" : "−"}{formatYen(item.value)}円</div>
    </div>
  );
}

// ---- AI診断レポート ----
type DiagLevel = "good" | "warn" | "danger";

interface DiagItem {
  icon: string;
  label: string;
  level: DiagLevel;
  text: string;
}

function diagColors(level: DiagLevel) {
  if (level === "good")   return { border: "border-emerald-500/40", bg: "bg-emerald-500/10", badge: "bg-emerald-500/20 text-emerald-300", icon: "text-emerald-400" };
  if (level === "warn")   return { border: "border-amber-500/40",   bg: "bg-amber-500/10",   badge: "bg-amber-500/20 text-amber-300",   icon: "text-amber-400" };
  return                         { border: "border-red-500/40",     bg: "bg-red-500/10",     badge: "bg-red-500/20 text-red-300",     icon: "text-red-400" };
}

function buildDiagnosis(input: PropertyInput, result: AnalysisResult): { items: DiagItem[]; summary: string } {
  const items: DiagItem[] = [];
  const ltv = input.propertyPrice > 0 ? (input.loanAmount / input.propertyPrice) * 100 : 0;
  const equity = (input.propertyPrice - input.loanAmount) * 10000;
  const roi = equity > 0 ? (result.annualCashFlow / equity) * 100 : 0;

  // CF判定
  if (result.monthlyCashFlow >= 30000) {
    items.push({ icon: "💰", label: "キャッシュフロー", level: "good",
      text: "月間キャッシュフローが3万円以上あり、安定した収益が見込めます。空室が1〜2ヶ月続いても耐えられる水準です。" });
  } else if (result.monthlyCashFlow >= 0) {
    items.push({ icon: "💰", label: "キャッシュフロー", level: "warn",
      text: "キャッシュフローはプラスですが余裕が少ない状態です。修繕費や空室リスクに備えて資金を確保しておきましょう。" });
  } else {
    items.push({ icon: "💰", label: "キャッシュフロー", level: "danger",
      text: "ローン返済が家賃収入を上回っています。頭金を増やすか、物件価格の再交渉を検討してください。" });
  }

  // 利回り判定
  if (result.grossYield >= 8) {
    items.push({ icon: "📊", label: "表面利回り", level: "good",
      text: "表面利回りが8%以上あり、収益性の高い物件です。ただし実質利回りと管理費も必ず確認しましょう。" });
  } else if (result.grossYield >= 5) {
    items.push({ icon: "📊", label: "表面利回り", level: "warn",
      text: "利回りは標準的な水準です。エリアの空室率と将来の資産価値も考慮して判断しましょう。" });
  } else {
    items.push({ icon: "📊", label: "表面利回り", level: "danger",
      text: "利回りが低水準です。キャピタルゲイン（売却益）を見込めるエリアかどうか確認が必要です。" });
  }

  // LTV判定
  if (ltv <= 70) {
    items.push({ icon: "🏦", label: "LTV（借入比率）", level: "good",
      text: "借入比率が低く、金利上昇リスクに強い安全な水準です。" });
  } else if (ltv <= 90) {
    items.push({ icon: "🏦", label: "LTV（借入比率）", level: "warn",
      text: "借入比率はやや高めです。金利が1%上昇した場合のシミュレーションも確認しましょう。" });
  } else {
    items.push({ icon: "🏦", label: "LTV（借入比率）", level: "danger",
      text: "借入比率が非常に高い状態です。金利上昇や空室発生時のリスクを十分に理解した上で判断してください。" });
  }

  // ROI判定
  if (equity <= 0) {
    items.push({ icon: "📈", label: "ROI（自己資金利回り）", level: "warn",
      text: "自己資金がほぼゼロのフルローンです。レバレッジ効果は最大ですが、リスクも最大となります。" });
  } else if (roi >= 10) {
    items.push({ icon: "📈", label: "ROI（自己資金利回り）", level: "good",
      text: "自己資金に対するリターンが高く、レバレッジが効いた投資です。" });
  } else if (roi >= 5) {
    items.push({ icon: "📈", label: "ROI（自己資金利回り）", level: "warn",
      text: "自己資金に対するリターンは標準的な水準です。" });
  } else {
    items.push({ icon: "📈", label: "ROI（自己資金利回り）", level: "danger",
      text: "自己資金に対するリターンが低い状態です。他の投資先と比較検討することをお勧めします。" });
  }

  // 総合アドバイス
  const goodCount = items.filter(i => i.level === "good").length;
  const dangerCount = items.filter(i => i.level === "danger").length;
  let summary = "";
  if (dangerCount === 0 && goodCount >= 3) {
    summary = "全体的に非常にバランスの取れた物件です。長期保有を視野に入れた資産形成に向いています。";
  } else if (dangerCount === 0) {
    summary = "問題点は少なく、条件次第では検討に値する物件です。空室率とエリアの将来性を最終確認しましょう。";
  } else if (dangerCount === 1) {
    summary = "一部に要注意ポイントがあります。リスク要因を把握した上で、許容できるか慎重に判断してください。";
  } else {
    summary = "複数の指標で懸念点があります。条件の見直しや他の物件との比較を強くお勧めします。";
  }

  return { items, summary };
}

function AIDiagnosis({ input, result }: { input: PropertyInput; result: AnalysisResult }) {
  const { items, summary } = buildDiagnosis(input, result);
  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">🤖</span>
        <h3 className="text-sm font-bold text-white">AI診断レポート</h3>
        <span className="ml-auto text-xs bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full">ルールベース</span>
      </div>
      <p className="text-xs text-slate-500 mb-5">入力値をもとに自動生成された診断結果です。</p>

      <div className="space-y-3">
        {items.map((item) => {
          const c = diagColors(item.level);
          return (
            <div key={item.label} className={`border ${c.border} ${c.bg} rounded-xl p-4 flex gap-3`}>
              <span className={`text-xl flex-shrink-0 mt-0.5 ${c.icon}`}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${c.badge}`}>
                    {item.level === "good" ? "良好" : item.level === "warn" ? "注意" : "危険"}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 総合アドバイス */}
      <div className="mt-4 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
        <div className="text-xs font-semibold text-blue-300 mb-1">💡 総合アドバイス</div>
        <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
      </div>

      <p className="mt-4 text-xs text-slate-600 text-center">
        ⚠️ 本診断は参考情報です。投資判断はご自身の責任で行ってください。
      </p>
    </section>
  );
}

// ---- 保存セクション ----
function SaveSection({
  savedCount, onSave,
}: { savedCount: number; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const isFull = savedCount >= 10;

  function handleSave() {
    if (saved || isFull) return;
    onSave(name);
    setSaved(true);
  }

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-bold text-white mb-1">💾 この物件を保存する</h3>
      <p className="text-xs text-slate-400 mb-4">
        保存済み物件一覧で複数物件を比較できます（最大10件）
      </p>
      {saved ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-3 text-emerald-300 text-sm font-semibold text-center">
            ✓ 保存しました
          </div>
          <Link href="/saved"
            className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition-colors whitespace-nowrap">
            一覧を見る →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text" placeholder="物件名（任意）例：渋谷区 1K マンション"
            value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400/60"
          />
          <button onClick={handleSave} disabled={isFull}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
              isFull
                ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20"
            }`}>
            {isFull ? "保存上限（10件）" : "保存する"}
          </button>
        </div>
      )}
      <div className="mt-2 text-right">
        <Link href="/saved" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          保存済み物件を見る ({savedCount}件) →
        </Link>
      </div>
    </section>
  );
}

// ---- 金利シミュレーション比較 ----
function RateSimulation({ input }: { input: PropertyInput }) {
  const base = input.loanRate;
  const rates = [
    Math.max(0.5, Math.round((base - 1.0) * 10) / 10),
    Math.round(base * 10) / 10,
    Math.round((base + 1.0) * 10) / 10,
  ];

  const results = rates.map((rate) => analyze({ ...input, loanRate: rate }));

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-bold text-white mb-1">📉 金利シミュレーション比較</h3>
      <p className="text-xs text-slate-400 mb-5">金利が変化した場合のCF・スコアを比較します</p>
      <div className="grid grid-cols-3 gap-3">
        {results.map((r, i) => {
          const isActive = rates[i] === base;
          const cfPlus = r.monthlyCashFlow >= 0;
          return (
            <div key={i} className={`rounded-xl border p-4 transition-all ${
              isActive
                ? "bg-blue-500/20 border-blue-400/50"
                : "bg-white/5 border-white/10"
            }`}>
              <div className={`text-xs font-bold mb-3 ${isActive ? "text-blue-300" : "text-slate-400"}`}>
                {isActive ? "▶ 現在" : `パターン${i + 1}`}
              </div>
              <div className={`text-xl font-bold mb-3 ${isActive ? "text-blue-300" : "text-white"}`}>
                金利 {rates[i].toFixed(1)}%
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500">月間CF</div>
                  <div className={`text-sm font-bold ${cfPlus ? "text-emerald-400" : "text-red-400"}`}>
                    {cfPlus ? "+" : "−"}{new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(r.monthlyCashFlow)))}円
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">年間CF</div>
                  <div className={`text-sm font-bold ${r.annualCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {r.annualCashFlow >= 0 ? "+" : "−"}{new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(r.annualCashFlow)))}円
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">総合スコア</div>
                  <div className={`text-lg font-bold ${
                    r.score >= 72 ? "text-emerald-400" :
                    r.score >= 55 ? "text-blue-400" :
                    r.score >= 38 ? "text-amber-400" : "text-red-400"
                  }`}>{r.score}点</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- ローン期間シミュレーション比較 ----
function YearsSimulation({ input }: { input: PropertyInput }) {
  const base = input.loanYears;
  const rawYears = [base - 10, base - 5, base].map((y) => Math.max(10, Math.min(35, y)));
  // 重複除去
  const years = Array.from(new Set(rawYears)).slice(-3);
  while (years.length < 3) years.unshift(Math.max(10, years[0] - 5));

  const results = years.map((y) => analyze({ ...input, loanYears: y }));

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-bold text-white mb-1">📅 ローン期間シミュレーション比較</h3>
      <p className="text-xs text-slate-400 mb-5">返済期間が変化した場合のCF・スコアを比較します</p>
      <div className="grid grid-cols-3 gap-3">
        {results.map((r, i) => {
          const isActive = years[i] === base;
          const cfPlus = r.monthlyCashFlow >= 0;
          return (
            <div key={i} className={`rounded-xl border p-4 transition-all ${
              isActive
                ? "bg-emerald-500/20 border-emerald-400/50"
                : "bg-white/5 border-white/10"
            }`}>
              <div className={`text-xs font-bold mb-3 ${isActive ? "text-emerald-300" : "text-slate-400"}`}>
                {isActive ? "▶ 現在" : `パターン${i + 1}`}
              </div>
              <div className={`text-xl font-bold mb-3 ${isActive ? "text-emerald-300" : "text-white"}`}>
                {years[i]}年返済
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500">月間CF</div>
                  <div className={`text-sm font-bold ${cfPlus ? "text-emerald-400" : "text-red-400"}`}>
                    {cfPlus ? "+" : "−"}{new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(r.monthlyCashFlow)))}円
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">年間CF</div>
                  <div className={`text-sm font-bold ${r.annualCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {r.annualCashFlow >= 0 ? "+" : "−"}{new Intl.NumberFormat("ja-JP").format(Math.round(Math.abs(r.annualCashFlow)))}円
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">総合スコア</div>
                  <div className={`text-lg font-bold ${
                    r.score >= 72 ? "text-emerald-400" :
                    r.score >= 55 ? "text-blue-400" :
                    r.score >= 38 ? "text-amber-400" : "text-red-400"
                  }`}>{r.score}点</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- シェアセクション ----
function ShareSection({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false);

  const cfSign = result.monthlyCashFlow >= 0 ? "+" : "−";
  const cfVal  = formatYen(result.monthlyCashFlow);
  const shareText =
    `不動産物件を分析しました！\n` +
    `表面利回り ${result.grossYield.toFixed(1)}% / 月間CF ${cfSign}${cfVal}円 / 総合スコア ${result.score}点\n` +
    `判定：${result.verdictLabel}\n` +
    `#不動産投資 #資産形成 #不動産分析ツール`;

  function handleXShare() {
    trackShareResult({ method: "twitter", score: result.score });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareText).then(() => {
      trackShareResult({ method: "copy", score: result.score });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-bold text-white mb-1">📣 結果をシェアする</h3>
      <p className="text-xs text-slate-400 mb-4">分析結果をSNSでシェアしましょう</p>

      {/* プレビュー */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
        {shareText}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* X（Twitter）シェアボタン */}
        <button onClick={handleXShare}
          className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors border border-white/10">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>X（旧Twitter）でシェア</span>
        </button>

        {/* コピーボタン */}
        <button onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all border ${
            copied
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
          }`}>
          {copied ? (
            <><span>✓</span><span>コピーしました！</span></>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <span>テキストをコピー</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

// ---- メインページ ----
export default function AnalyzePage() {
  const [input, setInput] = useState<PropertyInput>(defaultInput);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const { add, count } = useSavedProperties();
  const { user } = useAuth();
  const { save: saveToDb } = useAnalyses(user);

  // 初期化時に今日の利用回数を反映
  useState(() => {
    setDailyCount(getDailyUsage().count);
    setLimitReached(!user && isLimitReached());
  });

  function set<K extends keyof PropertyInput>(key: K) {
    return (v: number) => setInput((prev) => ({ ...prev, [key]: v }));
  }

  // 頭金割合から借入額を自動計算
  function applyDownPayment(ratio: number) {
    const loan = Math.round(input.propertyPrice * (1 - ratio) / 10) * 10;
    setInput((prev) => ({ ...prev, loanAmount: Math.max(0, loan) }));
  }

  function handleAnalyze() {
    // 未ログインの場合は1日3件制限
    if (!user && isLimitReached()) {
      setLimitReached(true);
      return;
    }
    const r = analyze(input);
    setResult(r);
    trackAnalyzeProperty({ property_price: input.propertyPrice, gross_yield: r.grossYield, score: r.score });
    if (!user) {
      incrementDailyUsage();
      const { count: c } = getDailyUsage();
      setDailyCount(c);
      setLimitReached(isLimitReached());
    }
    setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior:"smooth" }), 100);
  }
  function handleReset() { setInput(defaultInput); setResult(null); }

  const radarData = result ? [
    { subject:"利回り",    value: result.yieldScore },
    { subject:"CF",        value: result.cashFlowScore },
    { subject:"LTV安全性", value: result.ltvScore },
    { subject:"安定性",    value: result.stabilityScore },
  ] : [];

  const cfData = result ? [
    { name:"家賃収入",     value: result.monthlyRent,           color:"#10b981" },
    { name:"ローン返済",   value: -result.monthlyLoanPayment,   color:"#ef4444" },
    { name:"諸経費",       value: -result.monthlyExpenses,      color:"#f59e0b" },
    { name:"手残り（CF）", value: result.monthlyCashFlow,       color: result.monthlyCashFlow >= 0 ? "#60a5fa" : "#ef4444" },
  ] : [];

  const ltvPct = input.loanAmount > 0 ? ((input.loanAmount / input.propertyPrice) * 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">

      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">

        {/* タイトル */}
        <div className="text-center pt-2 pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">物件分析</h1>
          <p className="text-slate-400 text-sm">物件情報を入力して、利回り・CF・スコアを確認しましょう</p>
        </div>

        {/* ---- 入力フォーム ---- */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-6">

          {/* 物件基本情報 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-blue-400 rounded-full"/>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">物件基本情報</h2>
            </div>
            <div className="space-y-4">
              {/* 物件価格 + プリセット */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="物件価格" unit="万円" value={input.propertyPrice} onChange={set("propertyPrice")} step={10}/>
                <InputField label="想定家賃収入（月額）" unit="円" value={input.monthlyRent} onChange={set("monthlyRent")} step={1000}/>
              </div>
              <PresetGroup label="物件価格プリセット"
                options={[{label:"500万",value:500},{label:"1,000万",value:1000},{label:"2,000万",value:2000},{label:"3,000万",value:3000}]}
                onSelect={(v) => setInput((p) => ({ ...p, propertyPrice:v }))}/>
            </div>
          </div>

          <div className="border-t border-white/10"/>

          {/* 毎月の経費 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-amber-400 rounded-full"/>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">毎月の経費</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="管理費" unit="円/月" value={input.monthlyManagement} onChange={set("monthlyManagement")} step={500}/>
              <InputField label="修繕積立金" unit="円/月" value={input.monthlyRepair} onChange={set("monthlyRepair")} step={500}/>
              <InputField label="固定資産税" unit="円/年" value={input.annualTax} onChange={set("annualTax")} step={10000} hint="年額"/>
            </div>
          </div>

          <div className="border-t border-white/10"/>

          {/* ローン条件 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-emerald-400 rounded-full"/>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">ローン条件</h2>
            </div>
            <div className="space-y-5">
              {/* 借入額 + 頭金プリセット */}
              <div>
                <InputField label="借入額" unit="万円" value={input.loanAmount} onChange={set("loanAmount")} step={10}/>
                <div className="mt-3">
                  <PresetGroup label="頭金割合から自動計算"
                    options={[
                      {label:"フルローン", value:0},
                      {label:"10%頭金",   value:0.1},
                      {label:"20%頭金",   value:0.2},
                      {label:"30%頭金",   value:0.3},
                    ]}
                    onSelect={applyDownPayment}/>
                </div>
              </div>
              {/* 金利スライダー */}
              <SliderField label="金利" unit="%" value={input.loanRate} onChange={set("loanRate")} min={0.5} max={5.0} step={0.1}/>
              {/* ローン期間スライダー */}
              <SliderField label="ローン期間" unit="年" value={input.loanYears} onChange={set("loanYears")} min={10} max={35} step={5}/>
            </div>
          </div>

          {/* 利用制限バナー（未ログイン） */}
          {!user && (
            <div className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 ${
              limitReached
                ? "bg-red-500/10 border border-red-400/30"
                : "bg-white/5 border border-white/10"
            }`}>
              <span className={limitReached ? "text-red-300" : "text-slate-400"}>
                {limitReached
                  ? "⚠️ 本日の無料利用（3件）に達しました。ログインすると無制限で使えます。"
                  : `本日の利用：${dailyCount} / 3件（未ログイン）`}
              </span>
              <Link href="/login"
                className="flex-shrink-0 text-xs bg-blue-500 hover:bg-blue-400 text-white font-bold px-3 py-1.5 rounded-lg transition-colors">
                ログイン
              </Link>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleAnalyze} disabled={!user && limitReached}
              className="flex-1 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-blue-500/20">
              📊 分析する
            </button>
            <button onClick={handleReset}
              className="px-5 py-3.5 border border-white/20 text-slate-300 hover:bg-white/10 rounded-xl transition-colors text-sm">
              リセット
            </button>
          </div>
        </section>

        {/* ---- 分析結果 ---- */}
        {result && (
          <div id="result" className="space-y-6">

            {/* 総合スコア */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-base font-bold text-white mb-6 text-center">総合スコア</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <CircularGauge score={result.score}/>
                <div className="flex flex-col items-center gap-4">
                  <VerdictBadge verdict={result.verdict} label={result.verdictLabel}/>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    <DarkCard label="表面利回り" value={`${result.grossYield.toFixed(2)}%`} color="text-emerald-400"/>
                    <DarkCard label="実質利回り" value={`${result.netYield.toFixed(2)}%`} color="text-blue-400"/>
                    <div className="col-span-2">
                      <DarkCard
                        label="月間キャッシュフロー"
                        value={`${result.monthlyCashFlow >= 0 ? "+" : "−"}${formatYen(result.monthlyCashFlow)}円`}
                        sub={`年間: ${result.annualCashFlow >= 0 ? "+" : "−"}${formatYen(result.annualCashFlow)}円`}
                        color={result.monthlyCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}/>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* レーダーチャート */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white mb-5">📡 4指標レーダーチャート</h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData} margin={{ top:20, right:40, bottom:20, left:40 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)"/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:13, fill:"#94a3b8", fontWeight:600 }}/>
                  <Radar name="スコア" dataKey="value" stroke="#60a5fa" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2.5}/>
                </RadarChart>
              </ResponsiveContainer>
            </section>

            {/* CF内訳棒グラフ */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white mb-5">💰 月間キャッシュフロー内訳</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cfData} margin={{ top:5, right:10, left:10, bottom:5 }}>
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:"#64748b" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v>=0?"+":""}${Math.round(v/1000)}k`}/>
                  <Tooltip content={<CfTooltip/>} cursor={{ fill:"rgba(255,255,255,0.05)" }}/>
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {cfData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {cfData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor:d.color }}/>
                    <span>{d.name}：{d.value>=0?"+":"−"}{formatYen(d.value)}円</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 4指標スコアカード */}
            <section>
              <h3 className="text-sm font-bold text-slate-200 mb-3 px-1">📈 各指標スコア</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ScoreCard title="利回りスコア" score={result.yieldScore}
                  comment={`表面利回り${result.grossYield.toFixed(1)}%・実質利回り${result.netYield.toFixed(1)}%をもとに評価。7%以上が良好な水準です。`}/>
                <ScoreCard title="キャッシュフロースコア" score={result.cashFlowScore}
                  comment={`月間手残りが${result.monthlyCashFlow>=0?"+":""}${formatYen(result.monthlyCashFlow)}円。毎月のプラスCFが多いほど高評価です。`}/>
                <ScoreCard title="LTV安全性スコア" score={result.ltvScore}
                  comment={`借入比率${ltvPct}%。70%以下が健全な水準とされています。自己資金比率が高いほど安全です。`}/>
                <ScoreCard title="収益安定性スコア" score={result.stabilityScore}
                  comment="経費が収入に占める割合をもとに評価。比率が低いほど安定した収益構造です。"/>
              </div>
            </section>

            {/* 詳細コメント */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white mb-4">🔍 詳細コメント</h3>
              <ul className="space-y-2.5">
                {result.comments.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="mt-0.5 text-blue-400 flex-shrink-0">•</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* AI診断レポート */}
            <AIDiagnosis input={input} result={result}/>

            {/* 保存セクション */}
            <SaveSection
              savedCount={count}
              onSave={async (name) => {
                add(name, input, result);
                if (user) await saveToDb(name, input, result);
                trackSaveProperty({ property_name: name || "無題の物件", score: result.score });
              }}/>

            {/* 金利シミュレーション */}
            <RateSimulation input={input}/>

            {/* ローン期間シミュレーション */}
            <YearsSimulation input={input}/>

            {/* シェアセクション */}
            <ShareSection result={result}/>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 bg-white/5 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center space-y-2">
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mx-auto">
            ⚠️ 本ツールは情報提供のみを目的としており、投資助言ではありません。表示される分析結果は参考情報であり、投資の成果を保証するものではありません。投資判断はご自身の責任において、必要に応じて専門家にご相談のうえ行ってください。
          </p>
          <p className="text-xs text-slate-700">© 2024 不動産投資分析ツール</p>
        </div>
      </footer>
    </div>
  );
}
