import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mt-5">
      <!-- Hero Section -->
      <div class="p-5 mb-4 bg-light rounded-3 text-center">
        <div class="container-fluid py-5">
          <h1 class="display-5 fw-bold">Gestion Scolarité PFE</h1>
          <p class="col-md-8 fs-4 mx-auto">
            Système de gestion des étudiants et professeurs avec authentification sécurisée
          </p>
          <a class="btn btn-primary btn-lg" routerLink="/login" role="button">
            <i class="bi bi-box-arrow-in-right"></i> Se connecter
          </a>
        </div>
      </div>

      <!-- Features Section -->
      <div class="row align-items-md-stretch mt-5">
        <div class="col-md-4">
          <div class="h-100 p-4 bg-white border rounded-3">
            <h2><i class="bi bi-person-badge text-primary"></i> Étudiants</h2>
            <p>Accédez à vos cours, notes et emploi du temps. Suivez votre progression académique en temps réel.</p>
            <ul class="list-unstyled">
              <li><i class="bi bi-check-circle-fill text-success"></i> Consultation des notes</li>
              <li><i class="bi bi-check-circle-fill text-success"></i> Emploi du temps</li>
              <li><i class="bi bi-check-circle-fill text-success"></i> Ressources pédagogiques</li>
            </ul>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="h-100 p-4 bg-white border rounded-3">
            <h2><i class="bi bi-person-video3 text-success"></i> Professeurs</h2>
            <p>Gérez vos cours, notez vos étudiants et communiquez avec votre classe.</p>
            <ul class="list-unstyled">
              <li><i class="bi bi-check-circle-fill text-success"></i> Gestion des notes</li>
              <li><i class="bi bi-check-circle-fill text-success"></i> Suivi des présences</li>
              <li><i class="bi bi-check-circle-fill text-success"></i> Communication</li>
            </ul>
          </div>
        </div>

        <div class="col-md-4">
          <div class="h-100 p-4 bg-white border rounded-3">
            <h2><i class="bi bi-gear-fill text-warning"></i> Administrateurs</h2>
            <p>Importez des données CSV, gérez les utilisateurs et configurez le système.</p>
            <ul class="list-unstyled">
              <li><i class="bi bi-check-circle-fill text-success"></i> Import CSV</li>
              <li><i class="bi bi-check-circle-fill text-success"></i> Gestion des utilisateurs</li>
              <li><i class="bi bi-check-circle-fill text-success"></i> Configuration</li>
            </ul>
            <a class="btn btn-outline-primary mt-2" routerLink="/admin/import">Accéder à l'import</a>
          </div>
        </div>
      </div>

      <!-- Quick Stats Section -->
      <div class="row mt-5 text-center">
        <div class="col-12">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <h3>👥 500+</h3>
                  <p>Étudiants</p>
                </div>
                <div class="col-md-4">
                  <h3>👨‍🏫 50+</h3>
                  <p>Professeurs</p>
                </div>
                <div class="col-md-4">
                  <h3>📚 30+</h3>
                  <p>Matières</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="row mt-5">
        <div class="col-12">
          <h2 class="text-center mb-4">Comment ça marche ?</h2>
        </div>
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-body text-center">
              <h1 class="display-4 text-primary">1</h1>
              <h4>Import des données</h4>
              <p>L'administrateur importe la liste des étudiants et professeurs via fichier CSV</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-body text-center">
              <h1 class="display-4 text-primary">2</h1>
              <h4>Première connexion</h4>
              <p>Les utilisateurs se connectent avec leur mot de passe temporaire</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-body text-center">
              <h1 class="display-4 text-primary">3</h1>
              <h4>Accès personnalisé</h4>
              <p>Accès aux fonctionnalités selon le rôle (étudiant, professeur, admin)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bi {
      margin-right: 8px;
    }
    .card {
      transition: transform 0.3s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
  `]
})
export class HomeComponent {}