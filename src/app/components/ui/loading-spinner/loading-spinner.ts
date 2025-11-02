// src/app/components/ui/loading-spinner/loading-spinner.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center">
      <div class="spinner-border" role="status" aria-hidden="true"></div>
      <span class="ms-2 visually-hidden">Cargando...</span>
    </div>
  `
})
export class LoadingSpinnerComponent {}
