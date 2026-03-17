"use client";

export default function LinkItem({ link, colors }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div onClick={handleClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: colors.modalItemBg, border: "1px solid " + colors.modalBorder, borderRadius: "10px", textDecoration: "none", marginBottom: "8px", cursor: "pointer" }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: "600", color: colors.text }}>{link.label}</div>
        <div style={{ fontSize: "12px", color: colors.textDim }}>{link.desc}</div>
      </div>
      <div style={{ color: colors.textDim, fontSize: "14px" }}>↗</div>
    </div>
  );
}
