import { useState, useMemo } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const INITIAL_PROJECTS = [
  { id: 1, name: "Riverside Luxury Remodel", client: "Marcus & Diane Webb", status: "Active", phase: "Framing", value: 284000, spent: 112400, start: "2026-01-10", end: "2026-06-15", address: "4821 Riverside Dr, Dallas TX", type: "Residential", progress: 42 },
  { id: 2, name: "Oakwood Office Buildout", client: "Nexus Capital Group", status: "Active", phase: "MEP Rough-In", value: 540000, spent: 198000, start: "2026-02-01", end: "2026-08-30", address: "2100 Commerce St #400, Dallas TX", type: "Commercial", progress: 31 },
  { id: 3, name: "Highland Park Kitchen & Bath", client: "Sandra Thornton", status: "Estimate", phase: "Pre-Construction", value: 92000, spent: 0, start: "2026-04-01", end: "2026-07-01", address: "508 Lakewood Blvd, Dallas TX", type: "Residential", progress: 0 },
  { id: 4, name: "Uptown Restaurant Renovation", client: "Vela Hospitality LLC", status: "Lead", phase: "Proposal", value: 175000, spent: 0, start: "2026-05-01", end: "2026-09-15", address: "3200 McKinney Ave, Dallas TX", type: "Commercial", progress: 0 },
  { id: 5, name: "Mockingbird Townhome Build", client: "Stratton Dev Group", status: "Complete", phase: "Closeout", value: 420000, spent: 418200, start: "2025-06-01", end: "2026-01-30", address: "1940 Mockingbird Ln, Dallas TX", type: "Residential", progress: 100 },
];

const INITIAL_CONTACTS = [
  { id: 1, name: "Marcus Webb", type: "Client", company: "Webb Family", email: "marcus@webb.com", phone: "214-555-0192", city: "Dallas", projects: [1] },
  { id: 2, name: "Jennifer Park", type: "Client", company: "Nexus Capital Group", email: "jpark@nexuscap.com", phone: "214-555-0341", city: "Dallas", projects: [2] },
  { id: 3, name: "Tony Barraza", type: "Subcontractor", company: "Barraza Electric", email: "tony@barrazaelec.com", phone: "214-555-0877", city: "Garland", projects: [1, 2] },
  { id: 4, name: "Mike Hollis", type: "Subcontractor", company: "Hollis Plumbing", email: "mike@hollisplumb.com", phone: "972-555-0234", city: "Mesquite", projects: [2] },
  { id: 5, name: "Apex Lumber Co.", type: "Vendor", company: "Apex Lumber", email: "orders@apexlumber.com", phone: "214-555-0012", city: "Irving", projects: [1, 2, 5] },
  { id: 6, name: "Sandra Thornton", type: "Client", company: "", email: "sthornton@gmail.com", phone: "214-555-0556", city: "Dallas", projects: [3] },
];

const INITIAL_ESTIMATES = [
  { id: 1, projectId: 1, name: "Riverside Luxury Remodel - Base Bid", status: "Approved", date: "2025-12-20", subtotal: 237000, markup: 0.197, total: 284000,
    lineItems: [
      { id: 1, category: "Demo & Site Prep", description: "Full interior demo, haul-off, site protection", qty: 1, unit: "LS", cost: 14500, markup: 20 },
      { id: 2, category: "Framing", description: "Structural & non-structural framing labor & materials", qty: 1, unit: "LS", cost: 38000, markup: 20 },
      { id: 3, category: "Electrical", description: "200A panel upgrade + full rewire", qty: 1, unit: "LS", cost: 28000, markup: 18 },
      { id: 4, category: "Plumbing", description: "Master bath, kitchen, outdoor kitchen rough & finish", qty: 1, unit: "LS", cost: 32000, markup: 18 },
      { id: 5, category: "HVAC", description: "New 5-ton system + ductwork", qty: 1, unit: "LS", cost: 22000, markup: 20 },
      { id: 6, category: "Insulation", description: "Spray foam + batt per energy code", qty: 2800, unit: "SF", cost: 3.20, markup: 25 },
      { id: 7, category: "Drywall", description: "Hang, tape, finish Level 5", qty: 4200, unit: "SF", cost: 4.50, markup: 22 },
      { id: 8, category: "Flooring", description: "White oak hardwood + tile", qty: 3100, unit: "SF", cost: 14.00, markup: 25 },
      { id: 9, category: "Cabinets & Mill", description: "Custom kitchen & bath cabinetry", qty: 1, unit: "LS", cost: 38000, markup: 15 },
      { id: 10, category: "Countertops", description: "Quartzite slabs kitchen + 3 baths", qty: 1, unit: "LS", cost: 18500, markup: 20 },
    ]
  },
  { id: 2, projectId: 3, name: "Highland Park K&B - Estimate v1", status: "Sent", date: "2026-02-28", subtotal: 76700, markup: 0.199, total: 92000,
    lineItems: [
      { id: 1, category: "Demo", description: "Kitchen & 2 bath demo + haul-off", qty: 1, unit: "LS", cost: 4800, markup: 20 },
      { id: 2, category: "Plumbing", description: "Kitchen + 2 bath rough & finish", qty: 1, unit: "LS", cost: 18000, markup: 18 },
      { id: 3, category: "Electrical", description: "Kitchen circuits + bath fans/lights", qty: 1, unit: "LS", cost: 8500, markup: 20 },
      { id: 4, category: "Tile", description: "Floor & shower tile labor + materials", qty: 420, unit: "SF", cost: 18.00, markup: 22 },
      { id: 5, category: "Cabinets", description: "Semi-custom kitchen cabinets", qty: 1, unit: "LS", cost: 22000, markup: 18 },
      { id: 6, category: "Countertops", description: "Quartz kitchen + 2 baths", qty: 1, unit: "LS", cost: 9800, markup: 20 },
      { id: 7, category: "Fixtures & Finish", description: "Plumbing fixtures, hardware, accessories", qty: 1, unit: "LS", cost: 7200, markup: 20 },
    ]
  },
];

const INITIAL_INVOICES = [
  { id: 1, projectId: 1, number: "INV-2026-001", amount: 57000, status: "Paid", issued: "2026-01-20", due: "2026-02-04", description: "Draw #1 – Mobilization & Demo" },
  { id: 2, projectId: 1, number: "INV-2026-007", amount: 55400, status: "Paid", issued: "2026-02-15", due: "2026-03-01", description: "Draw #2 – Foundation & Framing" },
  { id: 3, projectId: 2, number: "INV-2026-012", amount: 108000, status: "Paid", issued: "2026-02-28", due: "2026-03-14", description: "Draw #1 – Mobilization & Demo" },
  { id: 4, projectId: 1, number: "INV-2026-019", amount: 55000, status: "Pending", issued: "2026-03-08", due: "2026-03-22", description: "Draw #3 – MEP Rough-In" },
  { id: 5, projectId: 2, number: "INV-2026-021", amount: 90000, status: "Overdue", issued: "2026-02-10", due: "2026-02-25", description: "Draw #2 – Structural Steel" },
];

const INITIAL_LOGS = [
  { id: 1, projectId: 1, date: "2026-03-11", author: "Jake Moreno", weather: "Clear 68°F", crew: 8, notes: "Completed south wall framing. OSB sheathing 60% installed. Waiting on window delivery (ETA 3/14).", photos: 4 },
  { id: 2, projectId: 2, date: "2026-03-11", author: "Lisa Crane", weather: "Partly Cloudy 72°F", crew: 12, notes: "Electrical conduit run on floors 1-2 complete. Plumber started bathroom rough-ins on floor 3. Inspector visit scheduled 3/13.", photos: 7 },
  { id: 3, projectId: 1, date: "2026-03-10", author: "Jake Moreno", weather: "Clear 71°F", crew: 7, notes: "Roof truss installation complete. Started sheathing. Minor delay: two trusses had to be re-engineered on site.", photos: 3 },
];

const INITIAL_CHANGE_ORDERS = [
  { id: 1, projectId: 1, number: "CO-001", title: "Owner-Directed Scope Addition: Outdoor Kitchen", description: "Addition of outdoor kitchen w/ grill station, sink, refrigerator rough-in. Not included in original scope.", status: "Approved", amount: 18500, date: "2026-02-10", requestedBy: "Owner", category: "Scope Addition" },
  { id: 2, projectId: 1, number: "CO-002", title: "Unforeseen Condition: Subfloor Rot", description: "Discovery of rotted subfloor in master bath during demo. Full subfloor replacement 320 SF required.", status: "Approved", amount: 4200, date: "2026-02-22", requestedBy: "GC", category: "Unforeseen" },
  { id: 3, projectId: 2, number: "CO-001", title: "Electrical Upgrade – Server Room", description: "Client requested upgrade to 400A dedicated server room panel w/ UPS circuit. Not in original scope.", status: "Pending", amount: 12800, date: "2026-03-05", requestedBy: "Owner", category: "Scope Addition" },
  { id: 4, projectId: 1, number: "CO-003", title: "Drywall Upgrade to Level 5 Finish", description: "Owner request to upgrade all drywall from Level 4 to Level 5 finish throughout (original bid was Level 4).", status: "Pending", amount: 6800, date: "2026-03-09", requestedBy: "Owner", category: "Upgrade" },
];

const INITIAL_BUDGET_ITEMS = [
  { id: 1, projectId: 1, category: "Demo & Site Prep", budgeted: 17400, actual: 16800, committed: 17200 },
  { id: 2, projectId: 1, category: "Framing", budgeted: 45600, actual: 44200, committed: 45600 },
  { id: 3, projectId: 1, category: "Electrical", budgeted: 33040, actual: 14000, committed: 28000 },
  { id: 4, projectId: 1, category: "Plumbing", budgeted: 37760, actual: 18000, committed: 32000 },
  { id: 5, projectId: 1, category: "HVAC", budgeted: 26400, actual: 0, committed: 22000 },
  { id: 6, projectId: 1, category: "Insulation", budgeted: 11200, actual: 0, committed: 0 },
  { id: 7, projectId: 1, category: "Drywall", budgeted: 23058, actual: 0, committed: 0 },
  { id: 8, projectId: 1, category: "Flooring", budgeted: 54250, actual: 0, committed: 43400 },
  { id: 9, projectId: 1, category: "Cabinets & Mill", budgeted: 43700, actual: 19400, committed: 38000 },
  { id: 10, projectId: 1, category: "Countertops", budgeted: 22200, actual: 0, committed: 18500 },
  { id: 1, projectId: 2, category: "Demo & Site Prep", budgeted: 28000, actual: 26400, committed: 28000 },
  { id: 2, projectId: 2, category: "Structural Steel", budgeted: 98000, actual: 92000, committed: 98000 },
  { id: 3, projectId: 2, category: "Electrical", budgeted: 88000, actual: 42000, committed: 72000 },
  { id: 4, projectId: 2, category: "Plumbing", budgeted: 62000, actual: 37600, committed: 62000 },
  { id: 5, projectId: 2, category: "HVAC", budgeted: 110000, actual: 0, committed: 95000 },
  { id: 6, projectId: 2, category: "Finishes", budgeted: 154000, actual: 0, committed: 0 },
];

const INITIAL_SUB_BIDS = [
  { id: 1, projectId: 1, trade: "Electrical", scope: "200A panel upgrade + full rewire, all devices", dueDate: "2025-12-10", status: "Awarded",
    bids: [
      { subId: 1, subName: "Barraza Electric", amount: 28000, submitted: "2025-12-08", notes: "Includes permit, all materials", awarded: true },
      { subId: 2, subName: "RTX Electrical", amount: 31500, submitted: "2025-12-09", notes: "50% material allowance", awarded: false },
      { subId: 3, subName: "Pro-Volt Systems", amount: 26800, submitted: "2025-12-10", notes: "Excludes panel box – owner supply", awarded: false },
    ]
  },
  { id: 2, projectId: 1, trade: "Plumbing", scope: "Master bath, kitchen, outdoor kitchen rough & trim",  dueDate: "2025-12-12", status: "Awarded",
    bids: [
      { subId: 4, subName: "Hollis Plumbing", amount: 32000, submitted: "2025-12-11", notes: "Full scope all fixtures", awarded: true },
      { subId: 5, subName: "DFW Pipe Pros", amount: 29400, submitted: "2025-12-12", notes: "Excludes outdoor kitchen", awarded: false },
    ]
  },
  { id: 3, projectId: 2, trade: "Electrical", scope: "Full commercial electrical per plans + server room 400A", dueDate: "2026-01-28", status: "Open",
    bids: [
      { subId: 6, subName: "Barraza Electric", amount: 88000, submitted: "2026-01-27", notes: "All conduit, wire, devices per plans", awarded: false },
      { subId: 7, subName: "Voltmaster Commercial", amount: 82500, submitted: "2026-01-26", notes: "Excludes fire alarm", awarded: false },
      { subId: 8, subName: "Premier Electric TX", amount: 91200, submitted: "2026-01-28", notes: "Includes fire alarm stub-outs", awarded: false },
    ]
  },
  { id: 4, projectId: 3, trade: "Plumbing", scope: "Kitchen + 2 bath rough & trim, fixture install", dueDate: "2026-03-20", status: "Open",
    bids: []
  },
];

const INITIAL_PHOTOS = [
  { id: 1, projectId: 1, date: "2026-03-11", author: "Jake Moreno", tag: "Progress", caption: "South wall framing complete", color: "#1a3a1a", emoji: "🏗️" },
  { id: 2, projectId: 1, date: "2026-03-11", author: "Jake Moreno", tag: "Progress", caption: "OSB sheathing – north elevation", color: "#1e1e3a", emoji: "📐" },
  { id: 3, projectId: 1, date: "2026-03-10", author: "Jake Moreno", tag: "Progress", caption: "Roof truss installation", color: "#2a1a0a", emoji: "🔨" },
  { id: 4, projectId: 1, date: "2026-03-10", author: "Jake Moreno", tag: "Issue", caption: "Rotted subfloor – master bath (CO-002)", color: "#3a1a1a", emoji: "⚠️" },
  { id: 5, projectId: 1, date: "2026-02-22", author: "Jake Moreno", tag: "Milestone", caption: "Foundation inspection passed", color: "#0a2a1a", emoji: "✅" },
  { id: 6, projectId: 2, date: "2026-03-11", author: "Lisa Crane", tag: "Progress", caption: "Electrical conduit floors 1-2 done", color: "#1a1e3a", emoji: "⚡" },
  { id: 7, projectId: 2, date: "2026-03-11", author: "Lisa Crane", tag: "Progress", caption: "Plumbing rough-in floor 3", color: "#1a2a1a", emoji: "🔧" },
  { id: 8, projectId: 2, date: "2026-03-05", author: "Lisa Crane", tag: "Milestone", caption: "Steel structure complete – all floors", color: "#0a2a0a", emoji: "🏢" },
  { id: 9, projectId: 1, date: "2026-02-15", author: "Jake Moreno", tag: "Before/After", caption: "Pre-demo master bath", color: "#2a1a2a", emoji: "📸" },
  { id: 10, projectId: 1, date: "2026-03-01", author: "Jake Moreno", tag: "Material", caption: "White oak flooring delivery – on site", color: "#2a1e0a", emoji: "📦" },
  { id: 11, projectId: 2, date: "2026-02-28", author: "Lisa Crane", tag: "Inspection", caption: "City inspector – framing passed", color: "#0a1e2a", emoji: "📋" },
  { id: 12, projectId: 1, date: "2026-01-18", author: "Jake Moreno", tag: "Before/After", caption: "Pre-demo – kitchen & living room", color: "#1a2a2a", emoji: "🏠" },
];

const STATUS_COLORS = {
  Lead: { bg: "#1e3a5f", text: "#60a5fa", dot: "#3b82f6" },
  Estimate: { bg: "#3d2a00", text: "#fbbf24", dot: "#f59e0b" },
  Active: { bg: "#0a3a1e", text: "#34d399", dot: "#10b981" },
  Complete: { bg: "#1a1a2e", text: "#a78bfa", dot: "#8b5cf6" },
  "On Hold": { bg: "#3a1a1a", text: "#f87171", dot: "#ef4444" },
};

const INVOICE_STATUS = {
  Paid: { bg: "#0a3a1e", text: "#34d399" },
  Pending: { bg: "#3d2a00", text: "#fbbf24" },
  Overdue: { bg: "#3a1a1a", text: "#f87171" },
  Draft: { bg: "#1a1a1a", text: "#94a3b8" },
};

const CO_STATUS = {
  Approved: { bg: "#0a3a1e", text: "#34d399", dot: "#10b981" },
  Pending: { bg: "#3d2a00", text: "#fbbf24", dot: "#f59e0b" },
  Rejected: { bg: "#3a1a1a", text: "#f87171", dot: "#ef4444" },
  Void: { bg: "#1a1a1a", text: "#666", dot: "#444" },
};

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  projects: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  contacts: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  estimates: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  invoices: "M12 1v22 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  schedule: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  logs: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  docs: "M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7",
  changeorder: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  budget: "M2 2h20v4H2z M2 10h20v4H2z M2 18h20v4H2z M6 6v0 M6 14v0 M6 22v0",
  bids: "M9 12h6 M9 16h6 M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z",
  photos: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 M12 5l7 7-7 7",
  chevron: "M9 18l6-6-6-6",
  x: "M18 6L6 18 M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  building: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  trending: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
  search: "M11 17a6 6 0 100-12 6 6 0 000 12z M21 21l-4.35-4.35",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
  cloud: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  award: "M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  menu: "M3 12h18 M3 6h18 M3 18h18",
  close: "M18 6L6 18 M6 6l12 12",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  image: "M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z M8.5 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M21 15l-5-5L5 21",
};


// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F5F7",
  surface: "#FFFFFF",
  surfaceHover: "#FAFAFA",
  border: "#E8EAED",
  borderStrong: "#D0D4DA",
  text: "#0F1117",
  textMid: "#2D3340",
  textSub: "#5C6270",
  textMuted: "#9299A6",
  accent: "#E86C2C",
  accentHover: "#D4601F",
  accentLight: "#FEF3EC",
  accentBorder: "#F5B894",
  sidebar: "#FFFFFF",
  sidebarBorder: "#E8EAED",
  activeNav: "#FEF3EC",
  activeNavText: "#C85A1E",
  green: "#1A7F4B",
  greenLight: "#F0FBF5",
  greenBorder: "#A8DDBE",
  red: "#C8252A",
  redLight: "#FEF2F2",
  redBorder: "#F5BBBE",
  blue: "#2255CC",
  blueLight: "#EEF3FD",
  blueBorder: "#AABFF5",
  amber: "#B86B00",
  amberLight: "#FDF8EE",
  amberBorder: "#F0D48A",
  purple: "#6930C4",
  purpleLight: "#F4F0FD",
  purpleBorder: "#CCBAF2",
};

// Updated status colors for light theme
const STATUS_COLORS_LIGHT = {
  Lead: { bg: T.blueLight, text: T.blue, dot: T.blue, border: T.blueBorder },
  Estimate: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder },
  Active: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder },
  Complete: { bg: T.purpleLight, text: T.purple, dot: T.purple, border: T.purpleBorder },
  "On Hold": { bg: T.redLight, text: T.red, dot: T.red, border: T.redBorder },
};

const INVOICE_STATUS_LIGHT = {
  Paid: { bg: T.greenLight, text: T.green, dot: T.green },
  Pending: { bg: T.amberLight, text: T.amber, dot: T.amber },
  Overdue: { bg: T.redLight, text: T.red, dot: T.red },
  Draft: { bg: T.bg, text: T.textSub, dot: T.textMuted },
};

const CO_STATUS_LIGHT = {
  Approved: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder },
  Pending: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder },
  Rejected: { bg: T.redLight, text: T.red, dot: T.red, border: T.redBorder },
  Void: { bg: T.bg, text: T.textSub, dot: T.textMuted, border: T.border },
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Badge = ({ status, map = STATUS_COLORS_LIGHT }) => {
  const s = map[status] || { bg: "#F3F5F7", text: T.textSub, dot: T.textMuted };
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

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div>
    {label && <label style={{ fontSize: 11, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
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

const Btn = ({ children, onClick, variant = "primary", small }) => {
  const styles = {
    primary: { background: T.accent, color: "#fff", border: "none" },
    secondary: { background: T.surface, color: T.textMid, border: `1px solid ${T.border}` },
    ghost: { background: "transparent", color: T.accent, border: `1px solid ${T.accentBorder}` },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} style={{ ...s, borderRadius: 7, padding: small ? "6px 12px" : "8px 16px", fontWeight: 600, fontSize: small ? 12 : 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", letterSpacing: "0.01em" }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
};

const ProjectCard = ({ project, onClick }) => {
  const budget_pct = project.value ? Math.round((project.spent / project.value) * 100) : 0;
  return (
    <div onClick={onClick}
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 16 }}
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
          <div style={{ height: "100%", width: `${project.progress}%`, borderRadius: 4, background: project.progress === 100 ? T.purple : project.progress > 70 ? T.green : T.accent, transition: "width 0.3s" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <span>Budget used: <span style={{ color: budget_pct > 90 ? T.red : budget_pct > 70 ? T.amber : T.green, fontWeight: 700 }}>{budget_pct}%</span></span>
        <span>{project.address.split(",")[1]?.trim() || project.address}</span>
      </div>
    </div>
  );
};

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 24, borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Good morning, Jake 👷</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 5 }}>Thursday, March 12, 2026 · Dallas, TX</div>
        </div>
        <Btn onClick={() => onNav("projects")}><Icon d={ICONS.plus} size={14} /> New Project</Btn>
      </div>

      <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Active Projects" value={activeProjects.length} sub="2 on schedule" color={T.accent} icon="projects" />
        <StatCard label="Total Pipeline" value={fmt(totalRevenue)} sub={`${projects.length} projects`} color={T.green} icon="trending" />
        <StatCard label="Receivables Due" value={fmt(pendingAmt)} sub={`${overdueInv.length} overdue`} color={overdueInv.length > 0 ? T.red : T.amber} icon="invoices" />
        <StatCard label="Pending COs" value={pendingCOs.length} sub={`${fmt(pendingCOs.reduce((s,c) => s+c.amount, 0))} exposure`} color={T.purple} icon="changeorder" />
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
                  <div style={{ height: 5, background: T.bg, borderRadius: 3 }}><div style={{ height: "100%", width: `${p.progress}%`, background: T.accent, borderRadius: 3 }} /></div>
                </div>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Receivables</div>
            {[...overdueInv, ...pendingInv].map(inv => {
              const project = projects.find(p => p.id === inv.projectId);
              return (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{inv.number}</div><div style={{ fontSize: 11, color: T.textSub, marginTop: 1 }}>{project?.name?.substring(0, 22)}...</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{fmt(inv.amount)}</div><Badge status={inv.status} map={INVOICE_STATUS_LIGHT} /></div>
                </div>
              );
            })}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Pipeline</div>
            {["Lead", "Estimate", "Active", "Complete"].map(s => {
              const count = projects.filter(p => p.status === s).length;
              const val = projects.filter(p => p.status === s).reduce((sum, p) => sum + p.value, 0);
              const sc = STATUS_COLORS_LIGHT[s];
              return (
                <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
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
            <div style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.amber, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon d={ICONS.alert} size={14} stroke={T.amber} /> Pending Change Orders
              </div>
              {pendingCOs.map(co => (
                <div key={co.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.amberBorder}`, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: T.text, marginBottom: 2 }}>{co.number} – {co.title.substring(0, 28)}...</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textSub }}>{projects.find(p=>p.id===co.projectId)?.name?.substring(0,20)}</span>
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
const Projects = ({ projects, setProjects }) => {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newProj, setNewProj] = useState({ name: "", client: "", status: "Lead", type: "Residential", value: "", address: "", phase: "Pre-Construction", start: "", end: "" });

  const statuses = ["All", "Lead", "Estimate", "Active", "Complete", "On Hold"];
  const filtered = filter === "All" ? projects : projects.filter(p => p.status === filter);

  const handleAdd = () => {
    if (!newProj.name || !newProj.client) return;
    setProjects([...projects, { ...newProj, id: Date.now(), value: parseFloat(newProj.value) || 0, spent: 0, progress: 0 }]);
    setShowForm(false);
    setNewProj({ name: "", client: "", status: "Lead", type: "Residential", value: "", address: "", phase: "Pre-Construction", start: "", end: "" });
  };

  if (selected) {
    const p = projects.find(x => x.id === selected);
    const budget_pct = p.value ? Math.round((p.spent / p.value) * 100) : 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={() => setSelected(null)} variant="secondary" small>← Back</Btn>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{p.name}</div>
          <Badge status={p.status} />
        </div>
        <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <StatCard label="Contract Value" value={fmt(p.value)} color={T.accent} icon="dollar" />
          <StatCard label="Amount Spent" value={fmt(p.spent)} sub={`${budget_pct}% of budget`} color={budget_pct > 90 ? T.red : T.green} icon="trending" />
          <StatCard label="Remaining" value={fmt(p.value - p.spent)} color={T.purple} icon="dollar" />
          <StatCard label="Progress" value={`${p.progress}%`} sub={p.phase} color={T.amber} icon="projects" />
        </div>
        <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 16 }}>Project Details</div>
            {[["Client", p.client], ["Type", p.type], ["Address", p.address], ["Start Date", p.start], ["End Date", p.end], ["Current Phase", p.phase]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <span style={{ color: T.textSub }}>{k}</span><span style={{ color: T.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 16 }}>Budget Overview</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSub, marginBottom: 8 }}>
                <span>Budget Used</span><span style={{ color: budget_pct > 90 ? T.red : T.amber, fontWeight: 600 }}>{budget_pct}%</span>
              </div>
              <div style={{ height: 8, background: T.bg, borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${Math.min(budget_pct, 100)}%`, background: budget_pct > 90 ? T.red : budget_pct > 70 ? T.amber : T.green, borderRadius: 4 }} />
              </div>
            </div>
            {[["Contract Value", fmt(p.value), T.accent], ["Spent to Date", fmt(p.spent), T.text], ["Remaining", fmt(p.value - p.spent), p.value - p.spent < 0 ? T.red : T.green]].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <span style={{ color: T.textSub }}>{k}</span><span style={{ color: c, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="All Jobs" title="Projects"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={15} /> New Project</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24, boxShadow: "0 4px 16px rgba(232,108,44,0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>New Project</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Project Name", "name", "text"], ["Client", "client", "text"], ["Contract Value", "value", "number"], ["Address", "address", "text"], ["Start Date", "start", "date"], ["End Date", "end", "date"]].map(([label, field, type]) => (
              <Input key={field} label={label} type={type} value={newProj[field]} onChange={e => setNewProj({ ...newProj, [field]: e.target.value })} />
            ))}
            <Select label="Status" value={newProj.status} onChange={e => setNewProj({ ...newProj, status: e.target.value })} options={["Lead", "Estimate", "Active"]} />
            <Select label="Type" value={newProj.type} onChange={e => setNewProj({ ...newProj, type: e.target.value })} options={["Residential", "Commercial", "Industrial"]} />
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
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{ background: isActive ? T.accent : T.surface, color: isActive ? "#fff" : T.textMid, border: `1px solid ${isActive ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: isActive ? 600 : 500, cursor: "pointer", transition: "all 0.1s" }}>
              {s} <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>{s === "All" ? projects.length : projects.filter(p => p.status === s).length}</span>
            </button>
          );
        })}
      </div>

      <div className="projects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => setSelected(p.id)} />)}
      </div>
    </div>
  );
};

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
const Contacts = ({ contacts, setContacts, projects }) => {
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newC, setNewC] = useState({ name: "", type: "Client", company: "", email: "", phone: "", city: "" });

  const types = ["All", "Client", "Subcontractor", "Vendor"];
  const TYPE_COLORS = { Client: T.blue, Subcontractor: T.green, Vendor: T.amber };
  const TYPE_BG = { Client: T.blueLight, Subcontractor: T.greenLight, Vendor: T.amberLight };
  const filtered = contacts.filter(c => (filter === "All" || c.type === filter) && (c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())));

  const handleAdd = () => {
    if (!newC.name) return;
    setContacts([...contacts, { ...newC, id: Date.now(), projects: [] }]);
    setShowForm(false);
    setNewC({ name: "", type: "Client", company: "", email: "", phone: "", city: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="People & Companies" title="Contacts"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={15} /> Add Contact</Btn>} />

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}><Icon d={ICONS.search} size={15} /></div>
          <input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px 9px 36px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ background: filter === t ? (TYPE_BG[t] || T.accentLight) : T.surface, color: filter === t ? (TYPE_COLORS[t] || T.accent) : T.textMid, border: `1px solid ${filter === t ? (TYPE_COLORS[t] + "40" || T.accentBorder) : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: filter === t ? 600 : 500, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>Add Contact</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Name", "name"], ["Company", "company"], ["Email", "email"], ["Phone", "phone"], ["City", "city"]].map(([label, field]) => (
              <Input key={field} label={label} value={newC[field]} onChange={e => setNewC({ ...newC, [field]: e.target.value })} />
            ))}
            <Select label="Type" value={newC.type} onChange={e => setNewC({ ...newC, type: e.target.value })} options={["Client", "Subcontractor", "Vendor"]} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Add Contact</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            {["Name", "Type", "Company", "Email", "Phone", "Projects"].map(h =>
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: TYPE_BG[c.type] || T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: TYPE_COLORS[c.type] || T.accent }}>{c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}><span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[c.type] || T.accent, background: TYPE_BG[c.type] || T.accentLight, padding: "3px 10px", borderRadius: 20 }}>{c.type}</span></td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: T.textMid }}>{c.company || "—"}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: T.blue }}>{c.email}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: T.textMid }}>{c.phone}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: T.textSub }}>{c.projects?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── ESTIMATES ────────────────────────────────────────────────────────────────
const Estimates = ({ estimates, setEstimates, projects }) => {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ category: "", description: "", qty: 1, unit: "LS", cost: 0, markup: 20 });

  const est = estimates.find(e => e.id === selected);
  const calcTotal = (items) => items.reduce((s, i) => s + (i.qty * i.cost * (1 + i.markup / 100)), 0);
  const EST_STATUS = { Approved: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder }, Sent: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder }, Draft: { bg: "#F3F4F6", text: T.textSub, dot: T.textMuted, border: T.border } };

  const addLineItem = () => {
    if (!newItem.category || !newItem.description) return;
    setEstimates(estimates.map(e => e.id === selected ? { ...e, lineItems: [...e.lineItems, { ...newItem, id: Date.now(), qty: parseFloat(newItem.qty), cost: parseFloat(newItem.cost), markup: parseFloat(newItem.markup) }] } : e));
    setNewItem({ category: "", description: "", qty: 1, unit: "LS", cost: 0, markup: 20 });
    setShowForm(false);
  };

  if (selected && est) {
    const total = calcTotal(est.lineItems);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={() => setSelected(null)} variant="secondary" small>← Back</Btn>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{est.name}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{projects.find(p => p.id === est.projectId)?.name}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Badge status={est.status} map={EST_STATUS} />
            <Btn onClick={() => setShowForm(true)} small>+ Add Line Item</Btn>
          </div>
        </div>
        <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <StatCard label="Cost Subtotal" value={fmt(est.lineItems.reduce((s, i) => s + i.qty * i.cost, 0))} color={T.textSub} icon="dollar" />
          <StatCard label="Avg Markup" value={`${Math.round(est.lineItems.reduce((s, i) => s + i.markup, 0) / est.lineItems.length)}%`} color={T.amber} icon="trending" />
          <StatCard label="Total Contract" value={fmt(total)} color={T.accent} icon="dollar" />
        </div>
        {showForm && (
          <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Add Line Item</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 80px 80px", gap: 10, alignItems: "end" }}>
              {[["Category", "category"], ["Description", "description"], ["Unit", "unit"]].map(([l, f]) => (
                <Input key={f} label={l} value={newItem[f]} onChange={e => setNewItem({ ...newItem, [f]: e.target.value })} />
              ))}
              {[["Qty", "qty"], ["Unit Cost", "cost"], ["Markup %", "markup"]].map(([l, f]) => (
                <Input key={f} label={l} type="number" value={newItem[f]} onChange={e => setNewItem({ ...newItem, [f]: e.target.value })} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn onClick={addLineItem} small>Add</Btn>
              <Btn onClick={() => setShowForm(false)} variant="secondary" small>Cancel</Btn>
            </div>
          </div>
        )}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              {["Category", "Description", "Qty", "Unit", "Unit Cost", "Markup", "Total"].map(h =>
                <th key={h} style={{ padding: "12px 16px", textAlign: h === "Category" || h === "Description" ? "left" : "right", fontSize: 11, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {est.lineItems.map(item => {
                const lineTotal = item.qty * item.cost * (1 + item.markup / 100);
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, color: T.accent, background: T.accentLight, padding: "2px 8px", borderRadius: 5, fontWeight: 600 }}>{item.category}</span></td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.text }}>{item.description}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.textMid, textAlign: "right" }}>{item.qty}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.textMid, textAlign: "right" }}>{item.unit}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.textMid, textAlign: "right" }}>{fmt(item.cost)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.amber, textAlign: "right", fontWeight: 500 }}>{item.markup}%</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text, textAlign: "right" }}>{fmt(lineTotal)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: T.accentLight, borderTop: `2px solid ${T.accentBorder}` }}>
                <td colSpan={6} style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: T.accent, textAlign: "right" }}>TOTAL CONTRACT VALUE</td>
                <td style={{ padding: "14px 16px", fontSize: 16, fontWeight: 700, color: T.accent, textAlign: "right" }}>{fmt(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Bids & Proposals" title="Estimates"
        action={<Btn><Icon d={ICONS.plus} size={15} /> New Estimate</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {estimates.map(est => {
          const project = projects.find(p => p.id === est.projectId);
          const total = calcTotal(est.lineItems);
          const EST_STATUS = { Approved: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder }, Sent: { bg: T.amberLight, text: T.amber, dot: T.amber, border: T.amberBorder }, Draft: { bg: "#F3F4F6", text: T.textSub, dot: T.textMuted, border: T.border } };
          return (
            <div key={est.id} onClick={() => setSelected(est.id)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.1s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBorder; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{est.name}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{project?.name} · {est.date} · {est.lineItems.length} line items</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Total</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{fmt(total)}</div>
                </div>
                <Badge status={est.status} map={EST_STATUS} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────
const Invoices = ({ invoices, setInvoices, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [newInv, setNewInv] = useState({ projectId: projects[0]?.id, description: "", amount: "", due: "" });

  const handleAdd = () => {
    if (!newInv.amount) return;
    const num = `INV-2026-${String(invoices.length + 1).padStart(3, "0")}`;
    setInvoices([...invoices, { ...newInv, id: Date.now(), number: num, status: "Pending", issued: new Date().toISOString().slice(0, 10), projectId: parseInt(newInv.projectId), amount: parseFloat(newInv.amount) }]);
    setShowForm(false);
    setNewInv({ projectId: projects[0]?.id, description: "", amount: "", due: "" });
  };

  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const updateStatus = (id, status) => setInvoices(invoices.map(i => i.id === id ? { ...i, status } : i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Billing & Collections" title="Invoices"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={15} /> New Invoice</Btn>} />

      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Collected (Paid)" value={fmt(totalPaid)} color={T.green} icon="check" />
        <StatCard label="Pending" value={fmt(totalPending)} color={T.amber} icon="clock" />
        <StatCard label="Overdue" value={fmt(totalOverdue)} color={T.red} icon="alert" />
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>New Invoice</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newInv.projectId} onChange={e => setNewInv({ ...newInv, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Description" value={newInv.description} onChange={e => setNewInv({ ...newInv, description: e.target.value })} />
            <Input label="Amount" type="number" value={newInv.amount} onChange={e => setNewInv({ ...newInv, amount: e.target.value })} />
            <Input label="Due Date" type="date" value={newInv.due} onChange={e => setNewInv({ ...newInv, due: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Create Invoice</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            {["Invoice #", "Project", "Description", "Amount", "Issued", "Due", "Status", ""].map(h =>
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {invoices.map(inv => {
              const project = projects.find(p => p.id === inv.projectId);
              return (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>{inv.number}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.text }}>{project?.name?.substring(0, 20)}...</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: T.textSub }}>{inv.description}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: T.text }}>{fmt(inv.amount)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: T.textSub }}>{inv.issued}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: inv.status === "Overdue" ? T.red : T.textSub }}>{inv.due}</td>
                  <td style={{ padding: "14px 16px" }}><Badge status={inv.status} map={INVOICE_STATUS_LIGHT} /></td>
                  <td style={{ padding: "14px 16px" }}>
                    {inv.status !== "Paid" && (
                      <button onClick={() => updateStatus(inv.id, "Paid")}
                        style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
const Schedule = ({ projects }) => {
  const phases = ["Pre-Construction", "Demo & Site Prep", "Foundation", "Framing", "MEP Rough-In", "Insulation", "Drywall", "Finishes", "Punch List", "Closeout"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Timeline & Milestones" title="Schedule" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {projects.filter(p => p.status === "Active" || p.status === "Complete").map(p => {
          const start = new Date(p.start), end = new Date(p.end), today = new Date("2026-03-12");
          const totalDays = (end - start) / (1000 * 60 * 60 * 24);
          const elapsed = (today - start) / (1000 * 60 * 60 * 24);
          const timeProgress = Math.min(Math.max(Math.round((elapsed / totalDays) * 100), 0), 100);
          const phaseIdx = phases.indexOf(p.phase);

          return (
            <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: T.text, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{p.client} · Current phase: <span style={{ color: T.accent, fontWeight: 500 }}>{p.phase}</span></div>
                </div>
                <Badge status={p.status} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSub, marginBottom: 6 }}>
                  <span>{p.start}</span><span style={{ color: T.text, fontWeight: 500 }}>Time: {timeProgress}% elapsed</span><span>{p.end}</span>
                </div>
                <div style={{ position: "relative", height: 8, background: T.bg, borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${timeProgress}%`, background: `linear-gradient(90deg, ${T.blue}, #60A5FA)`, borderRadius: 4 }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {phases.map((ph, i) => {
                  const isDone = i < phaseIdx, isCurrent = i === phaseIdx;
                  return (
                    <div key={ph} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", height: 4, background: isDone ? T.accent : isCurrent ? T.amber : "#E5E7EB", borderRadius: 2 }} />
                        <div style={{ fontSize: 8, color: isDone ? T.accent : isCurrent ? T.amber : T.textMuted, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", fontWeight: isCurrent ? 600 : 400 }}>{ph}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Progress</div><div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>{p.progress}%</div></div>
                <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Contract</div><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{fmt(p.value)}</div></div>
                <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Days Left</div><div style={{ fontSize: 14, fontWeight: 600, color: timeProgress > 90 ? T.red : T.green }}>{Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)))}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── DAILY LOGS ───────────────────────────────────────────────────────────────
const DailyLogs = ({ logs, setLogs, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState({ projectId: projects[0]?.id, date: "", author: "", weather: "", crew: "", notes: "" });

  const handleAdd = () => {
    if (!newLog.notes) return;
    setLogs([{ ...newLog, id: Date.now(), photos: 0, projectId: parseInt(newLog.projectId), crew: parseInt(newLog.crew) || 0 }, ...logs]);
    setShowForm(false);
    setNewLog({ projectId: projects[0]?.id, date: "", author: "", weather: "", crew: "", notes: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Field Reports" title="Daily Logs"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={15} /> New Log</Btn>} />

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>New Daily Log</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newLog.projectId} onChange={e => setNewLog({ ...newLog, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            {[["Date", "date", "date"], ["Author / Foreman", "author", "text"], ["Weather", "weather", "text"], ["Crew Size", "crew", "number"]].map(([l, f, t]) => (
              <Input key={f} label={l} type={t} value={newLog[f]} onChange={e => setNewLog({ ...newLog, [f]: e.target.value })} />
            ))}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 12, color: T.textMid, display: "block", marginBottom: 5, fontWeight: 500 }}>Field Notes</label>
              <textarea value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} rows={4}
                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn onClick={handleAdd}>Save Log</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {logs.map(log => {
          const project = projects.find(p => p.id === log.projectId);
          return (
            <div key={log.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>{project?.name}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{log.date} · {log.author}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ background: T.accentLight, borderRadius: 7, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>{log.crew}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 500 }}>Crew</div>
                  </div>
                  <div style={{ background: T.blueLight, borderRadius: 7, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.blue }}>{log.photos}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 500 }}>Photos</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.65, borderLeft: `3px solid ${T.accentBorder}`, paddingLeft: 14 }}>{log.notes}</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ background: T.bg, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: T.textSub, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Icon d={ICONS.sun} size={12} stroke={T.textMuted} />{log.weather || "Not recorded"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
const Documents = ({ projects }) => {
  const docs = [
    { id: 1, name: "Riverside Remodel - Architectural Plans v3.pdf", project: "Riverside Luxury Remodel", type: "Plans", size: "8.4 MB", date: "2026-01-08", uploader: "Jake Moreno" },
    { id: 2, name: "Webb - Executed Contract.pdf", project: "Riverside Luxury Remodel", type: "Contract", size: "1.2 MB", date: "2025-12-22", uploader: "Jake Moreno" },
    { id: 3, name: "Oakwood Permit Set - City of Dallas.pdf", project: "Oakwood Office Buildout", type: "Permits", size: "12.1 MB", date: "2026-01-30", uploader: "Lisa Crane" },
    { id: 4, name: "Oakwood - Structural Engineering Drawings.pdf", project: "Oakwood Office Buildout", type: "Engineering", size: "5.8 MB", date: "2026-01-15", uploader: "Lisa Crane" },
    { id: 5, name: "Nexus Capital - Signed Contract.pdf", project: "Oakwood Office Buildout", type: "Contract", size: "2.0 MB", date: "2026-01-28", uploader: "Jake Moreno" },
    { id: 6, name: "Highland Park - Scope of Work.docx", project: "Highland Park Kitchen & Bath", type: "Scope", size: "0.4 MB", date: "2026-03-01", uploader: "Jake Moreno" },
  ];
  const TYPE_COLORS = { Plans: T.purple, Contract: T.accent, Permits: T.green, Engineering: T.blue, Scope: T.amber, Photos: "#EC4899" };
  const TYPE_BG = { Plans: T.purpleLight, Contract: T.accentLight, Permits: T.greenLight, Engineering: T.blueLight, Scope: T.amberLight, Photos: "#FDF2F8" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Files & Plans" title="Documents"
        action={<Btn><Icon d={ICONS.plus} size={15} /> Upload File</Btn>} />
      <div style={{ background: T.surface, border: `2px dashed ${T.borderStrong}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
        <div style={{ color: T.textMuted, marginBottom: 8 }}><Icon d={ICONS.download} size={26} /></div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.textMid, marginBottom: 4 }}>Drop files here or click to upload</div>
        <div style={{ fontSize: 12, color: T.textMuted }}>PDF, DWG, DOCX, XLSX, JPG, PNG — up to 100MB</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            {["File Name", "Project", "Type", "Size", "Date", "Uploaded By"].map(h =>
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {docs.map(doc => (
              <tr key={doc.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: TYPE_BG[doc.type] || T.accentLight, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: TYPE_COLORS[doc.type] || T.accent }}><Icon d={ICONS.docs} size={14} /></div>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{doc.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: T.textSub }}>{doc.project}</td>
                <td style={{ padding: "14px 16px" }}><span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[doc.type] || T.accent, background: TYPE_BG[doc.type] || T.accentLight, padding: "3px 8px", borderRadius: 5 }}>{doc.type}</span></td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: T.textSub }}>{doc.size}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: T.textSub }}>{doc.date}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: T.textMid }}>{doc.uploader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── CHANGE ORDERS ────────────────────────────────────────────────────────────
const ChangeOrders = ({ changeOrders, setChangeOrders, projects }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
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
  const catColors = { "Scope Addition": T.blue, "Unforeseen": T.red, "Upgrade": T.purple, "Owner Directive": T.green, "Credit": T.amber };
  const catBg = { "Scope Addition": T.blueLight, "Unforeseen": T.redLight, "Upgrade": T.purpleLight, "Owner Directive": T.greenLight, "Credit": T.amberLight };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Scope Changes" title="Change Orders"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={15} /> New CO</Btn>} />

      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Approved COs" value={fmt(totalApproved)} sub={`${changeOrders.filter(co => co.status === "Approved").length} orders`} color={T.green} icon="check" />
        <StatCard label="Pending Approval" value={fmt(totalPending)} sub={`${changeOrders.filter(co => co.status === "Pending").length} awaiting`} color={T.amber} icon="clock" />
        <StatCard label="Total CO Exposure" value={fmt(totalApproved + totalPending)} sub="approved + pending" color={T.accent} icon="changeorder" />
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>New Change Order</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newCO.projectId} onChange={e => setNewCO({ ...newCO, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="CO Title" value={newCO.title} onChange={e => setNewCO({ ...newCO, title: e.target.value })} />
            <Input label="Amount ($)" type="number" value={newCO.amount} onChange={e => setNewCO({ ...newCO, amount: e.target.value })} />
            <Select label="Category" value={newCO.category} onChange={e => setNewCO({ ...newCO, category: e.target.value })} options={["Scope Addition", "Unforeseen", "Upgrade", "Owner Directive", "Credit"]} />
            <Select label="Requested By" value={newCO.requestedBy} onChange={e => setNewCO({ ...newCO, requestedBy: e.target.value })} options={["Owner", "GC", "Architect", "Engineer"]} />
            <div />
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 12, color: T.textMid, display: "block", marginBottom: 5, fontWeight: 500 }}>Description</label>
              <textarea value={newCO.description} onChange={e => setNewCO({ ...newCO, description: e.target.value })} rows={3}
                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Submit CO</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {["All", "Pending", "Approved", "Rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ background: filter === s ? T.accent : T.surface, color: filter === s ? "#fff" : T.textMid, border: `1px solid ${filter === s ? T.accent : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: filter === s ? 600 : 500, cursor: "pointer" }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(co => {
          const project = projects.find(p => p.id === co.projectId);
          const sc = CO_STATUS_LIGHT[co.status] || CO_STATUS_LIGHT.Void;
          return (
            <div key={co.id} style={{ background: T.surface, border: `1px solid ${co.status === "Pending" ? T.amberBorder : T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{co.number}</span>
                    <span style={{ fontSize: 11, color: catColors[co.category] || T.textSub, background: catBg[co.category] || "#F3F4F6", padding: "2px 8px", borderRadius: 5, fontWeight: 600 }}>{co.category}</span>
                    <span style={{ fontSize: 11, color: T.textSub }}>Req. by: {co.requestedBy}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>{co.title}</div>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55 }}>{co.description}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 130, paddingLeft: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: co.amount >= 0 ? T.accent : T.green, marginBottom: 8 }}>
                    {co.amount >= 0 ? "+" : ""}{fmt(co.amount)}
                  </div>
                  <Badge status={co.status} map={CO_STATUS_LIGHT} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, color: T.textSub }}>{project?.name} · {co.date}</div>
                {co.status === "Pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateStatus(co.id, "Approved")} style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
                    <button onClick={() => updateStatus(co.id, "Rejected")} style={{ background: T.redLight, color: T.red, border: `1px solid ${T.redBorder}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✗ Reject</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── BUDGET VS ACTUAL ─────────────────────────────────────────────────────────
const BudgetTracker = ({ budgetItems, projects, changeOrders }) => {
  const [selectedProject, setSelectedProject] = useState(projects.find(p => p.status === "Active")?.id || projects[0]?.id);

  const projectBudget = budgetItems.filter(b => b.projectId === selectedProject);
  const approvedCOs = changeOrders.filter(co => co.projectId === selectedProject && co.status === "Approved");
  const coTotal = approvedCOs.reduce((s, co) => s + co.amount, 0);
  const totalBudgeted = projectBudget.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = projectBudget.reduce((s, b) => s + b.actual, 0);
  const totalCommitted = projectBudget.reduce((s, b) => s + b.committed, 0);
  const revisedBudget = totalBudgeted + coTotal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <PageHeader eyebrow="Financial Control" title="Budget vs Actual" />
        <Select value={selectedProject} onChange={e => setSelectedProject(parseInt(e.target.value))} options={projects.filter(p => p.status === "Active" || p.status === "Complete").map(p => ({ value: p.id, label: p.name }))} />
      </div>

      <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Original Budget" value={fmt(totalBudgeted)} color={T.textSub} icon="dollar" />
        <StatCard label="Revised Budget" value={fmt(revisedBudget)} sub={`+${fmt(coTotal)} from COs`} color={T.blue} icon="changeorder" />
        <StatCard label="Actual Spent" value={fmt(totalActual)} sub={`${Math.round((totalActual / revisedBudget) * 100)}% of budget`} color={totalActual > revisedBudget ? T.red : T.green} icon="trending" />
        <StatCard label="Committed" value={fmt(totalCommitted)} sub="incl. pending POs" color={T.amber} icon="clock" />
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 16 }}>Cost-to-Complete Overview</div>
        <div style={{ position: "relative", height: 28, background: T.bg, borderRadius: 7, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min((totalActual / revisedBudget) * 100, 100)}%`, background: totalActual > revisedBudget * 0.9 ? T.red : T.green, borderRadius: "8px 0 0 8px", display: "flex", alignItems: "center", paddingLeft: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>Actual {Math.round((totalActual / revisedBudget) * 100)}%</span>
          </div>
          {totalCommitted > totalActual && (
            <div style={{ position: "absolute", left: `${(totalActual / revisedBudget) * 100}%`, top: 0, height: "100%", width: `${Math.min(((totalCommitted - totalActual) / revisedBudget) * 100, 100 - (totalActual / revisedBudget) * 100)}%`, background: T.amber + "60", display: "flex", alignItems: "center", paddingLeft: 4 }}>
              <span style={{ fontSize: 10, color: T.amber, whiteSpace: "nowrap", fontWeight: 500 }}>Committed</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: T.textSub }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: T.green, borderRadius: 2, display: "inline-block" }} />Actual spend</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: T.amber + "60", borderRadius: 2, display: "inline-block" }} />Committed</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: "#E5E7EB", borderRadius: 2, display: "inline-block" }} />Remaining</span>
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            {["Cost Category", "Budgeted", "Actual", "Committed", "Variance", "% Used"].map(h =>
              <th key={h} style={{ padding: "12px 16px", textAlign: h === "Cost Category" ? "left" : "right", fontSize: 11, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {projectBudget.map((item, i) => {
              const variance = item.budgeted - item.actual;
              const pct = item.budgeted > 0 ? Math.round((item.actual / item.budgeted) * 100) : 0;
              const isOver = variance < 0;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500, color: T.text }}>{item.category}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.textSub, textAlign: "right" }}>{fmt(item.budgeted)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: T.text, textAlign: "right" }}>{fmt(item.actual)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.amber, textAlign: "right", fontWeight: 500 }}>{fmt(item.committed)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: isOver ? T.red : T.green, textAlign: "right" }}>
                    {isOver ? "−" : "+"}{fmt(Math.abs(variance))}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <div style={{ width: 60, height: 6, background: T.bg, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 100 ? T.red : pct > 80 ? T.amber : T.green, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: pct > 100 ? T.red : pct > 80 ? T.amber : T.textSub, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: T.accentLight, borderTop: `2px solid ${T.accentBorder}` }}>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>TOTAL</td>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: T.textSub, textAlign: "right" }}>{fmt(totalBudgeted)}</td>
              <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: T.text, textAlign: "right" }}>{fmt(totalActual)}</td>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: T.amber, textAlign: "right" }}>{fmt(totalCommitted)}</td>
              <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: totalBudgeted - totalActual < 0 ? T.red : T.green, textAlign: "right" }}>
                {totalBudgeted - totalActual < 0 ? "−" : "+"}{fmt(Math.abs(totalBudgeted - totalActual))}
              </td>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: T.accent, textAlign: "right" }}>{Math.round((totalActual / totalBudgeted) * 100)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {approvedCOs.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Approved Change Orders Included in Budget</div>
          {approvedCOs.map(co => (
            <div key={co.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
              <div><span style={{ fontWeight: 700, color: T.accent }}>{co.number}</span> <span style={{ color: T.text }}>{co.title}</span></div>
              <span style={{ fontWeight: 600, color: T.green }}>+{fmt(co.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SUBCONTRACTOR BID MANAGEMENT ─────────────────────────────────────────────
const SubBids = ({ subBids, setSubBids, projects, contacts }) => {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [newPackage, setNewPackage] = useState({ projectId: projects[0]?.id || 1, trade: "", scope: "", dueDate: "" });
  const [newBid, setNewBid] = useState({ subName: "", amount: "", notes: "" });

  const pkg = subBids.find(s => s.id === selected);
  const BID_STATUS = { Open: { bg: T.blueLight, text: T.blue, dot: T.blue, border: T.blueBorder }, Awarded: { bg: T.greenLight, text: T.green, dot: T.green, border: T.greenBorder }, Closed: { bg: "#F3F4F6", text: T.textSub, dot: T.textMuted, border: T.border } };

  const handleAddPackage = () => {
    if (!newPackage.trade) return;
    setSubBids([...subBids, { ...newPackage, id: Date.now(), status: "Open", projectId: parseInt(newPackage.projectId), bids: [] }]);
    setShowForm(false);
    setNewPackage({ projectId: projects[0]?.id || 1, trade: "", scope: "", dueDate: "" });
  };

  const handleAddBid = () => {
    if (!newBid.subName || !newBid.amount) return;
    setSubBids(subBids.map(s => s.id === selected ? { ...s, bids: [...s.bids, { ...newBid, subId: Date.now(), amount: parseFloat(newBid.amount), submitted: new Date().toISOString().slice(0, 10), awarded: false }] } : s));
    setShowBidForm(false);
    setNewBid({ subName: "", amount: "", notes: "" });
  };

  const awardBid = (bidSubId) => {
    setSubBids(subBids.map(s => s.id === selected ? { ...s, status: "Awarded", bids: s.bids.map(b => ({ ...b, awarded: b.subId === bidSubId })) } : s));
  };

  if (selected && pkg) {
    const sorted = [...pkg.bids].sort((a, b) => a.amount - b.amount);
    const lowestBid = sorted[0]?.amount;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={() => setSelected(null)} variant="secondary" small>← Back</Btn>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{pkg.trade} – Bid Package</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{projects.find(p => p.id === pkg.projectId)?.name} · Due: {pkg.dueDate}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Badge status={pkg.status} map={BID_STATUS} />
            {pkg.status === "Open" && <Btn onClick={() => setShowBidForm(true)} small>+ Add Bid</Btn>}
          </div>
        </div>

        {pkg.bids.length > 0 && (
          <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <StatCard label="Bids Received" value={pkg.bids.length} color={T.blue} icon="users" />
            <StatCard label="Low Bid" value={fmt(lowestBid)} sub={sorted[0]?.subName} color={T.green} icon="award" />
            <StatCard label="Spread" value={pkg.bids.length > 1 ? fmt(sorted[sorted.length - 1].amount - sorted[0].amount) : "—"} sub="high vs low" color={T.amber} icon="trending" />
          </div>
        )}

        {showBidForm && (
          <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Add Bid</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
              <Input label="Subcontractor" value={newBid.subName} onChange={e => setNewBid({ ...newBid, subName: e.target.value })} placeholder="Company name" />
              <Input label="Bid Amount" type="number" value={newBid.amount} onChange={e => setNewBid({ ...newBid, amount: e.target.value })} />
              <Input label="Notes / Exclusions" value={newBid.notes} onChange={e => setNewBid({ ...newBid, notes: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn onClick={handleAddBid} small>Add Bid</Btn>
              <Btn onClick={() => setShowBidForm(false)} variant="secondary" small>Cancel</Btn>
            </div>
          </div>
        )}

        {pkg.bids.length === 0 ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: T.textMid }}>No bids received yet</div>
            <div style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>Invite subcontractors to submit bids for this package</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((bid, i) => {
              const isLow = i === 0;
              const spread = lowestBid > 0 ? Math.round(((bid.amount - lowestBid) / lowestBid) * 100) : 0;
              return (
                <div key={bid.subId} style={{ background: bid.awarded ? T.greenLight : T.surface, border: `1px solid ${bid.awarded ? T.greenBorder : isLow ? T.accentBorder : T.border}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 36, height: 36, background: bid.awarded ? T.greenLight : isLow ? T.accentLight : "#F3F4F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: bid.awarded ? T.green : isLow ? T.accent : T.textSub }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{bid.subName}</div>
                        <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Submitted {bid.submitted}{bid.notes && <span> · {bid.notes}</span>}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {isLow && !bid.awarded && <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentLight, padding: "3px 8px", borderRadius: 5, border: `1px solid ${T.accentBorder}` }}>LOW BID</span>}
                      {bid.awarded && <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: T.greenLight, padding: "3px 8px", borderRadius: 5, border: `1px solid ${T.greenBorder}` }}>AWARDED</span>}
                      {i > 0 && <span style={{ fontSize: 11, color: T.red, fontWeight: 500 }}>+{spread}%</span>}
                      <div style={{ fontSize: 20, fontWeight: 700, color: bid.awarded ? T.green : T.text }}>{fmt(bid.amount)}</div>
                      {!bid.awarded && pkg.status === "Open" && (
                        <button onClick={() => awardBid(bid.subId)} style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`, borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Award</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Scope of Work</div>
          <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.65 }}>{pkg.scope || "No scope defined."}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader eyebrow="Procurement" title="Sub Bid Management"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.plus} size={15} /> New Bid Package</Btn>} />

      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Open Packages" value={subBids.filter(s => s.status === "Open").length} color={T.blue} icon="bids" />
        <StatCard label="Total Bids Received" value={subBids.reduce((s, pkg) => s + pkg.bids.length, 0)} color={T.accent} icon="users" />
        <StatCard label="Awarded" value={subBids.filter(s => s.status === "Awarded").length} color={T.green} icon="check" />
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>New Bid Package</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newPackage.projectId} onChange={e => setNewPackage({ ...newPackage, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Trade" value={newPackage.trade} onChange={e => setNewPackage({ ...newPackage, trade: e.target.value })} placeholder="e.g. Electrical, Plumbing" />
            <Input label="Bid Due Date" type="date" value={newPackage.dueDate} onChange={e => setNewPackage({ ...newPackage, dueDate: e.target.value })} />
            <div />
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 12, color: T.textMid, display: "block", marginBottom: 5, fontWeight: 500 }}>Scope of Work</label>
              <textarea value={newPackage.scope} onChange={e => setNewPackage({ ...newPackage, scope: e.target.value })} rows={3}
                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAddPackage}>Create Package</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {subBids.map(pkg => {
          const project = projects.find(p => p.id === pkg.projectId);
          const sortedBids = [...pkg.bids].sort((a, b) => a.amount - b.amount);
          const awarded = pkg.bids.find(b => b.awarded);
          return (
            <div key={pkg.id} onClick={() => setSelected(pkg.id)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, cursor: "pointer", transition: "all 0.1s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBorder; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 3 }}>{pkg.trade}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8 }}>{project?.name} · Due: {pkg.dueDate || "TBD"}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{pkg.scope?.substring(0, 70)}{pkg.scope?.length > 70 ? "..." : ""}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <Badge status={pkg.status} map={BID_STATUS} />
                  <div style={{ fontSize: 12, color: T.textMuted }}>{pkg.bids.length} bid{pkg.bids.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              {pkg.bids.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}`, display: "flex", gap: 20 }}>
                  <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Low Bid</div><div style={{ fontSize: 14, fontWeight: 600, color: T.green }}>{fmt(sortedBids[0].amount)}</div></div>
                  {sortedBids.length > 1 && <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>High Bid</div><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{fmt(sortedBids[sortedBids.length - 1].amount)}</div></div>}
                  {awarded && <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Awarded To</div><div style={{ fontSize: 14, fontWeight: 600, color: T.green }}>{awarded.subName}</div></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PHOTO GALLERY ────────────────────────────────────────────────────────────
const PhotoGallery = ({ photos, setPhotos, projects }) => {
  const [projectFilter, setProjectFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [newPhoto, setNewPhoto] = useState({ projectId: projects[0]?.id || 1, caption: "", tag: "Progress", date: new Date().toISOString().slice(0, 10) });

  const TAG_COLORS = { "Progress": T.blue, "Milestone": T.green, "Issue": T.red, "Before/After": T.purple, "Inspection": T.amber, "Material": T.accent };
  const TAG_BG = { "Progress": T.blueLight, "Milestone": T.greenLight, "Issue": T.redLight, "Before/After": T.purpleLight, "Inspection": T.amberLight, "Material": T.accentLight };
  const allTags = [...new Set(photos.map(p => p.tag))];

  const filtered = photos.filter(p =>
    (projectFilter === "All" || p.projectId === parseInt(projectFilter)) &&
    (tagFilter === "All" || p.tag === tagFilter)
  );

  const handleAdd = () => {
    if (!newPhoto.caption) return;
    const colors = ["#DCFCE7", "#DBEAFE", "#FEF9C3", "#F3E8FF", "#FEE2E2", "#FFEDD5"];
    const emojis = ["📸", "🏗️", "⚡", "🔧", "🏠", "📐", "✅", "📦"];
    setPhotos([{ ...newPhoto, id: Date.now(), author: "Jake Moreno", projectId: parseInt(newPhoto.projectId), color: colors[Math.floor(Math.random() * colors.length)], emoji: emojis[Math.floor(Math.random() * emojis.length)] }, ...photos]);
    setShowForm(false);
    setNewPhoto({ projectId: projects[0]?.id || 1, caption: "", tag: "Progress", date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", maxWidth: 600, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ height: 320, background: lightbox.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{lightbox.emoji}</div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>{lightbox.caption}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{projects.find(p => p.id === lightbox.projectId)?.name} · {lightbox.date} · {lightbox.author}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: TAG_COLORS[lightbox.tag] || T.textSub, background: TAG_BG[lightbox.tag] || "#F3F4F6", padding: "4px 10px", borderRadius: 6 }}>{lightbox.tag}</span>
              </div>
              <Btn onClick={() => setLightbox(null)} variant="secondary" small>Close</Btn>
            </div>
          </div>
        </div>
      )}

      <PageHeader eyebrow="Project Photos" title="Photo Gallery"
        action={<Btn onClick={() => setShowForm(true)}><Icon d={ICONS.camera} size={15} /> Add Photo</Btn>} />

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} options={[{ value: "All", label: "All Projects" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...allTags].map(t => (
            <button key={t} onClick={() => setTagFilter(t)}
              style={{ background: tagFilter === t ? (TAG_BG[t] || T.accentLight) : T.surface, color: tagFilter === t ? (TAG_COLORS[t] || T.accent) : T.textMid, border: `1px solid ${tagFilter === t ? (TAG_COLORS[t] + "50" || T.accentBorder) : T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: tagFilter === t ? 600 : 500, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18 }}>Add Photo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Project" value={newPhoto.projectId} onChange={e => setNewPhoto({ ...newPhoto, projectId: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Caption" value={newPhoto.caption} onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })} />
            <Select label="Tag" value={newPhoto.tag} onChange={e => setNewPhoto({ ...newPhoto, tag: e.target.value })} options={Object.keys(TAG_COLORS)} />
            <Input label="Date" type="date" value={newPhoto.date} onChange={e => setNewPhoto({ ...newPhoto, date: e.target.value })} />
          </div>
          <div style={{ background: T.bg, border: `2px dashed ${T.borderStrong}`, borderRadius: 10, padding: 20, textAlign: "center", marginTop: 14 }}>
            <div style={{ fontSize: 12, color: T.textSub }}>📷 Photo upload — drag & drop or browse</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={handleAdd}>Add Photo</Btn>
            <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      )}

      <div className="photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {filtered.map(photo => {
          const project = projects.find(p => p.id === photo.projectId);
          return (
            <div key={photo.id} onClick={() => setLightbox(photo)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accentBorder; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ height: 160, background: photo.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, position: "relative" }}>
                {photo.emoji}
                <div style={{ position: "absolute", top: 8, right: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TAG_COLORS[photo.tag] || T.textSub, background: "rgba(255,255,255,0.9)", padding: "2px 8px", borderRadius: 5 }}>{photo.tag}</span>
                </div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4, lineHeight: 1.4 }}>{photo.caption}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{project?.name?.substring(0, 24)} · {photo.date}</div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
          <div style={{ fontSize: 14, color: T.textSub }}>No photos match this filter</div>
        </div>
      )}
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
  const [budgetItems] = useState(INITIAL_BUDGET_ITEMS);
  const [subBids, setSubBids] = useState(INITIAL_SUB_BIDS);
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);

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
    projects: <Projects projects={projects} setProjects={setProjects} />,
    contacts: <Contacts contacts={contacts} setContacts={setContacts} projects={projects} />,
    estimates: <Estimates estimates={estimates} setEstimates={setEstimates} projects={projects} />,
    invoices: <Invoices invoices={invoices} setInvoices={setInvoices} projects={projects} />,
    schedule: <Schedule projects={projects} />,
    logs: <DailyLogs logs={logs} setLogs={setLogs} projects={projects} />,
    docs: <Documents projects={projects} />,
    changeorders: <ChangeOrders changeOrders={changeOrders} setChangeOrders={setChangeOrders} projects={projects} />,
    budget: <BudgetTracker budgetItems={budgetItems} projects={projects} changeOrders={changeOrders} />,
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
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>Jake Moreno</div>
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

      {/* Mobile Overlay Sidebar */}
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
