import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getTrackingRequests } from "@/lib/api";
import { RequestsChart } from "@/components/dashboard/RequestsChart";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { 
  Users, UserCheck, UserX, CheckCircle, XCircle, FileText, Building2,
  Activity, Radio, Shield, AlertTriangle, Zap, TrendingUp, ArrowUpRight
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
      {/* Subtle Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(155, 119, 58, 0.5) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: 'rgba(155, 119, 58, 0.4)', backgroundColor: 'rgba(155, 119, 58, 0.08)' }}>
              <Shield className="h-7 w-7" style={{ color: '#9B773A' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">مركز العمليات</h2>
              <p className="text-neutral-500 text-sm">نظرة عامة على إحصائيات النظام</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ backgroundColor: 'rgba(155, 119, 58, 0.08)', borderColor: 'rgba(155, 119, 58, 0.25)' }}>
            <div className="relative flex items-center justify-center">
              <span className="absolute h-3 w-3 rounded-full animate-ping" style={{ backgroundColor: 'rgba(155, 119, 58, 0.4)' }} />
              <span className="relative h-2 w-2 rounded-full" style={{ backgroundColor: '#9B773A' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: '#9B773A' }}>متصل</span>
          </div>
        </div>

        {/* Main Stats - New Design */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            label="إجمالي المستفيدين"
            value={stats?.users.total_users || 0}
            icon={Users}
            trend="+12%"
          />
          <StatBlock
            label="مستفيدون مفعّلون"
            value={stats?.users.active_location_users || 0}
            icon={UserCheck}
            trend="+8%"
            highlight
          />
          <StatBlock
            label="غير مفعّلين"
            value={stats?.users.inactive_location_users || 0}
            icon={UserX}
            trend="-3%"
            negative
          />
          <StatBlock
            label="الجهات"
            value={stats?.authorities.total_authorities || 0}
            icon={Building2}
            trend="+2"
          />
        </div>

        {/* Secondary Stats - Horizontal Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border p-6" style={{ backgroundColor: 'rgba(34, 197, 94, 0.04)', borderColor: 'rgba(34, 197, 94, 0.15)' }}>
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-neutral-400">مستفيدون استفادوا</span>
                </div>
                <div className="text-4xl font-bold text-green-500">
                  {(stats?.users.benefited_users || 0).toLocaleString('ar-SA')}
                </div>
                <p className="text-xs text-neutral-500">لديهم سجلات تتبع نشطة</p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0" />
          </div>

          <div className="relative overflow-hidden rounded-2xl border p-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.04)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-neutral-400">لم يستفيدوا بعد</span>
                </div>
                <div className="text-4xl font-bold text-red-500">
                  {(stats?.users.not_benefited_users || 0).toLocaleString('ar-SA')}
                </div>
                <p className="text-xs text-neutral-500">بدون سجلات تتبع</p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0" />
          </div>
        </div>

        {/* Total Requests - Prominent Card */}
        <div className="relative overflow-hidden rounded-2xl border p-8" style={{ backgroundColor: 'rgba(155, 119, 58, 0.05)', borderColor: 'rgba(155, 119, 58, 0.2)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(155, 119, 58, 0.08)' }} />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" style={{ color: '#9B773A' }} />
                <span className="text-neutral-400">إجمالي طلبات التتبع</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-bold" style={{ color: '#9B773A' }}>
                  {stats?.tracking.total_requests || 0}
                </span>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(155, 119, 58, 0.15)' }}>
                  <TrendingUp className="h-3 w-3" style={{ color: '#9B773A' }} />
                  <span className="text-xs font-medium" style={{ color: '#9B773A' }}>+24%</span>
                </div>
              </div>
            </div>
            <div className="h-20 w-20 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: 'rgba(155, 119, 58, 0.3)', backgroundColor: 'rgba(155, 119, 58, 0.1)' }}>
              <Activity className="h-10 w-10" style={{ color: '#9B773A' }} />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {stats?.tracking.requests_by_status && (
          <RequestsChart data={stats.tracking.requests_by_status} />
        )}

        {/* Requests Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(155, 119, 58, 0.15)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b bg-neutral-900/50" style={{ borderColor: 'rgba(155, 119, 58, 0.15)' }}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" style={{ color: '#9B773A' }} />
              <span className="font-semibold text-white">آخر الطلبات</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)' }}>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#9B773A' }} />
              <span className="text-xs" style={{ color: '#9B773A' }}>مباشر</span>
            </div>
          </div>
          <div className="bg-neutral-950/50">
            {requestsLoading ? (
              <div className="p-6">
                <Skeleton className="h-64" />
              </div>
            ) : (
              <RequestsTable requests={requests || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// New Stat Block Component
interface StatBlockProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  trend: string;
  highlight?: boolean;
  negative?: boolean;
}

const StatBlock = ({ label, value, icon: Icon, trend, highlight, negative }: StatBlockProps) => {
  const accentColor = negative ? '#f59e0b' : '#9B773A';
  
  return (
    <div 
      className={cn(
        "relative group rounded-2xl border p-5 transition-all duration-300 hover:translate-y-[-2px]",
        highlight && "ring-1"
      )}
      style={{ 
        backgroundColor: highlight ? 'rgba(155, 119, 58, 0.06)' : 'rgba(23, 23, 23, 0.6)',
        borderColor: highlight ? 'rgba(155, 119, 58, 0.25)' : 'rgba(64, 64, 64, 0.5)',
        ...(highlight && { ringColor: 'rgba(155, 119, 58, 0.15)' })
      }}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="h-11 w-11 rounded-xl border flex items-center justify-center"
          style={{ 
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}30`
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
          style={{ 
            backgroundColor: negative ? 'rgba(245, 158, 11, 0.1)' : 'rgba(155, 119, 58, 0.1)',
            color: negative ? '#f59e0b' : '#9B773A'
          }}
        >
          <ArrowUpRight className={cn("h-3 w-3", negative && "rotate-90")} />
          {trend}
        </div>
      </div>

      {/* Value */}
      <div 
        className="text-3xl font-bold mb-1"
        style={{ color: accentColor }}
      >
        {value.toLocaleString('ar-SA')}
      </div>

      {/* Label */}
      <p className="text-sm text-neutral-500">{label}</p>

      {/* Bottom accent line */}
      <div 
        className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-50"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
};

export default Dashboard;
