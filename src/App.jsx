import { useState, useMemo } from "react";


// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F5F7", surface: "#FFFFFF", surfaceHover: "#FAFAFA",
  border: "#E8EAED", borderStrong: "#D0D4DA",
  text: "#0F1117", textMid: "#2D3340", textSub: "#5C6270", textMuted: "#9299A6",
  accent: "#E86C2C", accentHover: "#D4601F", accentLight: "#FEF3EC", accentBorder: "#F5B894",
  sidebar: "#FFFFFF", sidebarBorder: "#E8EAED", activeNav: "#FEF3EC", activeNavText: "#C85A1E",
  green: "#1A7F4B", greenLight: "#F0FBF5", greenBorder: "#A8DDBE",
  red: "#C8252A", redLight: "#FEF2F2", redBorder: "#F5BBBE",
  blue: "#2255CC", blueLight: "#EEF3FD", blueBorder: "#AABFF5",
  amber: "#B86B00", amberLight: "#FDF8EE", amberBorder: "#F0D48A",
  purple: "#6930C4", purpleLight: "#F4F0FD", purpleBorder: "#CCBAF2",
};

const STATUS_COLORS_LIGHT = {
  Lead: { bg: T.blueLight, text: T.blue, dot: T.blue, border: T.blueBorder },
  Estimate: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder },
  Active: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder },
  Complete: { bg: T.purpleLight, text: T.purple, dot: T.purple, border: T.purpleBorder },
  "On Hold": { bg: T.redLight, text: T.red, dot: T.red, border: T.redBorder },
};
const INVOICE_STATUS_LIGHT = {
  Paid: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder },
  Pending: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder },
  Overdue: { bg: T.redLight, text: T.red, dot: T.red, border: T.redBorder },
  Draft: { bg: T.bg, text: T.textSub, dot: T.textMuted, border: T.border },
};
const CO_STATUS_LIGHT = {
  Approved: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder },
  Pending: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder },
  Rejected: { bg: T.redLight, text: T.red, dot: T.red, border: T.redBorder },
  Void: { bg: T.bg, text: T.textSub, dot: T.textMuted, border: T.border },
};
const EST_STATUS = {
  Approved: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder },
  Sent: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder },
  Draft: { bg: T.bg, text: T.textSub, dot: T.textMuted, border: T.border },
};
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  projects: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  contacts: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  estimates: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  invoices: "M12 1v22 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  schedule: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  logs: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  docs: "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7",
  changeorder: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  budget: "M2 2h20v4H2z M2 10h20v4H2z M2 18h20v4H2z",
  bids: "M9 12h6 M9 16h6 M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z",
  photos: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
  plus: "M12 5v14 M5 12h14",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  chevron: "M9 18l6-6-6-6",
  arrow: "M5 12h14 M12 5l7 7-7 7",
  search: "M11 17a6 6 0 100-12 6 6 0 000 12z M21 21l-4.35-4.35",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01-.07.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  building: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  trending: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  users: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 7a4 4 0 100 8 4 4 0 000-8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  award: "M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  menu: "M3 12h18 M3 6h18 M3 18h18",
  close: "M18 6L6 18 M6 6l12 12",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  image: "M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z M8.5 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M21 15l-5-5L5 21",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
  print: "M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6z",
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Badge = ({ status, map = STATUS_COLORS_LIGHT }) => {
  const s = map[status] || { bg: "#F3F5F7", text: T.textSub, dot: T.textMuted, border: T.border };
  return (
    <span style={{ background: s.bg, color: s.text, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${s.border || s.bg}`, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot || s.text, display: "inline-block", flexShrink: 0 }} />
      {status}
    </span>
  );
};

const StatCard = ({ label, value, sub, color = T.accent, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: color, borderRadius: "10px 0 0 10px" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: color + "12", display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon d={ICONS[icon] || ICONS.dashboard} size={14} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>{sub}</div>}
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text", placeholder, readOnly }) => (
  <div>
    {label && <label style={{ fontSize: 11, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={{ width: "100%", background: readOnly ? T.bg : T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s", cursor: readOnly ? "default" : "text" }}
      onFocus={e => { if (!readOnly) { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18`; }}}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3 }) => (
  <div>
    {label && <label style={{ fontSize: 11, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>}
    <textarea value={value} onChange={onChange} rows={rows}
      style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
      onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accent}18`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    {label && <label style={{ fontSize: 11, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>}
    <select value={value} onChange={onChange}
      style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239299A6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const PageHeader = ({ eyebrow, title, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
    <div>
      {eyebrow && <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{eyebrow}</div>}
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{title}</div>
    </div>
    {action}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", small, danger }) => {
  const base = { borderRadius: 7, padding: small ? "6px 12px" : "8px 16px", fontWeight: 600, fontSize: small ? 12 : 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", letterSpacing: "0.01em", border: "none" };
  const variants = {
    primary: { background: T.accent, color: "#fff" },
    secondary: { background: T.surface, color: T.textMid, border: `1px solid ${T.border}` },
    ghost: { background: "transparent", color: T.accent, border: `1px solid ${T.accentBorder}` },
    danger: { background: T.redLight, color: T.red, border: `1px solid ${T.redBorder}` },
  };
  const s = danger ? variants.danger : variants[variant] || variants.primary;
  return (
    <button onClick={onClick} style={{ ...base, ...s }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.82"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
};

const ConfirmDelete = ({ message, onConfirm, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: T.surface, borderRadius: 12, padding: 28, maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>Delete Confirmation</div>
      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn onClick={onCancel} variant="secondary">Cancel</Btn>
        <Btn onClick={onConfirm} danger>Delete</Btn>
      </div>
    </div>
  </div>
);

const Modal = ({ title, onClose, children, width = 640 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,0.35)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: T.surface, borderRadius: 12, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: T.surface, zIndex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub, padding: 4 }}><Icon d={ICONS.x} size={18} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const ProjectCard = ({ project, onClick }) => {
  const budget_pct = project.value ? Math.round((project.spent / project.value) * 100) : 0;
  return (
    <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 16 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 3, lineHeight: 1.3 }}>{project.name}</div>
          <div style={{ fontSize: 12, color: T.textSub }}>{project.client}</div>
        </div>
        <Badge status={project.status} />
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <div><div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Contract</div><div style={{ fontSize: 15, fontWeight: 700, color: T.accent }}>{fmt(project.value)}</div></div>
        <div><div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Spent</div><div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{fmt(project.spent)}</div></div>
        <div><div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Phase</div><div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{project.phase}</div></div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, marginBottom: 7 }}><span style={{ fontWeight: 500 }}>Progress</span><span style={{ fontWeight: 700, color: T.textMid }}>{project.progress}%</span></div>
        <div style={{ height: 4, background: T.border, borderRadius: 4 }}>
          <div style={{ height: "100%", width: `${project.progress}%`, borderRadius: 4, background: project.progress === 100 ? T.purple : project.progress > 70 ? T.green : T.accent }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <span>Budget used: <span style={{ color: budget_pct > 90 ? T.red : budget_pct > 70 ? T.amber : T.green, fontWeight: 700 }}>{budget_pct}%</span></span>
        <span>{project.address.split(",")[1]?.trim() || project.address}</span>
      </div>
    </div>
  );
};

const TH = ({ children, right }) => <th style={{ padding: "11px 16px", textAlign: right ? "right" : "left", fontSize: 11, color: T.textSub, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</th>;
const TD = ({ children, right, bold, muted, accent }) => <td style={{ padding: "13px 16px", fontSize: 13, textAlign: right ? "right" : "left", color: accent ? T.accent : muted ? T.textSub : T.text, fontWeight: bold ? 700 : 400 }}>{children}</td>;

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ projects, invoices, contacts, changeOrders, onNav }) => {
  const activeProjects = projects.filter(p => p.status === "Active");
  const totalRevenue = projects.reduce((s, p) => s + p.value, 0);
  const overdueInv = invoices.filter(i => i.status === "Overdue");
  const pendingInv = invoices.filter(i => i.status === "Pending");
  const pendingAmt = [...overdueInv, ...pendingInv].reduce((s, i) => s + i.amount, 0);
  const pendingCOs = changeOrders.filter(co => co.status === "Pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Good morning, Jake 👷</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 5 }}>Thursday, March 12, 2026 · Dallas, TX</div>
        </div>
        <Btn onClick={() => onNav("projects")}><Icon d={ICONS.plus} size={14} /> New Project</Btn>
      </div>

      <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Active Projects" value={activeProjects.length} sub={`${projects.length} total jobs`} color={T.accent} icon="projects" />
        <StatCard label="Total Pipeline" value={fmt(totalRevenue)} sub={`${projects.length} projects`} color={T.green} icon="trending" />
        <StatCard label="Receivables Due" value={fmt(pendingAmt)} sub={`${overdueInv.length} overdue`} color={overdueInv.length > 0 ? T.red : T.amber} icon="invoices" />
        <StatCard label="Pending COs" value={pendingCOs.length} sub={`${fmt(pendingCOs.reduce((s, c) => s + c.amount, 0))} exposure`} color={T.purple} icon="changeorder" />
      </div>

      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Active Projects</span>
            <button onClick={() => onNav("projects")} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeProjects.map(p => (
              <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{p.phase} · {p.client}</div>
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, marginBottom: 5 }}><span>{p.progress}%</span><span style={{ color: T.accent, fontWeight: 600 }}>{fmt(p.value)}</span></div>
                  <div style={{ height: 4, background: T.bg, borderRadius: 4 }}><div style={{ height: "100%", width: `${p.progress}%`, background: T.accent, borderRadius: 4 }} /></div>
                </div>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Receivables</div>
            {[...overdueInv, ...pendingInv].slice(0,4).map(inv => {
              const project = projects.find(p => p.id === inv.projectId);
              return (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{inv.number}</div><div style={{ fontSize: 11, color: T.textSub, marginTop: 1 }}>{project?.name?.substring(0, 20)}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{fmt(inv.amount)}</div><Badge status={inv.status} map={INVOICE_STATUS_LIGHT} /></div>
                </div>
              );
            })}
            {[...overdueInv, ...pendingInv].length === 0 && <div style={{ fontSize: 12, color: T.textMuted, textAlign: "center", padding: "12px 0" }}>All invoices paid ✓</div>}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Pipeline</div>
            {["Lead", "Estimate", "Active", "Complete"].map(s => {
              const count = projects.filter(p => p.status === s).length;
              const val = projects.filter(p => p.status === s).reduce((sum, p) => sum + p.value, 0);
              const sc = STATUS_COLORS_LIGHT[s];
              return (
                <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc?.dot, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: T.textMid }}>{s}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, background: T.bg, padding: "1px 7px", borderRadius: 10, fontWeight: 500 }}>{count}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmt(val)}</span>
                </div>
              );
            })}
          </div>

          {pendingCOs.length > 0 && (
            <div style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.amber, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon d={ICONS.alert} size={14} stroke={T.amber} /> {pendingCOs.length} Pending Change Orders
              </div>
              {pendingCOs.map(co => (
                <div key={co.id} style={{ padding: "7px 0", borderBottom: `1px solid ${T.amberBorder}`, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: T.text, marginBottom: 2 }}>{co.number} – {co.title.substring(0, 30)}{co.title.length > 30 ? "..." : ""}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textSub }}>{projects.find(p => p.id === co.projectId)?.name?.substring(0, 20)}</span>
                    <span style={{ color: T.amber, fontWeight: 700 }}>+{fmt(co.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ─── PROJECTS ─────────────────────────────────────────────────────────────────
const Projects = ({ projects, setProjects, estimates, setEstimates, invoices, setInvoices, budgetItems, setBudgetItems, changeOrders, onNav }) => {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [newProj, setNewProj] = useState({ name: "", client: "", status: "Lead", type: "Residential", value: "", address: "", phase: "Pre-Construction", start: "", end: "", notes: "" });

  const PHASES = ["Pre-Construction","Demo & Site Prep","Foundation","Framing","MEP Rough-In","Insulation","Drywall","Finishes","Punch List","Closeout"];
  const statuses = ["All", "Lead", "Estimate", "Active", "On Hold", "Complete"];
  const filtered = filter === "All" ? projects : projects.filter(p => p.status === filter);

  const handleAdd = () => {
    if (!newProj.name || !newProj.client) return;
    setProjects([...projects, { ...newProj, id: Date.now(), value: parseFloat(newProj.value) || 0, spent: 0, progress: 0 }]);
    setShowForm(false);
    setNewProj({ name: "", client: "", status: "Lead", type: "Residential", value: "", address: "", phase: "Pre-Construction", start: "", end: "", notes: "" });
  };

  const handleDelete = (id) => {
    setProjects(projects.filter(p => p.id !== id));
    setDeleteId(null);
    if (selected === id) setSelected(null);
  };

  const handleSaveEdit = () => {
    setProjects(projects.map(p => p.id === editProj.id ? { ...editProj, value: parseFloat(editProj.value) || 0, progress: parseInt(editProj.progress) || 0 } : p));
    setEditMode(false);
  };

  // ── Project Detail View ──
  if (selected) {
    const p = projects.find(x => x.id === selected);
    if (!p) { setSelected(null); return null; }
    const budget_pct = p.value ? Math.round((p.spent / p.value) * 100) : 0;
    const projEstimates = estimates.filter(e => e.projectId === p.id);
    const projInvoices = invoices.filter(i => i.projectId === p.id);
    const projCOs = changeOrders.filter(co => co.projectId === p.id);
    const projBudget = budgetItems.filter(b => b.projectId === p.id);
    const totalBudgeted = projBudget.reduce((s, b) => s + b.budgeted, 0);
    const totalActual = projBudget.reduce((s, b) => s + b.actual, 0);
    const totalCommitted = projBudget.reduce((s, b) => s + b.committed, 0);
    const tabs = ["overview", "budget", "estimates", "invoices", "change orders", "logs"];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {deleteId && <ConfirmDelete message={`Delete "${p.name}"? This cannot be undone.`} onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={() => setSelected(null)} variant="secondary" small>← Back</Btn>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{p.client} · {p.address}</div>
            </div>
            <Badge status={p.status} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => { setEditProj({...p}); setEditMode(true); }} variant="secondary" small><Icon d={ICONS.edit} size={13} /> Edit</Btn>
            <Btn onClick={() => setDeleteId(p.id)} danger small><Icon d={ICONS.trash} size={13} /> Delete</Btn>
          </div>
        </div>

        <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <StatCard label="Contract Value" value={fmt(p.value)} color={T.accent} icon="dollar" />
          <StatCard label="Spent to Date" value={fmt(p.spent)} sub={`${budget_pct}% of budget`} color={budget_pct > 90 ? T.red : T.green} icon="trending" />
          <StatCard label="Remaining" value={fmt(p.value - p.spent)} color={p.value - p.spent < 0 ? T.red : T.purple} icon="dollar" />
          <StatCard label="Progress" value={`${p.progress}%`} sub={p.phase} color={T.amber} icon="projects" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.border}` }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: "9px 16px", border: "none", borderBottom: activeTab === t ? `2px solid ${T.accent}` : "2px solid transparent", background: "none", color: activeTab === t ? T.accent : T.textSub, fontSize: 13, fontWeight: activeTab === t ? 600 : 400, cursor: "pointer", textTransform: "capitalize", marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          editMode ? (
            <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>Edit Project</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Input label="Project Name" value={editProj.name} onChange={e => setEditProj({ ...editProj, name: e.target.value })} />
                <Input label="Client" value={editProj.client} onChange={e => setEditProj({ ...editProj, client: e.target.value })} />
                <Input label="Contract Value" type="number" value={editProj.value} onChange={e => setEditProj({ ...editProj, value: e.target.value })} />
                <Input label="Address" value={editProj.address} onChange={e => setEditProj({ ...editProj, address: e.target.value })} />
                <Input label="Start Date" type="date" value={editProj.start} onChange={e => setEditProj({ ...editProj, start: e.target.value })} />
                <Input label="End Date" type="date" value={editProj.end} onChange={e => setEditProj({ ...editProj, end: e.target.value })} />
                <Select label="Status" value={editProj.status} onChange={e => setEditProj({ ...editProj, status: e.target.value })} options={["Lead","Estimate","Active","On Hold","Complete"]} />
                <Select label="Type" value={editProj.type} onChange={e => setEditProj({ ...editProj, type: e.target.value })} options={["Residential","Commercial","Industrial"]} />
                <Select label="Current Phase" value={editProj.phase} onChange={e => setEditProj({ ...editProj, phase: e.target.value })} options={PHASES} />
                <Input label="Progress %" type="number" value={editProj.progress} onChange={e => setEditProj({ ...editProj, progress: e.target.value })} />
                <div style={{ gridColumn: "span 2" }}>
                  <Textarea label="Notes" value={editProj.notes || ""} onChange={e => setEditProj({ ...editProj, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Btn onClick={handleSaveEdit}>Save Changes</Btn>
                <Btn onClick={() => setEditMode(false)} variant="secondary">Cancel</Btn>
              </div>
            </div>
          ) : (
            <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Project Details</div>
                {[["Client", p.client], ["Type", p.type], ["Address", p.address], ["Start Date", fmtDate(p.start)], ["End Date", fmtDate(p.end)], ["Current Phase", p.phase], ["Status", p.status]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ color: T.textSub }}>{k}</span><span style={{ color: T.text, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                {p.notes && <div style={{ marginTop: 14, fontSize: 13, color: T.textMid, lineHeight: 1.65, borderLeft: `3px solid ${T.accentBorder}`, paddingLeft: 12 }}>{p.notes}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Financial Summary</div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSub, marginBottom: 8 }}><span>Budget used</span><span style={{ color: budget_pct > 90 ? T.red : T.amber, fontWeight: 600 }}>{budget_pct}%</span></div>
                    <div style={{ height: 7, background: T.bg, borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${Math.min(budget_pct, 100)}%`, background: budget_pct > 90 ? T.red : budget_pct > 70 ? T.amber : T.green, borderRadius: 4 }} />
                    </div>
                  </div>
                  {[["Contract Value", fmt(p.value), T.accent], ["Spent to Date", fmt(p.spent), T.text], ["Remaining", fmt(p.value - p.spent), p.value - p.spent < 0 ? T.red : T.green], ["Invoiced Total", fmt(projInvoices.reduce((s,i) => s + i.amount, 0)), T.blue], ["Approved COs", fmt(projCOs.filter(c=>c.status==="Approved").reduce((s,c)=>s+c.amount,0)), T.green]].map(([k, v, c]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                      <span style={{ color: T.textSub }}>{k}</span><span style={{ color: c, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Quick Stats</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[["Estimates", projEstimates.length, T.blue], ["Invoices", projInvoices.length, T.accent], ["Change Orders", projCOs.length, T.amber], ["Budget Lines", projBudget.length, T.green]].map(([k, v, c]) => (
                      <div key={k} style={{ background: T.bg, borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Budget Tab */}
        {activeTab === "budget" && <ProjectBudget projectId={p.id} budgetItems={budgetItems} setBudgetItems={setBudgetItems} project={p} setProjects={setProjects} projects={projects} />}

        {/* Estimates Tab */}
        {activeTab === "estimates" && (
          <ProjectEstimates projectId={p.id} estimates={projEstimates} setEstimates={setEstimates} project={p} allEstimates={estimates} />
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <ProjectInvoices projectId={p.id} invoices={projInvoices} setInvoices={setInvoices} project={p} allInvoices={invoices} />
        )}

        {/* Change Orders Tab */}
        {activeTab === "change orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {projCOs.length === 0 ? (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.textMuted }}>No change orders for this project</div>
                <div style={{ marginTop: 12 }}><Btn onClick={() => onNav("changeorders")} variant="secondary" small>Go to Change Orders →</Btn></div>
              </div>
            ) : projCOs.map(co => (
              <div key={co.id} style={{ background: T.surface, border: `1px solid ${co.status === "Pending" ? T.amberBorder : T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{co.number} — {co.title}</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 3 }}>{co.category} · Requested by {co.requestedBy} · {co.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>+{fmt(co.amount)}</span>
                    <Badge status={co.status} map={CO_STATUS_LIGHT} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.textMid }}>{co.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && <div style={{ fontSize: 13, color: T.textSub, padding: 20, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>Go to <button onClick={() => onNav("logs")} style={{ color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Daily Logs</button> to view and add field reports for this project.</div>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this project? This cannot be undone." onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <PageHeader eyebrow="All Jobs" title="Projects"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> New Project</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>New Project</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Project Name" value={newProj.name} onChange={e => setNewProj({ ...newProj, name: e.target.value })} placeholder="e.g. Riverside Luxury Remodel" />
            <Input label="Client Name" value={newProj.client} onChange={e => setNewProj({ ...newProj, client: e.target.value })} placeholder="e.g. Marcus & Diane Webb" />
            <Input label="Contract Value" type="number" value={newProj.value} onChange={e => setNewProj({ ...newProj, value: e.target.value })} placeholder="0" />
            <Input label="Address" value={newProj.address} onChange={e => setNewProj({ ...newProj, address: e.target.value })} />
            <Input label="Start Date" type="date" value={newProj.start} onChange={e => setNewProj({ ...newProj, start: e.target.value })} />
            <Input label="End Date" type="date" value={newProj.end} onChange={e => setNewProj({ ...newProj, end: e.target.value })} />
            <Select label="Status" value={newProj.status} onChange={e => setNewProj({ ...newProj, status: e.target.value })} options={["Lead","Estimate","Active","On Hold"]} />
            <Select label="Type" value={newProj.type} onChange={e => setNewProj({ ...newProj, type: e.target.value })} options={["Residential","Commercial","Industrial"]} />
            <div style={{ gridColumn: "span 2" }}>
              <Textarea label="Notes" value={newProj.notes} onChange={e => setNewProj({ ...newProj, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Create Project</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {statuses.map(s => {
          const isActive = filter === s;
          const count = s === "All" ? projects.length : projects.filter(p => p.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{ background: isActive ? T.accent : T.surface, color: isActive ? "#fff" : T.textMid, border: `1px solid ${isActive ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: isActive ? 600 : 500, cursor: "pointer" }}>
              {s} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="projects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ position: "relative" }}>
            <ProjectCard project={p} onClick={() => setSelected(p.id)} />
            <button onClick={e => { e.stopPropagation(); setDeleteId(p.id); }}
              style={{ position: "absolute", top: 12, right: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: T.textMuted, opacity: 0, transition: "opacity 0.15s", zIndex: 2 }}
              onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.redBorder; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
              ref={el => { if (el) { el.closest("[data-card]")?.addEventListener("mouseenter", () => el.style.opacity = "1"); el.closest("[data-card]")?.addEventListener("mouseleave", () => el.style.opacity = "0"); } }}>
              <Icon d={ICONS.trash} size={13} />
            </button>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>No projects found</div>
          <div style={{ marginTop: 12 }}><Btn onClick={() => setShowForm(true)}>+ Create First Project</Btn></div>
        </div>
      )}
    </div>
  );
};

// ─── PROJECT BUDGET (sub-component) ──────────────────────────────────────────
const ProjectBudget = ({ projectId, budgetItems, setBudgetItems, project, setProjects, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ category: "", budgeted: "", actual: "", committed: "", notes: "" });

  const items = budgetItems.filter(b => b.projectId === projectId);
  const totalBudgeted = items.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = items.reduce((s, b) => s + b.actual, 0);
  const totalCommitted = items.reduce((s, b) => s + b.committed, 0);

  const COST_CATS = ["Demo & Site Prep","Foundation","Framing","Electrical","Plumbing","HVAC","Insulation","Drywall","Flooring","Cabinets & Mill","Countertops","Tile","Painting","Roofing","Windows & Doors","Exterior","Landscaping","Permits & Fees","General Conditions","Contingency","Other"];

  const resetForm = () => { setForm({ category: "", budgeted: "", actual: "", committed: "", notes: "" }); setShowForm(false); setEditId(null); };

  const handleSave = () => {
    if (!form.category) return;
    const item = { ...form, projectId, budgeted: parseFloat(form.budgeted) || 0, actual: parseFloat(form.actual) || 0, committed: parseFloat(form.committed) || 0 };
    if (editId) {
      setBudgetItems(budgetItems.map(b => b.id === editId ? { ...item, id: editId } : b));
    } else {
      setBudgetItems([...budgetItems, { ...item, id: Date.now() }]);
    }
    // update project spent
    const newItems = editId ? budgetItems.map(b => b.id === editId ? { ...item, id: editId } : b) : [...budgetItems, { ...item, id: Date.now() }];
    const newSpent = newItems.filter(b => b.projectId === projectId).reduce((s, b) => s + b.actual, 0);
    setProjects(projects.map(p => p.id === projectId ? { ...p, spent: newSpent } : p));
    resetForm();
  };

  const handleEdit = (b) => { setEditId(b.id); setForm({ category: b.category, budgeted: b.budgeted, actual: b.actual, committed: b.committed, notes: b.notes || "" }); setShowForm(true); };

  const handleDelete = (id) => {
    const newItems = budgetItems.filter(b => b.id !== id);
    setBudgetItems(newItems);
    const newSpent = newItems.filter(b => b.projectId === projectId).reduce((s, b) => s + b.actual, 0);
    setProjects(projects.map(p => p.id === projectId ? { ...p, spent: newSpent } : p));
    setDeleteId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {deleteId && <ConfirmDelete message="Delete this budget line item?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}

      <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Total Budgeted" value={fmt(totalBudgeted)} color={T.blue} icon="dollar" />
        <StatCard label="Actual Spent" value={fmt(totalActual)} sub={`${totalBudgeted ? Math.round((totalActual/totalBudgeted)*100) : 0}% of budget`} color={totalActual > totalBudgeted ? T.red : T.green} icon="trending" />
        <StatCard label="Committed" value={fmt(totalCommitted)} color={T.amber} icon="clock" />
        <StatCard label="Remaining" value={fmt(totalBudgeted - totalActual)} color={totalBudgeted - totalActual < 0 ? T.red : T.purple} icon="dollar" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Budget Line Items</div>
        <Btn onClick={() => { setEditId(null); setForm({ category: "", budgeted: "", actual: "", committed: "", notes: "" }); setShowForm(true); }} small><Icon d={ICONS.plus} size={13} /> Add Line Item</Btn>
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>{editId ? "Edit" : "Add"} Budget Line Item</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
            <Select label="Cost Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={["", ...COST_CATS]} />
            <Input label="Budgeted" type="number" value={form.budgeted} onChange={e => setForm({ ...form, budgeted: e.target.value })} placeholder="0" />
            <Input label="Actual" type="number" value={form.actual} onChange={e => setForm({ ...form, actual: e.target.value })} placeholder="0" />
            <Input label="Committed" type="number" value={form.committed} onChange={e => setForm({ ...form, committed: e.target.value })} placeholder="0" />
            <div style={{ gridColumn: "span 4" }}>
              <Input label="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn onClick={handleSave}>{editId ? "Save Changes" : "Add Item"}</Btn>
            <Btn onClick={resetForm} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>No budget items yet. Start by adding cost categories.</div>
          <Btn onClick={() => setShowForm(true)} small>+ Add First Budget Item</Btn>
        </div>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              <TH>Category</TH><TH right>Budgeted</TH><TH right>Actual</TH><TH right>Committed</TH><TH right>Variance</TH><TH right>% Used</TH><TH></TH>
            </tr></thead>
            <tbody>
              {items.map(b => {
                const variance = b.budgeted - b.actual;
                const pct = b.budgeted ? Math.round((b.actual / b.budgeted) * 100) : 0;
                return (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <TD><div style={{ fontWeight: 600 }}>{b.category}</div>{b.notes && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{b.notes}</div>}</TD>
                    <TD right>{fmt(b.budgeted)}</TD>
                    <TD right bold>{fmt(b.actual)}</TD>
                    <TD right muted>{fmt(b.committed)}</TD>
                    <TD right><span style={{ color: variance < 0 ? T.red : T.green, fontWeight: 600 }}>{variance < 0 ? "-" : "+"}{fmt(Math.abs(variance))}</span></TD>
                    <td style={{ padding: "13px 16px", minWidth: 100 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: T.bg, borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 100 ? T.red : pct > 80 ? T.amber : T.green, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: pct > 100 ? T.red : T.textMid, minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleEdit(b)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: T.textSub, fontSize: 11 }}><Icon d={ICONS.edit} size={12} /></button>
                        <button onClick={() => setDeleteId(b.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: T.textSub, fontSize: 11 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}>
                          <Icon d={ICONS.trash} size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: T.accentLight, borderTop: `2px solid ${T.accentBorder}` }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>TOTALS</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, textAlign: "right", color: T.text }}>{fmt(totalBudgeted)}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, textAlign: "right", color: totalActual > totalBudgeted ? T.red : T.green }}>{fmt(totalActual)}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, textAlign: "right", color: T.textMid }}>{fmt(totalCommitted)}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, textAlign: "right", color: (totalBudgeted - totalActual) < 0 ? T.red : T.green }}>{totalBudgeted - totalActual < 0 ? "-" : "+"}{fmt(Math.abs(totalBudgeted - totalActual))}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── PROJECT ESTIMATES (sub-component) ───────────────────────────────────────
const ProjectEstimates = ({ projectId, estimates, setEstimates, project, allEstimates }) => {
  const [selected, setSelected] = useState(null);
  const [showEstForm, setShowEstForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [deleteEstId, setDeleteEstId] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [newEst, setNewEst] = useState({ name: "", notes: "" });
  const [newItem, setNewItem] = useState({ category: "", description: "", qty: 1, unit: "LS", cost: "", markup: 20 });

  const UNITS = ["LS","SF","LF","EA","HR","SY","CY","TN","GAL","BD"];
  const CATS = ["Demo & Site Prep","Foundation","Framing","Electrical","Plumbing","HVAC","Insulation","Drywall","Flooring","Cabinets & Mill","Countertops","Tile","Painting","Roofing","Windows & Doors","Exterior","Landscaping","Permits & Fees","General Conditions","Overhead","Profit","Other"];
  const calcTotal = (items) => items.reduce((s, i) => s + (i.qty * i.cost * (1 + i.markup / 100)), 0);

  const handleCreateEst = () => {
    if (!newEst.name) return;
    const est = { id: Date.now(), projectId, name: newEst.name, notes: newEst.notes, status: "Draft", date: new Date().toISOString().slice(0, 10), lineItems: [] };
    setEstimates([...allEstimates, est]);
    setSelected(est.id);
    setShowEstForm(false);
    setNewEst({ name: "", notes: "" });
  };

  const handleDeleteEst = (id) => {
    setEstimates(allEstimates.filter(e => e.id !== id));
    setDeleteEstId(null);
    if (selected === id) setSelected(null);
  };

  const handleAddItem = () => {
    if (!newItem.category || !newItem.description || !newItem.cost) return;
    const item = { ...newItem, id: Date.now(), qty: parseFloat(newItem.qty) || 1, cost: parseFloat(newItem.cost) || 0, markup: parseFloat(newItem.markup) || 0 };
    setEstimates(allEstimates.map(e => e.id === selected ? { ...e, lineItems: [...e.lineItems, item] } : e));
    setNewItem({ category: "", description: "", qty: 1, unit: "LS", cost: "", markup: 20 });
    setShowItemForm(false);
  };

  const handleDeleteItem = (itemId) => {
    setEstimates(allEstimates.map(e => e.id === selected ? { ...e, lineItems: e.lineItems.filter(i => i.id !== itemId) } : e));
    setDeleteItemId(null);
  };

  const updateStatus = (id, status) => setEstimates(allEstimates.map(e => e.id === id ? { ...e, status } : e));

  // Estimate detail view
  const est = selected ? allEstimates.find(e => e.id === selected) : null;
  if (est) {
    const subtotal = est.lineItems.reduce((s, i) => s + i.qty * i.cost, 0);
    const total = calcTotal(est.lineItems);
    const markup_pct = subtotal ? Math.round(((total - subtotal) / subtotal) * 100) : 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {deleteItemId && <ConfirmDelete message="Remove this line item?" onConfirm={() => handleDeleteItem(deleteItemId)} onCancel={() => setDeleteItemId(null)} />}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Btn onClick={() => setSelected(null)} variant="secondary" small>← All Estimates</Btn>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{est.name}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{est.date} · {est.lineItems.length} line items</div>
            </div>
            <Badge status={est.status} map={EST_STATUS} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {est.status === "Draft" && <Btn onClick={() => updateStatus(est.id, "Sent")} variant="ghost" small><Icon d={ICONS.send} size={12} /> Mark Sent</Btn>}
            {est.status === "Sent" && <Btn onClick={() => updateStatus(est.id, "Approved")} small><Icon d={ICONS.check} size={12} /> Mark Approved</Btn>}
            {est.status !== "Draft" && <Btn onClick={() => updateStatus(est.id, "Draft")} variant="secondary" small>Revert to Draft</Btn>}
            <Btn onClick={() => setShowItemForm(true)} small><Icon d={ICONS.plus} size={13} /> Add Line</Btn>
          </div>
        </div>

        <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <StatCard label="Cost Subtotal" value={fmt(subtotal)} color={T.blue} icon="dollar" />
          <StatCard label="Markup" value={`${markup_pct}%`} sub={fmt(total - subtotal)} color={T.amber} icon="trending" />
          <StatCard label="Contract Total" value={fmt(total)} color={T.accent} icon="dollar" />
          <StatCard label="Line Items" value={est.lineItems.length} color={T.purple} icon="estimates" />
        </div>

        {showItemForm && (
          <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Add Line Item</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Category" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} options={["", ...CATS]} />
              <Input label="Description" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="e.g. Full interior demo, haul-off" />
              <Input label="Qty" type="number" value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} />
              <Select label="Unit" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} options={UNITS} />
              <Input label="Unit Cost ($)" type="number" value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: e.target.value })} placeholder="0.00" />
              <Input label="Markup %" type="number" value={newItem.markup} onChange={e => setNewItem({ ...newItem, markup: e.target.value })} />
            </div>
            {newItem.cost && newItem.qty && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: T.accentLight, borderRadius: 7, fontSize: 13 }}>
                Line total: <strong style={{ color: T.accent }}>{fmt(parseFloat(newItem.qty) * parseFloat(newItem.cost) * (1 + parseFloat(newItem.markup || 0) / 100))}</strong>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn onClick={handleAddItem}>Add Line Item</Btn>
              <Btn onClick={() => setShowItemForm(false)} variant="secondary">Cancel</Btn>
            </div>
          </div>
        )}

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              <TH>Category</TH><TH>Description</TH><TH right>Qty</TH><TH right>Unit</TH><TH right>Unit Cost</TH><TH right>Markup</TH><TH right>Total</TH><TH></TH>
            </tr></thead>
            <tbody>
              {est.lineItems.map(item => {
                const lineTotal = item.qty * item.cost * (1 + item.markup / 100);
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, color: T.accent, background: T.accentLight, padding: "2px 8px", borderRadius: 5, fontWeight: 600 }}>{item.category}</span></td>
                    <TD>{item.description}</TD>
                    <TD right muted>{item.qty}</TD>
                    <TD right muted>{item.unit}</TD>
                    <TD right muted>{fmt(item.cost)}</TD>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, color: T.amber, fontWeight: 500 }}>{item.markup}%</td>
                    <TD right bold accent>{fmt(lineTotal)}</TD>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => setDeleteItemId(item.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: T.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                        <Icon d={ICONS.trash} size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {est.lineItems.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: T.textMuted }}>No line items yet. Click "Add Line" above to start building this estimate.</td></tr>
              )}
              {est.lineItems.length > 0 && (
                <>
                  <tr style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
                    <td colSpan={6} style={{ padding: "11px 16px", fontSize: 12, color: T.textSub, textAlign: "right", fontWeight: 600 }}>COST SUBTOTAL</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, textAlign: "right", color: T.text }}>{fmt(subtotal)}</td>
                    <td />
                  </tr>
                  <tr style={{ background: T.accentLight, borderTop: `2px solid ${T.accentBorder}` }}>
                    <td colSpan={6} style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: T.accent, textAlign: "right" }}>CONTRACT TOTAL</td>
                    <td style={{ padding: "13px 16px", fontSize: 16, fontWeight: 800, textAlign: "right", color: T.accent }}>{fmt(total)}</td>
                    <td />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Estimates list
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {deleteEstId && <ConfirmDelete message="Delete this estimate and all its line items?" onConfirm={() => handleDeleteEst(deleteEstId)} onCancel={() => setDeleteEstId(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Estimates for {project.name}</div>
        <Btn onClick={() => setShowEstForm(true)} small><Icon d={ICONS.plus} size={13} /> New Estimate</Btn>
      </div>
      {showEstForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>New Estimate</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Estimate Name" value={newEst.name} onChange={e => setNewEst({ ...newEst, name: e.target.value })} placeholder="e.g. Base Bid, Alternate 1, Revised Scope" />
            <Textarea label="Notes / Scope Summary" value={newEst.notes} onChange={e => setNewEst({ ...newEst, notes: e.target.value })} rows={2} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn onClick={handleCreateEst}>Create Estimate</Btn>
            <Btn onClick={() => setShowEstForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}
      {estimates.length === 0 && !showEstForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>No estimates yet for this project.</div>
          <Btn onClick={() => setShowEstForm(true)} small>+ Create First Estimate</Btn>
        </div>
      )}
      {estimates.map(e => {
        const total = calcTotal(e.lineItems);
        return (
          <div key={e.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={el => { el.currentTarget.style.borderColor = T.accentBorder; el.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.06)"; }}
            onMouseLeave={el => { el.currentTarget.style.borderColor = T.border; el.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div onClick={() => setSelected(e.id)} style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{e.date} · {e.lineItems.length} line items</div>
                {e.notes && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{e.notes}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Total</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{fmt(total)}</div>
                </div>
                <Badge status={e.status} map={EST_STATUS} />
                <button onClick={ev => { ev.stopPropagation(); setDeleteEstId(e.id); }} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: T.textMuted }}
                  onMouseEnter={el => { el.currentTarget.style.borderColor = T.redBorder; el.currentTarget.style.color = T.red; }}
                  onMouseLeave={el => { el.currentTarget.style.borderColor = T.border; el.currentTarget.style.color = T.textMuted; }}>
                  <Icon d={ICONS.trash} size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── PROJECT INVOICES (sub-component) ────────────────────────────────────────
const ProjectInvoices = ({ projectId, invoices, setInvoices, project, allInvoices }) => {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ description: "", amount: "", due: "" });

  const handleAdd = () => {
    if (!form.amount || !form.description) return;
    const drawNum = invoices.length + 1;
    const num = `INV-${new Date().getFullYear()}-${String(allInvoices.length + 1).padStart(3, "0")}`;
    setInvoices([...allInvoices, { id: Date.now(), projectId, number: num, description: form.description, amount: parseFloat(form.amount), due: form.due, status: "Pending", issued: new Date().toISOString().slice(0, 10) }]);
    setForm({ description: "", amount: "", due: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => { setInvoices(allInvoices.filter(i => i.id !== id)); setDeleteId(null); };
  const updateStatus = (id, status) => setInvoices(allInvoices.map(i => i.id === id ? { ...i, status } : i));

  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {deleteId && <ConfirmDelete message="Delete this invoice?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 20 }}>
          <div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Collected</div><div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{fmt(totalPaid)}</div></div>
          <div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Outstanding</div><div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{fmt(totalPending)}</div></div>
        </div>
        <Btn onClick={() => setShowForm(true)} small><Icon d={ICONS.plus} size={13} /> New Invoice</Btn>
      </div>
      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>New Invoice — {project.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 3" }}><Input label="Description (Draw #, scope, etc.)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Draw #1 – Mobilization & Demo" /></div>
            <Input label="Amount ($)" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <Input label="Due Date" type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn onClick={handleAdd}>Create Invoice</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}
      {invoices.length === 0 && !showForm ? (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>No invoices yet for this project.</div>
          <Btn onClick={() => setShowForm(true)} small>+ Create First Invoice</Btn>
        </div>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              <TH>Invoice #</TH><TH>Description</TH><TH right>Amount</TH><TH>Issued</TH><TH>Due</TH><TH>Status</TH><TH>Actions</TH>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>{inv.number}</td>
                  <TD>{inv.description}</TD>
                  <TD right bold>{fmt(inv.amount)}</TD>
                  <TD muted>{inv.issued}</TD>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: inv.status === "Overdue" ? T.red : T.textSub }}>{inv.due || "—"}</td>
                  <td style={{ padding: "13px 16px" }}><Badge status={inv.status} map={INVOICE_STATUS_LIGHT} /></td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {inv.status !== "Paid" && <button onClick={() => updateStatus(inv.id, "Paid")} style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark Paid</button>}
                      {inv.status === "Pending" && <button onClick={() => updateStatus(inv.id, "Overdue")} style={{ background: T.redLight, color: T.red, border: `1px solid ${T.redBorder}`, borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark Overdue</button>}
                      {inv.status === "Paid" && <button onClick={() => updateStatus(inv.id, "Pending")} style={{ background: T.bg, color: T.textSub, border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Revert</button>}
                      <button onClick={() => setDeleteId(inv.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 7px", cursor: "pointer", color: T.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                        <Icon d={ICONS.trash} size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


// ─── CONTACTS ────────────────────────────────────────────────────────────────
const Contacts = ({ contacts, setContacts, projects }) => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: "", company: "", type: "Client", email: "", phone: "", city: "" });

  const types = ["All", "Client", "Subcontractor", "Vendor"];
  const TYPE_COLORS = { Client: T.blue, Subcontractor: T.green, Vendor: T.purple };
  const TYPE_BG = { Client: T.blueLight, Subcontractor: T.greenLight, Vendor: T.purpleLight };

  const filtered = contacts.filter(c =>
    (filter === "All" || c.type === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => { setForm({ name: "", company: "", type: "Client", email: "", phone: "", city: "" }); setShowForm(false); setEditId(null); };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      setContacts(contacts.map(c => c.id === editId ? { ...c, ...form } : c));
    } else {
      setContacts([...contacts, { ...form, id: Date.now(), projects: [] }]);
    }
    resetForm();
  };

  const handleEdit = (c) => { setEditId(c.id); setForm({ name: c.name, company: c.company || "", type: c.type, email: c.email || "", phone: c.phone || "", city: c.city || "" }); setShowForm(true); };
  const handleDelete = (id) => { setContacts(contacts.filter(c => c.id !== id)); setDeleteId(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this contact?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <PageHeader eyebrow="People & Companies" title="Contacts"
        action={<Btn onClick={() => { resetForm(); setShowForm(true); }}><Icon d={ICONS.plus} size={14} /> Add Contact</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>{editId ? "Edit Contact" : "New Contact"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={["Client","Subcontractor","Vendor","Architect","Engineer","Inspector"]} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleSave}>{editId ? "Save Changes" : "Add Contact"}</Btn>
            <Btn onClick={resetForm} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}><Icon d={ICONS.search} size={15} /></div>
          <input placeholder="Search by name, company, or email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px 9px 36px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ background: filter === t ? (TYPE_BG[t] || T.accentLight) : T.surface, color: filter === t ? (TYPE_COLORS[t] || T.accent) : T.textMid, border: `1px solid ${filter === t ? (TYPE_COLORS[t] || T.accent) + "40" : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: filter === t ? 600 : 500, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <TH>Name</TH><TH>Type</TH><TH>Company</TH><TH>Email</TH><TH>Phone</TH><TH>City</TH><TH>Projects</TH><TH></TH>
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: TYPE_BG[c.type] || T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: TYPE_COLORS[c.type] || T.accent, flexShrink: 0 }}>{c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px" }}><span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[c.type] || T.accent, background: TYPE_BG[c.type] || T.accentLight, padding: "3px 10px", borderRadius: 20 }}>{c.type}</span></td>
                <TD muted>{c.company || "—"}</TD>
                <td style={{ padding: "13px 16px", fontSize: 13, color: T.blue }}>{c.email || "—"}</td>
                <TD muted>{c.phone || "—"}</TD>
                <TD muted>{c.city || "—"}</TD>
                <TD muted>{c.projects?.length || 0}</TD>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleEdit(c)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: T.textSub }}><Icon d={ICONS.edit} size={12} /></button>
                    <button onClick={() => setDeleteId(c.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: T.textMuted }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                      <Icon d={ICONS.trash} size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: T.textMuted }}>No contacts found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── ESTIMATES (global view) ──────────────────────────────────────────────────
const Estimates = ({ estimates, setEstimates, projects }) => {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newEst, setNewEst] = useState({ projectId: projects[0]?.id || "", name: "", notes: "" });

  const calcTotal = (items) => items.reduce((s, i) => s + (i.qty * i.cost * (1 + i.markup / 100)), 0);

  const handleCreate = () => {
    if (!newEst.name || !newEst.projectId) return;
    const est = { id: Date.now(), projectId: parseInt(newEst.projectId), name: newEst.name, notes: newEst.notes, status: "Draft", date: new Date().toISOString().slice(0, 10), lineItems: [] };
    setEstimates([...estimates, est]);
    setSelected(est.id);
    setShowForm(false);
  };

  if (selected) {
    const est = estimates.find(e => e.id === selected);
    if (!est) { setSelected(null); return null; }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Btn onClick={() => setSelected(null)} variant="secondary" small>← All Estimates</Btn>
        <ProjectEstimates projectId={est.projectId} estimates={estimates.filter(e => e.projectId === est.projectId)} setEstimates={setEstimates} project={projects.find(p => p.id === est.projectId) || {}} allEstimates={estimates} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Bids & Proposals" title="Estimates"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> New Estimate</Btn>} />
      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>New Estimate</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newEst.projectId} onChange={e => setNewEst({ ...newEst, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Estimate Name" value={newEst.name} onChange={e => setNewEst({ ...newEst, name: e.target.value })} placeholder="e.g. Base Bid, Revised Scope" />
            <div style={{ gridColumn: "span 2" }}><Textarea label="Scope Notes" value={newEst.notes} onChange={e => setNewEst({ ...newEst, notes: e.target.value })} rows={2} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleCreate}>Create Estimate</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {estimates.map(est => {
          const project = projects.find(p => p.id === est.projectId);
          const total = calcTotal(est.lineItems);
          return (
            <div key={est.id} onClick={() => setSelected(est.id)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, cursor: "pointer", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBorder; e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{est.name}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{project?.name} · {est.date} · {est.lineItems.length} line items</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Total</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{fmt(total)}</div>
                </div>
                <Badge status={est.status} map={EST_STATUS} />
              </div>
            </div>
          );
        })}
        {estimates.length === 0 && <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 48, textAlign: "center", fontSize: 13, color: T.textMuted }}>No estimates yet. Create one above or from within a project.</div>}
      </div>
    </div>
  );
};

// ─── INVOICES (global view) ───────────────────────────────────────────────────
const Invoices = ({ invoices, setInvoices, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState({ projectId: projects[0]?.id || "", description: "", amount: "", due: "" });

  const handleAdd = () => {
    if (!form.amount || !form.description) return;
    const num = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`;
    setInvoices([...invoices, { id: Date.now(), projectId: parseInt(form.projectId), number: num, description: form.description, amount: parseFloat(form.amount), due: form.due, status: "Pending", issued: new Date().toISOString().slice(0, 10) }]);
    setForm({ projectId: projects[0]?.id || "", description: "", amount: "", due: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => { setInvoices(invoices.filter(i => i.id !== id)); setDeleteId(null); };
  const updateStatus = (id, status) => setInvoices(invoices.map(i => i.id === id ? { ...i, status } : i));

  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  const filtered = filterStatus === "All" ? invoices : invoices.filter(i => i.status === filterStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this invoice?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <PageHeader eyebrow="Billing & Collections" title="Invoices"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> New Invoice</Btn>} />

      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Collected" value={fmt(totalPaid)} sub={`${invoices.filter(i=>i.status==="Paid").length} invoices`} color={T.green} icon="check" />
        <StatCard label="Pending" value={fmt(totalPending)} sub={`${invoices.filter(i=>i.status==="Pending").length} invoices`} color={T.amber} icon="clock" />
        <StatCard label="Overdue" value={fmt(totalOverdue)} sub={`${invoices.filter(i=>i.status==="Overdue").length} invoices`} color={T.red} icon="alert" />
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>New Invoice</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Amount ($)" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <div style={{ gridColumn: "span 2" }}><Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Draw #2 – Framing Complete" /></div>
            <Input label="Due Date" type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Create Invoice</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {["All","Pending","Overdue","Paid","Draft"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ background: filterStatus === s ? T.accent : T.surface, color: filterStatus === s ? "#fff" : T.textMid, border: `1px solid ${filterStatus === s ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{s}</button>
        ))}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <TH>Invoice #</TH><TH>Project</TH><TH>Description</TH><TH right>Amount</TH><TH>Issued</TH><TH>Due</TH><TH>Status</TH><TH>Actions</TH>
          </tr></thead>
          <tbody>
            {filtered.map(inv => {
              const project = projects.find(p => p.id === inv.projectId);
              return (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>{inv.number}</td>
                  <TD>{project?.name?.substring(0, 22) || "—"}</TD>
                  <TD muted>{inv.description}</TD>
                  <TD right bold>{fmt(inv.amount)}</TD>
                  <TD muted>{inv.issued}</TD>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: inv.status === "Overdue" ? T.red : T.textSub }}>{inv.due || "—"}</td>
                  <td style={{ padding: "13px 16px" }}><Badge status={inv.status} map={INVOICE_STATUS_LIGHT} /></td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {inv.status !== "Paid" && <button onClick={() => updateStatus(inv.id, "Paid")} style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark Paid</button>}
                      {inv.status === "Pending" && <button onClick={() => updateStatus(inv.id, "Overdue")} style={{ background: T.redLight, color: T.red, border: `1px solid ${T.redBorder}`, borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Overdue</button>}
                      <button onClick={() => setDeleteId(inv.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 7px", cursor: "pointer", color: T.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                        <Icon d={ICONS.trash} size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: T.textMuted }}>No invoices found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// ─── SCHEDULE ────────────────────────────────────────────────────────────────
const Schedule = ({ projects, setProjects }) => {
  const [editId, setEditId] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const PHASES = ["Pre-Construction","Demo & Site Prep","Foundation","Framing","MEP Rough-In","Insulation","Drywall","Finishes","Punch List","Closeout"];
  const TODAY = "2026-03-12";

  const handleSave = () => {
    setProjects(projects.map(p => p.id === editId ? { ...editProj, progress: parseInt(editProj.progress) || 0 } : p));
    setEditId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Timeline & Milestones" title="Schedule" />
      {projects.filter(p => p.status === "Active" || p.status === "Complete").map(p => {
        const start = new Date(p.start + "T00:00:00"), end = new Date(p.end + "T00:00:00"), today = new Date(TODAY + "T00:00:00");
        const totalDays = (end - start) / 86400000;
        const elapsed = (today - start) / 86400000;
        const timeProgress = Math.min(Math.max(Math.round((elapsed / totalDays) * 100), 0), 100);
        const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000));
        const phaseIdx = PHASES.indexOf(p.phase);
        const isEditing = editId === p.id;

        return (
          <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
            {isEditing ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Update Schedule — {p.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <Input label="Start Date" type="date" value={editProj.start} onChange={e => setEditProj({ ...editProj, start: e.target.value })} />
                  <Input label="End Date" type="date" value={editProj.end} onChange={e => setEditProj({ ...editProj, end: e.target.value })} />
                  <Select label="Current Phase" value={editProj.phase} onChange={e => setEditProj({ ...editProj, phase: e.target.value })} options={PHASES} />
                  <Input label="Progress %" type="number" value={editProj.progress} onChange={e => setEditProj({ ...editProj, progress: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <Btn onClick={handleSave} small>Save</Btn>
                  <Btn onClick={() => setEditId(null)} variant="secondary" small>Cancel</Btn>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{p.client} · Current phase: <span style={{ color: T.accent, fontWeight: 600 }}>{p.phase}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge status={p.status} />
                    <button onClick={() => { setEditId(p.id); setEditProj({ ...p }); }}
                      style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, color: T.textSub, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon d={ICONS.edit} size={12} /> Update
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSub, marginBottom: 6 }}>
                    <span>{fmtDate(p.start)}</span>
                    <span style={{ color: timeProgress > 90 ? T.red : T.textMid, fontWeight: 600 }}>Time: {timeProgress}% elapsed · {daysLeft} days left</span>
                    <span>{fmtDate(p.end)}</span>
                  </div>
                  <div style={{ height: 7, background: T.bg, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${timeProgress}%`, background: `linear-gradient(90deg, ${T.blue}, #60A5FA)`, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSub, marginBottom: 6 }}>
                    <span>Work progress</span><span style={{ fontWeight: 600 }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: 7, background: T.bg, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${p.progress}%`, background: p.progress === 100 ? T.purple : T.accent, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {PHASES.map((ph, i) => {
                    const isDone = i < phaseIdx, isCurrent = i === phaseIdx;
                    return (
                      <div key={ph} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", height: 4, background: isDone ? T.accent : isCurrent ? T.amber : T.border, borderRadius: 2 }} />
                        <div style={{ fontSize: 8, color: isDone ? T.accent : isCurrent ? T.amber : T.textMuted, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", fontWeight: isCurrent ? 700 : 400 }}>{ph}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
      {projects.filter(p => p.status === "Active" || p.status === "Complete").length === 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 48, textAlign: "center", fontSize: 13, color: T.textMuted }}>No active projects to display on schedule.</div>
      )}
    </div>
  );
};

// ─── DAILY LOGS ───────────────────────────────────────────────────────────────
const DailyLogs = ({ logs, setLogs, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterProject, setFilterProject] = useState("All");
  const [newLog, setNewLog] = useState({ projectId: projects[0]?.id || "", date: new Date().toISOString().slice(0, 10), author: "", weather: "", crew: "", notes: "" });

  const handleAdd = () => {
    if (!newLog.notes || !newLog.projectId) return;
    setLogs([{ ...newLog, id: Date.now(), photos: 0, projectId: parseInt(newLog.projectId), crew: parseInt(newLog.crew) || 0 }, ...logs]);
    setShowForm(false);
    setNewLog({ projectId: projects[0]?.id || "", date: new Date().toISOString().slice(0, 10), author: "", weather: "", crew: "", notes: "" });
  };

  const handleDelete = (id) => { setLogs(logs.filter(l => l.id !== id)); setDeleteId(null); };

  const filtered = filterProject === "All" ? logs : logs.filter(l => l.projectId === parseInt(filterProject));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this daily log entry?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <PageHeader eyebrow="Field Reports" title="Daily Logs"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> New Log</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>New Daily Log</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newLog.projectId} onChange={e => setNewLog({ ...newLog, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Date" type="date" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
            <Input label="Foreman / Author" value={newLog.author} onChange={e => setNewLog({ ...newLog, author: e.target.value })} placeholder="e.g. Jake Moreno" />
            <Input label="Weather & Temp" value={newLog.weather} onChange={e => setNewLog({ ...newLog, weather: e.target.value })} placeholder="e.g. Clear 72°F" />
            <Input label="Crew Size" type="number" value={newLog.crew} onChange={e => setNewLog({ ...newLog, crew: e.target.value })} />
            <div style={{ gridColumn: "span 2" }}>
              <Textarea label="Field Notes" value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} rows={4} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Save Log</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => setFilterProject("All")} style={{ background: filterProject === "All" ? T.accent : T.surface, color: filterProject === "All" ? "#fff" : T.textMid, border: `1px solid ${filterProject === "All" ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>All Projects</button>
        {projects.filter(p => p.status === "Active").map(p => (
          <button key={p.id} onClick={() => setFilterProject(String(p.id))} style={{ background: filterProject === String(p.id) ? T.accent : T.surface, color: filterProject === String(p.id) ? "#fff" : T.textMid, border: `1px solid ${filterProject === String(p.id) ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>{p.name.split(" ").slice(0,2).join(" ")}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(log => {
          const project = projects.find(p => p.id === log.projectId);
          return (
            <div key={log.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{project?.name}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{fmtDate(log.date)} · {log.author}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ background: T.accentLight, borderRadius: 7, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>{log.crew}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Crew</div>
                  </div>
                  <button onClick={() => setDeleteId(log.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: T.textMuted }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                    <Icon d={ICONS.trash} size={13} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, borderLeft: `3px solid ${T.accentBorder}`, paddingLeft: 14 }}>{log.notes}</div>
              {log.weather && (
                <div style={{ marginTop: 12, background: T.bg, borderRadius: 6, padding: "5px 10px", fontSize: 11, color: T.textSub, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Icon d={ICONS.sun} size={12} stroke={T.textMuted} /> {log.weather}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center", fontSize: 13, color: T.textMuted }}>No log entries found.</div>}
      </div>
    </div>
  );
};

// ─── CHANGE ORDERS ────────────────────────────────────────────────────────────
const ChangeOrders = ({ changeOrders, setChangeOrders, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [deleteId, setDeleteId] = useState(null);
  const [newCO, setNewCO] = useState({ projectId: projects[0]?.id || 1, title: "", description: "", amount: "", category: "Scope Addition", requestedBy: "Owner" });

  const filtered = filter === "All" ? changeOrders : changeOrders.filter(co => co.status === filter);
  const totalApproved = changeOrders.filter(co => co.status === "Approved").reduce((s, co) => s + co.amount, 0);
  const totalPending = changeOrders.filter(co => co.status === "Pending").reduce((s, co) => s + co.amount, 0);

  const handleAdd = () => {
    if (!newCO.title || !newCO.amount) return;
    const projId = parseInt(newCO.projectId);
    const projCOs = changeOrders.filter(co => co.projectId === projId);
    const num = `CO-${String(projCOs.length + 1).padStart(3, "0")}`;
    setChangeOrders([...changeOrders, { ...newCO, id: Date.now(), number: num, status: "Pending", date: new Date().toISOString().slice(0, 10), projectId: projId, amount: parseFloat(newCO.amount) }]);
    setShowForm(false);
    setNewCO({ projectId: projects[0]?.id || 1, title: "", description: "", amount: "", category: "Scope Addition", requestedBy: "Owner" });
  };

  const updateStatus = (id, status) => setChangeOrders(changeOrders.map(co => co.id === id ? { ...co, status } : co));
  const handleDelete = (id) => { setChangeOrders(changeOrders.filter(co => co.id !== id)); setDeleteId(null); };

  const catColors = { "Scope Addition": T.blue, "Unforeseen": T.red, "Upgrade": T.purple, "Owner Directive": T.green, "Credit": T.amber };
  const catBg = { "Scope Addition": T.blueLight, "Unforeseen": T.redLight, "Upgrade": T.purpleLight, "Owner Directive": T.greenLight, "Credit": T.amberLight };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this change order?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <PageHeader eyebrow="Scope Changes" title="Change Orders"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> New CO</Btn>} />

      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Approved COs" value={fmt(totalApproved)} sub={`${changeOrders.filter(co=>co.status==="Approved").length} orders`} color={T.green} icon="check" />
        <StatCard label="Pending Approval" value={fmt(totalPending)} sub={`${changeOrders.filter(co=>co.status==="Pending").length} awaiting`} color={T.amber} icon="clock" />
        <StatCard label="Total Exposure" value={fmt(totalApproved + totalPending)} color={T.accent} icon="changeorder" />
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>New Change Order</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newCO.projectId} onChange={e => setNewCO({ ...newCO, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="CO Title" value={newCO.title} onChange={e => setNewCO({ ...newCO, title: e.target.value })} placeholder="Brief description of change" />
            <Select label="Category" value={newCO.category} onChange={e => setNewCO({ ...newCO, category: e.target.value })} options={["Scope Addition","Unforeseen","Upgrade","Owner Directive","Credit"]} />
            <Select label="Requested By" value={newCO.requestedBy} onChange={e => setNewCO({ ...newCO, requestedBy: e.target.value })} options={["Owner","GC","Architect","Engineer","Inspector"]} />
            <Input label="Amount ($)" type="number" value={newCO.amount} onChange={e => setNewCO({ ...newCO, amount: e.target.value })} placeholder="0" />
            <div style={{ gridColumn: "span 2" }}>
              <Textarea label="Description / Justification" value={newCO.description} onChange={e => setNewCO({ ...newCO, description: e.target.value })} rows={3} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Submit Change Order</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {["All","Pending","Approved","Rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ background: filter === s ? T.accent : T.surface, color: filter === s ? "#fff" : T.textMid, border: `1px solid ${filter === s ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(co => {
          const project = projects.find(p => p.id === co.projectId);
          return (
            <div key={co.id} style={{ background: T.surface, border: `1px solid ${co.status === "Pending" ? T.amberBorder : T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{co.number}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{co.title}</span>
                    <Badge status={co.status} map={CO_STATUS_LIGHT} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{project?.name} · {co.date} · Requested by {co.requestedBy}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: co.category === "Credit" ? T.red : T.accent }}>{co.category === "Credit" ? "-" : "+"}{fmt(co.amount)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: catColors[co.category] || T.textSub, background: catBg[co.category] || T.bg, padding: "3px 10px", borderRadius: 5 }}>{co.category}</span>
                </div>
              </div>
              {co.description && <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.65, marginBottom: 14 }}>{co.description}</div>}
              <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                {co.status === "Pending" && (
                  <>
                    <Btn onClick={() => updateStatus(co.id, "Approved")} small><Icon d={ICONS.check} size={12} /> Approve</Btn>
                    <Btn onClick={() => updateStatus(co.id, "Rejected")} danger small><Icon d={ICONS.x} size={12} /> Reject</Btn>
                  </>
                )}
                {co.status !== "Pending" && <Btn onClick={() => updateStatus(co.id, "Pending")} variant="secondary" small>Revert to Pending</Btn>}
                <button onClick={() => setDeleteId(co.id)} style={{ marginLeft: "auto", background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.textMuted, fontSize: 11 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                  <Icon d={ICONS.trash} size={12} /> Delete
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center", fontSize: 13, color: T.textMuted }}>No change orders found.</div>}
      </div>
    </div>
  );
};

// ─── BUDGET TRACKER (global) ──────────────────────────────────────────────────
const BudgetTracker = ({ budgetItems, setBudgetItems, projects, changeOrders, setProjects }) => {
  const [selectedProject, setSelectedProject] = useState(projects.find(p => p.status === "Active")?.id || projects[0]?.id);
  const activeProjects = projects.filter(p => p.status === "Active" || p.status === "Complete");
  const project = projects.find(p => p.id === parseInt(selectedProject));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Cost Management" title="Budget Tracker"
        action={
          <Select label="" value={selectedProject} onChange={e => setSelectedProject(parseInt(e.target.value))}
            options={activeProjects.map(p => ({ value: p.id, label: p.name }))} />
        } />
      {project ? (
        <ProjectBudget projectId={project.id} budgetItems={budgetItems} setBudgetItems={setBudgetItems} project={project} setProjects={setProjects} projects={projects} />
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 48, textAlign: "center", fontSize: 13, color: T.textMuted }}>No active projects to display budget for.</div>
      )}
    </div>
  );
};

// ─── SUB BIDS ────────────────────────────────────────────────────────────────
const SubBids = ({ subBids, setSubBids, projects, contacts }) => {
  const [selected, setSelected] = useState(null);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [deletePackageId, setDeletePackageId] = useState(null);
  const [newPackage, setNewPackage] = useState({ projectId: projects[0]?.id || 1, trade: "", scope: "", dueDate: "" });
  const [newBid, setNewBid] = useState({ subName: "", amount: "", notes: "" });

  const pkg = selected ? subBids.find(b => b.id === selected) : null;

  const handleAddPackage = () => {
    if (!newPackage.trade || !newPackage.projectId) return;
    setSubBids([...subBids, { ...newPackage, id: Date.now(), projectId: parseInt(newPackage.projectId), status: "Open", bids: [] }]);
    setShowPackageForm(false);
    setNewPackage({ projectId: projects[0]?.id || 1, trade: "", scope: "", dueDate: "" });
  };

  const handleAddBid = () => {
    if (!newBid.subName || !newBid.amount) return;
    setSubBids(subBids.map(p => p.id === selected ? { ...p, bids: [...p.bids, { ...newBid, subId: Date.now(), amount: parseFloat(newBid.amount), submitted: new Date().toISOString().slice(0, 10), awarded: false }] } : p));
    setNewBid({ subName: "", amount: "", notes: "" });
    setShowBidForm(false);
  };

  const handleAward = (subId) => {
    setSubBids(subBids.map(p => p.id === selected ? { ...p, status: "Awarded", bids: p.bids.map(b => ({ ...b, awarded: b.subId === subId })) } : p));
  };

  const handleDeletePackage = (id) => { setSubBids(subBids.filter(p => p.id !== id)); setDeletePackageId(null); if (selected === id) setSelected(null); };

  const openPkgs = subBids.filter(p => p.status === "Open").length;
  const awardedPkgs = subBids.filter(p => p.status === "Awarded").length;
  const totalBids = subBids.reduce((s, p) => s + p.bids.length, 0);

  if (pkg) {
    const sortedBids = [...pkg.bids].sort((a, b) => a.amount - b.amount);
    const lowBid = sortedBids[0]?.amount || 0;
    const project = projects.find(p => p.id === pkg.projectId);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Btn onClick={() => setSelected(null)} variant="secondary" small>← All Packages</Btn>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{pkg.trade} — {project?.name}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{pkg.scope} · Due {fmtDate(pkg.dueDate)}</div>
            </div>
            <Badge status={pkg.status} map={{ Open: { bg: T.blueLight, text: T.blue, dot: T.blue, border: T.blueBorder }, Awarded: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder }, Closed: { bg: T.bg, text: T.textSub, dot: T.textMuted, border: T.border } }} />
          </div>
          <Btn onClick={() => setShowBidForm(true)} small><Icon d={ICONS.plus} size={13} /> Add Bid</Btn>
        </div>

        {sortedBids.length > 0 && (
          <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <StatCard label="Low Bid" value={fmt(sortedBids[0]?.amount)} color={T.green} icon="dollar" />
            <StatCard label="Bids Received" value={sortedBids.length} color={T.blue} icon="bids" />
            {sortedBids.length > 1 && <StatCard label="Spread" value={`${Math.round(((sortedBids[sortedBids.length-1].amount - lowBid) / lowBid) * 100)}%`} sub="vs low bid" color={T.amber} icon="trending" />}
          </div>
        )}

        {showBidForm && (
          <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Add Bid</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Subcontractor / Company" value={newBid.subName} onChange={e => setNewBid({ ...newBid, subName: e.target.value })} placeholder="Company name" />
              <Input label="Bid Amount ($)" type="number" value={newBid.amount} onChange={e => setNewBid({ ...newBid, amount: e.target.value })} />
              <div style={{ gridColumn: "span 2" }}><Input label="Notes / Exclusions" value={newBid.notes} onChange={e => setNewBid({ ...newBid, notes: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn onClick={handleAddBid}>Submit Bid</Btn>
              <Btn onClick={() => setShowBidForm(false)} variant="secondary">Cancel</Btn>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedBids.map((bid, idx) => {
            const isLow = idx === 0;
            const spread = lowBid ? Math.round(((bid.amount - lowBid) / lowBid) * 100) : 0;
            return (
              <div key={bid.subId} style={{ background: bid.awarded ? T.greenLight : T.surface, border: `1px solid ${bid.awarded ? T.greenBorder : isLow ? T.accentBorder : T.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
                      {bid.subName}
                      {isLow && <span style={{ fontSize: 10, background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>LOW BID</span>}
                      {bid.awarded && <span style={{ fontSize: 10, background: T.green, color: "#fff", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>AWARDED</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{bid.submitted} · {bid.notes || "No exclusions noted"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: isLow ? T.green : T.text }}>{fmt(bid.amount)}</div>
                      {!isLow && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>+{spread}% over low</div>}
                    </div>
                    {!bid.awarded && pkg.status !== "Awarded" && (
                      <Btn onClick={() => handleAward(bid.subId)} small><Icon d={ICONS.award} size={13} /> Award</Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {sortedBids.length === 0 && <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center", fontSize: 13, color: T.textMuted }}>No bids yet. Click "Add Bid" to enter subcontractor bids.</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deletePackageId && <ConfirmDelete message="Delete this bid package and all its bids?" onConfirm={() => handleDeletePackage(deletePackageId)} onCancel={() => setDeletePackageId(null)} />}
      <PageHeader eyebrow="Subcontractor Management" title="Sub Bids"
        action={<Btn onClick={() => setShowPackageForm(true)}><Icon d={ICONS.plus} size={14} /> New Package</Btn>} />

      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Open Packages" value={openPkgs} color={T.blue} icon="bids" />
        <StatCard label="Total Bids" value={totalBids} color={T.accent} icon="users" />
        <StatCard label="Awarded" value={awardedPkgs} color={T.green} icon="award" />
      </div>

      {showPackageForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>New Bid Package</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newPackage.projectId} onChange={e => setNewPackage({ ...newPackage, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Trade" value={newPackage.trade} onChange={e => setNewPackage({ ...newPackage, trade: e.target.value })} placeholder="e.g. Electrical, Plumbing, HVAC" />
            <Input label="Bid Due Date" type="date" value={newPackage.dueDate} onChange={e => setNewPackage({ ...newPackage, dueDate: e.target.value })} />
            <div style={{ gridColumn: "span 2" }}><Textarea label="Scope Description" value={newPackage.scope} onChange={e => setNewPackage({ ...newPackage, scope: e.target.value })} rows={2} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAddPackage}>Create Package</Btn>
            <Btn onClick={() => setShowPackageForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <TH>Trade / Package</TH><TH>Project</TH><TH>Scope</TH><TH right>Bids</TH><TH>Due Date</TH><TH>Status</TH><TH>Low Bid</TH><TH></TH>
          </tr></thead>
          <tbody>
            {subBids.map(pkg => {
              const project = projects.find(p => p.id === pkg.projectId);
              const sortedBids = [...pkg.bids].sort((a, b) => a.amount - b.amount);
              const BID_STATUS = { Open: { bg: T.blueLight, text: T.blue, dot: T.blue, border: T.blueBorder }, Awarded: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder }, Closed: { bg: T.bg, text: T.textSub, dot: T.textMuted, border: T.border } };
              return (
                <tr key={pkg.id} onClick={() => setSelected(pkg.id)} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: T.text }}>{pkg.trade}</td>
                  <TD muted>{project?.name?.substring(0, 20)}</TD>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: T.textSub, maxWidth: 200 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.scope}</div></td>
                  <TD right bold>{pkg.bids.length}</TD>
                  <TD muted>{fmtDate(pkg.dueDate)}</TD>
                  <td style={{ padding: "13px 16px" }}><Badge status={pkg.status} map={BID_STATUS} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: T.green }}>{sortedBids[0] ? fmt(sortedBids[0].amount) : "—"}</td>
                  <td style={{ padding: "13px 16px" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDeletePackageId(pkg.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 7px", cursor: "pointer", color: T.textMuted }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                      <Icon d={ICONS.trash} size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {subBids.length === 0 && <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: T.textMuted }}>No bid packages yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── PHOTO GALLERY ────────────────────────────────────────────────────────────
const PhotoGallery = ({ photos, setPhotos, projects }) => {
  const [filter, setFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [newPhoto, setNewPhoto] = useState({ projectId: projects[0]?.id || 1, caption: "", tag: "Progress", date: new Date().toISOString().slice(0, 10), author: "" });

  const TAGS = ["All","Progress","Milestone","Issue","Before/After","Inspection","Material"];
  const TAG_COLORS = { Progress: T.blue, Milestone: T.green, Issue: T.red, "Before/After": T.purple, Inspection: T.amber, Material: T.accent };
  const TAG_BG = { Progress: T.blueLight, Milestone: T.greenLight, Issue: T.redLight, "Before/After": T.purpleLight, Inspection: T.amberLight, Material: T.accentLight };
  const PHOTO_COLORS = ["#E8F4F8","#F0F8E8","#F8F0E8","#F0E8F8","#F8E8E8","#E8F8F0","#F5F5DC","#E8E8F8"];

  const filtered = photos.filter(p =>
    (filter === "All" || p.tag === filter) &&
    (projectFilter === "All" || p.projectId === parseInt(projectFilter))
  );

  const handleAdd = () => {
    if (!newPhoto.caption) return;
    const colors = PHOTO_COLORS;
    const emojis = { Progress: "🏗️", Milestone: "✅", Issue: "⚠️", "Before/After": "📸", Inspection: "📋", Material: "📦" };
    setPhotos([{ ...newPhoto, id: Date.now(), projectId: parseInt(newPhoto.projectId), color: colors[Math.floor(Math.random() * colors.length)], emoji: emojis[newPhoto.tag] || "📷" }, ...photos]);
    setShowForm(false);
    setNewPhoto({ projectId: projects[0]?.id || 1, caption: "", tag: "Progress", date: new Date().toISOString().slice(0, 10), author: "" });
  };

  const handleDelete = (id) => { setPhotos(photos.filter(p => p.id !== id)); setDeleteId(null); setLightbox(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this photo?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      {lightbox && (() => {
        const p = photos.find(x => x.id === lightbox);
        const project = projects.find(x => x.id === p?.projectId);
        return p ? (
          <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: 12, overflow: "hidden", maxWidth: 600, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
              <div style={{ background: p.color, height: 280, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{p.emoji}</div>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>{p.caption}</div>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: 16 }}>{project?.name} · {fmtDate(p.date)} · {p.author}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: TAG_COLORS[p.tag] || T.textSub, background: TAG_BG[p.tag] || T.bg, padding: "4px 12px", borderRadius: 20 }}>{p.tag}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => { setDeleteId(p.id); }} danger small><Icon d={ICONS.trash} size={13} /> Delete</Btn>
                    <Btn onClick={() => setLightbox(null)} variant="secondary" small>Close</Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      <PageHeader eyebrow="Job Site Photos" title="Photo Gallery"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> Add Photo</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>Add Photo Entry</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newPhoto.projectId} onChange={e => setNewPhoto({ ...newPhoto, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Select label="Tag" value={newPhoto.tag} onChange={e => setNewPhoto({ ...newPhoto, tag: e.target.value })} options={TAGS.filter(t => t !== "All")} />
            <Input label="Caption" value={newPhoto.caption} onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })} placeholder="Describe what this photo shows" />
            <Input label="Photographer" value={newPhoto.author} onChange={e => setNewPhoto({ ...newPhoto, author: e.target.value })} />
            <Input label="Date" type="date" value={newPhoto.date} onChange={e => setNewPhoto({ ...newPhoto, date: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Add Photo</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", color: T.text, fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="All">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ background: filter === t ? (TAG_BG[t] || T.accentLight) : T.surface, color: filter === t ? (TAG_COLORS[t] || T.accent) : T.textMid, border: `1px solid ${filter === t ? (TAG_COLORS[t] || T.accent) + "40" : T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: filter === t ? 600 : 400, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: T.textMuted, marginLeft: "auto" }}>{filtered.length} photos</span>
      </div>

      <div className="photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {filtered.map(p => {
          const project = projects.find(x => x.id === p.projectId);
          return (
            <div key={p.id} onClick={() => setLightbox(p.id)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ background: p.color, height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{p.emoji}</div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 3, lineHeight: 1.3 }}>{p.caption}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TAG_COLORS[p.tag] || T.textSub, background: TAG_BG[p.tag] || T.bg, padding: "2px 7px", borderRadius: 10 }}>{p.tag}</span>
                  <span style={{ fontSize: 10, color: T.textMuted }}>{p.date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 48, textAlign: "center", fontSize: 13, color: T.textMuted }}>No photos found for this filter.</div>
      )}
    </div>
  );
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
const Documents = ({ projects, documents, setDocuments }) => {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterProject, setFilterProject] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [form, setForm] = useState({ name: "", projectId: projects[0]?.id || "", type: "Contract", date: new Date().toISOString().slice(0, 10), notes: "" });

  const DOC_TYPES = ["Contract","Plans","Permits","Engineering","Scope","Submittal","Inspection","Photos","Other"];
  const TYPE_COLORS = { Contract: T.accent, Plans: T.purple, Permits: T.green, Engineering: T.blue, Scope: T.amber, Submittal: T.blue, Inspection: T.green, Photos: "#EC4899", Other: T.textSub };
  const TYPE_BG = { Contract: T.accentLight, Plans: T.purpleLight, Permits: T.greenLight, Engineering: T.blueLight, Scope: T.amberLight, Submittal: T.blueLight, Inspection: T.greenLight, Photos: "#FDF2F8", Other: T.bg };

  const handleAdd = () => {
    if (!form.name) return;
    setDocuments([...documents, { ...form, id: Date.now(), projectId: parseInt(form.projectId), uploader: "Jake Moreno", size: "—" }]);
    setForm({ name: "", projectId: projects[0]?.id || "", type: "Contract", date: new Date().toISOString().slice(0, 10), notes: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => { setDocuments(documents.filter(d => d.id !== id)); setDeleteId(null); };

  const filtered = documents.filter(d =>
    (filterProject === "All" || d.projectId === parseInt(filterProject)) &&
    (filterType === "All" || d.type === filterType)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {deleteId && <ConfirmDelete message="Delete this document?" onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      <PageHeader eyebrow="Files & Plans" title="Documents"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={14} /> Add Document</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 18 }}>Add Document</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}><Input label="Document Name / File Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Webb - Executed Contract.pdf" /></div>
            <Select label="Project" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={DOC_TYPES} />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <div style={{ gridColumn: "span 2" }}><Input label="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Add Document</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", color: T.text, fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="All">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["All", ...DOC_TYPES].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              style={{ background: filterType === t ? (TYPE_BG[t] || T.accentLight) : T.surface, color: filterType === t ? (TYPE_COLORS[t] || T.accent) : T.textMid, border: `1px solid ${filterType === t ? (TYPE_COLORS[t] || T.accent) + "40" : T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: filterType === t ? 600 : 400, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <TH>Document</TH><TH>Project</TH><TH>Type</TH><TH>Date</TH><TH>Uploaded By</TH><TH></TH>
          </tr></thead>
          <tbody>
            {filtered.map(doc => {
              const project = projects.find(p => p.id === doc.projectId);
              return (
                <tr key={doc.id} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: TYPE_BG[doc.type] || T.accentLight, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: TYPE_COLORS[doc.type] || T.accent, flexShrink: 0 }}><Icon d={ICONS.docs} size={14} /></div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{doc.name}</div>
                        {doc.notes && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{doc.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <TD muted>{project?.name || "—"}</TD>
                  <td style={{ padding: "13px 16px" }}><span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[doc.type] || T.accent, background: TYPE_BG[doc.type] || T.accentLight, padding: "3px 9px", borderRadius: 5 }}>{doc.type}</span></td>
                  <TD muted>{fmtDate(doc.date)}</TD>
                  <TD muted>{doc.uploader}</TD>
                  <td style={{ padding: "13px 16px" }}>
                    <button onClick={() => setDeleteId(doc.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 7px", cursor: "pointer", color: T.textMuted }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.redBorder; e.currentTarget.style.color = T.red; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                      <Icon d={ICONS.trash} size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: T.textMuted }}>No documents found. Add your first document above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [estimates, setEstimates] = useState(INITIAL_ESTIMATES);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [changeOrders, setChangeOrders] = useState(INITIAL_CHANGE_ORDERS);
  const [budgetItems, setBudgetItems] = useState(INITIAL_BUDGET_ITEMS);
  const [subBids, setSubBids] = useState(INITIAL_SUB_BIDS);
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [documents, setDocuments] = useState([
    { id: 1, name: "Riverside Remodel - Architectural Plans v3.pdf", projectId: 1, type: "Plans", date: "2026-01-08", uploader: "Jake Moreno", notes: "Approved for construction" },
    { id: 2, name: "Webb - Executed Contract.pdf", projectId: 1, type: "Contract", date: "2025-12-22", uploader: "Jake Moreno", notes: "" },
    { id: 3, name: "Oakwood Permit Set - City of Dallas.pdf", projectId: 2, type: "Permits", date: "2026-01-30", uploader: "Lisa Crane", notes: "Permit #B2026-00441" },
    { id: 4, name: "Oakwood - Structural Engineering Drawings.pdf", projectId: 2, type: "Engineering", date: "2026-01-15", uploader: "Lisa Crane", notes: "" },
    { id: 5, name: "Nexus Capital - Signed Contract.pdf", projectId: 2, type: "Contract", date: "2026-01-28", uploader: "Jake Moreno", notes: "" },
    { id: 6, name: "Highland Park - Scope of Work.docx", projectId: 3, type: "Scope", date: "2026-03-01", uploader: "Jake Moreno", notes: "Rev 2 - client approved" },
  ]);

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "projects", label: "Projects", icon: "projects" },
    { id: "changeorders", label: "Change Orders", icon: "changeorder" },
    { id: "budget", label: "Budget Tracker", icon: "budget" },
    { id: "subbids", label: "Sub Bids", icon: "bids" },
    { id: "photos", label: "Photo Gallery", icon: "photos" },
    { id: "contacts", label: "Contacts", icon: "contacts" },
    { id: "estimates", label: "Estimates", icon: "estimates" },
    { id: "invoices", label: "Invoices", icon: "invoices" },
    { id: "schedule", label: "Schedule", icon: "schedule" },
    { id: "logs", label: "Daily Logs", icon: "logs" },
    { id: "docs", label: "Documents", icon: "docs" },
  ];

  const pages = {
    dashboard: <Dashboard projects={projects} invoices={invoices} contacts={contacts} changeOrders={changeOrders} onNav={setTab} />,
    projects: <Projects projects={projects} setProjects={setProjects} estimates={estimates} setEstimates={setEstimates} invoices={invoices} setInvoices={setInvoices} budgetItems={budgetItems} setBudgetItems={setBudgetItems} changeOrders={changeOrders} onNav={setTab} />,
    contacts: <Contacts contacts={contacts} setContacts={setContacts} projects={projects} />,
    estimates: <Estimates estimates={estimates} setEstimates={setEstimates} projects={projects} />,
    invoices: <Invoices invoices={invoices} setInvoices={setInvoices} projects={projects} />,
    schedule: <Schedule projects={projects} setProjects={setProjects} />,
    logs: <DailyLogs logs={logs} setLogs={setLogs} projects={projects} />,
    docs: <Documents projects={projects} documents={documents} setDocuments={setDocuments} />,
    changeorders: <ChangeOrders changeOrders={changeOrders} setChangeOrders={setChangeOrders} projects={projects} />,
    budget: <BudgetTracker budgetItems={budgetItems} setBudgetItems={setBudgetItems} projects={projects} changeOrders={changeOrders} setProjects={setProjects} />,
    subbids: <SubBids subBids={subBids} setSubBids={setSubBids} projects={projects} contacts={contacts} />,
    photos: <PhotoGallery photos={photos} setPhotos={setPhotos} projects={projects} />,
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${T.sidebarBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: T.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon d={ICONS.building} size={17} stroke="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "0.04em" }}>BUILDFLOW</div>
            <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Pro · Dallas TX</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.map(item => {
          const isActive = tab === item.id;
          return (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, border: "none", background: isActive ? T.activeNav : "transparent", color: isActive ? T.activeNavText : T.textSub, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "all 0.1s", textAlign: "left", width: "100%" }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.bg; e.currentTarget.style.color = T.textMid; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; } }}>
              <Icon d={ICONS[item.icon] || ICONS.dashboard} size={15} stroke="currentColor" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 12px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>JM</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Jake Moreno</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Project Manager</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D0D4DA; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #B0B6BF; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
        select option { background: #fff; color: #0F1117; }
        input::placeholder { color: #B0B6BF; }
        textarea::placeholder { color: #B0B6BF; }
        textarea { font-family: inherit; }
        button { font-family: inherit; }

        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header { display: flex !important; }
          .main-content { padding: 16px !important; padding-top: 72px !important; }
          .stat-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
          .projects-grid { grid-template-columns: 1fr !important; }
          .photo-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .table-scroll { overflow-x: auto; }
          .mobile-hide { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-header { display: none !important; }
          .mobile-overlay { display: none !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="sidebar-desktop" style={{ width: 210, background: T.sidebar, borderRight: `1px solid ${T.sidebarBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="mobile-header" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: T.sidebar, borderBottom: `1px solid ${T.border}`, padding: "12px 16px", display: "none", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: T.accent, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={ICONS.building} size={14} stroke="#fff" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>BUILDFLOW PRO</div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", color: T.textMid }}>
          <Icon d={sidebarOpen ? ICONS.close : ICONS.menu} size={18} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,0.25)", zIndex: 200, backdropFilter: "blur(2px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 256, height: "100%", background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
        <div style={{ maxWidth: 1100 }}>
          {pages[tab]}
        </div>
      </div>
    </div>
  );
}
