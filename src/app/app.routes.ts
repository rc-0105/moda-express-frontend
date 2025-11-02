// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ProductsPageComponent } from './pages/client/produts-page/produts-page';
export const routes: Routes = [
  { path: 'products', component: ProductsPageComponent },
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  // ...otras rutas
];
