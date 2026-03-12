import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakAuthService } from '../../services/keycloak.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-header bg-warning text-dark">
              <h4 class="mb-0">Compte en attente de validation</h4>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="bi bi-hourglass-split text-warning" style="font-size: 5rem;"></i>
              </div>
              
              <h5>Bonjour {{ username }},</h5>
              
              <p class="mt-3">
                Votre compte a été créé avec succès et est actuellement en attente 
                de validation par un administrateur.
              </p>
              
              <div class="alert alert-info mt-4">
                <strong>Prochaines étapes :</strong>
                <ul class="text-start mt-2">
                  <li>Un administrateur examinera votre demande</li>
                  <li>Vous recevrez un email de confirmation</li>
                  <li>Une fois validé, vous pourrez vous connecter normalement</li>
                </ul>
              </div>
              
              <p class="text-muted small mt-4">
                Si vous avez des questions, veuillez contacter l'administration.
              </p>
              
              <button class="btn btn-outline-primary mt-3" (click)="checkStatus()">
                Vérifier le statut
              </button>
              
              <button class="btn btn-outline-danger mt-3 ms-2" (click)="logout()">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PendingComponent implements OnInit {
  username = '';

  constructor(
    private keycloakService: KeycloakAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.username = this.keycloakService.getUsername();
  }

  checkStatus() {
    // Forcer une vérification du statut
    const roles = this.keycloakService.getUserRoles();
    if (!roles.includes('PENDING')) {
      this.router.navigate(['/dashboard']);
    }
  }

  logout() {
    this.keycloakService.logout();
  }
}