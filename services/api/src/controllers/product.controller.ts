import { Request, Response } from 'express';
import { z } from 'zod';
import { createProduct, getProductById, getProductByBarcode, listProducts } from '../services/product.service';
import { sendSuccess, sendError } from '../middleware/response';

const CreateProductSchema = z.object({
  barcode: z.string().max(255).optional(),
  commodityName: z.string().min(1, 'Commodity name is required').max(255),
  brandName: z.string().max(255).optional(),
  category: z.string().max(255).optional(),
});

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  const parseResult = CreateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid product data', 400, {
      errors: parseResult.error.issues,
    });
    return;
  }

  try {
    const product = await createProduct(parseResult.data);
    sendSuccess(res, { product }, 201);
  } catch (err: any) {
    console.error('[PRODUCT] Error creating product:', err);
    sendError(res, 'INTERNAL_ERROR', 'Failed to create product', 500);
  }
}

export async function getProductByIdHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const product = await getProductById(id);
  if (!product) {
    sendError(res, 'NOT_FOUND', 'Product not found', 404);
    return;
  }
  sendSuccess(res, { product });
}

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
  const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
  const offset = (page - 1) * limit;

  const commodityName = req.query.commodityName as string | undefined;
  const category = req.query.category as string | undefined;
  const barcode = req.query.barcode as string | undefined;

  const result = await listProducts({
    commodityName,
    category,
    barcode,
    limit,
    offset,
  });

  sendSuccess(res, {
    items: result.items,
    total: result.total,
    page,
    pageSize: limit,
    hasMore: offset + result.items.length < result.total,
  });
}
