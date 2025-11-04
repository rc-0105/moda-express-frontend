import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';

import { OrderService, Order } from '../../../services/order.service';

@Component({
  standalone: true,
  selector: 'app-order-history',
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);

  orders: Order[] = [];
  filtered: Order[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  size = 10;
  total = 0;
  searchTerm = '';
  sortOrder: 'recent' | 'oldest' | 'total_desc' | 'total_asc' = 'recent';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.error = null;
    // For demo assume userId=1
    this.orderService.getOrdersByUser(1).subscribe(res => {
      this.loading = false;
      if (res.status === 'ok' && res.data) {
        this.orders = res.data.items || [];
        this.total = res.data.total || this.orders.length;
        this.applyAllFilters();
      } else {
        this.error = 'Ocurrió un error al cargar tus pedidos.';
      }
    }, () => {
      this.loading = false;
      this.error = 'Ocurrió un error al cargar tus pedidos.';
    });
  }

  applyAllFilters() {
    // search
    const term = (this.searchTerm || '').trim().toLowerCase();
    this.filtered = this.orders.filter(o => {
      if (!term) return true;
      return String(o.id).includes(term) || (o.estado || '').toLowerCase().includes(term);
    });

    // sort
    this.applySort();
  }

  applySort() {
    const arr = [...this.filtered];
    switch (this.sortOrder) {
      case 'recent': arr.sort((a,b) => +new Date(b.fecha) - +new Date(a.fecha)); break;
      case 'oldest': arr.sort((a,b) => +new Date(a.fecha) - +new Date(b.fecha)); break;
      case 'total_desc': arr.sort((a,b) => b.total - a.total); break;
      case 'total_asc': arr.sort((a,b) => a.total - b.total); break;
    }
    this.filtered = arr;
    // reset page
    this.page = 1;
  }

  statusClass(estado?: string) {
    switch ((estado||'').toUpperCase()) {
      case 'CONFIRMADO': return 'badge bg-primary';
      case 'ENVIADO': return 'badge bg-info';
      case 'ENTREGADO': return 'badge bg-success';
      case 'CANCELADO': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  // simple pagination controls
  get pagedItems(): Order[] {
    const start = (this.page - 1) * this.size;
    return this.filtered.slice(start, start + this.size);
  }

  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page * this.size < this.filtered.length) this.page++; }
}
