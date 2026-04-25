import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  extraActions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends { id: string }>({ columns, data, loading, onEdit, onDelete, extraActions }: Props<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>لا توجد بيانات</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key} className="text-right font-semibold">{col.label}</TableHead>
            ))}
            {(onEdit || onDelete || extraActions) && <TableHead className="text-right">إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
              {columns.map(col => (
                <TableCell key={col.key}>
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as string}
                </TableCell>
              ))}
              {(onEdit || onDelete || extraActions) && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {extraActions?.(item)}
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Pencil size={15} />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
