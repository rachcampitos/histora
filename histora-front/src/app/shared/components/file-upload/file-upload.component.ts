import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploadComponent,
      multi: true,
    },
  ],
  styleUrls: ['./file-upload.component.scss'],
  imports: [MatButtonModule],
})
export class FileUploadComponent implements ControlValueAccessor {
  onChange!: (file: File | null) => void;
  public file: File | null = null;

  @HostListener('change', ['$event'])
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const file = files && files.item(0);
    if (this.onChange) {
      this.onChange(file);
    }
    this.file = file;
  }

  constructor(private host: ElementRef<HTMLInputElement>) {}

  writeValue(value: null): void {
    // clear file input
    this.host.nativeElement.value = '';
    this.file = null;
  }

  registerOnChange(fn: (file: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    // add code here
  }
}
