import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ProductService } from '../../../services/api/product.service';
import { ReviewService, ReviewItem } from '../../../services/review.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { LoadingSpinnerComponent } from '../../../components/ui/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../../components/ui/product-card/product-card';
import { UniquePipe } from '../../../pipes/unique.pipe';

@Component({
  standalone: true,
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent, ProductCardComponent, UniquePipe],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  providers: [DecimalPipe]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private reviewService = inject(ReviewService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  product: any = null;
  loading = true;
  error: string | null = null;

  mainImage = '';

  // variant selection
  selectedTalla: string | null = null;
  selectedColor: string | null = null;
  selectedVariant: any = null;
  qty = 1;

  reviews: ReviewItem[] = [];
  reviewsPage = 1;
  reviewsSize = 5;
  reviewsTotal = 0;
  reviewsLoading = false;

  reviewForm = this.fb.group({ rating: [5, [Validators.required]], comment: ['', [Validators.required, Validators.minLength(5)]] });

  showToast = false;
  toastMessage = '';

  private sub = new Subscription();

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'Product id inválido'; this.loading = false; return; }

    this.loadProduct(id);
    this.loadReviews(id, this.reviewsPage);
    // subscribe toast service to show messages from other places
    this.sub.add(this.toastService.messages$.subscribe((msg: string) => {
      this.toastMessage = msg; this.showToast = true;
      setTimeout(() => this.showToast = false, 3000);
    }));
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  private loadProduct(id: number) {
    this.loading = true; this.error = null;
    this.productService.getProductById(id).subscribe({
      next: (p) => {
        this.product = p || null;
        if (this.product) {
          this.mainImage = (this.product.images && this.product.images.length) ? this.product.images[0] : this.product.imagen_url || '';
          // derive default variant selection
          if (this.product.variants?.length) {
            const first = this.product.variants[0];
            this.selectedTalla = first.talla ?? null;
            this.selectedColor = first.color ?? null;
            this.syncSelectedVariant();
          }
          // fetch recommendations (optional endpoint)
          this.productService.getRecommendations(this.product.id).subscribe((rp) => { this.product.recommendations = rp; }, () => {});
        } else {
          this.error = 'Producto no encontrado';
        }
        this.loading = false;
      },
      error: (err) => { this.error = 'Error cargando el producto'; this.loading = false; }
    });
  }

  private loadReviews(productId: number, page = 1) {
    this.reviewsLoading = true;
    this.reviewService.getReviews(productId, page, this.reviewsSize).subscribe(resp => {
      try {
        this.reviews = resp.data?.items ?? [];
        this.reviewsPage = resp.data?.page ?? page;
        this.reviewsSize = resp.data?.size ?? this.reviewsSize;
        this.reviewsTotal = resp.data?.total ?? this.reviews.length;
      } finally {
        this.reviewsLoading = false;
      }
    }, () => { this.reviewsLoading = false; });
  }

  changeMainImage(url: string) { this.mainImage = url; }

  syncSelectedVariant() {
    if (!this.product?.variants) { this.selectedVariant = null; return; }
    const found = this.product.variants.find((v:any) => (this.selectedTalla ? v.talla === this.selectedTalla : true) && (this.selectedColor ? v.color === this.selectedColor : true));
    this.selectedVariant = found || null;
    this.qty = 1;
  }

  changeQty(delta: number) {
    const max = this.selectedVariant?.stock ?? 1;
    this.qty = Math.max(1, Math.min(max, this.qty + delta));
  }

  addToCart() {
    if (!this.selectedVariant) { this.toastService.show('Seleccione una variante'); return; }
    if ((this.selectedVariant.stock ?? 0) <= 0) { this.toastService.show('Variante sin stock'); return; }
    if (this.qty > (this.selectedVariant.stock ?? 0)) { this.toastService.show('Cantidad mayor al stock disponible'); return; }

    this.cartService.addItem(this.selectedVariant.id, this.qty, this.product?.id, {
      nombre: this.product?.nombre,
      imagen_url: this.selectedVariant?.imageUrl ?? this.product?.imagen_url,
      talla: this.selectedVariant?.talla,
      color: this.selectedVariant?.color,
      precio: this.product?.precio,
      stock: this.selectedVariant?.stock
    });
    this.toastService.show('Producto añadido al carrito');
  }

  submitReview() {
    if (this.reviewForm.invalid || !this.product) return;
    const payload = {
      user_id: 1,
      product_id: this.product.id,
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment,
      metadata: { helpful_votes: 0 }
    } as any;

    this.sub.add(this.reviewService.postReview(payload).subscribe({ next: () => {
      this.toastService.show('Reseña enviada para moderación');
      this.reviewForm.reset({ rating: 5, comment: '' });
      // do not immediately show unpublished review; reload first page to refresh counts
      this.loadReviews(this.product.id, 1);
    }, error: () => this.toastService.show('Error al enviar reseña') }));
  }


  // helpers for template
  variantStockLabel(v:any) { return (v?.stock ?? 0) > 0 ? `${v.stock} disponibles` : 'Agotado'; }
}
