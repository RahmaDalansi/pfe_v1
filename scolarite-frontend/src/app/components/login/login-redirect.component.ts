import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Redirection vers Keycloak...</span>
      </div>
      <p class="mt-3">Redirection vers la page de connexion...</p>
    </div>
  `
})
export class LoginRedirectComponent implements OnInit {
  
  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      await this.keycloakService.login({
        redirectUri: window.location.origin + '/dashboard'
      });
    } catch (error) {
      console.error('Login failed', error);
      this.router.navigate(['/']);
    }
  }
}