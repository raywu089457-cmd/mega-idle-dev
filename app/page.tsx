"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/game");
    }
  }, [status, router]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.error);
          return;
        }
        // Auto sign-in after registration
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/game",
        });
        if (result?.error) {
          setError("註冊成功但登入失敗，請手動登入");
        } else if (result?.url) {
          router.push(result.url);
        } else {
          router.push("/game");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/game",
        });
        if (result?.error) {
          setError("電子郵件或密碼錯誤");
        } else if (result?.url) {
          router.push(result.url);
        } else {
          router.push("/game");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="landing">
        <div className="landing-content">
          <p className="subtitle">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="title">⚔️ Mega Idle</h1>
        <p className="subtitle">休閒放置 RPG</p>

        {/* Email/Password form */}
        <form onSubmit={handleEmailAuth} className="email-auth-form">
          {mode === "register" && (
            <input
              type="text"
              placeholder="遊戲名稱（可選）"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
            />
          )}
          <input
            type="email"
            placeholder="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "處理中..." : mode === "register" ? "註冊帳號" : "登入"}
          </button>
        </form>

        <p className="note">
          {mode === "login" ? (
            <>
              還沒有帳號？{" "}
              <button className="link-btn" onClick={() => setMode("register")}>
                註冊
              </button>
            </>
          ) : (
            <>
              已經有帳號？{" "}
              <button className="link-btn" onClick={() => setMode("login")}>
                登入
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
