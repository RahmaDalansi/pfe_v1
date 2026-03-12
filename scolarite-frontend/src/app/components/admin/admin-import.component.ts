import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportService } from '../../services/import.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-admin-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h2>Importation des Étudiants</h2>
      
      <div class="card mt-4">
        <div class="card-body">
          <div class="mb-3">
            <label for="csvFile" class="form-label">Sélectionner fichier CSV</label>
            <input 
              class="form-control" 
              type="file" 
              id="csvFile" 
              (change)="onFileSelected($event)"
              accept=".csv"
            >
          </div>
          
          @if (selectedFile) {
            <div class="mt-3">
              <p>Fichier sélectionné: {{selectedFile.name}}</p>
              <button 
                class="btn btn-primary" 
                (click)="uploadFile()"
                [disabled]="uploading"
              >
                {{ uploading ? 'Importation...' : 'Importer' }}
              </button>
            </div>
          }

          @if (uploadProgress > 0) {
            <div class="progress mt-3">
              <div 
                class="progress-bar" 
                role="progressbar" 
                [style.width.%]="uploadProgress"
              ></div>
            </div>
          }

          @if (importResult) {
            <div class="alert alert-success mt-3">
              {{ importResult }}
            </div>
          }

          @if (errorMessage) {
            <div class="alert alert-danger mt-3">
              {{ errorMessage }}
            </div>
          }
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header">
          Format CSV attendu
        </div>
        <div class="card-body">
          <pre class="bg-light p-3">
              firstName,lastName,email,cin,role
              John,Doe,john.doe@example.com,12345678,STUDENT
          </pre>
          <button class="btn btn-outline-primary" (click)="downloadSample()">
            Télécharger exemple CSV
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminImportComponent {
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;
  importResult = '';
  errorMessage = '';

  constructor(private importService: ImportService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.importResult = '';
    this.errorMessage = '';
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadProgress = 0;

    try {
      const response = await this.importService.importStudents(this.selectedFile);
      response.subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            this.importResult = `Import réussi: ${event.body.message}`;
            this.uploading = false;
          }
        },
        error: (error: any) => {
          this.errorMessage = 'Erreur lors de l\'import: ' + error.message;
          this.uploading = false;
        }
      });
    } catch (error: any) {
      this.errorMessage = 'Erreur lors de l\'import: ' + error.message;
      this.uploading = false;
    }
  }

  downloadSample() {
    const csv = 'firstName,lastName,email,cin,role\nJohn,Doe,john.doe@example.com,11177640,STUDENT';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}