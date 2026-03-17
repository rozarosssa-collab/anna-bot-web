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

export default function Home() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("anna_chat_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [INITIAL_MESSAGE];
        }
      }
    }
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveHistory = (msgs) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("anna_chat_history", JSON.stringify(msgs));
    }
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

  const AvatarBot = () => (
    <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid #4f46e5", flexShrink: 0 }}>
      <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column", padding: "16px", gap: "8px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", paddingBottom: "12px", borderBottom: "1px solid #222" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid #4f46e5", flexShrink: 0 }}>
            <img src="/anna-avatar.jpg" alt="Anna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>Anna Bot</span>
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
              {msg.role === "assistant" && <AvatarBot />}
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
              <AvatarBot />
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
