// src/app/components/auth/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';
import { debounceTime, map, switchMap, first } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">Inscription</h4>
            </div>
            
            <div class="card-body">
              @if (!registrationSuccess) {
                <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                  <!-- Nom d'utilisateur -->
                  <div class="mb-3">
                    <label class="form-label">Nom d'utilisateur</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched"
                      formControlName="username"
                      placeholder="sarah"
                    >
                    @if (registerForm.get('username')?.pending) {
                      <small class="text-muted">Vérification...</small>
                    }
                    @if (registerForm.get('username')?.invalid && registerForm.get('username')?.touched) {
                      <div class="invalid-feedback">
                        @if (registerForm.get('username')?.hasError('required')) {
                          Nom d'utilisateur requis
                        }
                        @if (registerForm.get('username')?.hasError('minlength')) {
                          Minimum 3 caractères
                        }
                        @if (registerForm.get('username')?.hasError('usernameTaken')) {
                          Ce nom d'utilisateur est déjà pris
                        }
                      </div>
                    }
                  </div>

                  <!-- Email -->
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input 
                      type="email" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                      formControlName="email"
                      placeholder="sarah@gmail.com"
                    >
                    @if (registerForm.get('email')?.pending) {
                      <small class="text-muted">Vérification...</small>
                    }
                    @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                      <div class="invalid-feedback">
                        @if (registerForm.get('email')?.hasError('required')) {
                          Email requis
                        }
                        @if (registerForm.get('email')?.hasError('email')) {
                          Email invalide
                        }
                        @if (registerForm.get('email')?.hasError('emailTaken')) {
                          Cet email est déjà utilisé
                        }
                      </div>
                    }
                  </div>

                  <!-- Numéro Carte d'Identité (CIN) -->
                  <div class="mb-3">
                    <label class="form-label">Numéro Carte d'Identité (CIN)</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('cin')?.invalid && registerForm.get('cin')?.touched"
                      formControlName="cin"
                      placeholder="00000000"
                    >
                    @if (registerForm.get('cin')?.invalid && registerForm.get('cin')?.touched) {
                      <div class="invalid-feedback">
                        @if (registerForm.get('cin')?.hasError('required')) {
                          Le numéro CIN est requis
                        }
                        @if (registerForm.get('cin')?.hasError('minlength')) {
                          Le CIN doit contenir au moins 6 caractères
                        }
                      </div>
                    }
                    <small class="text-muted">
                      Votre CIN sera utilisé comme mot de passe initial
                    </small>
                  </div>

                  <!-- Prénom -->
                  <div class="mb-3">
                    <label class="form-label">Prénom</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                      formControlName="firstName"
                      placeholder="sarah"
                    >
                    @if (registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched) {
                      <div class="invalid-feedback">
                        @if (registerForm.get('firstName')?.hasError('required')) {
                          Prénom requis
                        }
                      </div>
                    }
                  </div>

                  <!-- Nom -->
                  <div class="mb-3">
                    <label class="form-label">Nom</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                      formControlName="lastName"
                      placeholder="sarah"
                    >
                    @if (registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched) {
                      <div class="invalid-feedback">
                        @if (registerForm.get('lastName')?.hasError('required')) {
                          Nom requis
                        }
                      </div>
                    }
                  </div>

                  <!-- Rôle -->
                  <div class="mb-3">
                    <label class="form-label">Vous êtes</label>
                    <select class="form-select" formControlName="role">
                      <option value="STUDENT">Étudiant</option>
                      <option value="PROFESSOR">Professeur</option>
                    </select>
                  </div>

                  <!-- Message d'erreur -->
                  @if (errorMessage) {
                    <div class="alert alert-danger">
                      {{ errorMessage }}
                    </div>
                  }

                  <!-- Bouton d'inscription -->
                  <button 
                    type="submit" 
                    class="btn btn-primary w-100" 
                    [disabled]="registerForm.invalid || registerForm.pending || isLoading"
                  >
                    @if (isLoading) {
                      <span class="spinner-border spinner-border-sm me-2"></span>
                      Inscription en cours...
                    } @else {
                      S'inscrire
                    }
                  </button>
                </form>

                <hr>
                <p class="text-center mb-0">
                  Déjà un compte ? <a routerLink="/login">Se connecter</a>
                </p>
              }

              <!-- Message de succès -->
              @if (registrationSuccess) {
                <div class="text-center">
                  <div class="mb-3">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                  </div>
                  <h4 class="text-success">Inscription réussie !</h4>
                  <p class="mt-3">
                    Votre compte est en attente de validation par un administrateur.<br>
                    Utilisez votre numéro CIN <strong>{{registerForm.value.cin}}</strong> comme mot de passe initial.
                  </p>
                  <button class="btn btn-primary mt-3" routerLink="/">
                    Retour à l'accueil
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  registrationSuccess = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)], [this.usernameValidator()]],
      email: ['', [Validators.required, Validators.email], [this.emailValidator()]],
      cin: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: ['STUDENT']
    });
  }

  usernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }
      return control.valueChanges.pipe(
        debounceTime(500),
        switchMap(value => this.registrationService.checkUsername(value)),
        map(response => response.available ? null : { usernameTaken: true }),
        first()
      );
    };
  }

  emailValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }
      return control.valueChanges.pipe(
        debounceTime(500),
        switchMap(value => this.registrationService.checkEmail(value)),
        map(response => response.available ? null : { emailTaken: true }),
        first()
      );
    };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const userData = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      cin: this.registerForm.value.cin,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      role: this.registerForm.value.role
    };

    this.registrationService.register(userData).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.isLoading = false;
        this.registrationSuccess = true;
      },
      error: (error) => {
        console.error('Erreur inscription:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }
}