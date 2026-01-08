import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  public languages: string[] = ['es', 'en'];
  public defaultLanguage = 'es'; // Spanish as default
  private currentLang: string;

  constructor(public translate: TranslateService) {
    translate.addLangs(this.languages);
    translate.setDefaultLang(this.defaultLanguage);

    // Get stored language or use default
    const storedLang = localStorage.getItem('lang');
    if (storedLang && this.languages.includes(storedLang)) {
      this.currentLang = storedLang;
    } else {
      this.currentLang = this.defaultLanguage;
      localStorage.setItem('lang', this.defaultLanguage);
    }

    // Apply the language
    translate.use(this.currentLang);
  }

  public getCurrentLang(): string {
    return this.currentLang;
  }

  public setLanguage(lang: string) {
    if (this.languages.includes(lang)) {
      this.currentLang = lang;
      this.translate.use(lang);
      localStorage.setItem('lang', lang);
    }
  }
}
