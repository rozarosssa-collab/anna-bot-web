"use client";
import { useState, useRef, useEffect } from "react";

const MODES = [
  { id: "ideas", label: "💡 Идеи", prompt: "режим: идеи" },
  { id: "script", label: "✍️ Скрипт", prompt: "режим: скрипт" },
  { id: "analyze", label: "🔍 Анализ", prompt: "режим: анализ" },
  { id: "bend", label: "🌀 Бенд", prompt: "режим: бенд" },
  { id: "strategy", label: "📊 Стратегия", prompt: "режим: стратегия" },
  { id: "critic", label: "🔥 Критик", prompt: "режим: критик" },
  { id: "reddit", label: "👾 Reddit", prompt: "режим: reddit" },
];

const QUICK_COMMANDS = [
  { label: "📰 Дайджест", value: "Запусти дайджест конкурентов" },
  { label: "📈 Трекер", value: "Покажи статистику моих каналов" },
  { label: "📊 Weekly", value: "Сгенерируй еженедельный отчёт" },
  { label: "🔮 Прогноз", value: "Сделай прогноз на следующую неделю" },
  { label: "📋 План", value: "Составь контент-план на неделю" },
  { label: "🚨 Вирал", value: "Проверь вирусные видео конкурентов" },
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Привет, Влад. Я готова к работе.\n\nВыбери режим слева или напиши напрямую.",
};

function loadTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("anna_theme") || "dark";
}

function saveTheme(t) {
  if (typeof window === "undefined") return;
  localStorage.setItem("anna_theme", t);
}

const THEMES = {
  dark: {
    bg: "#0a0a0a", sidebar: "#111", sidebarBorder: "#222",
    msgBg: "#161616", msgBorder: "#222",
    userBg: "#1a1a2e", userBorder: "#4f46e5",
    inputBg: "#161616", inputBorder: "#333", inputBarBg: "#0d0d0d",
    text: "#e5e5e5", textMuted: "#999", textDim: "#555",
    accent: "#4f46e5", accentText: "#818cf8",
    modalBg: "#161616", modalBorder: "#333", modalItemBg: "#1a1a1a",
    dropdownBg: "#1a1a1a", dropdownBorder: "#333",
    btnDisabledBg: "#1a1a1a", btnDisabledText: "#444",
    hoverBg: "#252525", highlightBg: "#1a1a2e",
  },
  light: {
    bg: "#f5f5f5", sidebar: "#ffffff", sidebarBorder: "#e0e0e0",
    msgBg: "#ffffff", msgBorder: "#e0e0e0",
    userBg: "#ede9fe", userBorder: "#7c3aed",
    inputBg: "#ffffff", inputBorder: "#d0d0d0", inputBarBg: "#fafafa",
    text: "#111111", textMuted: "#555555", textDim: "#aaaaaa",
    accent: "#7c3aed", accentText: "#7c3aed",
    modalBg: "#ffffff", modalBorder: "#e0e0e0", modalItemBg: "#f5f5f5",
    dropdownBg: "#ffffff", dropdownBorder: "#e0e0e0",
    btnDisabledBg: "#f0f0f0", btnDisabledText: "#bbbbbb",
    hoverBg: "#f0f0f0", highlightBg: "#ede9fe",
  },
};

export default function Home() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("anna_chat_history");
      if (saved) {
        try { return JSON.parse(saved); } catch { return [INITIAL_MESSAGE]; }
      }
    }
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [stats, setStats] = useState(null);
  const [calDayData, setCalDayData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setTheme(loadTheme()); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const c = THEMES[theme];

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
  };

  const saveHistory = (msgs) => {
    if (typeof window !== "undefined") localStorage.setItem("anna_chat_history", JSON.stringify(msgs));
  };

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/stats?type=month");
      setStats(await res.json());
    } catch {
      setStats({ web_cost: 0, tg_cost: 0, web_messages: 0, tg_messages: 0, whisper_cost: 0, input_tokens: 0, output_tokens: 0, railway_cost: 0 });
    }
    setRefreshing(false);
  };

  const fetchCalDay = async (year, month, day) => {
    const key = year + "_" + month + "_" + day;
    if (calDayData[key]) return;
    try {
      const res = await fetch("/api/stats?type=day&year=" + year + "&month=" + month + "&day=" + day);
      const data = await res.json();
      setCalDayData(prev => Object.assign({}, prev, { [key]: data }));
    } catch {}
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    saveHistory(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const updated = [...newMsgs, { role: "assistant", content: data.content }];
      setMessages(updated);
      saveHistory(updated);
      fetchStats();
    } catch {
      const updated = [...newMsgs, { role: "assistant", content: "❌ Ошибка. Попробуй снова." }];
      setMessages(updated);
      saveHistory(updated);
    }
    setLoading(false);
  };

  const handleMode = (mode) => { setActiveMode(mode.id); sendMessage(mode.prompt); };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearAll = () => {
    const initial = [{ role: "assistant", content: "Всё очищено. Начинаем заново." }];
    setMessages(initial);
    saveHistory(initial);
    setActiveMode(null);
    setShowSettings(false);
  };

  const now = new Date();
  const monthName = now.toLocaleString("ru", { month: "long" });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const calDays = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const totalCost = stats ? (stats.web_cost || 0) + (stats.tg_cost || 0) + (stats.whisper_cost || 0) + (stats.railway_cost || 0) : 0;

  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" };
  const modalStyle = { background: c.modalBg, border: "1px solid " + c.modalBorder, borderRadius: "16px", padding: "24px", width: "340px", maxHeight: "85vh", overflowY: "auto" };
  const closeBtn = { marginTop: "16px", width: "100%", background: c.accent, border: "none", borderRadius: "8px", padding: "10px", color: "#fff", cursor: "pointer", fontSize: "14px" };

  return (
    <div style={{ display: "flex", height: "100vh", background: c.bg, color: c.text, fontFamily: "system-ui, sans-serif" }}>

      {showStats && (
        <div onClick={() => { setShowStats(false); setShowCalendar(false); }} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: c.text }}>📊 Статистика — {monthName}</div>
              <button onClick={fetchStats} disabled={refreshing} style={{ background: c.modalItemBg, border: "1px solid " + c.modalBorder, borderRadius: "8px", padding: "6px 10px", color: c.text, fontSize: "13px", cursor: "pointer" }}>
                {refreshing ? "..." : "🔄"}
              </button>
            </div>
            {!stats ? (
              <div style={{ color: c.textMuted, textAlign: "center", padding: "20px" }}>⏳ Загружаю...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ padding: "12px", background: c.highlightBg, border: "1px solid " + c.accent, borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: c.accentText, marginBottom: "4px" }}>ВСЕГО ЗА МЕСЯЦ</div>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: c.accent }}>${totalCost.toFixed(4)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ padding: "10px", background: c.modalItemBg, borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: c.textDim }}>🌐 Веб (Claude)</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: c.text }}>${(stats.web_cost || 0).toFixed(4)}</div>
                    <div style={{ fontSize: "11px", color: c.textDim }}>{stats.web_messages || 0} сообщ.</div>
                  </div>
                  <div style={{ padding: "10px", background: c.modalItemBg, borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: c.textDim }}>💬 Telegram</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: c.text }}>${(stats.tg_cost || 0).toFixed(4)}</div>
                    <div style={{ fontSize: "11px", color: c.textDim }}>{stats.tg_messages || 0} сообщ.</div>
                  </div>
                  <div style={{ padding: "10px", background: c.modalItemBg, borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: c.textDim }}>🎤 Whisper</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: c.text }}>${(stats.whisper_cost || 0).toFixed(4)}</div>
                  </div>
                  <div style={{ padding: "10px", background: c.modalItemBg, borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: c.textDim }}>🚂 Railway</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: c.text }}>${(stats.railway_cost || 0).toFixed(2)}</div>
                    <div style={{ fontSize: "11px", color: c.textDim }}>из $5.00/мес</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: c.modalItemBg, borderRadius: "8px", fontSize: "12px" }}>
                  <span style={{ color: c.textDim }}>📥 Входящих токенов</span>
                  <span style={{ color: c.text }}>{(stats.input_tokens || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: c.modalItemBg, borderRadius: "8px", fontSize: "12px" }}>
                  <span style={{ color: c.textDim }}>📤 Исходящих токенов</span>
                  <span style={{ color: c.text }}>{(stats.output_tokens || 0).toLocaleString()}</span>
                </div>
                <button onClick={() => { setShowCalendar(!showCalendar); if (!showCalendar) { for (let d = 1; d <= now.getDate(); d++) fetchCalDay(now.getFullYear(), now.getMonth() + 1, d); } }} style={{ background: c.modalItemBg, border: "1px solid " + c.modalBorder, borderRadius: "8px", padding: "10px 12px", color: c.text, fontSize: "13px", cursor: "pointer", textAlign: "left" }}>
                  📅 {showCalendar ? "Скрыть календарь" : "История по дням"}
                </button>
                {showCalendar && (
                  <div style={{ background: c.modalItemBg, borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: c.textMuted, marginBottom: "8px", textAlign: "center", fontWeight: "600" }}>{now.toLocaleString("ru", { month: "long", year: "numeric" })}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "6px" }}>
                      {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => <div key={d} style={{ textAlign: "center", fontSize: "10px", color: c.textDim, padding: "2px" }}>{d}</div>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                      {calDays.map((day, i) => {
                        if (!day) return <div key={"e" + i} />;
                        const key = now.getFullYear() + "_" + (now.getMonth() + 1) + "_" + day;
                        const dd = calDayData[key];
                        const isToday = day === now.getDate();
                        const cost = dd ? ((dd.web_cost || 0) + (dd.tg_cost || 0)) : 0;
                        const active = cost > 0;
                        return (
                          <div key={day} title={active ? (dd.messages || 0) + " сообщ. | $" + cost.toFixed(4) : ""} style={{ textAlign: "center", padding: "4px 2px", borderRadius: "6px", fontSize: "11px", background: isToday ? c.accent : active ? c.highlightBg : "transparent", color: isToday ? "#fff" : active ? c.accentText : c.textDim, border: isToday ? "1px solid " + c.accent : active ? "1px solid " + c.accent : "1px solid transparent" }}>
                            {day}
                            {active && <div style={{ fontSize: "9px" }}>${cost.toFixed(2)}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{ padding: "8px 10px", background: c.highlightBg, border: "1px solid " + c.accent, borderRadius: "8px", fontSize: "11px", color: c.accentText, textAlign: "center" }}>
                  Данные со всех источников. Сбрасывается 1-го числа.
                </div>
              </div>
            )}
            <button onClick={() => { setShowStats(false); setShowCalendar(false); }} style={closeBtn}>Закрыть</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalStyle}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: c.text, marginBottom: "16px" }}>⚙️ Настройки</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: c.modalItemBg, borderRadius: "10px" }}>
                <span style={{ color: c.text, fontSize: "14px" }}>{theme === "dark" ? "🌙 Тёмная тема" : "☀️ Светлая тема"}</span>
                <div onClick={toggleTheme} style={{ width: "44px", height: "24px", borderRadius: "12px", background: theme === "dark" ? c.accent : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: "2px", left: theme === "dark" ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
              <button onClick={() => { window.open("/links", "_blank"); setShowSettings(false); }} style={{ background: c.modalItemBg, border: "1px solid " + c.modalBorder, borderRadius: "10px", padding: "12px", color: c.text, fontSize: "14px", cursor: "pointer", textAlign: "left" }}>
                🔗 Ссылки на сервисы
              </button>
              <button onClick={clearAll} style={{ background: "transparent", border: "1px solid #ef4444", borderRadius: "10px", padding: "12px", color: "#ef4444", fontSize: "14px", cursor: "pointer", textAlign: "left" }}>
                🗑️ Очистить всё (чат + статистика)
              </button>
            </div>
            <button onClick={() => setShowSettings(false)} style={closeBtn}>Закрыть</button>
          </div>
        </div>
      )}

      <div style={{ width: "240px", background: c.sidebar, borderRight: "1px solid " + c.sidebarBorder, display: "flex", flexDirection: "column", padding: "16px", gap: "8px" }}>
        <div style={{ position: "relative", marginBottom: "8px", paddingBottom: "12px", borderBottom: "1px solid " + c.sidebarBorder }} ref={menuRef}>
          <div onClick={() => setShowMenu(!showMenu)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", overflow: "hidden", border: "1px solid " + c.accent, flexShrink: 0 }}>
              <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: c.text }}>Anna Bot</div>
              <div style={{ fontSize: "11px", color: c.textDim }}>{stats ? "$" + totalCost.toFixed(3) + " этот месяц" : "..."}</div>
            </div>
            <div style={{ color: c.textDim, fontSize: "12px" }}>{showMenu ? "▲" : "▼"}</div>
          </div>
          {showMenu && (
            <div style={{ position: "absolute", top: "48px", left: 0, right: 0, background: c.dropdownBg, border: "1px solid " + c.dropdownBorder, borderRadius: "10px", overflow: "hidden", zIndex: 100 }}>
              <button onClick={() => { fetchStats(); setShowStats(true); setShowMenu(false); }} style={{ width: "100%", background: "transparent", border: "none", padding: "10px 14px", color: c.text, fontSize: "13px", textAlign: "left", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = c.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                📊 Статистика расходов
              </button>
              <button onClick={() => { setShowSettings(true); setShowMenu(false); }} style={{ width: "100%", background: "transparent", border: "none", padding: "10px 14px", color: c.text, fontSize: "13px", textAlign: "left", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = c.hoverBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                ⚙️ Настройки
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: "11px", color: c.textDim, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Режимы</div>
        {MODES.map(mode => (
          <button key={mode.id} onClick={() => handleMode(mode)} style={{ background: activeMode === mode.id ? c.highlightBg : "transparent", border: activeMode === mode.id ? "1px solid " + c.accent : "1px solid transparent", color: activeMode === mode.id ? c.accentText : c.textMuted, padding: "8px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "13px", transition: "all 0.15s" }}>
            {mode.label}
          </button>
        ))}

        <div style={{ fontSize: "11px", color: c.textDim, textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", marginBottom: "4px" }}>Быстрые команды</div>
        {QUICK_COMMANDS.map(cmd => (
          <button key={cmd.label} onClick={() => sendMessage(cmd.value)} style={{ background: "transparent", border: "1px solid transparent", color: theme === "dark" ? "#666" : "#aaa", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "12px", transition: "all 0.15s" }} onMouseEnter={e => { e.target.style.color = c.textMuted; e.target.style.borderColor = c.sidebarBorder; }} onMouseLeave={e => { e.target.style.color = theme === "dark" ? "#666" : "#aaa"; e.target.style.borderColor = "transparent"; }}>
            {cmd.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "12px", alignItems: "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid " + c.accent, flexShrink: 0 }}>
                  <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ maxWidth: "70%", padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? c.userBg : c.msgBg, border: "1px solid " + (msg.role === "user" ? c.userBorder : c.msgBorder), color: c.text, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: c.userBg, border: "1px solid " + c.userBorder, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>👤</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid " + c.accent, flexShrink: 0 }}>
                <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: c.msgBg, border: "1px solid " + c.msgBorder, color: theme === "dark" ? "#666" : "#aaa", fontSize: "14px" }}>⏳ Думаю...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid " + c.sidebarBorder, background: c.inputBarBg }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Напиши сообщение... (Enter — отправить, Shift+Enter — новая строка)" rows={1} style={{ flex: 1, background: c.inputBg, border: "1px solid " + c.inputBorder, borderRadius: "12px", padding: "12px 16px", color: c.text, fontSize: "14px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: "1.5", maxHeight: "120px", overflow: "auto" }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? c.btnDisabledBg : c.accent, border: "none", borderRadius: "12px", padding: "12px 20px", color: loading || !input.trim() ? c.btnDisabledText : "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              Отправить →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
