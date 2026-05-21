import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuditLogsThunk } from "@/thunks/adminThunks";
import { 
  selectAuditLogs, 
  selectAdminStatus, 
  selectAdminError 
} from "@/store/slices/adminSlice";
import { AppDispatch } from "@/store/store";
import { 
  FileText, 
  Activity, 
  User as UserIcon, 
  Clock, 
  Search,
  AlertCircle,
  Database,
  ArrowRight,
  Calendar,
  UserPlus,
  LogIn,
  LogOut,
  Trash2,
  Settings,
  ShieldCheck,
  ChevronDown,
  Info
} from "lucide-react"; 

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Activity Timeline — MediQueue" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const logs = useSelector(selectAuditLogs);
  const status = useSelector(selectAdminStatus);
  const error = useSelector(selectAdminError);
  const [showTechnical, setShowTechnical] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchAuditLogsThunk());
  }, [dispatch]);

  const getEventIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("booked") || act.includes("appointment")) return <Calendar className="w-5 h-5" />;
    if (act.includes("status")) return <Activity className="w-5 h-5" />;
    if (act.includes("notes")) return <FileText className="w-5 h-5" />;
    if (act.includes("registered") || act.includes("created")) return <UserPlus className="w-5 h-5" />;
    if (act.includes("logged in")) return <LogIn className="w-5 h-5" />;
    if (act.includes("logged out")) return <LogOut className="w-5 h-5" />;
    if (act.includes("cancelled") || act.includes("deleted") || act.includes("removed")) return <Trash2 className="w-5 h-5" />;
    if (act.includes("updated") || act.includes("profile")) return <Settings className="w-5 h-5" />;
    return <ShieldCheck className="w-5 h-5" />;
  };

  const getEventColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("booked") || act.includes("notes") || act.includes("registered")) return "text-clinical bg-clinical-soft border-clinical/20";
    if (act.includes("status") || act.includes("updated")) return "text-warn bg-warn-soft border-warn/20";
    if (act.includes("cancelled") || act.includes("deleted")) return "text-danger bg-danger-soft border-danger/20";
    return "text-brand bg-brand-soft border-brand/20";
  };

  const cleanAction = (action: string) => {
    if (!action) return "System Activity";
    // If it's a technical string from old logs, make it slightly better but don't use "New Record"
    if (action.includes(".post")) return "Legacy: Database Creation";
    if (action.includes(".patch")) return "Legacy: Database Update";
    if (action.includes(".delete")) return "Legacy: Database Removal";
    return action;
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
              <Activity className="size-6" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">System Activity</h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            A real-time, human-readable timeline of everything happening in the clinic.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-brand transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="bg-transparent border-none text-foreground pl-10 pr-4 py-2 rounded-xl outline-none w-full md:w-48 text-sm font-medium"
            />
          </div>
          <div className="w-px h-8 bg-border" />
          <button 
            onClick={() => dispatch(fetchAuditLogsThunk())}
            disabled={status === "loading"}
            className="p-2 text-muted-foreground hover:text-brand rounded-xl hover:bg-muted transition-all disabled:opacity-50"
          >
            <Clock className={`size-5 ${status === "loading" ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Info className="size-3.5" />
          {filteredLogs.length} Events Logged
        </div>
        <button 
          onClick={() => setShowTechnical(!showTechnical)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
            showTechnical 
            ? "bg-brand text-white border-brand shadow-lg shadow-brand/20" 
            : "bg-card text-muted-foreground border-border hover:border-brand/30"
          }`}
        >
          {showTechnical ? "Hide Tech Details" : "Show Tech Details"}
          <ChevronDown className={`size-3.5 transition-transform ${showTechnical ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Timeline Section */}
      <div className="relative space-y-4">
        {/* The vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border/60 ml-[2px]" />

        {status === "loading" && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="size-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Retrieving Timeline...</p>
          </div>
        ) : error ? (
          <div className="bg-danger-soft/30 border border-danger/10 p-12 rounded-[2rem] text-center">
            <AlertCircle className="size-12 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-bold">Failed to load activity</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-muted/10 border border-border border-dashed p-20 rounded-[2rem] text-center">
            <Database className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">No events found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or refreshing the page.</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={log.id} className="relative pl-16 group">
              {/* Timeline Dot/Icon */}
              <div className={`absolute left-0 top-0 size-12 rounded-2xl border flex items-center justify-center z-10 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md ${getEventColor(log.action)}`}>
                {getEventIcon(log.action)}
              </div>

              {/* Event Card */}
              <div className="bg-card border border-border/60 hover:border-brand/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand/[0.03]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-secondary text-[10px] font-black uppercase tracking-wider rounded-md text-muted-foreground border border-border">
                        {log.entity}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60">
                        {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: cleanAction(log.action).replace(/\*\*(.*?)\*\*/g, '<span class="text-brand">$1</span>') }} />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="size-5 rounded-full bg-secondary flex items-center justify-center">
                        <UserIcon className="size-2.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {log.user_id ? "Clinic Administrator" : "System Process"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-xs font-bold text-muted-foreground/40 font-mono tracking-tighter">
                      REF: {log.id.split('-')[0].toUpperCase()}
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Technical Overlay */}
                {showTechnical && (
                  <div className="mt-6 pt-6 border-t border-border/60 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Database className="size-3" />
                          Contextual Metadata
                        </h4>
                        <div className="bg-secondary/50 rounded-2xl p-4 border border-border/40 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Info className="size-3" />
                          Security Trace
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-secondary/50 p-3 rounded-xl border border-border/40 text-[10px]">
                            <div className="font-bold opacity-50 mb-1">IP Address</div>
                            <div className="font-mono">{log.ip_address || "Internal"}</div>
                          </div>
                          <div className="bg-secondary/50 p-3 rounded-xl border border-border/40 text-[10px]">
                            <div className="font-bold opacity-50 mb-1">Entity ID</div>
                            <div className="font-mono truncate">{log.entity_id || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">
          End of recorded clinical history
        </p>
      </div>
    </div>
  );
}
