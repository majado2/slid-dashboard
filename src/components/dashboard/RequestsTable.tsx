import { TrackingRequest } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface RequestsTableProps {
  requests: TrackingRequest[];
}

const getStatusBadge = (status: TrackingRequest["status"]) => {
  const variants = {
    new: { variant: "secondary" as const, label: "جديد", className: "" },
    in_progress: { variant: "default" as const, label: "قيد المعالجة", className: "" },
    done: { variant: "outline" as const, label: "مكتمل", className: "border-green-500 text-green-700 bg-green-50" },
    rejected: { variant: "destructive" as const, label: "مرفوض", className: "" },
  };

  const { variant, label, className } = variants[status];
  return <Badge variant={variant} className={className}>{label}</Badge>;
};

const getChannelBadge = (channel: TrackingRequest["channel"]) => {
  return (
    <Badge variant="outline" className="font-mono">
      {channel}
    </Badge>
  );
};

export function RequestsTable({ requests }: RequestsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">رقم الطلب</TableHead>
            <TableHead className="text-right">رقم المستفيد</TableHead>
            <TableHead className="text-right">رقم الجهة</TableHead>
            <TableHead className="text-right">القناة</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">تاريخ الإنشاء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                لا توجد طلبات
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/requests/${request.id}`)}
              >
                <TableCell className="font-medium">#{request.id}</TableCell>
                <TableCell>{request.beneficiary_id}</TableCell>
                <TableCell>{request.authority_id}</TableCell>
                <TableCell>{getChannelBadge(request.channel)}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell dir="ltr" className="text-right">
                  {format(new Date(request.created_at), "dd MMM yyyy HH:mm", { locale: ar })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
