import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Login } from 'app/login/login.model';
import { ApplicationConfigService } from '../config/application-config.service';
import { StateStorageService } from './state-storage.service';

type JwtToken = {
  id_token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthServerProvider {
  private readonly http = inject(HttpClient);
  private readonly stateStorageService = inject(StateStorageService);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  getToken(): string {
    return '';
  }

  login(credentials: Login): Observable<void> {
    return this.http
      .post<JwtToken>(this.applicationConfigService.getEndpointFor('api/authenticate'), credentials, {
        withCredentials: true,
      })
      .pipe(map(() => {}));
  }

  logout(): Observable<void> {
    this.stateStorageService.clearAuthenticationToken();
    return this.http
      .post<void>(this.applicationConfigService.getEndpointFor('api/logout'), {}, { withCredentials: true })
      .pipe(
        catchError(() => of(undefined)),
      );
  }
}
