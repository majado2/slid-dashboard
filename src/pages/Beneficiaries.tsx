import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Beneficiary,
  TrackingRequest,
} from "@/types/api";
import {
  getBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  getBeneficiaryRequests,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Plus, RefreshCcw, Eye } from "lucide-react";

type FormState = Partial<Beneficiary>;

const emptyForm: FormState = {
  name: "",
  mobile: "",
  national_id: "",
  password: "",
  latitude: undefined,
  longitude: undefined,
  accuracy_m: undefined,
  altitude_m: undefined,
  location_verification: "inactive",
};

const Beneficiaries = () => {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [openRequests, setOpenRequests] = useState<Beneficiary | null>(null);

  const { data: beneficiaries, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["beneficiaries"],
    queryFn: getBeneficiaries,
  });

  const { data: beneficiaryRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["beneficiary-requests", openRequests?.id],
    queryFn: () => getBeneficiaryRequests(openRequests?.id || 0),
    enabled: !!openRequests?.id,
  });

  const createMutation = useMutation({
    mutationFn: createBeneficiary,
    onSuccess: () => {
      toast.success("تم إنشاء المستفيد");
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      setOpenForm(false);
      setForm(emptyForm);
    },
    onError: () => toast.error("فشل إنشاء المستفيد"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ nationalId, payload }: { nationalId: string; payload: Partial<Beneficiary> }) =>
      updateBeneficiary(nationalId, payload),
    onSuccess: () => {
      toast.success("تم تحديث المستفيد");
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      setOpenForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("فشل تحديث المستفيد"),
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const handleOpenEdit = (beneficiary: Beneficiary) => {
    setEditing(beneficiary);
    setForm({
      name: beneficiary.name,
      mobile: beneficiary.mobile,
      national_id: beneficiary.national_id,
      password: "",
      latitude: beneficiary.latitude,
      longitude: beneficiary.longitude,
      accuracy_m: beneficiary.accuracy_m,
      altitude_m: beneficiary.altitude_m,
      location_verification: beneficiary.location_verification,
    });
    setOpenForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Beneficiary = {
      name: form.name || "",
      mobile: form.mobile || "",
      national_id: form.national_id || "",
      password: form.password || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      accuracy_m: form.accuracy_m ? Number(form.accuracy_m) : undefined,
      altitude_m: form.altitude_m ? Number(form.altitude_m) : undefined,
      location_verification: form.location_verification,
    };

    if (editing) {
      updateMutation.mutate({ nationalId: editing.national_id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const sortedBeneficiaries = useMemo(() => {
    return [...(beneficiaries || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [beneficiaries]);

  const renderRequestsSection = () => {
    if (!openRequests) return null;
    return (
      <Dialog open={!!openRequests} onOpenChange={() => setOpenRequests(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>طلبات المستفيد #{openRequests.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {requestsLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <RequestsTable requests={(beneficiaryRequests as TrackingRequest[]) || []} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">المستفيدون</h2>
        <p className="text-muted-foreground">إدارة المستفيدين وإنشاء/تعديل السجلات واستعراض طلباتهم</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة المستفيدين</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              <span className="ml-2">تحديث</span>
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              <span className="ml-2">إضافة مستفيد</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الجوال</TableHead>
                    <TableHead className="text-right">الهوية الوطنية</TableHead>
                    <TableHead className="text-right">توثيق الموقع</TableHead>
                    <TableHead className="text-right">إحداثيات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBeneficiaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        لا توجد بيانات
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedBeneficiaries.map((b) => (
                      <TableRow key={`${b.id}-${b.national_id}`}>
                        <TableCell className="font-mono">#{b.id ?? b.national_id}</TableCell>
                        <TableCell>{b.name}</TableCell>
                        <TableCell>{b.mobile}</TableCell>
                        <TableCell>{b.national_id}</TableCell>
                        <TableCell>
                          <Badge variant={b.location_verification === "active" ? "default" : "secondary"}>
                            {b.location_verification === "active" ? "مفعل" : "غير مفعل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {b.latitude && b.longitude ? (
                            <span className="text-xs font-mono">
                              {b.latitude}, {b.longitude}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">غير متوفر</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(b)} title="تعديل">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => b.id && setOpenRequests(b)}
                              title="عرض الطلبات"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل مستفيد" : "إضافة مستفيد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">رقم الجوال</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">الهوية الوطنية</Label>
                <Input
                  id="national_id"
                  value={form.national_id}
                  onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
                  required
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={editing ? "اتركها فارغة للإبقاء على الحالية" : ""}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">خط العرض</Label>
                <Input
                  id="latitude"
                  type="number"
                  value={form.latitude ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">خط الطول</Label>
                <Input
                  id="longitude"
                  type="number"
                  value={form.longitude ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accuracy_m">دقة الموقع (م)</Label>
                <Input
                  id="accuracy_m"
                  type="number"
                  value={form.accuracy_m ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, accuracy_m: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altitude_m">الارتفاع (م)</Label>
                <Input
                  id="altitude_m"
                  type="number"
                  value={form.altitude_m ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, altitude_m: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>توثيق الموقع</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={form.location_verification === "active" ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, location_verification: "active" }))}
                  >
                    مفعل
                  </Button>
                  <Button
                    type="button"
                    variant={form.location_verification === "inactive" ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, location_verification: "inactive" }))}
                  >
                    غير مفعل
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setOpenForm(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جارٍ الحفظ..." : editing ? "تحديث" : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {renderRequestsSection()}
    </div>
  );
};

export default Beneficiaries;
