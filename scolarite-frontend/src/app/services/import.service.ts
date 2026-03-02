import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakAuthService } from './keycloak.service';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private apiUrl = 'http://localhost:8082/api'; // Your Spring Boot backend URL

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakAuthService
  ) {}

  async importStudents(file: File): Promise<Observable<HttpEvent<any>>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await this.keycloakService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post(`${this.apiUrl}/admin/import/students`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  async importProfessors(file: File): Promise<Observable<HttpEvent<any>>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await this.keycloakService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post(`${this.apiUrl}/admin/import/professors`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }
}