"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  PlusCircle,
  LayoutDashboard,
  Receipt,
  Tag,
  Wallet,
  Shield,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/", label: "Nova", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: Receipt },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/backup", label: "Backup", icon: Shield },
];

export function Nav() {
  const pathname = usePathname();
  const { user, signOut, isConfigured } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const showNavLinks = !isConfigured || !!user;

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-slate-700/50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[min(100%,56rem)] tablet:max-w-[min(100%,56rem)] lg:max-w-[min(100%,72rem)] ipad:max-w-[min(100%,min(78rem,calc(100vw-1.5rem)))] mx-auto px-4 tablet:px-6 lg:px-8 ipad:px-8 py-3 phone:py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {showNavLinks && (
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="tablet:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-slate-200 active:bg-slate-800/50 transition-colors"
                  aria-label="Abrir menu"
                >
                  <Menu size={24} />
                </button>
              )}
              <span className="text-brand-500 font-bold text-lg shrink-0">Finanças</span>
              {showNavLinks && (
                <ul className="hidden tablet:flex items-center gap-1 ml-2 tablet:ml-4 flex-wrap">
                  {links.map(({ href, label, icon: Icon }) => {
                    const isActive =
                      pathname === href ||
                      (href !== "/" && pathname.startsWith(href));
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={`flex items-center gap-2 px-2 tablet:px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                            isActive
                              ? "bg-brand-500/20 text-brand-400"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                        >
                          <Icon size={18} className="shrink-0" />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  <span
                    className="text-xs text-slate-500 truncate max-w-[100px] hidden sm:block"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 active:bg-slate-800/70 text-sm border border-slate-600/50"
                    title="Sair da conta"
                  >
                    <LogOut size={18} className="shrink-0" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 active:bg-slate-800/50 text-sm shrink-0"
                  >
                    Criar conta
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 active:bg-brand-500/40 text-sm font-medium shrink-0"
                  >
                    <LogIn size={18} />
                    Entrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Menu overlay - só renderiza se há links */}
      {showNavLinks && menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm tablet:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
      {showNavLinks && (
      <div
        className={`fixed top-0 left-0 z-[70] flex h-[100dvh] min-h-[100dvh] w-[min(280px,min(85vw,calc(100vw-env(safe-area-inset-left,0px)-0.5rem)))] max-w-[280px] flex-col bg-slate-900 border-r border-slate-700/50 shadow-xl transition-transform duration-200 ease-out pt-[env(safe-area-inset-top)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left,0px)] tablet:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <span className="text-brand-500 font-bold text-lg">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-slate-200 active:bg-slate-800/50"
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
          <ul className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-colors min-h-[48px] ${
                      isActive
                        ? "bg-brand-500/20 text-brand-400"
                        : "text-slate-300 hover:bg-slate-800/50 active:bg-slate-800"
                    }`}
                  >
                    <Icon size={22} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
            {user && (
              <li className="pt-2 mt-2 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => { closeMenu(); signOut(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 active:bg-slate-800 min-h-[48px]"
                >
                  <LogOut size={22} className="shrink-0" />
                  Sair da conta
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
      )}
    </>
  );
}
