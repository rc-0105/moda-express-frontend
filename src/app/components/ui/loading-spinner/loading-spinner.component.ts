import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-loading-spinner',
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-center my-4">
      <div class="spinner-border" role="status" aria-hidden="true"></div>
    </div>
  `
})
export class LoadingSpinnerComponent {}
