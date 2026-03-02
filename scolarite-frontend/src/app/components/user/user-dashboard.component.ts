import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakAuthService } from '../../services/keycloak.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h3>Bienvenue, {{ username }}</h3>
        </div>
        <div class="card-body">
          @if (requiresPasswordChange) {
            <div class="alert alert-warning">
              <h5>⚠️ Action requise</h5>
              <p>Vous devez changer votre mot de passe avant de continuer.</p>
              <button class="btn btn-warning" (click)="changePassword()">
                Changer le mot de passe
              </button>
            </div>
          }

          @if (!requiresPasswordChange) {
            <div>
              <h4>Tableau de bord</h4>
              <p>Bienvenue dans votre espace personnel.</p>
              
              <div class="row mt-4">
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-body">
                      <h5>Mes cours</h5>
                      <p>Consultez vos cours</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-body">
                      <h5>Notes</h5>
                      <p>Voir vos notes</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-body">
                      <h5>Emploi du temps</h5>
                      <p>Planning des cours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        <div class="card-footer">
          <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
        </div>
      </div>
    </div>
  `
})
export class UserDashboardComponent implements OnInit {
  username = '';
  requiresPasswordChange = false;

  constructor(private keycloakService: KeycloakAuthService) {}

  ngOnInit() {
    this.username = this.keycloakService.getUsername();
    this.requiresPasswordChange = this.keycloakService.hasRequiredAction();
  }

  changePassword() {
    window.location.href = 'http://localhost:8081/realms/scolarite-realm/account/password';
  }

  logout() {
    this.keycloakService.logout();
  }
}