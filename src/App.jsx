import React, { useState, useEffect, useCallback, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { api, setToken, getToken } from "./lib/api";
import { login as authLogin, signup as authSignup, logout as authLogout, restoreSession } from "./lib/auth";

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
const uploadFile = async (file, bucket, path) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);
    const token = getToken();
    const res = await fetch(`/api/upload/${bucket}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      toast.error(`Upload failed: ${err.error}`, { duration: 6000 });
      return null;
    }
    const data = await res.json();
    return data?.url || data?.publicUrl || null;
  } catch (e) {
    console.error("upload exception", e);
    toast.error(`Upload error: ${e.message}`, { duration: 6000 });
    return null;
  }
};

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#F0F2F5",surface:"#FFFFFF",border:"#DFE1E6",borderStrong:"#C1C7D0",
  text:"#0D1B2A",textMid:"#1B2A3D",textSub:"#4A5568",textMuted:"#8993A4",
  accent:"#D35400",accentL:"#FDF2EC",accentB:"#E8A87C",
  green:"#137547",greenL:"#EEF7F2",greenB:"#8ECBA8",
  red:"#B91C1C",redL:"#FDF0F0",redB:"#E8A0A0",
  blue:"#1A4B8C",blueL:"#EDF1F8",blueB:"#95B1D9",
  amber:"#A05F00",amberL:"#FBF5EB",amberB:"#DBC17E",
  purple:"#5B2C9F",purpleL:"#F2EEFC",purpleB:"#BBAAE5",
  navy:"#0D1B2A",navyMid:"#1B2A3D",
};

const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n||0);
const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const today = () => new Date().toISOString().slice(0,10);
const uid = () => crypto.randomUUID();

// ─── COMPANY DEFAULTS ─────────────────────────────────────────────────────────
const DEFAULT_COMPANY = {name:"My Company",logo:"",address:"",city:"",state:"",zip:"",phone:"",email:"",website:"",license:"",defaultMarkup:20,terms:"Payment due within 30 days of invoice date. A 1.5% monthly finance charge will be applied to all overdue balances."};

// ─── BUDGET CODES (CSI-based) ─────────────────────────────────────────────────
const BUDGET_CODES = [
  {div:"01",label:"General Conditions",items:["Project Management","Site Safety & Security","Site Utilities","Temporary Facilities","Insurance & Bonding","Permits & Fees","Surveying","Testing & Inspection","Clean-Up","Other GC"]},
  {div:"02",label:"Site Work",items:["Demolition","Excavation & Grading","Site Drainage","Site Utilities Underground","Concrete Flatwork","Landscaping & Irrigation","Paving & Asphalt","Erosion Control"]},
  {div:"03",label:"Concrete",items:["Footings & Grade Beams","Foundation Walls","Slab on Grade","Concrete Piers","Concrete Stairs","Reinforcing Steel"]},
  {div:"04",label:"Masonry",items:["CMU Block","Brick Veneer","Stone Work","Mortar & Grout","Masonry Fireplace"]},
  {div:"05",label:"Metals / Structural",items:["Structural Steel","Metal Decking","Stairs & Railings","Miscellaneous Metals"]},
  {div:"06",label:"Rough Carpentry",items:["Lumber & Framing","Structural Sheathing","Engineered Wood Products","Blocking & Backing","Trusses"]},
  {div:"06F",label:"Finish Carpentry & Millwork",items:["Interior Trim & Moldings","Cabinets","Vanities","Shelving","Closet Systems","Countertops"]},
  {div:"07",label:"Thermal & Moisture",items:["Roofing","Roof Sheathing","Underlayment","Flashing","Waterproofing","Insulation","Housewrap","Caulking & Sealants","Gutters & Downspouts"]},
  {div:"08",label:"Doors & Windows",items:["Exterior Doors","Interior Doors","Windows","Skylights","Door Hardware","Garage Doors","Storefront / Glass"]},
  {div:"09",label:"Finishes",items:["Drywall & Framing","Drywall Finish & Paint","Tile — Floor","Tile — Shower/Bath","Flooring — Hardwood","Flooring — LVP/Laminate","Flooring — Carpet","Ceiling Finishes","Painting — Interior","Painting — Exterior"]},
  {div:"10",label:"Specialties",items:["Shower Doors & Enclosures","Mirrors","Bath Accessories","Fireplace — Prefab","Signage","Other Specialties"]},
  {div:"11",label:"Appliances & Equipment",items:["Kitchen Appliances","Washer / Dryer","HVAC Equipment","Water Heater","Equipment Rental"]},
  {div:"15",label:"Mechanical",items:["Plumbing Rough-In","Plumbing Fixtures & Trim","Gas Piping","HVAC Ductwork","HVAC Controls","Fire Sprinklers"]},
  {div:"16",label:"Electrical",items:["Electrical Rough-In","Electrical Panel & Service","Lighting Fixtures","Low Voltage / Data","Solar / PV System","EV Charging"]},
  {div:"17",label:"Contingency & Other",items:["Owner Allowance","Contingency","Warranty Reserve","Other"]},
];
const BUDGET_CAT_FLAT = BUDGET_CODES.flatMap(d=>d.items.map(i=>({div:d.div,label:d.label,item:i,full:`${d.div} · ${i}`})));

// ─── UNSAVED CHANGES WARNING ─────────────────────────────────────────────────
const useUnsavedWarning = (isDirty) => {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
};

// ─── MOBILE HOOK ──────────────────────────────────────────────────────────────
const useMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
// No seed data — all data lives in Supabase

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ic = ({ d, s=18, stroke="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const I = {
  home:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  proj:"M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  contacts:["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  est:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  inv:"M12 1v22 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  budget:"M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  co:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  bids:"M9 12h6 M9 16h6 M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z",
  logs:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  docs:"M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7",
  photos:"M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
  sched:"M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  plus:"M12 5v14 M5 12h14",
  trash:"M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  check:"M20 6L9 17l-5-5",
  x:"M18 6L6 18 M6 6l12 12",
  alert:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  search:"M11 17a6 6 0 100-12 6 6 0 000 12z M21 21l-4.35-4.35",
  send:"M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  award:"M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  menu:"M3 12h18 M3 6h18 M3 18h18",
  back:"M19 12H5 M12 19l-7-7 7-7",
  dollar:"M12 1v22 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  trend:"M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  sun:"M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
  hard:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  rfi:"M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  punch:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  po:"M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  meeting:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  report:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
};

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  Lead:{bg:C.blueL,text:C.blue,border:C.blueB},
  Estimate:{bg:C.amberL,text:C.amber,border:C.amberB},
  Active:{bg:C.greenL,text:C.green,border:C.greenB},
  "On Hold":{bg:C.redL,text:C.red,border:C.redB},
  Complete:{bg:C.purpleL,text:C.purple,border:C.purpleB},
  Paid:{bg:C.greenL,text:C.green,border:C.greenB},
  Pending:{bg:C.amberL,text:C.amber,border:C.amberB},
  Overdue:{bg:C.redL,text:C.red,border:C.redB},
  Draft:{bg:C.bg,text:C.textSub,border:C.border},
  Sent:{bg:C.amberL,text:C.amber,border:C.amberB},
  Approved:{bg:C.greenL,text:C.green,border:C.greenB},
  Rejected:{bg:C.redL,text:C.red,border:C.redB},
  Open:{bg:C.blueL,text:C.blue,border:C.blueB},
  Awarded:{bg:C.greenL,text:C.green,border:C.greenB},
  Answered:{bg:C.greenL,text:C.green,border:C.greenB},
  Closed:{bg:C.purpleL,text:C.purple,border:C.purpleB},
  Void:{bg:C.bg,text:C.textMuted,border:C.border},
  "In Progress":{bg:C.blueL,text:C.blue,border:C.blueB},
  Received:{bg:C.greenL,text:C.green,border:C.greenB},
};

const Badge = ({s}) => {
  const m = STATUS_MAP[s]||{bg:C.bg,text:C.textSub,border:C.border};
  return <span style={{background:m.bg,color:m.text,border:`1px solid ${m.border}`,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4,letterSpacing:"0.01em",lineHeight:"18px"}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:m.text,display:"inline-block",flexShrink:0}}/>
    {s}
  </span>;
};

const Btn = ({children,onClick,v="primary",sm,danger,style={}}) => {
  const base = {borderRadius:5,padding:sm?"5px 12px":"8px 18px",fontWeight:600,fontSize:sm?11:13,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,border:"none",transition:"background 0.15s, border-color 0.15s",fontFamily:"inherit",letterSpacing:"0.01em",lineHeight:"20px",...style};
  const vs = {
    primary:{background:C.accent,color:"#fff",border:`1px solid ${C.accent}`},
    secondary:{background:C.surface,color:C.textMid,border:`1px solid ${C.border}`},
    ghost:{background:"transparent",color:C.accent,border:`1px solid ${C.accentB}`},
    danger:{background:C.redL,color:C.red,border:`1px solid ${C.redB}`},
  };
  const s = danger ? vs.danger : vs[v]||vs.primary;
  return <button onClick={onClick} style={{...base,...s}}
    onMouseEnter={e=>{if(v==="primary"&&!danger)e.currentTarget.style.background="#B84800";else if(v==="secondary")e.currentTarget.style.background=C.bg;else e.currentTarget.style.opacity="0.85";}}
    onMouseLeave={e=>{e.currentTarget.style.background=s.background;e.currentTarget.style.opacity="1";}}
  >{children}</button>;
};

const Field = ({label,children}) => <div>
  <label style={{fontSize:11,color:C.textSub,display:"block",marginBottom:4,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",lineHeight:"16px"}}>{label}</label>
  {children}
</div>;

const inputStyle = {width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:"20px"};
const Inp = ({label,value,onChange,type="text",placeholder,readOnly}) => <Field label={label}>
  <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
    style={{...inputStyle,background:readOnly?C.bg:C.surface,cursor:readOnly?"default":"text"}}
    onFocus={e=>{if(!readOnly){e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 3px ${C.accent}18`;}}}
    onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
  />
</Field>;

const Sel = ({label,value,onChange,options}) => <Field label={label}>
  <select value={value||""} onChange={onChange} style={{...inputStyle,appearance:"none",cursor:"pointer",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239299A6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
    {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}
  </select>
</Field>;

const TA = ({label,value,onChange,rows=3}) => <Field label={label}>
  <textarea value={value||""} onChange={onChange} rows={rows}
    style={{...inputStyle,resize:"vertical"}}
    onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 3px ${C.accent}18`;}}
    onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
  />
</Field>;

const Card = ({children,style={},onClick,onMouseEnter,onMouseLeave}) => {
  const isMobile = useMobile();
  return <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:isMobile?14:20,...style}}>{children}</div>;
};

const Stat = ({label,value,sub,color=C.accent,icon}) => {
  const isMobile = useMobile();
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:isMobile?"10px 10px":"16px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:color}}/>
      <div style={{marginBottom:isMobile?4:8}}>
        <span style={{fontSize:isMobile?9:11,color:C.textMuted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",lineHeight:"12px"}}>{label}</span>
      </div>
      <div className="stat-value" style={{fontSize:isMobile?14:22,fontWeight:700,color:C.text,letterSpacing:"-0.02em",lineHeight:1.2,minWidth:0}}>{value}</div>
      {sub&&<div style={{fontSize:isMobile?9:11,color:C.textMuted,marginTop:isMobile?2:4,lineHeight:"14px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</div>}
    </div>
  );
};

const PageHead = ({eyebrow,title,action}) => {
  const isMobile = useMobile();
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",paddingBottom:isMobile?12:16,borderBottom:`2px solid ${C.border}`,marginBottom:isMobile?16:24,flexDirection:isMobile?"column":"row",gap:isMobile?10:0}}>
      <div>
        {eyebrow&&<div style={{fontSize:10,color:C.textMuted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{eyebrow}</div>}
        <div style={{fontSize:isMobile?16:20,fontWeight:700,color:C.navy,letterSpacing:"-0.02em"}}>{title}</div>
      </div>
      {action&&<div style={{width:isMobile?"100%":"auto"}}>{action}</div>}
    </div>
  );
};

const TH = ({children,right}) => <th style={{padding:"10px 14px",textAlign:right?"right":"left",fontSize:10,color:C.textMuted,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",lineHeight:"14px"}}>{children}</th>;
const TD = ({children,right,bold,muted,color}) => <td style={{padding:"10px 14px",fontSize:13,textAlign:right?"right":"left",color:color||(muted?C.textSub:C.text),fontWeight:bold?600:400,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:"20px"}}>{children}</td>;

const Table = ({heads,children,empty}) => (
  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden"}}>
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
        <thead><tr style={{borderBottom:`2px solid ${C.border}`,background:C.bg}}>{heads.map((h,i)=><TH key={i} right={h.r}>{h.l}</TH>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
    {empty}
  </div>
);

const TR = ({children,onClick}) => <tr onClick={onClick} style={{borderBottom:`1px solid ${C.border}`,cursor:onClick?"pointer":"default"}}
  onMouseEnter={e=>e.currentTarget.style.background=C.bg}
  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
>{children}</tr>;

const Confirm = ({msg,onOk,onCancel}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(13,27,42,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Card style={{maxWidth:380,width:"90%",boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:8}}>Confirm Delete</div>
      <div style={{fontSize:13,color:C.textSub,marginBottom:24,lineHeight:1.6}}>{msg}</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn v="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn danger onClick={onOk}>Delete</Btn>
      </div>
    </Card>
  </div>
);

const Modal = ({title,onClose,children,width=640}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(13,27,42,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,borderRadius:6,width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
      <div style={{padding:"16px 20px",borderBottom:`2px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
        <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textSub,padding:4,display:"flex"}}><Ic d={I.x} s={18}/></button>
      </div>
      <div style={{padding:20}}>{children}</div>
    </div>
  </div>
);

const Grid = ({cols="1fr 1fr",gap=14,children,style={},mob=false}) => {
  const isMobile = useMobile();
  const tc = (isMobile||mob) ? "1fr" : cols;
  return <div style={{display:"grid",gridTemplateColumns:tc,gap,...style}}>{children}</div>;
};
const Span2 = ({children}) => {
  const isMobile = useMobile();
  return <div style={{gridColumn:isMobile?"span 1":"span 2"}}>{children}</div>;
};

const Progress = ({pct,color=C.accent,h=6}) => (
  <div style={{height:h,background:C.bg,borderRadius:3}}>
    <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,borderRadius:3,transition:"width 0.3s"}}/>
  </div>
);

const DeleteBtn = ({onClick}) => (
  <button onClick={onClick} title="Delete"
    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:4,padding:"4px 7px",cursor:"pointer",color:C.textMuted,display:"inline-flex",alignItems:"center"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}
  ><Ic d={I.trash} s={13}/></button>
);

const EditBtn = ({onClick}) => (
  <button onClick={onClick} title="Edit"
    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:4,padding:"4px 7px",cursor:"pointer",color:C.textSub,display:"inline-flex",alignItems:"center"}}
  ><Ic d={I.edit} s={13}/></button>
);

const EmptyState = ({msg,action}) => (
  <div style={{padding:"40px 20px",textAlign:"center"}}>
    <div style={{fontSize:13,color:C.textMuted,marginBottom:action?14:0,lineHeight:1.6}}>{msg}</div>
    {action}
  </div>
);

const Tabs = ({tabs,active,onChange}) => (
  <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginBottom:20,scrollbarWidth:"none"}}
    onScroll={e=>e.stopPropagation()}>
    <div style={{display:"flex",gap:0,borderBottom:`2px solid ${C.border}`,minWidth:"max-content"}}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)}
          style={{padding:"8px 16px",border:"none",borderBottom:active===t?`2px solid ${C.accent}`:"2px solid transparent",background:active===t?C.accentL:"none",color:active===t?C.accent:C.textSub,fontSize:12,fontWeight:active===t?600:500,cursor:"pointer",textTransform:"capitalize",marginBottom:-2,fontFamily:"inherit",whiteSpace:"nowrap",letterSpacing:"0.01em"}}>
          {t}
        </button>
      ))}
    </div>
  </div>
);

const InfoRow = ({label,value,color}) => (
  <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
    <span style={{color:C.textSub}}>{label}</span>
    <span style={{color:color||C.text,fontWeight:500}}>{value}</span>
  </div>
);

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
const GlobalSearch = ({projects,contacts,invoices,cos,estimates,rfis,onNav}) => {
  const [q,setQ] = useState("");
  const [open,setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = q.length < 2 ? [] : (() => {
    const ql = q.toLowerCase();
    const TYPE_ICON = {project:I.proj, contact:I.contacts, invoice:I.inv, "change order":I.co, estimate:I.est};
    return [
      ...projects.filter(p=>(p.name+p.client+p.address).toLowerCase().includes(ql))
        .slice(0,4).map(p=>({type:"project",label:p.name,sub:p.client,nav:["projects",p.id]})),
      ...contacts.filter(c=>(c.name+c.company+c.email).toLowerCase().includes(ql))
        .slice(0,3).map(c=>({type:"contact",label:c.name,sub:c.company||c.email,nav:["contacts"]})),
      ...invoices.filter(i=>(i.number+i.description).toLowerCase().includes(ql))
        .slice(0,3).map(i=>({type:"invoice",label:i.number,sub:i.description,nav:["invoices"]})),
      ...cos.filter(c=>(c.number+c.title).toLowerCase().includes(ql))
        .slice(0,2).map(c=>({type:"change order",label:`${c.number} – ${c.title}`,sub:"Change Order",nav:["cos"]})),
      ...estimates.filter(e=>e.name.toLowerCase().includes(ql))
        .slice(0,2).map(e=>({type:"estimate",label:e.name,sub:"Estimate",nav:["estimates"]})),
      ...(rfis||[]).filter(r=>(r.number+r.subject).toLowerCase().includes(ql))
        .slice(0,2).map(r=>({type:"rfi",label:`${r.number} – ${r.subject}`,sub:r.status,nav:["rfis"]})),
    ];
  })();

  const go = (nav) => { onNav(...nav); setQ(""); setOpen(false); };

  return (
    <div style={{position:"relative",margin:"0 4px 4px"}}>
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:9,pointerEvents:"none",color:"rgba(255,255,255,0.35)",display:"flex"}}><Ic d={I.search} s={13}/></div>
        <input ref={inputRef} className="global-search-input" value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)}
          onBlur={()=>setTimeout(()=>setOpen(false),200)} placeholder="Search... (⌘K)"
          style={{...inputStyle,paddingLeft:30,fontSize:11,background:"rgba(255,255,255,0.06)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",height:30,borderRadius:4}}/>
      </div>
      {open&&(results.length>0||(q.length>=2))&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,boxShadow:"0 8px 28px rgba(0,0,0,0.14)",zIndex:9999,overflow:"hidden"}}>
          {results.length===0&&<div style={{padding:"14px 12px",fontSize:12,color:C.textMuted,textAlign:"center"}}>No results for "{q}"</div>}
          {results.map((r,i)=>(
            <div key={`${r.type}-${r.label}-${i}`} onMouseDown={()=>go(r.nav)}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:i<results.length-1?`1px solid ${C.border}`:"none",display:"flex",alignItems:"center",gap:10}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{width:28,height:28,borderRadius:4,background:C.accentL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Ic d={Array.isArray({project:I.proj,contact:I.contacts,invoice:I.inv,"change order":I.co,estimate:I.est}[r.type])?{project:I.proj,contact:I.contacts,invoice:I.inv,"change order":I.co,estimate:I.est}[r.type][0]:{project:I.proj,contact:I.contacts,invoice:I.inv,"change order":I.co,estimate:I.est}[r.type]||I.search} s={13} stroke={C.accent}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                <div style={{fontSize:10,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.04em"}}>{r.type}{r.sub?` · ${r.sub.substring(0,22)}`:""}</div>
              </div>
            </div>
          ))}
          {results.length>0&&<div style={{padding:"6px 12px",fontSize:10,color:C.textMuted,background:C.bg,borderTop:`1px solid ${C.border}`}}>{results.length} result{results.length!==1?"s":""} — press Enter or click</div>}
        </div>
      )}
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({projects,invoices,cos,rfis,punchList,onNav}) => {
  const active = projects.filter(p=>p.status==="Active");
  const pipeline = projects.reduce((s,p)=>s+p.value,0);
  const overdue = invoices.filter(i=>i.status==="Overdue");
  const pendingInv = invoices.filter(i=>i.status==="Pending");
  const receivables = [...overdue,...pendingInv].reduce((s,i)=>s+i.amount,0);
  const pendingCOs = cos.filter(c=>c.status==="Pending");
  const totalPaid = invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0);
  const totalBilled = invoices.reduce((s,i)=>s+i.amount,0);
  const collectionRate = totalBilled>0?Math.round((totalPaid/totalBilled)*100):0;

  const openRFIs = (rfis||[]).filter(r=>r.status==="Open");
  const overdueRFIs = openRFIs.filter(r=>r.dateNeeded&&r.dateNeeded<today());
  const openPunch = (punchList||[]).filter(p=>p.status!=="Complete").length;

  // Projects nearing deadline (within 14 days)
  const todayStr = today();
  const nearingDeadline = active.filter(p=>p.end&&p.end>todayStr&&Math.ceil((new Date(p.end+"T12:00:00")-new Date(todayStr+"T12:00:00"))/86400000)<=14);

  const isMobile = useMobile();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:isMobile?14:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",paddingBottom:isMobile?12:16,borderBottom:`2px solid ${C.border}`,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:isMobile?16:20,fontWeight:800,color:C.navy,letterSpacing:"-0.02em",lineHeight:"28px"}}>Project Command Center</div>
          <div style={{fontSize:12,color:C.textSub,marginTop:2,fontWeight:500}}>{new Date().toLocaleDateString("en-US",{weekday:isMobile?"short":"long",year:"numeric",month:isMobile?"short":"long",day:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="secondary" sm={isMobile} onClick={()=>onNav("logs")}><Ic d={I.logs} s={14}/> {isMobile?"Log":"Field Log"}</Btn>
          <Btn sm={isMobile} onClick={()=>onNav("projects")}><Ic d={I.plus} s={14}/> {isMobile?"New":"New Project"}</Btn>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:isMobile?8:12}}>
        <Stat label="Active Jobs" value={active.length} sub={`${projects.length} total projects`} color={C.accent} icon="proj"/>
        <Stat label="Pipeline Value" value={fmt(pipeline)} sub={`${projects.filter(p=>p.status==="Lead"||p.status==="Estimate").length} in pre-sales`} color={C.green} icon="trend"/>
        <Stat label="Receivables" value={fmt(receivables)} sub={overdue.length>0?`${overdue.length} overdue`:"All current"} color={overdue.length>0?C.red:C.amber} icon="inv"/>
        <Stat label="Collection Rate" value={`${collectionRate}%`} sub={`${fmt(totalPaid)} collected`} color={collectionRate>=80?C.green:C.amber} icon="check"/>
      </div>

      {(nearingDeadline.length>0||pendingCOs.length>0)&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":nearingDeadline.length>0&&pendingCOs.length>0?"1fr 1fr":"1fr",gap:12}}>
          {nearingDeadline.length>0&&(
            <div style={{background:C.redL,border:`1px solid ${C.redB}`,borderRadius:4,padding:"10px 14px"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:6,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:"0.04em"}}><Ic d={I.alert} s={12} stroke={C.red}/> {nearingDeadline.length} project{nearingDeadline.length!==1?"s":""} due within 14 days</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {nearingDeadline.map(p=>{
                  const daysLeft=Math.ceil((new Date(p.end+"T12:00:00")-new Date(todayStr+"T12:00:00"))/86400000);
                  return <div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                    <span style={{color:C.text,fontWeight:500,cursor:"pointer"}} onClick={()=>onNav("projects",p.id)}>{p.name}</span>
                    <span style={{color:C.red,fontWeight:700,fontSize:11}}>{daysLeft}d left</span>
                  </div>;
                })}
              </div>
            </div>
          )}
          {pendingCOs.length>0&&(
            <div style={{background:C.amberL,border:`1px solid ${C.amberB}`,borderRadius:4,padding:"10px 14px"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.amber,marginBottom:6,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:"0.04em"}}><Ic d={I.alert} s={12} stroke={C.amber}/> {pendingCOs.length} change order{pendingCOs.length!==1?"s":""} awaiting approval</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {pendingCOs.slice(0,3).map(co=>{
                  const p=projects.find(x=>x.id===co.projectId);
                  return <div key={co.id} style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                    <span style={{color:C.text,fontWeight:500}}>{co.number} - {co.title.substring(0,24)}</span>
                    <span style={{color:C.amber,fontWeight:700,fontSize:11}}>+{fmt(co.amount)}</span>
                  </div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {(overdueRFIs.length>0||openPunch>0)&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":overdueRFIs.length>0&&openPunch>0?"1fr 1fr":"1fr",gap:12}}>
          {overdueRFIs.length>0&&(
            <div style={{background:C.redL,border:`1px solid ${C.redB}`,borderRadius:4,padding:"10px 14px",cursor:"pointer"}} onClick={()=>onNav("rfis")}>
              <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:6,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:"0.04em"}}><Ic d={I.rfi} s={12} stroke={C.red}/> {overdueRFIs.length} RFI{overdueRFIs.length!==1?"s":""} past response deadline</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {overdueRFIs.slice(0,3).map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{color:C.text,fontWeight:500}}>{r.number} - {r.subject.substring(0,28)}</span>
                  <span style={{color:C.red,fontWeight:700,fontSize:11}}>Overdue</span>
                </div>)}
              </div>
            </div>
          )}
          {openPunch>0&&(
            <div style={{background:C.blueL,border:`1px solid ${C.blueB}`,borderRadius:4,padding:"10px 14px",cursor:"pointer"}} onClick={()=>onNav("punch")}>
              <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:4,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:"0.04em"}}><Ic d={I.punch} s={12} stroke={C.blue}/> {openPunch} punch list item{openPunch!==1?"s":""} open</div>
              <div style={{fontSize:11,color:C.textSub}}>Click to view and resolve</div>
            </div>
          )}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 280px",gap:isMobile?14:16}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"0.04em"}}>Active Projects</div>
            <button onClick={()=>onNav("projects")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontWeight:600}}>View all</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {active.map(p=>{
              const pct = p.value?Math.round((p.spent/p.value)*100):0;
              return (
                <Card key={p.id} style={{padding:"12px 16px",cursor:"pointer"}} onClick={()=>onNav("projects",p.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:2,lineHeight:"18px"}}>{p.name}</div>
                      <div style={{fontSize:11,color:C.textSub}}>{p.client} · {p.phase}</div>
                    </div>
                    <Badge s={p.status}/>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:isMobile?"8px 12px":"4px 16px",marginBottom:8}}>
                    <div style={{minWidth:0}}><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Contract</div><div style={{fontSize:isMobile?12:13,fontWeight:700,color:C.navy,whiteSpace:"nowrap"}}>{fmt(p.value)}</div></div>
                    <div style={{minWidth:0}}><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Spent</div><div style={{fontSize:isMobile?12:13,fontWeight:600,color:C.text,whiteSpace:"nowrap"}}>{fmt(p.spent)}</div></div>
                    <div style={{minWidth:0}}><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Budget</div><div style={{fontSize:isMobile?12:13,fontWeight:600,color:pct>90?C.red:C.green}}>{pct}%</div></div>
                  </div>
                  <Progress pct={p.progress}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMuted,marginTop:5}}><span>Progress: {p.progress}%</span><span>{p.end}</span></div>
                </Card>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Unpaid Invoices</div>
            {[...overdue,...pendingInv].slice(0,5).map(inv=>{
              const p=projects.find(x=>x.id===inv.projectId);
              return (
                <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{inv.number}</div><div style={{fontSize:11,color:C.textSub,marginTop:1}}>{p?.name?.substring(0,18)}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,marginBottom:3}}>{fmt(inv.amount)}</div><Badge s={inv.status}/></div>
                </div>
              );
            })}
            {[...overdue,...pendingInv].length===0&&<div style={{fontSize:12,color:C.textMuted,padding:"8px 0"}}>All invoices current</div>}
          </Card>

          <Card style={{padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Pipeline</div>
            {["Lead","Estimate","Active","Complete"].map(s=>{
              const sc=STATUS_MAP[s]; const count=projects.filter(p=>p.status===s).length; const val=projects.filter(p=>p.status===s).reduce((a,p)=>a+p.value,0);
              return <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:5,height:5,borderRadius:"50%",background:sc?.text,display:"inline-block"}}/><span style={{fontSize:12,color:C.textMid,fontWeight:500}}>{s}</span><span style={{fontSize:10,color:C.textMuted,background:C.bg,padding:"1px 6px",borderRadius:3,fontWeight:600}}>{count}</span></div>
                <span style={{fontSize:12,fontWeight:600,color:C.text}}>{fmt(val)}</span>
              </div>;
            })}
          </Card>

          <Card style={{padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Quick Actions</div>
            {[
              {label:"New Invoice",icon:"inv",nav:"invoices",color:C.accent},
              {label:"Submit RFI",icon:"rfi",nav:"rfis",color:C.blue},
              {label:"Log Field Report",icon:"logs",nav:"logs",color:C.green},
              {label:"New Change Order",icon:"co",nav:"cos",color:C.amber},
              {label:"View Reports",icon:"report",nav:"reports",color:C.purple},
              {label:"View Schedule",icon:"sched",nav:"schedule",color:C.textSub},
            ].map(a=>(
              <button key={a.label} onClick={e=>{e.stopPropagation();onNav(a.nav);}}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",width:"100%",textAlign:"left",transition:"padding-left 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"}
                onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
                <div style={{width:24,height:24,borderRadius:4,background:a.color+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={I[a.icon]} s={12} stroke={a.color}/></div>
                <span style={{fontSize:12,color:C.textMid,fontWeight:500}}>{a.label}</span>
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── BUDGET (used inside project detail) ─────────────────────────────────────
const Budget = ({projectId,budgetItems,setBudgetItems,projects,setProjects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  const [codeSearch,setCodeSearch] = useState("");
  const [showCodePicker,setShowCodePicker] = useState(false);
  useUnsavedWarning(form !== null);
  const items = budgetItems.filter(b=>b.projectId===projectId);
  const tot = (k) => items.reduce((s,b)=>s+(parseFloat(b[k])||0),0);
  const totalB=tot("budgeted"), totalA=tot("actual"), totalC=tot("committed");

  const syncSpent = (newItems) => {
    const spent = newItems.filter(b=>b.projectId===projectId).reduce((s,b)=>s+(parseFloat(b.actual)||0),0);
    setProjects(ps=>ps.map(p=>p.id===projectId?{...p,spent}:p));
  };

  const save = () => {
    if(!form.category) return;
    const item = {...form,projectId,budgeted:parseFloat(form.budgeted)||0,actual:parseFloat(form.actual)||0,committed:parseFloat(form.committed)||0};
    let next;
    if(form.id) { next = budgetItems.map(b=>b.id===form.id?item:b); }
    else { next = [...budgetItems,{...item,id:uid(),_isNew:true}]; }
    setBudgetItems(next); syncSpent(next); setForm(null);
    toast.success(form.id?"Budget line updated":"Budget line added");
  };

  const del = () => { const next=budgetItems.filter(b=>b.id!==delId); setBudgetItems(next); syncSpent(next); setDelId(null); };
  const pct = totalB ? Math.round((totalA/totalB)*100) : 0;

  const filteredCodes = codeSearch
    ? BUDGET_CAT_FLAT.filter(c=>c.full.toLowerCase().includes(codeSearch.toLowerCase())||c.label.toLowerCase().includes(codeSearch.toLowerCase()))
    : BUDGET_CAT_FLAT;

  // Group items by division for display
  const grouped = BUDGET_CODES.map(d=>({...d,rows:items.filter(b=>b.division===d.label)})).filter(d=>d.rows.length>0);
  const ungrouped = items.filter(b=>!b.division);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this budget line item?" onOk={del} onCancel={()=>setDelId(null)}/>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <Stat label="Total Budgeted" value={fmt(totalB)} color={C.blue} icon="budget"/>
        <Stat label="Actual Spent" value={fmt(totalA)} sub={`${pct}% of budget`} color={totalA>totalB?C.red:C.green} icon="dollar"/>
        <Stat label="Committed" value={fmt(totalC)} color={C.amber} icon="est"/>
        <Stat label="Remaining" value={fmt(totalB-totalA)} color={totalB-totalA<0?C.red:C.purple} icon="dollar"/>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>Cost Breakdown</div>
        <Btn sm onClick={()=>{setForm({category:"",division:"",code:"",budgeted:"",actual:"",committed:"",notes:""});setShowCodePicker(true);setCodeSearch("");}}><Ic d={I.plus} s={13}/> Add Line Item</Btn>
      </div>

      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{form.id?"Edit":"Add"} Budget Line</div>

          {!form.id&&showCodePicker&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginBottom:6}}>Select Cost Code</div>
              <input
                value={codeSearch}
                onChange={e=>setCodeSearch(e.target.value)}
                placeholder="Search cost codes (e.g. 'roofing', 'electrical', '07')..."
                style={{width:"100%",padding:"8px 12px",borderRadius:4,border:`1px solid ${C.border}`,fontSize:13,fontFamily:"inherit",marginBottom:8,outline:"none"}}
              />
              <div style={{maxHeight:200,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:4,background:C.bg}}>
                {BUDGET_CODES.filter(d=>!codeSearch||d.label.toLowerCase().includes(codeSearch.toLowerCase())||d.items.some(i=>i.toLowerCase().includes(codeSearch.toLowerCase()))).map(d=>(
                  <div key={d.div}>
                    <div style={{padding:"6px 12px",fontSize:11,fontWeight:700,color:C.textSub,background:C.surface,borderBottom:`1px solid ${C.border}`,letterSpacing:"0.05em",textTransform:"uppercase"}}>{d.div} · {d.label}</div>
                    {d.items.filter(i=>!codeSearch||i.toLowerCase().includes(codeSearch.toLowerCase())||d.label.toLowerCase().includes(codeSearch.toLowerCase())).map(item=>(
                      <div key={item} onClick={()=>{setForm(f=>({...f,category:item,division:d.label,code:d.div}));setShowCodePicker(false);}}
                        style={{padding:"7px 16px",fontSize:12,color:C.textMid,cursor:"pointer",borderBottom:`1px solid ${C.border}`}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.accentL}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <button onClick={()=>setShowCodePicker(false)} style={{marginTop:6,fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer",padding:0}}>Enter manually instead</button>
            </div>
          )}

          <Grid cols="2fr 1fr 1fr 1fr" gap={12}>
            {form.category
              ? <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.textSub}}>Cost Category</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.accentL,borderRadius:4,border:`1px solid ${C.accentB}`}}>
                    {form.code&&<span style={{fontSize:10,fontWeight:700,color:C.accent,background:C.surface,padding:"1px 6px",borderRadius:4,flexShrink:0}}>{form.code}</span>}
                    <span style={{fontSize:13,fontWeight:600,color:C.text,flex:1}}>{form.category}</span>
                    {!form.id&&<button onClick={()=>setShowCodePicker(true)} style={{fontSize:10,color:C.accent,background:"none",border:"none",cursor:"pointer",padding:0,whiteSpace:"nowrap"}}>Change</button>}
                  </div>
                  {form.division&&<div style={{fontSize:10,color:C.textMuted}}>Division: {form.division}</div>}
                </div>
              : <Inp label="Cost Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g. Roofing"/>}
            <Inp label="Budgeted ($)" type="number" value={form.budgeted} onChange={e=>setForm({...form,budgeted:e.target.value})} placeholder="0"/>
            <Inp label="Actual ($)" type="number" value={form.actual} onChange={e=>setForm({...form,actual:e.target.value})} placeholder="0"/>
            <Inp label="Committed ($)" type="number" value={form.committed} onChange={e=>setForm({...form,committed:e.target.value})} placeholder="0"/>
            <div style={{gridColumn:"span 4"}}><Inp label="Notes (vendor, sub, PO#)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Subcontractor, vendor, notes..."/></div>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={save}>{form.id?"Save Changes":"Add Item"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {items.length===0&&form===null?(
        <Card><EmptyState msg="No budget items yet. Add cost categories to track your job costs." action={<Btn sm onClick={()=>{setForm({category:"",division:"",code:"",budgeted:"",actual:"",committed:"",notes:""});setShowCodePicker(true);setCodeSearch("");}}>+ Add First Item</Btn>}/></Card>
      ):(
        <Table heads={[{l:"Code"},{l:"Category"},{l:"Notes"},{l:"Budgeted",r:true},{l:"Actual",r:true},{l:"Committed",r:true},{l:"Variance",r:true},{l:"% Used",r:true},{l:""}]}>
          {items.map(b=>{
            const v=b.budgeted-b.actual; const p=b.budgeted?Math.round((b.actual/b.budgeted)*100):0;
            return <TR key={b.id}>
              <td style={{padding:"11px 14px"}}>{b.code?<span style={{fontSize:10,fontWeight:700,color:C.accent,background:C.accentL,padding:"2px 7px",borderRadius:4}}>{b.code}</span>:<span style={{color:C.textMuted,fontSize:11}}>—</span>}</td>
              <TD><div style={{fontWeight:600}}>{b.category}</div>{b.division&&<div style={{fontSize:10,color:C.textMuted}}>{b.division}</div>}</TD>
              <TD muted>{b.notes||"—"}</TD>
              <TD right>{fmt(b.budgeted)}</TD>
              <TD right bold>{fmt(b.actual)}</TD>
              <TD right muted>{fmt(b.committed)}</TD>
              <TD right color={v<0?C.red:C.green}>{v<0?"-":"+"}{fmt(Math.abs(v))}</TD>
              <td style={{padding:"12px 14px",minWidth:100}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:5,background:C.bg,borderRadius:3}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,background:p>100?C.red:p>80?C.amber:C.green,borderRadius:3}}/></div>
                  <span style={{fontSize:11,fontWeight:600,color:p>100?C.red:C.textMid,minWidth:32}}>{p}%</span>
                </div>
              </td>
              <td style={{padding:"12px 14px"}}><div style={{display:"flex",gap:6}}><EditBtn onClick={()=>setForm({...b})}/><DeleteBtn onClick={()=>setDelId(b.id)}/></div></td>
            </TR>;
          })}
          {items.length>0&&(
            <tr style={{background:C.accentL,borderTop:`2px solid ${C.accentB}`}}>
              <td colSpan={3} style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.accent}}>TOTALS</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right"}}>{fmt(totalB)}</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right",color:totalA>totalB?C.red:C.green}}>{fmt(totalA)}</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right",color:C.textMid}}>{fmt(totalC)}</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right",color:(totalB-totalA)<0?C.red:C.green}}>{(totalB-totalA)<0?"-":"+"}{fmt(Math.abs(totalB-totalA))}</td>
              <td colSpan={3}/>
            </tr>
          )}
        </Table>
      )}
    </div>
  );
};

// ─── ESTIMATES (used inside project detail) ───────────────────────────────────
// ─── ESTIMATE TEMPLATES ───────────────────────────────────────────────────────
const ESTIMATE_TEMPLATES = {
  "New Home Construction":{
    desc:"Single-family residential new build",
    hint:"Builder-grade: ~$75–100/sqft  ·  Custom: ~$125–175/sqft",
    defaultCpsf:85,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, and city fees",         pct:2, tasks:["Pull building permit","Submit plans for plan check","Pay city impact fees","Schedule inspections","Obtain utility connection permits"] },
      {category:"Demo",            description:"Site clearing and preparation",                        pct:2, tasks:["Clear trees and brush","Remove existing structures","Haul debris off-site","Grade rough pad","Install erosion control"] },
      {category:"Site Work",       description:"Excavation, grading, drainage, and utilities",         pct:3, tasks:["Excavate foundation trenches","Rough grade building pad","Install underground drainage","Trench for water/sewer/gas","Compact subgrade to spec","Install temporary power pole"] },
      {category:"Foundation",      description:"Concrete slab, footings, and stem walls",              pct:12, tasks:["Set batter boards and string lines","Dig and form footings","Place rebar and mesh","Pour footings","Form and pour stem walls","Install anchor bolts","Place vapor barrier","Pour slab on grade","Strip forms and backfill"] },
      {category:"Framing",         description:"Structural lumber, sheathing, and hardware",           pct:14, tasks:["Deliver lumber package","Frame first-floor walls","Set floor trusses/joists (if 2-story)","Frame second-floor walls","Set roof trusses","Install ridge beam/rafters","Sheath walls with OSB/plywood","Sheath roof deck","Install hurricane ties and hardware","Frame interior partition walls","Install window and door bucks","Frame soffits and overhangs"] },
      {category:"Roofing",         description:"Roof system, underlayment, and gutters",               pct:5, tasks:["Install ice/water shield at eaves","Roll out synthetic underlayment","Install drip edge and flashing","Lay shingles or metal panels","Flash chimneys, vents, and valleys","Install ridge vent","Hang gutters and downspouts"] },
      {category:"Windows & Doors", description:"Windows, exterior doors, and weatherstripping",        pct:4, tasks:["Deliver windows and doors","Set and flash exterior windows","Install front entry door","Install sliding/French patio doors","Install garage service door","Apply weatherstripping and sealant","Install window sills/trim bucks"] },
      {category:"Plumbing",        description:"Rough and finish plumbing",                            pct:8, tasks:["Underground sewer and water rough-in","Run supply lines (PEX/copper)","Run DWV waste and vent piping","Install tub/shower valves","Set water heater","Install hose bibs","Stub out for fixtures","Finish-set kitchen faucet and disposal","Finish-set bathroom faucets and fixtures","Install toilets","Connect dishwasher and ice maker","Pressure test and inspect"] },
      {category:"Electrical",      description:"Rough and finish electrical, panel",                   pct:7, tasks:["Set main panel and meter base","Run branch circuits per plan","Install boxes for outlets and switches","Pull wire for lighting circuits","Rough-in for ceiling fans","Install low-voltage wiring (data, TV, alarm)","Install recessed can housings","Finish-set switches and outlets","Finish-set light fixtures","Install panel cover and label breakers","Final inspection and energize"] },
      {category:"HVAC",            description:"Mechanical systems, ductwork, and equipment",          pct:7, tasks:["Size and engineer duct layout","Set furnace/air handler","Set condenser unit on pad","Run main trunk duct lines","Run branch ducts to each room","Install duct boots and registers","Install thermostat wiring","Install exhaust fans (bath/kitchen)","Charge refrigerant and test","Balance airflow across zones"] },
      {category:"Insulation",      description:"Wall, ceiling, and floor insulation",                  pct:3, tasks:["Install batt insulation in exterior walls","Blow-in attic/ceiling insulation","Insulate band joists","Insulate around tubs and fireplaces","Install vapor retarder where required","Insulate garage/house common wall","Inspection sign-off"] },
      {category:"Drywall",         description:"Hang, tape, texture, and finish",                      pct:5, tasks:["Hang drywall on ceilings","Hang drywall on walls","Tape and first coat (mud)","Second coat","Third coat and skim","Sand smooth","Apply texture (knock-down, orange peel, or smooth)","Patch nail pops and touch-up"] },
      {category:"Flooring",        description:"Flooring materials and installation",                  pct:7, tasks:["Prep subfloor (level, screed)","Install hardwood in living areas","Install LVP/laminate in bedrooms","Install carpet and pad","Install tile in wet areas (see Tile phase)","Install transition strips","Install shoe molding/quarter round"] },
      {category:"Cabinets",        description:"Kitchen and bath cabinetry",                           pct:5, tasks:["Deliver cabinets to job site","Set kitchen base cabinets and level","Set kitchen wall cabinets","Install pantry/utility cabinets","Set bathroom vanity cabinets","Install cabinet hardware (knobs/pulls)","Install under-cabinet lighting rough-in"] },
      {category:"Countertops",     description:"Kitchen and bath countertops",                         pct:3, tasks:["Template countertops after cabinet set","Fabricate countertops","Install kitchen countertops","Install bath vanity tops","Cut and polish sink openings","Apply backsplash caulk and sealant"] },
      {category:"Tile",            description:"Tile work for bathrooms and kitchen",                  pct:2, tasks:["Install cement board/Kerdi in showers","Waterproof shower pan and curb","Set wall tile in showers","Set floor tile in bathrooms","Install kitchen backsplash tile","Grout and seal all tile","Install tile trim and edge pieces"] },
      {category:"Painting",        description:"Interior and exterior paint",                          pct:4, tasks:["Prime all drywall surfaces","Caulk trim-to-wall joints","Paint ceilings","Paint walls — first coat","Paint walls — second coat","Paint interior trim and doors","Stain and seal any wood features","Paint exterior siding","Paint exterior trim and fascia","Touch-up after final trades"] },
      {category:"Exterior",        description:"Siding, trim, and exterior finishes",                  pct:4, tasks:["Install house wrap/WRB","Install siding (lap, board & batten, etc.)","Install exterior trim boards","Install fascia and soffit","Install stone/brick veneer (if applicable)","Caulk and seal all penetrations","Install exterior light fixtures","Install house numbers and mailbox"] },
      {category:"Landscaping",     description:"Final grade, sod, and landscaping",                    pct:2, tasks:["Fine grade yard","Install irrigation system","Lay sod or hydroseed","Plant trees and shrubs","Install mulch beds","Build walkways and patios","Install driveway (concrete or asphalt)","Final cleanup and punch items"] },
      {category:"GC Overhead",     description:"General conditions and project management",            pct:1, tasks:["Project scheduling and coordination","Weekly site meetings","Temporary utilities and port-a-john","Dumpster and waste management","Final clean and detail","Punch list walk-through","Certificate of occupancy"] },
    ]
  },
  "Apartment Construction":{
    desc:"Multi-family residential new build",
    hint:"Market-rate: ~$110–145/sqft  ·  Luxury: ~$160–220/sqft",
    defaultCpsf:130,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, and impact fees",       pct:4, tasks:["Pull building permit","Submit plans for plan check","Pay impact and connection fees","Obtain fire marshal approval","Post permit on site"] },
      {category:"Demo",            description:"Site demolition and preparation",                      pct:2, tasks:["Demolish existing structures","Clear and grub site","Environmental testing (Phase I/II)","Haul off debris","Install perimeter fencing and erosion control"] },
      {category:"Site Work",       description:"Excavation, grading, and site utilities",              pct:4, tasks:["Mass grading and compaction","Trench for underground utilities","Install storm drain system","Install water and sewer mains","Install fire water line","Grade building pad to elevation","Install temp construction road"] },
      {category:"Foundation",      description:"Concrete slab, mat foundation, or podium deck",        pct:10, tasks:["Excavate footings and grade beams","Form and place rebar cages","Pour spread footings","Form and pour grade beams","Install post-tension cables (if applicable)","Pour podium deck or mat slab","Waterproof below-grade walls","Backfill and compact"] },
      {category:"Framing",         description:"Structural framing, sheathing, and hardware",          pct:13, tasks:["Deliver lumber and trusses","Frame first-floor unit walls","Set floor trusses between levels","Frame upper-floor unit walls","Frame corridor and stairwell walls","Set roof trusses","Sheath exterior walls","Sheath roof deck","Install fire blocking per code","Frame balcony and breezeway structures"] },
      {category:"Roofing",         description:"Roof membrane, insulation, and drainage",              pct:4, tasks:["Install roof insulation board","Lay TPO/EPDM membrane","Flash all penetrations and curbs","Install roof drains and overflow","Install cap flashing at parapets","Install ridge vents or turbine vents","Hang gutters and downspouts"] },
      {category:"Windows & Doors", description:"Windows, unit entry doors, and corridors",             pct:3, tasks:["Install unit windows and flash","Install unit entry doors and hardware","Install corridor fire doors","Install sliding glass/patio doors","Install storefront entry system","Apply weatherstripping and seals"] },
      {category:"Plumbing",        description:"Rough and finish plumbing (multi-unit)",               pct:9, tasks:["Install main water risers per building","Run unit supply lines (PEX manifold)","Run DWV stacks and branch lines","Install tub/shower valves per unit","Set water heaters (central or per unit)","Rough-in laundry connections","Finish-set kitchen fixtures per unit","Finish-set bath fixtures per unit","Install toilets per unit","Test and inspect all systems"] },
      {category:"Electrical",      description:"Rough and finish electrical, meters, panels",          pct:8, tasks:["Set main switchgear","Install individual unit meter bank","Set unit sub-panels","Run branch circuits per unit","Install lighting circuit wiring","Install low-voltage (cable, data)","Rough-in for smoke/CO detectors","Finish-set outlets and switches","Finish-set light fixtures","Install common area lighting","Label panels and final inspection"] },
      {category:"HVAC",            description:"Mechanical systems per unit and common areas",         pct:7, tasks:["Set rooftop units or split systems","Run ductwork main trunks","Run branch ducts per unit","Install registers and returns","Install bath exhaust fans per unit","Install kitchen range hood venting","Install corridor ventilation/pressurization","Set thermostats per unit","Charge and test systems","Balance airflow per unit"] },
      {category:"Insulation",      description:"Insulation and sound attenuation between units",       pct:3, tasks:["Install batt insulation in exterior walls","Install sound attenuation batts at party walls","Install sound mat at floor/ceiling assemblies","Blow-in attic insulation","Insulate water pipes in unconditioned spaces","Inspection sign-off"] },
      {category:"Drywall",         description:"Hang, tape, and finish (units and corridors)",         pct:6, tasks:["Hang drywall in units — ceilings","Hang drywall in units — walls","Hang drywall in corridors and common areas","Tape and first coat","Second and third coat","Sand smooth","Apply texture","Touch-up and patch"] },
      {category:"Flooring",        description:"Unit flooring and common area finishes",               pct:5, tasks:["Prep subfloors in all units","Install LVP in unit living areas","Install carpet in bedrooms","Install tile in unit bathrooms","Install common area flooring (tile/polished concrete)","Install transition strips","Install base molding"] },
      {category:"Cabinets",        description:"Kitchen and bath cabinetry per unit",                  pct:4, tasks:["Deliver and stage cabinets","Install kitchen base cabinets per unit","Install kitchen wall cabinets per unit","Install bath vanity cabinets per unit","Install cabinet hardware","Install shelf and closet systems"] },
      {category:"Countertops",     description:"Kitchen and bath countertops",                         pct:2, tasks:["Template after cabinet install","Fabricate countertops","Install kitchen countertops per unit","Install bath vanity tops per unit","Cut sink openings and polish","Seal and caulk"] },
      {category:"Tile",            description:"Bath and kitchen tile per unit",                       pct:3, tasks:["Install backer board in wet areas","Waterproof shower pans and tub surrounds","Set shower wall tile","Set bathroom floor tile","Set kitchen backsplash","Grout and seal","Install edge trim"] },
      {category:"Painting",        description:"Interior and exterior paint",                          pct:4, tasks:["Prime all drywall","Caulk trim joints","Paint ceilings — all units","Paint walls — all units","Paint trim and doors — all units","Paint common areas and corridors","Paint exterior surfaces","Touch-up after punch list"] },
      {category:"Exterior",        description:"Siding, stucco, and exterior envelope",                pct:5, tasks:["Install WRB/house wrap","Install siding or stucco system","Install exterior trim and reveals","Install soffit and fascia","Apply exterior caulk and sealant","Install balcony railings","Install exterior lighting","Install unit address signage"] },
      {category:"GC Overhead",     description:"Common areas, amenities, and GC management",           pct:4, tasks:["Project management and scheduling","Weekly OAC meetings","Temp utilities, fencing, port-a-johns","Dumpsters and waste hauling","Build-out amenity spaces (gym, lounge)","Install mailbox cluster units","Final clean — all units and common areas","Punch list and CO inspections"] },
    ]
  },
  "Tenant Improvements (TI)":{
    desc:"Commercial interior build-out",
    hint:"Basic: ~$40–65/sqft  ·  Mid-grade: ~$70–120/sqft  ·  High-end: ~$130+/sqft",
    defaultCpsf:75,
    phases:[
      {category:"Demo",            description:"Demolition of existing interior finishes",             pct:7, tasks:["Remove existing ceiling grid and tile","Demo existing partition walls","Remove old flooring","Demo existing restroom fixtures","Haul debris to dumpster","Cap existing plumbing and electrical"] },
      {category:"Foundation",      description:"Structural patching and concrete work",                pct:4, tasks:["Patch slab penetrations","Level uneven concrete areas","Core drill for new plumbing","Pour equipment pads","Repair cracks and spalls"] },
      {category:"Site Work",       description:"Concrete flooring prep, leveling, and patching",       pct:3, tasks:["Grind high spots","Apply self-leveling compound","Prep for new flooring adhesion","Seal concrete where exposed","Patch trenched areas"] },
      {category:"Framing",         description:"Metal stud framing and blocking",                      pct:10, tasks:["Layout new walls per plan","Frame metal stud partitions","Install door frames and headers","Add blocking for wall-mount items","Frame soffits and bulkheads","Frame server/IT room walls"] },
      {category:"Plumbing",        description:"Rough and finish plumbing",                            pct:7, tasks:["Rough-in new restroom supply and waste","Rough-in break room sink","Install water heater","Set restroom fixtures (toilets, sinks)","Install break room faucet","Connect to building main","Test and inspect"] },
      {category:"Electrical",      description:"Rough and finish electrical, panels, lighting",        pct:12, tasks:["Set new sub-panel from building main","Run conduit and branch circuits","Install outlet boxes per plan","Pull wire and make terminations","Install data/low-voltage conduit","Install recessed lighting layout","Install emergency/exit lighting","Set switches, dimmers, and outlets","Set light fixtures","Install panel schedule and labels","Final electrical inspection"] },
      {category:"HVAC",            description:"Mechanical, ductwork, VAV boxes, and controls",        pct:12, tasks:["Review and modify existing duct layout","Install new VAV boxes","Extend ductwork to new rooms","Install flex duct and registers","Install return air grilles","Connect to building BAS/controls","Install thermostat per zone","Install restroom exhaust fans","Test and balance airflow","Commission HVAC controls"] },
      {category:"Insulation",      description:"Insulation and acoustical treatments",                 pct:3, tasks:["Install sound batt in partition walls","Insulate above ceiling in server room","Install acoustical blankets where needed","Seal penetrations for sound","Inspection sign-off"] },
      {category:"Drywall",         description:"Hang, tape, texture, and finish",                      pct:10, tasks:["Hang drywall on new walls","Hang drywall on ceilings (if hard-lid)","Tape and first coat","Second and finish coat","Sand smooth","Apply texture to match existing","Patch and repair existing walls"] },
      {category:"Flooring",        description:"Flooring materials and installation",                  pct:8, tasks:["Install carpet tile in offices","Install LVT in common areas","Install tile in restrooms","Install transition strips","Install rubber base or wood base","Polish/seal exposed concrete (if applicable)"] },
      {category:"Cabinets",        description:"Ceiling grid, tile, and specialty ceilings",           pct:5, tasks:["Install new ceiling grid system","Lay ceiling tile","Install specialty/cloud ceilings","Frame and finish drywall soffits at perimeter","Install access panels for above-ceiling access"] },
      {category:"Windows & Doors", description:"Interior doors, frames, and hardware",                 pct:4, tasks:["Install hollow metal door frames","Hang solid core doors","Install glass sidelites/borrowed lights","Install door hardware (levers, closers)","Install barn door or sliding door hardware","Install ADA-compliant hardware"] },
      {category:"Painting",        description:"Interior paint and wall coverings",                    pct:6, tasks:["Prime all new drywall","Paint walls — two coats","Paint accent walls","Paint doors and frames","Install wall coverings/wallpaper","Touch-up after move-in"] },
      {category:"Countertops",     description:"Millwork, casework, and built-ins",                    pct:4, tasks:["Install break room countertop and cabinets","Install reception desk millwork","Build out conference room credenza","Install custom shelving and storage","Apply laminate or solid surface tops"] },
      {category:"Permits & Fees",  description:"Building permits and city fees",                       pct:3, tasks:["Submit plans to city","Pull building permit","Schedule inspections","Coordinate fire marshal review","Obtain final sign-off"] },
      {category:"GC Overhead",     description:"General conditions and project management",            pct:2, tasks:["Project scheduling","Coordinate with building management","Temp protection of common areas","Dumpster and waste removal","Final clean","Punch list walk-through"] },
    ]
  },
  "Custom Home (High-End Residential)":{
    desc:"Luxury single-family custom home — architect-designed",
    hint:"Custom: ~$150–225/sqft  ·  Ultra-luxury: ~$250–400+/sqft",
    defaultCpsf:175,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, HOA review, and impact fees",          pct:2, tasks:["Submit architectural plans for review","Pull building permit","HOA/design review approval","Pay impact and school fees","Schedule all required inspections"] },
      {category:"Demo",            description:"Existing structure demo, tree removal, and site clearing",            pct:1, tasks:["Demolish existing structure (if any)","Remove protected trees with permit","Clear brush and debris","Haul-off demo waste","Install tree protection fencing"] },
      {category:"Site Work",       description:"Excavation, grading, retaining walls, and utility trenching",         pct:4, tasks:["Survey and stake property","Mass excavation and cut/fill","Build retaining walls","Trench for utilities (water, sewer, gas, electric)","Install French drains and site drainage","Compact subgrade to engineer spec","Install temporary construction access"] },
      {category:"Foundation",      description:"Engineered footings, stem walls, post-tension slab or basement",      pct:10, tasks:["Excavate per engineered plans","Form engineered footings","Place rebar per structural drawings","Pour footings and grade beams","Form and pour stem walls","Install post-tension cables and stress","Waterproof basement walls (if applicable)","Install drain tile system","Pour garage and main slabs","Backfill and compact around foundation"] },
      {category:"Framing",         description:"Engineered lumber, steel beams, complex roof framing, sheathing",     pct:12, tasks:["Set structural steel beams and columns","Frame first-floor walls with engineered lumber","Set engineered floor joists/trusses","Frame second-floor walls","Frame complex roof system (hips, valleys, dormers)","Install ridge beams and rafters","Sheath walls and roof deck","Frame custom soffits, trays, and arches","Install hurricane ties and hold-downs","Frame outdoor living structures (covered patio, pergola)"] },
      {category:"Roofing",         description:"Standing seam metal, clay tile, or slate roof system with flashing",  pct:5, tasks:["Install peel-and-stick underlayment at valleys/eaves","Roll out synthetic underlayment","Install standing seam metal or clay tile","Flash all valleys, hips, and ridges","Flash chimneys with custom crickets","Install skylight curbs and flash","Install copper or custom gutters and downspouts","Install snow guards (if applicable)"] },
      {category:"Windows & Doors", description:"Custom windows, folding/sliding glass walls, entry doors",            pct:6, tasks:["Set custom-order windows","Install folding/bi-fold glass wall systems","Install sliding glass pocket doors","Set custom front entry door","Install interior barn doors and specialty doors","Flash and seal all window openings","Install motorized window treatments rough-in"] },
      {category:"Plumbing",        description:"Rough and finish plumbing, radiant heat, multi-zone manifolds",       pct:7, tasks:["Install underground plumbing rough-in","Run PEX manifold supply system","Run DWV waste and vent stacks","Install radiant floor heat tubing","Install multi-zone manifold system","Set tankless water heaters","Rough-in steam shower and body sprays","Finish-set designer fixtures (kitchen)","Finish-set designer fixtures (master bath)","Finish-set fixtures in secondary baths","Install outdoor kitchen plumbing","Pressure test and inspect"] },
      {category:"Electrical",      description:"Rough/finish electrical, smart home wiring, low-voltage, lighting control", pct:7, tasks:["Set 400A main panel","Run branch circuits per plan","Install smart home backbone wiring","Run Cat6/fiber for network","Run speaker wire for whole-house audio","Install motorized shade wiring","Install security camera conduit","Install lighting control system (Lutron/Savant)","Set designer switches and outlets","Set decorative light fixtures","Install landscape lighting transformer","Commission smart home system"] },
      {category:"HVAC",            description:"Multi-zone HVAC, ERV, zoned ductwork, whole-house controls",          pct:6, tasks:["Install multi-zone air handlers","Set high-efficiency condensers","Run insulated ductwork per zone","Install ERV/HRV for fresh air","Install zoned dampers and controls","Install designer registers and grilles","Wire and mount smart thermostats per zone","Install wine room cooling unit","Install garage exhaust system","Charge, test, and commission","Balance airflow across all zones"] },
      {category:"Insulation",      description:"Spray foam, continuous exterior insulation, sound attenuation",        pct:3, tasks:["Spray closed-cell foam on exterior walls","Spray open-cell foam in attic/roof deck","Install continuous rigid insulation on exterior","Install sound attenuation batts at bedrooms","Insulate media room for soundproofing","Seal all penetrations with foam","Third-party HERS testing and inspection"] },
      {category:"Drywall",         description:"Hang, tape, Level 5 finish, arches and soffits",                      pct:4, tasks:["Hang drywall on ceilings (Level 5 areas)","Hang drywall on walls","Tape and coat — three passes minimum","Skim coat for Level 5 finish","Form radius arches and custom soffits","Sand and prep for paint","Touch-up and final inspection"] },
      {category:"Flooring",        description:"Hardwood, natural stone, heated floors, custom patterns",             pct:8, tasks:["Install electric floor heat mats","Sand and prep subfloors","Install wide-plank hardwood","Install natural stone (marble, travertine)","Install custom inlay patterns or borders","Install carpet in bedrooms/closets","Install heated floor tile in bathrooms","Apply finish coats to hardwood","Install custom thresholds and transitions"] },
      {category:"Cabinets",        description:"Custom cabinetry, butler's pantry, built-in closet systems",          pct:7, tasks:["Deliver and stage custom cabinetry","Install kitchen cabinets (base and wall)","Install kitchen island cabinetry","Install butler's pantry cabinets","Install master closet built-in system","Install library/office built-ins","Install laundry room cabinets","Install bath vanity cabinets","Install designer hardware","Install under-cabinet lighting"] },
      {category:"Countertops",     description:"Natural stone slab, quartzite, waterfall edges, outdoor kitchen tops", pct:4, tasks:["Template all countertop surfaces","Fabricate stone slabs","Install kitchen countertops with waterfall edges","Install island countertop","Install butler's pantry counter","Install bath vanity stone tops","Install outdoor kitchen countertop","Polish edges and cutouts","Seal natural stone"] },
      {category:"Tile",            description:"Custom tile, stone showers, feature walls, heated floor tile",         pct:4, tasks:["Install Kerdi/Schluter waterproofing system","Build custom shower benches and niches","Install steam shower membrane","Set master shower stone/tile walls","Set master shower floor (pebble, mosaic)","Install feature wall tile (fireplace, entry)","Set floor tile over heated mats","Set secondary bath tile","Grout, seal, and polish all tile work"] },
      {category:"Painting",        description:"Premium interior/exterior paint, specialty finishes, staining",        pct:3, tasks:["Prime all surfaces","Caulk all trim joints","Paint ceilings — two coats","Paint walls — two coats premium paint","Apply specialty finishes (Venetian plaster, limewash)","Paint/stain all trim, casing, and crown","Stain and seal wood beams","Paint exterior body and trim","Stain exterior wood elements","Final touch-up after all trades"] },
      {category:"Exterior",        description:"Stone/stucco veneer, custom trim, architectural details",             pct:4, tasks:["Install stone veneer on facade","Apply stucco system (3-coat or EIFS)","Install custom exterior trim and moldings","Install copper flashings and details","Install decorative brackets and corbels","Install exterior columns and capitals","Apply masonry sealant","Install address monument/pillar"] },
      {category:"Landscaping",     description:"Hardscape, irrigation, lighting, pool/spa rough-in, final grade",     pct:2, tasks:["Fine grade all yard areas","Install irrigation system","Install landscape lighting","Pour pool shell and equipment pad (if applicable)","Build outdoor kitchen and fireplace","Pour driveway and walkways","Install pavers or flagstone patios","Plant trees, shrubs, and sod","Install mulch beds","Final site cleanup"] },
      {category:"GC Overhead",     description:"Project management, supervision, general conditions, and cleanup",    pct:1, tasks:["Full-time project superintendent","Weekly architect/owner meetings","Temporary utilities and facilities","Dumpsters and waste management","Construction cleaning — progressive","Punch list and final walk-through","Certificate of occupancy","Warranty binder and close-out docs"] },
    ]
  },
  "Residential Rehab / Renovation":{
    desc:"Full gut renovation — structural, MEP, and finish replacement",
    hint:"Moderate: ~$60–90/sqft  ·  Full gut: ~$90–150/sqft  ·  Historic: ~$150+/sqft",
    defaultCpsf:95,
    phases:[
      {category:"Permits & Fees",  description:"Permits, plan review, historic review (if applicable)",              pct:3, tasks:["Submit renovation plans","Pull building permit","Historic preservation review (if applicable)","Schedule inspections","Obtain lead/asbestos clearance permits"] },
      {category:"Demo",            description:"Selective demo, hazmat abatement (lead/asbestos), debris haul-off",   pct:10, tasks:["Test for lead paint and asbestos","Abate hazardous materials","Selective demo of walls and ceilings","Remove old kitchen and bath fixtures","Remove old flooring","Strip old wiring and plumbing (as needed)","Haul debris to dumpster","Clearance testing after abatement"] },
      {category:"Site Work",       description:"Temp shoring, underpinning, site protection, dumpster staging",       pct:3, tasks:["Install temporary shoring","Set up dumpster and staging area","Protect floors and features to remain","Install dust barriers between work zones","Set up temporary egress and safety"] },
      {category:"Foundation",      description:"Foundation repair, crack injection, slab leveling, new footings",     pct:7, tasks:["Inspect and document existing foundation","Inject epoxy into foundation cracks","Install helical piers or push piers","Level slab with mudjacking or poly foam","Pour new footings for additions","Waterproof basement walls","Install new sump pump"] },
      {category:"Framing",         description:"Structural repair, sistered joists, header upgrades, new walls",      pct:10, tasks:["Sister damaged floor joists","Install new LVL headers at removed walls","Add structural posts and beams","Frame new partition walls","Frame new window and door openings","Reinforce stairway structure","Install blocking for cabinets and fixtures","Sheath any new exterior walls"] },
      {category:"Roofing",         description:"Roof tear-off, re-deck, new underlayment and shingles/membrane",      pct:5, tasks:["Tear off existing roofing","Inspect and repair roof deck","Replace damaged sheathing","Install ice and water shield","Install synthetic underlayment","Lay new shingles or metal roofing","Re-flash chimneys, vents, and walls","Install new gutters and downspouts"] },
      {category:"Windows & Doors", description:"Window replacement, door upgrades, weatherstripping, egress windows", pct:5, tasks:["Remove old windows","Install new energy-efficient windows","Flash and seal window openings","Install new exterior doors","Install egress windows in bedrooms","Install new interior doors","Apply weatherstripping throughout"] },
      {category:"Plumbing",        description:"Re-pipe supply and waste, fixture rough-in, water heater",            pct:9, tasks:["Re-pipe supply lines (PEX or copper)","Replace cast-iron waste with PVC","Rough-in new fixture locations","Install new water heater","Install new hose bibs","Rough-in for washing machine","Finish-set all fixtures (kitchen, bath)","Install toilets","Test and inspect"] },
      {category:"Electrical",      description:"Panel upgrade, full rewire, new circuits, fixture rough-in",          pct:9, tasks:["Upgrade electrical panel (100A to 200A)","Run new branch circuits throughout","Install GFCI/AFCI breakers per code","Wire new outlet and switch locations","Install recessed lighting rough-in","Run low-voltage wiring (data, cable)","Install smoke and CO detectors","Finish-set outlets, switches, fixtures","Final inspection and energize"] },
      {category:"HVAC",            description:"New ductwork or mini-splits, equipment replacement, ventilation",     pct:7, tasks:["Remove old equipment","Install new furnace or air handler","Install new condenser","Run new ductwork (or install mini-splits)","Install registers and returns","Install bath exhaust fans","Install range hood ducting","Set thermostat","Charge, test, and balance"] },
      {category:"Insulation",      description:"Wall cavity insulation, attic blow-in, vapor barrier",                pct:3, tasks:["Insulate opened wall cavities","Blow-in attic insulation","Install vapor barrier in crawlspace","Insulate rim joists","Seal air leaks at penetrations","Inspection sign-off"] },
      {category:"Drywall",         description:"Hang, tape, texture, patching existing plaster where retained",       pct:6, tasks:["Hang new drywall on framed walls/ceilings","Patch existing plaster where retained","Tape and coat — three passes","Sand smooth","Apply texture to match existing","Repair and skim damaged plaster"] },
      {category:"Flooring",        description:"Subfloor repair, hardwood refinish or new install, tile, LVP",        pct:6, tasks:["Repair and level subfloor","Sand and refinish existing hardwood","Install new hardwood where needed","Install LVP in secondary areas","Install tile in bathrooms","Install carpet in bedrooms","Install transitions and base molding"] },
      {category:"Cabinets",        description:"Kitchen and bath cabinetry, pantry, vanities",                        pct:5, tasks:["Install kitchen base and wall cabinets","Install kitchen island","Install pantry cabinetry","Install bathroom vanity cabinets","Install cabinet hardware","Install closet shelving systems"] },
      {category:"Countertops",     description:"Kitchen and bath countertops, backsplash prep",                       pct:3, tasks:["Template countertops","Fabricate and install kitchen counters","Install bathroom vanity tops","Cut and polish sink openings","Prep backsplash area for tile"] },
      {category:"Tile",            description:"Bath tile, kitchen backsplash, shower surrounds, floor tile",          pct:3, tasks:["Install backer board in wet areas","Waterproof shower/tub areas","Set shower wall and floor tile","Set bathroom floor tile","Install kitchen backsplash","Grout and seal all tile"] },
      {category:"Painting",        description:"Full interior/exterior repaint, trim, stain, and caulking",           pct:3, tasks:["Prime all new and patched surfaces","Caulk all trim joints","Paint ceilings","Paint walls — two coats","Paint all trim, casing, and doors","Stain and seal wood features","Paint exterior","Touch-up after all trades complete"] },
      {category:"GC Overhead",     description:"Project management, supervision, temp utilities, and protection",     pct:3, tasks:["Project scheduling and coordination","Temporary utilities and protection","Dumpster and debris management","Progressive cleaning","Punch list walk-through","Final clean and handover","Warranty documentation"] },
    ]
  },
  "Ground-Up Commercial (Core & Shell)":{
    desc:"New commercial building — core, shell, and site improvements",
    hint:"Tilt-up/masonry: ~$85–130/sqft  ·  Steel frame: ~$120–175/sqft  ·  High-rise: ~$200+/sqft",
    defaultCpsf:110,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, zoning review, impact fees",            pct:3, tasks:["Submit plans for plan check","Pull building permit","Obtain zoning/entitlement approval","Pay impact fees","Coordinate fire marshal review","Post permit on site"] },
      {category:"Demo",            description:"Existing structure demo, environmental remediation, clearing",         pct:2, tasks:["Demolish existing structures","Conduct environmental remediation","Clear and grub site","Haul off debris","Install perimeter fencing"] },
      {category:"Site Work",       description:"Mass grading, underground utilities, stormwater management",           pct:8, tasks:["Mass grading and earthwork","Install storm drain system","Install sanitary sewer main","Install water main and fire line","Install underground electrical conduit","Build detention/retention basin","Compact subgrade to spec","Install erosion control BMPs"] },
      {category:"Foundation",      description:"Spread footings, grade beams, mat slab, or caissons/piles",           pct:10, tasks:["Drive piles or drill caissons (if required)","Excavate for spread footings","Form and place rebar","Pour footings and pile caps","Form and pour grade beams","Pour slab on grade","Install anchor bolts for steel","Waterproof below-grade elements","Backfill and compact"] },
      {category:"Framing",         description:"Structural steel erection, metal decking, concrete topping slab",     pct:14, tasks:["Deliver structural steel","Erect steel columns and beams","Install steel bracing and connections","Lay metal decking","Install headed studs for composite action","Place rebar on deck","Pour concrete topping slab","Install miscellaneous metals (stairs, railings, lintels)","Torque-test high-strength bolts","Touch-up fireproofing at connections"] },
      {category:"Roofing",         description:"TPO/EPDM membrane, insulation board, roof drains, flashing",          pct:5, tasks:["Install roof insulation board","Mechanically attach TPO/EPDM membrane","Flash all roof penetrations","Install roof drains and overflow scuppers","Install parapet cap flashing","Install roof hatch and safety railings","Test roof for water-tightness"] },
      {category:"Windows & Doors", description:"Curtain wall, storefront glazing, hollow metal frames, loading doors",pct:6, tasks:["Install curtain wall system","Install storefront glazing at entries","Set hollow metal door frames","Hang exterior and interior doors","Install overhead coiling doors at loading","Install dock levelers and bumpers","Install hardware and closers"] },
      {category:"Plumbing",        description:"Core plumbing risers, roof drains, restroom rough-in, fire mains",    pct:6, tasks:["Install domestic water risers","Install sanitary waste risers and stacks","Connect to site water and sewer","Install roof drain piping","Rough-in core restrooms","Set water heaters","Finish-set restroom fixtures","Install exterior hose bibs","Test and inspect all systems"] },
      {category:"Electrical",      description:"Main switchgear, distribution, panels, site lighting, generator",     pct:9, tasks:["Set main switchgear and transformer","Install electrical distribution panels","Run feeders to tenant panel locations","Install site and parking lot lighting","Install emergency generator and ATS","Install fire alarm system","Install elevator power feeds","Install core area lighting","Install exit and emergency lighting","Final inspections and energize"] },
      {category:"HVAC",            description:"Rooftop units, VAV systems, main ductwork, BAS controls",             pct:8, tasks:["Set rooftop units on curbs","Install main supply and return ductwork","Install VAV boxes for core areas","Install exhaust systems","Install building automation system (BAS)","Install core area thermostats","Insulate ductwork","Install restroom exhaust fans","Charge and start up units","Commission and balance HVAC"] },
      {category:"Insulation",      description:"Building envelope insulation, fireproofing, firestopping",            pct:2, tasks:["Install building envelope insulation","Apply spray-on fireproofing to steel","Install firestopping at penetrations","Insulate mechanical piping","Seal building envelope"] },
      {category:"Drywall",         description:"Core area walls, shaft walls, demising walls, elevator lobbies",       pct:4, tasks:["Frame shaft walls and stairwells","Hang drywall on core walls","Hang drywall on elevator lobbies","Tape and finish core areas","Install demising wall framing and drywall","Apply fire-rated assemblies at shafts"] },
      {category:"Flooring",        description:"Sealed concrete, lobby finishes, restroom tile, stair treads",        pct:3, tasks:["Seal and polish concrete in common areas","Install lobby finish flooring","Install restroom floor tile","Install stair treads and risers","Install base at core areas"] },
      {category:"Painting",        description:"Core area paint, stairwells, restrooms, exterior accent",              pct:2, tasks:["Prime and paint core area walls","Paint stairwells","Paint restrooms","Paint mechanical/electrical rooms","Apply exterior accent paint","Touch-up throughout"] },
      {category:"Exterior",        description:"Tilt-up panels, masonry, EIFS/stucco, loading docks, canopies",       pct:7, tasks:["Erect tilt-up panels or lay CMU","Install EIFS or stucco system","Build loading dock structures","Install entry canopies","Install building signage","Apply exterior caulk and sealant","Install trash enclosure","Install bike racks and bollards"] },
      {category:"Landscaping",     description:"Parking lot paving, striping, curb/gutter, landscaping, irrigation",  pct:5, tasks:["Pave parking lot (asphalt or concrete)","Install curb and gutter","Stripe parking stalls and fire lanes","Install ADA-compliant ramps and signage","Install irrigation system","Plant trees and shrubs","Install site furnishings (benches, etc.)","Install monument sign"] },
      {category:"Cabinets",        description:"Fire protection — sprinkler risers, heads, standpipes, FDC",          pct:4, tasks:["Install fire sprinkler risers","Run branch lines and drops","Install sprinkler heads throughout","Install standpipes in stairwells","Install FDC (fire department connection)","Install fire pump (if required)","Test and inspect system","Obtain fire marshal sign-off"] },
      {category:"GC Overhead",     description:"General conditions, project management, temp facilities, cleanup",    pct:2, tasks:["Project management and scheduling","Weekly OAC meetings","Temporary facilities and utilities","Dumpsters and waste management","Site safety program","Final clean","Punch list and close-out","As-built drawings and O&M manuals"] },
    ]
  },
  "Restaurant Buildout":{
    desc:"Full restaurant build-out — commercial kitchen, dining, and bar",
    hint:"Fast-casual: ~$100–150/sqft  ·  Full-service: ~$150–250/sqft  ·  Fine dining: ~$250+/sqft",
    defaultCpsf:150,
    phases:[
      {category:"Permits & Fees",  description:"Building, health dept, fire marshal, liquor license coordination",    pct:3, tasks:["Pull building permit","Submit plans to health department","Fire marshal plan review","Coordinate liquor license (if applicable)","Schedule all inspections"] },
      {category:"Demo",            description:"Interior demo, grease trap removal, existing equipment demo",          pct:5, tasks:["Remove existing kitchen equipment","Demo interior walls and finishes","Remove old grease trap","Demo existing flooring","Haul debris off-site","Cap utilities at demo points"] },
      {category:"Site Work",       description:"Concrete cutting, slab prep, underslab plumbing trenching",            pct:3, tasks:["Saw-cut slab for underslab plumbing","Trench for grease waste lines","Trench for floor drains","Backfill and patch concrete","Level slab for kitchen equipment"] },
      {category:"Foundation",      description:"Grease interceptor install, walk-in cooler slabs, depressed slabs",    pct:4, tasks:["Excavate for grease interceptor","Install grease interceptor","Pour walk-in cooler slab with recessed floor","Pour depressed slab for kitchen tile","Install equipment curbs and pads"] },
      {category:"Framing",         description:"Metal stud framing, soffits, kitchen partition walls, blocking",       pct:6, tasks:["Frame kitchen-to-dining partition wall","Frame restroom walls","Frame server station and wait station areas","Build soffits for ductwork concealment","Install blocking for TV mounts and shelving","Frame bar structure"] },
      {category:"Plumbing",        description:"Grease trap tie-in, floor drains, mop sink, bar sinks, gas lines",    pct:12, tasks:["Connect grease interceptor to sewer","Install kitchen floor drains","Install mop sink","Run gas lines to kitchen equipment","Install bar sinks (3-compartment and hand wash)","Install restroom fixtures","Install hot water system","Install grease waste piping from fixtures","Connect dishwasher plumbing","Install ice maker water line","Test and inspect"] },
      {category:"Electrical",      description:"3-phase service, dedicated kitchen circuits, POS wiring, lighting",    pct:11, tasks:["Upgrade to 3-phase service","Set kitchen sub-panel","Run dedicated circuits for kitchen equipment","Install POS system wiring and data drops","Install dining room lighting circuits","Install kitchen task lighting","Install decorative/mood lighting","Wire bar area (under-bar lighting, outlets)","Install emergency and exit lighting","Install exterior signage power","Final inspection and energize"] },
      {category:"HVAC",            description:"Kitchen exhaust hood, make-up air, dining zone HVAC, walk-in refrigeration", pct:13, tasks:["Install Type I kitchen exhaust hood","Install make-up air unit","Install hood fire suppression system","Set dining area HVAC units","Run ductwork for dining zones","Install walk-in cooler refrigeration system","Install walk-in freezer refrigeration system","Install bar area cooling","Install restroom exhaust fans","Balance kitchen exhaust vs make-up air","Commission all HVAC and refrigeration"] },
      {category:"Insulation",      description:"Wall and ceiling insulation, acoustical treatments, duct wrap",        pct:2, tasks:["Insulate exterior walls","Install acoustical treatments in dining","Wrap kitchen ductwork","Insulate walk-in cooler/freezer panels","Seal penetrations"] },
      {category:"Drywall",         description:"Hang, tape, finish — dining, restrooms, back-of-house partitions",    pct:5, tasks:["Hang drywall in dining areas","Hang drywall in restrooms","Hang drywall in back-of-house","Tape and finish — three coats","Sand and prep for paint","Install FRP panels in kitchen and dish area"] },
      {category:"Flooring",        description:"Quarry tile in kitchen, sealed concrete, hardwood/tile in dining",     pct:6, tasks:["Install quarry tile in kitchen","Install floor drains with tile slope","Install dining room flooring (hardwood/tile/concrete)","Install bar area flooring","Install restroom floor tile","Install non-slip mats at entries","Install transition strips and base"] },
      {category:"Cabinets",        description:"Bar millwork, host stand, banquette framing, custom booth builds",     pct:6, tasks:["Build and install custom bar structure","Install bar die and foot rail","Build host stand/reception desk","Frame and upholster banquettes","Build custom booths","Install server station millwork","Install shelving and display units"] },
      {category:"Countertops",     description:"Bar top, server station, host stand counter, pass-through shelf",      pct:3, tasks:["Fabricate and install bar top","Install server station counter","Install host stand countertop","Install kitchen pass-through shelf","Install prep table tops","Seal and finish all surfaces"] },
      {category:"Tile",            description:"Kitchen wall tile, restroom tile, bar face tile, decorative accents",  pct:4, tasks:["Install kitchen wall tile (behind cooking line)","Install restroom wall and floor tile","Install bar face tile or stone","Install decorative accent tiles in dining","Install backsplash behind bar","Grout and seal all tile"] },
      {category:"Painting",        description:"Interior paint, accent walls, restrooms, back-of-house",              pct:3, tasks:["Prime all surfaces","Paint dining room walls and ceiling","Paint accent walls and features","Paint restrooms","Paint back-of-house areas","Stain and seal wood elements","Touch-up after equipment install"] },
      {category:"Windows & Doors", description:"Storefront entry, patio doors, restroom doors, kitchen service door", pct:4, tasks:["Install storefront entry system","Install patio doors (if applicable)","Install restroom doors with ADA hardware","Install kitchen service/swing door","Install walk-in cooler/freezer doors","Install interior passage doors","Install window treatments"] },
      {category:"Exterior",        description:"Patio hardscape, facade improvements, signage blocking, awnings",     pct:5, tasks:["Build outdoor patio and hardscape","Install patio railing and barriers","Improve building facade","Install signage and blade sign","Install awnings or canopies","Install exterior lighting","Install dumpster enclosure","Install ADA-compliant ramp/entrance"] },
      {category:"GC Overhead",     description:"General conditions, health dept coordination, project management",    pct:5, tasks:["Project management and scheduling","Health department coordination and inspections","Temporary utilities","Dumpsters and waste hauling","Equipment delivery coordination","Final clean and detail","Punch list walk-through","Certificate of occupancy"] },
    ]
  },
  "Retail Buildout":{
    desc:"Retail store build-out — storefront, sales floor, and back-of-house",
    hint:"Basic shell: ~$45–70/sqft  ·  Mid-range: ~$75–110/sqft  ·  High-end boutique: ~$120+/sqft",
    defaultCpsf:85,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, sign permit, ADA review",               pct:3, tasks:["Submit plans for review","Pull building permit","Obtain sign permit","ADA compliance review","Schedule inspections"] },
      {category:"Demo",            description:"Interior demo, storefront removal, ceiling grid demo",                 pct:6, tasks:["Remove existing storefront system","Demo interior partition walls","Remove ceiling grid and tile","Remove old flooring","Demo existing restroom fixtures","Haul off debris"] },
      {category:"Site Work",       description:"Concrete patching, floor leveling, ADA ramp modifications",            pct:2, tasks:["Patch slab at demo areas","Level floor with self-leveler","Modify ADA ramp if needed","Prep concrete for new finishes"] },
      {category:"Framing",         description:"Metal stud walls, fitting rooms, stockroom partitions, soffits",       pct:8, tasks:["Frame fitting room walls","Frame stockroom partitions","Frame restroom walls","Build soffits and bulkheads","Install blocking for fixtures and displays","Frame checkout counter area"] },
      {category:"Plumbing",        description:"Restroom rough-in, break room sink, floor drains if required",         pct:5, tasks:["Rough-in restroom supply and waste","Install break room sink plumbing","Install water heater","Set restroom fixtures","Set break room faucet","Test and inspect"] },
      {category:"Electrical",      description:"New panel, track/accent lighting, POS drops, security wiring",         pct:14, tasks:["Set new sub-panel","Run branch circuits throughout","Install track lighting circuits","Install accent/display lighting","Install POS data and power drops","Run security system wiring","Install fitting room lighting","Install stockroom lighting","Set outlets and switches","Set light fixtures","Install security camera wiring","Final inspection"] },
      {category:"HVAC",            description:"RTU connection, ductwork modifications, thermostat controls",           pct:8, tasks:["Connect to rooftop unit","Modify existing ductwork layout","Install new supply registers","Install return air grilles","Install thermostat controls","Install restroom exhaust","Test and balance airflow"] },
      {category:"Insulation",      description:"Demising wall insulation, acoustical batt, duct insulation",            pct:2, tasks:["Insulate demising walls","Install acoustical batt in fitting rooms","Insulate ductwork","Seal penetrations"] },
      {category:"Drywall",         description:"Hang, tape, finish, feature walls, bulkheads, display niches",         pct:8, tasks:["Hang drywall on new walls","Build feature wall displays and niches","Frame and finish bulkheads","Tape and finish — three coats","Sand and prep for paint","Build custom display alcoves"] },
      {category:"Flooring",        description:"Polished concrete, LVT, carpet, transition strips, floor prep",        pct:8, tasks:["Prep subfloor throughout","Polish and seal concrete (sales floor)","Install LVT in select areas","Install carpet in fitting rooms","Install tile in restrooms","Install transition strips and base molding"] },
      {category:"Cabinets",        description:"Display fixtures, checkout counter millwork, shelving systems",         pct:7, tasks:["Build and install checkout counter","Install wall-mounted display shelving","Install freestanding display fixtures","Build fitting room benches and hooks","Install stockroom shelving","Install window display platforms"] },
      {category:"Countertops",     description:"Checkout counter tops, display case surfaces",                         pct:3, tasks:["Fabricate checkout counter surface","Install checkout countertop","Install display case glass tops","Install break room counter","Seal and finish all surfaces"] },
      {category:"Painting",        description:"Interior paint, accent walls, ceiling paint, trim and doors",           pct:5, tasks:["Prime all new surfaces","Paint ceilings","Paint walls — brand colors","Paint accent and feature walls","Paint trim and doors","Paint back-of-house areas","Touch-up after fixture install"] },
      {category:"Windows & Doors", description:"Storefront system, entry doors, ADA hardware, security gates",         pct:8, tasks:["Install new storefront glazing system","Install entry doors with ADA hardware","Install security rolling gates","Install interior doors (stockroom, restroom)","Install fitting room doors/curtains","Apply window film or graphics"] },
      {category:"Exterior",        description:"Facade upgrades, signage, canopy, exterior lighting",                  pct:7, tasks:["Upgrade building facade","Install primary signage (channel letters)","Install blade sign or projecting sign","Install entry canopy or awning","Install exterior lighting","Install window displays","Install ADA-compliant entrance"] },
      {category:"GC Overhead",     description:"General conditions, project management, and tenant coordination",      pct:6, tasks:["Project management and scheduling","Coordinate with landlord/property management","Temporary protection of common areas","Dumpster and waste management","Final clean and detail","Punch list walk-through","Coordinate fixture/merchandise delivery"] },
    ]
  },
  "Office Buildout":{
    desc:"Professional office build-out — open plan, private offices, and conference",
    hint:"Basic: ~$50–75/sqft  ·  Mid-grade: ~$80–120/sqft  ·  Class A: ~$130+/sqft",
    defaultCpsf:95,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, fire marshal review",                   pct:2, tasks:["Submit plans for review","Pull building permit","Fire marshal plan review","Schedule inspections","ADA compliance review"] },
      {category:"Demo",            description:"Interior demo, ceiling grid removal, existing partition removal",       pct:6, tasks:["Remove existing partition walls","Remove ceiling grid and tile","Remove old flooring","Demo existing break room","Cap utilities at demo points","Haul off debris"] },
      {category:"Site Work",       description:"Floor prep, concrete leveling, core drilling for data/power",           pct:2, tasks:["Core drill for data/power floor boxes","Level concrete floor","Patch slab penetrations","Prep for new flooring"] },
      {category:"Framing",         description:"Metal stud walls, door frames, header blocking, soffit framing",       pct:8, tasks:["Frame private office walls","Frame conference room walls","Frame break room and restroom walls","Install door frames and headers","Build soffits for ductwork","Install blocking for TVs, whiteboards, millwork"] },
      {category:"Plumbing",        description:"Break room, restroom rough-in, water heater, coffee bar plumbing",     pct:5, tasks:["Rough-in break room sink and dishwasher","Rough-in restroom supply and waste","Install water heater","Rough-in coffee bar plumbing","Set restroom fixtures","Set break room fixtures","Test and inspect"] },
      {category:"Electrical",      description:"Panel, circuits, outlets, data/low-voltage, lighting controls",         pct:13, tasks:["Set new sub-panel","Run branch circuits","Install floor boxes for open plan areas","Install wall outlets in offices","Run Cat6 data cabling throughout","Install conference room AV conduit","Install lighting control system/dimmers","Wire for access control system","Install emergency/exit lighting","Set outlets, switches, and data jacks","Set light fixtures","Final inspection and energize"] },
      {category:"HVAC",            description:"VAV box modifications, ductwork, thermostat zones, supplemental cooling", pct:10, tasks:["Modify VAV boxes for new layout","Extend ductwork to new offices","Install supply registers in each room","Install return air grilles","Add supplemental cooling for server room","Install thermostat per zone","Install restroom and break room exhaust","Test and balance airflow"] },
      {category:"Insulation",      description:"Acoustical insulation in walls, above ceiling, sound masking prep",    pct:3, tasks:["Install sound batt in office walls","Install sound batt in conference room walls","Insulate above ceiling plenum where needed","Install sound masking system wiring","Seal penetrations for acoustics"] },
      {category:"Drywall",         description:"Hang, tape, finish, reveals, sound-rated assemblies",                  pct:8, tasks:["Hang drywall on all new walls","Install sound-rated assemblies at conference rooms","Tape and finish — three coats","Sand and prep for paint","Build reveals and accent details","Patch and repair existing walls"] },
      {category:"Flooring",        description:"Carpet tile, LVT, polished concrete, raised access floor areas",       pct:8, tasks:["Install raised access floor in server room","Install carpet tile in offices and open areas","Install LVT in break room and corridors","Install tile in restrooms","Install polished concrete in lobby/reception","Install transition strips and base"] },
      {category:"Cabinets",        description:"Ceiling grid and tile, specialty ceilings, clouds, and coffers",       pct:7, tasks:["Install ceiling grid system","Lay ceiling tile","Build ceiling clouds in open areas","Frame and finish drywall coffers in conference rooms","Install linear/specialty ceilings in lobby","Install access panels"] },
      {category:"Countertops",     description:"Break room counters, reception desk, conference credenzas",             pct:3, tasks:["Build and install reception desk","Install break room countertops and cabinets","Build conference room credenza","Install copy room/mail room millwork","Apply laminate or solid surface tops"] },
      {category:"Tile",            description:"Restroom tile, break room backsplash, entry vestibule tile",            pct:3, tasks:["Install restroom wall and floor tile","Install break room backsplash tile","Install entry vestibule feature tile","Grout and seal all tile","Install tile base and trim"] },
      {category:"Painting",        description:"Interior paint, accent walls, door and frame paint, stain",             pct:5, tasks:["Prime all new drywall","Paint walls — brand/corporate colors","Paint accent walls in lobby and conference","Paint all doors and frames","Stain and finish wood millwork","Paint back-of-house areas","Touch-up after move-in"] },
      {category:"Windows & Doors", description:"Interior glass partitions, solid doors, sidelites, hardware",           pct:7, tasks:["Install full-height glass partitions at offices","Install conference room glass walls","Install solid core doors at private offices","Install sidelites at offices","Install door hardware (levers, closers, stops)","Install barn door or sliding door at phone rooms","Apply window film for privacy"] },
      {category:"Exterior",        description:"Suite entry signage, lobby upgrades, directory board",                  pct:4, tasks:["Install suite entry door and frame","Install suite signage and logo","Update building directory board","Upgrade common area lobby finishes","Install exterior wayfinding"] },
      {category:"GC Overhead",     description:"General conditions, project management, after-hours work premium",     pct:6, tasks:["Project management and scheduling","After-hours work coordination with building","Temporary protection of common areas","Dumpster and waste management","Furniture delivery coordination","Final clean and detail","Punch list walk-through","IT/AV vendor coordination"] },
    ]
  },
  "Warehouse / PEMB Construction":{
    desc:"Pre-engineered metal building — warehouse, distribution, or industrial",
    hint:"Basic warehouse: ~$40–60/sqft  ·  Distribution: ~$55–80/sqft  ·  Cold storage: ~$90+/sqft",
    defaultCpsf:65,
    phases:[
      {category:"Permits & Fees",  description:"Building permits, plan check, fire marshal, environmental review",    pct:2, tasks:["Submit plans for review","Pull building permit","Fire marshal review","Environmental/CEQA review","Schedule all inspections"] },
      {category:"Demo",            description:"Site clearing, existing slab demo, environmental remediation",          pct:2, tasks:["Clear and grub site","Demo existing slab or structures","Environmental remediation (if needed)","Haul off debris","Install erosion control"] },
      {category:"Site Work",       description:"Mass grading, compaction, underground utilities, stormwater detention", pct:12, tasks:["Mass grading and cut/fill earthwork","Compact subgrade to 95%","Install storm drain system","Install sanitary sewer","Install water main and fire line","Install underground electrical","Build stormwater detention basin","Install erosion control BMPs"] },
      {category:"Foundation",      description:"Spread footings, grade beams, 6\"+ reinforced slab on grade, dock pits", pct:14, tasks:["Excavate for footings","Form and place rebar in footings","Pour spread footings","Form and pour grade beams","Install anchor bolts per PEMB drawings","Excavate and form dock pit recesses","Place welded wire/rebar in slab area","Pour 6\"+ reinforced slab on grade","Saw-cut control joints","Cure and seal slab"] },
      {category:"Framing",         description:"PEMB erection, purlins, girts, structural steel, mezzanine framing",  pct:16, tasks:["Receive and stage PEMB package","Erect main frame columns and rafters","Install eave struts and bracing","Install wall girts","Install roof purlins","Erect mezzanine steel and decking","Install miscellaneous steel (stairs, handrails)","Plumb, align, and final-torque bolts","Install crane rail (if applicable)"] },
      {category:"Roofing",         description:"Standing seam metal roof panels, insulation, skylights, gutters",      pct:6, tasks:["Install roof insulation (blanket or rigid)","Install standing seam metal roof panels","Install ridge cap","Install roof penetration flashings","Install skylights","Install gutters and downspouts","Install roof safety tie-off anchors"] },
      {category:"Windows & Doors", description:"Overhead doors, dock levelers, man doors, dock seals, strip curtains", pct:5, tasks:["Install overhead coiling/sectional doors","Install dock levelers","Install dock seals or shelters","Install man doors (hollow metal)","Install strip curtains at dock doors","Install office entry door and hardware"] },
      {category:"Plumbing",        description:"Restroom rough-in, break room, hose bibs, roof drains, fire main",    pct:4, tasks:["Rough-in restroom supply and waste","Install break room sink plumbing","Install water heater","Install interior hose bibs","Connect roof drain piping","Set restroom fixtures","Test and inspect"] },
      {category:"Electrical",      description:"Main switchgear, high-bay lighting, dock lights, panel boards",        pct:8, tasks:["Set main switchgear and transformer","Install panel boards","Run warehouse branch circuits","Install high-bay LED lighting","Install dock lights at each door","Install office area electrical","Install exterior building lighting","Install fire alarm system","Final inspection and energize"] },
      {category:"HVAC",            description:"Warehouse unit heaters, office HVAC split systems, exhaust fans",      pct:4, tasks:["Install warehouse gas unit heaters","Install office split system or packaged unit","Install HVLS destratification fans","Install wall exhaust fans","Install restroom exhaust","Set thermostats","Test and commission"] },
      {category:"Insulation",      description:"Wall and roof insulation, vapor barrier, office area insulation",      pct:3, tasks:["Install wall blanket insulation","Install vapor barrier","Insulate office area walls and ceiling","Insulate exposed pipes in unconditioned areas","Seal building envelope"] },
      {category:"Drywall",         description:"Office area drywall, restroom walls, demising partitions",             pct:2, tasks:["Frame office and restroom walls","Hang drywall in office area","Hang drywall in restrooms","Tape and finish","Install FRP in restrooms"] },
      {category:"Flooring",        description:"Sealed/polished warehouse slab, office carpet or VCT, restroom tile",  pct:2, tasks:["Seal and polish warehouse slab","Install VCT or carpet in office area","Install tile in restrooms","Install base molding"] },
      {category:"Painting",        description:"Office paint, door and frame paint, exterior accent, striping",        pct:2, tasks:["Paint office interior","Paint doors and frames","Paint exterior accent (wainscot, trim)","Mark interior safety striping","Paint equipment pads and bollards"] },
      {category:"Exterior",        description:"Metal wall panels, concrete tilt-up or CMU, dock canopy, bollards",    pct:8, tasks:["Install metal wall panels","Erect tilt-up panels or lay CMU (if applicable)","Install dock canopy/bumper structure","Install steel bollards at doors and corners","Install building signage","Apply exterior sealant at joints","Install trash enclosure"] },
      {category:"Landscaping",     description:"Truck court paving, auto parking, curb/gutter, landscaping, fencing",  pct:8, tasks:["Pave truck court (heavy-duty concrete)","Pave auto parking lot","Install curb and gutter","Stripe parking and fire lanes","Install perimeter fencing and gates","Install landscaping and irrigation","Install monument sign","Install site lighting poles"] },
      {category:"GC Overhead",     description:"General conditions, project management, temp facilities, safety",      pct:2, tasks:["Project management and scheduling","Temporary facilities and power","Dumpsters and waste management","Site safety program","Final clean","Punch list and close-out","As-built drawings and O&M manuals"] },
    ]
  },
  "Site Development / Civil":{
    desc:"Horizontal construction — grading, utilities, paving, and stormwater",
    hint:"Light grading/paving: ~$8–18/sqft  ·  Full site dev: ~$20–35/sqft  ·  Heavy civil: ~$40+/sqft",
    defaultCpsf:25,
    phases:[
      {category:"Permits & Fees",  description:"Grading permit, SWPPP, utility permits, encroachment permits",        pct:4, tasks:["Obtain grading permit","File SWPPP with regional board","Pull utility connection permits","Obtain encroachment permit for public ROW","Post permits on site","Pre-construction meeting with inspector"] },
      {category:"Demo",            description:"Existing pavement demo, structure removal, clearing and grubbing",     pct:6, tasks:["Remove existing pavement and base","Demolish existing structures","Clear and grub vegetation","Haul off demo debris","Stockpile reusable materials"] },
      {category:"Site Work",       description:"Mass grading, cut/fill, compaction, rough grading, erosion control",   pct:20, tasks:["Mobilize earthwork equipment","Strip and stockpile topsoil","Mass excavation — cut areas","Place fill and compact in lifts","Fine grade building pads","Fine grade parking and road areas","Install silt fence and erosion control","Compact to 95% per geotech specs","Survey and certify pad elevations"] },
      {category:"Foundation",      description:"Storm drain, culverts, manholes, headwalls, detention structures",     pct:12, tasks:["Trench for storm drain pipes","Lay storm drain pipe and fittings","Set catch basins and manholes","Install culverts at crossings","Build headwall structures","Construct detention/retention basin","Install outlet control structure","Backfill and compact around structures","Video inspection and testing"] },
      {category:"Plumbing",        description:"Sanitary sewer main, laterals, manholes, lift station if required",    pct:10, tasks:["Trench for sewer main","Lay sewer pipe at grade","Set sewer manholes","Install lateral connections","Build lift station (if required)","Backfill and compact","Mandrel test and video inspect","Obtain utility acceptance"] },
      {category:"Electrical",      description:"Underground conduit, transformer pads, site lighting, pull boxes",     pct:6, tasks:["Trench for electrical conduit","Install conduit and pull boxes","Pour transformer pads","Install site lighting poles and fixtures","Install parking lot lighting","Pull wire and make connections","Coordinate utility company transformer set","Energize and test"] },
      {category:"Framing",         description:"Water main, fire hydrants, gate valves, thrust blocks, services",      pct:10, tasks:["Trench for water main","Lay water main pipe","Install gate valves and tees","Pour thrust blocks","Install fire hydrants","Install water service laterals","Backfill and compact","Pressure test and chlorinate","Obtain utility acceptance"] },
      {category:"Exterior",        description:"Curb and gutter, sidewalks, ADA ramps, retaining walls, fencing",      pct:8, tasks:["Form and pour curb and gutter","Form and pour sidewalks","Build ADA-compliant ramps with detectable warnings","Construct retaining walls","Install perimeter and interior fencing","Install gates and access controls","Install handrails where required"] },
      {category:"Landscaping",     description:"Asphalt paving, base course, striping, signage, speed bumps",          pct:12, tasks:["Place and compact aggregate base course","Prime base course","Lay asphalt in lifts (binder + surface)","Roll and compact asphalt","Install speed bumps and wheel stops","Stripe parking stalls and fire lanes","Install traffic signs and wayfinding","Install ADA signage"] },
      {category:"Insulation",      description:"Dry utilities — telecom, gas, fiber conduit, joint trench",            pct:4, tasks:["Trench for joint utility trench","Install telecom conduit","Install gas main and services","Install fiber optic conduit","Backfill and compact","Coordinate utility company connections"] },
      {category:"Roofing",         description:"Erosion control, hydroseeding, permanent BMPs, swales",                pct:3, tasks:["Grade permanent swales and ditches","Install rip-rap at discharge points","Hydroseed disturbed slopes","Install permanent erosion control blankets","Build permanent BMP structures"] },
      {category:"Painting",        description:"Final landscaping, irrigation, tree planting, sod, mulch",             pct:2, tasks:["Install irrigation mainline and laterals","Install sprinkler heads and drip lines","Plant street trees per plan","Install sod in common areas","Apply mulch to planting beds","Final grading around landscape areas"] },
      {category:"Tile",            description:"Final SWPPP closeout, testing, inspection, utility acceptance",         pct:1, tasks:["Final SWPPP inspection","File Notice of Termination","Compile as-built drawings","Submit material testing reports","Obtain final inspection sign-off","Utility acceptance letters"] },
      {category:"GC Overhead",     description:"General conditions, project management, surveying, material testing",  pct:2, tasks:["Project management and scheduling","Construction surveying and staking","Materials testing (compaction, concrete, asphalt)","Temporary traffic control","Dumpsters and waste management","Punch list and close-out","Warranty documentation"] },
    ]
  }
};

const EstimateTemplateWizard = ({projectId:initialProjectId,projects,estimates,setEstimates,companySettings,onClose,onCreated}) => {
  const [step,setStep] = useState(1);
  const [selectedProjectId,setSelectedProjectId] = useState(initialProjectId||null);
  const [tKey,setTKey] = useState(null);
  const [estName,setEstName] = useState("");
  const [sqft,setSqft] = useState("");
  const [cpsf,setCpsf] = useState("");
  const [profit,setProfit] = useState(15);
  const [margin,setMargin] = useState(13.04);
  const [phases,setPhases] = useState([]);
  const [expandedPhases,setExpandedPhases] = useState(new Set());
  const co = companySettings||DEFAULT_COMPANY;
  const projectId = selectedProjectId;
  const sqftN = parseFloat(sqft)||0;
  const cpsfN = parseFloat(cpsf)||0;
  const hardCpsfN = cpsfN/(1+profit/100);
  const mu2mg = mu => { const v=parseFloat(mu)||0; return Math.round(v/(100+v)*10000)/100; };
  const mg2mu = mg => { const v=parseFloat(mg)||0; return v>=100?99.99:Math.round(v/(100-v)*10000)/100; };
  const pctSum = phases.reduce((s,p)=>s+parseFloat(p.pct||0),0);
  const contractTotal = sqftN*cpsfN;
  const hardCostTotal = sqftN*hardCpsfN;
  const profitAmt = contractTotal-hardCostTotal;

  const pickTemplate = key => {
    if(projects&&!initialProjectId&&!selectedProjectId){toast.error("Please select a project first");return;}
    const t = ESTIMATE_TEMPLATES[key];
    setTKey(key); setEstName(key+" Estimate"); setCpsf(String(t.defaultCpsf));
    setPhases(t.phases.map(p=>({...p}))); setStep(2);
  };
  const updatePct = (i,val) => setPhases(ph=>ph.map((p,idx)=>idx===i?{...p,pct:parseFloat(val)||0}:p));

  const create = () => {
    if(!estName||sqftN<=0||cpsfN<=0){toast.error("Please fill in name, square footage, and $/sqft");return;}
    if(Math.abs(pctSum-100)>0.01){toast.error(`Percentages must sum to 100% (currently ${pctSum.toFixed(1)}%)`);return;}
    const lineItems = phases.map(p=>({
      id:uid(), _isNew:true, category:p.category, description:p.description,
      qty:sqftN, unit:"SF",
      cost:Math.round((p.pct/100)*hardCpsfN*100)/100,
      markup:profit
    }));
    const est = {id:uid(),_isNew:true,projectId,name:estName,
      notes:`${tKey} · ${sqftN.toLocaleString()} SF · $${cpsfN}/sqft · ${profit}% profit`,
      status:"Draft",date:today(),lineItems};
    setEstimates(prev=>[...prev,est]);
    toast.success("Estimate created from template");
    onCreated(est.id);
  };

  const ICONS = {"New Home Construction":"home","Apartment Construction":"proj","Tenant Improvements (TI)":"budget","Custom Home (High-End Residential)":"award","Residential Rehab / Renovation":"hard","Ground-Up Commercial (Core & Shell)":"budget","Restaurant Buildout":"co","Retail Buildout":"proj","Office Buildout":"est","Warehouse / PEMB Construction":"docs","Site Development / Civil":"trend"};

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.6)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:6,maxWidth:step===1?600:940,width:"100%",maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.35)"}}>
        {/* Header */}
        <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:C.text}}>New Estimate from Template</div>
            <div style={{fontSize:12,color:C.textSub,marginTop:2}}>{step===1?"Choose a project type to get started":"Configure your estimate — adjust percentages as needed"}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:22,lineHeight:1,padding:4}}>×</button>
        </div>

        {/* Step 1 — Pick Template */}
        {step===1&&(
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:16,overflowY:"auto",flex:1}}>
            {/* Project picker — only shown in global context */}
            {projects&&!initialProjectId&&(
              <div>
                <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginBottom:6}}>Project</div>
                <select value={selectedProjectId||""} onChange={e=>setSelectedProjectId(e.target.value)}
                  style={{width:"100%",padding:"8px 12px",borderRadius:4,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:13,fontFamily:"inherit"}}>
                  <option value="">— Select a project —</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {Object.entries(ESTIMATE_TEMPLATES).map(([key,t])=>(
              <div key={key} onClick={()=>pickTemplate(key)}
                style={{padding:"16px 20px",border:`2px solid ${C.border}`,borderRadius:4,cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all 0.15s"}}
                onMouseEnter={el=>{el.currentTarget.style.borderColor=C.accent;el.currentTarget.style.background=C.accentL;}}
                onMouseLeave={el=>{el.currentTarget.style.borderColor=C.border;el.currentTarget.style.background="transparent";}}>
                <div style={{width:44,height:44,borderRadius:6,background:C.accentL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={I[ICONS[key]]||I.proj} s={20} stroke={C.accent}/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>{key}</div>
                  <div style={{fontSize:12,color:C.textSub,marginTop:2}}>{t.desc}</div>
                  <div style={{fontSize:11,color:C.textMuted,marginTop:3}}>{t.hint}</div>
                </div>
                <div style={{fontSize:12,color:C.textMuted,flexShrink:0,textAlign:"right"}}><div>{t.phases.length} phases</div><div style={{fontSize:10,color:C.textMuted}}>{t.phases.reduce((s,p)=>s+(p.tasks?p.tasks.length:0),0)} tasks</div></div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Step 2 — Configure */}
        {step===2&&(
          <>
            <div style={{overflowY:"auto",flex:1,padding:24,display:"flex",flexDirection:"column",gap:20}}>
              {/* Inputs */}
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:12}}>
                {[
                  {label:"Estimate Name",v:estName,set:setEstName,type:"text",ph:"e.g. Base Bid"},
                  {label:"Total Sq Ft",v:sqft,set:setSqft,type:"number",ph:"e.g. 2,400"},
                  {label:"Total $/Sqft (client price)",v:cpsf,set:setCpsf,type:"number",ph:"e.g. 85"},
                ].map(f=>(
                  <div key={f.label}>
                    <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginBottom:5}}>{f.label}</div>
                    <input type={f.type} value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                      style={{width:"100%",padding:"8px 11px",borderRadius:4,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>

              {/* Markup ↔ Margin */}
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"14px 16px"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.textSub,marginBottom:10}}>PROFIT / MARKUP</div>
                <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{fontSize:9,color:C.textMuted,marginBottom:4}}>MARKUP % (on cost)</div>
                    <input type="number" min={0} value={profit}
                      onChange={e=>{const mu=parseFloat(e.target.value)||0;setProfit(mu);setMargin(mu2mg(mu));}}
                      style={{width:"100%",padding:"8px 10px",borderRadius:4,border:`1px solid ${C.accentB}`,background:C.surface,color:C.amber,fontSize:15,fontWeight:700,fontFamily:"inherit",textAlign:"center"}}/>
                  </div>
                  <div style={{fontSize:18,color:C.textMuted,paddingBottom:8}}>↔</div>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{fontSize:9,color:C.textMuted,marginBottom:4}}>MARGIN % (on revenue)</div>
                    <input type="number" min={0} max={99.99} value={margin}
                      onChange={e=>{const mg=parseFloat(e.target.value)||0;setMargin(mg);setProfit(mg2mu(mg));}}
                      style={{width:"100%",padding:"8px 10px",borderRadius:4,border:`1px solid ${C.accentB}`,background:C.surface,color:C.amber,fontSize:15,fontWeight:700,fontFamily:"inherit",textAlign:"center"}}/>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",paddingBottom:2}}>
                    {[[10,9.09],[15,13.04],[20,16.67],[25,20],[30,23.08]].map(([mu,mg])=>(
                      <button key={mu} onClick={()=>{setProfit(mu);setMargin(mg);}}
                        style={{padding:"5px 9px",borderRadius:5,border:`1px solid ${profit===mu?C.accent:C.border}`,background:profit===mu?C.accentL:"transparent",color:profit===mu?C.accent:C.textMid,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",lineHeight:1.3}}>
                        {mu}%<br/><span style={{fontSize:9,opacity:0.8}}>{mg}% mgn</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary cards */}
              {sqftN>0&&cpsfN>0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {l:"Contract Total",v:fmt(contractTotal),c:C.accent},
                    {l:"Hard Cost Total",v:fmt(hardCostTotal),c:C.blue},
                    {l:"Profit Amount",v:fmt(profitAmt),c:"#22c55e"},
                    {l:"Hard Cost $/Sqft",v:`$${hardCpsfN.toFixed(2)}/sf`,c:C.purple},
                  ].map(s=>(
                    <div key={s.l} style={{padding:"11px 14px",background:C.bg,borderRadius:4,border:`1px solid ${C.border}`}}>
                      <div style={{fontSize:10,color:C.textMuted,marginBottom:3}}>{s.l}</div>
                      <div style={{fontSize:15,fontWeight:700,color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Phases table */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>Phase Breakdown</div>
                  <div style={{fontSize:12,fontWeight:600,color:Math.abs(pctSum-100)<0.01?"#22c55e":C.amber}}>
                    Total: {pctSum.toFixed(1)}%{Math.abs(pctSum-100)<0.01?"":`  (${(100-pctSum).toFixed(1)}% remaining)`}
                  </div>
                </div>
                <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:"140px 1fr 90px 90px 100px",padding:"7px 14px",background:C.bg,borderBottom:`1px solid ${C.border}`}}>
                    {[["Category","left"],["Description","left"],["% of Total","right"],["$/Sqft (hard)","right"],["Line Total","right"]].map(([h,a])=>(
                      <div key={h} style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:a}}>{h}</div>
                    ))}
                  </div>
                  <div style={{maxHeight:300,overflowY:"auto"}}>
                    {phases.map((p,i)=>{
                      const dpcsf = (p.pct/100)*hardCpsfN;
                      const lineT = dpcsf*sqftN;
                      const isExpanded = expandedPhases.has(i);
                      const hasTasks = p.tasks&&p.tasks.length>0;
                      return (
                        <React.Fragment key={p.category}>
                        <div style={{display:"grid",gridTemplateColumns:"140px 1fr 90px 90px 100px",padding:"8px 14px",borderBottom:isExpanded?"none":(i<phases.length-1?`1px solid ${C.border}`:"none"),alignItems:"center",background:i%2===0?"transparent":C.bg+"66"}}>
                          <span onClick={()=>{if(hasTasks){setExpandedPhases(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n;});}}} style={{fontSize:11,color:C.accent,background:C.accentL,padding:"2px 7px",borderRadius:4,fontWeight:600,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130,cursor:hasTasks?"pointer":"default"}}>{hasTasks?(isExpanded?"▾ ":"▸ "):""}{p.category}</span>
                          <div style={{fontSize:11,color:C.textSub,paddingRight:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description}{hasTasks&&<span style={{fontSize:10,color:C.textMuted,marginLeft:6}}>({p.tasks.length} tasks)</span>}</div>
                          <div style={{textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}>
                            <input type="number" value={p.pct} onChange={e=>updatePct(i,e.target.value)} min={0} max={100} step={0.5}
                              style={{width:52,padding:"3px 6px",borderRadius:5,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:12,fontFamily:"inherit",textAlign:"right"}}/>
                            <span style={{fontSize:11,color:C.textMuted}}>%</span>
                          </div>
                          <div style={{fontSize:12,color:C.textMuted,textAlign:"right"}}>{cpsfN>0?`$${dpcsf.toFixed(2)}/sf`:"—"}</div>
                          <div style={{fontSize:12,fontWeight:600,color:C.text,textAlign:"right"}}>{sqftN>0&&cpsfN>0?fmt(lineT):"—"}</div>
                        </div>
                        {isExpanded&&hasTasks&&(
                          <div style={{padding:"4px 14px 10px 28px",borderBottom:i<phases.length-1?`1px solid ${C.border}`:"none",background:C.bg+"44"}}>
                            <div style={{display:"flex",flexWrap:"wrap",gap:"3px 12px"}}>
                              {p.tasks.map((t,ti)=>(
                                <div key={ti} style={{fontSize:10,color:C.textSub,padding:"2px 0",display:"flex",alignItems:"center",gap:4}}>
                                  <span style={{color:C.accent,fontSize:8}}>●</span> {t}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
              <Btn onClick={create}>Generate Estimate</Btn>
              <Btn v="secondary" onClick={()=>setStep(1)}>← Change Template</Btn>
              <Btn v="ghost" onClick={onClose} style={{marginLeft:"auto"}}>Cancel</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const printEstimate = (est, project, company, colVis={qty:true,unit:true,cost:true,markup:true}, opts={}) => {
  const {hideMargins=false, includeContract=false} = opts;
  const lineTotal = i => i.qty*i.cost*(1+i.markup/100);
  const visItems = est.lineItems.filter(i=>!i.hidden);
  const subtotal = visItems.reduce((s,i)=>s+i.qty*i.cost,0);
  const total = visItems.reduce((s,i)=>s+lineTotal(i),0);
  const markupAmt = total-subtotal;
  const addr = [company.address,company.city,company.state,company.zip].filter(Boolean).join(", ");
  const groupedItems = {};
  visItems.forEach(i=>{ if(!groupedItems[i.category]) groupedItems[i.category]=[]; groupedItems[i.category].push(i); });
  const numCols = 2 + (colVis.qty?1:0) + (colVis.unit?1:0) + (colVis.cost?1:0) + (colVis.markup?1:0);

  const html = `<!DOCTYPE html><html><head><title>${est.name} — ${company.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:${hideMargins?"0":"40px"};}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #E86C2C;}
    .logo{max-height:70px;max-width:200px;object-fit:contain;}
    .logo-placeholder{font-size:22px;font-weight:800;color:#E86C2C;letter-spacing:-0.5px;}
    .company-info{text-align:right;color:#5C6270;font-size:10px;line-height:1.6;}
    .company-name{font-size:15px;font-weight:700;color:#0F1117;margin-bottom:2px;}
    .doc-title{font-size:28px;font-weight:800;color:#E86C2C;letter-spacing:-0.5px;margin-bottom:24px;}
    .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;}
    .meta-box{background:#F8F9FA;border-radius:6px;padding:14px 16px;border-left:3px solid #E86C2C;}
    .meta-label{font-size:9px;font-weight:700;color:#9299A6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;}
    .meta-value{font-size:12px;font-weight:600;color:#0F1117;}
    .meta-sub{font-size:10px;color:#5C6270;margin-top:1px;}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;}
    .cat-header td{background:#FEF3EC;color:#C85A1E;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:7px 12px;border-bottom:1px solid #F5B894;}
    th{background:#F4F5F7;color:#5C6270;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:8px 12px;text-align:left;border-bottom:1px solid #E8EAED;}
    th.r{text-align:right;}
    td{padding:8px 12px;border-bottom:1px solid #F0F1F3;font-size:10.5px;color:#2D3340;vertical-align:top;}
    td.r{text-align:right;}
    td.muted{color:#9299A6;}
    tr:last-child td{border-bottom:none;}
    .subtotal-row td{background:#F8F9FA;font-weight:600;font-size:11px;}
    .total-row td{background:#E86C2C;color:#fff;font-weight:700;font-size:13px;}
    .totals-block{margin-left:auto;width:280px;margin-bottom:28px;}
    .totals-line{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #E8EAED;font-size:11px;color:#5C6270;}
    .totals-line.big{border-top:2px solid #E86C2C;border-bottom:none;padding:10px 0 0;font-size:16px;font-weight:800;color:#E86C2C;margin-top:4px;}
    .notes-section{margin-bottom:24px;padding:16px;background:#F8F9FA;border-radius:6px;border-left:3px solid #D0D4DA;}
    .notes-label{font-size:9px;font-weight:700;color:#9299A6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
    .terms-section{margin-bottom:32px;font-size:10px;color:#9299A6;line-height:1.6;}
    .signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;}
    .sig-line{border-top:1px solid #2D3340;padding-top:6px;font-size:10px;color:#5C6270;}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E8EAED;font-size:9px;color:#9299A6;text-align:center;}
    @media print{body{padding:${hideMargins?"0":"24px"};}@page{margin:${hideMargins?"0":"1cm"};}}
  </style></head><body>
  <div class="header">
    <div>${company.logo?`<img src="${company.logo}" class="logo" alt="logo"/>`:`<div class="logo-placeholder">${company.name}</div>`}</div>
    <div class="company-info">
      <div class="company-name">${company.name}</div>
      ${addr?`<div>${addr}</div>`:""}
      ${company.phone?`<div>${company.phone}</div>`:""}
      ${company.email?`<div>${company.email}</div>`:""}
      ${company.website?`<div>${company.website}</div>`:""}
      ${company.license?`<div>Lic. ${company.license}</div>`:""}
    </div>
  </div>

  <div class="doc-title">ESTIMATE / PROPOSAL</div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Prepared For</div>
      <div class="meta-value">${project?.client||"Client"}</div>
      ${project?.address?`<div class="meta-sub">${project.address}</div>`:""}
    </div>
    <div class="meta-box">
      <div class="meta-label">Estimate Details</div>
      <div class="meta-value">${est.name}</div>
      <div class="meta-sub">Date: ${est.date||new Date().toLocaleDateString()} &nbsp;·&nbsp; Status: ${est.status}</div>
    </div>
    ${project?.name?`<div class="meta-box"><div class="meta-label">Project</div><div class="meta-value">${project.name}</div></div>`:""}
    <div class="meta-box">
      <div class="meta-label">Contract Total</div>
      <div class="meta-value" style="font-size:20px;color:#E86C2C;">${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(total)}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th>${colVis.qty?`<th class="r">Qty</th>`:""} ${colVis.unit?`<th>Unit</th>`:""} ${colVis.cost?`<th class="r">Unit Cost</th>`:""} ${colVis.markup?`<th class="r">Markup</th>`:""}<th class="r">Total</th></tr></thead>
    <tbody>
      ${Object.entries(groupedItems).map(([cat,items])=>`
        <tr class="cat-header"><td colspan="${numCols}">${cat}</td></tr>
        ${items.map(i=>`<tr>
          <td>${i.description}</td>
          ${colVis.qty?`<td class="r muted">${i.qty}</td>`:""}
          ${colVis.unit?`<td class="muted">${i.unit}</td>`:""}
          ${colVis.cost?`<td class="r muted">${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(i.cost)}</td>`:""}
          ${colVis.markup?`<td class="r muted">${i.markup}%</td>`:""}
          <td class="r" style="font-weight:600;">${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(i.qty*i.cost*(1+i.markup/100))}</td>
        </tr>`).join("")}
      `).join("")}
    </tbody>
  </table>

  <div class="totals-block">
    ${colVis.markup?`<div class="totals-line"><span>Cost Subtotal</span><span>${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(subtotal)}</span></div>`:""}
    ${colVis.markup?`<div class="totals-line"><span>Markup / Overhead &amp; Profit</span><span>${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(markupAmt)}</span></div>`:""}
    <div class="totals-line big"><span>CONTRACT TOTAL</span><span>${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(total)}</span></div>
  </div>

  ${est.notes?`<div class="notes-section"><div class="notes-label">Scope of Work / Notes</div><div style="font-size:11px;color:#2D3340;white-space:pre-wrap;">${est.notes}</div></div>`:""}

  ${includeContract&&est.contract?`<div style="page-break-before:always;"></div>
  <div style="margin-bottom:28px;">
    <div style="font-size:20px;font-weight:800;color:#E86C2C;margin-bottom:16px;padding-bottom:10px;border-bottom:3px solid #E86C2C;">CONTRACT AGREEMENT</div>
    <div style="font-size:11px;color:#2D3340;white-space:pre-wrap;line-height:1.8;">${est.contract}</div>
  </div>`:""}

  ${company.terms?`<div class="terms-section"><strong>Terms & Conditions:</strong> ${company.terms}</div>`:""}

  <div class="signature-grid">
    <div><div class="sig-line">Contractor Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div><div style="margin-top:4px;font-size:10px;color:#5C6270;">${company.name}</div></div>
    <div><div class="sig-line">Client Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div><div style="margin-top:4px;font-size:10px;color:#5C6270;">${project?.client||""}</div></div>
  </div>

  <div class="footer">Generated by BuildFlow Pro · ${new Date().toLocaleDateString()}</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;

  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
};

const EstimateDetail = ({est,estimates,setEstimates,onBack,budgetItems,project,companySettings}) => {
  const [form,setForm] = useState(null);
  const [delItemId,setDelItemId] = useState(null);
  const [showBudgetImport,setShowBudgetImport] = useState(false);
  useUnsavedWarning(form !== null);
  const [budgetSel,setBudgetSel] = useState({});
  // Column visibility: qty, unit, cost, markup are toggleable; category, description, total always shown
  const [colVis,setColVis] = useState({qty:true,unit:true,cost:true,markup:true});
  const [showColMenu,setShowColMenu] = useState(false);
  const [showPrintMenu,setShowPrintMenu] = useState(false);
  const [hideMargins,setHideMargins] = useState(false);
  const [includeContract,setIncludeContract] = useState(false);
  const [showContractEditor,setShowContractEditor] = useState(false);
  // Collapsed parent rows (Set of item ids)
  const [collapsed,setCollapsed] = useState(new Set());

  const CATS = ["Demo","Foundation","Framing","Electrical","Plumbing","HVAC","Insulation","Drywall","Flooring","Cabinets","Countertops","Tile","Painting","Roofing","Windows & Doors","Exterior","Landscaping","Permits","Equipment","GC Overhead","Profit","Other"];
  const UNITS = ["LS","SF","LF","EA","HR","SY","CY","TN","GAL","BD","SQ"];
  const co = companySettings || DEFAULT_COMPANY;

  // Only non-hidden items count toward totals
  const lineTotal = i => i.qty*i.cost*(1+i.markup/100);
  const visItems = est.lineItems.filter(i=>!i.hidden);
  const subtotal = visItems.reduce((s,i)=>s+i.qty*i.cost,0);
  const total = visItems.reduce((s,i)=>s+lineTotal(i),0);
  const markupAmt = total-subtotal;
  const overallMarkupPct = subtotal>0 ? Math.round((markupAmt/subtotal)*10000)/100 : 0;
  const overallMarginPct = total>0 ? Math.round((markupAmt/total)*10000)/100 : 0;

  // Column span helpers
  const numOptCols = ["qty","unit","cost","markup"].filter(k=>colVis[k]).length;
  const numDataCols = 2 + numOptCols + 1; // cat + desc + opts + total
  const footerSpan = numDataCols - 1;     // all data cols except the "total" value cell
  const emptySpan  = numDataCols + 1;     // all data cols + actions

  // Markup ↔ Margin math
  const mu2mg = mu => { const v=parseFloat(mu)||0; return Math.round(v/(100+v)*10000)/100; };
  const mg2mu = mg => { const v=parseFloat(mg)||0; return v>=100?99.99:Math.round(v/(100-v)*10000)/100; };

  const update = fn => setEstimates(estimates.map(e=>e.id===est.id?fn(e):e));

  const openForm = (base) => {
    const mu = parseFloat(base.markup)||0;
    setForm({...base, _margin:String(mu2mg(mu))});
  };

  const saveItem = () => {
    if(!form.category||!form.description||!form.cost) return;
    const {_margin,...rest} = form;
    const item = {...rest, qty:parseFloat(form.qty)||1, cost:parseFloat(form.cost)||0, markup:parseFloat(form.markup)||0};
    if(form.id) { update(e=>({...e,lineItems:e.lineItems.map(i=>i.id===form.id?{...item,id:form.id}:i)})); }
    else { update(e=>({...e,lineItems:[...e.lineItems,{...item,id:uid(),_isNew:true}]})); }
    setForm(null);
  };

  const delItem = () => { update(e=>({...e,lineItems:e.lineItems.filter(i=>i.id!==delItemId)})); setDelItemId(null); };
  const setStatus = s => update(e=>({...e,status:s}));
  const toggleHidden = id => update(e=>({...e,lineItems:e.lineItems.map(i=>i.id===id?{...i,hidden:!i.hidden}:i)}));
  const toggleCol = k => setColVis(v=>({...v,[k]:!v[k]}));
  const toggleCollapse = id => setCollapsed(s=>{const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n;});

  const projBudget = budgetItems ? budgetItems.filter(b=>b.projectId===est.projectId) : [];
  const importFromBudget = () => {
    const toImport = projBudget.filter(b=>budgetSel[b.id]);
    if(toImport.length===0){toast.error("Select at least one budget line to import");return;}
    const newLines = toImport.map(b=>({id:uid(),_isNew:true,category:b.category,description:b.category+(b.notes?` — ${b.notes}`:""),qty:1,unit:"LS",cost:b.budgeted||0,markup:co.defaultMarkup||20}));
    update(e=>({...e,lineItems:[...e.lineItems,...newLines]}));
    setShowBudgetImport(false); setBudgetSel({});
    toast.success(`${newLines.length} line${newLines.length!==1?"s":""} imported from budget`);
  };

  // Tree helpers
  const topItems = est.lineItems.filter(i=>!i.parentId);
  const getChildren = pid => est.lineItems.filter(i=>i.parentId===pid);

  const renderRow = (item, isChild=false) => {
    const isHidden = !!item.hidden;
    const children = getChildren(item.id);
    const hasKids = children.length>0;
    const isCollapsed = collapsed.has(item.id);
    const lt = lineTotal(item);
    const iBtn = (title,onClick,label,active=false) => (
      <button title={title} onClick={onClick} style={{background:active?C.accentL:"none",border:active?`1px solid ${C.accentB}`:"none",borderRadius:4,cursor:"pointer",padding:"3px 6px",color:active?C.accent:C.textMuted,fontSize:11,fontFamily:"inherit",lineHeight:1}}>
        {label}
      </button>
    );
    return (
      <React.Fragment key={item.id}>
        <TR style={{opacity:isHidden?0.38:1,background:isChild?C.bg+"55":"transparent"}}>
          <td style={{padding:"10px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,paddingLeft:isChild?18:0}}>
              {hasKids
                ? <button onClick={()=>toggleCollapse(item.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",color:C.textMuted,fontSize:9,lineHeight:1,fontFamily:"inherit"}}>{isCollapsed?"▶":"▼"}</button>
                : isChild&&<span style={{width:13,display:"inline-block"}}/>}
              <span style={{fontSize:11,color:C.accent,background:C.accentL,padding:"2px 7px",borderRadius:4,fontWeight:600,whiteSpace:"nowrap"}}>{item.category}</span>
              {isHidden&&<span style={{fontSize:9,color:C.textMuted,background:C.border,padding:"1px 5px",borderRadius:3,fontWeight:600}}>HIDDEN</span>}
            </div>
          </td>
          <TD><span style={{paddingLeft:isChild?18:0}}>{item.description}</span></TD>
          {colVis.qty&&<TD right muted>{item.qty}</TD>}
          {colVis.unit&&<TD right muted>{item.unit}</TD>}
          {colVis.cost&&<TD right muted>{fmt(item.cost)}</TD>}
          {colVis.markup&&(
            <td style={{padding:"10px 14px",textAlign:"right",fontSize:12,color:C.amber,fontWeight:500}}>
              <div>{item.markup}%</div>
              <div style={{fontSize:10,color:C.textMuted}}>{mu2mg(item.markup)}% mgn</div>
            </td>
          )}
          <TD right bold color={isHidden?C.textMuted:C.accent}>{fmt(lt)}</TD>
          <td style={{padding:"10px 10px"}}>
            <div style={{display:"flex",gap:2,justifyContent:"flex-end",alignItems:"center"}}>
              {iBtn(isHidden?"Show row":"Hide row",()=>toggleHidden(item.id),isHidden?"show":"hide",isHidden)}
              {!isChild&&iBtn("Add sub-row",()=>openForm({category:item.category,description:"",qty:1,unit:"LS",cost:"",markup:co.defaultMarkup||20,parentId:item.id}),"+ sub")}
              <EditBtn onClick={()=>openForm({...item})}/>
              <DeleteBtn onClick={()=>setDelItemId(item.id)}/>
            </div>
          </td>
        </TR>
        {!isCollapsed&&children.map(child=>renderRow(child,true))}
      </React.Fragment>
    );
  };

  const COL_LABELS = [{k:"qty",l:"Qty"},{k:"unit",l:"Unit"},{k:"cost",l:"Unit Cost"},{k:"markup",l:"Markup / Margin"}];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}} onClick={()=>showColMenu&&setShowColMenu(false)}>
      {delItemId&&<Confirm msg="Remove this line item?" onOk={delItem} onCancel={()=>setDelItemId(null)}/>}

      {showBudgetImport&&(
        <div onClick={()=>setShowBudgetImport(false)} style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:6,padding:24,maxWidth:560,width:"100%",maxHeight:"80vh",display:"flex",flexDirection:"column",gap:16,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>Import from Budget</div>
            {projBudget.length===0
              ? <div style={{color:C.textMuted,fontSize:13}}>No budget items found for this project.</div>
              : <>
                  <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:8}}>
                    {projBudget.map(b=>(
                      <label key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:budgetSel[b.id]?C.accentL:C.bg,borderRadius:4,border:`1px solid ${budgetSel[b.id]?C.accentB:C.border}`,cursor:"pointer",transition:"all 0.1s"}}>
                        <input type="checkbox" checked={!!budgetSel[b.id]} onChange={e=>setBudgetSel(s=>({...s,[b.id]:e.target.checked}))} style={{width:14,height:14,accentColor:C.accent}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{b.category}</div>
                          {b.notes&&<div style={{fontSize:11,color:C.textMuted}}>{b.notes}</div>}
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.accent}}>{fmt(b.budgeted)}</div>
                          <div style={{fontSize:10,color:C.textMuted}}>budgeted</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <Btn onClick={importFromBudget}>Import Selected ({Object.values(budgetSel).filter(Boolean).length})</Btn>
                    <Btn v="secondary" onClick={()=>{setShowBudgetImport(false);setBudgetSel({});}}>Cancel</Btn>
                    <button onClick={()=>{const all={}; projBudget.forEach(b=>all[b.id]=true); setBudgetSel(all);}} style={{marginLeft:"auto",fontSize:11,color:C.accent,background:"none",border:"none",cursor:"pointer"}}>Select All</button>
                  </div>
                </>}
          </div>
        </div>
      )}

      {/* ── Header row ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Btn v="secondary" sm onClick={onBack}><Ic d={I.back} s={13}/> Back</Btn>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:C.text}}>{est.name}</div>
            <div style={{fontSize:12,color:C.textSub}}>{est.date} · {est.lineItems.length} lines · {est.lineItems.filter(i=>i.hidden).length>0&&`${est.lineItems.filter(i=>i.hidden).length} hidden`}</div>
          </div>
          <Badge s={est.status}/>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {est.status==="Draft"&&<Btn v="ghost" sm onClick={()=>setStatus("Sent")}><Ic d={I.send} s={12}/> Mark Sent</Btn>}
          {est.status==="Sent"&&<Btn sm onClick={()=>setStatus("Approved")}><Ic d={I.check} s={12}/> Mark Approved</Btn>}
          {est.status!=="Draft"&&<Btn v="secondary" sm onClick={()=>setStatus("Draft")}>Revert to Draft</Btn>}
          {projBudget.length>0&&<Btn v="secondary" sm onClick={()=>setShowBudgetImport(true)}><Ic d={I.budget} s={12}/> Import Budget</Btn>}
          {/* Print PDF dropdown */}
          <div style={{position:"relative"}}>
            <Btn v="secondary" sm onClick={e=>{e.stopPropagation();setShowPrintMenu(v=>!v);}}><Ic d={I.docs} s={12}/> Print PDF ▾</Btn>
            {showPrintMenu&&(
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,padding:"12px 14px",zIndex:300,minWidth:220,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>PDF Options</div>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:C.text,userSelect:"none"}}>
                  <input type="checkbox" checked={hideMargins} onChange={()=>setHideMargins(v=>!v)} style={{accentColor:C.accent,width:13,height:13}}/>
                  Hide page margins
                </label>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:C.text,userSelect:"none"}}>
                  <input type="checkbox" checked={includeContract} onChange={()=>setIncludeContract(v=>!v)} style={{accentColor:C.accent,width:13,height:13}}/>
                  Include contract in PDF
                </label>
                {includeContract&&!est.contract&&<div style={{fontSize:10,color:C.amber,marginLeft:21}}>Add contract text below first</div>}
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,marginTop:2}}>
                  <button onClick={()=>{setShowPrintMenu(false);printEstimate(est,project,co,colVis,{hideMargins,includeContract});}}
                    style={{width:"100%",padding:"7px 12px",borderRadius:4,border:"none",background:C.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    Generate PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Columns dropdown */}
          <div style={{position:"relative"}}>
            <Btn v="secondary" sm onClick={e=>{e.stopPropagation();setShowColMenu(v=>!v);}}>Columns ▾</Btn>
            {showColMenu&&(
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,padding:"10px 14px",zIndex:300,minWidth:180,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Show / Hide Columns</div>
                {COL_LABELS.map(({k,l})=>(
                  <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:C.text,userSelect:"none"}}>
                    <input type="checkbox" checked={!!colVis[k]} onChange={()=>toggleCol(k)} style={{accentColor:C.accent,width:13,height:13}}/>
                    {l}
                  </label>
                ))}
              </div>
            )}
          </div>
          <Btn sm onClick={()=>openForm({category:"",description:"",qty:1,unit:"LS",cost:"",markup:co.defaultMarkup||20})}><Ic d={I.plus} s={13}/> Add Line</Btn>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <Stat label="Cost Subtotal" value={fmt(subtotal)} color={C.blue} icon="dollar"/>
        <div style={{background:C.surface,borderRadius:4,padding:"14px 16px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:6}}>Profit / O&P</div>
          <div style={{fontSize:20,fontWeight:700,color:C.amber,marginBottom:6}}>{fmt(markupAmt)}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:9,color:C.textMuted,marginBottom:3}}>MARKUP %</div>
              <input type="number" value={overallMarkupPct} readOnly
                style={{width:"100%",padding:"4px 7px",borderRadius:5,border:`1px solid ${C.border}`,background:C.bg,color:C.amber,fontSize:12,fontWeight:600,fontFamily:"inherit",textAlign:"right"}}/>
            </div>
            <div style={{fontSize:11,color:C.textMuted,marginTop:12}}>↔</div>
            <div style={{flex:1}}>
              <div style={{fontSize:9,color:C.textMuted,marginBottom:3}}>MARGIN %</div>
              <input type="number" value={overallMarginPct} readOnly
                style={{width:"100%",padding:"4px 7px",borderRadius:5,border:`1px solid ${C.border}`,background:C.bg,color:C.amber,fontSize:12,fontWeight:600,fontFamily:"inherit",textAlign:"right"}}/>
            </div>
          </div>
        </div>
        <Stat label="Contract Total" value={fmt(total)} color={C.accent} icon="dollar"/>
        <Stat label="Line Items" value={`${visItems.length}${est.lineItems.length!==visItems.length?" vis":""}`} color={C.purple} icon="est"/>
      </div>

      {/* ── Add / Edit form ── */}
      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>{form.id?"Edit":"Add"} Line Item</div>
          {form.parentId&&<div style={{fontSize:11,color:C.textMuted,marginBottom:12}}>Sub-row under: <strong style={{color:C.accent}}>{est.lineItems.find(i=>i.id===form.parentId)?.category||"parent"}</strong></div>}
          <Grid cols="1fr 1fr" gap={12}>
            <Sel label="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={["Select...",...CATS]}/>
            <Inp label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe scope of work"/>
            <Inp label="Qty" type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/>
            <Sel label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} options={UNITS}/>
            <Inp label="Unit Cost ($)" type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0.00"/>
            {/* Linked Markup ↔ Margin */}
            <div>
              <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginBottom:6}}>Markup % ↔ Margin %</div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:C.textMuted,marginBottom:3}}>MARKUP (on cost)</div>
                  <input type="number" min={0} value={form.markup}
                    onChange={e=>{const mu=parseFloat(e.target.value)||0; setForm({...form,markup:e.target.value,_margin:String(mu2mg(mu))});}}
                    style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:13,fontFamily:"inherit",textAlign:"center"}}/>
                </div>
                <div style={{color:C.textMuted,fontSize:13,marginTop:12,flexShrink:0}}>↔</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:C.textMuted,marginBottom:3}}>MARGIN (on revenue)</div>
                  <input type="number" min={0} max={99.99} value={form._margin||""}
                    onChange={e=>{const mg=parseFloat(e.target.value)||0; setForm({...form,_margin:e.target.value,markup:mg2mu(mg)});}}
                    style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:13,fontFamily:"inherit",textAlign:"center"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[[10,9.09],[15,13.04],[20,16.67],[25,20],[30,23.08]].map(([mu,mg])=>(
                  <button key={mu} onClick={()=>setForm({...form,markup:mu,_margin:String(mg)})}
                    style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${parseFloat(form.markup)==mu?C.accent:C.border}`,background:parseFloat(form.markup)==mu?C.accentL:"transparent",color:parseFloat(form.markup)==mu?C.accent:C.textMid,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",lineHeight:1.4}}>
                    {mu}% / {mg}%
                  </button>
                ))}
              </div>
            </div>
          </Grid>
          {form.cost&&form.qty&&(
            <div style={{marginTop:12,padding:"10px 14px",background:C.accentL,borderRadius:4,fontSize:13,display:"flex",gap:20}}>
              <span>Line total: <strong style={{color:C.accent}}>{fmt((parseFloat(form.qty)||0)*(parseFloat(form.cost)||0)*(1+(parseFloat(form.markup)||0)/100))}</strong></span>
              <span style={{color:C.textMuted,fontSize:12}}>Hard cost: {fmt((parseFloat(form.qty)||0)*(parseFloat(form.cost)||0))} · Profit: {fmt((parseFloat(form.qty)||0)*(parseFloat(form.cost)||0)*((parseFloat(form.markup)||0)/100))}</span>
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={saveItem}>{form.id?"Save Changes":"Add Line Item"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* ── Table ── */}
      <Table heads={[
        {l:"Category"},{l:"Description"},
        ...(colVis.qty?[{l:"Qty",r:true}]:[]),
        ...(colVis.unit?[{l:"Unit",r:true}]:[]),
        ...(colVis.cost?[{l:"Unit Cost",r:true}]:[]),
        ...(colVis.markup?[{l:"Markup / Margin",r:true}]:[]),
        {l:"Line Total",r:true},{l:""}
      ]}>
        {topItems.map(item=>renderRow(item,false))}
        {est.lineItems.length===0&&<tr><td colSpan={emptySpan}><EmptyState msg="No line items yet. Click 'Add Line' or 'Import Budget' above."/></td></tr>}
        {visItems.length>0&&(<>
          {colVis.markup&&<tr style={{background:C.bg,borderTop:`1px solid ${C.border}`}}>
            <td colSpan={footerSpan} style={{padding:"9px 14px",fontSize:12,color:C.textSub,textAlign:"right",fontWeight:600}}>COST SUBTOTAL</td>
            <td style={{padding:"9px 14px",fontSize:13,fontWeight:700,textAlign:"right"}}>{fmt(subtotal)}</td>
            <td/>
          </tr>}
          {colVis.markup&&<tr style={{background:C.bg}}>
            <td colSpan={footerSpan} style={{padding:"7px 14px",fontSize:11,color:C.textSub,textAlign:"right"}}>
              Markup / O&P &nbsp;·&nbsp; <span style={{color:C.amber}}>{overallMarkupPct}% markup</span> &nbsp;·&nbsp; <span style={{color:C.amber}}>{overallMarginPct}% margin</span>
            </td>
            <td style={{padding:"7px 14px",fontSize:12,textAlign:"right",color:C.amber,fontWeight:600}}>{fmt(markupAmt)}</td>
            <td/>
          </tr>}
          <tr style={{background:C.accentL,borderTop:`2px solid ${C.accentB}`}}>
            <td colSpan={footerSpan} style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.accent,textAlign:"right"}}>CONTRACT TOTAL</td>
            <td style={{padding:"12px 14px",fontSize:16,fontWeight:800,textAlign:"right",color:C.accent}}>{fmt(total)}</td>
            <td/>
          </tr>
        </>)}
      </Table>

      {/* ── Contract Section ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>Contract</div>
        <Btn v="secondary" sm onClick={()=>setShowContractEditor(v=>!v)}>{showContractEditor?"Close":"Edit Contract"}</Btn>
      </div>
      {showContractEditor&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:12,color:C.textSub,marginBottom:8}}>Add contract language to include in the PDF when printing. This will appear as a separate page.</div>
          <textarea value={est.contract||""} onChange={e=>update(es=>({...es,contract:e.target.value}))}
            placeholder={"CONSTRUCTION CONTRACT AGREEMENT\n\nThis agreement is entered into between [Contractor] and [Client]...\n\nScope of Work:\n...\n\nPayment Terms:\n...\n\nTimeline:\n...\n\nWarranty:\n..."}
            rows={12}
            style={{width:"100%",padding:"12px 14px",borderRadius:4,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:12,fontFamily:"inherit",lineHeight:1.7,resize:"vertical",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:10,marginTop:10,alignItems:"center"}}>
            <div style={{fontSize:11,color:est.contract?C.green:C.textMuted}}>{est.contract?`${est.contract.length} characters`:"No contract text yet"}</div>
            <div style={{marginLeft:"auto",fontSize:11,color:C.textMuted}}>Use the Print PDF menu to include contract in export</div>
          </div>
        </Card>
      )}
      {!showContractEditor&&est.contract&&(
        <div style={{padding:"10px 14px",background:C.bg,borderRadius:4,border:`1px solid ${C.border}`,fontSize:11,color:C.textSub}}>
          Contract added ({est.contract.length} chars) — <button onClick={()=>setShowContractEditor(true)} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:11,fontFamily:"inherit",textDecoration:"underline"}}>edit</button>
        </div>
      )}
    </div>
  );
};

const Estimates = ({projectId,estimates,setEstimates,project,budgetItems,companySettings}) => {
  const [selectedId,setSelectedId] = useState(null);
  const [showForm,setShowForm] = useState(false);
  const [showWizard,setShowWizard] = useState(false);
  const [delId,setDelId] = useState(null);
  const [form,setForm] = useState({name:"",notes:""});
  const items = estimates.filter(e=>e.projectId===projectId);
  // Clear selectedId if the referenced estimate no longer exists (safe: runs after render)
  React.useEffect(()=>{ if(selectedId&&!estimates.find(e=>e.id===selectedId)) setSelectedId(null); },[selectedId,estimates]);
  const calcTotal = items => items.reduce((s,i)=>s+i.qty*i.cost*(1+i.markup/100),0);

  const create = () => {
    if(!form.name) return;
    const e = {id:uid(),_isNew:true,projectId,name:form.name,notes:form.notes,status:"Draft",date:today(),lineItems:[]};
    setEstimates([...estimates,e]);
    setSelectedId(e.id);
    setShowForm(false);
    setForm({name:"",notes:""});
  };

  const del = () => { setEstimates(estimates.filter(e=>e.id!==delId)); setDelId(null); if(selectedId===delId)setSelectedId(null); };

  if(selectedId) {
    const est = estimates.find(e=>e.id===selectedId);
    if(!est) return null;
    return <EstimateDetail est={est} estimates={estimates} setEstimates={setEstimates} onBack={()=>setSelectedId(null)} budgetItems={budgetItems} project={project} companySettings={companySettings}/>;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {showWizard&&<EstimateTemplateWizard projectId={projectId} estimates={estimates} setEstimates={setEstimates} companySettings={companySettings} onClose={()=>setShowWizard(false)} onCreated={id=>{setShowWizard(false);setSelectedId(id);}} />}
      {delId&&<Confirm msg="Delete this estimate and all its line items?" onOk={del} onCancel={()=>setDelId(null)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>Estimates</div>
        <div style={{display:"flex",gap:8}}>
          <Btn sm v="secondary" onClick={()=>setShowWizard(true)}>From Template</Btn>
          <Btn sm onClick={()=>setShowForm(true)}><Ic d={I.plus} s={13}/> Blank Estimate</Btn>
        </div>
      </div>
      {showForm&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>New Blank Estimate</div>
          <Grid cols="1fr 1fr" gap={12}>
            <Inp label="Estimate Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Base Bid, Revised Scope, Alternate 1"/>
            <div/>
            <Span2><TA label="Scope Summary / Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={create}>Create Estimate</Btn>
            <Btn v="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}
      {items.length===0&&!showForm&&<Card><EmptyState msg="No estimates yet. Use a template to auto-populate line items, or start blank." action={<div style={{display:"flex",gap:8}}><Btn sm onClick={()=>setShowWizard(true)}>From Template</Btn><Btn sm v="secondary" onClick={()=>setShowForm(true)}>+ Blank</Btn></div>}/></Card>}
      {items.map(e=>{
        const total=calcTotal(e.lineItems);
        return (
          <Card key={e.id} style={{cursor:"pointer"}}
            onMouseEnter={el=>el.currentTarget.style.borderColor=C.accentB}
            onMouseLeave={el=>el.currentTarget.style.borderColor=C.border}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div onClick={()=>setSelectedId(e.id)} style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{e.name}</div>
                <div style={{fontSize:12,color:C.textSub}}>{e.date} · {e.lineItems.length} line items{e.notes&&` · ${e.notes.substring(0,40)}`}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.textMuted}}>Total</div><div style={{fontSize:20,fontWeight:700,color:C.accent}}>{fmt(total)}</div></div>
                <Badge s={e.status}/>
                <DeleteBtn onClick={ev=>{ev.stopPropagation();setDelId(e.id);}}/>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ─── INVOICES (used inside project detail) ────────────────────────────────────
const ProjInvoices = ({projectId,invoices,setInvoices,project}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  useUnsavedWarning(form !== null);
  const items = invoices.filter(i=>i.projectId===projectId);
  const paid=items.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0);
  const outstanding=items.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.amount,0);

  const save = () => {
    if(!form.description||!form.amount) return;
    const yr=new Date().getFullYear(); const maxSeq=invoices.filter(i=>i.number.startsWith(`INV-${yr}`)).reduce((m,i)=>{const n=parseInt(i.number.split("-")[2]||0);return Math.max(m,n);},0); const num=`INV-${yr}-${String(maxSeq+1).padStart(3,"0")}`;
    if(form.id) {
      setInvoices(invoices.map(i=>i.id===form.id?{...form,amount:parseFloat(form.amount)}:i));
    } else {
      setInvoices([...invoices,{...form,id:uid(),_isNew:true,projectId,number:num,status:"Pending",issued:today(),amount:parseFloat(form.amount)}]);
    }
    setForm(null);
  };

  const del = () => { setInvoices(invoices.filter(i=>i.id!==delId)); setDelId(null); toast("Invoice deleted",{}); };
  const setStatus = (id,s) => { setInvoices(invoices.map(i=>i.id===id?{...i,status:s}:i)); if(s==="Paid") toast.success("Invoice marked as paid"); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {delId&&<Confirm msg="Delete this invoice?" onOk={del} onCancel={()=>setDelId(null)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:24}}>
          <div><div style={{fontSize:11,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Collected</div><div style={{fontSize:18,fontWeight:700,color:C.green}}>{fmt(paid)}</div></div>
          <div><div style={{fontSize:11,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Outstanding</div><div style={{fontSize:18,fontWeight:700,color:C.amber}}>{fmt(outstanding)}</div></div>
        </div>
        <Btn sm onClick={()=>setForm({description:"",amount:"",due:""})}><Ic d={I.plus} s={13}/> New Invoice</Btn>
      </div>

      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{form.id?"Edit":"New"} Invoice — {project.name}</div>
          <Grid cols="1fr 1fr 1fr" gap={12}>
            <Span2><Inp label="Description (Draw #, Milestone, etc.)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. Draw #1 – Mobilization & Demo"/></Span2>
            <Inp label="Amount ($)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            <Inp label="Due Date" type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={save}>{form.id?"Save Changes":"Create Invoice"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {items.length===0&&form===null?<Card><EmptyState msg="No invoices yet. Create your first draw invoice." action={<Btn sm onClick={()=>setForm({description:"",amount:"",due:""})}>+ Create Invoice</Btn>}/></Card>:(
        <Table heads={[{l:"Invoice #"},{l:"Description"},{l:"Amount",r:true},{l:"Issued"},{l:"Due"},{l:"Status"},{l:"Actions"}]}>
          {items.map(inv=>(
            <TR key={inv.id}>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.accent}}>{inv.number}</td>
              <TD>{inv.description}</TD>
              <TD right bold>{fmt(inv.amount)}</TD>
              <TD muted>{inv.issued}</TD>
              <td style={{padding:"12px 14px",fontSize:13,color:inv.status==="Overdue"?C.red:C.textSub}}>{inv.due||"—"}</td>
              <td style={{padding:"12px 14px"}}><Badge s={inv.status}/></td>
              <td style={{padding:"12px 14px"}}>
                <div style={{display:"flex",gap:6}}>
                  {inv.status!=="Paid"&&<button onClick={()=>setStatus(inv.id,"Paid")} style={{background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Mark Paid</button>}
                  {inv.status==="Pending"&&<button onClick={()=>setStatus(inv.id,"Overdue")} style={{background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Overdue</button>}
                  {inv.status==="Paid"&&<button onClick={()=>setStatus(inv.id,"Pending")} style={{background:C.bg,color:C.textSub,border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Revert</button>}
                  <EditBtn onClick={()=>setForm({...inv})}/>
                  <DeleteBtn onClick={()=>setDelId(inv.id)}/>
                </div>
              </td>
            </TR>
          ))}
        </Table>
      )}
    </div>
  );
};

// ─── CHANGE ORDERS (used inside project + global) ─────────────────────────────
const ChangeOrders = ({projectId,cos,setCos,projects}) => {
  const [form,setForm] = useState(null);
  useUnsavedWarning(form !== null);
  const [delId,setDelId] = useState(null);
  const [filter,setFilter] = useState("All");
  const items = projectId ? cos.filter(c=>c.projectId===projectId) : cos;
  const filtered = filter==="All"?items:items.filter(c=>c.status===filter);
  const CATS = ["Scope Addition","Unforeseen Condition","Owner Upgrade","Owner Directive","Design Change","Credit/Deduct","Other"];
  const approved=items.filter(c=>c.status==="Approved").reduce((s,c)=>s+c.amount,0);
  const pending=items.filter(c=>c.status==="Pending").reduce((s,c)=>s+c.amount,0);

  const save = () => {
    if(!form.title||!form.amount) return;
    if(form.id) {
      setCos(cos.map(c=>c.id===form.id?{...form,amount:parseFloat(form.amount)}:c));
    } else {
      const projId=form.projectId||projectId;
      const projCOs=cos.filter(c=>c.projectId===projId);
      const num=`CO-${String(projCOs.length+1).padStart(3,"0")}`;
      setCos([...cos,{...form,id:uid(),_isNew:true,number:num,status:"Pending",date:today(),projectId:projId,amount:parseFloat(form.amount)}]);
    }
    setForm(null);
  };

  const del = () => { setCos(cos.filter(c=>c.id!==delId)); setDelId(null); };
  const setStatus = (id,s) => { setCos(cos.map(c=>c.id===id?{...c,status:s}:c)); toast.success(`CO ${s.toLowerCase()}`); };
  const CAT_COLOR = {"Scope Addition":C.blue,"Unforeseen Condition":C.red,"Owner Upgrade":C.purple,"Owner Directive":C.green,"Design Change":C.amber,"Credit/Deduct":C.red,"Other":C.textSub};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this change order?" onOk={del} onCancel={()=>setDelId(null)}/>}

      {!projectId&&<PageHead eyebrow="Scope Changes" title="Change Orders" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",title:"",category:"Scope Addition",description:"",amount:"",requestedBy:"Owner"})}><Ic d={I.plus} s={14}/> New CO</Btn>}/>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        <Stat label="Approved COs" value={fmt(approved)} sub={`${items.filter(c=>c.status==="Approved").length} orders`} color={C.green} icon="check"/>
        <Stat label="Pending Approval" value={fmt(pending)} sub={`${items.filter(c=>c.status==="Pending").length} awaiting`} color={C.amber} icon="co"/>
        <Stat label="Total Exposure" value={fmt(approved+pending)} color={C.accent} icon="dollar"/>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:6}}>
          {["All","Pending","Approved","Rejected"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,fontWeight:500,cursor:"pointer"}}>{s}</button>
          ))}
        </div>
        {projectId&&<Btn sm onClick={()=>setForm({title:"",category:"Scope Addition",description:"",amount:"",requestedBy:"Owner"})}><Ic d={I.plus} s={13}/> New CO</Btn>}
      </div>

      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} Change Order</div>
          <Grid cols="1fr 1fr" gap={12}>
            {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
            <Inp label="CO Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Brief description of change"/>
            <Sel label="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={CATS}/>
            <Sel label="Requested By" value={form.requestedBy} onChange={e=>setForm({...form,requestedBy:e.target.value})} options={["Owner","GC","Architect","Engineer","Inspector","Subcontractor"]}/>
            <Inp label="Amount ($)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/>
            <Span2><TA label="Description / Justification" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={save}>{form.id?"Save Changes":"Submit Change Order"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {filtered.length===0&&form===null&&<Card><EmptyState msg="No change orders found."/></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(co=>{
          const p=projects.find(x=>x.id===co.projectId);
          const cc=CAT_COLOR[co.category]||C.textSub;
          return (
            <Card key={co.id} style={{border:`1px solid ${co.status==="Pending"?C.amberB:C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.accent}}>{co.number}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{co.title}</span>
                    <Badge s={co.status}/>
                    <span style={{fontSize:11,fontWeight:600,color:cc,background:cc+"18",padding:"2px 9px",borderRadius:4}}>{co.category}</span>
                  </div>
                  <div style={{fontSize:12,color:C.textSub}}>{!projectId&&p?.name+" · "}{co.date} · Requested by {co.requestedBy}</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:C.accent,whiteSpace:"nowrap",marginLeft:16}}>+{fmt(co.amount)}</div>
              </div>
              {co.description&&<div style={{fontSize:13,color:C.textMid,lineHeight:1.65,marginBottom:12}}>{co.description}</div>}
              <div style={{display:"flex",gap:8,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                {co.status==="Pending"&&<><Btn sm onClick={()=>setStatus(co.id,"Approved")}><Ic d={I.check} s={12}/> Approve</Btn><Btn danger sm onClick={()=>setStatus(co.id,"Rejected")}><Ic d={I.x} s={12}/> Reject</Btn></>}
                {co.status!=="Pending"&&<Btn v="secondary" sm onClick={()=>setStatus(co.id,"Pending")}>Revert to Pending</Btn>}
                <EditBtn onClick={()=>setForm({...co})}/>
                <DeleteBtn onClick={()=>setDelId(co.id)}/>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── DAILY LOGS ───────────────────────────────────────────────────────────────
const DailyLogs = ({projectId,logs,setLogs,projects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filterProj,setFilterProj] = useState(projectId||"All");
  useUnsavedWarning(form !== null);
  const items = projectId ? logs.filter(l=>l.projectId===projectId) : (filterProj==="All"?logs:logs.filter(l=>l.projectId===filterProj));

  const save = () => {
    if(!form.notes||!form.projectId) return;
    if(form.id) {
      setLogs(logs.map(l=>l.id===form.id?{...form,crew:parseInt(form.crew)||0}:l));
    } else {
      setLogs([{...form,id:uid(),_isNew:true,projectId:form.projectId,crew:parseInt(form.crew)||0,photos:0},...logs]);
    }
    setForm(null);
    toast.success(form.id?"Log updated":"Field log saved");
  };

  const del = () => { setLogs(logs.filter(l=>l.id!==delId)); setDelId(null); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this log entry?" onOk={del} onCancel={()=>setDelId(null)}/>}

      {!projectId&&<PageHead eyebrow="Field Reports" title="Daily Logs" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",date:today(),author:"",weather:"",crew:"",notes:""})}><Ic d={I.plus} s={14}/> New Log</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Field Logs</div><Btn sm onClick={()=>setForm({projectId,date:today(),author:"",weather:"",crew:"",notes:""})}><Ic d={I.plus} s={13}/> New Log</Btn></div>}

      {!projectId&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={()=>setFilterProj("All")} style={{background:filterProj==="All"?C.accent:C.surface,color:filterProj==="All"?"#fff":C.textMid,border:`1px solid ${filterProj==="All"?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>All Projects</button>
          {projects.filter(p=>p.status==="Active").map(p=>(
            <button key={p.id} onClick={()=>setFilterProj(String(p.id))} style={{background:filterProj===String(p.id)?C.accent:C.surface,color:filterProj===String(p.id)?"#fff":C.textMid,border:`1px solid ${filterProj===String(p.id)?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{p.name.split(" ").slice(0,2).join(" ")}</button>
          ))}
        </div>
      )}

      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} Daily Log</div>
          <Grid cols="1fr 1fr" gap={12}>
            {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
            <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <Inp label="Foreman / Author" value={form.author} onChange={e=>setForm({...form,author:e.target.value})} placeholder="Name"/>
            <Inp label="Weather & Temp" value={form.weather} onChange={e=>setForm({...form,weather:e.target.value})} placeholder="e.g. Clear 72°F"/>
            <Inp label="Crew Size" type="number" value={form.crew} onChange={e=>setForm({...form,crew:e.target.value})}/>
            <Span2><TA label="Field Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={4}/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={save}>{form.id?"Save Changes":"Save Log"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {items.length===0&&form===null&&<Card><EmptyState msg="No log entries yet." action={<Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",date:today(),author:"",weather:"",crew:"",notes:""})}>+ New Log</Btn>}/></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {items.map(log=>{
          const p=projects.find(x=>x.id===log.projectId);
          return (
            <Card key={log.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  {!projectId&&<div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{p?.name}</div>}
                  <div style={{fontSize:12,color:C.textSub}}>{fmtDate(log.date)} · {log.author}</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{background:C.accentL,borderRadius:4,padding:"8px 14px",textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:700,color:C.accent}}>{log.crew}</div>
                    <div style={{fontSize:9,color:C.textMuted,textTransform:"uppercase",fontWeight:600}}>Crew</div>
                  </div>
                  <EditBtn onClick={()=>setForm({...log})}/>
                  <DeleteBtn onClick={()=>setDelId(log.id)}/>
                </div>
              </div>
              <div style={{fontSize:13,color:C.textMid,lineHeight:1.7,borderLeft:`3px solid ${C.accentB}`,paddingLeft:14}}>{log.notes}</div>
              {log.weather&&<div style={{marginTop:10,fontSize:11,color:C.textSub,display:"flex",alignItems:"center",gap:5}}><Ic d={I.sun} s={12} stroke={C.textMuted}/>{log.weather}</div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── SUB BIDS ─────────────────────────────────────────────────────────────────
const SubBids = ({projectId,bids,setBids,projects}) => {
  const [selectedId,setSelectedId] = useState(null);
  const [pkgForm,setPkgForm] = useState(null);
  const [bidForm,setBidForm] = useState(null);
  const [delPkgId,setDelPkgId] = useState(null);
  const [delBidId,setDelBidId] = useState(null);
  useUnsavedWarning(pkgForm !== null || bidForm !== null);
  const items = projectId ? bids.filter(b=>b.projectId===projectId) : bids;
  const pkg = selectedId ? bids.find(b=>b.id===selectedId) : null;

  const savePkg = () => {
    if(!pkgForm.trade) return;
    const projId=pkgForm.projectId||projectId;
    if(pkgForm.id){setBids(bids.map(b=>b.id===pkgForm.id?{...pkgForm,projectId:projId||pkgForm.projectId}:b));}
    else{setBids([...bids,{...pkgForm,id:uid(),_isNew:true,projectId:projId,status:"Open",bids:[]}]);}
    setPkgForm(null);
  };

  const saveBid = () => {
    if(!bidForm.subName||!bidForm.amount) return;
    if(bidForm.id){setBids(bids.map(b=>b.id===selectedId?{...b,bids:b.bids.map(x=>x.subId===bidForm.id?{...bidForm,amount:parseFloat(bidForm.amount)}:x)}:b));}
    else{setBids(bids.map(b=>b.id===selectedId?{...b,bids:[...b.bids,{...bidForm,subId:uid(),_isNew:true,amount:parseFloat(bidForm.amount),submitted:today(),awarded:false}]}:b));}
    setBidForm(null);
  };

  const award = (subId) => setBids(bids.map(b=>b.id===selectedId?{...b,status:"Awarded",bids:b.bids.map(x=>({...x,awarded:x.subId===subId}))}:b));
  const delPkg = () => { setBids(bids.filter(b=>b.id!==delPkgId)); setDelPkgId(null); if(selectedId===delPkgId)setSelectedId(null); };
  const delBid = () => { setBids(bids.map(b=>b.id===selectedId?{...b,bids:b.bids.filter(x=>x.subId!==delBidId)}:b)); setDelBidId(null); };

  // Package detail
  if(pkg){
    const sorted=[...pkg.bids].sort((a,b)=>a.amount-b.amount);
    const low=sorted[0]?.amount||0;
    const proj=projects.find(p=>p.id===pkg.projectId);
    return (
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {delBidId&&<Confirm msg="Remove this bid?" onOk={delBid} onCancel={()=>setDelBidId(null)}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Btn v="secondary" sm onClick={()=>setSelectedId(null)}><Ic d={I.back} s={13}/> Back</Btn>
            <div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{pkg.trade} — {proj?.name}</div><div style={{fontSize:12,color:C.textSub}}>{pkg.scope} · Due {fmtDate(pkg.dueDate)}</div></div>
            <Badge s={pkg.status}/>
          </div>
          <Btn sm onClick={()=>setBidForm({subName:"",amount:"",notes:""})}><Ic d={I.plus} s={13}/> Add Bid</Btn>
        </div>
        {sorted.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          <Stat label="Low Bid" value={fmt(sorted[0].amount)} color={C.green} icon="dollar"/>
          <Stat label="Bids Received" value={sorted.length} color={C.blue} icon="bids"/>
          {sorted.length>1&&<Stat label="Spread (high vs low)" value={`${Math.round(((sorted[sorted.length-1].amount-low)/low)*100)}%`} color={C.amber} icon="trend"/>}
        </div>}
        {bidForm!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Add Bid</div>
          <Grid cols="1fr 1fr" gap={12}>
            <Inp label="Subcontractor / Company" value={bidForm.subName} onChange={e=>setBidForm({...bidForm,subName:e.target.value})} placeholder="Company name"/>
            <Inp label="Bid Amount ($)" type="number" value={bidForm.amount} onChange={e=>setBidForm({...bidForm,amount:e.target.value})}/>
            <Span2><Inp label="Notes / Exclusions" value={bidForm.notes} onChange={e=>setBidForm({...bidForm,notes:e.target.value})}/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={saveBid}>Submit Bid</Btn><Btn v="secondary" onClick={()=>setBidForm(null)}>Cancel</Btn></div>
        </Card>}
        {sorted.length===0&&!bidForm&&<Card><EmptyState msg="No bids yet. Click 'Add Bid' to enter competing bids." action={<Btn sm onClick={()=>setBidForm({subName:"",amount:"",notes:""})}>+ Add First Bid</Btn>}/></Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {sorted.map((bid,idx)=>{
            const isLow=idx===0; const spread=low?Math.round(((bid.amount-low)/low)*100):0;
            return <Card key={bid.subId} style={{background:bid.awarded?C.greenL:C.surface,border:`1px solid ${bid.awarded?C.greenB:isLow?C.accentB:C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3,display:"flex",alignItems:"center",gap:8}}>
                    {bid.subName}
                    {isLow&&<span style={{fontSize:10,background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,padding:"2px 8px",borderRadius:4,fontWeight:700}}>LOW BID</span>}
                    {bid.awarded&&<span style={{fontSize:10,background:C.green,color:"#fff",padding:"2px 8px",borderRadius:4,fontWeight:700}}>AWARDED</span>}
                  </div>
                  <div style={{fontSize:12,color:C.textSub}}>{bid.submitted}{bid.notes&&` · ${bid.notes}`}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:700,color:isLow?C.green:C.text}}>{fmt(bid.amount)}</div>
                    {!isLow&&<div style={{fontSize:11,color:C.red,fontWeight:600}}>+{spread}% over low</div>}
                  </div>
                  {!bid.awarded&&pkg.status!=="Awarded"&&<Btn sm onClick={()=>award(bid.subId)}><Ic d={I.award} s={13}/> Award</Btn>}
                  <DeleteBtn onClick={()=>setDelBidId(bid.subId)}/>
                </div>
              </div>
            </Card>;
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delPkgId&&<Confirm msg="Delete this bid package and all bids?" onOk={delPkg} onCancel={()=>setDelPkgId(null)}/>}
      {!projectId&&<PageHead eyebrow="Subcontractor Management" title="Sub Bids" action={<Btn onClick={()=>setPkgForm({projectId:projects[0]?.id||"",trade:"",scope:"",dueDate:""})}><Ic d={I.plus} s={14}/> New Package</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Bid Packages</div><Btn sm onClick={()=>setPkgForm({trade:"",scope:"",dueDate:""})}><Ic d={I.plus} s={13}/> New Package</Btn></div>}
      {pkgForm!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>New Bid Package</div>
        <Grid cols="1fr 1fr" gap={12}>
          {!projectId&&<Sel label="Project" value={pkgForm.projectId} onChange={e=>setPkgForm({...pkgForm,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
          <Inp label="Trade" value={pkgForm.trade} onChange={e=>setPkgForm({...pkgForm,trade:e.target.value})} placeholder="e.g. Electrical, Plumbing, HVAC"/>
          <Inp label="Bid Due Date" type="date" value={pkgForm.dueDate} onChange={e=>setPkgForm({...pkgForm,dueDate:e.target.value})}/>
          <Span2><TA label="Scope Description" value={pkgForm.scope} onChange={e=>setPkgForm({...pkgForm,scope:e.target.value})} rows={2}/></Span2>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={savePkg}>Create Package</Btn><Btn v="secondary" onClick={()=>setPkgForm(null)}>Cancel</Btn></div>
      </Card>}
      {items.length===0&&!pkgForm&&<Card><EmptyState msg="No bid packages yet." action={<Btn sm onClick={()=>setPkgForm({projectId:projects[0]?.id||"",trade:"",scope:"",dueDate:""})}>+ New Package</Btn>}/></Card>}
      <Table heads={[{l:"Trade"},{l:"Project"},{l:"Scope"},{l:"Due Date"},{l:"Bids",r:true},{l:"Status"},{l:"Low Bid",r:true},{l:""}]}>
        {items.map(pkg=>{
          const p=projects.find(x=>x.id===pkg.projectId);
          const sorted=[...pkg.bids].sort((a,b)=>a.amount-b.amount);
          return <TR key={pkg.id} onClick={()=>setSelectedId(pkg.id)}>
            <td style={{padding:"12px 14px",fontWeight:700,fontSize:13,color:C.text}}>{pkg.trade}</td>
            <TD muted>{!projectId&&p?.name?.substring(0,20)}</TD>
            <td style={{padding:"12px 14px",fontSize:12,color:C.textSub,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pkg.scope||"—"}</div></td>
            <TD muted>{fmtDate(pkg.dueDate)}</TD>
            <TD right bold>{pkg.bids.length}</TD>
            <td style={{padding:"12px 14px"}}><Badge s={pkg.status}/></td>
            <TD right color={C.green}>{sorted[0]?fmt(sorted[0].amount):"—"}</TD>
            <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}><DeleteBtn onClick={()=>setDelPkgId(pkg.id)}/></td>
          </TR>;
        })}
      </Table>
    </div>
  );
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
const Documents = ({projectId,docs,setDocs,projects}) => {
  const [form,setForm] = useState(null);
  useUnsavedWarning(form !== null);
  const [delId,setDelId] = useState(null);
  const [filterType,setFilterType] = useState("All");
  const [uploading,setUploading] = useState(false);
  const fileRef = useRef(null);
  const items = projectId ? docs.filter(d=>d.projectId===projectId) : docs;
  const filtered = filterType==="All"?items:items.filter(d=>d.type===filterType);
  const TYPES = ["Contract","Plans","Permit","Engineering","Scope","Submittal","Inspection","RFI","Proposal","Other"];
  const TYPE_COLOR = {Contract:C.accent,Plans:C.purple,Permit:C.green,Engineering:C.blue,Scope:C.amber,Submittal:C.blue,Inspection:C.green,RFI:C.red,Proposal:C.amber,Other:C.textSub};
  const TYPE_BG = {Contract:C.accentL,Plans:C.purpleL,Permit:C.greenL,Engineering:C.blueL,Scope:C.amberL,Submittal:C.blueL,Inspection:C.greenL,RFI:C.redL,Proposal:C.amberL,Other:C.bg};

  const save = async () => {
    if(!form.name) { toast.error("Document name is required"); return; }
    if(!form.projectId && !projectId) { toast.error("Please select a project"); return; }
    setUploading(true);
    try {
      let fileUrl = form.fileUrl || "";
      if(form._file) {
        const id = form.id || uid();
        const ext = form._file.name.split(".").pop();
        const path = `${id}.${ext}`;
        const url = await uploadFile(form._file, "documents", path);
        if(url) { fileUrl = url; toast.success("File uploaded successfully"); }
        else { toast.error("File upload failed — saving metadata only"); }
      }
      const rec = {...form, id: form.id || uid(), fileUrl, projectId: form.projectId||projectId, uploader: form.uploader || "", date: form.date||today()};
      delete rec._file; delete rec._fileName;
      if(form.id){setDocs(docs.map(d=>d.id===form.id?rec:d));}
      else{setDocs([...docs,{...rec, _isNew: true}]);}
      toast.success(form.id ? "Document updated" : "Document added");
    } catch(e) { toast.error("Failed to save document: " + e.message); }
    setUploading(false);
    setForm(null);
  };
  const del = () => { setDocs(docs.filter(d=>d.id!==delId)); setDelId(null); toast.success("Document deleted"); };
  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setForm(f => ({...f, _file: file, _fileName: file.name, name: f.name || file.name}));
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this document record?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {!projectId&&<PageHead eyebrow="Files & Plans" title="Documents" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",name:"",type:"Contract",date:today(),notes:"",fileUrl:""})}><Ic d={I.plus} s={14}/> Add Document</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Documents</div><Btn sm onClick={()=>setForm({name:"",type:"Contract",date:today(),notes:"",fileUrl:""})}><Ic d={I.plus} s={13}/> Add</Btn></div>}

      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {["All",...TYPES].map(t=><button key={t} onClick={()=>setFilterType(t)} style={{background:filterType===t?(TYPE_BG[t]||C.accentL):C.surface,color:filterType===t?(TYPE_COLOR[t]||C.accent):C.textMid,border:`1px solid ${filterType===t?(TYPE_COLOR[t]||C.accent)+"40":C.border}`,borderRadius:4,padding:"5px 12px",fontSize:12,fontWeight:filterType===t?600:400,cursor:"pointer"}}>{t}</button>)}
      </div>

      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{form.id?"Edit":"Add"} Document</div>
        <Grid cols="1fr 1fr" gap={12}>
          <Span2>
            <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginBottom:4}}>Upload File</div>
            <input ref={fileRef} type="file" onChange={onFileSelect} style={{display:"none"}}/>
            <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${form._fileName||form.fileUrl?C.green+"60":C.border}`,borderRadius:4,padding:"14px 16px",cursor:"pointer",background:form._fileName||form.fileUrl?C.greenL:C.bg,display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
              <div style={{width:32,height:32,borderRadius:4,background:form._fileName||form.fileUrl?C.greenL:C.surface,display:"flex",alignItems:"center",justifyContent:"center",color:form._fileName||form.fileUrl?C.green:C.textMuted}}>
                <Ic d={form._fileName||form.fileUrl?I.check:I.plus} s={14}/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:form._fileName||form.fileUrl?C.green:C.textMid}}>{form._fileName||form.fileUrl?"File selected":"Click to choose a file"}</div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:1}}>{form._fileName||(form.fileUrl?"Existing file attached":"PDF, Word, Excel, images, CAD files, etc.")}</div>
              </div>
            </div>
          </Span2>
          <Span2><Inp label="Document / File Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Webb – Executed Contract.pdf"/></Span2>
          {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
          <Sel label="Document Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={TYPES}/>
          <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          <Span2><Inp label="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Span2>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save} style={{opacity:uploading?0.6:1}}>{uploading?"Uploading...":(form.id?"Save Changes":"Add Document")}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}

      {filtered.length===0&&!form&&<Card><EmptyState msg="No documents found." action={<Btn sm onClick={()=>setForm({projectId:projects[0]?.id||"",name:"",type:"Contract",date:today(),notes:"",fileUrl:""})}>+ Add Document</Btn>}/></Card>}
      <Table heads={[{l:"Document"},{l:"Type"},...(!projectId?[{l:"Project"}]:[]),{l:"Date"},{l:"Uploaded By"},{l:""}]}>
        {filtered.map(doc=>{
          const p=projects.find(x=>x.id===doc.projectId);
          const tc=TYPE_COLOR[doc.type]||C.textSub; const tb=TYPE_BG[doc.type]||C.bg;
          return <TR key={doc.id}>
            <td style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,background:tb,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",color:tc,flexShrink:0}}><Ic d={I.docs} s={13}/></div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{doc.fileUrl?<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{color:C.text,textDecoration:"none",borderBottom:`1px solid ${C.accent}40`}}>{doc.name}</a>:doc.name}</div>
                  {doc.notes&&<div style={{fontSize:11,color:C.textMuted,marginTop:1}}>{doc.notes}</div>}
                  {doc.fileUrl&&<div style={{fontSize:10,color:C.green,marginTop:2,display:"flex",alignItems:"center",gap:3}}><Ic d={I.check} s={9}/> File attached</div>}
                </div>
              </div>
            </td>
            <td style={{padding:"12px 14px"}}><span style={{fontSize:11,fontWeight:600,color:tc,background:tb,padding:"3px 9px",borderRadius:5}}>{doc.type}</span></td>
            {!projectId&&<TD muted>{p?.name?.substring(0,20)||"—"}</TD>}
            <TD muted>{fmtDate(doc.date)}</TD>
            <TD muted>{doc.uploader}</TD>
            <td style={{padding:"12px 14px"}}><div style={{display:"flex",gap:6}}>
              {doc.fileUrl&&<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:C.greenL,color:C.green,border:"none",cursor:"pointer"}} title="Download"><Ic d={I.docs} s={12}/></a>}
              <EditBtn onClick={()=>setForm({...doc})}/><DeleteBtn onClick={()=>setDelId(doc.id)}/>
            </div></td>
          </TR>;
        })}
      </Table>
    </div>
  );
};

// ─── PHOTOS ───────────────────────────────────────────────────────────────────
const Photos = ({projectId,photos,setPhotos,projects}) => {
  const [form,setForm] = useState(null);
  useUnsavedWarning(form !== null);
  const [lightbox,setLightbox] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filterTag,setFilterTag] = useState("All");
  const [uploading,setUploading] = useState(false);
  const photoRef = useRef(null);
  const items = projectId ? photos.filter(p=>p.projectId===projectId) : photos;
  const filtered = filterTag==="All"?items:items.filter(p=>p.tag===filterTag);
  const TAGS = ["Progress","Milestone","Issue","Before","After","Inspection","Material","Complete"];
  const TAG_COLOR = {Progress:C.blue,Milestone:C.green,Issue:C.red,Before:C.purple,After:C.green,Inspection:C.amber,Material:C.accent,Complete:C.green};
  const TAG_BG = {Progress:C.blueL,Milestone:C.greenL,Issue:C.redL,Before:C.purpleL,After:C.greenL,Inspection:C.amberL,Material:C.accentL,Complete:C.greenL};
  const TAG_ICON = {Progress:"proj",Milestone:"check",Before:"photos",After:"home",Inspection:"logs",Material:"budget",Complete:"check",Issue:"alert"};
  const COLORS = ["#E8F4F8","#F0F8E8","#FEF3EC","#F4F0FD","#F0FBF5","#FDF8EE","#FEF2F2","#EEF3FD"];

  const save = async () => {
    if(!form.caption) { toast.error("Caption is required"); return; }
    if(!form.projectId && !projectId) { toast.error("Please select a project"); return; }
    setUploading(true);
    try {
      let fileUrl = form.fileUrl || "";
      if(form._file) {
        const id = form.id || uid();
        const ext = form._file.name.split(".").pop();
        const path = `${id}.${ext}`;
        const url = await uploadFile(form._file, "photos", path);
        if(url) { fileUrl = url; toast.success("Photo uploaded successfully"); }
        else { toast.error("Photo upload failed — saving metadata only"); }
      }
      const rec = {...form, id: form.id || uid(), fileUrl, projectId: form.projectId||projectId, emoji:TAG_ICON[form.tag]||"photos", color:COLORS[Math.floor(Math.random()*COLORS.length)]};
      delete rec._file; delete rec._preview;
      if(form.id){setPhotos(photos.map(p=>p.id===form.id?rec:p));}
      else{setPhotos([{...rec, _isNew: true},...photos]);}
      toast.success(form.id ? "Photo updated" : "Photo added");
    } catch(e) { toast.error("Failed to save photo: " + e.message); }
    setUploading(false);
    setForm(null);
  };
  const del = () => { setPhotos(photos.filter(p=>p.id!==delId)); setDelId(null); setLightbox(null); toast.success("Photo deleted"); };
  const lbPhoto = lightbox ? photos.find(p=>p.id===lightbox) : null;
  const onPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const preview = URL.createObjectURL(file);
    setForm(f => ({...f, _file: file, _preview: preview}));
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this photo?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {lbPhoto&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:6,overflow:"hidden",maxWidth:540,width:"100%"}}>
            {lbPhoto.fileUrl
              ? <img src={lbPhoto.fileUrl} alt={lbPhoto.caption} style={{width:"100%",height:320,objectFit:"cover",display:"block"}}/>
              : <div style={{background:C.bg,height:260,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I[lbPhoto.emoji]||I.photos} s={48} stroke={C.textMuted}/></div>}
            <div style={{padding:22}}>
              <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:6}}>{lbPhoto.caption}</div>
              <div style={{fontSize:13,color:C.textSub,marginBottom:16}}>{projects.find(p=>p.id===lbPhoto.projectId)?.name} · {fmtDate(lbPhoto.date)} · {lbPhoto.author}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:600,color:TAG_COLOR[lbPhoto.tag]||C.textSub,background:TAG_BG[lbPhoto.tag]||C.bg,padding:"3px 12px",borderRadius:3}}>{lbPhoto.tag}</span>
                <div style={{display:"flex",gap:8}}>
                  {lbPhoto.fileUrl&&<a href={lbPhoto.fileUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}><Btn v="secondary" sm>View Full Size</Btn></a>}
                  <Btn danger sm onClick={()=>setDelId(lbPhoto.id)}><Ic d={I.trash} s={13}/> Delete</Btn><Btn v="secondary" sm onClick={()=>setLightbox(null)}>Close</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!projectId&&<PageHead eyebrow="Job Site Documentation" title="Photo Gallery" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",caption:"",tag:"Progress",date:today(),author:"",fileUrl:""})}><Ic d={I.plus} s={14}/> Add Photo</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Photos</div><Btn sm onClick={()=>setForm({caption:"",tag:"Progress",date:today(),author:"",fileUrl:""})}><Ic d={I.plus} s={13}/> Add Photo</Btn></div>}

      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {["All",...TAGS].map(t=><button key={t} onClick={()=>setFilterTag(t)} style={{background:filterTag===t?(TAG_BG[t]||C.accentL):C.surface,color:filterTag===t?(TAG_COLOR[t]||C.accent):C.textMid,border:`1px solid ${filterTag===t?(TAG_COLOR[t]||C.accent)+"40":C.border}`,borderRadius:4,padding:"5px 12px",fontSize:12,fontWeight:filterTag===t?600:400,cursor:"pointer"}}>{t}</button>)}
      </div>

      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{form.id?"Edit":"Add"} Photo</div>
        <Grid cols="1fr 1fr" gap={12}>
          <Span2>
            <div style={{fontSize:11,fontWeight:600,color:C.textSub,marginBottom:4}}>Upload Photo</div>
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoSelect} style={{display:"none"}}/>
            <div onClick={()=>photoRef.current?.click()} style={{border:`2px dashed ${form._preview||form.fileUrl?C.green+"60":C.border}`,borderRadius:4,cursor:"pointer",overflow:"hidden",transition:"all 0.15s"}}>
              {(form._preview||form.fileUrl)
                ? <img src={form._preview||form.fileUrl} alt="Preview" style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>
                : <div style={{padding:"24px 16px",textAlign:"center",background:C.bg}}>
                    <div style={{marginBottom:6}}><Ic d={I.photos} s={24} stroke={C.textMuted}/></div>
                    <div style={{fontSize:12,fontWeight:600,color:C.textMid}}>Click to upload a photo</div>
                    <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>JPG, PNG, HEIC, WebP</div>
                  </div>}
            </div>
          </Span2>
          {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
          <Sel label="Tag" value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} options={TAGS}/>
          <Inp label="Caption" value={form.caption} onChange={e=>setForm({...form,caption:e.target.value})} placeholder="Describe what this shows"/>
          <Inp label="Photographer" value={form.author} onChange={e=>setForm({...form,author:e.target.value})}/>
          <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save} style={{opacity:uploading?0.6:1}}>{uploading?"Uploading...":(form.id?"Save":"Add Photo")}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}

      {filtered.length===0&&!form&&<Card><EmptyState msg="No photos found." action={<Btn sm onClick={()=>setForm({projectId:projects[0]?.id||"",caption:"",tag:"Progress",date:today(),author:"",fileUrl:""})}>+ Add Photo</Btn>}/></Card>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {filtered.map(p=>(
          <div key={p.id} onClick={()=>setLightbox(p.id)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden",cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}>
            {p.fileUrl
              ? <img src={p.fileUrl} alt={p.caption} style={{width:"100%",height:130,objectFit:"cover",display:"block"}}/>
              : <div style={{background:C.bg,height:130,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I[p.emoji]||I.photos} s={28} stroke={C.textMuted}/></div>}
            <div style={{padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:4,lineHeight:1.3}}>{p.caption}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:10,fontWeight:600,color:TAG_COLOR[p.tag]||C.textSub,background:TAG_BG[p.tag]||C.bg,padding:"2px 7px",borderRadius:4}}>{p.tag}</span>
                <span style={{fontSize:10,color:C.textMuted}}>{p.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── COMPANY SETTINGS ─────────────────────────────────────────────────────────
const CompanySettings = ({settings,onSave}) => {
  const [form,setForm] = useState({...settings});
  const [logoUploading,setLogoUploading] = useState(false);
  const logoRef = useRef(null);
  useUnsavedWarning(JSON.stringify(form) !== JSON.stringify(settings));

  const onLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => { setForm(f=>({...f,logo:ev.target.result})); setLogoUploading(false); };
    reader.readAsDataURL(file);
  };

  const save = () => { onSave(form); toast.success("Company settings saved"); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageHead eyebrow="Configuration" title="Company Settings"/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Left column */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Company Logo</div>
            <input ref={logoRef} type="file" accept="image/*" onChange={onLogoSelect} style={{display:"none"}}/>
            <div onClick={()=>logoRef.current?.click()} style={{border:`2px dashed ${form.logo?C.green+"60":C.border}`,borderRadius:4,cursor:"pointer",overflow:"hidden",minHeight:120,display:"flex",alignItems:"center",justifyContent:"center",background:form.logo?C.greenL:C.bg,transition:"all 0.15s"}}>
              {form.logo
                ? <img src={form.logo} alt="Logo" style={{maxHeight:100,maxWidth:"100%",objectFit:"contain",padding:8}}/>
                : <div style={{textAlign:"center",padding:24}}>
                    <div style={{marginBottom:6}}><Ic d={I.hard} s={28} stroke={C.textMuted}/></div>
                    <div style={{fontSize:12,fontWeight:600,color:C.textMid}}>Click to upload logo</div>
                    <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>PNG, JPG, SVG</div>
                  </div>}
            </div>
            {form.logo&&<button onClick={()=>setForm(f=>({...f,logo:""}))} style={{marginTop:8,fontSize:11,color:C.red,background:"none",border:"none",cursor:"pointer",padding:0}}>Remove logo</button>}
          </Card>

          <Card>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Estimate Defaults</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Inp label="Default Markup %" type="number" value={form.defaultMarkup} onChange={e=>setForm({...form,defaultMarkup:parseFloat(e.target.value)||0})} placeholder="20"/>
              <TA label="Default Payment Terms" value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} rows={3} placeholder="e.g. Net 30. Payment due within 30 days..."/>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Company Information</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Inp label="Company Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="My Construction Co."/>
              <Inp label="License Number" value={form.license} onChange={e=>setForm({...form,license:e.target.value})} placeholder="Contractor License #"/>
              <Inp label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(555) 000-0000"/>
              <Inp label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="info@mycompany.com"/>
              <Inp label="Website" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} placeholder="www.mycompany.com"/>
            </div>
          </Card>

          <Card>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Business Address</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Inp label="Street Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="123 Main Street"/>
              <Grid cols="1fr 1fr" gap={12}>
                <Inp label="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="City"/>
                <Inp label="State" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} placeholder="CA"/>
                <Inp label="ZIP" value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})} placeholder="90210"/>
              </Grid>
            </div>
          </Card>
        </div>
      </div>

      <div><Btn onClick={save}>Save Settings</Btn></div>
    </div>
  );
};

// ─── CONTACTS ────────────────────────────────────────────────────────────────
const Contacts = ({contacts,setContacts}) => {
  const [form,setForm] = useState(null);
  useUnsavedWarning(form !== null);
  const [delId,setDelId] = useState(null);
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("All");
  const TYPES = ["Client","Subcontractor","Vendor","Architect","Engineer","Inspector"];
  const TYPE_COLOR = {Client:C.blue,Subcontractor:C.green,Vendor:C.purple,Architect:C.amber,Engineer:C.accent,Inspector:C.red};
  const TYPE_BG = {Client:C.blueL,Subcontractor:C.greenL,Vendor:C.purpleL,Architect:C.amberL,Engineer:C.accentL,Inspector:C.redL};

  const filtered = contacts.filter(c=>
    (filter==="All"||c.type===filter)&&
    (c.name.toLowerCase().includes(search.toLowerCase())||c.company?.toLowerCase().includes(search.toLowerCase())||c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const save = () => {
    if(!form.name) return;
    if(form.id){setContacts(contacts.map(c=>c.id===form.id?form:c));}
    else{setContacts([...contacts,{...form,id:uid(),_isNew:true,projects:[]}]);}
    setForm(null);
    toast.success(form.id?"Contact updated":"Contact added");
  };
  const del = () => { setContacts(contacts.filter(c=>c.id!==delId)); setDelId(null); toast("Contact deleted",{}); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {delId&&<Confirm msg="Delete this contact?" onOk={del} onCancel={()=>setDelId(null)}/>}
      <PageHead eyebrow="People & Companies" title="Contacts" action={<Btn onClick={()=>setForm({name:"",company:"",type:"Client",email:"",phone:"",city:""})}><Ic d={I.plus} s={14}/> Add Contact</Btn>}/>

      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} Contact</div>
        <Grid cols="1fr 1fr" gap={12}>
          <Inp label="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <Inp label="Company" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/>
          <Inp label="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
          <Inp label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
          <Inp label="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
          <Sel label="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={TYPES}/>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={save}>{form.id?"Save Changes":"Add Contact"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}

      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMuted}}><Ic d={I.search} s={15}/></div>
          <input placeholder="Search name, company, email..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,paddingLeft:36}}/>
        </div>
        <div style={{display:"flex",gap:5}}>
          {["All",...TYPES].map(t=><button key={t} onClick={()=>setFilter(t)} style={{background:filter===t?(TYPE_BG[t]||C.accentL):C.surface,color:filter===t?(TYPE_COLOR[t]||C.accent):C.textMid,border:`1px solid ${filter===t?(TYPE_COLOR[t]||C.accent)+"40":C.border}`,borderRadius:4,padding:"6px 12px",fontSize:12,fontWeight:filter===t?600:400,cursor:"pointer"}}>{t}</button>)}
        </div>
      </div>

      <Table heads={[{l:"Name"},{l:"Type"},{l:"Company"},{l:"Email"},{l:"Phone"},{l:"City"},{l:""}]}>
        {filtered.map(c=>{
          const tc=TYPE_COLOR[c.type]||C.accent; const tb=TYPE_BG[c.type]||C.accentL;
          return <TR key={c.id}>
            <td style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:tb,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:tc,flexShrink:0}}>{c.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{c.name}</span>
              </div>
            </td>
            <td style={{padding:"12px 14px"}}><span style={{fontSize:11,fontWeight:600,color:tc,background:tb,padding:"3px 10px",borderRadius:3}}>{c.type}</span></td>
            <TD muted>{c.company||"—"}</TD>
            <td style={{padding:"12px 14px",fontSize:13,color:C.blue}}>{c.email||"—"}</td>
            <TD muted>{c.phone||"—"}</TD>
            <TD muted>{c.city||"—"}</TD>
            <td style={{padding:"12px 14px"}}><div style={{display:"flex",gap:6}}><EditBtn onClick={()=>setForm({...c})}/><DeleteBtn onClick={()=>setDelId(c.id)}/></div></td>
          </TR>;
        })}
        {filtered.length===0&&<tr><td colSpan={7}><EmptyState msg="No contacts found."/></td></tr>}
      </Table>
    </div>
  );
};

// ─── PROJECTS (with full detail + tabs) ──────────────────────────────────────
const PHASES = ["Pre-Construction","Demo & Site Prep","Foundation","Framing","MEP Rough-In","Insulation","Drywall","Finishes","Punch List","Closeout"];

const Projects = ({projects,setProjects,estimates,setEstimates,invoices,setInvoices,budgetItems,setBudgetItems,cos,setCos,logs,setLogs,bids,setBids,docs,setDocs,photos,setPhotos,rfis,setRfis,punchList,setPunchList,pos,setPOs,meetings,setMeetings,companySettings,initialId}) => {
  const [filter,setFilter] = useState("All");
  const [search,setSearch] = useState("");
  const [selectedId,setSelectedId] = useState(null);
  const [activeTab,setActiveTab] = useState("overview");
  const [form,setForm] = useState(null);
  const [editMode,setEditMode] = useState(false);
  const [editProj,setEditProj] = useState(null);
  const [delId,setDelId] = useState(null);

  // Open project from dashboard nav — only fires once when initialId is set
  useEffect(()=>{ if(initialId) setSelectedId(initialId); },[initialId]);

  const STATUSES = ["All","Lead","Estimate","Active","On Hold","Complete"];
  const filtered = projects
    .filter(p=>filter==="All"||p.status===filter)
    .filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())||p.client.toLowerCase().includes(search.toLowerCase())||p.address.toLowerCase().includes(search.toLowerCase()));

  const createProject = () => {
    if(!form.name||!form.client) return;
    const p={...form,id:uid(),_isNew:true,value:parseFloat(form.value)||0,spent:0,progress:0};
    setProjects([...projects,p]);
    setSelectedId(p.id);
    setActiveTab("overview");
    setForm(null);
    toast.success("Project created");
  };

  const saveEdit = () => {
    setProjects(projects.map(p=>p.id===editProj.id?{...editProj,value:parseFloat(editProj.value)||0,progress:parseInt(editProj.progress)||0}:p));
    setEditMode(false);
    toast.success("Project saved");
  };

  const del = () => { setProjects(projects.filter(p=>p.id!==delId)); setDelId(null); if(selectedId===delId)setSelectedId(null); toast("Project deleted",{}); };

  // ── Project Detail ──
  if(selectedId){
    const p=projects.find(x=>x.id===selectedId);
    if(!p) return null; // don't reset — project may not be loaded yet
    const budget_pct=p.value?Math.round((p.spent/p.value)*100):0;
    const projEsts=estimates.filter(e=>e.projectId===p.id);
    const projInvs=invoices.filter(i=>i.projectId===p.id);
    const projCOs=cos.filter(c=>c.projectId===p.id);
    const projBudget=budgetItems.filter(b=>b.projectId===p.id);
    const approvedCOs=projCOs.filter(c=>c.status==="Approved").reduce((s,c)=>s+c.amount,0);
    const TABS = ["overview","budget","estimates","invoices","change orders","rfis","purchase orders","punch list","sub bids","meetings","daily logs","documents","photos"];

    const isMobile = typeof window!=="undefined"&&window.innerWidth<=768;

    return (
      <div style={{display:"flex",flexDirection:"column",gap:isMobile?14:20}}>
        {delId&&<Confirm msg={`Delete "${p.name}"? All linked data will be removed.`} onOk={del} onCancel={()=>setDelId(null)}/>}

        {/* Header */}
        <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,flexDirection:isMobile?"column":"row"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Btn v="secondary" sm onClick={()=>{setSelectedId(null);setEditMode(false);}}><Ic d={I.back} s={13}/> {isMobile?"Back":"All Projects"}</Btn>
            <div><div style={{fontSize:isMobile?15:18,fontWeight:700,color:C.text}}>{p.name}</div><div style={{fontSize:11,color:C.textSub}}>{p.client}{p.address?" · "+p.address:""}</div></div>
            <Badge s={p.status}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn v="secondary" sm onClick={()=>{setEditProj({...p});setEditMode(true);setActiveTab("overview");}}><Ic d={I.edit} s={13}/> Edit</Btn>
            <Btn danger sm onClick={()=>setDelId(p.id)}><Ic d={I.trash} s={13}/> Delete</Btn>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?10:14}}>
          <Stat label="Contract" value={fmt(p.value)} color={C.accent} icon="dollar"/>
          <Stat label="Spent" value={fmt(p.spent)} sub={`${budget_pct}% of budget`} color={budget_pct>90?C.red:C.green} icon="trend"/>
          <Stat label="Remaining" value={fmt(p.value+approvedCOs-p.spent)} color={C.purple} icon="dollar"/>
          <Stat label="Progress" value={`${p.progress}%`} sub={p.phase} color={C.amber} icon="proj"/>
        </div>

        {/* Tabs */}
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab}/>

        {/* Overview */}
        {activeTab==="overview"&&(editMode?(
          <Card style={{border:`1px solid ${C.accentB}`}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:18}}>Edit Project</div>
            <Grid cols="1fr 1fr" gap={14}>
              <Inp label="Project Name" value={editProj.name} onChange={e=>setEditProj({...editProj,name:e.target.value})}/>
              <Inp label="Client" value={editProj.client} onChange={e=>setEditProj({...editProj,client:e.target.value})}/>
              <Inp label="Contract Value ($)" type="number" value={editProj.value} onChange={e=>setEditProj({...editProj,value:e.target.value})}/>
              <Inp label="Address" value={editProj.address} onChange={e=>setEditProj({...editProj,address:e.target.value})}/>
              <Inp label="Start Date" type="date" value={editProj.start} onChange={e=>setEditProj({...editProj,start:e.target.value})}/>
              <Inp label="End Date" type="date" value={editProj.end} onChange={e=>setEditProj({...editProj,end:e.target.value})}/>
              <Sel label="Status" value={editProj.status} onChange={e=>setEditProj({...editProj,status:e.target.value})} options={["Lead","Estimate","Active","On Hold","Complete"]}/>
              <Sel label="Type" value={editProj.type} onChange={e=>setEditProj({...editProj,type:e.target.value})} options={["Residential","Commercial","Industrial","Mixed Use"]}/>
              <Sel label="Current Phase" value={editProj.phase} onChange={e=>setEditProj({...editProj,phase:e.target.value})} options={PHASES}/>
              <Inp label="Progress %" type="number" value={editProj.progress} onChange={e=>setEditProj({...editProj,progress:e.target.value})}/>
              <Span2><TA label="Notes" value={editProj.notes||""} onChange={e=>setEditProj({...editProj,notes:e.target.value})} rows={3}/></Span2>
            </Grid>
            <div style={{display:"flex",gap:10,marginTop:18}}><Btn onClick={saveEdit}>Save Changes</Btn><Btn v="secondary" onClick={()=>setEditMode(false)}>Cancel</Btn></div>
          </Card>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Project Details</div>
              <InfoRow label="Client" value={p.client}/>
              <InfoRow label="Type" value={p.type}/>
              <InfoRow label="Address" value={p.address}/>
              <InfoRow label="Start Date" value={fmtDate(p.start)}/>
              <InfoRow label="End Date" value={fmtDate(p.end)}/>
              <InfoRow label="Current Phase" value={p.phase}/>
              {p.notes&&<div style={{marginTop:14,fontSize:13,color:C.textMid,lineHeight:1.65,borderLeft:`3px solid ${C.accentB}`,paddingLeft:12}}>{p.notes}</div>}
            </Card>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Card>
                <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Financial Summary</div>
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.textSub,marginBottom:6}}><span>Budget used</span><span style={{color:budget_pct>90?C.red:C.amber,fontWeight:600}}>{budget_pct}%</span></div>
                  <Progress pct={budget_pct} color={budget_pct>90?C.red:budget_pct>70?C.amber:C.green} h={7}/>
                </div>
                <InfoRow label="Original Contract" value={fmt(p.value)}/>
                <InfoRow label="Approved COs" value={fmt(approvedCOs)} color={C.green}/>
                <InfoRow label="Revised Contract" value={fmt(p.value+approvedCOs)} color={C.accent}/>
                <InfoRow label="Spent to Date" value={fmt(p.spent)}/>
                <InfoRow label="Remaining" value={fmt(p.value+approvedCOs-p.spent)} color={p.value+approvedCOs-p.spent<0?C.red:C.green}/>
              </Card>
              <Card>
                <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>Activity</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["Estimates",projEsts.length,C.blue],["Invoices",projInvs.length,C.accent],["Change Orders",projCOs.length,C.amber],["Budget Lines",projBudget.length,C.green]].map(([k,v,c])=>(
                    <div key={k} style={{background:C.bg,borderRadius:4,padding:"10px 14px"}}>
                      <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
                      <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{k}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ))}

        {activeTab==="budget"&&<Budget projectId={p.id} budgetItems={budgetItems} setBudgetItems={setBudgetItems} projects={projects} setProjects={setProjects}/>}
        {activeTab==="estimates"&&<Estimates projectId={p.id} estimates={estimates} setEstimates={setEstimates} project={p} budgetItems={budgetItems} companySettings={companySettings}/>}
        {activeTab==="invoices"&&<ProjInvoices projectId={p.id} invoices={invoices} setInvoices={setInvoices} project={p}/>}
        {activeTab==="change orders"&&<ChangeOrders projectId={p.id} cos={cos} setCos={setCos} projects={projects}/>}
        {activeTab==="sub bids"&&<SubBids projectId={p.id} bids={bids} setBids={setBids} projects={projects}/>}
        {activeTab==="rfis"&&<RFIs projectId={p.id} rfis={rfis} setRfis={setRfis} projects={projects}/>}
        {activeTab==="purchase orders"&&<PurchaseOrders projectId={p.id} pos={pos} setPOs={setPOs} projects={projects}/>}
        {activeTab==="punch list"&&<PunchList projectId={p.id} punchList={punchList} setPunchList={setPunchList} projects={projects}/>}
        {activeTab==="meetings"&&<MeetingMinutes projectId={p.id} meetings={meetings} setMeetings={setMeetings} projects={projects}/>}
        {activeTab==="daily logs"&&<DailyLogs projectId={p.id} logs={logs} setLogs={setLogs} projects={projects}/>}
        {activeTab==="documents"&&<Documents projectId={p.id} docs={docs} setDocs={setDocs} projects={projects}/>}
        {activeTab==="photos"&&<Photos projectId={p.id} photos={photos} setPhotos={setPhotos} projects={projects}/>}
      </div>
    );
  }

  // ── Project List ──
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {delId&&<Confirm msg="Delete this project?" onOk={del} onCancel={()=>setDelId(null)}/>}
      <PageHead eyebrow="All Jobs" title="Projects" action={<Btn onClick={()=>setForm({name:"",client:"",status:"Lead",type:"Residential",value:"",address:"",phase:"Pre-Construction",start:"",end:"",notes:""})}><Ic d={I.plus} s={14}/> New Project</Btn>}/>

      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:10,pointerEvents:"none",color:C.textMuted,display:"flex"}}><Ic d={I.search} s={14}/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects by name, client, or address…"
          style={{...inputStyle,paddingLeft:34,fontSize:13}}
          onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 3px ${C.accent}18`;}}
          onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}/>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,background:"none",border:"none",cursor:"pointer",color:C.textMuted,display:"flex"}}><Ic d={I.x} s={14}/></button>}
      </div>

      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:18}}>New Project</div>
        <Grid cols="1fr 1fr" gap={14}>
          <Inp label="Project Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Riverside Luxury Remodel"/>
          <Inp label="Client Name" value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="e.g. Marcus & Diane Webb"/>
          <Inp label="Contract Value ($)" type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/>
          <Inp label="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
          <Inp label="Start Date" type="date" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/>
          <Inp label="End Date" type="date" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/>
          <Sel label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={["Lead","Estimate","Active","On Hold"]}/>
          <Sel label="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={["Residential","Commercial","Industrial","Mixed Use"]}/>
          <Span2><TA label="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></Span2>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:18}}><Btn onClick={createProject}>Create Project</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {STATUSES.map(s=>{
          const cnt=s==="All"?projects.length:projects.filter(p=>p.status===s).length;
          return <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,fontWeight:filter===s?600:500,cursor:"pointer"}}>{s} <span style={{opacity:0.7}}>({cnt})</span></button>;
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:typeof window!=="undefined"&&window.innerWidth<=768?"1fr":"repeat(2,1fr)",gap:14}} className="proj-grid">
        {filtered.map(p=>{
          const pct=p.value?Math.round((p.spent/p.value)*100):0;
          return (
              <Card key={p.id} style={{cursor:"pointer",transition:"all 0.15s"}}
                onClick={()=>{setSelectedId(p.id);setActiveTab("overview");}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accentB;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.07)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:3}}>{p.name}</div>
                    <div style={{fontSize:12,color:C.textSub}}>{p.client}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    <Badge s={p.status}/>
                    <button onClick={e=>{e.stopPropagation();setDelId(p.id);}} title="Delete"
                      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:4,padding:"4px 6px",cursor:"pointer",color:C.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}>
                      <Ic d={I.trash} s={12}/>
                    </button>
                  </div>
                </div>
                <div style={{display:"flex",gap:20,marginBottom:14}}>
                  <div><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Contract</div><div style={{fontSize:15,fontWeight:700,color:C.accent}}>{fmt(p.value)}</div></div>
                  <div><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Spent</div><div style={{fontSize:15,fontWeight:600,color:C.text}}>{fmt(p.spent)}</div></div>
                  <div><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Phase</div><div style={{fontSize:12,color:C.textMid,marginTop:3}}>{p.phase}</div></div>
                </div>
                <div style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMuted,marginBottom:5}}><span>Progress</span><span style={{fontWeight:700,color:C.textMid}}>{p.progress}%</span></div>
                  <Progress pct={p.progress} color={p.progress===100?C.purple:C.accent}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMuted,borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
                  <span>Budget: <span style={{color:pct>90?C.red:pct>70?C.amber:C.green,fontWeight:700}}>{pct}%</span></span>
                  <span>{fmtDate(p.end)}</span>
                </div>
              </Card>
          );
        })}
      </div>
      {filtered.length===0&&<Card><EmptyState msg="No projects found." action={<Btn onClick={()=>setForm({name:"",client:"",status:"Lead",type:"Residential",value:"",address:"",phase:"Pre-Construction",start:"",end:"",notes:""})}>+ Create First Project</Btn>}/></Card>}
    </div>
  );
};

// ─── SCHEDULE ────────────────────────────────────────────────────────────────
const Schedule = ({projects,setProjects}) => {
  const [editId,setEditId] = useState(null);
  const [ep,setEp] = useState(null);
  const TODAY=today();

  const save = () => {
    setProjects(projects.map(p=>p.id===editId?{...ep,progress:parseInt(ep.progress)||0}:p));
    setEditId(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageHead eyebrow="Timeline & Milestones" title="Schedule"/>
      {projects.filter(p=>p.status==="Active"||p.status==="Complete").map(p=>{
        const s=new Date(p.start+"T12:00:00"),e=new Date(p.end+"T12:00:00"),t=new Date(TODAY+"T12:00:00");
        const totalDays=(e-s)/86400000; const elapsed=(t-s)/86400000;
        const timePct=Math.min(Math.max(Math.round((elapsed/totalDays)*100),0),100);
        const daysLeft=Math.max(0,Math.ceil((e-t)/86400000));
        const phaseIdx=PHASES.indexOf(p.phase);
        const isEditing=editId===p.id;

        return <Card key={p.id}>
          {isEditing?(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Update Schedule — {p.name}</div>
              <Grid cols="1fr 1fr 1fr 1fr" gap={12}>
                <Inp label="Start Date" type="date" value={ep.start} onChange={e=>setEp({...ep,start:e.target.value})}/>
                <Inp label="End Date" type="date" value={ep.end} onChange={e=>setEp({...ep,end:e.target.value})}/>
                <Sel label="Current Phase" value={ep.phase} onChange={e=>setEp({...ep,phase:e.target.value})} options={PHASES}/>
                <Inp label="Progress %" type="number" value={ep.progress} onChange={e=>setEp({...ep,progress:e.target.value})}/>
              </Grid>
              <div style={{display:"flex",gap:10,marginTop:14}}><Btn sm onClick={save}>Save</Btn><Btn v="secondary" sm onClick={()=>setEditId(null)}>Cancel</Btn></div>
            </div>
          ):(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:3}}>{p.name}</div>
                  <div style={{fontSize:12,color:C.textSub}}>{p.client} · Phase: <span style={{color:C.accent,fontWeight:600}}>{p.phase}</span></div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Badge s={p.status}/>
                  <button onClick={()=>{setEditId(p.id);setEp({...p});}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,color:C.textSub,display:"flex",alignItems:"center",gap:4}}>
                    <Ic d={I.edit} s={12}/> Update
                  </button>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textSub,marginBottom:5}}><span>{fmtDate(p.start)}</span><span style={{color:timePct>90?C.red:C.textMid,fontWeight:600}}>Time {timePct}% · {daysLeft}d left</span><span>{fmtDate(p.end)}</span></div>
                <Progress pct={timePct} color={`linear-gradient(90deg,${C.blue},#60A5FA)`} h={7}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textSub,marginBottom:5}}><span>Work progress</span><span style={{fontWeight:600}}>{p.progress}%</span></div>
                <Progress pct={p.progress} color={p.progress===100?C.purple:C.accent} h={7}/>
              </div>
              <div style={{display:"flex",gap:2}}>
                {PHASES.map((ph,i)=>{
                  const done=i<phaseIdx,cur=i===phaseIdx;
                  return <div key={ph} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{width:"100%",height:4,background:done?C.accent:cur?C.amber:C.border,borderRadius:2}}/>
                    <div style={{fontSize:8,color:done?C.accent:cur?C.amber:C.textMuted,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",fontWeight:cur?700:400}}>{ph}</div>
                  </div>;
                })}
              </div>
            </>
          )}
        </Card>;
      })}
      {projects.filter(p=>p.status==="Active"||p.status==="Complete").length===0&&<Card><EmptyState msg="No active projects on schedule."/></Card>}
    </div>
  );
};

// ─── GLOBAL INVOICES ─────────────────────────────────────────────────────────
const GlobalInvoices = ({invoices,setInvoices,projects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filterStatus,setFilterStatus] = useState("All");
  useUnsavedWarning(form !== null);

  const save = () => {
    if(!form.description||!form.amount||!form.projectId) return;
    const yr=new Date().getFullYear(); const maxSeq=invoices.filter(i=>i.number.startsWith(`INV-${yr}`)).reduce((m,i)=>{const n=parseInt(i.number.split("-")[2]||0);return Math.max(m,n);},0); const num=`INV-${yr}-${String(maxSeq+1).padStart(3,"0")}`;
    setInvoices([...invoices,{...form,id:uid(),_isNew:true,number:num,status:"Pending",issued:today(),projectId:form.projectId,amount:parseFloat(form.amount)}]);
    setForm(null);
    toast.success("Invoice created");
  };
  const del = () => { setInvoices(invoices.filter(i=>i.id!==delId)); setDelId(null); toast("Invoice deleted",{}); };
  const setStatus=(id,s)=>{ setInvoices(invoices.map(i=>i.id===id?{...i,status:s}:i)); if(s==="Paid") toast.success("Invoice marked as paid"); };

  const paid=invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0);
  const pending=invoices.filter(i=>i.status==="Pending").reduce((s,i)=>s+i.amount,0);
  const overdue=invoices.filter(i=>i.status==="Overdue").reduce((s,i)=>s+i.amount,0);
  const filtered=filterStatus==="All"?invoices:invoices.filter(i=>i.status===filterStatus);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {delId&&<Confirm msg="Delete this invoice?" onOk={del} onCancel={()=>setDelId(null)}/>}
      <PageHead eyebrow="Billing & Collections" title="Invoices" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",description:"",amount:"",due:""})}><Ic d={I.plus} s={14}/> New Invoice</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        <Stat label="Collected" value={fmt(paid)} sub={`${invoices.filter(i=>i.status==="Paid").length} invoices`} color={C.green} icon="check"/>
        <Stat label="Pending" value={fmt(pending)} sub={`${invoices.filter(i=>i.status==="Pending").length} invoices`} color={C.amber} icon="inv"/>
        <Stat label="Overdue" value={fmt(overdue)} sub={`${invoices.filter(i=>i.status==="Overdue").length} invoices`} color={C.red} icon="alert"/>
      </div>
      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>New Invoice</div>
        <Grid cols="1fr 1fr" gap={12}>
          <Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>
          <Inp label="Amount ($)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
          <Span2><Inp label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. Draw #1 – Mobilization"/></Span2>
          <Inp label="Due Date" type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>Create Invoice</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}
      <div style={{display:"flex",gap:6}}>
        {["All","Pending","Overdue","Paid"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} style={{background:filterStatus===s?C.accent:C.surface,color:filterStatus===s?"#fff":C.textMid,border:`1px solid ${filterStatus===s?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{s}</button>)}
      </div>
      <Table heads={[{l:"Invoice #"},{l:"Project"},{l:"Description"},{l:"Amount",r:true},{l:"Issued"},{l:"Due"},{l:"Status"},{l:"Actions"}]}>
        {filtered.map(inv=>{
          const p=projects.find(x=>x.id===inv.projectId);
          return <TR key={inv.id}>
            <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.accent}}>{inv.number}</td>
            <TD>{p?.name?.substring(0,20)||"—"}</TD>
            <TD muted>{inv.description}</TD>
            <TD right bold>{fmt(inv.amount)}</TD>
            <TD muted>{inv.issued}</TD>
            <td style={{padding:"12px 14px",fontSize:13,color:inv.status==="Overdue"?C.red:C.textSub}}>{inv.due||"—"}</td>
            <td style={{padding:"12px 14px"}}><Badge s={inv.status}/></td>
            <td style={{padding:"12px 14px"}}>
              <div style={{display:"flex",gap:6}}>
                {inv.status!=="Paid"&&<button onClick={()=>setStatus(inv.id,"Paid")} style={{background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Mark Paid</button>}
                {inv.status==="Pending"&&<button onClick={()=>setStatus(inv.id,"Overdue")} style={{background:C.redL,color:C.red,border:`1px solid ${C.redB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Overdue</button>}
                <DeleteBtn onClick={()=>setDelId(inv.id)}/>
              </div>
            </td>
          </TR>;
        })}
        {filtered.length===0&&<tr><td colSpan={8}><EmptyState msg="No invoices found."/></td></tr>}
      </Table>
    </div>
  );
};

// ─── GLOBAL ESTIMATES ────────────────────────────────────────────────────────
const GlobalEstimates = ({estimates,setEstimates,projects,budgetItems,companySettings}) => {
  const [showForm,setShowForm] = useState(false);
  const [showWizard,setShowWizard] = useState(false);
  const [wizardProjectId,setWizardProjectId] = useState(null);
  const [form,setForm] = useState({projectId:projects[0]?.id||"",name:"",notes:""});
  const [navTo,setNavTo] = useState(null);
  useUnsavedWarning(showForm || showWizard);
  const calcTotal=items=>items.reduce((s,i)=>s+i.qty*i.cost*(1+i.markup/100),0);
  // Clear navTo if referenced estimate no longer exists (safe: runs after render)
  React.useEffect(()=>{ if(navTo&&!estimates.find(e=>e.id===navTo)) setNavTo(null); },[navTo,estimates]);

  if(navTo){
    const est=estimates.find(e=>e.id===navTo);
    if(!est) return null;
    const project=projects.find(p=>p.id===est.projectId);
    return <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Btn v="secondary" sm onClick={()=>setNavTo(null)}><Ic d={I.back} s={13}/> All Estimates</Btn>
      <EstimateDetail est={est} estimates={estimates} setEstimates={setEstimates} onBack={()=>setNavTo(null)} budgetItems={budgetItems} project={project} companySettings={companySettings}/>
    </div>;
  }

  const create = () => {
    if(!form.name||!form.projectId) return;
    const e={id:uid(),_isNew:true,projectId:form.projectId,name:form.name,notes:form.notes,status:"Draft",date:today(),lineItems:[]};
    setEstimates([...estimates,e]);
    setNavTo(e.id);
    setShowForm(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {showWizard&&<EstimateTemplateWizard projectId={wizardProjectId} projects={projects} estimates={estimates} setEstimates={setEstimates} companySettings={companySettings} onClose={()=>setShowWizard(false)} onCreated={id=>{setShowWizard(false);setNavTo(id);}}/>}
      <PageHead eyebrow="Bids & Proposals" title="Estimates" action={<div style={{display:"flex",gap:8}}>
        <Btn v="secondary" onClick={()=>{setWizardProjectId(projects[0]?.id||null);setShowWizard(true);}}>From Template</Btn>
        <Btn onClick={()=>setShowForm(true)}><Ic d={I.plus} s={14}/> Blank Estimate</Btn>
      </div>}/>
      {showForm&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>New Blank Estimate</div>
        <Grid cols="1fr 1fr" gap={12}>
          <Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>
          <Inp label="Estimate Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Base Bid, Revised Scope"/>
          <Span2><TA label="Notes / Scope Summary" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></Span2>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={create}>Create Estimate</Btn><Btn v="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {estimates.map(est=>{
          const p=projects.find(x=>x.id===est.projectId);
          const total=calcTotal(est.lineItems);
          return <Card key={est.id} style={{cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.accentB}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
            onClick={()=>setNavTo(est.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{est.name}</div>
                <div style={{fontSize:12,color:C.textSub}}>{p?.name} · {est.date} · {est.lineItems.length} line items</div>
                {est.notes&&<div style={{fontSize:12,color:C.textMuted,marginTop:3}}>{est.notes.substring(0,60)}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.textMuted}}>Total</div><div style={{fontSize:20,fontWeight:700,color:C.accent}}>{fmt(total)}</div></div>
                <Badge s={est.status}/>
              </div>
            </div>
          </Card>;
        })}
        {estimates.length===0&&<Card><EmptyState msg="No estimates yet. Create one above or from within a project."/></Card>}
      </div>
    </div>
  );
};



// ─── RFIs ─────────────────────────────────────────────────────────────────────
const RFIs = ({projectId,rfis,setRfis,projects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filter,setFilter] = useState("All");
  useUnsavedWarning(form !== null);
  const items = projectId ? rfis.filter(r=>r.projectId===projectId) : rfis;
  const filtered = filter==="All" ? items : items.filter(r=>r.status===filter);
  const PRIORITIES = ["Low","Normal","High","Critical"];
  const PRIORITY_COLOR = {Low:C.textSub,Normal:C.blue,High:C.amber,Critical:C.red};
  const PRIORITY_BG = {Low:C.bg,Normal:C.blueL,High:C.amberL,Critical:C.redL};
  const openCount = items.filter(r=>r.status==="Open").length;

  const save = () => {
    if(!form.subject) return;
    const projId = form.projectId||projectId;
    const maxNum = rfis.filter(r=>r.projectId===projId).reduce((m,r)=>{const n=parseInt(r.number?.split("-")[1]||0);return Math.max(m,n);},0);
    const number = form.id ? form.number : `RFI-${String(maxNum+1).padStart(3,"0")}`;
    if(form.id){setRfis(rfis.map(r=>r.id===form.id?{...form}:r));}
    else{setRfis([...rfis,{...form,id:uid(),_isNew:true,number,projectId:projId,dateSubmitted:today(),status:"Open"}]);}
    setForm(null);
    toast.success(form.id?"RFI updated":"RFI submitted");
  };
  const del = () => { setRfis(rfis.filter(r=>r.id!==delId)); setDelId(null); toast("RFI deleted",{}); };
  const setStatus = (id,s) => { setRfis(rfis.map(r=>r.id===id?{...r,status:s}:r)); toast.success(`RFI ${s.toLowerCase()}`); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this RFI?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {!projectId&&<PageHead eyebrow="Field Communications" title="RFIs" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",subject:"",toParty:"Architect",fromParty:"GC",priority:"Normal",description:"",response:"",dateNeeded:""})}><Ic d={I.plus} s={14}/> New RFI</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,fontWeight:600,color:C.text}}>RFIs</span>
          {openCount>0&&<span style={{background:C.amberL,color:C.amber,border:`1px solid ${C.amberB}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{openCount} open</span>}
        </div>
        <Btn sm onClick={()=>setForm({projectId,subject:"",toParty:"Architect",fromParty:"GC",priority:"Normal",description:"",response:"",dateNeeded:""})}><Ic d={I.plus} s={13}/> New RFI</Btn>
      </div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {["All","Open","Answered","Closed","Void"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>
            {s} ({s==="All"?items.length:items.filter(r=>r.status===s).length})
          </button>
        ))}
      </div>
      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} RFI</div>
          <Grid cols="1fr 1fr" gap={12}>
            {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
            <Inp label="Subject / Question" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Brief description of the question"/>
            <Sel label="To" value={form.toParty} onChange={e=>setForm({...form,toParty:e.target.value})} options={["Architect","Engineer","Owner","GC","Inspector","Subcontractor","Other"]}/>
            <Sel label="From" value={form.fromParty} onChange={e=>setForm({...form,fromParty:e.target.value})} options={["GC","Architect","Engineer","Owner","Subcontractor","Other"]}/>
            <Sel label="Priority" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} options={PRIORITIES}/>
            <Inp label="Response Needed By" type="date" value={form.dateNeeded} onChange={e=>setForm({...form,dateNeeded:e.target.value})}/>
            <Span2><TA label="Question / Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Full description of the question or clarification needed..."/></Span2>
            {form.id&&<Span2><TA label="Response" value={form.response} onChange={e=>setForm({...form,response:e.target.value})} rows={3} placeholder="Enter the response from the party addressed..."/></Span2>}
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>{form.id?"Save Changes":"Submit RFI"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
        </Card>
      )}
      {filtered.length===0&&form===null&&<Card><EmptyState msg="No RFIs found." action={<Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",subject:"",toParty:"Architect",fromParty:"GC",priority:"Normal",description:"",response:"",dateNeeded:""})}>+ Submit First RFI</Btn>}/></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(rfi=>{
          const p = projects.find(x=>x.id===rfi.projectId);
          const pc = PRIORITY_COLOR[rfi.priority]||C.textSub;
          const pb = PRIORITY_BG[rfi.priority]||C.bg;
          const isOverdue = rfi.dateNeeded&&rfi.dateNeeded<today()&&rfi.status==="Open";
          return (
            <Card key={rfi.id} style={{border:`1px solid ${isOverdue?C.redB:rfi.status==="Open"?C.amberB:C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.accent}}>{rfi.number}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{rfi.subject}</span>
                    <Badge s={rfi.status}/>
                    <span style={{fontSize:11,fontWeight:600,color:pc,background:pb,padding:"2px 9px",borderRadius:4}}>{rfi.priority}</span>
                    {isOverdue&&<span style={{fontSize:11,fontWeight:700,color:C.red}}>Response overdue</span>}
                  </div>
                  <div style={{fontSize:12,color:C.textSub}}>
                    {!projectId&&<span style={{fontWeight:600,color:C.textMid}}>{p?.name} · </span>}
                    To: <strong>{rfi.toParty}</strong> · From: {rfi.fromParty} · Submitted: {fmtDate(rfi.dateSubmitted)}
                    {rfi.dateNeeded&&<span> · Needed by: <span style={{color:isOverdue?C.red:C.textMid,fontWeight:600}}>{fmtDate(rfi.dateNeeded)}</span></span>}
                  </div>
                </div>
              </div>
              {rfi.description&&<div style={{fontSize:13,color:C.textMid,lineHeight:1.65,marginBottom:rfi.response?12:0,borderLeft:`3px solid ${C.border}`,paddingLeft:12}}>{rfi.description}</div>}
              {rfi.response&&(
                <div style={{background:C.greenL,border:`1px solid ${C.greenB}`,borderRadius:4,padding:"10px 14px",marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Response</div>
                  <div style={{fontSize:13,color:C.textMid,lineHeight:1.65}}>{rfi.response}</div>
                </div>
              )}
              <div style={{display:"flex",gap:8,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                {rfi.status==="Open"&&<Btn sm onClick={()=>setForm({...rfi})}>Add Response</Btn>}
                {rfi.status==="Open"&&rfi.response&&<Btn sm onClick={()=>setStatus(rfi.id,"Answered")}><Ic d={I.check} s={12}/> Mark Answered</Btn>}
                {rfi.status==="Answered"&&<Btn sm v="secondary" onClick={()=>setStatus(rfi.id,"Closed")}>Close RFI</Btn>}
                {(rfi.status==="Answered"||rfi.status==="Closed")&&<Btn v="secondary" sm onClick={()=>setStatus(rfi.id,"Open")}>Reopen</Btn>}
                {rfi.status==="Open"&&<Btn danger sm onClick={()=>setStatus(rfi.id,"Void")}>Void</Btn>}
                <EditBtn onClick={()=>setForm({...rfi})}/>
                <DeleteBtn onClick={()=>setDelId(rfi.id)}/>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── PUNCH LIST ───────────────────────────────────────────────────────────────
const PunchList = ({projectId,punchList,setPunchList,projects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filter,setFilter] = useState("All");
  useUnsavedWarning(form !== null);
  const items = projectId ? punchList.filter(p=>p.projectId===projectId) : punchList;
  const filtered = filter==="All" ? items : items.filter(p=>p.status===filter);
  const PRIORITIES = ["Low","Normal","High","Critical"];
  const PRIORITY_COLOR = {Low:C.textSub,Normal:C.blue,High:C.amber,Critical:C.red};
  const openCount = items.filter(p=>p.status!=="Complete").length;
  const pct = items.length>0 ? Math.round((items.filter(p=>p.status==="Complete").length/items.length)*100) : 0;

  const save = () => {
    if(!form.description) return;
    const projId = form.projectId||projectId;
    const maxNum = punchList.filter(p=>p.projectId===projId).reduce((m,p)=>{const n=parseInt(p.number?.split("-")[1]||0);return Math.max(m,n);},0);
    const number = form.id ? form.number : `PL-${String(maxNum+1).padStart(3,"0")}`;
    if(form.id){setPunchList(punchList.map(p=>p.id===form.id?{...form}:p));}
    else{setPunchList([...punchList,{...form,id:uid(),_isNew:true,number,projectId:projId,status:"Open"}]);}
    setForm(null);
    toast.success(form.id?"Item updated":"Punch item added");
  };
  const del = () => { setPunchList(punchList.filter(p=>p.id!==delId)); setDelId(null); toast("Item deleted",{}); };
  const complete = (id) => { setPunchList(punchList.map(p=>p.id===id?{...p,status:"Complete"}:p)); toast.success("Item marked complete"); };
  const reopen = (id) => setPunchList(punchList.map(p=>p.id===id?{...p,status:"Open"}:p));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this punch item?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {!projectId&&<PageHead eyebrow="Closeout" title="Punch List" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",location:"",description:"",assignedTo:"",priority:"Normal",dueDate:"",notes:""})}><Ic d={I.plus} s={14}/> Add Item</Btn>}/>}
      {items.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          <Stat label="Total Items" value={items.length} color={C.blue} icon="logs"/>
          <Stat label="Open" value={items.filter(p=>p.status==="Open").length} color={C.amber} icon="alert"/>
          <Stat label="Complete" value={items.filter(p=>p.status==="Complete").length} color={C.green} icon="punch"/>
          <Stat label="Completion" value={`${pct}%`} color={pct===100?C.purple:C.accent} icon="trend"/>
        </div>
      )}
      {items.length>0&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textSub,marginBottom:5}}><span>Punch list completion</span><span style={{fontWeight:600,color:pct===100?C.purple:C.accent}}>{pct}%</span></div>
          <Progress pct={pct} color={pct===100?C.purple:C.accent} h={8}/>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All","Open","In Progress","Complete"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>
              {s} ({s==="All"?items.length:items.filter(p=>p.status===s).length})
            </button>
          ))}
        </div>
        <Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",location:"",description:"",assignedTo:"",priority:"Normal",dueDate:"",notes:""})}><Ic d={I.plus} s={13}/> Add Item</Btn>
      </div>
      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} Punch Item</div>
          <Grid cols="1fr 1fr" gap={12}>
            {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
            <Inp label="Location / Area" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Master Bath, Kitchen, Unit 3B"/>
            <Sel label="Priority" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} options={PRIORITIES}/>
            <Inp label="Assigned To" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} placeholder="Trade or sub responsible"/>
            <Inp label="Due Date" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            <Span2><TA label="Deficiency Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Describe the issue clearly and specifically..."/></Span2>
            <Span2><Inp label="Resolution Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="How was this resolved?"/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>{form.id?"Save Changes":"Add to List"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
        </Card>
      )}
      {filtered.length===0&&form===null&&<Card><EmptyState msg="No punch list items." action={<Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",location:"",description:"",assignedTo:"",priority:"Normal",dueDate:"",notes:""})}>+ Add First Item</Btn>}/></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(item=>{
          const pc = PRIORITY_COLOR[item.priority]||C.textSub;
          const isComplete = item.status==="Complete";
          const isOverdue = item.dueDate&&item.dueDate<today()&&!isComplete;
          return (
            <div key={item.id} style={{background:C.surface,border:`1px solid ${isComplete?C.greenB:isOverdue?C.redB:C.border}`,borderRadius:4,padding:"14px 18px",opacity:isComplete?0.72:1,transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.accent}}>{item.number}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text,textDecoration:isComplete?"line-through":"none"}}>{item.description}</span>
                    <Badge s={item.status}/>
                    <span style={{fontSize:11,fontWeight:600,color:pc,background:pc+"18",padding:"2px 8px",borderRadius:4}}>{item.priority}</span>
                    {isOverdue&&<span style={{fontSize:11,fontWeight:700,color:C.red}}>OVERDUE</span>}
                  </div>
                  <div style={{fontSize:12,color:C.textSub}}>
                    {item.location&&<span style={{fontWeight:600,color:C.textMid}}>{item.location} · </span>}
                    {item.assignedTo&&<span>Assigned: <strong>{item.assignedTo}</strong></span>}
                    {item.dueDate&&<span> · Due: <span style={{color:isOverdue?C.red:C.textMid,fontWeight:500}}>{fmtDate(item.dueDate)}</span></span>}
                  </div>
                  {item.notes&&<div style={{fontSize:12,color:C.textMuted,marginTop:4,fontStyle:"italic"}}>{item.notes}</div>}
                </div>
                <div style={{display:"flex",gap:6,marginLeft:12,alignItems:"center",flexShrink:0}}>
                  {!isComplete&&<button onClick={()=>complete(item.id)} style={{background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><Ic d={I.check} s={12}/> Done</button>}
                  {isComplete&&<button onClick={()=>reopen(item.id)} style={{background:C.bg,color:C.textSub,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>Reopen</button>}
                  <EditBtn onClick={()=>setForm({...item})}/>
                  <DeleteBtn onClick={()=>setDelId(item.id)}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────
const PurchaseOrders = ({projectId,pos,setPOs,projects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filter,setFilter] = useState("All");
  useUnsavedWarning(form !== null);
  const CATS = ["Demo & Site Prep","Foundation","Concrete","Framing","Roofing","Windows & Doors","Electrical","Plumbing","HVAC","Insulation","Drywall","Flooring","Cabinets & Millwork","Countertops","Tile","Painting","Exterior & Landscaping","Permits & Fees","Equipment Rental","General Conditions","Contingency","Other"];
  const items = projectId ? pos.filter(p=>p.projectId===projectId) : pos;
  const filtered = filter==="All" ? items : items.filter(p=>p.status===filter);
  const totalCommitted = items.reduce((s,p)=>s+p.amount,0);
  const totalReceived = items.filter(p=>["Received","Complete"].includes(p.status)).reduce((s,p)=>s+p.amount,0);

  const save = () => {
    if(!form.vendor||!form.amount) return;
    const projId = form.projectId||projectId;
    const maxNum = pos.filter(p=>p.projectId===projId).reduce((m,p)=>{const n=parseInt(p.number?.split("-")[1]||0);return Math.max(m,n);},0);
    const number = form.id ? form.number : `PO-${String(maxNum+1).padStart(3,"0")}`;
    if(form.id){setPOs(pos.map(p=>p.id===form.id?{...form,amount:parseFloat(form.amount)||0}:p));}
    else{setPOs([...pos,{...form,id:uid(),_isNew:true,number,projectId:projId,status:"Draft",date:today(),amount:parseFloat(form.amount)||0}]);}
    setForm(null);
    toast.success(form.id?"PO updated":"Purchase order created");
  };
  const del = () => { setPOs(pos.filter(p=>p.id!==delId)); setDelId(null); toast("PO deleted",{}); };
  const setStatus = (id,s) => { setPOs(pos.map(p=>p.id===id?{...p,status:s}:p)); toast.success(`PO ${s.toLowerCase()}`); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this purchase order?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {!projectId&&<PageHead eyebrow="Procurement" title="Purchase Orders" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",vendor:"",description:"",amount:"",budgetCategory:"",deliveryDate:"",notes:""})}><Ic d={I.plus} s={14}/> New PO</Btn>}/>}
      {items.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          <Stat label="Total Committed" value={fmt(totalCommitted)} sub={`${items.length} orders`} color={C.blue} icon="budget"/>
          <Stat label="Received" value={fmt(totalReceived)} sub={`${items.filter(p=>["Received","Complete"].includes(p.status)).length} orders`} color={C.green} icon="check"/>
          <Stat label="Outstanding" value={fmt(totalCommitted-totalReceived)} sub={`${items.filter(p=>p.status==="Sent").length} in transit`} color={C.amber} icon="send"/>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All","Draft","Sent","Received","Complete"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:4,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>
              {s} ({s==="All"?items.length:items.filter(p=>p.status===s).length})
            </button>
          ))}
        </div>
        <Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",vendor:"",description:"",amount:"",budgetCategory:"",deliveryDate:"",notes:""})}><Ic d={I.plus} s={13}/> New PO</Btn>
      </div>
      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} Purchase Order</div>
          <Grid cols="1fr 1fr" gap={12}>
            {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
            <Inp label="Vendor / Supplier" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} placeholder="Vendor company name"/>
            <Inp label="Amount ($)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            <Sel label="Cost Category" value={form.budgetCategory||""} onChange={e=>setForm({...form,budgetCategory:e.target.value})} options={["Select category...", ...CATS]}/>
            <Inp label="Expected Delivery" type="date" value={form.deliveryDate} onChange={e=>setForm({...form,deliveryDate:e.target.value})}/>
            <Span2><Inp label="Description / Materials" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What materials or services are being ordered?"/></Span2>
            <Span2><Inp label="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>{form.id?"Save Changes":"Create PO"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
        </Card>
      )}
      {filtered.length===0&&form===null&&<Card><EmptyState msg="No purchase orders." action={<Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",vendor:"",description:"",amount:"",budgetCategory:"",deliveryDate:"",notes:""})}>+ Create First PO</Btn>}/></Card>}
      <Table heads={[{l:"PO #"},{l:"Vendor"},{l:"Description"},{l:"Category"},{l:"Amount",r:true},{l:"Delivery"},{l:"Status"},{l:"Actions"}]}>
        {filtered.map(po=>{
          const isLate = po.deliveryDate&&po.deliveryDate<today()&&po.status==="Sent";
          return (
            <TR key={po.id}>
              <td style={{padding:"12px 14px",fontWeight:700,color:C.accent,fontSize:13}}>{po.number}</td>
              <TD bold>{po.vendor}</TD>
              <TD muted>{po.description?.substring(0,28)||"—"}</TD>
              <TD muted>{po.budgetCategory||"—"}</TD>
              <TD right bold>{fmt(po.amount)}</TD>
              <td style={{padding:"12px 14px",fontSize:13,color:isLate?C.red:C.textSub}}>{po.deliveryDate?fmtDate(po.deliveryDate):"—"}{isLate&&" LATE"}</td>
              <td style={{padding:"12px 14px"}}><Badge s={po.status}/></td>
              <td style={{padding:"12px 14px"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {po.status==="Draft"&&<button onClick={()=>setStatus(po.id,"Sent")} style={{background:C.blueL,color:C.blue,border:`1px solid ${C.blueB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Send</button>}
                  {po.status==="Sent"&&<button onClick={()=>setStatus(po.id,"Received")} style={{background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Received</button>}
                  {po.status==="Received"&&<button onClick={()=>setStatus(po.id,"Complete")} style={{background:C.purpleL,color:C.purple,border:`1px solid ${C.purpleB}`,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Complete</button>}
                  <EditBtn onClick={()=>setForm({...po})}/>
                  <DeleteBtn onClick={()=>setDelId(po.id)}/>
                </div>
              </td>
            </TR>
          );
        })}
      </Table>
    </div>
  );
};

// ─── MEETING MINUTES ──────────────────────────────────────────────────────────
const MeetingMinutes = ({projectId,meetings,setMeetings,projects}) => {
  const [form,setForm] = useState(null);
  const [delId,setDelId] = useState(null);
  useUnsavedWarning(form !== null);
  const items = projectId ? meetings.filter(m=>m.projectId===projectId) : meetings;

  const save = () => {
    if(!form.title) return;
    if(form.id){setMeetings(meetings.map(m=>m.id===form.id?{...form}:m));}
    else{setMeetings([...meetings,{...form,id:uid(),_isNew:true,projectId:form.projectId||projectId}]);}
    setForm(null);
    toast.success(form.id?"Meeting updated":"Meeting minutes saved");
  };
  const del = () => { setMeetings(meetings.filter(m=>m.id!==delId)); setDelId(null); toast("Meeting deleted",{}); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this meeting record?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {!projectId&&<PageHead eyebrow="Field Management" title="Meeting Minutes" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",date:today(),title:"",location:"",attendees:"",agenda:"",notes:"",actionItems:""})}><Ic d={I.plus} s={14}/> New Meeting</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>Meeting Minutes</div>
        <Btn sm onClick={()=>setForm({projectId,date:today(),title:"",location:"",attendees:"",agenda:"",notes:"",actionItems:""})}><Ic d={I.plus} s={13}/> New Meeting</Btn>
      </div>}
      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"New"} Meeting</div>
          <Grid cols="1fr 1fr" gap={12}>
            {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
            <Inp label="Meeting Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Weekly OAC, Pre-Con Meeting"/>
            <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <Inp label="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Jobsite / Office / Video Call"/>
            <Span2><Inp label="Attendees" value={form.attendees} onChange={e=>setForm({...form,attendees:e.target.value})} placeholder="Names and companies, e.g. John Smith (Owner), Jane Lee (Architect)"/></Span2>
            <Span2><TA label="Agenda / Discussion Topics" value={form.agenda} onChange={e=>setForm({...form,agenda:e.target.value})} rows={3}/></Span2>
            <Span2><TA label="Meeting Notes / Decisions" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={4}/></Span2>
            <Span2><TA label="Action Items (who, what, by when)" value={form.actionItems} onChange={e=>setForm({...form,actionItems:e.target.value})} rows={3} placeholder="• John to submit RFI response by Friday&#10;• Jane to review revised plans&#10;• GC to order windows by end of week"/></Span2>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>{form.id?"Save Changes":"Save Minutes"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
        </Card>
      )}
      {items.length===0&&form===null&&<Card><EmptyState msg="No meeting minutes recorded." action={<Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",date:today(),title:"",location:"",attendees:"",agenda:"",notes:"",actionItems:""})}>+ Record Meeting</Btn>}/></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {items.map(m=>{
          const p = projects.find(x=>x.id===m.projectId);
          return (
            <Card key={m.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  {!projectId&&<div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>{p?.name}</div>}
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3}}>{m.title}</div>
                  <div style={{fontSize:12,color:C.textSub}}>{fmtDate(m.date)}{m.location&&` · ${m.location}`}</div>
                  {m.attendees&&<div style={{fontSize:12,color:C.textMuted,marginTop:3}}>Attendees: {m.attendees}</div>}
                </div>
                <div style={{display:"flex",gap:6}}><EditBtn onClick={()=>setForm({...m})}/><DeleteBtn onClick={()=>setDelId(m.id)}/></div>
              </div>
              {m.agenda&&<div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Agenda</div><div style={{fontSize:13,color:C.textMid,lineHeight:1.65}}>{m.agenda}</div></div>}
              {m.notes&&<div style={{fontSize:13,color:C.textMid,lineHeight:1.7,borderLeft:`3px solid ${C.accentB}`,paddingLeft:14,marginBottom:m.actionItems?12:0}}>{m.notes}</div>}
              {m.actionItems&&(
                <div style={{background:C.amberL,border:`1px solid ${C.amberB}`,borderRadius:4,padding:"10px 14px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Action Items</div>
                  <div style={{fontSize:13,color:C.textMid,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{m.actionItems}</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
const Reports = ({projects,invoices,estimates,cos,budgetItems,pos}) => {
  const isMobile = useMobile();
  const plData = projects.filter(p=>["Active","Complete"].includes(p.status)).map(p=>{
    const approvedCOs = cos.filter(c=>c.projectId===p.id&&c.status==="Approved").reduce((s,c)=>s+c.amount,0);
    const revisedContract = p.value+approvedCOs;
    const grossProfit = revisedContract-p.spent;
    const margin = revisedContract>0?Math.round((grossProfit/revisedContract)*100):0;
    const invoiced = invoices.filter(i=>i.projectId===p.id).reduce((s,i)=>s+i.amount,0);
    const collected = invoices.filter(i=>i.projectId===p.id&&i.status==="Paid").reduce((s,i)=>s+i.amount,0);
    const committed = (pos||[]).filter(o=>o.projectId===p.id).reduce((s,o)=>s+o.amount,0);
    return {p,revisedContract,spent:p.spent,grossProfit,margin,invoiced,collected,committed};
  });
  const calcEstTotal = e => e.lineItems.reduce((s,l)=>s+l.qty*l.cost*(1+l.markup/100),0);
  const totalEsts = estimates.length;
  const approvedEsts = estimates.filter(e=>e.status==="Approved").length;
  const winRate = totalEsts>0?Math.round((approvedEsts/totalEsts)*100):0;
  const wonValue = estimates.filter(e=>e.status==="Approved").reduce((s,e)=>s+calcEstTotal(e),0);
  const totalContract = plData.reduce((s,d)=>s+d.revisedContract,0);
  const totalSpent = plData.reduce((s,d)=>s+d.spent,0);
  const totalGP = plData.reduce((s,d)=>s+d.grossProfit,0);
  const overallMargin = totalContract>0?Math.round((totalGP/totalContract)*100):0;
  const totalCollected = invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0);
  const totalBilled = invoices.reduce((s,i)=>s+i.amount,0);
  const collectionRate = totalBilled>0?Math.round((totalCollected/totalBilled)*100):0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:isMobile?16:24}}>
      <PageHead eyebrow="Business Intelligence" title="Reports & Analytics"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:isMobile?10:14}}>
        <Stat label="Gross Profit" value={fmt(totalGP)} sub={`${overallMargin}% avg margin`} color={totalGP>=0?C.green:C.red} icon="trend"/>
        <Stat label="Revenue" value={fmt(totalContract)} sub={`${plData.length} jobs`} color={C.accent} icon="dollar"/>
        <Stat label="Collection Rate" value={`${collectionRate}%`} sub={`${fmt(totalCollected)} collected`} color={collectionRate>=80?C.green:C.amber} icon="check"/>
        <Stat label="Win Rate" value={`${winRate}%`} sub={`${approvedEsts}/${totalEsts} bids`} color={winRate>=50?C.green:C.amber} icon="award"/>
      </div>

      <Card>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Project P&L Summary</div>
        <div style={{fontSize:12,color:C.textSub,marginBottom:18}}>Active and complete projects only</div>
        {plData.length===0?<EmptyState msg="No active or complete projects to report on."/>:(
          <Table heads={[{l:"Project"},{l:"Revised Contract",r:true},{l:"Spent",r:true},{l:"Gross Profit",r:true},{l:"Margin",r:true},{l:"Invoiced",r:true},{l:"Collected",r:true}]}>
            {plData.map(({p,revisedContract,spent,grossProfit,margin,invoiced,collected})=>(
              <TR key={p.id}>
                <td style={{padding:"12px 14px"}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{p.name}</div>
                  <div style={{fontSize:11,color:C.textSub,marginTop:2}}>{p.client} · <Badge s={p.status}/></div>
                </td>
                <TD right bold>{fmt(revisedContract)}</TD>
                <TD right>{fmt(spent)}</TD>
                <td style={{padding:"12px 14px",textAlign:"right",fontSize:13,fontWeight:700,color:grossProfit>=0?C.green:C.red}}>{grossProfit>=0?"+":""}{fmt(grossProfit)}</td>
                <td style={{padding:"12px 14px",textAlign:"right"}}>
                  <span style={{fontSize:13,fontWeight:700,color:margin>=20?C.green:margin>=10?C.amber:C.red}}>{margin}%</span>
                </td>
                <TD right>{fmt(invoiced)}</TD>
                <td style={{padding:"12px 14px",textAlign:"right",fontWeight:600,color:C.green,fontSize:13}}>{fmt(collected)}</td>
              </TR>
            ))}
            <tr style={{background:C.accentL,borderTop:`2px solid ${C.accentB}`}}>
              <td style={{padding:"12px 14px",fontWeight:700,fontSize:13,color:C.accent}}>TOTALS</td>
              <td style={{padding:"12px 14px",textAlign:"right",fontWeight:700,fontSize:13}}>{fmt(totalContract)}</td>
              <td style={{padding:"12px 14px",textAlign:"right",fontWeight:700,fontSize:13}}>{fmt(totalSpent)}</td>
              <td style={{padding:"12px 14px",textAlign:"right",fontWeight:700,fontSize:13,color:totalGP>=0?C.green:C.red}}>{totalGP>=0?"+":""}{fmt(totalGP)}</td>
              <td style={{padding:"12px 14px",textAlign:"right",fontWeight:700,fontSize:13,color:overallMargin>=20?C.green:overallMargin>=10?C.amber:C.red}}>{overallMargin}%</td>
              <td style={{padding:"12px 14px",textAlign:"right",fontWeight:700,fontSize:13}}>{fmt(totalBilled)}</td>
              <td style={{padding:"12px 14px",textAlign:"right",fontWeight:700,fontSize:13,color:C.green}}>{fmt(totalCollected)}</td>
            </tr>
          </Table>
        )}
      </Card>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Estimate Win Rate</div>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textSub,marginBottom:5}}>
              <span>Approved estimates</span><span style={{fontWeight:600,color:winRate>=50?C.green:C.amber}}>{approvedEsts} of {totalEsts}</span>
            </div>
            <Progress pct={winRate} color={winRate>=50?C.green:C.amber} h={8}/>
            <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{fmt(wonValue)} in awarded contract value</div>
          </div>
          {["Approved","Sent","Draft","Rejected"].filter(s=>estimates.some(e=>e.status===s)).map(s=>{
            const cnt=estimates.filter(e=>e.status===s).length;
            const val=estimates.filter(e=>e.status===s).reduce((a,e)=>a+calcEstTotal(e),0);
            const sc=STATUS_MAP[s]||{};
            return <div key={s} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:sc.text,display:"inline-block"}}/>{s}</div>
              <div style={{display:"flex",gap:16}}><span style={{color:C.textMuted}}>{cnt} bids</span><span style={{fontWeight:600}}>{fmt(val)}</span></div>
            </div>;
          })}
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Collections Summary</div>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textSub,marginBottom:5}}>
              <span>Collection rate</span><span style={{fontWeight:600,color:collectionRate>=80?C.green:C.amber}}>{collectionRate}%</span>
            </div>
            <Progress pct={collectionRate} color={collectionRate>=80?C.green:C.amber} h={8}/>
            <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{fmt(totalCollected)} of {fmt(totalBilled)} billed</div>
          </div>
          {["Paid","Pending","Overdue"].map(s=>{
            const cnt=invoices.filter(i=>i.status===s).length;
            const val=invoices.filter(i=>i.status===s).reduce((a,i)=>a+i.amount,0);
            const sc=STATUS_MAP[s]||{};
            return <div key={s} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:sc.text,display:"inline-block"}}/>{s}</div>
              <div style={{display:"flex",gap:16}}><span style={{color:C.textMuted}}>{cnt} inv</span><span style={{fontWeight:600,color:s==="Overdue"?C.red:s==="Paid"?C.green:C.text}}>{fmt(val)}</span></div>
            </div>;
          })}
        </Card>
      </div>
    </div>
  );
};

// ─── DB HELPERS (via tenant-safe API) ────────────────────────────────────────
const fromDb = {
  project: r => ({ id:r.id, name:r.name, client:r.client||"", status:r.status||"Lead", phase:r.phase||"Pre-Construction", type:r.type||"Residential", value:parseFloat(r.value)||0, spent:parseFloat(r.spent)||0, progress:parseInt(r.progress)||0, address:r.address||"", start:r.start||"", end:r.end||"", notes:r.notes||"" }),
  contact: r => ({ id:r.id, name:r.name, company:r.company||"", type:r.type||"Client", email:r.email||"", phone:r.phone||"", city:r.city||"" }),
  budget: r => ({ id:r.id, projectId:r.project_id, category:r.category||"", division:r.division||"", code:r.code||"", budgeted:parseFloat(r.budgeted)||0, actual:parseFloat(r.actual)||0, committed:parseFloat(r.committed)||0, notes:r.notes||"" }),
  estimate: (r) => ({ id:r.id, projectId:r.project_id, name:r.name||"", status:r.status||"Draft", date:r.date||"", notes:r.notes||"", lineItems:(r.estimate_line_items||[]).map(l=>({ id:l.id, category:l.category||"", description:l.description||"", qty:parseFloat(l.qty)||1, unit:l.unit||"LS", cost:parseFloat(l.cost)||0, markup:parseFloat(l.markup)||0 })) }),
  invoice: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", description:r.description||"", amount:parseFloat(r.amount)||0, issued:r.issued||"", due:r.due||"", status:r.status||"Pending" }),
  co: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", title:r.title||"", category:r.category||"", description:r.description||"", amount:parseFloat(r.amount)||0, status:r.status||"Pending", requestedBy:r.requested_by||"Owner", date:r.date||"" }),
  log: r => ({ id:r.id, projectId:r.project_id, date:r.date||"", author:r.author||"", weather:r.weather||"", crew:parseInt(r.crew)||0, notes:r.notes||"" }),
  bidPkg: (r) => ({ id:r.id, projectId:r.project_id, trade:r.trade||"", scope:r.scope||"", dueDate:r.due_date||"", status:r.status||"Open", bids:(r.bids||[]).map(b=>({ subId:b.id, subName:b.sub_name||"", amount:parseFloat(b.amount)||0, notes:b.notes||"", submitted:b.submitted||"", awarded:b.awarded||false })) }),
  doc: r => ({ id:r.id, projectId:r.project_id, name:r.name||"", type:r.type||"Contract", date:r.date||"", notes:r.notes||"", uploader:r.uploader||"", fileUrl:r.file_url||"" }),
  photo: r => ({ id:r.id, projectId:r.project_id, caption:r.caption||"", tag:r.tag||"Progress", date:r.date||"", author:r.author||"", emoji:r.emoji||"photos", color:r.color||"#F4F5F7", fileUrl:r.file_url||"" }),
  rfi: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", subject:r.subject||"", toParty:r.to_party||"Architect", fromParty:r.from_party||"GC", dateSubmitted:r.date_submitted||"", dateNeeded:r.date_needed||"", priority:r.priority||"Normal", status:r.status||"Open", description:r.description||"", response:r.response||"" }),
  punchItem: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", location:r.location||"", description:r.description||"", assignedTo:r.assigned_to||"", priority:r.priority||"Normal", status:r.status||"Open", dueDate:r.due_date||"", notes:r.notes||"" }),
  po: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", vendor:r.vendor||"", description:r.description||"", amount:parseFloat(r.amount)||0, status:r.status||"Draft", date:r.date||"", budgetCategory:r.budget_category||"", deliveryDate:r.delivery_date||"", notes:r.notes||"" }),
  meeting: r => ({ id:r.id, projectId:r.project_id, date:r.date||"", title:r.title||"", location:r.location||"", attendees:r.attendees||"", agenda:r.agenda||"", notes:r.notes||"", actionItems:r.action_items||"" }),
};

// DB operations via tenant-safe API — org_id is injected server-side from JWT
const db = {
  // Projects
  async saveProject(p) { try { if(p._isNew) { const r = await api.projects.create({name:p.name,client:p.client,status:p.status,phase:p.phase,type:p.type,value:p.value||0,spent:p.spent||0,progress:p.progress||0,address:p.address,start:p.start||null,end:p.end||null,notes:p.notes}); return r ? { id: r.id } : true; } else { await api.projects.update(p.id,{name:p.name,client:p.client,status:p.status,phase:p.phase,type:p.type,value:p.value||0,spent:p.spent||0,progress:p.progress||0,address:p.address,start:p.start||null,end:p.end||null,notes:p.notes}); } return true; } catch(e) { console.error("saveProject",e); return false; } },
  async deleteProject(id) { try { await api.projects.delete(id); return true; } catch(e) { console.error("deleteProject",e); return false; } },
  // Contacts
  async saveContact(c) { try { if(c._isNew) { const r = await api.contacts.create({name:c.name,company:c.company,type:c.type,email:c.email,phone:c.phone,city:c.city}); return r ? { id: r.id } : true; } else { await api.contacts.update(c.id,{name:c.name,company:c.company,type:c.type,email:c.email,phone:c.phone,city:c.city}); } return true; } catch(e) { console.error("saveContact",e); return false; } },
  async deleteContact(id) { try { await api.contacts.delete(id); return true; } catch(e) { console.error("deleteContact",e); return false; } },
  // Budget
  async saveBudget(b) { try { if(b._isNew) { const r = await api.budgetItems.create({project_id:b.projectId,category:b.category,division:b.division||null,code:b.code||null,budgeted:b.budgeted||0,actual:b.actual||0,committed:b.committed||0,notes:b.notes}); return r ? { id: r.id } : true; } else { await api.budgetItems.update(b.id,{project_id:b.projectId,category:b.category,division:b.division||null,code:b.code||null,budgeted:b.budgeted||0,actual:b.actual||0,committed:b.committed||0,notes:b.notes}); } return true; } catch(e) { console.error("saveBudget",e); return false; } },
  async deleteBudget(id) { try { await api.budgetItems.delete(id); return true; } catch(e) { console.error("deleteBudget",e); return false; } },
  // Estimates
  async saveEstimate(e) { try { if(e._isNew) { const r = await api.estimates.create({project_id:e.projectId,name:e.name,status:e.status,date:e.date||null,notes:e.notes}); return r ? { id: r.id } : true; } else { await api.estimates.update(e.id,{project_id:e.projectId,name:e.name,status:e.status,date:e.date||null,notes:e.notes}); } return true; } catch(err) { console.error("saveEstimate",err); return false; } },
  async deleteEstimate(id) { try { await api.estimates.delete(id); return true; } catch(e) { console.error("deleteEstimate",e); return false; } },
  async saveLineItem(l,estimateId) { try { if(l._isNew) { const r = await api.estimates.createLineItem(estimateId,{category:l.category,description:l.description,qty:l.qty||1,unit:l.unit,cost:l.cost||0,markup:l.markup||0}); return r ? { id: r.id } : true; } else { await api.estimates.updateLineItem(l.id,{category:l.category,description:l.description,qty:l.qty||1,unit:l.unit,cost:l.cost||0,markup:l.markup||0}); } return true; } catch(e) { console.error("saveLineItem",e); return false; } },
  async deleteLineItem(id) { try { await api.estimates.deleteLineItem(id); return true; } catch(e) { console.error("deleteLineItem",e); return false; } },
  // Invoices
  async saveInvoice(i) { try { if(i._isNew) { const r = await api.invoices.create({project_id:i.projectId,number:i.number,description:i.description,amount:i.amount||0,issued:i.issued||null,due:i.due||null,status:i.status}); return r ? { id: r.id } : true; } else { await api.invoices.update(i.id,{project_id:i.projectId,number:i.number,description:i.description,amount:i.amount||0,issued:i.issued||null,due:i.due||null,status:i.status}); } return true; } catch(e) { console.error("saveInvoice",e); return false; } },
  async deleteInvoice(id) { try { await api.invoices.delete(id); return true; } catch(e) { console.error("deleteInvoice",e); return false; } },
  // Change Orders
  async saveCO(c) { try { if(c._isNew) { const r = await api.changeOrders.create({project_id:c.projectId,number:c.number,title:c.title,category:c.category,description:c.description,amount:c.amount||0,status:c.status,requested_by:c.requestedBy,date:c.date||null}); return r ? { id: r.id } : true; } else { await api.changeOrders.update(c.id,{project_id:c.projectId,number:c.number,title:c.title,category:c.category,description:c.description,amount:c.amount||0,status:c.status,requested_by:c.requestedBy,date:c.date||null}); } return true; } catch(e) { console.error("saveCO",e); return false; } },
  async deleteCO(id) { try { await api.changeOrders.delete(id); return true; } catch(e) { console.error("deleteCO",e); return false; } },
  // Daily Logs
  async saveLog(l) { try { if(l._isNew) { const r = await api.dailyLogs.create({project_id:l.projectId,date:l.date||null,author:l.author,weather:l.weather,crew:l.crew||0,notes:l.notes}); return r ? { id: r.id } : true; } else { await api.dailyLogs.update(l.id,{project_id:l.projectId,date:l.date||null,author:l.author,weather:l.weather,crew:l.crew||0,notes:l.notes}); } return true; } catch(e) { console.error("saveLog",e); return false; } },
  async deleteLog(id) { try { await api.dailyLogs.delete(id); return true; } catch(e) { console.error("deleteLog",e); return false; } },
  // Bid Packages
  async saveBidPkg(p) { try { if(p._isNew) { const r = await api.bidPackages.create({project_id:p.projectId,trade:p.trade,scope:p.scope,due_date:p.dueDate||null,status:p.status}); return r ? { id: r.id } : true; } else { await api.bidPackages.update(p.id,{project_id:p.projectId,trade:p.trade,scope:p.scope,due_date:p.dueDate||null,status:p.status}); } return true; } catch(e) { console.error("saveBidPkg",e); return false; } },
  async deleteBidPkg(id) { try { await api.bidPackages.delete(id); return true; } catch(e) { console.error("deleteBidPkg",e); return false; } },
  async saveBid(b,pkgId) { try { if(b._isNew) { const r = await api.bidPackages.createBid(pkgId,{sub_name:b.subName,amount:b.amount||0,notes:b.notes,submitted:b.submitted||null,awarded:b.awarded||false}); return r ? { subId: r.id } : true; } else { await api.bidPackages.updateBid(b.subId,{sub_name:b.subName,amount:b.amount||0,notes:b.notes,submitted:b.submitted||null,awarded:b.awarded||false}); } return true; } catch(e) { console.error("saveBid",e); return false; } },
  async deleteBid(id) { try { await api.bidPackages.deleteBid(id); return true; } catch(e) { console.error("deleteBid",e); return false; } },
  // Documents
  async saveDoc(d) { try { if(d._isNew) { const r = await api.documents.create({project_id:d.projectId,name:d.name,type:d.type,date:d.date||null,notes:d.notes,uploader:d.uploader,file_url:d.fileUrl||null}); return r ? { id: r.id } : true; } else { await api.documents.update(d.id,{project_id:d.projectId,name:d.name,type:d.type,date:d.date||null,notes:d.notes,uploader:d.uploader,file_url:d.fileUrl||null}); } return true; } catch(e) { console.error("saveDoc",e); return false; } },
  async deleteDoc(id) { try { await api.documents.delete(id); return true; } catch(e) { console.error("deleteDoc",e); return false; } },
  // Photos
  async savePhoto(p) { try { if(p._isNew) { const r = await api.photos.create({project_id:p.projectId,caption:p.caption,tag:p.tag,date:p.date||null,author:p.author,emoji:p.emoji,color:p.color,file_url:p.fileUrl||null}); return r ? { id: r.id } : true; } else { await api.photos.update(p.id,{project_id:p.projectId,caption:p.caption,tag:p.tag,date:p.date||null,author:p.author,emoji:p.emoji,color:p.color,file_url:p.fileUrl||null}); } return true; } catch(e) { console.error("savePhoto",e); return false; } },
  async deletePhoto(id) { try { await api.photos.delete(id); return true; } catch(e) { console.error("deletePhoto",e); return false; } },
  // RFIs
  async saveRFI(r) { try { if(r._isNew) { const res = await api.rfis.create({project_id:r.projectId,number:r.number,subject:r.subject,to_party:r.toParty,from_party:r.fromParty,date_submitted:r.dateSubmitted||null,date_needed:r.dateNeeded||null,priority:r.priority,status:r.status,description:r.description,response:r.response}); return res ? { id: res.id } : true; } else { await api.rfis.update(r.id,{project_id:r.projectId,number:r.number,subject:r.subject,to_party:r.toParty,from_party:r.fromParty,date_submitted:r.dateSubmitted||null,date_needed:r.dateNeeded||null,priority:r.priority,status:r.status,description:r.description,response:r.response}); } return true; } catch(e) { console.error("saveRFI",e); return false; } },
  async deleteRFI(id) { try { await api.rfis.delete(id); return true; } catch(e) { console.error("deleteRFI",e); return false; } },
  // Punch List
  async savePunchItem(p) { try { if(p._isNew) { const r = await api.punchList.create({project_id:p.projectId,number:p.number,location:p.location,description:p.description,assigned_to:p.assignedTo,priority:p.priority,status:p.status,due_date:p.dueDate||null,notes:p.notes}); return r ? { id: r.id } : true; } else { await api.punchList.update(p.id,{project_id:p.projectId,number:p.number,location:p.location,description:p.description,assigned_to:p.assignedTo,priority:p.priority,status:p.status,due_date:p.dueDate||null,notes:p.notes}); } return true; } catch(e) { console.error("savePunchItem",e); return false; } },
  async deletePunchItem(id) { try { await api.punchList.delete(id); return true; } catch(e) { console.error("deletePunchItem",e); return false; } },
  // Purchase Orders
  async savePO(p) { try { if(p._isNew) { const r = await api.purchaseOrders.create({project_id:p.projectId,number:p.number,vendor:p.vendor,description:p.description,amount:p.amount||0,status:p.status,date:p.date||null,budget_category:p.budgetCategory,delivery_date:p.deliveryDate||null,notes:p.notes}); return r ? { id: r.id } : true; } else { await api.purchaseOrders.update(p.id,{project_id:p.projectId,number:p.number,vendor:p.vendor,description:p.description,amount:p.amount||0,status:p.status,date:p.date||null,budget_category:p.budgetCategory,delivery_date:p.deliveryDate||null,notes:p.notes}); } return true; } catch(e) { console.error("savePO",e); return false; } },
  async deletePO(id) { try { await api.purchaseOrders.delete(id); return true; } catch(e) { console.error("deletePO",e); return false; } },
  // Meetings
  async saveMeeting(m) { try { if(m._isNew) { const r = await api.meetings.create({project_id:m.projectId,date:m.date||null,title:m.title,location:m.location,attendees:m.attendees,agenda:m.agenda,notes:m.notes,action_items:m.actionItems}); return r ? { id: r.id } : true; } else { await api.meetings.update(m.id,{project_id:m.projectId,date:m.date||null,title:m.title,location:m.location,attendees:m.attendees,agenda:m.agenda,notes:m.notes,action_items:m.actionItems}); } return true; } catch(e) { console.error("saveMeeting",e); return false; } },
  async deleteMeeting(id) { try { await api.meetings.delete(id); return true; } catch(e) { console.error("deleteMeeting",e); return false; } },
};

// ─── LOGIN / SIGNUP PAGE ─────────────────────────────────────────────────────
const LoginPage = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        const result = await authLogin({ email, password });
        onAuth(result);
      } else {
        const result = await authSignup({ email, password, name, companyName, companySlug });
        onAuth(result);
      }
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    }
    setSubmitting(false);
  };

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:C.surface,borderRadius:12,padding:40,width:380,boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:44,height:44,background:C.accent,borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Ic d={I.hard} s={22} stroke="#fff"/></div>
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>BuildFlow Pro</div>
          <div style={{fontSize:13,color:C.textSub,marginTop:4}}>{mode === "login" ? "Sign in to your account" : "Create your company account"}</div>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <input type="text" placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)} required style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:14,marginBottom:10,boxSizing:"border-box"}} />
              <input type="text" placeholder="Company Name" value={companyName} onChange={e=>setCompanyName(e.target.value)} required style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:14,marginBottom:10,boxSizing:"border-box"}} />
              <input type="text" placeholder="Company Slug (e.g., acme-corp)" value={companySlug} onChange={e=>setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))} required style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:14,marginBottom:10,boxSizing:"border-box"}} />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:14,marginBottom:10,boxSizing:"border-box"}} />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:14,marginBottom:16,boxSizing:"border-box"}} />
          <button type="submit" disabled={submitting} style={{width:"100%",padding:"10px 12px",borderRadius:6,border:"none",background:C.accent,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",opacity:submitting?0.7:1}}>
            {submitting ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:C.textSub}}>
          {mode === "login" ? (
            <>Don't have an account? <span onClick={()=>setMode("signup")} style={{color:C.accent,cursor:"pointer",fontWeight:600}}>Sign Up</span></>
          ) : (
            <>Already have an account? <span onClick={()=>setMode("login")} style={{color:C.accent,cursor:"pointer",fontWeight:600}}>Sign In</span></>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab] = useState("dashboard");
  const [navPayload,setNavPayload] = useState(null);
  const [menuOpen,setMenuOpen] = useState(false);
  const [loading,setLoading] = useState(true);
  const [authenticated,setAuthenticated] = useState(false);
  const [currentUser,setCurrentUser] = useState(null);
  const [projects,setProjects] = useState([]);
  const [contacts,setContacts] = useState([]);
  const [estimates,setEstimates] = useState([]);
  const [invoices,setInvoices] = useState([]);
  const [budgetItems,setBudgetItems] = useState([]);
  const [cos,setCos] = useState([]);
  const [logs,setLogs] = useState([]);
  const [bids,setBids] = useState([]);
  const [docs,setDocs] = useState([]);
  const [photos,setPhotos] = useState([]);
  const [rfis,setRfis] = useState([]);
  const [punchList,setPunchList] = useState([]);
  const [pos,setPOs] = useState([]);
  const [meetings,setMeetings] = useState([]);
  const [companySettings,setCompanySettings] = useState(DEFAULT_COMPANY);
  const saveCompany = async (s) => { setCompanySettings(s); try { await api.settings.update(s); } catch(e) { console.error("saveCompany",e); } };

  // ── Auth handler ──
  const handleAuth = (result) => {
    setCurrentUser(result.user);
    if (result.organization) {
      setCompanySettings(prev => ({ ...prev, ...result.organization }));
    }
    setAuthenticated(true);
  };

  const handleLogout = () => {
    authLogout();
    setAuthenticated(false);
    setCurrentUser(null);
    setProjects([]); setContacts([]); setEstimates([]); setInvoices([]);
    setBudgetItems([]); setCos([]); setLogs([]); setBids([]);
    setDocs([]); setPhotos([]); setRfis([]); setPunchList([]);
    setPOs([]); setMeetings([]);
  };

  // ── Restore session on page refresh ──
  useEffect(() => {
    restoreSession().then(result => {
      if (result) handleAuth(result);
      else setLoading(false);
    }).catch(e => {
      console.error("Session restore failed:", e);
      setLoading(false);
    });
  }, []);

  // ── Load all data via tenant-safe API ──
  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const [proj, cont, budg, ests, invs, cosr, lgsr, pkgs, dcsr, phsr, rfisR, punchR, posR, meetR] = await Promise.all([
          api.projects.list(),
          api.contacts.list(),
          api.budgetItems.list(),
          api.estimates.list(),
          api.invoices.list(),
          api.changeOrders.list(),
          api.dailyLogs.list(),
          api.bidPackages.list(),
          api.documents.list(),
          api.photos.list(),
          api.rfis.list().catch(()=>[]),
          api.punchList.list().catch(()=>[]),
          api.purchaseOrders.list().catch(()=>[]),
          api.meetings.list().catch(()=>[]),
        ]);
        setProjects((proj||[]).map(fromDb.project));
        setContacts((cont||[]).map(fromDb.contact));
        setBudgetItems((budg||[]).map(fromDb.budget));
        setEstimates((ests||[]).map(fromDb.estimate));
        const todayStr = today();
        const autoOverdue = (list) => list.map(i =>
          i.status === "Pending" && i.due && i.due < todayStr ? {...i, status:"Overdue"} : i
        );
        const loadedInvoices = autoOverdue((invs||[]).map(fromDb.invoice));
        // Persist auto-overdue status changes to the server
        const overdueUpdates = loadedInvoices.filter(i => {
          const orig = (invs||[]).find(r => r.id === i.id);
          return orig && orig.status !== i.status;
        });
        await Promise.all(overdueUpdates.map(i => db.saveInvoice(i).catch(e => console.error("Auto-overdue save failed:", e))));
        setInvoices(loadedInvoices);
        setCos((cosr||[]).map(fromDb.co));
        setLogs((lgsr||[]).map(fromDb.log));
        setBids((pkgs||[]).map(fromDb.bidPkg));
        setDocs((dcsr||[]).map(fromDb.doc));
        setPhotos((phsr||[]).map(fromDb.photo));
        setRfis((rfisR||[]).map(fromDb.rfi));
        setPunchList((punchR||[]).map(fromDb.punchItem));
        setPOs((posR||[]).map(fromDb.po));
        setMeetings((meetR||[]).map(fromDb.meeting));

        // Load org settings from API
        try {
          const orgSettings = await api.settings.get();
          if (orgSettings) setCompanySettings(prev => ({ ...prev, ...orgSettings }));
        } catch(e) { console.error("Load settings:",e); }
      } catch(e) { console.error("Load failed:",e); }
      setLoading(false);
    })();
  }, [authenticated]);

  // Manual data refresh — re-fetches all entities from the server
  const refreshData = useCallback(async () => {
    if (!authenticated) return;
    try {
      const [proj, cont, budg, ests, invs, cosr, lgsr, pkgs, dcsr, phsr, rfisR, punchR, posR, meetR] = await Promise.all([
        api.projects.list(), api.contacts.list(), api.budgetItems.list(), api.estimates.list(),
        api.invoices.list(), api.changeOrders.list(), api.dailyLogs.list(), api.bidPackages.list(),
        api.documents.list(), api.photos.list(), api.rfis.list().catch(()=>[]), api.punchList.list().catch(()=>[]),
        api.purchaseOrders.list().catch(()=>[]), api.meetings.list().catch(()=>[]),
      ]);
      setProjects((proj||[]).map(fromDb.project));
      setContacts((cont||[]).map(fromDb.contact));
      setBudgetItems((budg||[]).map(fromDb.budget));
      setEstimates((ests||[]).map(fromDb.estimate));
      setInvoices((invs||[]).map(fromDb.invoice));
      setCos((cosr||[]).map(fromDb.co));
      setLogs((lgsr||[]).map(fromDb.log));
      setBids((pkgs||[]).map(fromDb.bidPkg));
      setDocs((dcsr||[]).map(fromDb.doc));
      setPhotos((phsr||[]).map(fromDb.photo));
      setRfis((rfisR||[]).map(fromDb.rfi));
      setPunchList((punchR||[]).map(fromDb.punchItem));
      setPOs((posR||[]).map(fromDb.po));
      setMeetings((meetR||[]).map(fromDb.meeting));
      toast.success("Data refreshed");
    } catch(e) { console.error("Refresh failed:", e); toast.error("Failed to refresh data"); }
  }, [authenticated]);

  const navigate = (t,payload=null) => { setTab(t); setNavPayload(payload); setMenuOpen(false); };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Escape closes mobile menu
      if(e.key==="Escape") setMenuOpen(false);
      // Ctrl/Cmd+K focuses sidebar search
      if((e.ctrlKey||e.metaKey)&&e.key==="k") {
        e.preventDefault();
        document.querySelector(".global-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const NAV = [
    {id:"dashboard",label:"Dashboard",icon:"home"},
    {id:"projects",label:"Projects",icon:"proj"},
    {id:"estimates",label:"Estimates",icon:"est"},
    {id:"invoices",label:"Invoices",icon:"inv"},
    {id:"cos",label:"Change Orders",icon:"co"},
    {id:"rfis",label:"RFIs",icon:"rfi"},
    {id:"budget",label:"Budget Tracker",icon:"budget"},
    {id:"pos",label:"Purchase Orders",icon:"po"},
    {id:"bids",label:"Sub Bids",icon:"bids"},
    {id:"punch",label:"Punch List",icon:"punch"},
    {id:"schedule",label:"Schedule",icon:"sched"},
    {id:"meetings",label:"Meeting Minutes",icon:"meeting"},
    {id:"logs",label:"Daily Logs",icon:"logs"},
    {id:"docs",label:"Documents",icon:"docs"},
    {id:"photos",label:"Photos",icon:"photos"},
    {id:"contacts",label:"Contacts",icon:"contacts"},
    {id:"reports",label:"Reports",icon:"report"},
    {id:"settings",label:"Settings",icon:"hard"},
  ];

  // ── Auth guard ──
  if(!authenticated) return <LoginPage onAuth={handleAuth} />;

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",flexDirection:"column",gap:16}}>
      <div style={{width:44,height:44,background:C.accent,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.hard} s={22} stroke="#fff"/></div>
      <div style={{fontSize:15,fontWeight:700,color:C.text}}>BuildFlow Pro</div>
      <div style={{fontSize:13,color:C.textSub}}>Loading your projects...</div>
      <div style={{width:200,height:3,background:C.border,borderRadius:3,overflow:"hidden",marginTop:4}}>
        <div style={{width:"40%",height:"100%",background:C.accent,borderRadius:3,animation:"load 1s ease-in-out infinite alternate"}}/>
      </div>
      <style>{`@keyframes load{from{transform:translateX(0)}to{transform:translateX(300%)}}`}</style>
    </div>
  );

  // Smart DB setters — only persist changed/new/deleted items, not the entire array
  const makeSetter = (rawSetter, saveFn, deleteFn, idKey = 'id') => (updater) => {
    rawSetter(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const prevMap = new Map(prev.map(x => [x[idKey], x]));
      const nextMap = new Map(next.map(x => [x[idKey], x]));
      // Save only new or changed items
      next.forEach((item, i) => {
        const old = prevMap.get(item[idKey]);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          saveFn(item).then(result => {
            if (!result) {
              // Save failed — rollback by restoring previous state for this item
              if (old) rawSetter(cur => cur.map(x => x[idKey] === item[idKey] ? old : x));
              else rawSetter(cur => cur.filter(x => x[idKey] !== item[idKey]));
              toast.error("Failed to save — please retry");
            } else if (item._isNew && typeof result === 'object') {
              // Replace client-generated ID with server-generated ID and strip _isNew
              rawSetter(cur => cur.map(x => x[idKey] === item[idKey] ? { ...x, [idKey]: result[idKey] || result.id, _isNew: undefined } : x));
            } else if (item._isNew) {
              rawSetter(cur => cur.map(x => x[idKey] === item[idKey] ? (({_isNew, ...rest}) => rest)(x) : x));
            }
          });
        }
      });
      // Delete removed items
      prev.forEach(item => {
        if (!nextMap.has(item[idKey])) {
          deleteFn(item[idKey]).then(ok => {
            if (ok === false) {
              // Delete failed — re-add the item
              rawSetter(cur => [...cur, item]);
              toast.error("Failed to delete — please retry");
            }
          }).catch(() => {
            rawSetter(cur => [...cur, item]);
            toast.error("Failed to delete — please retry");
          });
        }
      });
      return next;
    });
  };

  const setProjectsDB = makeSetter(setProjects, db.saveProject, db.deleteProject);
  const setContactsDB = makeSetter(setContacts, db.saveContact, db.deleteContact);
  const setBudgetDB = makeSetter(setBudgetItems, db.saveBudget, db.deleteBudget);
  const setInvoicesDB = makeSetter(setInvoices, db.saveInvoice, db.deleteInvoice);
  const setCosDB = makeSetter(setCos, db.saveCO, db.deleteCO);
  const setLogsDB = makeSetter(setLogs, db.saveLog, db.deleteLog);
  const setRfisDB = makeSetter(setRfis, db.saveRFI, db.deleteRFI);
  const setPunchListDB = makeSetter(setPunchList, db.savePunchItem, db.deletePunchItem);
  const setPOsDB = makeSetter(setPOs, db.savePO, db.deletePO);
  const setMeetingsDB = makeSetter(setMeetings, db.saveMeeting, db.deleteMeeting);
  const setDocsDB = makeSetter(setDocs, db.saveDoc, db.deleteDoc);
  const setPhotosDB = makeSetter(setPhotos, db.savePhoto, db.deletePhoto);

  // Estimates need special handling for nested line items
  const setEstimatesDB = (updater) => {
    setEstimates(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const prevMap = new Map(prev.map(e => [e.id, e]));
      const nextMap = new Map(next.map(e => [e.id, e]));
      next.forEach(e => {
        const old = prevMap.get(e.id);
        if (!old || JSON.stringify({...old, lineItems:[]}) !== JSON.stringify({...e, lineItems:[]})) {
          db.saveEstimate(e).then(result => {
            if (!result) toast.error("Failed to save estimate");
            else if (e._isNew && typeof result === 'object') {
              // Sync server-generated ID back to local state
              setEstimates(cur => cur.map(x => x.id === e.id ? { ...x, id: result.id, _isNew: undefined } : x));
            }
          });
        }
        // Save changed/new line items
        const oldItems = new Map((old?.lineItems||[]).map(l => [l.id, l]));
        e.lineItems.forEach(l => {
          const ol = oldItems.get(l.id);
          if (!ol || JSON.stringify(ol) !== JSON.stringify(l)) {
            db.saveLineItem(l, e.id).then(result => {
              if (l._isNew && typeof result === 'object') {
                setEstimates(cur => cur.map(x => x.id === e.id ? { ...x, lineItems: x.lineItems.map(li => li.id === l.id ? { ...li, id: result.id, _isNew: undefined } : li) } : x));
              }
            });
          }
        });
        // Delete removed line items
        if (old) {
          const newItemIds = new Set(e.lineItems.map(l => l.id));
          old.lineItems.forEach(l => { if (!newItemIds.has(l.id)) db.deleteLineItem(l.id); });
        }
      });
      prev.forEach(e => { if (!nextMap.has(e.id)) db.deleteEstimate(e.id); });
      return next;
    });
  };

  // Bid packages need special handling for nested bids
  const setBidsDB = (updater) => {
    setBids(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const prevMap = new Map(prev.map(p => [p.id, p]));
      const nextMap = new Map(next.map(p => [p.id, p]));
      next.forEach(pkg => {
        const old = prevMap.get(pkg.id);
        if (!old || JSON.stringify({...old, bids:[]}) !== JSON.stringify({...pkg, bids:[]})) {
          db.saveBidPkg(pkg).then(result => {
            if (pkg._isNew && typeof result === 'object') {
              setBids(cur => cur.map(x => x.id === pkg.id ? { ...x, id: result.id, _isNew: undefined } : x));
            }
          });
        }
        const oldBids = new Map((old?.bids||[]).map(b => [b.subId, b]));
        pkg.bids.forEach(b => {
          const ob = oldBids.get(b.subId);
          if (!ob || JSON.stringify(ob) !== JSON.stringify(b)) {
            db.saveBid(b, pkg.id).then(result => {
              if (b._isNew && typeof result === 'object') {
                setBids(cur => cur.map(x => x.id === pkg.id ? { ...x, bids: x.bids.map(bi => bi.subId === b.subId ? { ...bi, subId: result.subId, _isNew: undefined } : bi) } : x));
              }
            });
          }
        });
        if (old) {
          const newBidIds = new Set(pkg.bids.map(b => b.subId));
          old.bids.forEach(b => { if (!newBidIds.has(b.subId)) db.deleteBid(b.subId); });
        }
      });
      prev.forEach(p => { if (!nextMap.has(p.id)) db.deleteBidPkg(p.id); });
      return next;
    });
  };

  const sharedProps = {
    projects, setProjects:setProjectsDB,
    estimates, setEstimates:setEstimatesDB,
    invoices, setInvoices:setInvoicesDB,
    budgetItems, setBudgetItems:setBudgetDB,
    cos, setCos:setCosDB,
    logs, setLogs:setLogsDB,
    bids, setBids:setBidsDB,
    docs, setDocs:setDocsDB,
    photos, setPhotos:setPhotosDB,
    rfis, setRfis:setRfisDB,
    punchList, setPunchList:setPunchListDB,
    pos, setPOs:setPOsDB,
    meetings, setMeetings:setMeetingsDB,
    companySettings,
  };

  // Notification badge counts for sidebar
  const pendingCOCount = cos.filter(c=>c.status==="Pending").length;
  const overdueInvCount = invoices.filter(i=>i.status==="Overdue").length;
  const openRFICount = rfis.filter(r=>r.status==="Open").length;
  const openPunchCount = punchList.filter(p=>p.status!=="Complete").length;
  const BADGES = {cos:pendingCOCount, invoices:overdueInvCount, rfis:openRFICount, punch:openPunchCount};

  const Sidebar = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.navy}}>
      <div style={{padding:"16px 14px 12px",borderBottom:`1px solid rgba(255,255,255,0.08)`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:30,height:30,background:C.accent,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={I.hard} s={14} stroke="#fff"/></div>
          <div><div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:"0.06em"}}>BUILDFLOW</div><div style={{fontSize:9,color:"rgba(255,255,255,0.4)",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase"}}>CONSTRUCTION</div></div>
        </div>
        <GlobalSearch projects={projects} contacts={contacts} invoices={invoices} cos={cos} estimates={estimates} rfis={rfis} onNav={navigate}/>
      </div>
      <nav style={{flex:1,padding:"8px 8px",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
        {NAV.map(item=>{
          const active=tab===item.id;
          const badge=BADGES[item.id]||0;
          return <button key={item.id} onClick={()=>navigate(item.id)}
            style={{display:"flex",alignItems:"center",gap:9,padding:"7px 10px",borderRadius:4,border:"none",background:active?"rgba(211,84,0,0.15)":"transparent",color:active?C.accent:"rgba(255,255,255,0.55)",cursor:"pointer",fontSize:12,fontWeight:active?600:400,textAlign:"left",width:"100%",fontFamily:"inherit",transition:"background 0.1s",borderLeft:active?`2px solid ${C.accent}`:"2px solid transparent",letterSpacing:"0.01em"}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(255,255,255,0.8)";}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.55)";}}}>
            <Ic d={I[item.icon]||I.home} s={14}/>
            <span style={{flex:1}}>{item.label}</span>
            {badge>0&&<span style={{background:item.id==="invoices"?C.red:C.amber,color:"#fff",borderRadius:3,padding:"1px 6px",fontSize:10,fontWeight:700,minWidth:18,textAlign:"center"}}>{badge}</span>}
          </button>;
        })}
      </nav>
      <div style={{padding:"10px 12px",borderTop:`1px solid rgba(255,255,255,0.08)`,cursor:"pointer"}} onClick={()=>navigate("settings")}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {companySettings.logo
            ? <img src={companySettings.logo} style={{width:28,height:28,borderRadius:4,objectFit:"cover",flexShrink:0}} alt="logo"/>
            : <div style={{width:28,height:28,borderRadius:4,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{(companySettings.name||"GC").substring(0,2).toUpperCase()}</div>}
          <div style={{flex:1,overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{companySettings.name||"My Company"}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>Settings</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100dvh",background:C.bg,fontFamily:"'Inter','DM Sans',system-ui,sans-serif",overflow:"hidden"}}>
      <Toaster position="bottom-right" toastOptions={{duration:2500,style:{fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,fontWeight:500,borderRadius:4,boxShadow:"0 2px 12px rgba(13,27,42,0.12)",border:`1px solid ${C.border}`}}}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${C.borderStrong};border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${C.textMuted};}
        input[type=number]::-webkit-inner-spin-button{opacity:0.4;}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:0.4;cursor:pointer;}
        input::placeholder,textarea::placeholder{color:${C.textMuted};}
        textarea,button,select{font-family:inherit;}
        input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none;box-shadow:0 0 0 2px ${C.accentL}!important;}
        table{border-collapse:collapse;}

        @media(min-width:769px){
          .mobileHeader{display:none!important;}
          .mobileMenu{display:none!important;}
          .bottomNav{display:none!important;}
        }

        .mainPad{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;}

        @media(max-width:768px){
          .sidebar{display:none!important;}
          .mobileHeader{display:flex!important;}
          .mainPad{padding:12px!important;padding-top:58px!important;padding-bottom:140px!important;}
          .bottomNav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.navy};border-top:none;z-index:200;padding:6px 0 env(safe-area-inset-bottom,6px);}

          /* Make ALL multi-column grids stack on mobile */
          div[style*="repeat(4,1fr)"],
          div[style*="repeat(3,1fr)"]{
            grid-template-columns: 1fr 1fr !important;
          }

          /* Project card grid goes single col */
          .proj-grid{grid-template-columns:1fr!important;}

          /* Touch targets */
          button{min-height:40px;min-width:40px;}
          input,select,textarea{font-size:16px!important;} /* prevents iOS zoom */

          /* Compact page header actions go full width */
          .page-action{width:100%!important;}
          .page-action button{width:100%!important;}

          /* Number overflow fix */
          td,th{word-break:break-word;max-width:150px;}
        }

        @media(max-width:480px){
          div[style*="repeat(2,1fr)"]{
            grid-template-columns: 1fr !important;
          }
          .mainPad{padding:8px!important;padding-top:56px!important;padding-bottom:140px!important;}
        }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="sidebar" style={{width:220,background:C.navy,flexShrink:0}}>
        <Sidebar/>
      </div>

      {/* Mobile Top Header */}
      <div className="mobileHeader" style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:C.navy,padding:"10px 16px",display:"none",alignItems:"center",justifyContent:"space-between",height:52}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,background:C.accent,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.hard} s={12} stroke="#fff"/></div>
          <div style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:"0.06em"}}>BUILDFLOW</div>
        </div>
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.7)",display:"flex",padding:4}}>
          <Ic d={menuOpen?I.x:I.menu} s={22}/>
        </button>
      </div>

      {/* Mobile Slide-out Menu */}
      {menuOpen&&<div className="mobileMenu" onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(13,27,42,0.6)",zIndex:300}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"78%",maxWidth:280,height:"100%",background:C.navy,overflowY:"auto"}}>
          <Sidebar/>
        </div>
      </div>}

      {/* Mobile Bottom Nav */}
      <div className="bottomNav" style={{display:"none"}}>
        {[
          {id:"dashboard",label:"Home",icon:"home"},
          {id:"projects",label:"Projects",icon:"proj"},
          {id:"invoices",label:"Invoices",icon:"inv"},
          {id:"budget",label:"Budget",icon:"budget"},
          {id:"logs",label:"Logs",icon:"logs"},
        ].map(item=>{
          const active=tab===item.id;
          return <button key={item.id} onClick={()=>navigate(item.id)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"6px 0",color:active?C.accent:"rgba(255,255,255,0.5)"}}>
            <Ic d={I[item.icon]||I.home} s={active?20:18} stroke={active?C.accent:"rgba(255,255,255,0.5)"}/>
            <span style={{fontSize:9,fontWeight:active?700:500,letterSpacing:"0.04em"}}>{item.label}</span>
          </button>;
        })}
      </div>

      <div className="mainPad" style={{flex:1,overflow:"auto",padding:"32px 36px"}}>
        <div style={{maxWidth:1100}}>
          {/* Always mount Projects so its state (selectedId, activeTab) survives tab switches */}
          <div style={{display:tab==="projects"?"block":"none"}}>
            <Projects {...sharedProps} contacts={contacts} initialId={navPayload}/>
          </div>
          {tab==="dashboard"&&<Dashboard projects={projects} invoices={invoices} cos={cos} rfis={rfis} punchList={punchList} onNav={navigate}/>}
          {/* Keep Estimates, Invoices, Contacts mounted so form/filter state survives tab switches */}
          <div style={{display:tab==="estimates"?"block":"none"}}>
            <GlobalEstimates estimates={estimates} setEstimates={setEstimatesDB} projects={projects} budgetItems={budgetItems} companySettings={companySettings}/>
          </div>
          <div style={{display:tab==="invoices"?"block":"none"}}>
            <GlobalInvoices invoices={invoices} setInvoices={setInvoicesDB} projects={projects}/>
          </div>
          {tab==="cos"&&<ChangeOrders cos={cos} setCos={setCosDB} projects={projects}/>}
          {tab==="budget"&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
            <PageHead eyebrow="Cost Management" title="Budget Tracker"/>
            {projects.filter(p=>p.status==="Active"||p.status==="Complete").map(p=>(
              <div key={p.id}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>{p.name}<Badge s={p.status}/></div>
                <Budget projectId={p.id} budgetItems={budgetItems} setBudgetItems={setBudgetDB} projects={projects} setProjects={setProjectsDB}/>
                <div style={{height:24}}/>
              </div>
            ))}
          </div>}
          {tab==="bids"&&<SubBids bids={bids} setBids={setBidsDB} projects={projects}/>}
          {tab==="rfis"&&<RFIs rfis={rfis} setRfis={setRfisDB} projects={projects}/>}
          {tab==="pos"&&<PurchaseOrders pos={pos} setPOs={setPOsDB} projects={projects}/>}
          {tab==="punch"&&<PunchList punchList={punchList} setPunchList={setPunchListDB} projects={projects}/>}
          {tab==="meetings"&&<MeetingMinutes meetings={meetings} setMeetings={setMeetingsDB} projects={projects}/>}
          {tab==="schedule"&&<Schedule projects={projects} setProjects={setProjectsDB}/>}
          {tab==="logs"&&<DailyLogs logs={logs} setLogs={setLogsDB} projects={projects}/>}
          {tab==="docs"&&<Documents docs={docs} setDocs={setDocsDB} projects={projects}/>}
          {tab==="photos"&&<Photos photos={photos} setPhotos={setPhotosDB} projects={projects}/>}
          <div style={{display:tab==="contacts"?"block":"none"}}>
            <Contacts contacts={contacts} setContacts={setContactsDB}/>
          </div>
          {tab==="reports"&&<Reports projects={projects} invoices={invoices} estimates={estimates} cos={cos} budgetItems={budgetItems} pos={pos}/>}
          {tab==="settings"&&<CompanySettings settings={companySettings} onSave={saveCompany}/>}
        </div>
      </div>
    </div>
  );
}
