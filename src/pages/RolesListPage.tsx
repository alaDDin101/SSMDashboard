import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { RoleListItemDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function RolesListPage() {
  const [roles, setRoles] = useState<RoleListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<RoleListItemDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("roles.manage");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.get<RoleListItemDto[]>("/roles");
      setRoles(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      toast.success("تم حذف الدور");
      setDeleteTarget(null);
      fetchRoles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="الأدوار والصلاحيات" createLabel={canManage ? "دور جديد" : undefined} createTo={canManage ? "/roles/new" : undefined} />
      <DataTable
        columns={[
          { key: "name", label: "الاسم" },
          { key: "description", label: "الوصف", render: r => r.description || "—" },
          {
            key: "permissionCount",
            label: "عدد الصلاحيات",
            render: r => <Badge variant="secondary">{r.permissionCount}</Badge>,
          },
          {
            key: "createdAt",
            label: "تاريخ الإنشاء",
            render: r => new Date(r.createdAt).toLocaleString("ar-SY"),
          },
        ]}
        data={roles}
        loading={loading}
        onEdit={canManage ? r => navigate(`/roles/${r.id}`) : undefined}
        onDelete={canManage ? r => setDeleteTarget(r) : undefined}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="حذف الدور"
        description={deleteTarget ? `حذف «${deleteTarget.name}»؟ لا يمكن حذف أدوار النظام أو أدوار مرتبطة بمستخدمين.` : undefined}
      />
    </div>
  );
}
