"use client";

import { useState } from "react";
import { useGameData } from "../hooks/useGameData";

export default function DebugPanel() {
  const { data, api } = useGameData();
  const [msg, setMsg] = useState<string | null>(null);
  const [debugGold, setDebugGold] = useState("");
  const [debugStones, setDebugStones] = useState("");
  const [debugMat, setDebugMat] = useState("");
  const [debugMatAmt, setDebugMatAmt] = useState("");
  const [tickCount, setTickCount] = useState(1);
  const [loading, setLoading] = useState(false);

  async function callDebug(action: string, body: Record<string, unknown> = {}) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const json = await res.json();
      setMsg(json.success ? JSON.stringify(json.data) : `錯誤: ${json.error}`);
    } catch (e) {
      setMsg(`請求失敗: ${e instanceof Error ? e.message : "未知錯誤"}`);
    } finally {
      setLoading(false);
    }
  }

  async function addGold() {
    const amt = parseInt(debugGold);
    if (isNaN(amt) || amt <= 0) { setMsg("請輸入有效金幣數量"); return; }
    await callDebug("addGold", { amount: amt });
  }

  async function addStones() {
    const amt = parseInt(debugStones);
    if (isNaN(amt) || amt <= 0) { setMsg("請輸入有效魔法石數量"); return; }
    await callDebug("addMagicStones", { amount: amt });
  }

  async function addMaterial() {
    const amt = parseInt(debugMatAmt);
    if (!debugMat || isNaN(amt) || amt <= 0) { setMsg("請輸入有效材料名稱和數量"); return; }
    await callDebug("addMaterial", { material: debugMat, amount: amt });
  }

  async function triggerTick() {
    await callDebug("triggerTick", { count: tickCount });
  }

  async function spawnHero() {
    await callDebug("spawnHero", { count: 1 });
  }

  async function resetCooldowns() {
    await callDebug("resetCooldowns");
  }

  async function fullHeal() {
    await callDebug("fullHeal");
  }

  async function resetHeroHunger() {
    await callDebug("resetHeroHunger");
  }

  async function addExp() {
    const amt = parseInt(debugExp);
    if (isNaN(amt) || amt <= 0) { setMsg("請輸入有效經驗值"); return; }
    await callDebug("addExp", { amount: amt });
  }

  async function unlockZone() {
    const zone = parseInt(debugZone);
    if (isNaN(zone) || zone < 1 || zone > 10) { setMsg("區域需為 1-10"); return; }
    await callDebug("unlockZone", { zone });
  }

  async function deleteAccount() {
    if (!window.confirm("⚠️ 確定要刪除帳號嗎？所有遊戲資料將被永久刪除，此操作無法復原！")) return;
    if (!window.confirm("再次確認：刪除後你的 Discord 帳號將解除註冊，下次登入會重新創建角色。是否繼續？")) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAccount" }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("帳號已刪除，正在重新登入...");
        // Redirect to home after signOut completes
        setTimeout(() => window.location.href = "/", 1500);
      } else {
        setMsg(`錯誤: ${json.error}`);
      }
    } catch (e) {
      setMsg(`請求失敗: ${e instanceof Error ? e.message : "未知錯誤"}`);
    } finally {
      setLoading(false);
    }
  }

  const [debugExp, setDebugExp] = useState("");
  const [debugZone, setDebugZone] = useState("");

  return (
    <div className="panel">
      <h2>🔧 Debug 控制台</h2>
      <p className="hint">⚠️ 這些是除錯功能，可能影響遊戲平衡</p>

      {/* 資源調整 */}
      <section className="debug-section">
        <h3>💰 調整資源</h3>
        <div className="debug-row">
          <input
            type="number"
            placeholder="金幣數量"
            value={debugGold}
            onChange={(e) => setDebugGold(e.target.value)}
          />
          <button onClick={addGold} disabled={loading}>給予金幣</button>
        </div>
        <div className="debug-row">
          <input
            type="number"
            placeholder="魔法石數量"
            value={debugStones}
            onChange={(e) => setDebugStones(e.target.value)}
          />
          <button onClick={addStones} disabled={loading}>給予魔法石</button>
        </div>
        <div className="debug-row">
          <select
            value={debugMat}
            onChange={(e) => setDebugMat(e.target.value)}
          >
            <option value="">選擇材料</option>
            <option value="fruit">水果</option>
            <option value="water">水</option>
            <option value="wood">木頭</option>
            <option value="iron">鐵</option>
            <option value="herbs">草藥</option>
            <option value="rations">口糧</option>
            <option value="drinking_water">飲用水</option>
            <option value="potions">藥水</option>
          </select>
          <input
            type="number"
            placeholder="數量"
            value={debugMatAmt}
            onChange={(e) => setDebugMatAmt(e.target.value)}
          />
          <button onClick={addMaterial} disabled={loading}>給予材料</button>
        </div>
      </section>

      {/* 英雄調整 */}
      <section className="debug-section">
        <h3>🧙 調整英雄</h3>
        <div className="debug-row">
          <input
            type="number"
            placeholder="經驗值"
            value={debugExp}
            onChange={(e) => setDebugExp(e.target.value)}
          />
          <button onClick={addExp} disabled={loading}>所有英雄+經驗</button>
        </div>
        <div className="debug-row">
          <button onClick={spawnHero} disabled={loading}>生成流浪英雄</button>
          <button onClick={fullHeal} disabled={loading}>全英雄滿血</button>
          <button onClick={resetHeroHunger} disabled={loading}>重置飢餓/口渴</button>
        </div>
      </section>

      {/* 遊戲進度 */}
      <section className="debug-section">
        <h3>🗺️ 遊戲進度</h3>
        <div className="debug-row">
          <input
            type="number"
            placeholder="區域 (1-10)"
            min="1"
            max="10"
            value={debugZone}
            onChange={(e) => setDebugZone(e.target.value)}
          />
          <button onClick={unlockZone} disabled={loading}>解鎖區域</button>
        </div>
      </section>

      {/* 系統控制 */}
      <section className="debug-section">
        <h3>⚙️ 系統控制</h3>
        <div className="debug-row">
          <input
            type="number"
            placeholder="tick次數"
            min="1"
            max="100"
            value={tickCount}
            onChange={(e) => setTickCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <button onClick={triggerTick} disabled={loading}>觸發 idle tick ({tickCount}x)</button>
          <button onClick={resetCooldowns} disabled={loading}>重置冷卻時間</button>
        </div>
      </section>

      {/* 危險操作 */}
      <section className="debug-section danger">
        <h3>☠️ 危險操作</h3>
        <div className="debug-row">
          <button onClick={deleteAccount} disabled={loading} className="btn-danger">
            刪除帳號（重新註冊）
          </button>
        </div>
      </section>

      {/* 訊息輸出 */}
      {msg && (
        <div className="debug-msg">
          <code>{msg}</code>
        </div>
      )}
    </div>
  );
}
