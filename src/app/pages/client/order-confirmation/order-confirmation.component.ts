import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-order-confirmation',
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  pedidoId: string | null = null;

  ngOnInit(): void {
    this.pedidoId = this.route.snapshot.paramMap.get('id');
  }

  goHome() { this.router.navigate(['/']); }
}
