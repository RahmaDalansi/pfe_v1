import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5 text-center">
      <h1 class="display-4">Gestion Scolarité PFE</h1>
      <p class="lead mt-3">
        Système de gestion des étudiants et professeurs
      </p>
      <hr class="my-4">
      <p>Bienvenue sur notre plateforme</p>
    </div>
  `
})
export class HomeComponent {}