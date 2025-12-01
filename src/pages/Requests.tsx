import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTrackingRequest, getBeneficiaryOptions, getAuthorities, getTrackingRequests } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreateTrackingRequest } from "@/types/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Requests = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateTrackingRequest>({
    beneficiary_id: 0,
    authority_id: 0,
    channel: "API",
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["tracking-requests"],
    queryFn: getTrackingRequests,
  });

  const { data: beneficiaries, isLoading: beneficiariesLoading } = useQuery({
    queryKey: ["beneficiaries-options"],
    queryFn: getBeneficiaryOptions,
    staleTime: 5 * 60 * 1000,
  });

  const { data: authorities, isLoading: authoritiesLoading } = useQuery({
    queryKey: ["authorities"],
    queryFn: getAuthorities,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createTrackingRequest,
    onSuccess: () => {
      toast.success("تم إنشاء طلب التتبع");
      queryClient.invalidateQueries({ queryKey: ["tracking-requests"] });
      setOpen(false);
      setForm({ beneficiary_id: 0, authority_id: 0, channel: "API" });
    },
    onError: () => toast.error("فشل إنشاء الطلب"),
  });

  const authorityOptions = useMemo(() => authorities || [], [authorities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.beneficiary_id || !form.authority_id) {
      toast.error("يرجى إدخال رقم المستفيد ورقم الجهة");
      return;
    }
    createMutation.mutate({
      beneficiary_id: Number(form.beneficiary_id),
      authority_id: Number(form.authority_id),
      channel: form.channel,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">طلبات التتبع</h2>
        <p className="text-muted-foreground">عرض وإنشاء طلبات التتبع حسب المستند</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الطلبات</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>إضافة طلب تتبع</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : <RequestsTable requests={requests || []} />}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طلب تتبع جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>المستفيد</Label>
              {beneficiariesLoading ? (
                <Skeleton className="h-10" />
              ) : (
                <Select
                  value={form.beneficiary_id ? String(form.beneficiary_id) : ""}
                  onValueChange={(val) => setForm((f) => ({ ...f, beneficiary_id: Number(val) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستفيداً" />
                  </SelectTrigger>
                  <SelectContent>
                    {(beneficiaries || []).map((b) => (
                      <SelectItem key={`${b.id}-${b.national_id}`} value={String(b.id)}>
                        {b.name} — {b.national_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>الجهة</Label>
              {authoritiesLoading ? (
                <Skeleton className="h-10" />
              ) : (
                <Select
                  value={form.authority_id ? String(form.authority_id) : ""}
                  onValueChange={(val) => setForm((f) => ({ ...f, authority_id: Number(val) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر جهة" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorityOptions.map((auth) => (
                      <SelectItem key={auth.id} value={String(auth.id)}>
                        {auth.name} — #{auth.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>القناة</Label>
              <RadioGroup
                value={form.channel}
                onValueChange={(val) => setForm((f) => ({ ...f, channel: val as CreateTrackingRequest["channel"] }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="API" id="channel-api" />
                  <Label htmlFor="channel-api">API</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="SMS" id="channel-sms" />
                  <Label htmlFor="channel-sms">SMS</Label>
                </div>
              </RadioGroup>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requests;
