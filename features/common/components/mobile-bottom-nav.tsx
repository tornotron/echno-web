'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  UserCheck,
  MessagesSquare,
  FolderKanban,
  LayoutGrid,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const PRIMARY_TABS = [
  { label: 'Home', href: '/users/dashboard', icon: Home },
  { label: 'Attendance', href: '/users/dashboard/attendance', icon: UserCheck },
  { label: 'Chat', href: '/users/dashboard/chat', icon: MessagesSquare },
  { label: 'Projects', href: '/users/dashboard/projects', icon: FolderKanban },
] as const;

function isActive(href: string, pathname: string) {
  if (href === '/users/dashboard') return pathname === href;
  return pathname.startsWith(href);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-50 lg:hidden"
      aria-label="Mobile navigation"
    >
      {/* Frosted glass bar */}
      <div className="border-t border-stone-200/80 bg-white/95 backdrop-blur-md dark:border-white/8 dark:bg-zinc-950/95">
        <div className="pb-safe mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {PRIMARY_TABS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={label}
                href={href}
                className="flex min-w-[56px] flex-1 flex-col items-center gap-1 py-2 transition-colors duration-150"
                aria-current={active ? 'page' : undefined}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-indigo-100 dark:bg-indigo-500/15'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      active
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                </div>
                <span
                  className={`text-[10px] leading-none font-medium transition-colors duration-200 ${
                    active
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More — opens full sidebar */}
          <button
            onClick={toggleSidebar}
            className="flex min-w-[56px] flex-1 flex-col items-center gap-1 py-2 transition-colors duration-150"
            aria-label="Open full menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-transparent transition-all duration-200 active:bg-zinc-100 dark:active:bg-zinc-800">
              <LayoutGrid
                className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
                strokeWidth={1.75}
              />
            </div>
            <span className="text-[10px] leading-none font-medium text-zinc-400 dark:text-zinc-500">
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
