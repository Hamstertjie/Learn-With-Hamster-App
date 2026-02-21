import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthServerProvider } from 'app/core/auth/auth-jwt.service';
import { StateStorageService } from './state-storage.service';

describe('Auth JWT', () => {
  let service: AuthServerProvider;
  let httpMock: HttpTestingController;
  let mockStorageService: StateStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    mockStorageService = TestBed.inject(StateStorageService);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthServerProvider);
  });

  describe('Get Token', () => {
    it('should return empty token since HttpOnly cookie auth is used', () => {
      const result = service.getToken();
      expect(result).toEqual('');
    });
  });

  describe('Login', () => {
    it('should post credentials with withCredentials and complete', () => {
      // WHEN
      let completed = false;
      service.login({ username: 'John', password: '123', rememberMe: true }).subscribe({
        complete: () => (completed = true),
      });
      httpMock.expectOne('api/authenticate').flush({ id_token: '1' });

      // THEN
      httpMock.verify();
      expect(completed).toBe(true);
    });

    it('should post credentials when rememberMe is false', () => {
      // WHEN
      let completed = false;
      service.login({ username: 'John', password: '123', rememberMe: false }).subscribe({
        complete: () => (completed = true),
      });
      const req = httpMock.expectOne('api/authenticate');
      expect(req.request.body).toEqual({ username: 'John', password: '123', rememberMe: false });
      req.flush({ id_token: '1' });

      // THEN
      httpMock.verify();
      expect(completed).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should clear storage', () => {
      // GIVEN
      mockStorageService.clearAuthenticationToken = jest.fn();

      // WHEN
      service.logout().subscribe();

      // THEN
      expect(mockStorageService.clearAuthenticationToken).toHaveBeenCalled();
    });
  });
});
