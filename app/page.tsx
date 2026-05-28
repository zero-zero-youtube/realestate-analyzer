import Link from "next/link";

const features = [
  {
    icon: "📊",
    title: "利回り自動計算",
    desc: "物件価格・家賃・経費を入力するだけで、表面利回り・実質利回りを瞬時に算出。初心者でも正確な数字を把握できます。",
  },
  {
    icon: "💰",
    title: "キャッシュフロー分析",
    desc: "ローン返済・管理費・修繕費・税金を考慮した月間・年間キャッシュフローをグラフで可視化します。",
  },
  {
    icon: "🏆",
    title: "総合スコアレポート",
    desc: "利回り・CF・LTV安全性・安定性の4指標を総合した100点満点スコアで物件を客観的に評価します。",
  },
];

const steps = [
  { num: "01", title: "物件情報を入力", desc: "価格・家賃・経費・ローン条件を入力" },
  { num: "02", title: "自動計算・分析", desc: "利回りとCFを瞬時に計算" },
  { num: "03", title: "スコアレポート確認", desc: "4指標のスコアと詳細コメントを確認" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ナビ */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-gray-900 text-lg">不動産投資分析ツール</span>
          </div>
          <Link
            href="/analyze"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            分析を始める
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ヒーロー */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
              <span>✨</span>
              <span>初心者でも3分で分析完了</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-5">
              不動産投資の判断を、
              <br className="hidden sm:block" />
              <span className="text-blue-400">AIがサポート</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              物件情報を入力するだけで、利回り・キャッシュフロー・リスクを瞬時に分析。
              <br className="hidden sm:block" />
              データに基づいた冷静な判断で、後悔しない不動産投資を。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/analyze"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-blue-500/30"
              >
                無料で分析する →
              </Link>
            </div>
            {/* スコアプレビュー */}
            <div className="mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[
                { label: "表面利回り", value: "8.4%", color: "text-emerald-400" },
                { label: "月間CF", value: "+4.2万円", color: "text-blue-400" },
                { label: "総合スコア", value: "78点", color: "text-amber-400" },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                  <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3つの機能 */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">主な機能</h2>
              <p className="text-gray-500">初心者でも迷わず使えるシンプルな設計</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 使い方ステップ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">3ステップで分析完了</h2>
              <p className="text-gray-500">複雑な計算は全て自動。入力するだけです。</p>
            </div>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg">
                    {s.num}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="font-semibold text-gray-900">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.desc}</div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute left-7 mt-14 w-0.5 h-4 bg-blue-200 hidden" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/analyze"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
              >
                今すぐ無料で分析する
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* フッター・免責事項 */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center space-y-2">
          <p className="text-xs leading-relaxed max-w-2xl mx-auto">
            ⚠️ 本ツールは情報提供のみを目的としており、投資助言ではありません。表示される分析結果は参考情報であり、投資の成果を保証するものではありません。投資判断はご自身の責任において、必要に応じて専門家にご相談のうえ行ってください。
          </p>
          <p className="text-xs text-gray-600">© 2024 不動産投資分析ツール</p>
        </div>
      </footer>
    </div>
  );
}
