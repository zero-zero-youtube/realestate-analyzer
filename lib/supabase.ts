import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 環境変数が未設定の場合はダミーURLでクライアントを作成（ビルドエラー回避）
const url  = supabaseUrl.startsWith("http") ? supabaseUrl  : "https://placeholder.supabase.co";
const anon = supabaseAnon || "placeholder";

// ブラウザ用シングルトンクライアント
export const supabase = createClient(url, anon);

// ---- 型定義 ----
export interface Analysis {
  id: string;
  user_id: string;
  name: string;
  input: Record<string, number>;
  result: Record<string, unknown>;
  created_at: string;
}

/*
  Supabase で以下のSQLを実行してテーブルを作成してください：

  create table analyses (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid references auth.users not null,
    name       text not null default '',
    input      jsonb not null,
    result     jsonb not null,
    created_at timestamptz not null default now()
  );

  alter table analyses enable row level security;

  create policy "users can manage own analyses"
    on analyses for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
*/
