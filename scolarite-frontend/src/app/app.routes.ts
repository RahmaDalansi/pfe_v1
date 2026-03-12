// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { AdminImportComponent } from './components/admin/admin-import.component';
import { AdminValidationComponent } from './components/admin/admin-validation.component';
import { UserDashboardComponent } from './components/user/user-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component'; // NOUVEAU
import { LoginRedirectComponent } from './components/login/login-redirect.component';
import { KeycloakDebugComponent } from './components/debug/keycloak-debug.component';
import { RegisterComponent } from './components/auth/register.component';
import { PendingComponent } from './components/auth/pending.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginRedirectComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'pending', component: PendingComponent },
  { path: 'debug', component: KeycloakDebugComponent },
  
  
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard] // Accessible à tous les utilisateurs connectés
  },
  
  { 
    path: 'dashboard', 
    component: UserDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['STUDENT', 'PROFESSOR'] }
  },
  { 
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'admin/import', 
    component: AdminImportComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'admin/validation', 
    component: AdminValidationComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: 'unauthorized', component: HomeComponent },
  { path: '**', redirectTo: '' }
];