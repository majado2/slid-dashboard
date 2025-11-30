import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getTrackingRequests } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RequestsChart } from "@/components/dashboard/RequestsChart";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { Users, UserCheck, UserX, CheckCircle, XCircle, FileText, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">لوحة التحكم</h2>
        <p className="text-muted-foreground">نظرة عامة على إحصائيات النظام</p>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="إجمالي المستفيدين"
          value={stats?.users.total_users || 0}
          icon={Users}
          description="عدد جميع المستفيدين المسجلين"
        />
        <StatsCard
          title="مستفيدون مفعّلون"
          value={stats?.users.active_location_users || 0}
          icon={UserCheck}
          description="المستفيدون الذين فعّلوا الموقع"
        />
        <StatsCard
          title="مستفيدون غير مفعّلين"
          value={stats?.users.inactive_location_users || 0}
          icon={UserX}
          description="المستفيدون الذين لم يفعّلوا الموقع"
        />
        <StatsCard
          title="إجمالي الجهات"
          value={stats?.authorities.total_authorities || 0}
          icon={Building2}
          description="عدد الجهات الحكومية المسجلة"
        />
      </div>

      {/* Beneficiaries Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="مستفيدون استفادوا"
          value={stats?.users.benefited_users || 0}
          icon={CheckCircle}
          description="لديهم سجلات تتبع"
        />
        <StatsCard
          title="مستفيدون لم يستفيدوا"
          value={stats?.users.not_benefited_users || 0}
          icon={XCircle}
          description="ليس لديهم سجلات تتبع"
        />
      </div>

      {/* Tracking Requests Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            إحصائيات الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">
            {stats?.tracking.total_requests || 0}
          </div>
          <p className="text-sm text-muted-foreground">إجمالي طلبات التتبع</p>
        </CardContent>
      </Card>

      {/* Charts */}
      {stats?.tracking.requests_by_status && (
        <RequestsChart data={stats.tracking.requests_by_status} />
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>آخر الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <RequestsTable requests={requests || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
