import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getTrackingRequests } from "@/lib/api";
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
      {/* Subtle Background Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(155, 119, 58, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(155, 119, 58, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl" style={{ backgroundColor: 'rgba(155, 119, 58, 0.03)' }} />
      </div>

      <div className="relative space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl blur-lg animate-pulse" style={{ backgroundColor: 'rgba(155, 119, 58, 0.15)' }} />
                <div className="relative h-12 w-12 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)', borderColor: 'rgba(155, 119, 58, 0.3)' }}>
                  <Shield className="h-6 w-6" style={{ color: '#9B773A' }} />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  مركز العمليات
                </h2>
                <p className="text-neutral-400">نظرة عامة على إحصائيات النظام</p>
              </div>
            </div>
          </div>

          {/* Live Status Indicators */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)', borderColor: 'rgba(155, 119, 58, 0.3)' }}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: '#9B773A' }} />
                <div className="relative h-2 w-2 rounded-full" style={{ backgroundColor: '#9B773A' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: '#9B773A' }}>النظام نشط</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <Radio className="h-4 w-4 animate-pulse" style={{ color: '#9B773A' }} />
              <span className="text-sm text-neutral-300">بث مباشر</span>
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
            variant="primary"
          />
          <EmergencyStatsCard
            title="مستفيدون مفعّلون"
            value={stats?.users.active_location_users || 0}
            icon={UserCheck}
            description="المستفيدون الذين فعّلوا الموقع"
            variant="primary"
          />
          <EmergencyStatsCard
            title="مستفيدون غير مفعّلين"
            value={stats?.users.inactive_location_users || 0}
            icon={UserX}
            description="المستفيدون الذين لم يفعّلوا الموقع"
            variant="warning"
          />
          <EmergencyStatsCard
            title="إجمالي الجهات"
            value={stats?.authorities.total_authorities || 0}
            icon={Building2}
            description="عدد الجهات الحكومية المسجلة"
            variant="primary"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <EmergencyStatsCard
            title="مستفيدون استفادوا"
            value={stats?.users.benefited_users || 0}
            icon={CheckCircle}
            description="لديهم سجلات تتبع"
            variant="success"
            large
          />
          <EmergencyStatsCard
            title="مستفيدون لم يستفيدوا"
            value={stats?.users.not_benefited_users || 0}
            icon={XCircle}
            description="ليس لديهم سجلات تتبع"
            variant="danger"
            large
          />
        </div>

        {/* Tracking Requests Stats Card */}
        <Card className="relative overflow-hidden bg-neutral-900/60 border-neutral-800 group hover:border-opacity-100 transition-all duration-300" style={{ ['--hover-border' as string]: 'rgba(155, 119, 58, 0.4)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(155, 119, 58, 0.05)' }} />
          
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)', borderColor: 'rgba(155, 119, 58, 0.3)' }}>
                <FileText className="h-5 w-5" style={{ color: '#9B773A' }} />
              </div>
              <span className="text-lg font-semibold text-white">إحصائيات الطلبات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold" style={{ color: '#9B773A' }}>
                {stats?.tracking.total_requests || 0}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md border mb-2" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)', borderColor: 'rgba(155, 119, 58, 0.3)' }}>
                <Activity className="h-3 w-3" style={{ color: '#9B773A' }} />
                <span className="text-xs" style={{ color: '#9B773A' }}>نشط</span>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-2">إجمالي طلبات التتبع في النظام</p>
          </CardContent>
        </Card>

        {/* Charts Section */}
        {stats?.tracking.requests_by_status && (
          <RequestsChart data={stats.tracking.requests_by_status} />
        )}

        {/* Requests Table */}
        <Card className="relative overflow-hidden bg-neutral-900/60 border-neutral-800">
          <CardHeader className="relative border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)', borderColor: 'rgba(155, 119, 58, 0.3)' }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: '#9B773A' }} />
                </div>
                <span className="text-lg font-semibold text-white">آخر الطلبات</span>
              </CardTitle>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border" style={{ backgroundColor: 'rgba(155, 119, 58, 0.1)', borderColor: 'rgba(155, 119, 58, 0.3)' }}>
                <Zap className="h-3 w-3" style={{ color: '#9B773A' }} />
                <span className="text-xs" style={{ color: '#9B773A' }}>تحديث مباشر</span>
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
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  description: string;
  variant: 'primary' | 'success' | 'warning' | 'danger';
  large?: boolean;
}

const variantStyles = {
  primary: {
    iconBg: 'rgba(155, 119, 58, 0.1)',
    iconBorder: 'rgba(155, 119, 58, 0.3)',
    iconColor: '#9B773A',
    valueColor: '#9B773A',
    glowColor: 'rgba(155, 119, 58, 0.1)',
  },
  success: {
    iconBg: 'rgba(34, 197, 94, 0.1)',
    iconBorder: 'rgba(34, 197, 94, 0.3)',
    iconColor: '#22c55e',
    valueColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.1)',
  },
  warning: {
    iconBg: 'rgba(245, 158, 11, 0.1)',
    iconBorder: 'rgba(245, 158, 11, 0.3)',
    iconColor: '#f59e0b',
    valueColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.1)',
  },
  danger: {
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconBorder: 'rgba(239, 68, 68, 0.3)',
    iconColor: '#ef4444',
    valueColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.1)',
  },
};

const EmergencyStatsCard = ({ title, value, icon: Icon, description, variant, large }: EmergencyStatsCardProps) => {
  const styles = variantStyles[variant];
  
  return (
    <Card className="relative overflow-hidden bg-neutral-900/60 border-neutral-800 group hover:border-neutral-700 transition-all duration-300">
      {/* Subtle glow effect on hover */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: styles.glowColor }}
      />

      <CardContent className={cn("relative", large ? "p-6" : "p-5")}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-neutral-400">{title}</p>
            <div 
              className={cn("font-bold", large ? "text-4xl" : "text-3xl")}
              style={{ color: styles.valueColor }}
            >
              {value.toLocaleString('ar-SA')}
            </div>
            <p className="text-xs text-neutral-500">{description}</p>
          </div>
          <div 
            className={cn(
              "rounded-lg border flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
              large ? "h-14 w-14" : "h-12 w-12"
            )}
            style={{ 
              backgroundColor: styles.iconBg,
              borderColor: styles.iconBorder
            }}
          >
            <Icon 
              className={cn(large ? "h-7 w-7" : "h-6 w-6")} 
              style={{ color: styles.iconColor }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
