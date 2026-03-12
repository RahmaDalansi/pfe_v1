// src/app/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, Profile } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              <!-- Notification -->
              @if (notification) {
                <div class="alert alert-{{notification.type}} alert-dismissible fade show">
                  {{ notification.message }}
                  <button type="button" class="btn-close" (click)="notification = null"></button>
                </div>
              }

              <!-- Loading -->
              @if (isLoading) {
                <div class="text-center py-4">
                  <div class="spinner-border text-primary"></div>
                  <p class="mt-2">Chargement du profil...</p>
                </div>
              }

              @if (!isLoading && profile) {
                <!-- Mode édition ou visualisation -->
                @if (!isEditing) {
                  <!-- Mode visualisation -->
                  <div class="profile-view">
                    <div class="row mb-3">
                      <label class="col-sm-4 col-form-label fw-bold">Nom d'utilisateur:</label>
                      <div class="col-sm-8">
                        <p class="form-control-plaintext">{{ profile.username }}</p>
                      </div>
                    </div>
                    
                    <div class="row mb-3">
                      <label class="col-sm-4 col-form-label fw-bold">Prénom:</label>
                      <div class="col-sm-8">
                        <p class="form-control-plaintext">{{ profile.firstName || 'Non renseigné' }}</p>
                      </div>
                    </div>

                    <div class="row mb-3">
                      <label class="col-sm-4 col-form-label fw-bold">Nom:</label>
                      <div class="col-sm-8">
                        <p class="form-control-plaintext">{{ profile.lastName || 'Non renseigné' }}</p>
                      </div>
                    </div>
                    
                    <div class="row mb-3">
                      <label class="col-sm-4 col-form-label fw-bold">Email:</label>
                      <div class="col-sm-8">
                        <p class="form-control-plaintext">{{ profile.email }}</p>
                      </div>
                    </div>
                    
                    <div class="row mb-3">
                      <label class="col-sm-4 col-form-label fw-bold">Rôle(s):</label>
                      <div class="col-sm-8">
                        @for (role of profile.roles; track role) {
                          <span class="badge bg-info me-2">{{ role }}</span>
                        }
                      </div>
                    </div>

                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                      <button class="btn btn-primary" (click)="startEditing()">
                        <i class="bi bi-pencil"></i> Modifier le profil
                      </button>
                    </div>
                  </div>
                } @else {
                  <!-- Mode édition -->
                  <div class="profile-edit">
                    <form #profileForm="ngForm">
                      <div class="row mb-3">
                        <label class="col-sm-4 col-form-label fw-bold">Nom d'utilisateur:</label>
                        <div class="col-sm-8">
                          <p class="form-control-plaintext">{{ profile.username }}</p>
                        </div>
                      </div>
                      
                      <div class="row mb-3">
                        <label class="col-sm-4 col-form-label fw-bold">Prénom:</label>
                        <div class="col-sm-8">
                          <input 
                            type="text" 
                            class="form-control" 
                            [(ngModel)]="editProfile.firstName"
                            name="firstName"
                            required
                          >
                        </div>
                      </div>

                      <div class="row mb-3">
                        <label class="col-sm-4 col-form-label fw-bold">Nom:</label>
                        <div class="col-sm-8">
                          <input 
                            type="text" 
                            class="form-control" 
                            [(ngModel)]="editProfile.lastName"
                            name="lastName"
                            required
                          >
                        </div>
                      </div>
                      
                      <div class="row mb-3">
                        <label class="col-sm-4 col-form-label fw-bold">Email:</label>
                        <div class="col-sm-8">
                          <input 
                            type="email" 
                            class="form-control" 
                            [(ngModel)]="editProfile.email"
                            name="email"
                            required
                            email
                          >
                        </div>
                      </div>

                      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button class="btn btn-secondary" (click)="cancelEditing()">
                          Annuler
                        </button>
                        <button 
                          class="btn btn-success" 
                          (click)="saveProfile()"
                          [disabled]="!profileForm.form.valid || isSaving"
                        >
                          @if (isSaving) {
                            <span class="spinner-border spinner-border-sm me-2"></span>
                          }
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                }

                <hr>

                <!-- Section changement de mot de passe -->
                <h5 class="mb-3">
                  <i class="bi bi-key"></i> Changer le mot de passe
                </h5>

                <div class="password-change">
                  <div class="mb-3">
                    <label class="form-label">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      class="form-control" 
                      [(ngModel)]="passwordData.currentPassword"
                      [disabled]="isUpdatingPassword"
                    >
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      class="form-control" 
                      [(ngModel)]="passwordData.newPassword"
                      [disabled]="isUpdatingPassword"
                    >
                    <small class="text-muted">Minimum 6 caractères</small>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Confirmer nouveau mot de passe</label>
                    <input 
                      type="password" 
                      class="form-control" 
                      [(ngModel)]="passwordData.confirmPassword"
                      [disabled]="isUpdatingPassword"
                    >
                  </div>

                  @if (passwordError) {
                    <div class="alert alert-danger py-2">
                      {{ passwordError }}
                    </div>
                  }

                  <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button 
                      class="btn btn-warning" 
                      (click)="changePassword()"
                      [disabled]="isUpdatingPassword || !isPasswordFormValid()"
                    >
                      @if (isUpdatingPassword) {
                        <span class="spinner-border spinner-border-sm me-2"></span>
                      }
                      <i class="bi bi-shield-lock"></i> Mettre à jour le mot de passe
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profile: Profile | null = null;
  editProfile: Partial<Profile> = {};
  isLoading = false;
  isEditing = false;
  isSaving = false;
  isUpdatingPassword = false;
  
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError = '';
  
  notification: { type: 'success' | 'danger'; message: string } | null = null;

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.showNotification('danger', 'Erreur lors du chargement du profil');
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  startEditing() {
    if (this.profile) {
      this.editProfile = {
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        email: this.profile.email
      };
      this.isEditing = true;
    }
  }

  cancelEditing() {
    this.isEditing = false;
    this.editProfile = {};
  }

  saveProfile() {
    if (!this.editProfile) return;

    this.isSaving = true;
    this.profileService.updateProfile(this.editProfile).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification('success', '✅ Profil mis à jour avec succès');
          this.isEditing = false;
          this.loadProfile(); // Recharger le profil
        } else {
          this.showNotification('danger', response.message);
        }
        this.isSaving = false;
      },
      error: (error) => {
        this.showNotification('danger', error.error?.message || 'Erreur lors de la mise à jour');
        this.isSaving = false;
      }
    });
  }

  isPasswordFormValid(): boolean {
    return this.passwordData.currentPassword.length > 0 &&
           this.passwordData.newPassword.length >= 6 &&
           this.passwordData.newPassword === this.passwordData.confirmPassword;
  }

  changePassword() {
    if (!this.isPasswordFormValid()) {
      this.passwordError = 'Vérifiez que les mots de passe correspondent (min 6 caractères)';
      return;
    }

    this.isUpdatingPassword = true;
    this.passwordError = '';

    this.profileService.changePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification('success', '✅ Mot de passe modifié avec succès');
          this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        } else {
          this.showNotification('danger', response.message);
        }
        this.isUpdatingPassword = false;
      },
      error: (error) => {
        this.passwordError = error.error?.message || 'Erreur lors du changement de mot de passe';
        this.isUpdatingPassword = false;
      }
    });
  }

  showNotification(type: 'success' | 'danger', message: string) {
    this.notification = { type, message };
    setTimeout(() => this.notification = null, 5000);
  }
}