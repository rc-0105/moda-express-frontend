import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'unique', standalone: true })
export class UniquePipe implements PipeTransform {
  transform(items: any[] | null | undefined, prop?: string): any[] {
    if (!items) return [];
    if (!prop) return Array.from(new Set(items as any));
    const map = new Map<any, any>();
    for (const it of items) {
      const key = (it as any)[prop];
      if (!map.has(key)) map.set(key, it);
    }
    return Array.from(map.values());
  }
}
