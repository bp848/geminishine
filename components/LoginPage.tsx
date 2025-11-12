import React, { useState } from "react";
import { supabase } from '../services/supabaseClient';
import { Package, Loader } from './Icons.tsx';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
    }

    // ✅ public.users 同期（Googleと同じ upsert 処理）
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
        setMsg(getUserError?.message || "ユーザー情報の取得に失敗しました。");
        setLoading(false);
        return;
    }

    const { error: upsertError } = await supabase.from("users").upsert(
      { id: user.id, auth_user_id: user.id, email: user.email, name: user.user_metadata?.full_name ?? user.email },
      { onConflict: "id" }
    );
    
    if (upsertError) {
        setMsg(`ユーザープロファイルの同期に失敗しました: ${upsertError.message}`);
        // Log user out to prevent being in a broken state
        await supabase.auth.signOut();
        setLoading(false);
        return;
    }

    // No need for location.href, the onAuthStateChange in App.tsx will handle the state update and re-render.
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl dark:bg-slate-800">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Package className="w-10 h-10 text-blue-600" />
            <h2 className="text-3xl font-bold">MQ会計ERP</h2>
          </div>
          <p className="mt-2 text-center text-slate-600 dark:text-slate-400">
            メールアドレスとパスワードでログインしてください
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border p-2 w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="current-password"
          />
          <button disabled={loading} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400">
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> <span>ログイン中...</span></> : "ログイン"}
          </button>
          {msg && <p className="text-red-600 text-sm text-center">{msg}</p>}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
