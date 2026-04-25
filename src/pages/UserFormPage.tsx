import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getUserId } from "@/lib/api";
import type { RoleListItemDto, UserDetailDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { MembershipJoinRequestListItemDto } from "@/lib/types";

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const currentUserId = getUserId();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [rolesCatalog, setRolesCatalog] = useState<RoleListItemDto[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [lockoutEnd, setLockoutEnd] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [resetPassword, setResetPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [membershipRequest, setMembershipRequest] = useState<MembershipJoinRequestListItemDto | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);

  useEffect(() => {
    api.get<RoleListItemDto[]>("/roles").then(setRolesCatalog).catch(() => toast.error("تعذر تحميل الأدوار"));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    api
      .get<UserDetailDto>(`/users/${id}`)
      .then(u => {
        setEmail(u.email);
        setDisplayName(u.displayName || "");
        setEmailConfirmed(u.emailConfirmed);
        setLockoutEnd(u.lockoutEnd);
        setSelectedRoles(new Set(u.roles));
      })
      .catch(() => toast.error("لم يتم العثور على المستخدم"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    api
      .get<MembershipJoinRequestListItemDto>(`/membership-requests/${id}`)
      .then(setMembershipRequest)
      .catch(() => setMembershipRequest(null));
  }, [id, isEdit]);

  const toggleRole = (name: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post<UserDetailDto>("/users", {
        email: email.trim(),
        password,
        displayName: displayName.trim() || null,
        roleNames: [...selectedRoles],
      });
      toast.success("تم إنشاء المستخدم");
      navigate("/users");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await api.put(`/users/${id}`, {
        email: email.trim() || null,
        displayName: displayName.trim() || null,
        emailConfirmed,
      });
      await api.post(`/users/${id}/roles`, { roleNames: [...selectedRoles] });
      toast.success("تم حفظ التغييرات");
      const u = await api.get<UserDetailDto>(`/users/${id}`);
      setEmail(u.email);
      setDisplayName(u.displayName || "");
      setEmailConfirmed(u.emailConfirmed);
      setLockoutEnd(u.lockoutEnd);
      setSelectedRoles(new Set(u.roles));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id || !resetPassword.trim()) return;
    setSaving(true);
    try {
      await api.post(`/users/${id}/password`, { newPassword: resetPassword });
      toast.success("تم تغيير كلمة المرور");
      setResetPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivation = async (isActive: boolean) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.post<UserDetailDto>(`/users/${id}/activation`, { isActive });
      setLockoutEnd(updated.lockoutEnd);
      toast.success(isActive ? "تم تفعيل الحساب" : "تم تعطيل الحساب");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${id}`);
      toast.success("تم حذف المستخدم");
      navigate("/users");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const isSelf = isEdit && id === currentUserId;
  const boolLabel = (v: boolean) => (v ? "نعم" : "لا");
  const membershipDetails: Array<{ label: string; value: string }> = membershipRequest
    ? [
        { label: "الاسم الكامل", value: `${membershipRequest.firstName} ${membershipRequest.fatherName} ${membershipRequest.lastName}` },
        { label: "تاريخ الميلاد", value: membershipRequest.birthDate },
        { label: "الجنس", value: membershipRequest.gender },
        { label: "البريد الإلكتروني", value: membershipRequest.email },
        { label: "رقم الهاتف", value: membershipRequest.phoneNumber },
        { label: "المدينة", value: membershipRequest.city },
        { label: "العنوان", value: membershipRequest.address || "—" },
        { label: "طريقة التواصل المفضلة", value: membershipRequest.preferredContactMethod },
        { label: "المستوى التعليمي", value: membershipRequest.educationLevel },
        { label: "الاختصاص", value: membershipRequest.specialization },
        { label: "المهنة الحالية", value: membershipRequest.currentProfession },
        { label: "جهة العمل", value: membershipRequest.employer || "—" },
        { label: "سبب الانضمام", value: membershipRequest.joinReason },
        { label: "انتماء سياسي سابق", value: boolLabel(membershipRequest.previouslyAffiliated) },
        { label: "تفاصيل الانتماء السابق", value: membershipRequest.previousAffiliationDetails || "—" },
        { label: "مجالات المشاركة", value: membershipRequest.participationAreas },
        { label: "القضايا محل الاهتمام", value: membershipRequest.focusIssues },
        { label: "المهارات", value: membershipRequest.skills },
        { label: "الخبرات السابقة", value: membershipRequest.previousExperiences || "—" },
        { label: "اللغات", value: membershipRequest.languages },
        { label: "عدد ساعات التطوع أسبوعياً", value: membershipRequest.weeklyVolunteerHours },
        { label: "الجاهزية للعمل الميداني", value: boolLabel(membershipRequest.fieldWorkReady) },
        { label: "القدرة على التنقل/السفر", value: membershipRequest.mobilityTravelAbility },
        { label: "الالتزام بالمبادئ", value: boolLabel(membershipRequest.commitToPrinciples) },
        { label: "الإقرار بصحة المعلومات", value: boolLabel(membershipRequest.infoIsAccurate) },
        { label: "الموافقة على سياسة الخصوصية", value: boolLabel(membershipRequest.acceptPrivacyPolicy) },
        { label: "تاريخ الطلب", value: new Date(membershipRequest.requestedAt).toLocaleString("ar-SY") },
      ]
    : [];

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  if (!isEdit) {
    return (
      <div>
        <PageHeader title="مستخدم جديد" backTo="/users" />
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4">
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" className="text-left" />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" className="text-left" autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label>الاسم المعروض</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label>الأدوار</Label>
            <div className="rounded-lg border border-border divide-y max-h-48 overflow-y-auto">
              {[...rolesCatalog].sort((a, b) => a.name.localeCompare(b.name)).map(r => (
                <label key={r.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={selectedRoles.has(r.name)} onCheckedChange={() => toggleRole(r.name)} />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/users")}>إلغاء</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="تعديل المستخدم" backTo="/users" />
      <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4">
        <div className="space-y-2">
          <Label>البريد الإلكتروني</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" className="text-left" />
        </div>
        <div className="space-y-2">
          <Label>الاسم المعروض</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={emailConfirmed} onCheckedChange={setEmailConfirmed} />
          <Label>البريد مؤكد</Label>
        </div>
        {lockoutEnd && (
          <p className="text-sm text-destructive">
            الحساب مقفل حتى {new Date(lockoutEnd).toLocaleString("ar-SY")}
          </p>
        )}
        <div className="space-y-3">
          <Label>الأدوار</Label>
          <div className="rounded-lg border border-border divide-y max-h-48 overflow-y-auto">
            {[...rolesCatalog].sort((a, b) => a.name.localeCompare(b.name)).map(r => (
              <label key={r.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40">
                <Checkbox checked={selectedRoles.has(r.name)} onCheckedChange={() => toggleRole(r.name)} />
                <span>{r.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/users")}>إلغاء</Button>
        </div>
      </form>

      <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4 mt-6">
        <h2 className="font-semibold text-lg">إعادة تعيين كلمة المرور</h2>
        <div className="space-y-2">
          <Label>كلمة مرور جديدة</Label>
          <Input
            type="password"
            value={resetPassword}
            onChange={e => setResetPassword(e.target.value)}
            dir="ltr"
            className="text-left"
            autoComplete="new-password"
          />
        </div>
        <Button type="button" variant="secondary" disabled={saving || !resetPassword.trim()} onClick={handleResetPassword}>
          تحديث كلمة المرور
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4 mt-6">
        <h2 className="font-semibold text-lg">حالة الحساب</h2>
        <p className="text-sm text-muted-foreground">
          {lockoutEnd ? "الحساب معطل حالياً." : "الحساب مفعل حالياً."}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={saving || !lockoutEnd} onClick={() => handleToggleActivation(true)}>
            تفعيل الحساب
          </Button>
          <Button type="button" variant="destructive" disabled={saving || !!lockoutEnd} onClick={() => handleToggleActivation(false)}>
            تعطيل الحساب
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4 mt-6">
        <h2 className="font-semibold text-lg">طلب الانضمام</h2>
        {membershipRequest ? (
          <>
            <p className="text-sm text-muted-foreground">يمكنك عرض كل البيانات التي قدّمها المستخدم في طلب الانضمام.</p>
            <Button type="button" variant="outline" onClick={() => setMembershipOpen(true)}>
              عرض طلب الانضمام
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد بيانات طلب انضمام لهذا المستخدم.</p>
        )}
      </div>

      {!isSelf && (
        <div className="mt-6 max-w-lg">
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            حذف المستخدم
          </Button>
        </div>
      )}
      {isSelf && (
        <p className="text-sm text-muted-foreground mt-4 max-w-lg">لا يمكنك حذف حسابك الحالي من هنا.</p>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="حذف المستخدم"
        description="سيتم حذف هذا المستخدم نهائياً."
      />

      <Dialog open={membershipOpen} onOpenChange={setMembershipOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الانضمام</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {membershipDetails.map((item) => (
              <div key={item.label} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{item.value}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
