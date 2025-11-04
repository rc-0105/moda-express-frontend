export interface ProductVariant {
  id: number;
  talla?: string;
  color?: string;
  stock?: number;
  sku?: string;
}

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
  categoriaId?: number;
  imagen_url?: string;
  variants?: ProductVariant[];
}
