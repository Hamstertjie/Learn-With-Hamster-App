import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from './currency.service';

/**
 * Formats a USD integer price using the user's detected locale and live exchange rates.
 * Pure: false so it re-renders when the rate signal updates after async fetch.
 * Usage: {{ course.coursePrice | localCurrency }}
 */
@Pipe({
  name: 'localCurrency',
  pure: false,
  standalone: true,
})
export class CurrencyLocalePipe implements PipeTransform {
  private readonly currencyService = inject(CurrencyService);

  transform(value: number | null | undefined): string {
    if (value == null || value <= 0) return 'Free';
    return this.currencyService.formatPrice(value);
  }
}
