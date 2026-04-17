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

        {/* Discord OAuth */}
        <button
          onClick={() => signIn("discord", { callbackUrl: "/game" })}
          className="discord-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          用 Discord 登入
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>或</span>
        </div>

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
