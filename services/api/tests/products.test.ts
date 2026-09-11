import * as db from '../src/db';
import { createProduct, getProductById, getProductByBarcode, listProducts } from '../src/services/product.service';

describe('Product Reference Service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a product and map columns correctly', async () => {
    const mockRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      barcode: '8901234567890',
      commodity_name: 'Wheat Flour',
      brand_name: 'BrandX',
      category: 'Food',
      last_inspection_id: null,
      violation_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [mockRow],
      rowCount: 1,
    } as any);

    const product = await createProduct({
      barcode: '8901234567890',
      commodityName: 'Wheat Flour',
      brandName: 'BrandX',
      category: 'Food',
    });

    expect(product.id).toBe(mockRow.id);
    expect(product.commodityName).toBe('Wheat Flour');
    expect(product.barcode).toBe('8901234567890');
  });

  it('should retrieve a product by ID', async () => {
    const mockRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      barcode: '8901234567890',
      commodity_name: 'Wheat Flour',
      brand_name: 'BrandX',
      category: 'Food',
      last_inspection_id: null,
      violation_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [mockRow],
      rowCount: 1,
    } as any);

    const product = await getProductById('123e4567-e89b-12d3-a456-426614174000');
    expect(product).not.toBeNull();
    expect(product?.commodityName).toBe('Wheat Flour');
  });

  it('should return null when product is not found', async () => {
    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [],
      rowCount: 0,
    } as any);

    const product = await getProductById('missing-id');
    expect(product).toBeNull();
  });

  it('should list products with filters and pagination', async () => {
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({
        rows: [{ count: '1' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            barcode: '8901234567890',
            commodity_name: 'Atta Flour',
            brand_name: 'NatureFresh',
            category: 'Food',
            violation_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

    const result = await listProducts({ commodityName: 'Atta', limit: 10, offset: 0 });
    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
    expect(result.items[0].commodityName).toBe('Atta Flour');
  });
});
