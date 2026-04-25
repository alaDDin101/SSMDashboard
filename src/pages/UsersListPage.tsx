import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { PagedResult, RoleListItemDto, UserListItemDto } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function UsersListPage() {
  const [result, setResult] = useState<PagedResult<UserListItemDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [roles, setRoles] = useState<RoleListItemDto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<RoleListItemDto[]>("/roles").then(setRoles).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        pageSize: String(PAGE_SIZE),
      };
      if (searchApplied.trim()) params.search = searchApplied.trim();
      if (roleId) params.roleId = roleId;
      const data = await api.get<PagedResult<UserListItemDto>>("/users", params);
      setResult(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchApplied, roleId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchApplied(search);
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.pageSize)) : 1;

  return (
    <div>
      <PageHeader title="المستخدمون" createLabel="مستخدم جديد" createTo="/users/new" />
      <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end mb-6">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <Label>بحث (بريد أو اسم)</Label>
          <Input value={search} onChange={e => setSearch(e.target.value)} dir="ltr" className="text-left" placeholder="..." />
        </div>
        <div className="space-y-2 w-full sm:w-56">
          <Label>تصفية حسب الدور</Label>
          <Select value={roleId || "__all__"} onValueChange={v => { setPage(1); setRoleId(v === "__all__" ? "" : v); }}>
            <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">كل الأدوار</SelectItem>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="secondary">تطبيق البحث</Button>
      </form>
      <DataTable
        columns={[
          { key: "email", label: "البريد", render: u => <span dir="ltr" className="text-left block">{u.email}</span> },
          { key: "displayName", label: "الاسم" },
          {
            key: "roles",
            label: "الأدوار",
            render: u => (
              <div className="flex flex-wrap gap-1">
                {u.roles.length ? u.roles.map(r => <Badge key={r} variant="outline">{r}</Badge>) : "—"}
              </div>
            ),
          },
          {
            key: "emailConfirmed",
            label: "البريد مؤكد",
            render: u => (u.emailConfirmed ? <Badge variant="secondary">نعم</Badge> : <Badge variant="outline">لا</Badge>),
          },
          {
            key: "lastLoginAt",
            label: "آخر دخول",
            render: u => (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("ar-SY") : "—"),
          },
        ]}
        data={result?.items ?? []}
        loading={loading}
        onEdit={u => navigate(`/users/${u.id}`)}
      />
      {result && result.totalCount > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            عرض {result.items.length} من {result.totalCount} — صفحة {result.page} من {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              السابق
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
