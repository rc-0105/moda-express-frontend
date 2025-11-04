import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ProductManagementService, ProductMgmt, Variant } from '../../../services/product-management.service';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';

@Component({
  standalone: true,
  selector: 'app-product-management',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  private svc = inject(ProductManagementService);
  private fb = inject(FormBuilder);

  loading = false;
  error: string | null = null;
  success: string | null = null;

  products: ProductMgmt[] = [];
  page = 1;
  size = 10;
  total = 0;
  search = '';

  editing: ProductMgmt | null = null;
  form = this.fb.group({
    id: [null as any],
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    categoria: ['Hombre'],
    variantes: this.fb.array([])
  });

  ngOnInit(): void { this.load(); }

  get variantes(): FormArray { return this.form.get('variantes') as FormArray; }

  load() {
    this.loading = true; this.error = null;
    this.svc.getProducts(this.search, this.page, this.size).subscribe(r => {
      this.products = r.items; this.total = r.total; this.loading = false;
    }, () => { this.error = 'Error cargando productos'; this.loading = false; });
  }

  searchApply() { this.page = 1; this.load(); }

  newProduct() {
    this.editing = null; this.form.reset({ categoria: 'Hombre', precio: 0 });
    while (this.variantes.length) this.variantes.removeAt(0);
    this.addVariant();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editProduct(p: ProductMgmt) {
    this.editing = p;
    this.form.patchValue({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, categoria: p.categoria });
    while (this.variantes.length) this.variantes.removeAt(0);
    (p.variantes || []).forEach(v => this.variantes.push(this.fb.group({ id: [v.id], talla: [v.talla], color: [v.color], stock: [v.stock], sku: [v.sku] })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addVariant(v?: Variant) { this.variantes.push(this.fb.group({ id: [v?.id], talla: [v?.talla || 'M'], color: [v?.color || ''], stock: [v?.stock ?? 0], sku: [v?.sku || ''] })); }

  removeVariant(i: number) { this.variantes.removeAt(i); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.form.value as ProductMgmt;
    this.loading = true; this.error = null; this.success = null;
    const op = payload.id ? this.svc.updateProduct(payload.id, payload) : this.svc.createProduct(payload);
    op.subscribe(res => {
      this.loading = false; this.success = 'Guardado correctamente'; this.load();
      setTimeout(() => this.success = null, 3000);
    }, () => { this.loading = false; this.error = 'Error guardando producto'; });
  }

  confirmDelete(p: ProductMgmt) {
    if (!confirm(`Eliminar producto ${p.nombre}?`)) return;
    this.loading = true; this.svc.deleteProduct(p.id as number).subscribe(ok => {
      this.loading = false; if (ok) { this.success = 'Eliminado'; this.load(); setTimeout(() => this.success = null, 3000); } else this.error = 'No se pudo eliminar';
    }, () => { this.loading = false; this.error = 'Error eliminando'; });
  }

  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page * this.size < this.total) { this.page++; this.load(); } }
}
