// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ProductsPageComponent } from './pages/client/produts-page/produts-page';
import { HomeComponent } from './pages/client/home/home.component';
// lazy route for product detail
export const ProductDetailRoute = { path: 'products/:id', loadComponent: () => import('./pages/client/product-detail/product-detail.component').then(m => m.ProductDetailComponent) };
export const CartRoute = { path: 'cart', loadComponent: () => import('./pages/client/shopping-cart/shopping-cart.component').then(c => c.ShoppingCartComponent) };

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'client/products', component: ProductsPageComponent },
  { path: 'products', redirectTo: 'client/products', pathMatch: 'full' },
  { path: 'products/:id', loadComponent: () => import('./pages/client/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'checkout', loadComponent: () => import('./pages/client/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'orders', loadComponent: () => import('./pages/client/order-history/order-history.component').then(m => m.OrderHistoryComponent) },
  { path: 'orders/:id', loadComponent: () => import('./pages/client/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'admin/products', loadComponent: () => import('./pages/admin/product-management/product-management.component').then(m => m.ProductManagementComponent) },
  { path: 'admin/audit', loadComponent: () => import('./pages/admin/audit-management/audit-management.component').then(c => c.AuditManagementComponent) },
  { path: 'admin/orders', loadComponent: () => import('./pages/admin/order-management/order-management.component').then(m => m.OrderManagementComponent) },
  CartRoute,
  { path: 'client/cart', redirectTo: 'cart', pathMatch: 'full' },
  { path: 'order-confirmation/:id', loadComponent: () => import('./pages/client/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent) },
  // ...otras rutas
];
