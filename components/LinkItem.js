export default function LinkItem({ link, colors }) {
  const style = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px", background: colors.modalItemBg, border: "1px solid " + colors.modalBorder,
    borderRadius: "10px", textDecoration: "none", marginBottom: "8px",
  };
  return React.createElement("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", style: style },
    React.createElement("div", null,
      React.createElement("div", { style: { fontSize: "14px", fontWeight: "600", color: colors.text } }, link.label),
      React.createElement("div", { style: { fontSize: "12px", color: colors.textDim } }, link.desc)
    ),
    React.createElement("div", { style: { color: colors.textDim, fontSize: "14px" } }, "↗")
  );
}
