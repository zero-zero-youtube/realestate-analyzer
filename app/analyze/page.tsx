"use client";

import { useState } from "react";
import { analyze, type PropertyInput, type AnalysisResult } from "@/lib/calculator";

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

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value));
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-600" : score >= 45 ? "text-amber-500" : "text-red-500";
  const bg =
    score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-6xl font-bold ${color}`}>{score}</div>
      <div className="text-sm text-gray-500">/ 100点</div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bg}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict, label }: { verdict: AnalysisResult["verdict"]; label: string }) {
  const styles = {
    buy: "bg-emerald-100 text-emerald-800 border-emerald-300",
    consider: "bg-amber-100 text-amber-800 border-amber-300",
    pass: "bg-red-100 text-red-800 border-red-300",
  };
  const icons = { buy: "✅", consider: "⚠️", pass: "❌" };

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-lg font-bold ${styles[verdict]}`}
    >
      <span>{icons[verdict]}</span>
      <span>{label}</span>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  hint?: string;
}

function InputField({ label, unit, value, onChange, step = 1, min = 0, hint }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 text-xs text-gray-400">（{hint}）</span>}
      </label>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 text-right text-gray-900 bg-white outline-none"
        />
        <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-300 whitespace-nowrap">
          {unit}
        </span>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? "text-blue-700" : "text-gray-800"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AnalyzePage() {
  const [input, setInput] = useState<PropertyInput>(defaultInput);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function set<K extends keyof PropertyInput>(key: K) {
    return (v: number) => setInput((prev) => ({ ...prev, [key]: v }));
  }

  function handleAnalyze() {
    setResult(analyze(input));
    // スクロール
    setTimeout(() => {
      document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleReset() {
    setInput(defaultInput);
    setResult(null);
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🏠 不動産投資分析ツール</h1>
            <p className="text-xs text-gray-500">物件情報を入力してAI判定を受けましょう</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 入力フォーム */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
            📋 物件情報を入力
          </h2>

          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                物件基本情報
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="物件価格"
                  unit="万円"
                  value={input.propertyPrice}
                  onChange={set("propertyPrice")}
                  step={10}
                />
                <InputField
                  label="想定家賃収入（月額）"
                  unit="円"
                  value={input.monthlyRent}
                  onChange={set("monthlyRent")}
                  step={1000}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                毎月の経費
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="管理費"
                  unit="円/月"
                  value={input.monthlyManagement}
                  onChange={set("monthlyManagement")}
                  step={500}
                />
                <InputField
                  label="修繕積立金"
                  unit="円/月"
                  value={input.monthlyRepair}
                  onChange={set("monthlyRepair")}
                  step={500}
                />
                <InputField
                  label="固定資産税"
                  unit="円/年"
                  value={input.annualTax}
                  onChange={set("annualTax")}
                  step={10000}
                  hint="年額"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                ローン条件
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="借入額"
                  unit="万円"
                  value={input.loanAmount}
                  onChange={set("loanAmount")}
                  step={10}
                />
                <InputField
                  label="金利"
                  unit="%"
                  value={input.loanRate}
                  onChange={set("loanRate")}
                  step={0.1}
                />
                <InputField
                  label="借入期間"
                  unit="年"
                  value={input.loanYears}
                  onChange={set("loanYears")}
                  step={1}
                  min={1}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAnalyze}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors"
            >
              📊 分析する
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-sm"
            >
              リセット
            </button>
          </div>
        </section>

        {/* 分析結果 */}
        {result && (
          <section id="result" className="space-y-4">
            {/* 総合判定 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 text-center space-y-4">
              <h2 className="text-base font-bold text-gray-800">📈 分析結果</h2>
              <ScoreGauge score={result.score} />
              <VerdictBadge verdict={result.verdict} label={result.verdictLabel} />
            </div>

            {/* 数値サマリー */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="表面利回り"
                value={`${result.grossYield.toFixed(2)}%`}
              />
              <ResultCard
                label="実質利回り"
                value={`${result.netYield.toFixed(2)}%`}
              />
              <ResultCard
                label="月間キャッシュフロー"
                value={`${result.monthlyCashFlow >= 0 ? "+" : ""}${formatYen(result.monthlyCashFlow)}円`}
                sub={`年間: ${result.annualCashFlow >= 0 ? "+" : ""}${formatYen(result.annualCashFlow)}円`}
                highlight
              />
              <ResultCard
                label="月間ローン返済"
                value={`${formatYen(result.monthlyLoanPayment)}円`}
                sub="元利均等"
              />
            </div>

            {/* コメント */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">🔍 詳細コメント</h3>
              <ul className="space-y-2">
                {result.comments.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 text-blue-400 flex-shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 注意書き */}
            <p className="text-xs text-gray-400 text-center px-2">
              ※ この分析は概算です。実際の投資判断は専門家にご相談ください。
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
