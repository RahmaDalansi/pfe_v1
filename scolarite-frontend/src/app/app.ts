// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { KeycloakAuthService } from './services/keycloak.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" routerLink="/">
          <i class="bi bi-mortarboard"></i> Scolarité PFE
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- Menu gauche selon le rôle -->
          @if (isLoggedIn) {
            <ul class="navbar-nav me-auto">
              <!-- Dashboard selon rôle -->
              @if (userRole === 'ADMIN') {
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/dashboard" routerLinkActive="active">
                    <i class="bi bi-speedometer2"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/validation" routerLinkActive="active">
                    <i class="bi bi-person-check"></i> Validation
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/import" routerLinkActive="active">
                    <i class="bi bi-file-spreadsheet"></i> Import
                  </a>
                </li>
              }
              
              @if (userRole === 'STUDENT' || userRole === 'PROFESSOR') {
                <li class="nav-item">
                  <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
                    <i class="bi bi-speedometer2"></i> Dashboard
                  </a>
                </li>
              }
            </ul>
          }

          <!-- Menu droite avec dropdown utilisateur -->
          <ul class="navbar-nav">
            @if (isLoggedIn) {
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                  <i class="bi bi-person-circle"></i> {{ username }}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <a class="dropdown-item" routerLink="/profile">
                      <i class="bi bi-person-vcard"></i> Mon Profil
                    </a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item text-danger" href="#" (click)="logout($event)">
                      <i class="bi bi-box-arrow-right"></i> Déconnexion
                    </a>
                  </li>
                </ul>
              </li>
            } @else {
              <li class="nav-item">
                <a class="nav-link" routerLink="/register">
                  <i class="bi bi-person-plus"></i> Inscription
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link btn btn-outline-light ms-2" href="/login">
                  <i class="bi bi-box-arrow-in-right"></i> Connexion
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
    
    <router-outlet></router-outlet>
  `,
  styles: [`
    .dropdown-menu {
      min-width: 200px;
    }
    .dropdown-item i {
      margin-right: 8px;
    }
    .navbar-brand i {
      margin-right: 8px;
      color: #ffc107;
    }
  `]
})
export class App implements OnInit {
  isLoggedIn = false;
  username = '';
  userRole = '';

  constructor(private keycloakService: KeycloakAuthService) {}

  ngOnInit() {
    this.updateUserInfo();
    
    // Optionnel: rafraîchir périodiquement
    setInterval(() => this.updateUserInfo(), 2000);
  }

  updateUserInfo() {
    this.isLoggedIn = this.keycloakService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.keycloakService.getUsername();
      this.userRole = this.keycloakService.getUserRole();
    }
  }

  logout(event: Event) {
    event.preventDefault();
    this.keycloakService.logout();
  }
}