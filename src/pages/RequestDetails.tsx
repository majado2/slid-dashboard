import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrackingRequestFull, updateTrackingStatus } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  User, 
  Building2, 
  Radio, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  Activity,
  Target,
  Compass,
  Signal,
  Zap,
  Navigation2,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapContainer as LeafletMapContainer, 
  Marker as LeafletMarker, 
  Polyline as LeafletPolyline, 
  TileLayer as LeafletTileLayer, 
  Popup 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TrackingLog, TrackingStatus } from "@/types/api";

const MapContainer = LeafletMapContainer as any;
const Marker = LeafletMarker as any;
const Polyline = LeafletPolyline as any;
const TileLayer = LeafletTileLayer as any;
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const RequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["tracking-request-full", id],
    queryFn: () => getTrackingRequestFull(Number(id)),
    enabled: !!id,
  });

  const [liveLogs, setLiveLogs] = useState<TrackingLog[]>([]);
  const [socketStatus, setSocketStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const socketForIdRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [socketNonce, setSocketNonce] = useState(0);

  const request = data?.request;
  const beneficiaryName = data?.beneficiary_name;
  const beneficiaryNationalId = data?.beneficiary_national_id;
  const authorityName = data?.authority_name;
  const authorityLogo = data?.authority_logo;
  const logs = useMemo(() => {
    const baseLogs = data?.logs || [];
    return [...baseLogs, ...liveLogs].sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
  }, [data?.logs, liveLogs]);

  useEffect(() => {
    if (!id) return;

    const status = requestStatus || request?.status;
    const shouldStream = status === "in_progress";

    if (!shouldStream) {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        socketForIdRef.current = null;
      }
      setSocketStatus("disconnected");
      return;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current && socketForIdRef.current === id && wsRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    const protocolSafe = (url: string) => {
      if (url.startsWith("https://")) return url.replace("https://", "wss://");
      if (url.startsWith("http://")) return url.replace("http://", "ws://");
      return url;
    };
    const base = "https://slid.ethra2.com";
    const wsUrl = protocolSafe(`${base}/ws/tracking-requests/${id}`);

    setSocketStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    socketForIdRef.current = id;

    ws.onopen = () => setSocketStatus("connected");
    const scheduleReconnect = () => {
      const latestStatus = requestStatus || request?.status;
      if (latestStatus !== "in_progress") return;
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        wsRef.current = null;
        socketForIdRef.current = null;
        setSocketStatus("connecting");
        setSocketNonce((n) => n + 1);
      }, 1500);
    };

    ws.onerror = () => {
      setSocketStatus("disconnected");
      wsRef.current = null;
      scheduleReconnect();
    };
    ws.onclose = () => {
      setSocketStatus("disconnected");
      wsRef.current = null;
      scheduleReconnect();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "init") {
          if (msg.data?.logs) {
            setLiveLogs(msg.data.logs);
            queryClient.setQueryData(["tracking-request-full", id], (prev: any) => ({
              ...(prev || {}),
              request: msg.data.request || prev?.request,
              logs: msg.data.logs || prev?.logs,
            }));
          }
          if (msg.data?.request?.status) {
            setRequestStatus(msg.data.request.status);
          }
        } else if (msg.event === "log_added" && msg.data) {
          setLiveLogs((prev) => {
            const exists = prev.find((l) => l.id === msg.data.id);
            if (exists) return prev;
            return [...prev, msg.data];
          });
        } else if (msg.event === "request_updated") {
          if (msg.status) {
            setRequestStatus(msg.status);
            toast.info(`تم تحديث حالة الطلب إلى: ${msg.status}`);
          }
        } else if (msg.event === "error") {
          toast.error(msg.message || "خطأ في البث الحي");
        }
      } catch (error) {
        console.error("WS parse error", error);
      }
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      socketForIdRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [id, queryClient, socketNonce, request?.status, requestStatus]);

  const center = useMemo((): L.LatLngExpression => {
    if (logs && logs.length > 0) {
      const last = logs[logs.length - 1];
      return [last.latitude, last.longitude];
    }
    return [24.7136, 46.6753];
  }, [logs]);

  const leafletIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      }),
    [],
  );

  const currentLocationIcon = useMemo(
    () =>
      new L.DivIcon({
        html: `<div class="relative">
          <div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div class="absolute -top-2 -left-2 w-12 h-12 bg-red-500/20 rounded-full animate-ping"></div>
          <div class="absolute -top-1 -left-1 w-10 h-10 bg-red-500/30 rounded-full animate-pulse"></div>
        </div>`,
        className: "custom-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { 
        label: "جديد", 
        className: "bg-amber-500/20 text-amber-400 border-amber-500/50",
        icon: AlertTriangle,
        color: "text-amber-400",
        glow: "shadow-amber-500/25"
      },
      in_progress: {
        label: "قيد التتبع",
        className: "bg-blue-500/20 text-blue-400 border-blue-500/50",
        icon: Activity,
        color: "text-blue-400",
        glow: "shadow-blue-500/25"
      },
      done: { 
        label: "مكتمل", 
        className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
        icon: Target,
        color: "text-emerald-400",
        glow: "shadow-emerald-500/25"
      },
      rejected: { 
        label: "مرفوض", 
        className: "bg-red-500/20 text-red-400 border-red-500/50",
        icon: AlertTriangle,
        color: "text-red-400",
        glow: "shadow-red-500/25"
      },
    };
    return configs[status as keyof typeof configs] || { 
      label: status, 
      className: "bg-muted text-muted-foreground",
      icon: AlertTriangle,
      color: "text-muted-foreground",
      glow: ""
    };
  };

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: TrackingStatus }) => updateTrackingStatus(Number(id), status),
    onSuccess: (updated) => {
      setRequestStatus(updated.status);
      toast.success("تم تحديث حالة الطلب");
      queryClient.invalidateQueries({ queryKey: ["tracking-request-full", id] });
    },
    onError: () => toast.error("فشل تحديث الحالة"),
  });

  const currentStatus = requestStatus || request?.status;
  const statusConfig = getStatusConfig(currentStatus || "new");
  const StatusIcon = statusConfig.icon;
  const isLive = currentStatus === "in_progress";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl animate-pulse" />
          <AlertTriangle className="relative h-20 w-20 text-destructive" />
        </div>
        <p className="text-2xl font-bold text-foreground">البلاغ غير موجود</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة للوحة التحكم
        </Button>
      </div>
    );
  }

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="space-y-5 p-4 lg:p-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")} 
              className="shrink-0 h-12 w-12 rounded-xl border border-border/50 bg-card/50 backdrop-blur hover:bg-card transition-all duration-300 hover:scale-105"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  بلاغ طوارئ #{request.id}
                </h1>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-sm px-4 py-1.5 font-semibold transition-all duration-300 shadow-lg",
                    statusConfig.className,
                    statusConfig.glow,
                    isLive && "animate-pulse"
                  )}
                >
                  <StatusIcon className={cn("h-4 w-4 ml-2", statusConfig.color, isLive && "animate-spin")} />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(request.created_at), "EEEE، dd MMMM yyyy - HH:mm", { locale: ar })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Connection Status */}
            <div className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-500 border shadow-lg",
              socketStatus === "connected" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10" 
                : socketStatus === "connecting"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10"
                : "bg-card/50 text-muted-foreground border-border/50"
            )}>
              {socketStatus === "connected" ? (
                <>
                  <div className="relative">
                    <Wifi className="h-5 w-5" />
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
                  </div>
                  <span>البث الحي متصل</span>
                  <Signal className="h-4 w-4 animate-pulse" />
                </>
              ) : socketStatus === "connecting" ? (
                <>
                  <Wifi className="h-5 w-5 animate-pulse" />
                  <span>جاري الاتصال...</span>
                  <div className="h-2 w-2 bg-amber-400 rounded-full animate-bounce" />
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5" />
                  <span>غير متصل</span>
                </>
              )}
            </div>
            
            {/* Status Change */}
            <Select
              value={currentStatus as TrackingStatus}
              onValueChange={(val) => statusMutation.mutate({ status: val as TrackingStatus })}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger className="flex items-center gap-3 px-5 py-3 h-auto rounded-2xl text-sm font-semibold transition-all duration-500 border shadow-lg bg-card/50 border-border/50 hover:border-primary/30">
                <Activity className="h-5 w-5 text-primary" />
                <SelectValue placeholder="تغيير الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                    جديد
                  </span>
                </SelectItem>
                <SelectItem value="in_progress">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    قيد التتبع
                  </span>
                </SelectItem>
                <SelectItem value="done">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    مكتمل
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                    مرفوض
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Main Map Section */}
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur shadow-2xl">
          <div className="h-[650px] relative">
            {/* Map Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-background/95 via-background/70 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Live Map Label */}
                  <div className="flex items-center gap-3 bg-background/90 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-border/50">
                    <div className="relative">
                      <MapPin className="h-5 w-5 text-primary" />
                      {isLive && <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />}
                    </div>
                    <span className="font-bold text-sm">خريطة التتبع الحية</span>
                    {isLive && (
                      <Badge variant="destructive" className="text-[10px] px-2 py-0.5 animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  
                  
                  {/* Beneficiary */}
                  <div className="flex items-center gap-2.5 bg-background/90 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">المستفيد:</span>
                    <span className="text-sm font-bold truncate max-w-[140px]">{beneficiaryName || `#${request.beneficiary_id}`}</span>
                  </div>
                  
                  {/* Authority */}
                  <div className="flex items-center gap-2.5 bg-background/90 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                    {authorityLogo ? (
                      <img src={authorityLogo} alt="" className="h-5 w-5 object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">الجهة:</span>
                    <span className="text-sm font-bold truncate max-w-[140px]">{authorityName || `#${request.authority_id}`}</span>
                  </div>
                  
                  {/* Channel */}
                  <div className="flex items-center gap-2.5 bg-background/90 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                    <Radio className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">القناة:</span>
                    <Badge variant="secondary" className="font-mono text-xs px-2 py-0">{request.channel}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {logs.length > 0 && (
                    <div className="flex items-center gap-2 bg-background/90 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-border/50">
                      <Navigation2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{logs.length}</span>
                      <span className="text-xs text-muted-foreground">نقطة</span>
                    </div>
                  )}
                  {lastLog && (
                    <div className="flex items-center gap-2 bg-background/90 backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-border/50">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">آخر تحديث:</span>
                      <span className="font-mono text-sm font-bold">{format(new Date(lastLog.captured_at), "HH:mm:ss", { locale: ar })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map */}
            <MapContainer 
              center={center} 
              zoom={14} 
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {logs.map((log, index) => (
                <Marker
                  key={log.id}
                  position={[log.latitude, log.longitude]}
                  icon={index === logs.length - 1 ? currentLocationIcon : leafletIcon}
                >
                  <Popup>
                    <div className="text-right font-sans p-1" dir="rtl">
                      <p className="font-bold text-base mb-1">نقطة #{index + 1}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        {format(new Date(log.captured_at), "dd/MM/yyyy HH:mm:ss", { locale: ar })}
                      </p>
                      <div className="space-y-1 text-xs">
                        <p>دقة: <span className="font-mono">{log.accuracy_m}م</span></p>
                        <p>ارتفاع: <span className="font-mono">{log.altitude_m}م</span></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {logs.length > 1 && (
                <Polyline
                  positions={logs.map((l) => [l.latitude, l.longitude] as L.LatLngTuple)}
                  pathOptions={{ 
                    color: "#10b981", 
                    weight: 4,
                    opacity: 0.9,
                    dashArray: "8, 12"
                  }}
                />
              )}
            </MapContainer>

            {/* Current Location Overlay - Bottom Left */}
            {lastLog && (
              <div className="absolute bottom-4 left-4 z-[1000] animate-fade-in">
                <div className="bg-background/95 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/10 p-4 min-w-[280px]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                        <Target className="h-7 w-7 text-red-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-base mb-1">الموقع الحالي</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Compass className="h-3.5 w-3.5" />
                          <span className="font-mono">{lastLog.latitude.toFixed(6)}, {lastLog.longitude.toFixed(6)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">دقة: <span className="font-mono text-foreground">{lastLog.accuracy_m}م</span></span>
                          <span className="text-muted-foreground">ارتفاع: <span className="font-mono text-foreground">{lastLog.altitude_m}م</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Timeline Overlay - Right Side */}
            <div className="absolute top-20 bottom-4 right-4 z-[1000] w-80">
              <div className="h-full bg-background/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-bold">سجل التتبع</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">{logs.length}</Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {logs.length > 0 ? (
                    <div className="p-3 space-y-2">
                      {[...logs].reverse().map((log, idx) => {
                        const isLatest = idx === 0;
                        return (
                          <div 
                            key={log.id} 
                            className={cn(
                              "relative p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
                              isLatest 
                                ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/5" 
                                : "bg-card/50 border-border/50 hover:bg-card hover:border-border"
                            )}
                          >
                            {isLatest && (
                              <div className="absolute -top-1.5 -right-1.5">
                                <span className="relative flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary shadow-lg shadow-primary/50"></span>
                                </span>
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                                  isLatest 
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {logs.length - idx}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">
                                    {format(new Date(log.captured_at), "HH:mm:ss", { locale: ar })}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {format(new Date(log.captured_at), "dd/MM/yyyy", { locale: ar })}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant={isLatest ? "default" : "outline"} 
                                className={cn(
                                  "text-[10px] shrink-0 px-2",
                                  isLatest && "bg-primary/20 text-primary border-primary/30"
                                )}
                              >
                                {log.accuracy_m}م
                              </Badge>
                            </div>
                            <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">العرض:</span>
                                <span className="font-mono font-medium">{log.latitude.toFixed(5)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">الطول:</span>
                                <span className="font-mono font-medium">{log.longitude.toFixed(5)}</span>
                              </div>
                              <div className="flex justify-between col-span-2">
                                <span className="text-muted-foreground">الارتفاع:</span>
                                <span className="font-mono font-medium">{log.altitude_m}م</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-muted/50 rounded-full blur-xl" />
                        <MapPin className="relative h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <p className="font-semibold text-muted-foreground">لا توجد نقاط تتبع بعد</p>
                      <p className="text-xs text-muted-foreground mt-2">ستظهر النقاط هنا عند بدء التتبع</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RequestDetails;
