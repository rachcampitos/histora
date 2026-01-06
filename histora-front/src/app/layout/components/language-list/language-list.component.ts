import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FeatherIconsComponent } from '@shared/components/feather-icons/feather-icons.component';
import { NgScrollbar } from 'ngx-scrollbar';

export interface LanguageItem {
  text: string;
  flag: string;
  lang: string;
}

@Component({
  selector: 'app-language-list',
  templateUrl: './language-list.component.html',
  styleUrls: ['./language-list.component.scss'],
  imports: [MatMenuModule, CommonModule, MatButtonModule],
})
export class LanguageListComponent {
  @Input() flagvalue?: string | string[];
  @Input() defaultFlag?: string;
  @Input() listLang: LanguageItem[] = [];
  @Input() langStoreValue?: string;

  @Output() languageSelected = new EventEmitter<LanguageItem>();

  setLanguage(item: LanguageItem) {
    this.languageSelected.emit(item);
  }
}
