import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type {
  OrgStructureNodeDto,
  OrgStructureNodeUpsertDto,
  OrganizationalStructureSettingsDto,
  OrganizationalStructureSettingsUpsertDto,
} from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import { ArticleRichEditor } from "@/components/ArticleRichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import { toast } from "sonner";

const KIND_COMMITTEE = 0;
const KIND_POSITION = 1;

function kindLabel(k: number) {
  return k === KIND_COMMITTEE ? "لجنة / إدارة" : "منصب";
}

export default function OrganizationalStructurePage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<OrganizationalStructureSettingsUpsertDto>({
    title: "الهيكل التنظيمي",
    leadText: null,
    introHtml: "",
    isVisible: false,
  });
  const [nodes, setNodes] = useState<OrgStructureNodeDto[]>([]);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgStructureNodeDto | null>(null);
  const [nodeForm, setNodeForm] = useState<OrgStructureNodeUpsertDto>({
    kind: KIND_COMMITTEE,
    name: "",
    description: null,
    holderName: null,
    parentId: null,
    displayOrder: 0,
    isActive: true,
  });
  const [savingNode, setSavingNode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrgStructureNodeDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        api.get<OrganizationalStructureSettingsDto>("/organization/settings"),
        api.get<OrgStructureNodeDto[]>("/organization/nodes"),
      ]);
      setSettingsForm({
        title: s.title,
        leadText: s.leadText,
        introHtml: s.introHtml ?? "",
        isVisible: s.isVisible,
      });
      setNodes(list);
    } catch {
      toast.error("تعذّر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const committees = useMemo(
    () =>
      nodes
        .filter((n) => n.kind === KIND_COMMITTEE)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "ar")),
    [nodes],
  );

  const parentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) {
      if (n.kind === KIND_COMMITTEE) m.set(n.id, n.name);
    }
    return m;
  }, [nodes]);

  const openNewNode = () => {
    setEditingNode(null);
    setNodeForm({
      kind: KIND_COMMITTEE,
      name: "",
      description: null,
      holderName: null,
      parentId: null,
      displayOrder: nodes.length ? Math.max(...nodes.map((n) => n.displayOrder)) + 1 : 0,
      isActive: true,
    });
    setNodeDialogOpen(true);
  };

  const openEditNode = (n: OrgStructureNodeDto) => {
    setEditingNode(n);
    setNodeForm({
      id: n.id,
      kind: n.kind,
      name: n.name,
      description: n.description,
      holderName: n.holderName,
      parentId: n.parentId,
      displayOrder: n.displayOrder,
      isActive: n.isActive,
    });
    setNodeDialogOpen(true);
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsForm.title.trim()) {
      toast.error("أدخل عنوان الصفحة");
      return;
    }
    setSavingSettings(true);
    try {
      await api.put<OrganizationalStructureSettingsDto>("/organization/settings", {
        ...settingsForm,
        title: settingsForm.title.trim(),
        leadText: settingsForm.leadText?.trim() || null,
        introHtml: settingsForm.introHtml?.trim() || null,
      });
      toast.success("تم حفظ إعدادات الصفحة");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveNode = async () => {
    if (!nodeForm.name.trim()) {
      toast.error("أدخل الاسم");
      return;
    }
    if (nodeForm.kind === KIND_COMMITTEE && nodeForm.parentId) {
      toast.error("اللجنة لا يجب أن ترتبط بلجنة أب");
      return;
    }
    setSavingNode(true);
    try {
      const body: OrgStructureNodeUpsertDto = {
        ...nodeForm,
        name: nodeForm.name.trim(),
        description: nodeForm.description?.trim() || null,
        holderName: nodeForm.kind === KIND_POSITION ? nodeForm.holderName?.trim() || null : null,
        parentId: nodeForm.kind === KIND_POSITION ? nodeForm.parentId || null : null,
      };
      await api.post<OrgStructureNodeDto>("/organization/nodes", body);
      toast.success(editingNode ? "تم تحديث العنصر" : "تمت إضافة العنصر");
      setNodeDialogOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSavingNode(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/organization/nodes/${deleteTarget.id}`);
      toast.success("تم الحذف");
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("تعذّر الحذف");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
      <PageHeader title="الهيكل التنظيمي" backTo="/" />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الصفحة</CardTitle>
            <CardDescription>العنوان والمقدمة تظهران في أعلى صفحة «الهيكل التنظيمي» في الموقع عند التفعيل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Switch
                checked={settingsForm.isVisible}
                onCheckedChange={(v) => setSettingsForm((f) => ({ ...f, isVisible: v }))}
              />
              <Label>إظهار الصفحة في الموقع</Label>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>عنوان الصفحة</Label>
              <Input
                value={settingsForm.title}
                onChange={(e) => setSettingsForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>مقدمة قصيرة (اختياري)</Label>
              <Input
                value={settingsForm.leadText || ""}
                onChange={(e) => setSettingsForm((f) => ({ ...f, leadText: e.target.value || null }))}
                placeholder="سطر يظهر تحت العنوان في الموقع…"
              />
            </div>
            <div className="space-y-2">
              <Label>نص تمهيدي (اختياري، HTML)</Label>
              <ArticleRichEditor
                value={settingsForm.introHtml || ""}
                onChange={(html) => setSettingsForm((f) => ({ ...f, introHtml: html }))}
                className="min-h-[280px]"
                placeholder="شرح عام عن الهيكل التنظيمي…"
              />
            </div>
            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? "جاري الحفظ…" : "حفظ الإعدادات"}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div>
            <CardTitle>اللجان والمناصب</CardTitle>
            <CardDescription>
              أضف لجاناً في المستوى الأعلى، ثم مناصباً تابعة لكل لجنة. يمكنك أيضاً إضافة مناصب عامة بلا لجنة أب.
            </CardDescription>
          </div>
          <Button type="button" onClick={openNewNode}>
            إضافة عنصر
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: "kind", label: "النوع", render: (n) => kindLabel(n.kind) },
              { key: "name", label: "الاسم" },
              {
                key: "parent",
                label: "تابع لـ",
                render: (n) =>
                  n.kind === KIND_POSITION && n.parentId ? parentNameById.get(n.parentId) ?? n.parentId : "—",
              },
              {
                key: "holder",
                label: "شاغل المنصب",
                render: (n) => (n.kind === KIND_POSITION ? n.holderName || "—" : "—"),
              },
              { key: "displayOrder", label: "الترتيب" },
              {
                key: "active",
                label: "نشط",
                render: (n) => (n.isActive ? "نعم" : "لا"),
              },
            ]}
            data={nodes}
            loading={false}
            onEdit={openEditNode}
            onDelete={(n) => setDeleteTarget(n)}
          />
        </CardContent>
      </Card>

      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingNode ? "تعديل عنصر" : "عنصر جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select
                value={String(nodeForm.kind)}
                onValueChange={(v) => {
                  const k = Number(v);
                  setNodeForm((f) => ({
                    ...f,
                    kind: k,
                    parentId: k === KIND_COMMITTEE ? null : f.parentId,
                    holderName: k === KIND_COMMITTEE ? null : f.holderName,
                  }));
                }}
                disabled={!!editingNode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(KIND_COMMITTEE)}>لجنة / إدارة</SelectItem>
                  <SelectItem value={String(KIND_POSITION)}>منصب رسمي</SelectItem>
                </SelectContent>
              </Select>
              {editingNode ? <p className="text-xs text-muted-foreground">لا يمكن تغيير نوع العنصر بعد الإنشاء.</p> : null}
            </div>
            <div className="space-y-2">
              <Label>{nodeForm.kind === KIND_COMMITTEE ? "اسم اللجنة أو الإدارة" : "مسمى المنصب"}</Label>
              <Input value={nodeForm.name} onChange={(e) => setNodeForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            {nodeForm.kind === KIND_COMMITTEE ? (
              <div className="space-y-2">
                <Label>وصف (اختياري)</Label>
                <Textarea
                  rows={3}
                  value={nodeForm.description || ""}
                  onChange={(e) => setNodeForm((f) => ({ ...f, description: e.target.value || null }))}
                  placeholder="مهام اللجنة أو نبذة…"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>اللجنة الأم (اختياري)</Label>
                  <Select
                    value={nodeForm.parentId ?? "__root__"}
                    onValueChange={(v) => setNodeForm((f) => ({ ...f, parentId: v === "__root__" ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="منصب عام (بدون لجنة)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">منصب عام (بدون لجنة)</SelectItem>
                      {committees.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اسم الشاغل (اختياري)</Label>
                  <Input
                    value={nodeForm.holderName || ""}
                    onChange={(e) => setNodeForm((f) => ({ ...f, holderName: e.target.value || null }))}
                    placeholder="يظهر في الموقع إن وُجد"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={nodeForm.displayOrder}
                onChange={(e) => setNodeForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={nodeForm.isActive} onCheckedChange={(v) => setNodeForm((f) => ({ ...f, isActive: v }))} />
              <Label>نشط (يظهر في الموقع)</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setNodeDialogOpen(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={() => void handleSaveNode()} disabled={savingNode}>
              {savingNode ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
