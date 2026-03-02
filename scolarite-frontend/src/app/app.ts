import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { KeycloakAuthService } from './services/keycloak.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet], // Removed RouterLink since we're not using it
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">Scolarité PFE</a>
        <div class="navbar-nav ms-auto">
          @if (isLoggedIn) {
            <span class="nav-link text-light">
              Connecté en tant que: {{ username }}
            </span>
            <button class="btn btn-outline-light" (click)="logout()">
              Déconnexion
            </button>
          } @else {
            <button class="btn btn-outline-light" (click)="login()">
              Connexion
            </button>
          }
        </div>
      </div>
    </nav>
    
    <router-outlet></router-outlet>
  `
})
export class App implements OnInit {
  title = 'scolarite-frontend';
  isLoggedIn = false;
  username = '';

  constructor(private keycloakService: KeycloakAuthService) {}

  async ngOnInit() {
    this.isLoggedIn = this.keycloakService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.keycloakService.getUsername();
    }
  }

  login() {
    window.location.href = '/login';
  }

  logout() {
    this.keycloakService.logout();
  }
}