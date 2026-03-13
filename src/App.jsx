// src/App.jsx

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── UI Components ───────────────────────────────────────────────────────────
import Button from "./components/ui/Button";
import Input from "./components/ui/Input";
import Select from "./components/ui/Select";
import Textarea from "./components/ui/Textarea";
import Badge from "./components/ui/Badge";
import Card from "./components/ui/Card";
import Stat from "./components/ui/Stat";
import PageHead from "./components/ui/PageHead";
import Table, { TH, TD, TR } from "./components/ui/Table"; // assume you split Table logic
import Confirm from "./components/ui/Confirm";
import Modal from "./components/ui/Modal";
import Grid, { Span2 } from "./components/ui/Grid";
import Progress from "./components/ui/Progress";
import DeleteBtn from "./components/ui/DeleteBtn";
import EditBtn from "./components/ui/EditBtn";
import EmptyState from "./components/ui/EmptyState";
import Tabs from "./components/ui/Tabs";
import InfoRow from "./components/ui/InfoRow";

// ─── Icons & Constants ───────────────────────────────────────────────────────
import { Ic } from "./lib/icons";           // ← must be .jsx file now
import { C } from "./lib/colors";
import { fmt, fmtDate, today, uid } from "./lib/formatters";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://daxqltkdkfpkhnzttfln.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheHFsdGtka2Zwa2huenR0ZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTQwMjAsImV4cCI6MjA4ODkzMDAyMH0.2Kx2oGa7ftl9q8XiVCGqqzAiPcP6Q4KSeoz0Mc-LDpo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Mobile hook ─────────────────────────────────────────────────────────────
const useMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
};

// ─── Navigation items ────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "projects",  label: "Projects",  icon: "proj" },
  { id: "estimates", label: "Estimates", icon: "est" },
  { id: "invoices",  label: "Invoices",  icon: "inv" },
  { id: "cos",       label: "Change Orders", icon: "co" },
  { id: "budget",    label: "Budget",    icon: "budget" },
  { id: "bids",      label: "Bids",      icon: "bids" },
  { id: "schedule",  label: "Schedule",  icon: "sched" },
  { id: "logs",      label: "Daily Logs",icon: "logs" },
  { id: "docs",      label: "Documents", icon: "docs" },
  { id: "photos",    label: "Photos",    icon: "photos" },
  { id: "contacts",  label: "Contacts",  icon: "contacts" },
];

// ─── STATUS MAP (moved to lib/statusMap.js later) ────────────────────────────
const STATUS_MAP = {
  Lead:       { bg: C.blueL,   text: C.blue,   border: C.blueB   },
  Estimate:   { bg: C.amberL,  text: C.amber,  border: C.amberB  },
  Active:     { bg: C.greenL,  text: C.green,  border: C.greenB  },
  "On Hold":  { bg: C.redL,    text: C.red,    border: C.redB    },
  Complete:   { bg: C.purpleL, text: C.purple, border: C.purpleB },
  Paid:       { bg: C.greenL,  text: C.green,  border: C.greenB  },
  Pending:    { bg: C.amberL,  text: C.amber,  border: C.amberB  },
  Overdue:    { bg: C.redL,    text: C.red,    border: C.redB    },
  Draft:      { bg: C.bg,      text: C.textSub,border: C.border   },
  Sent:       { bg: C.amberL,  text: C.amber,  border: C.amberB  },
  Approved:   { bg: C.greenL,  text: C.green,  border: C.greenB  },
  Rejected:   { bg: C.redL,    text: C.red,    border: C.redB    },
  Open:       { bg: C.blueL,   text: C.blue,   border: C.blueB   },
  Awarded:    { bg: C.greenL,  text: C.green,  border: C.greenB  },
};

// ──────────────────────────────────────────────────────────────────────────────
//  App Component
// ──────────────────────────────────────────────────────────────────────────────

export default function App() {
  const mobile = useMobile();
  const [tab, setTab] = useState("dashboard");
  const [navPayload, setNavPayload] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [cos, setCos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bids, setBids] = useState([]);
  const [docs, setDocs] = useState([]);
  const [photos, setPhotos] = useState([]);

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [
          { data: proj }, { data: cont }, { data: budg },
          { data: ests }, { data: lines }, { data: invs },
          { data: cosr }, { data: lgsr }, { data: pkgs },
          { data: bdsr }, { data: dcsr }, { data: phsr }
        ] = await Promise.all([
          supabase.from("projects").select("*").order("created_at", { ascending: false }),
          supabase.from("contacts").select("*").order("created_at", { ascending: false }),
          supabase.from("budget_items").select("*"),
          supabase.from("estimates").select("*").order("created_at", { ascending: false }),
          supabase.from("estimate_line_items").select("*"),
          supabase.from("invoices").select("*").order("created_at", { ascending: false }),
          supabase.from("change_orders").select("*").order("created_at", { ascending: false }),
          supabase.from("daily_logs").select("*").order("date", { ascending: false }),
          supabase.from("bid_packages").select("*").order("created_at", { ascending: false }),
          supabase.from("bids").select("*"),
          supabase.from("documents").select("*").order("created_at", { ascending: false }),
          supabase.from("photos").select("*").order("created_at", { ascending: false }),
        ]);

        setProjects((proj || []).map(r => ({
          id: r.id, name: r.name, client: r.client || "", status: r.status || "Lead",
          phase: r.phase || "Pre-Construction", type: r.type || "Residential",
          value: parseFloat(r.value) || 0, spent: parseFloat(r.spent) || 0,
          progress: parseInt(r.progress) || 0, address: r.address || "",
          start: r.start_date || "", end: r.end_date || "", notes: r.notes || ""
        })));

        setContacts((cont || []).map(r => ({
          id: r.id, name: r.name, company: r.company || "", type: r.type || "Client",
          email: r.email || "", phone: r.phone || "", city: r.city || ""
        })));

        // ... similar mapping for budgetItems, estimates (with lines), invoices, cos, logs, bids (with nested), docs, photos

        // Note: for brevity I omitted full mapping for all tables here — copy pattern from original

      } catch (e) {
        console.error("Data load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const navigate = (id, payload = null) => {
    setTab(id);
    setNavPayload(payload);
    setMenuOpen(false);
  };

  // ── DB sync helpers (simplified version) ────────────────────────────────────
  const setProjectsDB = (updater) => {
    setProjects(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // In real app: next.forEach(p => supabase.from("projects").upsert({...}));
      return next;
    });
  };

  // ... similar setters for other states

  const sharedProps = {
    projects, setProjects: setProjectsDB,
    // add other setters...
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, flexDirection: "column", gap: 16 }}>
        <div style={{ width: 44, height: 44, background: C.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic d={I.hard} s={22} stroke="#fff" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>BuildFlow Pro</div>
        <div style={{ fontSize: 13, color: C.textSub }}>Loading your projects...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>

      {/* Global styles – keep as is */}
      <style>{/* your existing @import and media queries */}</style>

      {/* Desktop Sidebar */}
      <div className="sidebar" style={{ width: 205, background: "#fff", borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
        <Sidebar tab={tab} navigate={navigate} />
      </div>

      {/* Mobile Header + Menu + Bottom Nav – keep as is */}
      {/* ... your existing mobileHeader, mobileMenu, bottomNav code ... */}

      {/* Main content */}
      <div className="mainPad" style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
        <div style={{ maxWidth: 1100 }}>

          {tab === "dashboard" && <Dashboard projects={projects} invoices={invoices} cos={cos} onNav={navigate} />}

          {tab === "projects" && (
            <div style={{ display: tab === "projects" ? "block" : "none" }}>
              <Projects {...sharedProps} contacts={contacts} initialId={navPayload} />
            </div>
          )}

          {tab === "estimates" && <GlobalEstimates estimates={estimates} setEstimates={setEstimates} projects={projects} />}
          {tab === "invoices" && <GlobalInvoices invoices={invoices} setInvoices={setInvoices} projects={projects} />}
          {tab === "cos" && <ChangeOrders cos={cos} setCos={setCos} projects={projects} />}
          {tab === "budget" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <PageHead eyebrow="Cost Management" title="Budget Tracker" />
              {projects.filter(p => p.status === "Active" || p.status === "Complete").map(p => (
                <div key={p.id}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    {p.name} <Badge s={p.status} />
                  </div>
                  <Budget projectId={p.id} budgetItems={budgetItems} setBudgetItems={setBudgetItems} projects={projects} setProjects={setProjectsDB} />
                  <div style={{ height: 24 }} />
                </div>
              ))}
            </div>
          )}

          {tab === "bids" && <SubBids bids={bids} setBids={setBids} projects={projects} />}
          {tab === "schedule" && <Schedule projects={projects} setProjects={setProjectsDB} />}
          {tab === "logs" && <DailyLogs logs={logs} setLogs={setLogs} projects={projects} />}
          {tab === "docs" && <Documents docs={docs} setDocs={setDocs} projects={projects} />}
          {tab === "photos" && <Photos photos={photos} setPhotos={setPhotos} projects={projects} />}
          {tab === "contacts" && <Contacts contacts={contacts} setContacts={setContacts} />}

        </div>
      </div>
    </div>
  );
}
