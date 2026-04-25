import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Image, FolderOpen, FileText, Share2, MessageSquare, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const stats: {
  label: string;
  icon: typeof Image;
  to: string;
  perm?: string;
  permAny?: string[];
  color: string;
}[] = [
  { label: "السلايدر", icon: Image, to: "/slider", perm: "slider.manage", color: "bg-primary/10 text-primary" },
  { label: "التصنيفات", icon: FolderOpen, to: "/categories", perm: "categories.manage", color: "bg-accent/10 text-accent" },
  { label: "المقالات", icon: FileText, to: "/articles", perm: "articles.manage", color: "bg-success/10 text-success" },
  { label: "الروابط الاجتماعية", icon: Share2, to: "/social", perm: "social.manage", color: "bg-warning/10 text-warning" },
  { label: "التعليقات", icon: MessageSquare, to: "/comments", perm: "comments.moderate", color: "bg-destructive/10 text-destructive" },
  { label: "المستخدمون", icon: Users, to: "/users", perm: "users.manage", color: "bg-primary/10 text-primary" },
  { label: "الأدوار والصلاحيات", icon: Shield, to: "/roles", permAny: ["users.manage", "roles.manage"], color: "bg-accent/10 text-accent" },
];

export default function HomePage() {
  const { hasPermission, userEmail } = useAuth();
  const allowed = stats.filter(s => {
    if (s.permAny?.length) return s.permAny.some(p => hasPermission(p));
    if (!s.perm) return false;
    return hasPermission(s.perm);
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <LayoutDashboard size={24} />
          مرحباً بك في لوحة التحكم
        </h1>
        {userEmail && <p className="text-muted-foreground mt-1">{userEmail}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allowed.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow group"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.color} mb-4`}>
              <item.icon size={24} />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</h3>
            <p className="text-sm text-muted-foreground mt-1">إدارة {item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
