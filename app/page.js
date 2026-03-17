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

function getMonthKey() {
  const now = new Date();
  return `anna_cost_${now.getFullYear()}_${now.getMonth() + 1}`;
}

function getDayKey(date) {
  return `anna_day_${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}`;
}

function loadStats() {
  if (typeof window === "undefined") return { cost: 0, messages: 0, input_tokens: 0, output_tokens: 0 };
  try {
    const saved = localStorage.getItem(getMonthKey());
    return saved ? JSON.parse(saved) : { cost: 0, messages: 0, input_tokens: 0, output_tokens: 0 };
  } catch {
    return { cost: 0, messages: 0, input_tokens: 0, output_tokens: 0 };
  }
}

function saveStats(stats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getMonthKey(), JSON.stringify(stats));
}

function loadDayStats(date) {
  if (typeof window === "undefined") return { cost: 0, messages: 0 };
  try {
    const saved = localStorage.getItem(getDayKey(date));
    return saved ? JSON.parse(saved) : { cost: 0, messages: 0 };
  } catch {
    return { cost: 0, messages: 0 };
  }
}

function saveDayStats(cost, messages) {
  if (typeof window === "undefined") return;
  const today = new Date();
  const key = getDayKey(today);
  const current = loadDayStats(today);
  localStorage.setItem(key, JSON.stringify({
    cost: current.cost + cost,
    messages: current.messages + messages,
  }));
}

function loadTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("anna_theme") || "dark";
}

function saveTheme(theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem("anna_theme", theme);
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
  const [stats, setStats] = useState({ cost: 0, messages: 0, input_tokens: 0, output_tokens: 0 });
  const [theme, setTheme] = useState("dark");
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setStats(loadStats());
    setTheme(loadTheme());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const t = THEMES[theme];

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
  };

  const saveHistory = (msgs) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("anna_chat_history", JSON.stringify(msgs));
    }
  };

  const updateStats = (usage) => {
    const current = loadStats();
    const updated = {
      cost: current.cost + usage.cost,
      messages: current.messages + 1,
      input_tokens: current.input_tokens + usage.input_tokens,
      output_tokens: current.output_tokens + usage.output_tokens,
    };
    saveStats(updated);
    saveDayStats(usage.cost, 1);
    setStats(updated);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveHistory(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.usage) updateStats(data.usage);
      const updated = [...newMessages, { role: "assistant", content: data.content }];
      setMessages(updated);
      saveHistory(updated);
    } catch {
      const updated = [...newMessages, { role: "assistant", content: "❌ Ошибка. Попробуй снова." }];
      setMessages(updated);
      saveHistory(updated);
    }
    setLoading(false);
  };

  const handleMode = (mode) => {
    setActiveMode(mode.id);
    sendMessage(mode.prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearAll = () => {
    const initial = [{ role: "assistant", content: "Всё очищено. Начинаем заново." }];
    setMessages(initial);
    saveHistory(initial);
    setActiveMode(null);
    const empty = { cost: 0, messages: 0, input_tokens: 0, output_tokens: 0 };
    saveStats(empty);
    setStats(empty);
    setShowSettings(false);
  };

  const now = new Date();
  const monthName = now.toLocaleString("ru", { month: "long" });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, color: t.text, fontFamily: "system-ui, sans-serif" }}>

      {/* STATS MODAL */}
      {showStats && (
        <div onClick={() => { setShowStats(false); setShowCalendar(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, borderRadius: "16px", padding: "24px", width: "340px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>
              📊 Статистика — {monthName}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: t.modalItemBg, borderRadius: "8px" }}>
                <span style={{ color: t.textMuted, fontSize: "13px" }}>💰 Потрачено (веб)</span>
                <span style={{ color: t.accent, fontWeight: "700", fontSize: "15px" }}>${stats.cost.toFixed(4)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: t.modalItemBg, borderRadius: "8px" }}>
                <span style={{ color: t.textMuted, fontSize: "13px" }}>💬 Сообщений</span>
                <span style={{ color: t.text, fontSize: "14px" }}>{stats.messages}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: t.modalItemBg, borderRadius: "8px" }}>
                <span style={{ color: t.textMuted, fontSize: "13px" }}>📥 Входящих токенов</span>
                <span style={{ color: t.text, fontSize: "14px" }}>{stats.input_tokens.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: t.modalItemBg, borderRadius: "8px" }}>
                <span style={{ color: t.textMuted, fontSize: "13px" }}>📤 Исходящих токенов</span>
                <span style={{ color: t.text, fontSize: "14px" }}>{stats.output_tokens.toLocaleString()}</span>
              </div>

              {/* CALENDAR BUTTON */}
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                style={{ background: t.modalItemBg, border: `1px solid ${t.modalBorder}`, borderRadius: "8px", padding: "10px 12px", color: t.text, fontSize: "13px", cursor: "pointer", textAlign: "left" }}
              >
                📅 {showCalendar ? "Скрыть календарь" : "История по дням"}
              </button>

              {/* CALENDAR */}
              {showCalendar && (
                <div style={{ background: t.modalItemBg, borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "8px", textAlign: "center", fontWeight: "600" }}>
                    {now.toLocaleString("ru", { month: "long", year: "numeric" })}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
                    {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => (
                      <div key={d} style={{ textAlign: "center", fontSize: "10px", color: t.textDim, padding: "2px" }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} />;
                      const date = new Date(now.getFullYear(), now.getMonth(), day);
                      const dayData = loadDayStats(date);
                      const isToday = day === now.getDate();
                      const hasActivity = dayData.messages > 0;
                      return (
                        <div
                          key={day}
                          title={hasActivity ? `${dayData.messages} сообщ. | $${dayData.cost.toFixed(4)}` : ""}
                          style={{
                            textAlign: "center",
                            padding: "4px 2px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            background: isToday ? t.accent : hasActivity ? (theme === "dark" ? "#1a1a2e" : "#ede9fe") : "transparent",
                            color: isToday ? "#fff" : hasActivity ? t.accentText : t.textDim,
                            border: isToday ? `1px solid ${t.accent}` : hasActivity ? `1px solid ${theme === "dark" ? "#4f46e5" : "#c4b5fd"}` : "1px solid transparent",
                            cursor: hasActivity ? "pointer" : "default",
                          }}
                        >
                          {day}
                          {hasActivity && <div style={{ fontSize: "9px", color: isToday ? "#fff" : t.accentText }}>${dayData.cost.toFixed(2)}</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "11px", color: t.textDim, textAlign: "center" }}>
                    Наведи на день чтобы увидеть детали
                  </div>
                </div>
              )}

              <div style={{ padding: "10px 12px", background: theme === "dark" ? "#1a1a2e" : "#ede9fe", border: `1px solid ${t.accent}`, borderRadius: "8px", fontSize: "12px", color: t.accentText, textAlign: "center" }}>
                Только веб-версия. Сбрасывается 1-го числа.
              </div>
            </div>
            <button
              onClick={() => { setShowStats(false); setShowCalendar(false); }}
              style={{ marginTop: "16px", width: "100%", background: t.accent, border: "none", borderRadius: "8px", padding: "10px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, borderRadius: "16px", padding: "24px", width: "300px" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>
              ⚙️ Настройки
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* THEME TOGGLE */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: t.modalItemBg, borderRadius: "10px" }}>
                <span style={{ color: t.text, fontSize: "14px" }}>
                  {theme === "dark" ? "🌙 Тёмная тема" : "☀️ Светлая тема"}
                </span>
                <div
                  onClick={toggleTheme}
                  style={{
                    width: "44px", height: "24px", borderRadius: "12px",
                    background: theme === "dark" ? t.accent : "#d1d5db",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "2px",
                    left: theme === "dark" ? "22px" : "2px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>

              {/* CLEAR ALL */}
              <button
                onClick={clearAll}
                style={{
                  background: "transparent", border: "1px solid #ef4444",
                  borderRadius: "10px", padding: "12px",
                  color: "#ef4444", fontSize: "14px", cursor: "pointer", textAlign: "left",
                }}
              >
                🗑️ Очистить всё (чат + статистика)
              </button>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              style={{ marginTop: "16px", width: "100%", background: t.accent, border: "none", borderRadius: "8px", padding: "10px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: t.sidebar, borderRight: `1px solid ${t.sidebarBorder}`, display: "flex", flexDirection: "column", padding: "16px", gap: "8px" }}>

        {/* AVATAR + DROPDOWN */}
        <div style={{ position: "relative", marginBottom: "8px", paddingBottom: "12px", borderBottom: `1px solid ${t.sidebarBorder}` }} ref={menuRef}>
          <div onClick={() => setShowMenu(!showMenu)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${t.accent}`, flexShrink: 0 }}>
              <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>Anna Bot</div>
              <div style={{ fontSize: "11px", color: t.textDim }}>${stats.cost.toFixed(3)} этот месяц</div>
            </div>
            <div style={{ color: t.textDim, fontSize: "12px" }}>{showMenu ? "▲" : "▼"}</div>
          </div>

          {showMenu && (
            <div style={{ position: "absolute", top: "48px", left: 0, right: 0, background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, borderRadius: "10px", overflow: "hidden", zIndex: 100 }}>
              <button
                onClick={() => { setShowStats(true); setShowMenu(false); }}
                style={{ width: "100%", background: "transparent", border: "none", padding: "10px 14px", color: t.text, fontSize: "13px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme === "dark" ? "#252525" : "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                📊 Статистика расходов
              </button>
              <button
                onClick={() => { setShowSettings(true); setShowMenu(false); }}
                style={{ width: "100%", background: "transparent", border: "none", padding: "10px 14px", color: t.text, fontSize: "13px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme === "dark" ? "#252525" : "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                ⚙️ Настройки
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: "11px", color: t.textDim, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
          Режимы
        </div>

        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleMode(mode)}
            style={{
              background: activeMode === mode.id ? (theme === "dark" ? "#1a1a2e" : "#ede9fe") : "transparent",
              border: activeMode === mode.id ? `1px solid ${t.accent}` : "1px solid transparent",
              color: activeMode === mode.id ? t.accentText : t.textMuted,
              padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
              textAlign: "left", fontSize: "13px", transition: "all 0.15s",
            }}
          >
            {mode.label}
          </button>
        ))}

        <div style={{ fontSize: "11px", color: t.textDim, textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", marginBottom: "4px" }}>
          Быстрые команды
        </div>

        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => sendMessage(cmd.value)}
            style={{ background: "transparent", border: "1px solid transparent", color: theme === "dark" ? "#666" : "#aaa", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "12px", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.target.style.color = t.textMuted; e.target.style.borderColor = t.sidebarBorder; }}
            onMouseLeave={(e) => { e.target.style.color = theme === "dark" ? "#666" : "#aaa"; e.target.style.borderColor = "transparent"; }}
          >
            {cmd.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "12px", alignItems: "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${t.accent}`, flexShrink: 0 }}>
                  <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{
                maxWidth: "70%", padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? t.userBg : t.msgBg,
                border: `1px solid ${msg.role === "user" ? t.userBorder : t.msgBorder}`,
                color: t.text, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: t.userBg, border: `1px solid ${t.userBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${t.accent}`, flexShrink: 0 }}>
                <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: t.msgBg, border: `1px solid ${t.msgBorder}`, color: theme === "dark" ? "#666" : "#aaa", fontSize: "14px" }}>
                ⏳ Думаю...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.sidebarBorder}`, background: t.inputBarBg }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напиши сообщение... (Enter — отправить, Shift+Enter — новая строка)"
              rows={1}
              style={{
                flex: 1, background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                borderRadius: "12px", padding: "12px 16px", color: t.text,
                fontSize: "14px", resize: "none", outline: "none",
                fontFamily: "inherit", lineHeight: "1.5", maxHeight: "120px", overflow: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? t.btnDisabledBg : t.accent,
                border: "none", borderRadius: "12px", padding: "12px 20px",
                color: loading || !input.trim() ? t.btnDisabledText : "#fff",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "14px", fontWeight: "600", transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              Отправить →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
