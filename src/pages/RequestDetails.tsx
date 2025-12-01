import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrackingRequestFull, updateTrackingStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Clock, User, Building2, Radio, Wifi, PlugZap } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import L from "leaflet";
import { TrackingLog, TrackingRequest, TrackingStatus } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const request = data?.request;
  const beneficiaryName = data?.beneficiary_name;
  const beneficiaryNationalId = data?.beneficiary_national_id;
  const authorityName = data?.authority_name;
  const authorityLogo = data?.authority_logo;
  const logs = useMemo(() => {
    const baseLogs = data?.logs || [];
    return [...baseLogs, ...liveLogs].sort(
      (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
    );
  }, [data?.logs, liveLogs]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const protocolSafe = (url: string) => {
      if (url.startsWith("https://")) return url.replace("https://", "wss://");
      if (url.startsWith("http://")) return url.replace("http://", "ws://");
      return url;
    };
    const base = "https://slid.ethra2.com";
    const wsUrl = protocolSafe(`${base}/ws/tracking-requests/${id}`);

    setSocketStatus("connecting");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setSocketStatus("connected");
    ws.onerror = () => setSocketStatus("disconnected");
    ws.onclose = () => setSocketStatus("disconnected");

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
      controller.abort();
      ws.close();
    };
  }, [id, queryClient]);

  const center = useMemo(() => {
    if (logs && logs.length > 0) {
      const last = logs[logs.length - 1];
      return [last.latitude, last.longitude] as [number, number];
    }
    return [24.7136, 46.6753] as [number, number];
  }, [logs]);

  const leafletIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    [],
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { variant: "secondary" as const, label: "جديد", className: "" },
      in_progress: {
        variant: "outline" as const,
        label: "قيد المعالجة",
        className: "border-blue-500 text-blue-700 bg-blue-50",
      },
      done: { variant: "outline" as const, label: "مكتمل", className: "border-green-500 text-green-700 bg-green-50" },
      rejected: { variant: "destructive" as const, label: "مرفوض", className: "" },
    };

    const config = variants[status as keyof typeof variants] || { variant: "secondary" as const, label: status, className: "" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">الطلب غير موجود</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">تفاصيل الطلب #{request.id}</h2>
          <p className="text-muted-foreground">معلومات مفصلة عن طلب التتبع</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">المستفيد</p>
                <p className="font-medium">
                  {beneficiaryName ? beneficiaryName : `مستفيد #${request.beneficiary_id}`}
                </p>
                {beneficiaryNationalId && (
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    الهوية: {beneficiaryNationalId}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {authorityLogo ? (
                  <img src={authorityLogo} alt="شعار الجهة" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الجهة</p>
                <p className="font-medium">
                  {authorityName ? authorityName : `جهة #${request.authority_id}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">القناة</p>
                <Badge variant="outline" className="font-mono">{request.channel}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                <p className="font-medium" dir="ltr">
                  {format(new Date(request.created_at), "dd MMM yyyy HH:mm", { locale: ar })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5" />
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                {getStatusBadge(request.status)}
                <div className="mt-2">
                  <Select
                    value={(requestStatus || request.status) as TrackingStatus}
                    onValueChange={(val) => statusMutation.mutate({ status: val as TrackingStatus })}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="تغيير الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="done">مكتمل</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              سجلات التتبع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Wifi className={cn("h-4 w-4", socketStatus === "connected" ? "text-green-500" : "text-muted-foreground")} />
              <span>{socketStatus === "connected" ? "متصل بالبث الحي" : socketStatus === "connecting" ? "جاري الاتصال..." : "غير متصل"}</span>
              {requestStatus && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <PlugZap className="h-3 w-3" />
                  <span>حالة الطلب: </span>
                  {getStatusBadge(requestStatus)}
                </div>
              )}
            </div>
            {logs && logs.length > 0 ? (
              <div className="space-y-4 max-h-[420px] overflow-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg space-y-2 bg-white/70 backdrop-blur">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">موقع #{log.id}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {format(new Date(log.captured_at), "dd MMM yyyy HH:mm", { locale: ar })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        دقة: {log.accuracy_m}م
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">خط العرض:</span>
                        <span className="font-mono mr-2">{log.latitude}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">خط الطول:</span>
                        <span className="font-mono mr-2">{log.longitude}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">الارتفاع:</span>
                        <span className="font-mono mr-2">{log.altitude_m}م</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Skeleton className="h-64" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            الخريطة الحية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] rounded-lg overflow-hidden border">
            <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {logs.map((log) => (
                <Marker
                  key={log.id}
                  position={[log.latitude, log.longitude]}
                  icon={leafletIcon}
                />
              ))}
              {logs.length > 1 && (
                <Polyline
                  positions={logs.map((l) => [l.latitude, l.longitude]) as [number, number][]}
                  color="#0f6a4f"
                  weight={3}
                />
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestDetails;
