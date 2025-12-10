import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrackingRequestFull, updateTrackingStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Navigation,
  AlertTriangle,
  Activity,
  Target,
  Compass
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

// Cast components to bypass type issues with react-leaflet
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
          <div class="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
          <div class="absolute -top-1 -left-1 w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
        </div>`,
        className: "custom-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { 
        label: "جديد", 
        className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        icon: AlertTriangle,
        color: "text-amber-500"
      },
      in_progress: {
        label: "قيد التتبع",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/30 animate-pulse",
        icon: Activity,
        color: "text-blue-500"
      },
      done: { 
        label: "مكتمل", 
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        icon: Target,
        color: "text-emerald-500"
      },
      rejected: { 
        label: "مرفوض", 
        className: "bg-destructive/10 text-destructive border-destructive/30",
        icon: AlertTriangle,
        color: "text-destructive"
      },
    };
    return configs[status as keyof typeof configs] || { 
      label: status, 
      className: "bg-muted text-muted-foreground",
      icon: AlertTriangle,
      color: "text-muted-foreground"
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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">الطلب غير موجود</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للوحة التحكم
        </Button>
      </div>
    );
  }

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">بلاغ طوارئ #{request.id}</h1>
              <Badge variant="outline" className={cn("text-sm px-3 py-1", statusConfig.className)}>
                <StatusIcon className={cn("h-3.5 w-3.5 ml-1.5", statusConfig.color)} />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {format(new Date(request.created_at), "EEEE، dd MMMM yyyy - HH:mm", { locale: ar })}
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          socketStatus === "connected" 
            ? "bg-emerald-500/10 text-emerald-600" 
            : socketStatus === "connecting"
            ? "bg-amber-500/10 text-amber-600"
            : "bg-muted text-muted-foreground"
        )}>
          {socketStatus === "connected" ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>البث الحي متصل</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </>
          ) : socketStatus === "connecting" ? (
            <>
              <Wifi className="h-4 w-4 animate-pulse" />
              <span>جاري الاتصال...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>غير متصل</span>
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">المستفيد</p>
                <p className="font-semibold truncate">
                  {beneficiaryName || `مستفيد #${request.beneficiary_id}`}
                </p>
                {beneficiaryNationalId && (
                  <p className="text-xs text-muted-foreground font-mono">{beneficiaryNationalId}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {authorityLogo ? (
                  <img src={authorityLogo} alt="شعار الجهة" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">الجهة المختصة</p>
                <p className="font-semibold truncate">
                  {authorityName || `جهة #${request.authority_id}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">قناة الإرسال</p>
                <Badge variant="secondary" className="font-mono mt-1">{request.channel}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">عدد النقاط</p>
                <p className="font-semibold text-xl">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Full Width Map with Overlays */}
      <Card className="overflow-hidden">
        <div className="h-[600px] relative">
          {/* Map Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-background/90 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg px-3 py-2 shadow-sm border">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">خريطة التتبع الحية</span>
              </div>
              {lastLog && (
                <div className="flex items-center gap-2 text-xs bg-background/80 backdrop-blur rounded-lg px-3 py-2 shadow-sm border">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">آخر تحديث:</span>
                  <span className="font-mono">{format(new Date(lastLog.captured_at), "HH:mm:ss", { locale: ar })}</span>
                </div>
              )}
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
                  <div className="text-right font-sans" dir="rtl">
                    <p className="font-bold">نقطة #{index + 1}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(log.captured_at), "dd/MM/yyyy HH:mm:ss", { locale: ar })}
                    </p>
                    <p className="text-xs mt-1">دقة: {log.accuracy_m}م</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {logs.length > 1 && (
              <Polyline
                positions={logs.map((l) => [l.latitude, l.longitude] as L.LatLngTuple)}
                pathOptions={{ 
                  color: "hsl(var(--primary))", 
                  weight: 4,
                  opacity: 0.8,
                  dashArray: "10, 10"
                }}
              />
            )}
          </MapContainer>

          {/* Current Location Overlay - Bottom Left */}
          {lastLog && (
            <div className="absolute bottom-4 left-4 z-[1000] max-w-sm">
              <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">الموقع الحالي</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Compass className="h-3 w-3" />
                        {lastLog.latitude.toFixed(6)}, {lastLog.longitude.toFixed(6)}
                      </span>
                      <span>دقة: {lastLog.accuracy_m}م</span>
                      <span>ارتفاع: {lastLog.altitude_m}م</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Timeline Overlay - Right Side */}
          <div className="absolute top-16 bottom-4 right-4 z-[1000] w-72">
            <div className="h-full bg-background/95 backdrop-blur rounded-lg border shadow-lg flex flex-col overflow-hidden">
              <div className="p-3 border-b bg-background/50 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">سجل التتبع</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{logs.length} نقطة</Badge>
                </div>
              </div>
              <ScrollArea className="flex-1">
                {logs.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {[...logs].reverse().map((log, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div 
                          key={log.id} 
                          className={cn(
                            "relative p-2.5 rounded-lg border transition-colors",
                            isLatest 
                              ? "bg-primary/5 border-primary/30" 
                              : "bg-card/50 hover:bg-muted/50"
                          )}
                        >
                          {isLatest && (
                            <div className="absolute -top-1.5 -right-1.5">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                              </span>
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                isLatest ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}>
                                {logs.length - idx}
                              </div>
                              <div>
                                <p className="text-xs font-medium">
                                  {format(new Date(log.captured_at), "HH:mm:ss", { locale: ar })}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(new Date(log.captured_at), "dd/MM/yyyy", { locale: ar })}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] shrink-0 px-1.5">
                              دقة {log.accuracy_m}م
                            </Badge>
                          </div>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">العرض:</span>
                              <span className="font-mono">{log.latitude.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">الطول:</span>
                              <span className="font-mono">{log.longitude.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-muted-foreground">الارتفاع:</span>
                              <span className="font-mono">{log.altitude_m}م</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <MapPin className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">لا توجد نقاط تتبع بعد</p>
                    <p className="text-xs text-muted-foreground mt-1">ستظهر النقاط هنا عند بدء التتبع</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium">تغيير حالة البلاغ</p>
              <p className="text-sm text-muted-foreground">قم بتحديث حالة البلاغ حسب الإجراء المتخذ</p>
            </div>
            <Select
              value={currentStatus as TrackingStatus}
              onValueChange={(val) => statusMutation.mutate({ status: val as TrackingStatus })}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    جديد
                  </span>
                </SelectItem>
                <SelectItem value="in_progress">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    قيد التتبع
                  </span>
                </SelectItem>
                <SelectItem value="done">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    مكتمل
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    مرفوض
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestDetails;
