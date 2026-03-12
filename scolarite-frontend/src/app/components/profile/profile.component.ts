// src/app/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakAuthService } from '../../services/keycloak.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">
                <i class="bi bi-person-circle"></i> Mon Profil
              </h4>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <label class="col-sm-4 col-form-label fw-bold">Nom d'utilisateur:</label>
                <div class="col-sm-8">
                  <p class="form-control-plaintext">{{ username }}</p>
                </div>
              </div>
              
              <div class="row mb-3">
                <label class="col-sm-4 col-form-label fw-bold">Email:</label>
                <div class="col-sm-8">
                  <p class="form-control-plaintext">{{ email }}</p>
                </div>
              </div>
              
              <div class="row mb-3">
                <label class="col-sm-4 col-form-label fw-bold">Rôle(s):</label>
                <div class="col-sm-8">
                  @for (role of roles; track role) {
                    <span class="badge bg-info me-2">{{ role }}</span>
                  }
                </div>
              </div>

              <hr>

              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                Pour changer votre mot de passe, utilisez l'interface Keycloak.
              </div>

              <div class="d-grid gap-2">
                <button class="btn btn-primary" (click)="openKeycloakAccount()">
                  <i class="bi bi-box-arrow-up-right"></i> Gérer mon compte Keycloak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  username = '';
  email = '';
  roles: string[] = [];

  constructor(private keycloakService: KeycloakAuthService) {}

  ngOnInit() {
    this.username = this.keycloakService.getUsername();
    this.email = this.keycloakService.getEmail();
    this.roles = this.keycloakService.getUserRoles();
  }

  openKeycloakAccount() {
    window.open('http://localhost:8081/realms/scolarite/account', '_blank');
  }
}