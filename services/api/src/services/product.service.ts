import { query } from '../db';
import { Product } from '@slm/shared';

export interface CreateProductData {
  barcode?: string;
  commodityName: string;
  brandName?: string;
  category?: string;
}

export interface ListProductsFilters {
  commodityName?: string;
  category?: string;
  barcode?: string;
  limit?: number;
  offset?: number;
}

function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    barcode: row.barcode,
    commodityName: row.commodity_name,
    brandName: row.brand_name,
    category: row.category,
    lastInspectionId: row.last_inspection_id,
    violationCount: row.violation_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  const res = await query(
    `INSERT INTO products (barcode, commodity_name, brand_name, category)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      data.barcode || null,
      data.commodityName.trim(),
      data.brandName ? data.brandName.trim() : null,
      data.category ? data.category.trim() : null,
    ]
  );

  return mapRowToProduct(res.rows[0]);
}

export async function getProductById(id: string): Promise<Product | null> {
  const res = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  return mapRowToProduct(res.rows[0]);
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const res = await query('SELECT * FROM products WHERE barcode = $1', [barcode.trim()]);
  if (res.rows.length === 0) return null;
  return mapRowToProduct(res.rows[0]);
}

export async function listProducts(
  filters: ListProductsFilters = {}
): Promise<{ items: Product[]; total: number }> {
  const { commodityName, category, barcode, limit = 20, offset = 0 } = filters;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (commodityName) {
    conditions.push(`commodity_name ILIKE $${paramIndex++}`);
    params.push(`%${commodityName}%`);
  }

  if (category) {
    conditions.push(`category ILIKE $${paramIndex++}`);
    params.push(`%${category}%`);
  }

  if (barcode) {
    conditions.push(`barcode = $${paramIndex++}`);
    params.push(barcode.trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const queryParams = [...params, limit, offset];
  const dataRes = await query(
    `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  const items = dataRes.rows.map(mapRowToProduct);
  return { items, total };
}
