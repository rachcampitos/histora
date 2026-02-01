import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  OnDestroy,
  Output,
  ViewChild,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: 'navigation' | 'action' | 'search';
  shortcut?: string;
  action?: () => void;
  route?: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
      ]),
    ]),
  ],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @Output() closed = new EventEmitter<void>();

  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<CommandPaletteComponent>);

  searchQuery = signal('');
  selectedIndex = signal(0);

  allCommands: CommandItem[] = [
    // Navigation
    { id: 'dashboard', label: 'Dashboard', description: 'Ir al panel principal', icon: 'dashboard', category: 'navigation', route: '/admin/dashboard', shortcut: 'G D' },
    { id: 'nurses', label: 'Enfermeras', description: 'Gestionar enfermeras', icon: 'people', category: 'navigation', route: '/admin/nurses', shortcut: 'G N' },
    { id: 'verifications', label: 'Verificaciones CEP', description: 'Verificaciones pendientes', icon: 'verified_user', category: 'navigation', route: '/admin/nurse-verifications', shortcut: 'G V' },
    { id: 'patients', label: 'Pacientes', description: 'Ver pacientes', icon: 'personal_injury', category: 'navigation', route: '/admin/patients', shortcut: 'G P' },
    { id: 'reports', label: 'Reportes', description: 'Analytics y reportes', icon: 'assessment', category: 'navigation', route: '/admin/reports', shortcut: 'G R' },
    { id: 'settings', label: 'Configuracion', description: 'Ajustes del sistema', icon: 'settings', category: 'navigation', route: '/admin/settings', shortcut: 'G S' },

    // Actions
    { id: 'new-nurse', label: 'Nueva enfermera', description: 'Agregar enfermera manualmente', icon: 'person_add', category: 'action' },
    { id: 'export-data', label: 'Exportar datos', description: 'Descargar reporte CSV', icon: 'download', category: 'action' },
    { id: 'refresh', label: 'Actualizar datos', description: 'Recargar informacion', icon: 'refresh', category: 'action' },

    // Search
    { id: 'search-nurse', label: 'Buscar enfermera', description: 'Buscar por nombre o CEP', icon: 'search', category: 'search' },
    { id: 'search-patient', label: 'Buscar paciente', description: 'Buscar por nombre o DNI', icon: 'search', category: 'search' },
  ];

  filteredCommands = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allCommands;

    return this.allCommands.filter(cmd =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.description?.toLowerCase().includes(query) ||
      cmd.category.includes(query)
    );
  });

  groupedCommands = computed(() => {
    const commands = this.filteredCommands();
    const groups: { title: string; items: CommandItem[] }[] = [];

    const navigation = commands.filter(c => c.category === 'navigation');
    const actions = commands.filter(c => c.category === 'action');
    const search = commands.filter(c => c.category === 'search');

    if (navigation.length > 0) groups.push({ title: 'Navegacion', items: navigation });
    if (actions.length > 0) groups.push({ title: 'Acciones', items: actions });
    if (search.length > 0) groups.push({ title: 'Busqueda', items: search });

    return groups;
  });

  ngOnInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const commands = this.filteredCommands();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => Math.min(i + 1, commands.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (commands[this.selectedIndex()]) {
          this.executeCommand(commands[this.selectedIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.selectedIndex.set(0);
  }

  selectCommand(index: number): void {
    this.selectedIndex.set(index);
  }

  executeCommand(command: CommandItem): void {
    if (command.route) {
      this.router.navigate([command.route]);
    } else if (command.action) {
      command.action();
    }
    this.close();
  }

  close(): void {
    this.dialogRef.close();
    this.closed.emit();
  }

  getGlobalIndex(groupIndex: number, itemIndex: number): number {
    const groups = this.groupedCommands();
    let index = 0;
    for (let i = 0; i < groupIndex; i++) {
      index += groups[i].items.length;
    }
    return index + itemIndex;
  }
}
