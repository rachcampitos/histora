import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { fromEvent, filter } from 'rxjs';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';

@Injectable({
  providedIn: 'root'
})
export class CommandPaletteService {
  private dialog = inject(MatDialog);
  private isOpen = signal(false);

  constructor() {
    this.setupKeyboardShortcut();
  }

  private setupKeyboardShortcut(): void {
    if (typeof window === 'undefined') return;

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(event => {
          // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
          const isCmdK = (event.metaKey || event.ctrlKey) && event.key === 'k';
          // Don't trigger if typing in an input
          const isInput = event.target instanceof HTMLInputElement ||
                         event.target instanceof HTMLTextAreaElement ||
                         (event.target as HTMLElement)?.isContentEditable;
          return isCmdK && !isInput;
        })
      )
      .subscribe(event => {
        event.preventDefault();
        this.toggle();
      });
  }

  open(): void {
    if (this.isOpen()) return;

    this.isOpen.set(true);

    const dialogRef = this.dialog.open(CommandPaletteComponent, {
      panelClass: 'command-palette-dialog',
      hasBackdrop: false,
      position: { top: '0', left: '0' },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isOpen.set(false);
    });
  }

  close(): void {
    this.dialog.closeAll();
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  getIsOpen() {
    return this.isOpen();
  }
}
