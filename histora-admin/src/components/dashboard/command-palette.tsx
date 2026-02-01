'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { navItems } from '@/lib/constants';
import {
  Calculator,
  CheckCircle,
  FileText,
  Moon,
  Plus,
  Search,
  Sun,
  User,
  XCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [search, setSearch] = useState('');

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  // Quick actions
  const quickActions = [
    {
      icon: Plus,
      label: 'Nueva enfermera',
      shortcut: '⌘N',
      action: () => router.push('/enfermeras/nueva'),
    },
    {
      icon: Search,
      label: 'Buscar enfermera por CEP',
      action: () => router.push('/enfermeras?focus=search'),
    },
    {
      icon: CheckCircle,
      label: 'Aprobar verificacion pendiente',
      action: () => router.push('/enfermeras?tab=pending'),
    },
    {
      icon: FileText,
      label: 'Generar reporte financiero',
      action: () => router.push('/finanzas/reportes'),
    },
  ];

  // Theme actions
  const themeActions = [
    {
      icon: Sun,
      label: 'Modo claro',
      action: () => setTheme('light'),
      active: theme === 'light',
    },
    {
      icon: Moon,
      label: 'Modo oscuro',
      action: () => setTheme('dark'),
      active: theme === 'dark',
    },
    {
      icon: Calculator,
      label: 'Tema del sistema',
      action: () => setTheme('system'),
      active: theme === 'system',
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar o ejecutar comando..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <p className="text-muted-foreground">No se encontraron resultados.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Intenta buscar por CEP, DNI, nombre de enfermera o paciente.
            </p>
          </div>
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Acciones rapidas">
          {quickActions.map((action) => (
            <CommandItem
              key={action.label}
              onSelect={() => runCommand(action.action)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
              {action.shortcut && (
                <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px]">
                  {action.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navegacion">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>Ir a {item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Theme */}
        <CommandGroup heading="Tema">
          {themeActions.map((action) => (
            <CommandItem
              key={action.label}
              onSelect={() => runCommand(action.action)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
              {action.active && (
                <CheckCircle className="ml-auto h-4 w-4 text-primary" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Search results would go here when integrated with API */}
        {search.length > 2 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Resultados de busqueda">
              <CommandItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span className="text-muted-foreground">
                  Buscando &quot;{search}&quot;...
                </span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
