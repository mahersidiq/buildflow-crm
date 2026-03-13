import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://daxqltkdkfpkhnzttfln.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheHFsdGtka2Zwa2huenR0ZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTQwMjAsImV4cCI6MjA4ODkzMDAyMH0.2Kx2oGa7ftl9q8XiVCGqqzAiPcP6Q4KSeoz0Mc-LDpo";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#F4F5F7",surface:"#FFFFFF",border:"#E8EAED",borderStrong:"#D0D4DA",
  text:"#0F1117",textMid:"#2D3340",textSub:"#5C6270",textMuted:"#9299A6",
  accent:"#E86C2C",accentL:"#FEF3EC",accentB:"#F5B894",
  green:"#1A7F4B",greenL:"#F0FBF5",greenB:"#A8DDBE",
  red:"#C8252A",redL:"#FEF2F2",redB:"#F5BBBE",
  blue:"#2255CC",blueL:"#EEF3FD",blueB:"#AABFF5",
  amber:"#B86B00",amberL:"#FDF8EE",amberB:"#F0D48A",
  purple:"#6930C4",purpleL:"#F4F0FD",purpleB:"#CCBAF2",
};

const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n||0);
const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const today = () => new Date().toISOString().slice(0,10);
const uid = () => crypto.randomUUID();

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
};

const Badge = ({s}) => {
  const m = STATUS_MAP[s]||{bg:C.bg,text:C.textSub,border:C.border};
  return <span style={{background:m.bg,color:m.text,border:`1px solid ${m.border}`,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:m.text,display:"inline-block"}}/>
    {s}
  </span>;
};

const Btn = ({children,onClick,v="primary",sm,danger,style={}}) => {
  const base = {borderRadius:7,padding:sm?"5px 11px":"8px 16px",fontWeight:600,fontSize:sm?11:13,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,border:"none",transition:"all 0.12s",fontFamily:"inherit",...style};
  const vs = {
    primary:{background:C.accent,color:"#fff"},
    secondary:{background:C.surface,color:C.textMid,border:`1px solid ${C.border}`},
    ghost:{background:"transparent",color:C.accent,border:`1px solid ${C.accentB}`},
    danger:{background:C.redL,color:C.red,border:`1px solid ${C.redB}`},
  };
  const s = danger ? vs.danger : vs[v]||vs.primary;
  return <button onClick={onClick} style={{...base,...s}}
    onMouseEnter={e=>{e.currentTarget.style.opacity="0.82";e.currentTarget.style.transform="translateY(-1px)";}}
    onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="translateY(0)";}}
  >{children}</button>;
};

const Field = ({label,children}) => <div>
  <label style={{fontSize:11,color:C.textSub,display:"block",marginBottom:5,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</label>
  {children}
</div>;

const inputStyle = {width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
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
  return <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:isMobile?14:22,...style}}>{children}</div>;
};

const Stat = ({label,value,sub,color=C.accent,icon}) => {
  const isMobile = useMobile();
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:isMobile?"12px 14px":"16px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:color,borderRadius:"10px 0 0 10px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?6:10}}>
        <span style={{fontSize:isMobile?10:11,color:C.textMuted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
        {icon&&!isMobile&&<div style={{width:28,height:28,borderRadius:7,background:color+"15",display:"flex",alignItems:"center",justifyContent:"center",color}}><Ic d={I[icon]} s={13}/></div>}
      </div>
      <div style={{fontSize:isMobile?18:24,fontWeight:700,color:C.text,letterSpacing:"-0.03em",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{sub}</div>}
    </div>
  );
};

const PageHead = ({eyebrow,title,action}) => {
  const isMobile = useMobile();
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",paddingBottom:isMobile?14:20,borderBottom:`1px solid ${C.border}`,marginBottom:isMobile?16:24,flexDirection:isMobile?"column":"row",gap:isMobile?10:0}}>
      <div>
        {eyebrow&&<div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{eyebrow}</div>}
        <div style={{fontSize:isMobile?16:20,fontWeight:700,color:C.text,letterSpacing:"-0.02em"}}>{title}</div>
      </div>
      {action&&<div style={{width:isMobile?"100%":"auto"}}>{action}</div>}
    </div>
  );
};

const TH = ({children,right}) => <th style={{padding:"11px 14px",textAlign:right?"right":"left",fontSize:11,color:C.textSub,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{children}</th>;
const TD = ({children,right,bold,muted,color}) => <td style={{padding:"12px 14px",fontSize:13,textAlign:right?"right":"left",color:color||(muted?C.textSub:C.text),fontWeight:bold?700:400}}>{children}</td>;

const Table = ({heads,children,empty}) => (
  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
        <thead><tr style={{borderBottom:`1px solid ${C.border}`,background:C.bg}}>{heads.map((h,i)=><TH key={i} right={h.r}>{h.l}</TH>)}</tr></thead>
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
  <div style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Card style={{maxWidth:380,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
      <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:8}}>Confirm Delete</div>
      <div style={{fontSize:13,color:C.textSub,marginBottom:24,lineHeight:1.6}}>{msg}</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn v="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn danger onClick={onOk}>Delete</Btn>
      </div>
    </Card>
  </div>
);

const Modal = ({title,onClose,children,width=640}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,borderRadius:12,width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
      <div style={{padding:"18px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textSub,padding:4,display:"flex"}}><Ic d={I.x} s={18}/></button>
      </div>
      <div style={{padding:22}}>{children}</div>
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
  <div style={{height:h,background:C.bg,borderRadius:h/2}}>
    <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,borderRadius:h/2,transition:"width 0.3s"}}/>
  </div>
);

const DeleteBtn = ({onClick}) => (
  <button onClick={onClick} title="Delete"
    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 7px",cursor:"pointer",color:C.textMuted,display:"inline-flex",alignItems:"center"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}
  ><Ic d={I.trash} s={13}/></button>
);

const EditBtn = ({onClick}) => (
  <button onClick={onClick} title="Edit"
    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 7px",cursor:"pointer",color:C.textSub,display:"inline-flex",alignItems:"center"}}
  ><Ic d={I.edit} s={13}/></button>
);

const EmptyState = ({msg,action}) => (
  <div style={{padding:"40px 20px",textAlign:"center"}}>
    <div style={{fontSize:13,color:C.textMuted,marginBottom:action?14:0}}>{msg}</div>
    {action}
  </div>
);

const Tabs = ({tabs,active,onChange}) => (
  <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginBottom:20,scrollbarWidth:"none"}}
    onScroll={e=>e.stopPropagation()}>
    <div style={{display:"flex",gap:2,borderBottom:`1px solid ${C.border}`,minWidth:"max-content"}}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)}
          style={{padding:"9px 14px",border:"none",borderBottom:active===t?`2px solid ${C.accent}`:"2px solid transparent",background:"none",color:active===t?C.accent:C.textSub,fontSize:13,fontWeight:active===t?600:400,cursor:"pointer",textTransform:"capitalize",marginBottom:-1,fontFamily:"inherit",whiteSpace:"nowrap"}}>
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({projects,invoices,cos,onNav}) => {
  const active = projects.filter(p=>p.status==="Active");
  const pipeline = projects.reduce((s,p)=>s+p.value,0);
  const overdue = invoices.filter(i=>i.status==="Overdue");
  const pendingInv = invoices.filter(i=>i.status==="Pending");
  const receivables = [...overdue,...pendingInv].reduce((s,i)=>s+i.amount,0);
  const pendingCOs = cos.filter(c=>c.status==="Pending");

  const isMobile = useMobile();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:isMobile?16:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",paddingBottom:isMobile?14:22,borderBottom:`1px solid ${C.border}`}}>
        <div>
          <div style={{fontSize:isMobile?17:22,fontWeight:800,color:C.text,letterSpacing:"-0.03em"}}>BuildFlow Pro 👷</div>
          <div style={{fontSize:12,color:C.textSub,marginTop:4}}>{new Date().toLocaleDateString("en-US",{weekday:isMobile?"short":"long",year:"numeric",month:isMobile?"short":"long",day:"numeric"})}</div>
        </div>
        <Btn sm={isMobile} onClick={()=>onNav("projects")}><Ic d={I.plus} s={14}/> {isMobile?"New":"New Project"}</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:isMobile?10:14}}>
        <Stat label="Active" value={active.length} sub={`${projects.length} total`} color={C.accent} icon="proj"/>
        <Stat label="Pipeline" value={fmt(pipeline)} color={C.green} icon="trend"/>
        <Stat label="Receivables" value={fmt(receivables)} sub={`${overdue.length} overdue`} color={overdue.length>0?C.red:C.amber} icon="inv"/>
        <Stat label="Pending COs" value={pendingCOs.length} sub={fmt(pendingCOs.reduce((s,c)=>s+c.amount,0))} color={C.purple} icon="co"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 300px",gap:isMobile?16:20}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>Active Projects</div>
            <button onClick={()=>onNav("projects")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontWeight:600}}>View all →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {active.map(p=>{
              const pct = p.value?Math.round((p.spent/p.value)*100):0;
              return (
                <Card key={p.id} style={{padding:"14px 18px",cursor:"pointer"}} onClick={()=>onNav("projects",p.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:2}}>{p.name}</div>
                      <div style={{fontSize:12,color:C.textSub}}>{p.client} · {p.phase}</div>
                    </div>
                    <Badge s={p.status}/>
                  </div>
                  <div style={{display:"flex",gap:20,marginBottom:10}}>
                    <div><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Contract</div><div style={{fontSize:14,fontWeight:700,color:C.accent}}>{fmt(p.value)}</div></div>
                    <div><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Spent</div><div style={{fontSize:14,fontWeight:600,color:C.text}}>{fmt(p.spent)}</div></div>
                    <div><div style={{fontSize:10,color:C.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Budget</div><div style={{fontSize:14,fontWeight:600,color:pct>90?C.red:C.green}}>{pct}%</div></div>
                  </div>
                  <Progress pct={p.progress}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMuted,marginTop:6}}><span>Progress: {p.progress}%</span><span>{p.end}</span></div>
                </Card>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14}}>Unpaid Invoices</div>
            {[...overdue,...pendingInv].slice(0,5).map(inv=>{
              const p=projects.find(x=>x.id===inv.projectId);
              return (
                <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{inv.number}</div><div style={{fontSize:11,color:C.textSub,marginTop:1}}>{p?.name?.substring(0,18)}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{fmt(inv.amount)}</div><Badge s={inv.status}/></div>
                </div>
              );
            })}
            {[...overdue,...pendingInv].length===0&&<div style={{fontSize:12,color:C.textMuted,padding:"8px 0"}}>All caught up ✓</div>}
          </Card>

          <Card>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14}}>Pipeline</div>
            {["Lead","Estimate","Active","Complete"].map(s=>{
              const sc=STATUS_MAP[s]; const count=projects.filter(p=>p.status===s).length; const val=projects.filter(p=>p.status===s).reduce((a,p)=>a+p.value,0);
              return <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:sc?.text,display:"inline-block"}}/><span style={{fontSize:13,color:C.textMid}}>{s}</span><span style={{fontSize:11,color:C.textMuted,background:C.bg,padding:"1px 7px",borderRadius:10}}>{count}</span></div>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{fmt(val)}</span>
              </div>;
            })}
          </Card>

          {pendingCOs.length>0&&(
            <Card style={{background:C.amberL,border:`1px solid ${C.amberB}`}}>
              <div style={{fontSize:13,fontWeight:600,color:C.amber,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><Ic d={I.alert} s={14} stroke={C.amber}/>{pendingCOs.length} COs Awaiting Approval</div>
              {pendingCOs.map(co=>{
                const p=projects.find(x=>x.id===co.projectId);
                return <div key={co.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.amberB}`,fontSize:12}}>
                  <div style={{fontWeight:600,color:C.text,marginBottom:2}}>{co.number} – {co.title.substring(0,28)}</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textSub}}>{p?.name?.substring(0,18)}</span><span style={{color:C.amber,fontWeight:700}}>+{fmt(co.amount)}</span></div>
                </div>;
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── BUDGET (used inside project detail) ─────────────────────────────────────
const Budget = ({projectId,budgetItems,setBudgetItems,projects,setProjects}) => {
  const [form,setForm] = useState(null); // null=hidden, {}=add, {id}=edit
  const [delId,setDelId] = useState(null);
  const CATS = ["Demo & Site Prep","Foundation","Concrete","Framing","Roofing","Windows & Doors","Electrical","Plumbing","HVAC","Insulation","Drywall","Flooring","Cabinets & Millwork","Countertops","Tile","Painting","Exterior & Landscaping","Permits & Fees","Equipment Rental","General Conditions","Contingency","Other"];
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
    if(form.id) {
      next = budgetItems.map(b=>b.id===form.id?item:b);
    } else {
      next = [...budgetItems,{...item,id:uid()}];
    }
    setBudgetItems(next);
    syncSpent(next);
    setForm(null);
  };

  const del = () => {
    const next = budgetItems.filter(b=>b.id!==delId);
    setBudgetItems(next);
    syncSpent(next);
    setDelId(null);
  };

  const pct = totalB ? Math.round((totalA/totalB)*100) : 0;

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
        <Btn sm onClick={()=>setForm({category:"",budgeted:"",actual:"",committed:"",notes:""})}><Ic d={I.plus} s={13}/> Add Line Item</Btn>
      </div>

      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"Add"} Budget Line</div>
          <Grid cols="2fr 1fr 1fr 1fr" gap={12}>
            <Sel label="Cost Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={["Select category...",...CATS]}/>
            <Inp label="Budgeted ($)" type="number" value={form.budgeted} onChange={e=>setForm({...form,budgeted:e.target.value})} placeholder="0"/>
            <Inp label="Actual ($)" type="number" value={form.actual} onChange={e=>setForm({...form,actual:e.target.value})} placeholder="0"/>
            <Inp label="Committed ($)" type="number" value={form.committed} onChange={e=>setForm({...form,committed:e.target.value})} placeholder="0"/>
            <div style={{gridColumn:"span 4"}}><Inp label="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Subcontractor, vendor, notes..."/></div>
          </Grid>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={save}>{form.id?"Save Changes":"Add Item"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {items.length===0&&form===null?(
        <Card><EmptyState msg="No budget items yet. Add cost categories to track your job costs." action={<Btn sm onClick={()=>setForm({category:"",budgeted:"",actual:"",committed:"",notes:""})}>+ Add First Item</Btn>}/></Card>
      ):(
        <Table heads={[{l:"Category"},{l:"Notes"},{l:"Budgeted",r:true},{l:"Actual",r:true},{l:"Committed",r:true},{l:"Variance",r:true},{l:"% Used",r:true},{l:""}]}>
          {items.map(b=>{
            const v=b.budgeted-b.actual; const p=b.budgeted?Math.round((b.actual/b.budgeted)*100):0;
            return <TR key={b.id}>
              <TD><span style={{fontWeight:600}}>{b.category}</span></TD>
              <TD muted>{b.notes||"—"}</TD>
              <TD right>{fmt(b.budgeted)}</TD>
              <TD right bold>{fmt(b.actual)}</TD>
              <TD right muted>{fmt(b.committed)}</TD>
              <TD right color={v<0?C.red:C.green}>{v<0?"-":"+  "}{fmt(Math.abs(v))}</TD>
              <td style={{padding:"12px 14px",minWidth:100}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:5,background:C.bg,borderRadius:3}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,background:p>100?C.red:p>80?C.amber:C.green,borderRadius:3}}/></div>
                  <span style={{fontSize:11,fontWeight:600,color:p>100?C.red:C.textMid,minWidth:32}}>{p}%</span>
                </div>
              </td>
              <td style={{padding:"12px 14px"}}>
                <div style={{display:"flex",gap:6}}>
                  <EditBtn onClick={()=>setForm({...b})}/>
                  <DeleteBtn onClick={()=>setDelId(b.id)}/>
                </div>
              </td>
            </TR>;
          })}
          {items.length>0&&(
            <tr style={{background:C.accentL,borderTop:`2px solid ${C.accentB}`}}>
              <td colSpan={2} style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.accent}}>TOTALS</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right"}}>{fmt(totalB)}</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right",color:totalA>totalB?C.red:C.green}}>{fmt(totalA)}</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right",color:C.textMid}}>{fmt(totalC)}</td>
              <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,textAlign:"right",color:(totalB-totalA)<0?C.red:C.green}}>{(totalB-totalA)<0?"-":"+"}{fmt(Math.abs(totalB-totalA))}</td>
              <td colSpan={2}/>
            </tr>
          )}
        </Table>
      )}
    </div>
  );
};

// ─── ESTIMATES (used inside project detail) ───────────────────────────────────
const EstimateDetail = ({est,estimates,setEstimates,onBack}) => {
  const [form,setForm] = useState(null);
  const [delItemId,setDelItemId] = useState(null);
  const CATS = ["Demo","Foundation","Framing","Electrical","Plumbing","HVAC","Insulation","Drywall","Flooring","Cabinets","Countertops","Tile","Painting","Roofing","Windows & Doors","Exterior","Landscaping","Permits","Equipment","GC Overhead","Profit","Other"];
  const UNITS = ["LS","SF","LF","EA","HR","SY","CY","TN","GAL","BD","SQ"];
  const lineTotal = i => i.qty*i.cost*(1+i.markup/100);
  const subtotal = est.lineItems.reduce((s,i)=>s+i.qty*i.cost,0);
  const total = est.lineItems.reduce((s,i)=>s+lineTotal(i),0);
  const markupAmt = total-subtotal;

  const update = fn => setEstimates(estimates.map(e=>e.id===est.id?fn(e):e));

  const saveItem = () => {
    if(!form.category||!form.description||!form.cost) return;
    const item = {...form,qty:parseFloat(form.qty)||1,cost:parseFloat(form.cost)||0,markup:parseFloat(form.markup)||0};
    if(form.id) {
      update(e=>({...e,lineItems:e.lineItems.map(i=>i.id===form.id?{...item,id:form.id}:i)}));
    } else {
      update(e=>({...e,lineItems:[...e.lineItems,{...item,id:uid()}]}));
    }
    setForm(null);
  };

  const delItem = () => { update(e=>({...e,lineItems:e.lineItems.filter(i=>i.id!==delItemId)})); setDelItemId(null); };
  const setStatus = s => update(e=>({...e,status:s}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delItemId&&<Confirm msg="Remove this line item?" onOk={delItem} onCancel={()=>setDelItemId(null)}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Btn v="secondary" sm onClick={onBack}><Ic d={I.back} s={13}/> Back</Btn>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:C.text}}>{est.name}</div>
            <div style={{fontSize:12,color:C.textSub}}>{est.date} · {est.lineItems.length} line items</div>
          </div>
          <Badge s={est.status}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          {est.status==="Draft"&&<Btn v="ghost" sm onClick={()=>setStatus("Sent")}><Ic d={I.send} s={12}/> Mark Sent</Btn>}
          {est.status==="Sent"&&<Btn sm onClick={()=>setStatus("Approved")}><Ic d={I.check} s={12}/> Mark Approved</Btn>}
          {est.status!=="Draft"&&<Btn v="secondary" sm onClick={()=>setStatus("Draft")}>Revert to Draft</Btn>}
          <Btn sm onClick={()=>setForm({category:"",description:"",qty:1,unit:"LS",cost:"",markup:20})}><Ic d={I.plus} s={13}/> Add Line</Btn>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <Stat label="Cost Subtotal" value={fmt(subtotal)} color={C.blue} icon="dollar"/>
        <Stat label="Markup" value={fmt(markupAmt)} sub={subtotal?`${Math.round((markupAmt/subtotal)*100)}%`:""} color={C.amber} icon="trend"/>
        <Stat label="Contract Total" value={fmt(total)} color={C.accent} icon="dollar"/>
        <Stat label="Line Items" value={est.lineItems.length} color={C.purple} icon="est"/>
      </div>

      {form!==null&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>{form.id?"Edit":"Add"} Line Item</div>
          <Grid cols="1fr 1fr" gap={12}>
            <Sel label="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={["Select...",...CATS]}/>
            <Inp label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe scope of work"/>
            <Inp label="Qty" type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/>
            <Sel label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} options={UNITS}/>
            <Inp label="Unit Cost ($)" type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0.00"/>
            <Inp label="Markup %" type="number" value={form.markup} onChange={e=>setForm({...form,markup:e.target.value})}/>
          </Grid>
          {form.cost&&form.qty&&(
            <div style={{marginTop:12,padding:"10px 14px",background:C.accentL,borderRadius:7,fontSize:13}}>
              Line total: <strong style={{color:C.accent}}>{fmt((parseFloat(form.qty)||0)*(parseFloat(form.cost)||0)*(1+(parseFloat(form.markup)||0)/100))}</strong>
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn onClick={saveItem}>{form.id?"Save":"Add Line Item"}</Btn>
            <Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <Table heads={[{l:"Category"},{l:"Description"},{l:"Qty",r:true},{l:"Unit",r:true},{l:"Unit Cost",r:true},{l:"Markup",r:true},{l:"Line Total",r:true},{l:""}]}>
        {est.lineItems.map(item=>(
          <TR key={item.id}>
            <td style={{padding:"11px 14px"}}><span style={{fontSize:11,color:C.accent,background:C.accentL,padding:"2px 8px",borderRadius:5,fontWeight:600}}>{item.category}</span></td>
            <TD>{item.description}</TD>
            <TD right muted>{item.qty}</TD>
            <TD right muted>{item.unit}</TD>
            <TD right muted>{fmt(item.cost)}</TD>
            <td style={{padding:"11px 14px",textAlign:"right",fontSize:13,color:C.amber,fontWeight:500}}>{item.markup}%</td>
            <TD right bold color={C.accent}>{fmt(lineTotal(item))}</TD>
            <td style={{padding:"11px 14px"}}>
              <div style={{display:"flex",gap:6}}>
                <EditBtn onClick={()=>setForm({...item})}/>
                <DeleteBtn onClick={()=>setDelItemId(item.id)}/>
              </div>
            </td>
          </TR>
        ))}
        {est.lineItems.length===0&&<tr><td colSpan={8}><EmptyState msg="No line items yet. Click 'Add Line' above."/></td></tr>}
        {est.lineItems.length>0&&(<>
          <tr style={{background:C.bg,borderTop:`1px solid ${C.border}`}}>
            <td colSpan={6} style={{padding:"10px 14px",fontSize:12,color:C.textSub,textAlign:"right",fontWeight:600}}>COST SUBTOTAL</td>
            <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,textAlign:"right"}}>{fmt(subtotal)}</td>
            <td/>
          </tr>
          <tr style={{background:C.accentL,borderTop:`2px solid ${C.accentB}`}}>
            <td colSpan={6} style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:C.accent,textAlign:"right"}}>CONTRACT TOTAL</td>
            <td style={{padding:"12px 14px",fontSize:16,fontWeight:800,textAlign:"right",color:C.accent}}>{fmt(total)}</td>
            <td/>
          </tr>
        </>)}
      </Table>
    </div>
  );
};

const Estimates = ({projectId,estimates,setEstimates,project}) => {
  const [selectedId,setSelectedId] = useState(null);
  const [showForm,setShowForm] = useState(false);
  const [delId,setDelId] = useState(null);
  const [form,setForm] = useState({name:"",notes:""});
  const items = estimates.filter(e=>e.projectId===projectId);
  const calcTotal = items => items.reduce((s,i)=>s+i.qty*i.cost*(1+i.markup/100),0);

  const create = () => {
    if(!form.name) return;
    const e = {id:uid(),projectId,name:form.name,notes:form.notes,status:"Draft",date:today(),lineItems:[]};
    setEstimates([...estimates,e]);
    setSelectedId(e.id);
    setShowForm(false);
    setForm({name:"",notes:""});
  };

  const del = () => { setEstimates(estimates.filter(e=>e.id!==delId)); setDelId(null); if(selectedId===delId)setSelectedId(null); };

  if(selectedId) {
    const est = estimates.find(e=>e.id===selectedId);
    if(!est){setSelectedId(null);return null;}
    return <EstimateDetail est={est} estimates={estimates} setEstimates={setEstimates} onBack={()=>setSelectedId(null)}/>;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {delId&&<Confirm msg="Delete this estimate and all its line items?" onOk={del} onCancel={()=>setDelId(null)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>Estimates</div>
        <Btn sm onClick={()=>setShowForm(true)}><Ic d={I.plus} s={13}/> New Estimate</Btn>
      </div>
      {showForm&&(
        <Card style={{border:`1px solid ${C.accentB}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>New Estimate</div>
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
      {items.length===0&&!showForm&&<Card><EmptyState msg="No estimates yet. Create one to start building your bid." action={<Btn sm onClick={()=>setShowForm(true)}>+ Create First Estimate</Btn>}/></Card>}
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
  const items = invoices.filter(i=>i.projectId===projectId);
  const paid=items.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0);
  const outstanding=items.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.amount,0);

  const save = () => {
    if(!form.description||!form.amount) return;
    const num=`INV-${new Date().getFullYear()}-${String(invoices.length+1).padStart(3,"0")}`;
    if(form.id) {
      setInvoices(invoices.map(i=>i.id===form.id?{...form,amount:parseFloat(form.amount)}:i));
    } else {
      setInvoices([...invoices,{...form,id:uid(),projectId,number:num,status:"Pending",issued:today(),amount:parseFloat(form.amount)}]);
    }
    setForm(null);
  };

  const del = () => { setInvoices(invoices.filter(i=>i.id!==delId)); setDelId(null); };
  const setStatus = (id,s) => setInvoices(invoices.map(i=>i.id===id?{...i,status:s}:i));

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
      setCos([...cos,{...form,id:uid(),number:num,status:"Pending",date:today(),projectId:projId,amount:parseFloat(form.amount)}]);
    }
    setForm(null);
  };

  const del = () => { setCos(cos.filter(c=>c.id!==delId)); setDelId(null); };
  const setStatus = (id,s) => setCos(cos.map(c=>c.id===id?{...c,status:s}:c));
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
            <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,fontWeight:500,cursor:"pointer"}}>{s}</button>
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
                    <span style={{fontSize:11,fontWeight:600,color:cc,background:cc+"18",padding:"2px 9px",borderRadius:10}}>{co.category}</span>
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
  const items = projectId ? logs.filter(l=>l.projectId===projectId) : (filterProj==="All"?logs:logs.filter(l=>l.projectId===filterProj));

  const save = () => {
    if(!form.notes||!form.projectId) return;
    if(form.id) {
      setLogs(logs.map(l=>l.id===form.id?{...form,crew:parseInt(form.crew)||0}:l));
    } else {
      setLogs([{...form,id:uid(),projectId:form.projectId,crew:parseInt(form.crew)||0,photos:0},...logs]);
    }
    setForm(null);
  };

  const del = () => { setLogs(logs.filter(l=>l.id!==delId)); setDelId(null); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this log entry?" onOk={del} onCancel={()=>setDelId(null)}/>}

      {!projectId&&<PageHead eyebrow="Field Reports" title="Daily Logs" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",date:today(),author:"Jake Moreno",weather:"",crew:"",notes:""})}><Ic d={I.plus} s={14}/> New Log</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Field Logs</div><Btn sm onClick={()=>setForm({projectId,date:today(),author:"Jake Moreno",weather:"",crew:"",notes:""})}><Ic d={I.plus} s={13}/> New Log</Btn></div>}

      {!projectId&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={()=>setFilterProj("All")} style={{background:filterProj==="All"?C.accent:C.surface,color:filterProj==="All"?"#fff":C.textMid,border:`1px solid ${filterProj==="All"?C.accent:C.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>All Projects</button>
          {projects.filter(p=>p.status==="Active").map(p=>(
            <button key={p.id} onClick={()=>setFilterProj(String(p.id))} style={{background:filterProj===String(p.id)?C.accent:C.surface,color:filterProj===String(p.id)?"#fff":C.textMid,border:`1px solid ${filterProj===String(p.id)?C.accent:C.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{p.name.split(" ").slice(0,2).join(" ")}</button>
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

      {items.length===0&&form===null&&<Card><EmptyState msg="No log entries yet." action={<Btn sm onClick={()=>setForm({projectId:projectId||projects[0]?.id||"",date:today(),author:"Jake Moreno",weather:"",crew:"",notes:""})}>+ New Log</Btn>}/></Card>}
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
                  <div style={{background:C.accentL,borderRadius:7,padding:"8px 14px",textAlign:"center"}}>
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
  const items = projectId ? bids.filter(b=>b.projectId===projectId) : bids;
  const pkg = selectedId ? bids.find(b=>b.id===selectedId) : null;

  const savePkg = () => {
    if(!pkgForm.trade) return;
    const projId=pkgForm.projectId||projectId;
    if(pkgForm.id){setBids(bids.map(b=>b.id===pkgForm.id?{...pkgForm,projectId:projId||pkgForm.projectId}:b));}
    else{setBids([...bids,{...pkgForm,id:uid(),projectId:projId,status:"Open",bids:[]}]);}
    setPkgForm(null);
  };

  const saveBid = () => {
    if(!bidForm.subName||!bidForm.amount) return;
    if(bidForm.id){setBids(bids.map(b=>b.id===selectedId?{...b,bids:b.bids.map(x=>x.subId===bidForm.id?{...bidForm,amount:parseFloat(bidForm.amount)}:x)}:b));}
    else{setBids(bids.map(b=>b.id===selectedId?{...b,bids:[...b.bids,{...bidForm,subId:uid(),amount:parseFloat(bidForm.amount),submitted:today(),awarded:false}]}:b));}
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
                    {isLow&&<span style={{fontSize:10,background:C.greenL,color:C.green,border:`1px solid ${C.greenB}`,padding:"2px 8px",borderRadius:10,fontWeight:700}}>LOW BID</span>}
                    {bid.awarded&&<span style={{fontSize:10,background:C.green,color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700}}>AWARDED</span>}
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
  const [delId,setDelId] = useState(null);
  const [filterType,setFilterType] = useState("All");
  const items = projectId ? docs.filter(d=>d.projectId===projectId) : docs;
  const filtered = filterType==="All"?items:items.filter(d=>d.type===filterType);
  const TYPES = ["Contract","Plans","Permit","Engineering","Scope","Submittal","Inspection","RFI","Proposal","Other"];
  const TYPE_COLOR = {Contract:C.accent,Plans:C.purple,Permit:C.green,Engineering:C.blue,Scope:C.amber,Submittal:C.blue,Inspection:C.green,RFI:C.red,Proposal:C.amber,Other:C.textSub};
  const TYPE_BG = {Contract:C.accentL,Plans:C.purpleL,Permit:C.greenL,Engineering:C.blueL,Scope:C.amberL,Submittal:C.blueL,Inspection:C.greenL,RFI:C.redL,Proposal:C.amberL,Other:C.bg};

  const save = () => {
    if(!form.name) return;
    if(form.id){setDocs(docs.map(d=>d.id===form.id?form:d));}
    else{setDocs([...docs,{...form,id:uid(),projectId:form.projectId||projectId,uploader:"Jake Moreno",date:form.date||today()}]);}
    setForm(null);
  };
  const del = () => { setDocs(docs.filter(d=>d.id!==delId)); setDelId(null); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this document record?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {!projectId&&<PageHead eyebrow="Files & Plans" title="Documents" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",name:"",type:"Contract",date:today(),notes:""})}><Ic d={I.plus} s={14}/> Add Document</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Documents</div><Btn sm onClick={()=>setForm({name:"",type:"Contract",date:today(),notes:""})}><Ic d={I.plus} s={13}/> Add</Btn></div>}
      
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {["All",...TYPES].map(t=><button key={t} onClick={()=>setFilterType(t)} style={{background:filterType===t?(TYPE_BG[t]||C.accentL):C.surface,color:filterType===t?(TYPE_COLOR[t]||C.accent):C.textMid,border:`1px solid ${filterType===t?(TYPE_COLOR[t]||C.accent)+"40":C.border}`,borderRadius:7,padding:"5px 12px",fontSize:12,fontWeight:filterType===t?600:400,cursor:"pointer"}}>{t}</button>)}
      </div>

      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{form.id?"Edit":"Add"} Document</div>
        <Grid cols="1fr 1fr" gap={12}>
          <Span2><Inp label="Document / File Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Webb – Executed Contract.pdf"/></Span2>
          {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
          <Sel label="Document Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={TYPES}/>
          <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          <Span2><Inp label="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Span2>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>{form.id?"Save Changes":"Add Document"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}

      {filtered.length===0&&!form&&<Card><EmptyState msg="No documents found." action={<Btn sm onClick={()=>setForm({projectId:projects[0]?.id||"",name:"",type:"Contract",date:today(),notes:""})}>+ Add Document</Btn>}/></Card>}
      <Table heads={[{l:"Document"},{l:"Type"},...(!projectId?[{l:"Project"}]:[]),{l:"Date"},{l:"Uploaded By"},{l:""}]}>
        {filtered.map(doc=>{
          const p=projects.find(x=>x.id===doc.projectId);
          const tc=TYPE_COLOR[doc.type]||C.textSub; const tb=TYPE_BG[doc.type]||C.bg;
          return <TR key={doc.id}>
            <td style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,background:tb,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:tc,flexShrink:0}}><Ic d={I.docs} s={13}/></div>
                <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{doc.name}</div>{doc.notes&&<div style={{fontSize:11,color:C.textMuted,marginTop:1}}>{doc.notes}</div>}</div>
              </div>
            </td>
            <td style={{padding:"12px 14px"}}><span style={{fontSize:11,fontWeight:600,color:tc,background:tb,padding:"3px 9px",borderRadius:5}}>{doc.type}</span></td>
            {!projectId&&<TD muted>{p?.name?.substring(0,20)||"—"}</TD>}
            <TD muted>{fmtDate(doc.date)}</TD>
            <TD muted>{doc.uploader}</TD>
            <td style={{padding:"12px 14px"}}><div style={{display:"flex",gap:6}}><EditBtn onClick={()=>setForm({...doc})}/><DeleteBtn onClick={()=>setDelId(doc.id)}/></div></td>
          </TR>;
        })}
      </Table>
    </div>
  );
};

// ─── PHOTOS ───────────────────────────────────────────────────────────────────
const Photos = ({projectId,photos,setPhotos,projects}) => {
  const [form,setForm] = useState(null);
  const [lightbox,setLightbox] = useState(null);
  const [delId,setDelId] = useState(null);
  const [filterTag,setFilterTag] = useState("All");
  const items = projectId ? photos.filter(p=>p.projectId===projectId) : photos;
  const filtered = filterTag==="All"?items:items.filter(p=>p.tag===filterTag);
  const TAGS = ["Progress","Milestone","Issue","Before","After","Inspection","Material","Complete"];
  const TAG_COLOR = {Progress:C.blue,Milestone:C.green,Issue:C.red,Before:C.purple,After:C.green,Inspection:C.amber,Material:C.accent,Complete:C.green};
  const TAG_BG = {Progress:C.blueL,Milestone:C.greenL,Issue:C.redL,Before:C.purpleL,After:C.greenL,Inspection:C.amberL,Material:C.accentL,Complete:C.greenL};
  const EMOJIS = {Progress:"🏗️",Milestone:"✅",Issue:"⚠️",Before:"📸",After:"🏡",Inspection:"📋",Material:"📦",Complete:"🎉"};
  const COLORS = ["#E8F4F8","#F0F8E8","#FEF3EC","#F4F0FD","#F0FBF5","#FDF8EE","#FEF2F2","#EEF3FD"];

  const save = () => {
    if(!form.caption) return;
    if(form.id){setPhotos(photos.map(p=>p.id===form.id?form:p));}
    else{setPhotos([{...form,id:uid(),projectId:form.projectId||projectId,emoji:EMOJIS[form.tag]||"📷",color:COLORS[Math.floor(Math.random()*COLORS.length)]},...photos]);}
    setForm(null);
  };
  const del = () => { setPhotos(photos.filter(p=>p.id!==delId)); setDelId(null); setLightbox(null); };
  const lbPhoto = lightbox ? photos.find(p=>p.id===lightbox) : null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {delId&&<Confirm msg="Delete this photo?" onOk={del} onCancel={()=>setDelId(null)}/>}
      {lbPhoto&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:12,overflow:"hidden",maxWidth:540,width:"100%"}}>
            <div style={{background:lbPhoto.color,height:260,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64}}>{lbPhoto.emoji}</div>
            <div style={{padding:22}}>
              <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:6}}>{lbPhoto.caption}</div>
              <div style={{fontSize:13,color:C.textSub,marginBottom:16}}>{projects.find(p=>p.id===lbPhoto.projectId)?.name} · {fmtDate(lbPhoto.date)} · {lbPhoto.author}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:600,color:TAG_COLOR[lbPhoto.tag]||C.textSub,background:TAG_BG[lbPhoto.tag]||C.bg,padding:"3px 12px",borderRadius:20}}>{lbPhoto.tag}</span>
                <div style={{display:"flex",gap:8}}><Btn danger sm onClick={()=>setDelId(lbPhoto.id)}><Ic d={I.trash} s={13}/> Delete</Btn><Btn v="secondary" sm onClick={()=>setLightbox(null)}>Close</Btn></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!projectId&&<PageHead eyebrow="Job Site Documentation" title="Photo Gallery" action={<Btn onClick={()=>setForm({projectId:projects[0]?.id||"",caption:"",tag:"Progress",date:today(),author:"Jake Moreno"})}><Ic d={I.plus} s={14}/> Add Photo</Btn>}/>}
      {projectId&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Photos</div><Btn sm onClick={()=>setForm({caption:"",tag:"Progress",date:today(),author:"Jake Moreno"})}><Ic d={I.plus} s={13}/> Add Photo</Btn></div>}

      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {["All",...TAGS].map(t=><button key={t} onClick={()=>setFilterTag(t)} style={{background:filterTag===t?(TAG_BG[t]||C.accentL):C.surface,color:filterTag===t?(TAG_COLOR[t]||C.accent):C.textMid,border:`1px solid ${filterTag===t?(TAG_COLOR[t]||C.accent)+"40":C.border}`,borderRadius:7,padding:"5px 12px",fontSize:12,fontWeight:filterTag===t?600:400,cursor:"pointer"}}>{t}</button>)}
      </div>

      {form!==null&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{form.id?"Edit":"Add"} Photo</div>
        <Grid cols="1fr 1fr" gap={12}>
          {!projectId&&<Sel label="Project" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} options={projects.map(p=>({v:p.id,l:p.name}))}/>}
          <Sel label="Tag" value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} options={TAGS}/>
          <Inp label="Caption" value={form.caption} onChange={e=>setForm({...form,caption:e.target.value})} placeholder="Describe what this shows"/>
          <Inp label="Photographer" value={form.author} onChange={e=>setForm({...form,author:e.target.value})}/>
          <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </Grid>
        <div style={{display:"flex",gap:10,marginTop:14}}><Btn onClick={save}>{form.id?"Save":"Add Photo"}</Btn><Btn v="secondary" onClick={()=>setForm(null)}>Cancel</Btn></div>
      </Card>}

      {filtered.length===0&&!form&&<Card><EmptyState msg="No photos found." action={<Btn sm onClick={()=>setForm({projectId:projects[0]?.id||"",caption:"",tag:"Progress",date:today(),author:"Jake Moreno"})}>+ Add Photo</Btn>}/></Card>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {filtered.map(p=>(
          <div key={p.id} onClick={()=>setLightbox(p.id)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}>
            <div style={{background:p.color,height:130,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>{p.emoji}</div>
            <div style={{padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:4,lineHeight:1.3}}>{p.caption}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:10,fontWeight:600,color:TAG_COLOR[p.tag]||C.textSub,background:TAG_BG[p.tag]||C.bg,padding:"2px 7px",borderRadius:10}}>{p.tag}</span>
                <span style={{fontSize:10,color:C.textMuted}}>{p.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CONTACTS ────────────────────────────────────────────────────────────────
const Contacts = ({contacts,setContacts}) => {
  const [form,setForm] = useState(null);
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
    else{setContacts([...contacts,{...form,id:uid(),projects:[]}]);}
    setForm(null);
  };
  const del = () => { setContacts(contacts.filter(c=>c.id!==delId)); setDelId(null); };

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
          {["All",...TYPES].map(t=><button key={t} onClick={()=>setFilter(t)} style={{background:filter===t?(TYPE_BG[t]||C.accentL):C.surface,color:filter===t?(TYPE_COLOR[t]||C.accent):C.textMid,border:`1px solid ${filter===t?(TYPE_COLOR[t]||C.accent)+"40":C.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:filter===t?600:400,cursor:"pointer"}}>{t}</button>)}
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
            <td style={{padding:"12px 14px"}}><span style={{fontSize:11,fontWeight:600,color:tc,background:tb,padding:"3px 10px",borderRadius:20}}>{c.type}</span></td>
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

const Projects = ({projects,setProjects,estimates,setEstimates,invoices,setInvoices,budgetItems,setBudgetItems,cos,setCos,logs,setLogs,bids,setBids,docs,setDocs,photos,setPhotos,initialId}) => {
  const [filter,setFilter] = useState("All");
  const [selectedId,setSelectedId] = useState(null);
  const [activeTab,setActiveTab] = useState("overview");
  const [form,setForm] = useState(null);
  const [editMode,setEditMode] = useState(false);
  const [editProj,setEditProj] = useState(null);
  const [delId,setDelId] = useState(null);

  // Open project from dashboard nav — only fires once when initialId is set
  useEffect(()=>{ if(initialId) setSelectedId(initialId); },[initialId]);

  const STATUSES = ["All","Lead","Estimate","Active","On Hold","Complete"];
  const filtered = filter==="All"?projects:projects.filter(p=>p.status===filter);

  const createProject = () => {
    if(!form.name||!form.client) return;
    const p={...form,id:uid(),value:parseFloat(form.value)||0,spent:0,progress:0};
    setProjects([...projects,p]);
    setSelectedId(p.id);
    setActiveTab("overview");
    setForm(null);
  };

  const saveEdit = () => {
    setProjects(projects.map(p=>p.id===editProj.id?{...editProj,value:parseFloat(editProj.value)||0,progress:parseInt(editProj.progress)||0}:p));
    setEditMode(false);
  };

  const del = () => { setProjects(projects.filter(p=>p.id!==delId)); setDelId(null); if(selectedId===delId)setSelectedId(null); };

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
    const TABS = ["overview","budget","estimates","invoices","change orders","sub bids","daily logs","documents","photos"];

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
                    <div key={k} style={{background:C.bg,borderRadius:8,padding:"10px 14px"}}>
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
        {activeTab==="estimates"&&<Estimates projectId={p.id} estimates={estimates} setEstimates={setEstimates} project={p}/>}
        {activeTab==="invoices"&&<ProjInvoices projectId={p.id} invoices={invoices} setInvoices={setInvoices} project={p}/>}
        {activeTab==="change orders"&&<ChangeOrders projectId={p.id} cos={cos} setCos={setCos} projects={projects}/>}
        {activeTab==="sub bids"&&<SubBids projectId={p.id} bids={bids} setBids={setBids} projects={projects}/>}
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
          return <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.accent:C.surface,color:filter===s?"#fff":C.textMid,border:`1px solid ${filter===s?C.accent:C.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,fontWeight:filter===s?600:500,cursor:"pointer"}}>{s} <span style={{opacity:0.7}}>({cnt})</span></button>;
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:typeof window!=="undefined"&&window.innerWidth<=768?"1fr":"repeat(2,1fr)",gap:14}} className="proj-grid">
        {filtered.map(p=>{
          const pct=p.value?Math.round((p.spent/p.value)*100):0;
          return (
            <div key={p.id} style={{position:"relative"}}>
              <Card style={{cursor:"pointer",transition:"all 0.15s"}}
                onClick={()=>{setSelectedId(p.id);setActiveTab("overview");}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accentB;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.07)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:3}}>{p.name}</div>
                    <div style={{fontSize:12,color:C.textSub}}>{p.client}</div>
                  </div>
                  <Badge s={p.status}/>
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
              <button onClick={e=>{e.stopPropagation();setDelId(p.id);}} title="Delete"
                style={{position:"absolute",top:10,right:10,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 6px",cursor:"pointer",color:C.textMuted,zIndex:2}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}>
                <Ic d={I.trash} s={13}/>
              </button>
            </div>
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
  const TODAY="2026-03-12";

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

  const save = () => {
    if(!form.description||!form.amount||!form.projectId) return;
    const num=`INV-${new Date().getFullYear()}-${String(invoices.length+1).padStart(3,"0")}`;
    setInvoices([...invoices,{...form,id:uid(),number:num,status:"Pending",issued:today(),projectId:form.projectId,amount:parseFloat(form.amount)}]);
    setForm(null);
  };
  const del = () => { setInvoices(invoices.filter(i=>i.id!==delId)); setDelId(null); };
  const setStatus=(id,s)=>setInvoices(invoices.map(i=>i.id===id?{...i,status:s}:i));

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
        {["All","Pending","Overdue","Paid"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} style={{background:filterStatus===s?C.accent:C.surface,color:filterStatus===s?"#fff":C.textMid,border:`1px solid ${filterStatus===s?C.accent:C.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{s}</button>)}
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
const GlobalEstimates = ({estimates,setEstimates,projects}) => {
  const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState({projectId:projects[0]?.id||"",name:"",notes:""});
  const [navTo,setNavTo] = useState(null);
  const calcTotal=items=>items.reduce((s,i)=>s+i.qty*i.cost*(1+i.markup/100),0);

  if(navTo){
    const est=estimates.find(e=>e.id===navTo);
    if(!est){setNavTo(null);return null;}
    return <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Btn v="secondary" sm onClick={()=>setNavTo(null)}><Ic d={I.back} s={13}/> All Estimates</Btn>
      <EstimateDetail est={est} estimates={estimates} setEstimates={setEstimates} onBack={()=>setNavTo(null)}/>
    </div>;
  }

  const create = () => {
    if(!form.name||!form.projectId) return;
    const e={id:uid(),projectId:form.projectId,name:form.name,notes:form.notes,status:"Draft",date:today(),lineItems:[]};
    setEstimates([...estimates,e]);
    setNavTo(e.id);
    setShowForm(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageHead eyebrow="Bids & Proposals" title="Estimates" action={<Btn onClick={()=>setShowForm(true)}><Ic d={I.plus} s={14}/> New Estimate</Btn>}/>
      {showForm&&<Card style={{border:`1px solid ${C.accentB}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>New Estimate</div>
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



// ─── DB HELPERS ───────────────────────────────────────────────────────────────
const fromDb = {
  project: r => ({ id:r.id, name:r.name, client:r.client||"", status:r.status||"Lead", phase:r.phase||"Pre-Construction", type:r.type||"Residential", value:parseFloat(r.value)||0, spent:parseFloat(r.spent)||0, progress:parseInt(r.progress)||0, address:r.address||"", start:r.start_date||"", end:r.end_date||"", notes:r.notes||"" }),
  contact: r => ({ id:r.id, name:r.name, company:r.company||"", type:r.type||"Client", email:r.email||"", phone:r.phone||"", city:r.city||"" }),
  budget: r => ({ id:r.id, projectId:r.project_id, category:r.category||"", budgeted:parseFloat(r.budgeted)||0, actual:parseFloat(r.actual)||0, committed:parseFloat(r.committed)||0, notes:r.notes||"" }),
  estimate: (r, lines) => ({ id:r.id, projectId:r.project_id, name:r.name||"", status:r.status||"Draft", date:r.date||"", notes:r.notes||"", lineItems:(lines||[]).map(l=>({ id:l.id, category:l.category||"", description:l.description||"", qty:parseFloat(l.qty)||1, unit:l.unit||"LS", cost:parseFloat(l.cost)||0, markup:parseFloat(l.markup)||0 })) }),
  invoice: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", description:r.description||"", amount:parseFloat(r.amount)||0, issued:r.issued||"", due:r.due||"", status:r.status||"Pending" }),
  co: r => ({ id:r.id, projectId:r.project_id, number:r.number||"", title:r.title||"", category:r.category||"", description:r.description||"", amount:parseFloat(r.amount)||0, status:r.status||"Pending", requestedBy:r.requested_by||"Owner", date:r.date||"" }),
  log: r => ({ id:r.id, projectId:r.project_id, date:r.date||"", author:r.author||"", weather:r.weather||"", crew:parseInt(r.crew)||0, notes:r.notes||"" }),
  bidPkg: (r, bids) => ({ id:r.id, projectId:r.project_id, trade:r.trade||"", scope:r.scope||"", dueDate:r.due_date||"", status:r.status||"Open", bids:(bids||[]).map(b=>({ subId:b.id, subName:b.sub_name||"", amount:parseFloat(b.amount)||0, notes:b.notes||"", submitted:b.submitted||"", awarded:b.awarded||false })) }),
  doc: r => ({ id:r.id, projectId:r.project_id, name:r.name||"", type:r.type||"Contract", date:r.date||"", notes:r.notes||"", uploader:r.uploader||"" }),
  photo: r => ({ id:r.id, projectId:r.project_id, caption:r.caption||"", tag:r.tag||"Progress", date:r.date||"", author:r.author||"", emoji:r.emoji||"📷", color:r.color||"#F4F5F7" }),
};

// Direct DB operations — no diffing, just straight insert/update/delete
const db = {
  // Projects
  async saveProject(p) { const {error} = await sb.from("projects").upsert({id:p.id,name:p.name,client:p.client,status:p.status,phase:p.phase,type:p.type,value:p.value||0,spent:p.spent||0,progress:p.progress||0,address:p.address,start_date:p.start||null,end_date:p.end||null,notes:p.notes}); if(error) console.error("saveProject",error); return !error; },
  async deleteProject(id) { await sb.from("projects").delete().eq("id",id); },
  // Contacts
  async saveContact(c) { const {error} = await sb.from("contacts").upsert({id:c.id,name:c.name,company:c.company,type:c.type,email:c.email,phone:c.phone,city:c.city}); if(error) console.error("saveContact",error); return !error; },
  async deleteContact(id) { await sb.from("contacts").delete().eq("id",id); },
  // Budget
  async saveBudget(b) { const {error} = await sb.from("budget_items").upsert({id:b.id,project_id:b.projectId,category:b.category,budgeted:b.budgeted||0,actual:b.actual||0,committed:b.committed||0,notes:b.notes}); if(error) console.error("saveBudget",error); return !error; },
  async deleteBudget(id) { await sb.from("budget_items").delete().eq("id",id); },
  // Estimates
  async saveEstimate(e) { const {error} = await sb.from("estimates").upsert({id:e.id,project_id:e.projectId,name:e.name,status:e.status,date:e.date||null,notes:e.notes}); if(error) console.error("saveEstimate",error); return !error; },
  async deleteEstimate(id) { await sb.from("estimate_line_items").delete().eq("estimate_id",id); await sb.from("estimates").delete().eq("id",id); },
  async saveLineItem(l,estimateId) { const {error} = await sb.from("estimate_line_items").upsert({id:l.id,estimate_id:estimateId,category:l.category,description:l.description,qty:l.qty||1,unit:l.unit,cost:l.cost||0,markup:l.markup||0}); if(error) console.error("saveLineItem",error); return !error; },
  async deleteLineItem(id) { await sb.from("estimate_line_items").delete().eq("id",id); },
  // Invoices
  async saveInvoice(i) { const {error} = await sb.from("invoices").upsert({id:i.id,project_id:i.projectId,number:i.number,description:i.description,amount:i.amount||0,issued:i.issued||null,due:i.due||null,status:i.status}); if(error) console.error("saveInvoice",error); return !error; },
  async deleteInvoice(id) { await sb.from("invoices").delete().eq("id",id); },
  // Change Orders
  async saveCO(c) { const {error} = await sb.from("change_orders").upsert({id:c.id,project_id:c.projectId,number:c.number,title:c.title,category:c.category,description:c.description,amount:c.amount||0,status:c.status,requested_by:c.requestedBy,date:c.date||null}); if(error) console.error("saveCO",error); return !error; },
  async deleteCO(id) { await sb.from("change_orders").delete().eq("id",id); },
  // Daily Logs
  async saveLog(l) { const {error} = await sb.from("daily_logs").upsert({id:l.id,project_id:l.projectId,date:l.date||null,author:l.author,weather:l.weather,crew:l.crew||0,notes:l.notes}); if(error) console.error("saveLog",error); return !error; },
  async deleteLog(id) { await sb.from("daily_logs").delete().eq("id",id); },
  // Bid Packages
  async saveBidPkg(p) { const {error} = await sb.from("bid_packages").upsert({id:p.id,project_id:p.projectId,trade:p.trade,scope:p.scope,due_date:p.dueDate||null,status:p.status}); if(error) console.error("saveBidPkg",error); return !error; },
  async deleteBidPkg(id) { await sb.from("bids").delete().eq("package_id",id); await sb.from("bid_packages").delete().eq("id",id); },
  async saveBid(b,pkgId) { const {error} = await sb.from("bids").upsert({id:b.subId,package_id:pkgId,sub_name:b.subName,amount:b.amount||0,notes:b.notes,submitted:b.submitted||null,awarded:b.awarded||false}); if(error) console.error("saveBid",error); return !error; },
  async deleteBid(id) { await sb.from("bids").delete().eq("id",id); },
  // Documents
  async saveDoc(d) { const {error} = await sb.from("documents").upsert({id:d.id,project_id:d.projectId,name:d.name,type:d.type,date:d.date||null,notes:d.notes,uploader:d.uploader}); if(error) console.error("saveDoc",error); return !error; },
  async deleteDoc(id) { await sb.from("documents").delete().eq("id",id); },
  // Photos
  async savePhoto(p) { const {error} = await sb.from("photos").upsert({id:p.id,project_id:p.projectId,caption:p.caption,tag:p.tag,date:p.date||null,author:p.author,emoji:p.emoji,color:p.color}); if(error) console.error("savePhoto",error); return !error; },
  async deletePhoto(id) { await sb.from("photos").delete().eq("id",id); },
};

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab] = useState("dashboard");
  const [navPayload,setNavPayload] = useState(null);
  const [menuOpen,setMenuOpen] = useState(false);
  const [loading,setLoading] = useState(true);
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

  // ── Load all data ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [
          {data:proj,error:e1},{data:cont,error:e2},{data:budg,error:e3},
          {data:ests,error:e4},{data:lines,error:e5},{data:invs,error:e6},
          {data:cosr,error:e7},{data:lgsr,error:e8},{data:pkgs,error:e9},
          {data:bdsr,error:e10},{data:dcsr,error:e11},{data:phsr,error:e12}
        ] = await Promise.all([
          sb.from("projects").select("*").order("created_at",{ascending:false}),
          sb.from("contacts").select("*").order("created_at",{ascending:false}),
          sb.from("budget_items").select("*"),
          sb.from("estimates").select("*").order("created_at",{ascending:false}),
          sb.from("estimate_line_items").select("*"),
          sb.from("invoices").select("*").order("created_at",{ascending:false}),
          sb.from("change_orders").select("*").order("created_at",{ascending:false}),
          sb.from("daily_logs").select("*").order("date",{ascending:false}),
          sb.from("bid_packages").select("*").order("created_at",{ascending:false}),
          sb.from("bids").select("*"),
          sb.from("documents").select("*").order("created_at",{ascending:false}),
          sb.from("photos").select("*").order("created_at",{ascending:false}),
        ]);
        [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12].forEach(e=>e&&console.error("Load error:",e));
        setProjects((proj||[]).map(fromDb.project));
        setContacts((cont||[]).map(fromDb.contact));
        setBudgetItems((budg||[]).map(fromDb.budget));
        setEstimates((ests||[]).map(e=>fromDb.estimate(e,(lines||[]).filter(l=>l.estimate_id===e.id))));
        setInvoices((invs||[]).map(fromDb.invoice));
        setCos((cosr||[]).map(fromDb.co));
        setLogs((lgsr||[]).map(fromDb.log));
        setBids((pkgs||[]).map(p=>fromDb.bidPkg(p,(bdsr||[]).filter(b=>b.package_id===p.id))));
        setDocs((dcsr||[]).map(fromDb.doc));
        setPhotos((phsr||[]).map(fromDb.photo));
      } catch(e) { console.error("Load failed:",e); }
      setLoading(false);
    })();
  }, []);

  const navigate = (t,payload=null) => { setTab(t); setNavPayload(payload); setMenuOpen(false); };

  const NAV = [
    {id:"dashboard",label:"Dashboard",icon:"home"},
    {id:"projects",label:"Projects",icon:"proj"},
    {id:"estimates",label:"Estimates",icon:"est"},
    {id:"invoices",label:"Invoices",icon:"inv"},
    {id:"cos",label:"Change Orders",icon:"co"},
    {id:"budget",label:"Budget Tracker",icon:"budget"},
    {id:"bids",label:"Sub Bids",icon:"bids"},
    {id:"schedule",label:"Schedule",icon:"sched"},
    {id:"logs",label:"Daily Logs",icon:"logs"},
    {id:"docs",label:"Documents",icon:"docs"},
    {id:"photos",label:"Photos",icon:"photos"},
    {id:"contacts",label:"Contacts",icon:"contacts"},
  ];

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",flexDirection:"column",gap:16}}>
      <div style={{width:44,height:44,background:C.accent,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.hard} s={22} stroke="#fff"/></div>
      <div style={{fontSize:15,fontWeight:700,color:C.text}}>BuildFlow Pro</div>
      <div style={{fontSize:13,color:C.textSub}}>Loading your projects...</div>
      <div style={{width:200,height:3,background:C.border,borderRadius:3,overflow:"hidden",marginTop:4}}>
        <div style={{width:"40%",height:"100%",background:C.accent,borderRadius:3,animation:"load 1s ease-in-out infinite alternate"}}/>
      </div>
      <style>{`@keyframes load{from{transform:translateX(0)}to{transform:translateX(300%)}}`}</style>
    </div>
  );

  // Clean DB setters — update state immediately, write to DB in background
  const setProjectsDB = (updater) => {
    setProjects(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      const prevIds = new Set(prev.map(x=>x.id));
      const nextIds = new Set(next.map(x=>x.id));
      next.forEach(p => db.saveProject(p));
      prev.forEach(p => { if(!nextIds.has(p.id)) db.deleteProject(p.id); });
      return next;
    });
  };
  const setContactsDB = (updater) => {
    setContacts(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(c => db.saveContact(c));
      prev.forEach(c => { if(!next.find(x=>x.id===c.id)) db.deleteContact(c.id); });
      return next;
    });
  };
  const setBudgetDB = (updater) => {
    setBudgetItems(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(b => db.saveBudget(b));
      prev.forEach(b => { if(!next.find(x=>x.id===b.id)) db.deleteBudget(b.id); });
      return next;
    });
  };
  const setEstimatesDB = (updater) => {
    setEstimates(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(e => {
        db.saveEstimate(e);
        e.lineItems.forEach(l => db.saveLineItem(l, e.id));
        const old = prev.find(x=>x.id===e.id);
        if(old) old.lineItems.forEach(l => { if(!e.lineItems.find(x=>x.id===l.id)) db.deleteLineItem(l.id); });
      });
      prev.forEach(e => { if(!next.find(x=>x.id===e.id)) db.deleteEstimate(e.id); });
      return next;
    });
  };
  const setInvoicesDB = (updater) => {
    setInvoices(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(i => db.saveInvoice(i));
      prev.forEach(i => { if(!next.find(x=>x.id===i.id)) db.deleteInvoice(i.id); });
      return next;
    });
  };
  const setCosDB = (updater) => {
    setCos(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(c => db.saveCO(c));
      prev.forEach(c => { if(!next.find(x=>x.id===c.id)) db.deleteCO(c.id); });
      return next;
    });
  };
  const setLogsDB = (updater) => {
    setLogs(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(l => db.saveLog(l));
      prev.forEach(l => { if(!next.find(x=>x.id===l.id)) db.deleteLog(l.id); });
      return next;
    });
  };
  const setBidsDB = (updater) => {
    setBids(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(pkg => {
        db.saveBidPkg(pkg);
        pkg.bids.forEach(b => db.saveBid(b, pkg.id));
        const old = prev.find(x=>x.id===pkg.id);
        if(old) old.bids.forEach(b => { if(!pkg.bids.find(x=>x.subId===b.subId)) db.deleteBid(b.subId); });
      });
      prev.forEach(p => { if(!next.find(x=>x.id===p.id)) db.deleteBidPkg(p.id); });
      return next;
    });
  };
  const setDocsDB = (updater) => {
    setDocs(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(d => db.saveDoc(d));
      prev.forEach(d => { if(!next.find(x=>x.id===d.id)) db.deleteDoc(d.id); });
      return next;
    });
  };
  const setPhotosDB = (updater) => {
    setPhotos(prev => {
      const next = typeof updater==="function" ? updater(prev) : updater;
      next.forEach(p => db.savePhoto(p));
      prev.forEach(p => { if(!next.find(x=>x.id===p.id)) db.deletePhoto(p.id); });
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
  };

  const Sidebar = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"18px 14px 14px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:C.accent,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={I.hard} s={15} stroke="#fff"/></div>
          <div><div style={{fontSize:13,fontWeight:800,color:C.text,letterSpacing:"0.04em"}}>BUILDFLOW</div><div style={{fontSize:9,color:C.textMuted,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Pro · Dallas TX</div></div>
        </div>
      </div>
      <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
        {NAV.map(item=>{
          const active=tab===item.id;
          return <button key={item.id} onClick={()=>navigate(item.id)}
            style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:7,border:"none",background:active?"#FEF3EC":"transparent",color:active?"#C85A1E":C.textSub,cursor:"pointer",fontSize:13,fontWeight:active?600:400,textAlign:"left",width:"100%",fontFamily:"inherit",transition:"all 0.1s"}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.textMid;}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSub;}}}>
            <Ic d={I[item.icon]||I.home} s={14}/>{item.label}
          </button>;
        })}
      </nav>
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>GC</div>
          <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>My Company</div><div style={{fontSize:11,color:C.textMuted}}>Project Manager</div></div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Inter','DM Sans',system-ui,sans-serif",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#D0D4DA;border-radius:10px;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.4;}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:0.4;cursor:pointer;}
        input::placeholder,textarea::placeholder{color:#B0B6BF;}
        textarea,button,select{font-family:inherit;}

        @media(min-width:769px){
          .mobileHeader{display:none!important;}
          .mobileMenu{display:none!important;}
          .bottomNav{display:none!important;}
        }

        @media(max-width:768px){
          .sidebar{display:none!important;}
          .mobileHeader{display:flex!important;}
          .mainPad{padding:12px!important;padding-top:62px!important;padding-bottom:76px!important;}
          .bottomNav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E8EAED;z-index:200;padding:4px 0 env(safe-area-inset-bottom,8px);}

          /* Make ALL multi-column grids stack on mobile */
          div[style*="repeat(4,1fr)"],
          div[style*="repeat(3,1fr)"],
          div[style*="repeat(2,1fr)"]{
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
        }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="sidebar" style={{width:205,background:"#fff",borderRight:`1px solid ${C.border}`,flexShrink:0}}>
        <Sidebar/>
      </div>

      {/* Mobile Top Header */}
      <div className="mobileHeader" style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"none",alignItems:"center",justifyContent:"space-between",height:54}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,background:C.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.hard} s={12} stroke="#fff"/></div>
          <div style={{fontSize:13,fontWeight:800,color:C.text,letterSpacing:"0.02em"}}>BUILDFLOW PRO</div>
        </div>
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",color:C.textMid,display:"flex",padding:4}}>
          <Ic d={menuOpen?I.x:I.menu} s={22}/>
        </button>
      </div>

      {/* Mobile Slide-out Menu */}
      {menuOpen&&<div className="mobileMenu" onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(15,17,23,0.4)",zIndex:300}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"75%",maxWidth:280,height:"100%",background:"#fff",borderRight:`1px solid ${C.border}`,overflowY:"auto"}}>
          <Sidebar/>
        </div>
      </div>}

      {/* Mobile Bottom Nav - quick access to key tabs */}
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
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 0",color:active?C.accent:C.textMuted}}>
            <Ic d={I[item.icon]||I.home} s={active?20:18} stroke={active?C.accent:C.textMuted}/>
            <span style={{fontSize:9,fontWeight:active?700:500,letterSpacing:"0.02em"}}>{item.label}</span>
          </button>;
        })}
      </div>

      <div className="mainPad" style={{flex:1,overflow:"auto",padding:"32px 36px"}}>
        <div style={{maxWidth:1100}}>
          {/* Always mount Projects so its state (selectedId, activeTab) survives tab switches */}
          <div style={{display:tab==="projects"?"block":"none"}}>
            <Projects {...sharedProps} contacts={contacts} initialId={navPayload}/>
          </div>
          {tab==="dashboard"&&<Dashboard projects={projects} invoices={invoices} cos={cos} onNav={navigate}/>}
          {tab==="estimates"&&<GlobalEstimates estimates={estimates} setEstimates={setEstimatesDB} projects={projects}/>}
          {tab==="invoices"&&<GlobalInvoices invoices={invoices} setInvoices={setInvoicesDB} projects={projects}/>}
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
          {tab==="schedule"&&<Schedule projects={projects} setProjects={setProjectsDB}/>}
          {tab==="logs"&&<DailyLogs logs={logs} setLogs={setLogsDB} projects={projects}/>}
          {tab==="docs"&&<Documents docs={docs} setDocs={setDocsDB} projects={projects}/>}
          {tab==="photos"&&<Photos photos={photos} setPhotos={setPhotosDB} projects={projects}/>}
          {tab==="contacts"&&<Contacts contacts={contacts} setContacts={setContactsDB}/>}
        </div>
      </div>
    </div>
  );
}
