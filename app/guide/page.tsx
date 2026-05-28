import Link from "next/link";
import Header from "@/components/Header";

const steps = [
  {
    num: "01",
    icon: "📝",
    title: "物件情報を入力する",
    desc: "分析したい物件の価格・家賃・ローン条件を入力します。スライダーで金利・期間を直感的に調整できます。",
    tips: ["物件価格と毎月の家賃収入は必須項目です", "管理費・修繕積立金も忘れずに入力しましょう", "頭金ゼロのフルローンにも対応しています"],
  },
  {
    num: "02",
    icon: "🤖",
    title: "AI診断レポートを確認する",
    desc: "利回り・キャッシュフロー・LTV・ROIを自動計算。AI診断レポートで物件の強み・注意点をわかりやすく解説します。",
    tips: ["4指標（利回り・CF・LTV・ROI）を個別に評価", "良好/注意/危険のカラーコードで一目でわかる", "総合スコアで物件を100点満点で評価"],
  },
  {
    num: "03",
    icon: "💾",
    title: "物件を保存して比較する",
    desc: "気になる物件を保存して、複数の物件を比較検討できます。金利・ローン期間のシミュレーションで最適な条件を探しましょう。",
    tips: ["最大10件まで保存可能（ブラウザに保存）", "金利±1%・期間3パターンのシミュレーション対応", "保存済み物件ページで横並び比較ができます"],
  },
];

const faqs = [
  {
    q: "このツールは無料で使えますか？",
    a: "はい、現在は無料でご利用いただけます。ログインやアカウント登録も不要です。",
  },
  {
    q: "入力したデータは保存されますか？",
    a: "物件データはお使いのブラウザ（localStorage）に保存されます。サーバーへの送信は行われないため、他のデバイスでは引き継げません。",
  },
  {
    q: "投資のアドバイスをしてもらえますか？",
    a: "本ツールは情報提供のみを目的としており、投資助言ではありません。表示される診断結果は参考情報であり、投資の成果を保証するものではありません。最終的な投資判断はご自身の責任で行ってください。",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 sm:py-14">

        {/* タイトル */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-4">
            <span>📖</span><span>はじめての方へ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">使い方ガイド</h1>
          <p className="text-slate-400 text-base">3ステップで不動産投資を分析できます</p>
        </div>

        {/* 3ステップ */}
        <div className="space-y-6 mb-14">
          {steps.map((s, i) => (
            <div key={s.num}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="flex items-start gap-5">
                {/* 番号バッジ */}
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-600 flex flex-col items-center justify-center">
                  <span className="text-xs text-blue-200 font-semibold leading-none">STEP</span>
                  <span className="text-lg font-bold text-white leading-tight">{s.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <h2 className="text-lg font-bold text-white">{s.title}</h2>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">{s.desc}</p>
                  <ul className="space-y-1.5">
                    {s.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 flex-shrink-0 mt-0.5">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* ステップ間の矢印 */}
              {i < steps.length - 1 && (
                <div className="flex justify-center mt-6 -mb-2">
                  <span className="text-slate-600 text-xl">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTAボタン */}
        <div className="text-center mb-14">
          <Link href="/analyze"
            className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-blue-500/30">
            さっそく分析してみる →
          </Link>
          <p className="text-slate-500 text-sm mt-3">無料・登録不要で今すぐ使えます</p>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-white mb-5 text-center">よくある質問</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center justify-center">Q</span>
                  <p className="text-sm font-semibold text-white">{faq.q}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center">A</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-white/5 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-slate-600">
            ⚠️ 本ツールは情報提供のみを目的としており、投資助言ではありません。
          </p>
        </div>
      </footer>
    </div>
  );
}
