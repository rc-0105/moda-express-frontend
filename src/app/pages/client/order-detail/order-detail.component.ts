import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { OrderService, Order } from '../../../services/order.service';
import { AuditService, AuditEntry } from '../../../services/audit.service';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private auditService = inject(AuditService);

  orderId!: number | null;
  order: Order | null = null;
  audit: AuditEntry[] | null = null;
  loading = false;
  error: string | null = null;
  isAdmin = false; // demo flag — enable change-state UI when FORCE_MOCK true

  private sub = new Subscription();

  ngOnInit(): void {
    this.isAdmin = true; // demo; adjust if you have a real auth flag
    const idStr = this.route.snapshot.paramMap.get('id');
    this.orderId = idStr ? Number(idStr) : null;
    if (!this.orderId) { this.error = 'Pedido no especificado'; return; }
    this.loadOrder();
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  loadOrder() {
    if (!this.orderId) return;
    this.loading = true;
    this.error = null;
    this.sub.add(this.orderService.getOrderDetail(this.orderId).subscribe(res => {
      this.loading = false;
      if (res?.status === 'ok' && res.data) {
        this.order = res.data as Order;
        // load audit
        this.loadAudit();
      } else {
        this.error = 'No se encontró el pedido.';
      }
    }, () => { this.loading = false; this.error = 'Error cargando el pedido.'; }));
  }

  loadAudit() {
    if (!this.orderId) return;
    this.sub.add(this.auditService.getAuditForOrder(this.orderId).subscribe(a => this.audit = a));
  }

  statusClass(status?: string) {
    switch ((status||'').toUpperCase()) {
      case 'ENVIADO': return 'badge bg-info';
      case 'ENTREGADO': return 'badge bg-success';
      case 'CANCELADO': return 'badge bg-danger';
      case 'PENDIENTE': return 'badge bg-warning text-dark';
      case 'CONFIRMADO': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }

  reprint() {
    if (!this.order) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const html = `
      <html><head><title>Recibo #${this.order.id}</title>
      <link href="/styles.css" rel="stylesheet">
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}</style>
      </head><body>
      <h2>Recibo Pedido #${this.order.id}</h2>
      <p>Fecha: ${new Date(this.order.fecha).toLocaleString()}</p>
      <hr>
      ${this.order.items?.map(it => `<div>${it.nombre} - ${it.variante} x${it.cantidad} - ${it.subtotal}</div>`).join('')}
      <hr>
      <p>Total: ${this.order.total}</p>
      <script>window.print();</script>
      </body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  contactSupport() {
    const subject = encodeURIComponent(`Soporte pedido #${this.order?.id || ''}`);
    const body = encodeURIComponent('Hola, necesito ayuda con mi pedido.\n\nIndica aquí tu mensaje...');
    window.location.href = `mailto:soporte@modaexpress.com?subject=${subject}&body=${body}`;
  }

  changeLocalStatus(newStatus: string) {
    if (!this.order) return;
    this.order = { ...this.order, estado: newStatus } as Order;
    // Optionally persist via OrderService (not implemented in mock)
  }

  lineTotal(item: any) { return (item.precio_unitario ?? item.subtotal ?? 0) * (item.cantidad ?? 1); }
}
