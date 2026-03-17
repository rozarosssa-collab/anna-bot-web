export default function LinksPage() {
  const links = [
    { label: "🚂 Railway", desc: "Хостинг Telegram бота", url: "https://railway.app" },
    { label: "▲ Vercel", desc: "Хостинг веб-версии", url: "https://vercel.com" },
    { label: "🤖 Anthropic", desc: "Claude API + расходы", url: "https://console.anthropic.com" },
    { label: "🎙 OpenAI", desc: "Whisper голос", url: "https://platform.openai.com" },
    { label: "📺 YouTube API", desc: "Аналитика каналов", url: "https://console.cloud.google.com" },
    { label: "🗄 Upstash", desc: "Redis база данных", url: "https://console.upstash.com" },
    { label: "🐙 GitHub", desc: "Репозитории кода", url: "https://github.com/rozarosssa-collab" },
    { label: "💬 Telegram Bot", desc: "@Anna_yt_assistant_bot", url: "https://t.me/Anna_yt_assistant_bot" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "24px", textAlign: "center" }}>🔗 Сервисы</div>
        {links.map(link => (
          <div key={link.url} style={{ marginBottom: "10px" }}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#161616", border: "1px solid #333", borderRadius: "12px", textDecoration: "none" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#e5e5e5" }}>{link.label}</div>
                <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>{link.desc}</div>
              </div>
              <div style={{ color: "#555", fontSize: "18px" }}>↗</div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
