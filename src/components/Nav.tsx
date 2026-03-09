"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LayoutDashboard, Receipt, Tag, BarChart3, Wallet, Shield, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/", label: "Nova", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: Receipt },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/backup", label: "Backup", icon: Shield },
];

export function Nav() {
  const pathname = usePathname();
  const { user, signOut, isConfigured } = useAuth();
  const showNavLinks = !isConfigured || !!user;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-brand-500 font-bold text-lg mr-4 shrink-0">
              Finanças
            </span>
            {showNavLinks && (
            <div className="flex gap-1 overflow-x-auto">
              {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                      isActive
                        ? "bg-brand-500/20 text-brand-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isConfigured && (
              user ? (
                <>
                  <span className="text-xs text-slate-500 truncate max-w-[120px]" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm"
                    title="Sair"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm"
                  >
                    Criar conta
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 text-sm"
                  >
                    <LogIn size={16} />
                    Entrar
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
