import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AdminImportComponent } from './components/admin/admin-import.component';
import { UserDashboardComponent } from './components/user/user-dashboard.component';
import { LoginRedirectComponent } from './components/login/login-redirect.component';
import { KeycloakDebugComponent } from './components/debug/keycloak-debug.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginRedirectComponent },
  { path: 'debug', component: KeycloakDebugComponent }, // Debug route - no auth required
  { 
    path: 'dashboard', 
    component: UserDashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin/import', 
    component: AdminImportComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] } // Using the exact role name from Keycloak
  },
  { 
    path: 'unauthorized', 
    component: HomeComponent 
  },
  { path: '**', redirectTo: '' }
];