import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { OrderService } from '../../../services/order.service';
import { AuditService } from '../../../services/audit.service';
import { ToastService } from '../../../services/toast.service';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-order-management',
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private auditSvc = inject(AuditService);
  private toast = inject(ToastService);

  loading = false;
  error: string | null = null;

  orders: any[] = [];
  page = 1;
  size = 10;
  total = 0;

  estadoFilter = '';
  q = '';

  // detail modal
  showDetail = false;
  selectedOrder: any = null;
  audit: any[] | null = null;
  statusOptions = ['PENDIENTE','CONFIRMADO','PAGADO','ENVIADO','ENTREGADO','CANCELADO'];
  newStatus = '';

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true; this.error = null;
    this.orderSvc.getOrders({ page: this.page, size: this.size, estado: this.estadoFilter || undefined, q: this.q || undefined }).subscribe(resp => {
      this.loading = false;
      if (resp?.status === 'ok' && resp.data) {
        this.orders = resp.data.items || [];
        this.total = resp.data.total || 0;
      } else {
        this.error = 'No se pudieron cargar los pedidos';
      }
    }, () => { this.loading = false; this.error = 'Error cargando pedidos'; });
  }

  refresh() { this.load(); }

  openDetail(order: any) {
    this.selectedOrder = null; this.audit = null; this.showDetail = true; this.newStatus = '';
    this.orderSvc.getOrderDetail(order.id).subscribe(r => {
      if (r?.status === 'ok') this.selectedOrder = r.data; else this.selectedOrder = order;
  }, () => this.toast.show('No se pudo cargar detalle'));
    this.auditSvc.getAuditForOrder(order.id).subscribe(a => this.audit = a, () => this.audit = []);
  }

  closeDetail() { this.showDetail = false; this.selectedOrder = null; this.audit = null; }

  openChangeStatus(order: any) {
    this.selectedOrder = order; this.newStatus = order.estado || '';
    this.showDetail = true; // reuse modal for simplicity
  }

  saveStatus() {
    if (!this.selectedOrder) return;
    this.orderSvc.updateOrderStatus(this.selectedOrder.id, this.newStatus).subscribe(r => {
      if (r?.status === 'ok') {
        // update local list
        const idx = this.orders.findIndex(o => o.id === this.selectedOrder.id);
        if (idx >= 0) this.orders[idx].estado = this.newStatus;
        if (this.selectedOrder) this.selectedOrder.estado = this.newStatus;
  this.toast.show('Estado actualizado');
        this.closeDetail();
      } else {
  this.toast.show('No se pudo actualizar estado');
      }
  }, () => this.toast.show('Error actualizando estado'));
  }

  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page * this.size < this.total) { this.page++; this.load(); } }
}
