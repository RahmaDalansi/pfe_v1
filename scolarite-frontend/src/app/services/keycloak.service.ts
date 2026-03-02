import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  
  constructor(private keycloak: KeycloakService) {}

  async initKeycloak() {
    try {
      await this.keycloak.init({
        config: {
          url: 'http://localhost:8081', // Your Keycloak URL on port 8081
          realm: 'scolarite', // Your realm name from export
          clientId: 'springboot-app' // Your client ID from export
        },
        initOptions: {
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
          redirectUri: window.location.origin,
          checkLoginIframe: false
        },
        enableBearerInterceptor: true,
        bearerExcludedUrls: ['/assets', '/public']
      });
      console.log('Keycloak initialized successfully with realm: scolarite');
    } catch (error) {
      console.error('Keycloak init failed', error);
    }
  }

  async getToken(): Promise<string> {
    try {
      return await this.keycloak.getToken();
    } catch (error) {
      console.error('Failed to get token', error);
      return '';
    }
  }

  logout(): void {
    this.keycloak.logout(window.location.origin);
  }

  getUsername(): string {
    const tokenParsed = this.keycloak.getKeycloakInstance().tokenParsed;
    return tokenParsed?.['preferred_username'] || tokenParsed?.['email'] || 'User';
  }

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  getUserRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  hasRequiredAction(): boolean {
    const token = this.keycloak.getKeycloakInstance();
    if (token?.tokenParsed) {
      // Check if user has required actions
      const requiredActions = token.tokenParsed['required_actions'] || [];
      return requiredActions.includes('UPDATE_PASSWORD');
    }
    return false;
  }

  // Get user role from token
  getUserRole(): string {
    const roles = this.getUserRoles();
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('PROFESSOR')) return 'PROFESSOR';
    if (roles.includes('STUDENT')) return 'STUDENT';
    return 'USER';
  }
}