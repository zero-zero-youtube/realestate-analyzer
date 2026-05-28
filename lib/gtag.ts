// GA4 カスタムイベント送信ユーティリティ

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/** 物件分析実行時 */
export function trackAnalyzeProperty(params: {
  property_price: number;
  gross_yield: number;
  score: number;
}) {
  sendEvent("analyze_property", params);
}

/** 物件保存時 */
export function trackSaveProperty(params: {
  property_name: string;
  score: number;
}) {
  sendEvent("save_property", params);
}

/** シェアボタンクリック時 */
export function trackShareResult(params: {
  method: "twitter" | "copy";
  score: number;
}) {
  sendEvent("share_result", params);
}
