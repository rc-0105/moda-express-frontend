// src/app/models/product.interface.ts

export interface Variant {
  id: number;
  talla?: string;
  color?: string;
  stock: number;
  sku: string;
  imageUrl?: string; // URL opcional por variante
}

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
  categoriaId?: number;
  imagen_url?: string; // campo usado en los mocks/JSON de la spec
  variants?: Variant[];
}
