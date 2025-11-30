import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTrackingRequestDetails, getTrackingLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Clock, User, Building2, Radio } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const RequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ["tracking-request", id],
    queryFn: () => getTrackingRequestDetails(Number(id)),
    enabled: !!id,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["tracking-logs", id],
    queryFn: () => getTrackingLogs(Number(id)),
    enabled: !!id,
  });

  if (requestLoading) {
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

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { variant: "secondary" as const, label: "جديد", className: "" },
      in_progress: { variant: "default" as const, label: "قيد المعالجة", className: "" },
      done: { variant: "outline" as const, label: "مكتمل", className: "border-green-500 text-green-700 bg-green-50" },
      rejected: { variant: "destructive" as const, label: "مرفوض", className: "" },
    };

    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

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
                <p className="text-sm text-muted-foreground">رقم المستفيد</p>
                <p className="font-medium">{request.beneficiary_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">رقم الجهة</p>
                <p className="font-medium">{request.authority_id}</p>
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
            {logsLoading ? (
              <Skeleton className="h-64" />
            ) : logs && logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">موقع #{log.id}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {format(new Date(log.captured_at), "dd MMM HH:mm", { locale: ar })}
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
              <p className="text-center text-muted-foreground py-8">
                لا توجد سجلات تتبع لهذا الطلب
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestDetails;
