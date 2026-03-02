import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  
  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const loggedIn = await this.keycloakService.isLoggedIn();
    
    if (!loggedIn) {
      await this.keycloakService.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles) {
      const userRoles = this.keycloakService.getUserRoles();
      console.log('User roles:', userRoles); // Debug log
      
      const hasRole = requiredRoles.some(role => {
        // Check both formats (with and without realm prefix)
        return userRoles.includes(role) || 
               userRoles.includes(`realm:${role}`); 
      });
      
      if (!hasRole) {
        console.log('User missing required role:', requiredRoles);
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  }
}