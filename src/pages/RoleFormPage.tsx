import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { PermissionDto, RoleDetailDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function RoleFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<PermissionDto[]>([]);
  const [detail, setDetail] = useState<RoleDetailDto | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<PermissionDto[]>("/permissions").then(setCatalog).catch(() => toast.error("تعذر تحميل قائمة الصلاحيات"));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    api
      .get<RoleDetailDto>(`/roles/${id}`)
      .then(data => {
        setDetail(data);
        setName(data.name);
        setDescription(data.description || "");
        setSelectedPerms(new Set(data.permissions.map(p => p.name)));
      })
      .catch(() => toast.error("لم يتم العثور على الدور"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const togglePerm = (permName: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const permNames = [...selectedPerms];
    try {
      if (isEdit && id) {
        await api.put(`/roles/${id}`, {
          name: detail?.isSystemRole ? null : name.trim() || null,
          description: description.trim() || null,
        });
        await api.put(`/roles/${id}/permissions`, { permissionNames: permNames });
        toast.success("تم حفظ الدور");
        const updated = await api.get<RoleDetailDto>(`/roles/${id}`);
        setDetail(updated);
        setName(updated.name);
        setDescription(updated.description || "");
        setSelectedPerms(new Set(updated.permissions.map(p => p.name)));
      } else {
        const created = await api.post<RoleDetailDto>("/roles", {
          name: name.trim(),
          description: description.trim() || null,
          permissionNames: permNames,
        });
        toast.success("تم إنشاء الدور");
        navigate(`/roles/${created.id}`, { replace: true });
      }
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
      await api.delete(`/roles/${id}`);
      toast.success("تم الحذف");
      navigate("/roles");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div>
      <PageHeader title={isEdit ? "تعديل الدور" : "دور جديد"} backTo="/roles" />
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label>اسم الدور</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!!detail?.isSystemRole}
            dir="ltr"
            className="text-left"
            required={!isEdit}
          />
          {detail?.isSystemRole && (
            <p className="text-xs text-muted-foreground">أدوار النظام لا يمكن تغيير اسمها.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>الوصف</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-3">
          <Label>الصلاحيات</Label>
          <div className="rounded-lg border border-border divide-y max-h-72 overflow-y-auto">
            {[...catalog].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
              <label
                key={p.id}
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40"
              >
                <Checkbox
                  checked={selectedPerms.has(p.name)}
                  onCheckedChange={() => togglePerm(p.name)}
                />
                <span className="flex-1 min-w-0">
                  <span className="font-mono text-sm block" dir="ltr">
                    {p.name}
                  </span>
                  {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/roles")}>
            إلغاء
          </Button>
          {isEdit && detail && !detail.isSystemRole && (
            <Button type="button" variant="destructive" className="mr-auto" onClick={() => setDeleteOpen(true)}>
              حذف الدور
            </Button>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="حذف الدور"
        description="سيتم حذف الدور نهائياً إن لم يكن مرتبطاً بمستخدمين."
      />
    </div>
  );
}
