import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { api } from "@/lib/api";
import type { MembershipJoinRequestListItemDto, PagedResult } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PAGE_SIZE = 20;
type MembershipRow = MembershipJoinRequestListItemDto & { id: string };

export default function MembershipRequestsPage() {
  const [result, setResult] = useState<PagedResult<MembershipJoinRequestListItemDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MembershipJoinRequestListItemDto | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<PagedResult<MembershipJoinRequestListItemDto>>("/membership-requests", {
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search: searchApplied,
      });
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchApplied]);

  const act = async (userId: string, action: "approve" | "reject") => {
    setBusyUserId(userId);
    try {
      await api.post<void>(`/membership-requests/${userId}/${action}`);
      toast.success(action === "approve" ? "تمت الموافقة على الطلب" : "تم رفض الطلب");
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تنفيذ العملية");
    } finally {
      setBusyUserId(null);
    }
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / result.pageSize)) : 1;
  const rows: MembershipRow[] = (result?.items ?? []).map((x) => ({ ...x, id: x.userId }));

  const boolLabel = (v: boolean) => (v ? "نعم" : "لا");

  const details: Array<{ label: string; value: string }> = selected
    ? [
        { label: "الاسم الكامل", value: `${selected.firstName} ${selected.fatherName} ${selected.lastName}` },
        { label: "تاريخ الميلاد", value: selected.birthDate },
        { label: "الجنس", value: selected.gender },
        { label: "البريد الإلكتروني", value: selected.email },
        { label: "رقم الهاتف", value: selected.phoneNumber },
        { label: "المدينة", value: selected.city },
        { label: "العنوان", value: selected.address || "—" },
        { label: "طريقة التواصل المفضلة", value: selected.preferredContactMethod },
        { label: "المستوى التعليمي", value: selected.educationLevel },
        { label: "الاختصاص", value: selected.specialization },
        { label: "المهنة الحالية", value: selected.currentProfession },
        { label: "جهة العمل", value: selected.employer || "—" },
        { label: "سبب الانضمام", value: selected.joinReason },
        { label: "انتماء سياسي سابق", value: boolLabel(selected.previouslyAffiliated) },
        { label: "تفاصيل الانتماء السابق", value: selected.previousAffiliationDetails || "—" },
        { label: "مجالات المشاركة", value: selected.participationAreas },
        { label: "القضايا محل الاهتمام", value: selected.focusIssues },
        { label: "المهارات", value: selected.skills },
        { label: "الخبرات السابقة", value: selected.previousExperiences || "—" },
        { label: "اللغات", value: selected.languages },
        { label: "عدد ساعات التطوع أسبوعياً", value: selected.weeklyVolunteerHours },
        { label: "الجاهزية للعمل الميداني", value: boolLabel(selected.fieldWorkReady) },
        { label: "القدرة على التنقل/السفر", value: selected.mobilityTravelAbility },
        { label: "الالتزام بالمبادئ", value: boolLabel(selected.commitToPrinciples) },
        { label: "الإقرار بصحة المعلومات", value: boolLabel(selected.infoIsAccurate) },
        { label: "الموافقة على سياسة الخصوصية", value: boolLabel(selected.acceptPrivacyPolicy) },
        { label: "تاريخ الطلب", value: new Date(selected.requestedAt).toLocaleString("ar-SY") },
      ]
    : [];

  return (
    <div>
      <PageHeader title="طلبات الانضمام" />
      <p className="text-sm text-muted-foreground mb-4">مراجعة طلبات الانتساب للحركة والموافقة عليها أو رفضها.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearchApplied(search.trim());
        }}
        className="mb-6 flex gap-3"
      >
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الهاتف" />
        <Button type="submit" variant="secondary">بحث</Button>
      </form>

      <DataTable
        data={rows}
        loading={loading}
        columns={[
          { key: "fullName", label: "الاسم", render: (x) => `${x.firstName} ${x.fatherName} ${x.lastName}` },
          { key: "email", label: "البريد", render: (x) => <span dir="ltr">{x.email}</span> },
          { key: "phoneNumber", label: "الهاتف", render: (x) => <span dir="ltr">{x.phoneNumber}</span> },
          { key: "city", label: "المدينة" },
          { key: "fieldWorkReady", label: "ميداني", render: (x) => (x.fieldWorkReady ? "نعم" : "لا") },
          { key: "requestedAt", label: "تاريخ الطلب", render: (x) => new Date(x.requestedAt).toLocaleString("ar-SY") },
          {
            key: "joinReason",
            label: "سبب الانضمام",
            render: (x) => <span className="line-clamp-2 max-w-[26rem]">{x.joinReason}</span>,
          },
          {
            key: "actions",
            label: "إجراءات",
            render: (x) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(x)}
                >
                  عرض التفاصيل
                </Button>
                <Button
                  size="sm"
                  onClick={() => act(x.userId, "approve")}
                  disabled={busyUserId === x.userId}
                >
                  موافقة
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => act(x.userId, "reject")}
                  disabled={busyUserId === x.userId}
                >
                  رفض
                </Button>
              </div>
            ),
          },
        ]}
      />

      {result && result.totalCount > 0 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            صفحة {result.page} من {totalPages} — إجمالي {result.totalCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              السابق
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              التالي
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الانضمام</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {details.map((item) => (
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
