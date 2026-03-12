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
                      placeholder="john.doe"
                    >
                    @if (registerForm.get('username')?.pending) {
                      <small class="text-muted">Vérification...</small>
                    }
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
                  </div>

                  <!-- Email -->
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input 
                      type="email" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                      formControlName="email"
                      placeholder="john.doe@example.com"
                    >
                    @if (registerForm.get('email')?.pending) {
                      <small class="text-muted">Vérification...</small>
                    }
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
                  </div>

                  <!-- Prénom et Nom -->
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Prénom</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [class.is-invalid]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                        formControlName="firstName"
                      >
                      <div class="invalid-feedback">Prénom requis</div>
                    </div>

                    <div class="col-md-6 mb-3">
                      <label class="form-label">Nom</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [class.is-invalid]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                        formControlName="lastName"
                      >
                      <div class="invalid-feedback">Nom requis</div>
                    </div>
                  </div>

                  <!-- Mot de passe -->
                  <div class="mb-3">
                    <label class="form-label">Mot de passe</label>
                    <input 
                      type="password" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                      formControlName="password"
                    >
                    <div class="invalid-feedback">
                      @if (registerForm.get('password')?.hasError('required')) {
                        Mot de passe requis
                      }
                      @if (registerForm.get('password')?.hasError('minlength')) {
                        Minimum 6 caractères
                      }
                    </div>
                  </div>

                  <!-- Confirmation mot de passe -->
                  <div class="mb-3">
                    <label class="form-label">Confirmer mot de passe</label>
                    <input 
                      type="password" 
                      class="form-control" 
                      [class.is-invalid]="registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched"
                      formControlName="confirmPassword"
                    >
                    <div class="invalid-feedback">
                      Les mots de passe ne correspondent pas
                    </div>
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
                    Vous recevrez un email dès que votre compte sera activé.
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
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['STUDENT']
    }, { validator: this.passwordMatchValidator });
  }

  usernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
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
      return control.valueChanges.pipe(
        debounceTime(500),
        switchMap(value => this.registrationService.checkEmail(value)),
        map(response => response.available ? null : { emailTaken: true }),
        first()
      );
    };
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const userData = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      password: this.registerForm.value.password,
      role: this.registerForm.value.role
    };

    this.registrationService.register(userData).subscribe({
      next: () => {
        this.isLoading = false;
        this.registrationSuccess = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }
}