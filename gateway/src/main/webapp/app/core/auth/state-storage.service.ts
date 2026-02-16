import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StateStorageService {
  private readonly previousUrlKey = 'previousUrl';
  private readonly authenticationKey = 'jhi-authenticationToken';
  private readonly localeKey = 'locale';

  storeUrl(url: string): void {
    sessionStorage.setItem(this.previousUrlKey, JSON.stringify(url));
  }

  getUrl(): string | null {
    const previousUrl = sessionStorage.getItem(this.previousUrlKey);
    return previousUrl ? (JSON.parse(previousUrl) as string | null) : previousUrl;
  }

  clearUrl(): void {
    sessionStorage.removeItem(this.previousUrlKey);
  }

  storeAuthenticationToken(_authenticationToken: string, _rememberMe: boolean): void {
    // No-op: JWT is now stored in an HttpOnly cookie by the server
  }

  getAuthenticationToken(): string | null {
    // JWT is in HttpOnly cookie, not accessible from JS
    return null;
  }

  clearAuthenticationToken(): void {
    // Clean up any legacy tokens from localStorage/sessionStorage
    sessionStorage.removeItem(this.authenticationKey);
    localStorage.removeItem(this.authenticationKey);
  }

  storeLocale(locale: string): void {
    sessionStorage.setItem(this.localeKey, locale);
  }

  getLocale(): string | null {
    return sessionStorage.getItem(this.localeKey);
  }

  clearLocale(): void {
    sessionStorage.removeItem(this.localeKey);
  }
}
