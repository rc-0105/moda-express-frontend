import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ReportService, SalesMetrics } from '../../../services/report.service';
import { OrderService } from '../../../services/order.service';
import { LogService, LogEntry } from '../../../services/log.service';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';
// Optional charts integration (ng2-charts + chart.js). To enable, install the packages:
// npm install chart.js ng2-charts
// The types are intentionally declared as `any` here so the app compiles even if packages
// aren't installed in the dev environment. When installed, you can replace `any` with
// the proper ChartConfiguration and ChartOptions imports.

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private orderService = inject(OrderService);
  private logService = inject(LogService);

  loading = true;
  metrics: SalesMetrics | null = null;
  recentOrders: any[] = [];
  recentLogs: LogEntry[] | null = null;
  errorMetrics: string | null = null;
  errorOrders: string | null = null;
  errorLogs: string | null = null;

  // chart data
  chartDaily: { day: string; total: number }[] = [];

  // ng2-charts data structures
  // Chart data/option holders (typed as any to avoid hard dependency on chart.js during development)
  public lineChartData: any = { labels: [], datasets: [] };
  public lineChartOptions: any = { responsive: true, plugins: { legend: { display: false } } };

  public barChartData: any = { labels: [], datasets: [] };
  public barChartOptions: any = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.errorMetrics = this.errorOrders = this.errorLogs = null;

    // fetch in parallel but handle per-block errors
    this.reportService.getSalesMetrics().subscribe(data => {
      this.metrics = data;
      this.chartDaily = data?.daily || [];
      this.updateCharts();
      if (!data) this.errorMetrics = 'No se pudieron cargar métricas';
      this.loading = false;
    }, () => { this.errorMetrics = 'Error cargando métricas'; this.loading = false; });

    this.orderService.getRecentOrders(10).subscribe(res => {
      if (res?.status === 'ok' && res.data) this.recentOrders = res.data.items || [];
      else this.errorOrders = 'No se pudieron cargar pedidos recientes';
    }, () => { this.errorOrders = 'Error cargando pedidos recientes'; });

    this.logService.getRecentLogs('ERROR', 5).subscribe(l => {
      this.recentLogs = l || [];
      if (!l) this.errorLogs = 'No se pudieron cargar logs';
    }, () => { this.errorLogs = 'Error cargando logs'; });
  }

  refreshMetrics() { this.reportService.refreshMetrics().subscribe(d => { this.metrics = d; this.chartDaily = d?.daily || []; }); }

  // small helper for chart bar width
  maxDaily() { return Math.max(1, ...(this.chartDaily.map(d => d.total || 0))); }

  private updateCharts() {
    // Line chart (daily)
    const labels = (this.chartDaily || []).map(d => d.day);
    const data = (this.chartDaily || []).map(d => d.total || 0);
    this.lineChartData = {
      labels,
      datasets: [
        {
          data,
          label: 'Ventas Diarias',
          fill: true,
          tension: 0.3,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13,110,253,0.15)'
        }
      ]
    };

    // Bar chart (top products)
    const top = this.metrics?.topProducts || [];
    const barLabels = top.map((p: any) => p.nombre || p.idProducto || '');
    const barData = top.map((p: any) => p.cantidad_vendida || p.cantidad_vendida || 0);
    this.barChartData = { labels: barLabels, datasets: [{ data: barData, label: 'Unidades Vendidas', backgroundColor: '#28a745' }] };
  }
}
