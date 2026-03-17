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
  const [stats, setStats] = useState({ cost: 0, messages: 0, input_tokens: 0, output_tokens: 0 });
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setStats(loadStats());
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

  const clearChat = () => {
    const initial = [{ role: "assistant", content: "История очищена. Начинаем заново." }];
    setMessages(initial);
    saveHistory(initial);
    setActiveMode(null);
  };

  const now = new Date();
  const monthName = now.toLocaleString("ru", { month: "long" });

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>

      {/* STATS MODAL */}
      {showStats && (
        <div
          onClick={() => setShowStats(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#161616", border: "1px solid #333", borderRadius: "16px", padding: "24px", width: "300px" }}
          >
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "16px" }}>
              📊 Статистика — {monthName}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#1a1a1a", borderRadius: "8px" }}>
                <span style={{ color: "#888", fontSize: "13px" }}>💰 Потрачено (веб)</span>
                <span style={{ color: "#818cf8", fontWeight: "700", fontSize: "15px" }}>${stats.cost.toFixed(4)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#1a1a1a", borderRadius: "8px" }}>
                <span style={{ color: "#888", fontSize: "13px" }}>💬 Сообщений</span>
                <span style={{ color: "#fff", fontSize: "14px" }}>{stats.messages}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#1a1a1a", borderRadius: "8px" }}>
                <span style={{ color: "#888", fontSize: "13px" }}>📥 Входящих токенов</span>
                <span style={{ color: "#fff", fontSize: "14px" }}>{stats.input_tokens.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#1a1a1a", borderRadius: "8px" }}>
                <span style={{ color: "#888", fontSize: "13px" }}>📤 Исходящих токенов</span>
                <span style={{ color: "#fff", fontSize: "14px" }}>{stats.output_tokens.toLocaleString()}</span>
              </div>
              <div style={{ padding: "10px 12px", background: "#1a1a2e", border: "1px solid #4f46e5", borderRadius: "8px", fontSize: "12px", color: "#818cf8", textAlign: "center" }}>
                Только веб-версия. Сбрасывается 1-го числа.
              </div>
            </div>
            <button
              onClick={() => setShowStats(false)}
              style={{ marginTop: "16px", width: "100%", background: "#4f46e5", border: "none", borderRadius: "8px", padding: "10px", color: "#fff", cursor: "pointer", fontSize: "14px" }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column", padding: "16px", gap: "8px" }}>

        {/* AVATAR + DROPDOWN */}
        <div style={{ position: "relative", marginBottom: "8px", paddingBottom: "12px", borderBottom: "1px solid #222" }} ref={menuRef}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", overflow: "hidden", border: "1px solid #4f46e5", flexShrink: 0 }}>
              <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>Anna Bot</div>
              <div style={{ fontSize: "11px", color: "#555" }}>${stats.cost.toFixed(3)} этот месяц</div>
            </div>
            <div style={{ color: "#555", fontSize: "12px" }}>{showMenu ? "▲" : "▼"}</div>
          </div>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div style={{
              position: "absolute",
              top: "48px",
              left: 0,
              right: 0,
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "10px",
              overflow: "hidden",
              zIndex: 100,
            }}>
              <button
                onClick={() => { setShowStats(true); setShowMenu(false); }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "10px 14px",
                  color: "#ccc",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#252525"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                📊 Статистика расходов
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
          Режимы
        </div>

        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleMode(mode)}
            style={{
              background: activeMode === mode.id ? "#1a1a2e" : "transparent",
              border: activeMode === mode.id ? "1px solid #4f46e5" : "1px solid transparent",
              color: activeMode === mode.id ? "#818cf8" : "#999",
              padding: "8px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              transition: "all 0.15s",
            }}
          >
            {mode.label}
          </button>
        ))}

        <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", marginBottom: "4px" }}>
          Быстрые команды
        </div>

        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => sendMessage(cmd.value)}
            style={{
              background: "transparent",
              border: "1px solid transparent",
              color: "#666",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.target.style.color = "#999"; e.target.style.borderColor = "#333"; }}
            onMouseLeave={(e) => { e.target.style.color = "#666"; e.target.style.borderColor = "transparent"; }}
          >
            {cmd.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={clearChat}
          style={{
            background: "transparent",
            border: "1px solid #333",
            color: "#555",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          🧹 Очистить чат
        </button>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid #4f46e5", flexShrink: 0 }}>
                  <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "#1a1a2e" : "#161616",
                  border: msg.role === "user" ? "1px solid #4f46e5" : "1px solid #222",
                  color: "#e5e5e5",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#1a1a2e", border: "1px solid #4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid #4f46e5", flexShrink: 0 }}>
                <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "#161616", border: "1px solid #222", color: "#666", fontSize: "14px" }}>
                ⏳ Думаю...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #222", background: "#0d0d0d" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напиши сообщение... (Enter — отправить, Shift+Enter — новая строка)"
              rows={1}
              style={{
                flex: 1,
                background: "#161616",
                border: "1px solid #333",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#e5e5e5",
                fontSize: "14px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: "1.5",
                maxHeight: "120px",
                overflow: "auto",
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
                background: loading || !input.trim() ? "#1a1a1a" : "#4f46e5",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                color: loading || !input.trim() ? "#444" : "#fff",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
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
