import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface RequestsChartProps {
  data: {
    new: number;
    in_progress: number;
    done: number;
    rejected: number;
  };
}

const STATUS_COLORS = {
  new: "hsl(var(--muted-foreground))",
  in_progress: "hsl(var(--primary))",
  done: "hsl(142.1 76.2% 36.3%)",
  rejected: "hsl(var(--destructive))",
};

const STATUS_LABELS = {
  new: "جديد",
  in_progress: "قيد المعالجة",
  done: "مكتمل",
  rejected: "مرفوض",
};

export function RequestsChart({ data }: RequestsChartProps) {
  const chartData = [
    { name: STATUS_LABELS.new, value: data.new, color: STATUS_COLORS.new },
    { name: STATUS_LABELS.in_progress, value: data.in_progress, color: STATUS_COLORS.in_progress },
    { name: STATUS_LABELS.done, value: data.done, color: STATUS_COLORS.done },
    { name: STATUS_LABELS.rejected, value: data.rejected, color: STATUS_COLORS.rejected },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>توزيع الطلبات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>النسب المئوية للحالات</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
