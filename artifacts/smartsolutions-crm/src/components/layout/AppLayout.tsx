import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, GitBranch, Package, 
  FileText, Bell, Settings, LogOut, Menu, X 
} from "lucide-react";
import { useListFollowups } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();

  const { data: followups } = useListFollowups({ status: "pendente" });
  const pendingCount = followups?.length || 0;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/pipeline", label: "Pipeline", icon: GitBranch },
    { href: "/catalogo", label: "Catálogo", icon: Package },
    { href: "/propostas", label: "Propostas", icon: FileText },
    { href: "/followups", label: "Follow-ups", icon: Bell, badge: pendingCount },
    { href: "/definicoes", label: "Definições", icon: Settings },
  ];

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Utilizador"
    : "Utilizador";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center px-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient">SmartSolutions</h1>
          <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase mt-0.5">CRM Comercial</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "text-primary-foreground bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive && (
                <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 rounded-xl p-3 bg-secondary/50 border border-border/50">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-inner text-sm">
              {initials}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Terminar sessão"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border/50 bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-md px-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-gradient">SmartSolutions</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground bg-secondary rounded-lg"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
