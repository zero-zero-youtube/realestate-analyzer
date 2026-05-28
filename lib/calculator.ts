export interface PropertyInput {
  propertyPrice: number;      // 万円
  monthlyRent: number;        // 円
  monthlyManagement: number;  // 円
  monthlyRepair: number;      // 円
  annualTax: number;          // 円
  loanAmount: number;         // 万円
  loanRate: number;           // %
  loanYears: number;          // 年
}

export interface AnalysisResult {
  grossYield: number;         // 表面利回り (%)
  netYield: number;           // 実質利回り (%)
  monthlyLoanPayment: number; // 月間ローン返済額 (円)
  monthlyCashFlow: number;    // 月間CF (円)
  annualCashFlow: number;     // 年間CF (円)
  // 内訳（月額）
  monthlyRent: number;
  monthlyExpenses: number;    // 管理費+修繕+税(月割)
  // スコア
  score: number;              // 総合スコア (0-100)
  yieldScore: number;         // 利回りスコア
  cashFlowScore: number;      // CFスコア
  ltvScore: number;           // LTV安全性スコア
  stabilityScore: number;     // 収益安定性スコア
  verdict: "excellent" | "good" | "consider" | "pass";
  verdictLabel: string;
  comments: string[];
}

function calcMonthlyLoan(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function analyze(input: PropertyInput): AnalysisResult {
  const priceYen = input.propertyPrice * 10000;
  const loanYen = input.loanAmount * 10000;
  const annualRent = input.monthlyRent * 12;

  // 利回り
  const grossYield = priceYen > 0 ? (annualRent / priceYen) * 100 : 0;
  const annualExpenses =
    (input.monthlyManagement + input.monthlyRepair) * 12 + input.annualTax;
  const netYield = priceYen > 0 ? ((annualRent - annualExpenses) / priceYen) * 100 : 0;

  // ローン・CF
  const monthlyLoanPayment =
    loanYen > 0 && input.loanYears > 0
      ? calcMonthlyLoan(loanYen, input.loanRate, input.loanYears)
      : 0;
  const monthlyExpenses =
    input.monthlyManagement + input.monthlyRepair + input.annualTax / 12;
  const monthlyCashFlow = input.monthlyRent - monthlyExpenses - monthlyLoanPayment;
  const annualCashFlow = monthlyCashFlow * 12;

  const ltv = priceYen > 0 ? (loanYen / priceYen) * 100 : 0;

  const comments: string[] = [];

  // --- 利回りスコア（0-100）---
  let yieldScore = 50;
  if (grossYield >= 10) { yieldScore += 25; comments.push("表面利回りが10%以上と高水準です。"); }
  else if (grossYield >= 7) { yieldScore += 12; comments.push("表面利回りは7%以上と良好な水準です。"); }
  else if (grossYield >= 5) { yieldScore += 2; comments.push("表面利回りは5%台でやや低めです。"); }
  else { yieldScore -= 15; comments.push("表面利回りが5%未満で収益性が低いです。"); }

  if (netYield >= 7) yieldScore += 25;
  else if (netYield >= 5) yieldScore += 12;
  else if (netYield >= 3) yieldScore += 2;
  else yieldScore -= 15;

  yieldScore = clamp(yieldScore);

  // --- CFスコア（0-100）---
  let cashFlowScore = 50;
  if (monthlyCashFlow >= 50000) { cashFlowScore += 40; comments.push("月間CFが5万円以上と非常に余裕のある収支です。"); }
  else if (monthlyCashFlow >= 30000) { cashFlowScore += 25; comments.push("月間CFが3万円以上と余裕のある収支です。"); }
  else if (monthlyCashFlow >= 10000) { cashFlowScore += 12; comments.push("月間CFはプラスで安定しています。"); }
  else if (monthlyCashFlow >= 0) { cashFlowScore += 2; comments.push("月間CFはほぼ収支トントンです。空室リスクに注意してください。"); }
  else if (monthlyCashFlow >= -20000) { cashFlowScore -= 20; comments.push("月間CFがマイナスです。毎月持ち出しが発生します。"); }
  else { cashFlowScore -= 40; comments.push("月間CFが大幅マイナスで財務的に危険な水準です。"); }
  cashFlowScore = clamp(cashFlowScore);

  // --- LTV安全性スコア（0-100）---
  let ltvScore = 70;
  if (ltv <= 60) { ltvScore = 95; comments.push(`借入比率（LTV）${ltv.toFixed(0)}%で非常に健全です。`); }
  else if (ltv <= 70) { ltvScore = 80; comments.push(`借入比率（LTV）${ltv.toFixed(0)}%で健全な水準です。`); }
  else if (ltv <= 80) { ltvScore = 60; comments.push(`借入比率（LTV）${ltv.toFixed(0)}%です。やや高めに注意してください。`); }
  else if (ltv <= 90) { ltvScore = 40; comments.push(`借入比率（LTV）${ltv.toFixed(0)}%と高く、リスクがあります。`); }
  else { ltvScore = 15; comments.push(`借入比率（LTV）${ltv.toFixed(0)}%と非常に高く、財務リスクが大きいです。`); }

  // --- 収益安定性スコア（実質 vs 表面の差で経費比率を評価）---
  const expenseRatio = annualRent > 0 ? (annualExpenses / annualRent) * 100 : 50;
  let stabilityScore = 70;
  if (expenseRatio <= 15) stabilityScore = 90;
  else if (expenseRatio <= 25) stabilityScore = 75;
  else if (expenseRatio <= 35) stabilityScore = 55;
  else if (expenseRatio <= 50) stabilityScore = 35;
  else stabilityScore = 20;

  // 総合スコア（加重平均）
  const score = clamp(
    yieldScore * 0.30 +
    cashFlowScore * 0.40 +
    ltvScore * 0.20 +
    stabilityScore * 0.10
  );

  // 4段階判定
  let verdict: AnalysisResult["verdict"];
  let verdictLabel: string;
  if (score >= 72) { verdict = "excellent"; verdictLabel = "優良物件"; }
  else if (score >= 55) { verdict = "good"; verdictLabel = "標準"; }
  else if (score >= 38) { verdict = "consider"; verdictLabel = "要検討"; }
  else { verdict = "pass"; verdictLabel = "見送り"; }

  return {
    grossYield,
    netYield,
    monthlyLoanPayment,
    monthlyCashFlow,
    annualCashFlow,
    monthlyRent: input.monthlyRent,
    monthlyExpenses,
    score,
    yieldScore,
    cashFlowScore,
    ltvScore,
    stabilityScore,
    verdict,
    verdictLabel,
    comments,
  };
}
