import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  public languages: string[] = ['es', 'en', 'de'];
  public defaultLanguage = 'es'; // Spanish as default

  constructor(public translate: TranslateService) {
    let selectedLang: string;
    translate.addLangs(this.languages);
    translate.setDefaultLang(this.defaultLanguage);

    if (localStorage.getItem('lang')) {
      selectedLang = localStorage.getItem('lang') as string;
    } else {
      // Default to Spanish if no preference is set
      selectedLang = this.defaultLanguage;
      localStorage.setItem('lang', this.defaultLanguage);
    }
    translate.use(selectedLang.match(/en|es|de/) ? selectedLang : this.defaultLanguage);
  }

  public setLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }
}
