import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { login as apiLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Phone, EyeOff } from "lucide-react";

const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const heroBackgroundImage = useMemo(() => {
    const videoPath = "/bg.mp4"; // موجود الآن في مجلد public
    return videoPath;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiLogin({ mobile, password });
      login(response.token, response.user);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e9f5ef]" dir="rtl">
      <header className="h-[110px] bg-white shadow-sm">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6 sm:px-10">
          <img
            src="/absher_government_logo.svg"
            alt="شعار أبشر"
            className="h-12 w-auto object-contain"
          />
          <div className="flex items-center gap-4">
            <img
              src="/moi-2030-logos.png"
              alt="شعار وزارة الداخلية ورؤية 2030"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 relative min-h-[640px] flex items-center justify-center px-4 sm:px-10 py-10 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={heroBackgroundImage}
          autoPlay
          muted
          loop
          playsInline
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(#0f6a4fc9 0%, rgba(5, 45, 34, 0.82) 50%, rgba(15, 106, 79, 0.45) 100%)",
          }}
        />
        <div className="relative w-full max-w-6xl flex flex-col xl:flex-row items-start xl:items-center gap-10">
          <Card className="w-full max-w-lg h-[480px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold text-[#0f6a4f]">تسجيل الدخول</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="flex items-center gap-2 text-sm font-semibold text-[#0f6a4f]">
                    اسم المستخدم أو رقم الهوية
                  </Label>
                  <div className="relative">
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="اسم المستخدم أو رقم الهوية"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      dir="ltr"
                      className="text-right pr-10 h-12 bg-white/90 border-[#b4e2d3] focus-visible:ring-[#0f6a4f]"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0f6a4f]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-[#0f6a4f]">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 h-12 bg-white/90 border-[#b4e2d3] focus-visible:ring-[#0f6a4f]"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0f6a4f]" />
                  </div>
                </div>

                <div className="flex items-center justify-end text-sm">
                  <button type="button" className="text-[#0f6a4f] hover:underline">
                    نسيت كلمة المرور؟
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-[#0f6a4f] hover:bg-[#0c5a43] text-white"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>

              <div className="flex items-center justify-center text-sm font-semibold text-[#0f6a4f]">
                <EyeOff className="h-4 w-4 ml-2 text-[#0f6a4f]" />
                مستخدم جديد؟
              </div>

              <div className="p-4 bg-[#e4f3ec] rounded-lg text-sm text-[#0f6a4f] border border-[#b4e2d3]">
                <p className="text-center mb-2">بيانات تجريبية</p>
                <div className="flex justify-center gap-6 text-xs">
                  <span>
                    الجوال: <span className="font-mono">0588888888</span>
                  </span>
                  <span>
                    كلمة المرور: <span className="font-mono">password</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="w-full xl:w-auto flex-1 flex flex-col items-start xl:items-center gap-6 text-white drop-shadow-md">
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 rounded-2xl border-2 border-[#b4e2d3] bg-white/85 text-[#0f6a4f] flex items-center justify-center font-semibold text-lg">
                شعار SLID
              </div>
              <div className="space-y-3">
                <p className="text-3xl font-bold text-[#c6f6e6] tracking-tight">SLID</p>
                <p className="text-xl font-semibold text-[#c6f6e6]">الهوية المكانية الذكية</p>
                <p className="text-base text-white/95 max-w-md">حلول تتبع دقيقة لتمكين الجهات الحكومية والمستفيدين.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
