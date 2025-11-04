import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

import { AuditService, AuditEntry } from '../../../services/audit.service';
import { LogService } from '../../../services/log.service';

@Component({
  standalone: true,
  selector: 'app-audit-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './audit-management.component.html',
  styleUrls: ['./audit-management.component.css']
})
export class AuditManagementComponent implements OnInit {
  private auditSvc = inject(AuditService);
  private logSvc = inject(LogService);
  private router = inject(Router);

  // tabs
  activeTab: 'audit' | 'logs' = 'audit';

  // common filters
  startDate: string | null = null;
  endDate: string | null = null;
  q = '';

  // audit data
  auditLoading = false;
  auditError: string | null = null;
  auditItems: AuditEntry[] = [];
  auditTotal = 0;
  auditPage = 1;
  auditSize = 10;
  auditSizes = [10, 25, 50];
  selectedAudit: AuditEntry | null = null;
  reviewedIds = new Set<number>();

  // logs data
  logLoading = false;
  logError: string | null = null;
  logItems: any[] = [];
  logTotal = 0;
  logPage = 1;
  logSize = 10;
  logSizes = [10, 25, 50];
  logLevel = '';
  selectedLog: any = null;

  constructor() {}

  ngOnInit(): void { this.loadAudit(); }

  // Audit tab
  loadAudit() {
    this.auditLoading = true; this.auditError = null;
    this.auditSvc.getAuditOrders({ page: this.auditPage, size: this.auditSize, start: this.startDate || undefined, end: this.endDate || undefined, q: this.q || undefined }).subscribe(r => {
      this.auditLoading = false;
      if (r?.status === 'ok') { this.auditItems = r.data.items || []; this.auditTotal = r.data.total || 0; }
      else this.auditError = 'No se pudieron cargar entradas de auditoría';
    }, () => { this.auditLoading = false; this.auditError = 'Error cargando auditoría'; });
  }

  openAuditDetail(a: AuditEntry) { this.selectedAudit = a; }

  markReviewed(a: AuditEntry) { this.reviewedIds.add(a.pedido_id); }

  viewOrder(a: AuditEntry) { this.router.navigate(['/orders', a.pedido_id]); }

  filterHistoryByOrder(orderId: number) { this.q = ''; this.startDate = null; this.endDate = null; this.auditPage = 1; this.auditSvc.getAuditOrders({ orderId, page: 1, size: this.auditSize }).subscribe(r => { if (r?.status === 'ok') { this.auditItems = r.data.items; this.auditTotal = r.data.total; } }); }

  // Logs tab
  loadLogs() {
    this.logLoading = true; this.logError = null;
    this.logSvc.getLogs({ level: this.logLevel || undefined, page: this.logPage, size: this.logSize, start: this.startDate || undefined, end: this.endDate || undefined, q: this.q || undefined }).subscribe(r => {
      this.logLoading = false;
      if (r?.status === 'ok') { this.logItems = r.data.items || []; this.logTotal = r.data.total || 0; }
      else this.logError = 'No se pudieron cargar logs';
    }, () => { this.logLoading = false; this.logError = 'Error cargando logs'; });
  }

  openLogDetail(l: any) { this.selectedLog = l; }

  // pagination helpers
  auditPrev(){ if(this.auditPage>1){ this.auditPage--; this.loadAudit(); } }
  auditNext(){ if(this.auditPage*this.auditSize < this.auditTotal){ this.auditPage++; this.loadAudit(); } }
  logPrev(){ if(this.logPage>1){ this.logPage--; this.loadLogs(); } }
  logNext(){ if(this.logPage*this.logSize < this.logTotal){ this.logPage++; this.loadLogs(); } }

  // refresh both
  refresh() { if(this.activeTab==='audit') this.loadAudit(); else this.loadLogs(); }

  // CSV export
  exportAuditCsv() {
    const rows = [['id','pedido_id','old_status','new_status','changed_by','changed_at']];
    for(const r of this.auditItems) rows.push([String((r as any).id || ''), String(r.pedido_id||''), r.old_status||'', r.new_status||'', r.changed_by||'', r.changed_at||'']);
    this.downloadCsv(rows, `audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
  }

  exportLogsCsv() {
    const rows = [['id','timestamp','level','service','endpoint','message']];
    for(const r of this.logItems) rows.push([String(r.id||''), r.timestamp||'', r.level||'', r.service||'', r.endpoint||'', (r.message||'').replace(/\n/g,' ')]);
    this.downloadCsv(rows, `logs_${new Date().toISOString().slice(0,10)}.csv`);
  }

  private downloadCsv(rows: string[][], filename: string) {
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
}
