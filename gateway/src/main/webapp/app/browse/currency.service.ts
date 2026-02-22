import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const LOCALE_CURRENCY_MAP: Record<string, string> = {
  // Americas
  'en-US': 'USD',
  'en-CA': 'CAD',
  'fr-CA': 'CAD',
  'pt-BR': 'BRL',
  'es-MX': 'MXN',
  'es-AR': 'ARS',
  'es-CL': 'CLP',
  'es-CO': 'COP',
  'es-PE': 'PEN',
  // Europe — Euro zone
  'fr-FR': 'EUR',
  'de-DE': 'EUR',
  'es-ES': 'EUR',
  'it-IT': 'EUR',
  'pt-PT': 'EUR',
  'nl-NL': 'EUR',
  'nl-BE': 'EUR',
  'fr-BE': 'EUR',
  'de-AT': 'EUR',
  'fi-FI': 'EUR',
  'el-GR': 'EUR',
  'sk-SK': 'EUR',
  'sl-SI': 'EUR',
  'et-EE': 'EUR',
  'lv-LV': 'EUR',
  'lt-LT': 'EUR',
  'mt-MT': 'EUR',
  'fr-LU': 'EUR',
  // Europe — non-Euro
  'en-GB': 'GBP',
  'sv-SE': 'SEK',
  'da-DK': 'DKK',
  'nb-NO': 'NOK',
  'nn-NO': 'NOK',
  'pl-PL': 'PLN',
  'cs-CZ': 'CZK',
  'hu-HU': 'HUF',
  'ro-RO': 'RON',
  'bg-BG': 'BGN',
  'fr-CH': 'CHF',
  'de-CH': 'CHF',
  'it-CH': 'CHF',
  'uk-UA': 'UAH',
  'ru-RU': 'RUB',
  'tr-TR': 'TRY',
  'kk-KZ': 'KZT',
  // Asia-Pacific
  'en-AU': 'AUD',
  'en-NZ': 'NZD',
  'ja-JP': 'JPY',
  'zh-CN': 'CNY',
  'zh-TW': 'TWD',
  'zh-HK': 'HKD',
  'ko-KR': 'KRW',
  'hi-IN': 'INR',
  'th-TH': 'THB',
  'id-ID': 'IDR',
  'ms-MY': 'MYR',
  'vi-VN': 'VND',
  'fil-PH': 'PHP',
  'en-SG': 'SGD',
  'en-IN': 'INR',
  'en-PH': 'PHP',
  // Middle East & Africa
  'ar-SA': 'SAR',
  'ar-AE': 'AED',
  'ar-ly': 'LYD',
  'ar-EG': 'EGP',
  'ar-MA': 'MAD',
  'he-IL': 'ILS',
  'en-ZA': 'ZAR',
  'en-NG': 'NGN',
  'sw-KE': 'KES',
  'fr-MA': 'MAD',
};

interface ExchangeRateCache {
  rates: Record<string, number>;
  lastFetched: number;
}

const CACHE_KEY = 'lw-exchange-rates';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  readonly isReady = signal(false);

  private readonly locale: string;
  private readonly currency: string;
  private readonly _rate = signal(1);

  constructor(private readonly http: HttpClient) {
    this.locale = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';
    this.currency = this.detectCurrency();
    this.loadRates();
  }

  private detectCurrency(): string {
    const exact = LOCALE_CURRENCY_MAP[this.locale];
    if (exact) return exact;
    // Fall back to language-prefix match (e.g. "fr" → first "fr-*" entry)
    const lang = this.locale.split('-')[0];
    const entry = Object.entries(LOCALE_CURRENCY_MAP).find(([key]) => key.startsWith(lang + '-'));
    return entry?.[1] ?? 'USD';
  }

  private loadRates(): void {
    if (this.currency === 'USD') {
      this._rate.set(1);
      this.isReady.set(true);
      return;
    }

    // Try cache first
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: ExchangeRateCache = JSON.parse(raw);
        if (Date.now() - cached.lastFetched < CACHE_TTL_MS && cached.rates[this.currency]) {
          this._rate.set(cached.rates[this.currency]);
          this.isReady.set(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Fetch live rates (free, no key required)
    this.http.get<{ rates: Record<string, number> }>('https://open.er-api.com/v6/latest/USD').subscribe({
      next: data => {
        const rates = data.rates ?? {};
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, lastFetched: Date.now() } satisfies ExchangeRateCache));
        } catch {
          // storage quota exceeded — ignore
        }
        this._rate.set(rates[this.currency] ?? 1);
        this.isReady.set(true);
      },
      error: () => {
        // Graceful degradation: show USD
        this._rate.set(1);
        this.isReady.set(true);
      },
    });
  }

  /** Converts a USD amount and formats it using the detected locale currency. */
  formatPrice(usdAmount: number): string {
    const converted = usdAmount * this._rate();
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  }
}
