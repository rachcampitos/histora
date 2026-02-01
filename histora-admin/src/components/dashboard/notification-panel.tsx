'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notification-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  CreditCard,
  Info,
  X,
} from 'lucide-react';

const notificationIcons = {
  verification: CheckCircle,
  service: Bell,
  payment: CreditCard,
  alert: AlertTriangle,
} as const;

const priorityColors = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-yellow-500 bg-yellow-500/5',
  low: 'border-l-muted',
} as const;

export function NotificationPanel() {
  const router = useRouter();
  const {
    notifications,
    isOpen,
    setOpen,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotificationStore();

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como leidas
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No hay notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Info;
                const priorityClass = priorityColors[notification.priority];

                return (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full rounded-lg border-l-4 p-4 text-left transition-colors hover:bg-accent',
                      priorityClass,
                      !notification.isRead && 'bg-accent/50'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          notification.priority === 'high'
                            ? 'bg-destructive/10 text-destructive'
                            : notification.priority === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p
                          className={cn(
                            'text-sm',
                            !notification.isRead && 'font-medium'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
