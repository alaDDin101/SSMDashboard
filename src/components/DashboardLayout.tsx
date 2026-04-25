import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
const LOGO_URL = "/logo.jpeg";
import {
  LayoutDashboard, Image, FolderOpen, FileText, Share2, MessageSquare, LogOut, Menu, X, Users, Shield, Info, Network, Sparkles, UserPlus,
} from "lucide-react";
import { useState } from "react";

const navItems: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm: string | null;
  permAny?: string[];
}[] = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard, perm: null },
  { to: "/slider", label: "السلايدر", icon: Image, perm: "slider.manage" },
  { to: "/categories", label: "التصنيفات", icon: FolderOpen, perm: "categories.manage" },
  { to: "/articles", label: "المقالات", icon: FileText, perm: "articles.manage" },
  { to: "/social", label: "الروابط الاجتماعية", icon: Share2, perm: "social.manage" },
  { to: "/about", label: "من نحن", icon: Info, perm: "about.manage" },
  { to: "/organization", label: "الهيكل التنظيمي", icon: Network, perm: "organization.manage" },
  { to: "/projects", label: "المشاريع والمبادرات", icon: Sparkles, perm: "projects.manage" },
  { to: "/comments", label: "التعليقات", icon: MessageSquare, perm: "comments.moderate" },
  { to: "/users", label: "المستخدمون", icon: Users, perm: "users.manage" },
  { to: "/membership-requests", label: "طلبات الانضمام", icon: UserPlus, perm: "users.manage" },
  { to: "/roles", label: "الأدوار والصلاحيات", icon: Shield, perm: null, permAny: ["users.manage", "roles.manage"] },
];

export default function DashboardLayout() {
  const { hasPermission, logout, userEmail } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNav = navItems.filter(item => {
    if (item.permAny?.length) return item.permAny.some(p => hasPermission(p));
    if (!item.perm) return true;
    return hasPermission(item.perm);
  });

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-hover">
        <img src={LOGO_URL} alt="الشعار" className="w-12 h-12 rounded-full object-cover" />
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-sidebar-fg truncate">حركة أبناء سوريا</h1>
          <p className="text-xs text-sidebar-fg/60">لوحة التحكم</p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {filteredNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-sidebar-fg hover:bg-sidebar-hover"
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-hover">
        {userEmail && (
          <p className="text-xs text-sidebar-fg/60 mb-2 truncate">{userEmail}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-sidebar-fg hover:bg-sidebar-hover transition-colors"
        >
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar-bg fixed inset-y-0 right-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-64 bg-sidebar-bg flex flex-col z-50">
            <button onClick={() => setMobileOpen(false)} className="absolute left-3 top-3 text-sidebar-fg">
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:mr-64">
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu size={22} />
          </button>
          <img src={LOGO_URL} alt="" className="w-8 h-8 rounded-full" />
          <span className="font-semibold text-sm">لوحة التحكم</span>
        </header>
        <div className="p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
