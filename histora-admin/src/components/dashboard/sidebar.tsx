'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';
import { navItems } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/nurselite.png"
              alt="NurseLite"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground leading-tight">NurseLite</span>
              <span className="text-[10px] text-muted-foreground">Admin Panel</span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Image
              src="/nurselite.png"
              alt="NurseLite"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.title}
                    {item.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]',
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Toggle button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center border-t pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
