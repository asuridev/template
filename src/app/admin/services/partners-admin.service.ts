import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PartnerConfig } from '../../config/interfaces/partner-config.interface';

@Injectable({ providedIn: 'root' })
export class PartnersAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/partners`;

  getAll(): Observable<PartnerConfig[]> {
    return this.http.get<PartnerConfig[]>(this.base);
  }

  getOne(id: string): Observable<PartnerConfig> {
    return this.http.get<PartnerConfig>(`${this.base}/${id}`);
  }

  /** multipart/form-data — branding fields + files + configJson file */
  create(formData: FormData): Observable<PartnerConfig> {
    return this.http.post<PartnerConfig>(this.base, formData);
  }

  /** multipart/form-data — same structure as create, all fields optional */
  update(id: string, formData: FormData): Observable<PartnerConfig> {
    return this.http.put<PartnerConfig>(`${this.base}/${id}`, formData);
  }

  patchStatus(id: string, isActive: boolean): Observable<PartnerConfig> {
    return this.http.patch<PartnerConfig>(`${this.base}/${id}/status`, { isActive });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getHistory(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/${id}/history`);
  }

  getConfigTemplate(): Observable<Partial<PartnerConfig>> {
    return this.http.get<Partial<PartnerConfig>>(`${this.base}/config-template`);
  }
}
