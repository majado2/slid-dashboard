import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { login as apiLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, User, Eye, EyeOff, Shield, AlertTriangle, Radio, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const heroBackgroundImage = useMemo(() => {
    const videoPath = "/bg.mp4";
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
    <div className="min-h-screen flex flex-col bg-slate-950" dir="rtl">
      {/* Header */}
      <header className="relative z-50 h-[80px] bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6 sm:px-10">
          <img
            src="/absher_government_logo.svg"
            alt="شعار أبشر"
            className="h-10 w-auto object-contain brightness-0 invert opacity-90"
          />
          <div className="flex items-center gap-6">
            {/* Live Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#9B773A]/10 border border-[#9B773A]/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9B773A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9B773A]"></span>
              </span>
              <span className="text-xs font-medium text-[#9B773A]">النظام متصل</span>
            </div>
            <img
              src="/moi-2030-logos.png"
              alt="شعار وزارة الداخلية ورؤية 2030"
              className="h-10 w-auto object-contain brightness-0 invert opacity-90"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative min-h-[640px] flex items-center justify-center px-4 sm:px-10 py-10 overflow-hidden">
        {/* Background Video */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={heroBackgroundImage}
          autoPlay
          muted
          loop
          playsInline
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95" />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(155, 119, 58, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(155, 119, 58, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
        </div>

        {/* Floating Indicators */}
        <div className="absolute top-20 left-10 animate-pulse">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-amber-400">تنبيه نشط</span>
          </div>
        </div>
        
        <div className="absolute top-32 right-20 animate-pulse" style={{ animationDelay: '1s' }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9B773A]/10 border border-[#9B773A]/30 backdrop-blur-sm">
            <Radio className="h-3 w-3 text-[#9B773A]" />
            <span className="text-xs text-[#9B773A]">بث مباشر</span>
          </div>
        </div>

        <div className="absolute bottom-32 left-20 animate-pulse" style={{ animationDelay: '2s' }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/30 backdrop-blur-sm">
            <Activity className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-400">مراقبة فعالة</span>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="relative w-full max-w-6xl flex flex-col xl:flex-row items-center gap-12 lg:gap-20">
          
          {/* Login Card */}
          <div className="w-full max-w-md">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#9B773A]/20 via-[#B8956C]/20 to-[#9B773A]/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                {/* Card Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9B773A]/20 to-[#B8956C]/20 border border-[#9B773A]/30 mb-4">
                    <Shield className="h-8 w-8 text-[#9B773A]" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h1>
                  <p className="text-sm text-slate-400">مركز عمليات الطوارئ</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium text-slate-300">
                      اسم المستخدم أو رقم الهوية
                    </Label>
                    <div className="relative group/input">
                      <div className={cn(
                        "absolute -inset-0.5 rounded-xl transition-all duration-300",
                        focusedField === 'mobile' 
                          ? "bg-gradient-to-r from-[#9B773A]/50 to-[#B8956C]/50 opacity-100 blur-sm" 
                          : "opacity-0"
                      )} />
                      <div className="relative">
                        <Input
                          id="mobile"
                          type="text"
                          placeholder="أدخل اسم المستخدم"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          onFocus={() => setFocusedField('mobile')}
                          onBlur={() => setFocusedField(null)}
                          required
                          dir="rtl"
                          className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 pr-12 rounded-xl focus:border-[#9B773A]/50 focus:ring-[#9B773A]/20 transition-all duration-300"
                        />
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                      كلمة المرور
                    </Label>
                    <div className="relative group/input">
                      <div className={cn(
                        "absolute -inset-0.5 rounded-xl transition-all duration-300",
                        focusedField === 'password' 
                          ? "bg-gradient-to-r from-[#9B773A]/50 to-[#B8956C]/50 opacity-100 blur-sm" 
                          : "opacity-0"
                      )} />
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="أدخل كلمة المرور"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          required
                          className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 pr-12 pl-12 rounded-xl focus:border-[#9B773A]/50 focus:ring-[#9B773A]/20 transition-all duration-300"
                        />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="flex items-center justify-end">
                    <button type="button" className="text-sm text-[#9B773A] hover:text-[#B8956C] transition-colors">
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="relative group/btn">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#9B773A] to-[#B8956C] rounded-xl blur-lg opacity-50 group-hover/btn:opacity-75 transition-opacity duration-300" />
                    <Button
                      type="submit"
                      className="relative w-full h-12 text-base font-bold bg-gradient-to-r from-[#9B773A] to-[#B8956C] hover:from-[#B8956C] hover:to-[#9B773A] text-white rounded-xl shadow-lg transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          جاري تسجيل الدخول...
                        </span>
                      ) : (
                        "تسجيل الدخول"
                      )}
                    </Button>
                  </div>
                </form>

                {/* Security Notice */}
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Shield className="h-3 w-3" />
                    <span>اتصال آمن ومشفر</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Section */}
          <div className="flex-1 flex flex-col items-center xl:items-start gap-8 text-center xl:text-right">
            {/* Logo */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#9B773A]/20 to-[#B8956C]/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-28 w-28 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-[#9B773A] to-[#B8956C] bg-clip-text text-transparent">
                  SLID
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#9B773A] via-[#B8956C] to-[#9B773A] bg-clip-text text-transparent">
                الهوية المكانية الذكية
              </h2>
              <p className="text-lg text-slate-400 max-w-md">
                نظام متقدم لإدارة عمليات الطوارئ والتتبع المكاني الذكي
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
              {[
                { icon: Shield, label: "حماية متقدمة" },
                { icon: Radio, label: "تتبع مباشر" },
                { icon: Activity, label: "استجابة فورية" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-[#9B773A]/30 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <feature.icon className="h-6 w-6 text-[#9B773A] group-hover:text-[#B8956C] transition-colors duration-300" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
