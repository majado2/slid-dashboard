import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getTrackingRequests } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RequestsChart } from "@/components/dashboard/RequestsChart";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { 
  Users, UserCheck, UserX, CheckCircle, XCircle, FileText, Building2,
  Activity, Radio, Shield, AlertTriangle, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["tracking-requests"],
    queryFn: getTrackingRequests,
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-lg animate-pulse" />
                <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  مركز العمليات
                </h2>
                <p className="text-muted-foreground">نظرة عامة على إحصائيات النظام</p>
              </div>
            </div>
          </div>

          {/* Live Status Indicators */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                <div className="relative h-2 w-2 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-sm text-emerald-400 font-medium">النظام نشط</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <Radio className="h-4 w-4 text-teal-400 animate-pulse" />
              <span className="text-sm text-slate-300">بث مباشر</span>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <EmergencyStatsCard
            title="إجمالي المستفيدين"
            value={stats?.users.total_users || 0}
            icon={Users}
            description="عدد جميع المستفيدين المسجلين"
            color="emerald"
          />
          <EmergencyStatsCard
            title="مستفيدون مفعّلون"
            value={stats?.users.active_location_users || 0}
            icon={UserCheck}
            description="المستفيدون الذين فعّلوا الموقع"
            color="teal"
          />
          <EmergencyStatsCard
            title="مستفيدون غير مفعّلين"
            value={stats?.users.inactive_location_users || 0}
            icon={UserX}
            description="المستفيدون الذين لم يفعّلوا الموقع"
            color="amber"
          />
          <EmergencyStatsCard
            title="إجمالي الجهات"
            value={stats?.authorities.total_authorities || 0}
            icon={Building2}
            description="عدد الجهات الحكومية المسجلة"
            color="blue"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <EmergencyStatsCard
            title="مستفيدون استفادوا"
            value={stats?.users.benefited_users || 0}
            icon={CheckCircle}
            description="لديهم سجلات تتبع"
            color="emerald"
            large
          />
          <EmergencyStatsCard
            title="مستفيدون لم يستفيدوا"
            value={stats?.users.not_benefited_users || 0}
            icon={XCircle}
            description="ليس لديهم سجلات تتبع"
            color="rose"
            large
          />
        </div>

        {/* Tracking Requests Stats Card */}
        <Card className="relative overflow-hidden bg-slate-900/50 border-slate-700/50 backdrop-blur-sm group hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-lg font-semibold">إحصائيات الطلبات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {stats?.tracking.total_requests || 0}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-2">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">نشط</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">إجمالي طلبات التتبع في النظام</p>
          </CardContent>
        </Card>

        {/* Charts Section */}
        {stats?.tracking.requests_by_status && (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative">
              <RequestsChart data={stats.tracking.requests_by_status} />
            </div>
          </div>
        )}

        {/* Requests Table */}
        <Card className="relative overflow-hidden bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-transparent to-slate-800/50" />
          
          <CardHeader className="relative border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-lg font-semibold">آخر الطلبات</span>
              </CardTitle>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-amber-400">تحديث مباشر</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative p-0">
            {requestsLoading ? (
              <div className="p-6">
                <Skeleton className="h-64" />
              </div>
            ) : (
              <RequestsTable requests={requests || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Emergency-styled Stats Card Component
interface EmergencyStatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: 'emerald' | 'teal' | 'amber' | 'blue' | 'rose';
  large?: boolean;
}

const colorStyles = {
  emerald: {
    bg: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'bg-emerald-500/20',
    gradient: 'from-emerald-400 to-teal-400',
  },
  teal: {
    bg: 'from-teal-500/20 to-cyan-500/20',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    glow: 'bg-teal-500/20',
    gradient: 'from-teal-400 to-cyan-400',
  },
  amber: {
    bg: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'bg-amber-500/20',
    gradient: 'from-amber-400 to-orange-400',
  },
  blue: {
    bg: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'bg-blue-500/20',
    gradient: 'from-blue-400 to-indigo-400',
  },
  rose: {
    bg: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'bg-rose-500/20',
    gradient: 'from-rose-400 to-pink-400',
  },
};

const EmergencyStatsCard = ({ title, value, icon: Icon, description, color, large }: EmergencyStatsCardProps) => {
  const styles = colorStyles[color];
  
  return (
    <Card className={cn(
      "relative overflow-hidden bg-slate-900/50 border-slate-700/50 backdrop-blur-sm group hover:border-opacity-100 transition-all duration-500",
      `hover:${styles.border}`
    )}>
      {/* Glow effect */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        styles.glow
      )} />
      
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        styles.bg.replace('from-', 'from-').replace('/20', '/5').replace('to-', 'to-').replace('/20', '/5')
      )} />

      <CardContent className={cn("relative", large ? "p-6" : "p-5")}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className={cn(
              "font-bold bg-gradient-to-r bg-clip-text text-transparent",
              styles.gradient,
              large ? "text-4xl" : "text-3xl"
            )}>
              {value.toLocaleString('ar-SA')}
            </div>
            <p className="text-xs text-muted-foreground/70">{description}</p>
          </div>
          <div className={cn(
            "rounded-xl bg-gradient-to-br flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            styles.bg,
            styles.border,
            "border",
            large ? "h-14 w-14" : "h-12 w-12"
          )}>
            <Icon className={cn(styles.text, large ? "h-7 w-7" : "h-6 w-6")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
