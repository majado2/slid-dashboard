import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { submitLocationConsent } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MapPin, Shield, WifiOff, Check, XCircle } from "lucide-react";

type LocationStatus = "idle" | "requesting" | "sending" | "success" | "error";

const Consent = () => {
  const [params] = useSearchParams();
  const requestId = params.get("request_id");
  const nationalId = params.get("national_id");

  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);

  const isValid = useMemo(() => Boolean(requestId && nationalId), [requestId, nationalId]);

  const handleSend = async () => {
    if (!nationalId) return;
    setError(null);
    setStatus("requesting");

    const geo = navigator.geolocation;
    if (!geo) {
      setStatus("error");
      setError("متصفحك لا يدعم تحديد الموقع");
      return;
    }

    geo.getCurrentPosition(
      async (pos) => {
        setCoords(pos.coords);
        setStatus("sending");
        try {
          await submitLocationConsent(nationalId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
            altitude_m: pos.coords.altitude ?? 0,
            captured_at: new Date().toISOString(),
          });
          setStatus("success");
        } catch (e: any) {
          setStatus("error");
          setError(e?.message || "تعذر إرسال الإحداثيات");
        }
      },
      (err) => {
        setStatus("error");
        setError(err.message || "تعذر الحصول على الإحداثيات");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  useEffect(() => {
    setError(null);
    setStatus("idle");
  }, [requestId, nationalId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f7f1] to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">موافقة مشاركة الموقع</CardTitle>
              <p className="text-sm text-muted-foreground">لتسريع وصول فرق الطوارئ، نحتاج إذن تحديد موقعك.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">رقم الطلب: {requestId || "غير متوفر"}</Badge>
            <Badge variant="outline">الهوية الوطنية: {nationalId || "غير متوفر"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isValid && (
            <Alert variant="destructive">
              <AlertTitle>روابط غير مكتملة</AlertTitle>
              <AlertDescription>يجب أن يتضمن الرابط request_id و national_id بشكل صحيح.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-700 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>يتم استخدام موقعك فقط لغرض الاستجابة للبلاغ ولن يُحفظ لأغراض أخرى.</p>
                <p>سيتطلب المتصفح إذنك لتحديد الموقع. اضغط السماح عند ظهور الطلب.</p>
              </div>
            </div>
            {coords && (
              <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground" dir="ltr">
                <div>lat: {coords.latitude}</div>
                <div>lng: {coords.longitude}</div>
                <div>accuracy: {coords.accuracy} m</div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>تعذر الإرسال</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              disabled={!isValid || status === "requesting" || status === "sending"}
              onClick={handleSend}
            >
              {status === "requesting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === "success" && <Check className="mr-2 h-4 w-4" />}
              {status === "error" && <XCircle className="mr-2 h-4 w-4" />}
              {status === "success"
                ? "تم الإرسال"
                : status === "requesting" || status === "sending"
                ? "جاري الإرسال..."
                : "إرسال موقعي الآن"}
            </Button>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <WifiOff className="h-4 w-4" />
              <span>تأكد من اتصال الإنترنت قبل الإرسال</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Consent;
