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
  score: number;              // 総合スコア (0-100)
  verdict: "buy" | "consider" | "pass";
  verdictLabel: string;
  comments: string[];
}

/** 元利均等返済の月額計算 */
function calcMonthlyLoan(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function analyze(input: PropertyInput): AnalysisResult {
  const priceYen = input.propertyPrice * 10000;
  const loanYen = input.loanAmount * 10000;
  const annualRent = input.monthlyRent * 12;

  // 表面利回り
  const grossYield = priceYen > 0 ? (annualRent / priceYen) * 100 : 0;

  // 年間経費
  const annualExpenses =
    (input.monthlyManagement + input.monthlyRepair) * 12 + input.annualTax;

  // 実質利回り（(年間家賃 - 年間経費) / 物件価格）
  const netYield = priceYen > 0 ? ((annualRent - annualExpenses) / priceYen) * 100 : 0;

  // 月間ローン返済
  const monthlyLoanPayment =
    loanYen > 0 && input.loanYears > 0
      ? calcMonthlyLoan(loanYen, input.loanRate, input.loanYears)
      : 0;

  // 月間・年間CF
  const monthlyCashFlow =
    input.monthlyRent -
    input.monthlyManagement -
    input.monthlyRepair -
    input.annualTax / 12 -
    monthlyLoanPayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // スコアリング（各項目を加点）
  let score = 50; // ベース
  const comments: string[] = [];

  // 表面利回り評価
  if (grossYield >= 10) {
    score += 15;
    comments.push("表面利回りが10%以上と高水準です。");
  } else if (grossYield >= 7) {
    score += 8;
    comments.push("表面利回りは7%以上と良好な水準です。");
  } else if (grossYield >= 5) {
    score += 2;
    comments.push("表面利回りは5%以上ですが、やや低めです。");
  } else {
    score -= 10;
    comments.push("表面利回りが5%未満で収益性が低いです。");
  }

  // 実質利回り評価
  if (netYield >= 7) {
    score += 15;
    comments.push("実質利回りが7%以上と優秀です。");
  } else if (netYield >= 5) {
    score += 8;
    comments.push("実質利回りは5%以上と良好です。");
  } else if (netYield >= 3) {
    score += 2;
    comments.push("実質利回りは3%台でやや控えめです。");
  } else {
    score -= 10;
    comments.push("実質利回りが3%未満で費用が収益を圧迫しています。");
  }

  // キャッシュフロー評価
  if (monthlyCashFlow >= 30000) {
    score += 15;
    comments.push("月間CFが3万円以上と余裕のある収支です。");
  } else if (monthlyCashFlow >= 10000) {
    score += 8;
    comments.push("月間CFはプラスで安定しています。");
  } else if (monthlyCashFlow >= 0) {
    score += 2;
    comments.push("月間CFはほぼトントンです。空室リスクに注意してください。");
  } else {
    score -= 15;
    comments.push("月間CFがマイナスです。毎月持ち出しが発生します。");
  }

  // LTV評価（借入比率）
  const ltv = priceYen > 0 ? (loanYen / priceYen) * 100 : 0;
  if (ltv <= 70) {
    score += 5;
    comments.push(`借入比率（LTV）は${ltv.toFixed(0)}%で健全な水準です。`);
  } else if (ltv <= 90) {
    comments.push(`借入比率（LTV）は${ltv.toFixed(0)}%です。やや高めに注意してください。`);
  } else {
    score -= 5;
    comments.push(`借入比率（LTV）が${ltv.toFixed(0)}%と高く、財務リスクがあります。`);
  }

  // スコアをクランプ
  score = Math.max(0, Math.min(100, Math.round(score)));

  // 判定
  let verdict: "buy" | "consider" | "pass";
  let verdictLabel: string;
  if (score >= 70) {
    verdict = "buy";
    verdictLabel = "買い推奨";
  } else if (score >= 45) {
    verdict = "consider";
    verdictLabel = "要検討";
  } else {
    verdict = "pass";
    verdictLabel = "見送り推奨";
  }

  return {
    grossYield,
    netYield,
    monthlyLoanPayment,
    monthlyCashFlow,
    annualCashFlow,
    score,
    verdict,
    verdictLabel,
    comments,
  };
}
