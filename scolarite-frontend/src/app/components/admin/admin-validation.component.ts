import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminValidationService, PendingUser, ValidationResponse } from '../../services/admin-validation.service';

@Component({
  selector: 'app-admin-validation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <h2>Validation des inscriptions</h2>
      
      <!-- Notification -->
      @if (notification) {
        <div class="alert alert-{{notification.type}} alert-dismissible fade show" role="alert">
          {{ notification.message }}
          <button type="button" class="btn-close" (click)="notification = null"></button>
        </div>
      }

      <!-- Loading -->
      @if (isLoading) {
        <div class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-2">Chargement des demandes en attente...</p>
        </div>
      }

      <!-- Liste des utilisateurs en attente -->
      @if (!isLoading && pendingUsers.length === 0) {
        <div class="alert alert-info mt-4">
          <i class="bi bi-info-circle"></i>
          Aucune demande d'inscription en attente
        </div>
      }

      @if (pendingUsers.length > 0) {
        <div class="table-responsive mt-4">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Nom complet</th>
                <th>Nom d'utilisateur</th>
                <th>Email</th>
                <th>Rôle demandé</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of pendingUsers; track user.id) {
                <tr>
                  <td>{{user.firstName}} {{user.lastName}}</td>
                  <td>{{user.username}}</td>
                  <td>{{user.email}}</td>
                  <td>
                    <span class="badge bg-info">{{user.requestedRole || 'STUDENT'}}</span>
                  </td>
                  <td>{{user.createdTimestamp | date:'dd/MM/yyyy HH:mm'}}</td>
                  <td>
                    <button class="btn btn-sm btn-success me-2" (click)="openApproveModal(user)">
                      <i class="bi bi-check-circle"></i> Approuver
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="openRejectModal(user)">
                      <i class="bi bi-x-circle"></i> Rejeter
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal d'approbation -->
      @if (showApproveModal && selectedUser) {
        <div class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-success text-white">
                <h5 class="modal-title">Approuver l'utilisateur</h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeModals()"></button>
              </div>
              <div class="modal-body">
                <p>Vous êtes sur le point d'approuver :</p>
                <p><strong>{{selectedUser.firstName}} {{selectedUser.lastName}}</strong> ({{selectedUser.email}})</p>
                
                <hr>
                
                <label class="form-label fw-bold">Rôles à attribuer :</label>
                @for (role of availableRoles; track role) {
                  <div class="form-check">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      [value]="role"
                      [checked]="selectedRoles.includes(role)"
                      (change)="toggleRole(role, $event)"
                      [id]="'role_' + role"
                    >
                    <label class="form-check-label" [for]="'role_' + role">
                      {{ role }}
                    </label>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Annuler</button>
                <button 
                  type="button" 
                  class="btn btn-success" 
                  (click)="approveUser()"
                  [disabled]="selectedRoles.length === 0 || actionInProgress"
                >
                  @if (actionInProgress) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                  }
                  Approuver
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal de rejet -->
      @if (showRejectModal && selectedUser) {
        <div class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">Rejeter l'utilisateur</h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeModals()"></button>
              </div>
              <div class="modal-body">
                <p>Vous êtes sur le point de rejeter :</p>
                <p><strong>{{selectedUser.firstName}} {{selectedUser.lastName}}</strong> ({{selectedUser.email}})</p>
                
                <div class="mb-3">
                  <label class="form-label fw-bold">Raison du rejet :</label>
                  <textarea 
                    class="form-control" 
                    [(ngModel)]="rejectionReason" 
                    rows="3"
                    placeholder="Indiquez la raison du rejet..."
                  ></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Annuler</button>
                <button 
                  type="button" 
                  class="btn btn-danger" 
                  (click)="rejectUser()"
                  [disabled]="!rejectionReason || actionInProgress"
                >
                  @if (actionInProgress) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                  }
                  Rejeter définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .modal.show {
      display: block;
    }
    .badge {
      font-size: 0.9em;
      padding: 0.5em 0.7em;
    }
  `]
})
export class AdminValidationComponent implements OnInit {
  pendingUsers: PendingUser[] = [];
  isLoading = false;
  actionInProgress = false;
  
  showApproveModal = false;
  showRejectModal = false;
  selectedUser: PendingUser | null = null;
  
  availableRoles: string[] = ['STUDENT', 'PROFESSOR', 'ADMIN'];
  selectedRoles: string[] = [];
  rejectionReason = '';
  
  notification: { type: string; message: string } | null = null;

  constructor(private adminValidationService: AdminValidationService) {}

  ngOnInit() {
    this.loadPendingUsers();
    this.loadAvailableRoles();
  }

  loadPendingUsers() {
    this.isLoading = true;
    this.adminValidationService.getPendingUsers().subscribe({
      next: (users: PendingUser[]) => {
        this.pendingUsers = users;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.showNotification('error', 'Erreur lors du chargement');
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  loadAvailableRoles() {
    this.adminValidationService.getAvailableRoles().subscribe({
      next: (roles: string[]) => {
        this.availableRoles = roles;
      },
      error: (error: any) => {
        console.error('Erreur chargement rôles', error);
      }
    });
  }

  openApproveModal(user: PendingUser) {
    this.selectedUser = user;
    this.selectedRoles = [user.requestedRole];
    this.showApproveModal = true;
  }

  openRejectModal(user: PendingUser) {
    this.selectedUser = user;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeModals() {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedUser = null;
    this.selectedRoles = [];
    this.rejectionReason = '';
  }

  toggleRole(role: string, event: any) {
    if (event.target.checked) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
  }

  approveUser() {
    if (!this.selectedUser || this.selectedRoles.length === 0) return;
    
    this.actionInProgress = true;
    this.adminValidationService.approveUser(this.selectedUser.id, this.selectedRoles).subscribe({
      next: (response: ValidationResponse) => {
        if (response.success) {
          this.showNotification('success', 'Utilisateur approuvé avec succès');
          this.closeModals();
          this.loadPendingUsers();
        } else {
          this.showNotification('error', response.message);
        }
        this.actionInProgress = false;
      },
      error: (error: any) => {
        this.showNotification('error', error.error?.message || 'Erreur lors de l\'approbation');
        this.actionInProgress = false;
        console.error('Erreur:', error);
      }
    });
  }

  rejectUser() {
    if (!this.selectedUser || !this.rejectionReason) return;
    
    this.actionInProgress = true;
    this.adminValidationService.rejectUser(this.selectedUser.id, this.rejectionReason).subscribe({
      next: (response: ValidationResponse) => {
        if (response.success) {
          this.showNotification('success', 'Utilisateur rejeté et supprimé');
          this.closeModals();
          this.loadPendingUsers();
        } else {
          this.showNotification('error', response.message);
        }
        this.actionInProgress = false;
      },
      error: (error: any) => {
        this.showNotification('error', error.error?.message || 'Erreur lors du rejet');
        this.actionInProgress = false;
        console.error('Erreur:', error);
      }
    });
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}