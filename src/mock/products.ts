// Shared product catalog — used both by mock data generation and by the
// manual "Add Cargo" form so suggestions stay consistent with generated data.
export interface ProductDef {
  category: string
  product: string
  unit: string
  qty: [number, number]
}

export const PRODUCT_CATALOG: ProductDef[] = [
  { category: 'Electronics', product: 'iPhone 15 Pro', unit: 'units', qty: [100, 600] },
  { category: 'Electronics', product: 'Samsung Galaxy S24 Ultra', unit: 'units', qty: [100, 600] },
  { category: 'Electronics', product: 'MacBook Air 13" M3', unit: 'units', qty: [50, 300] },
  { category: 'Electronics', product: 'iPad Air 11"', unit: 'units', qty: [80, 400] },
  { category: 'Electronics', product: 'Sony PlayStation 5', unit: 'units', qty: [60, 350] },
  { category: 'Electronics', product: 'LG OLED TV 55"', unit: 'units', qty: [30, 150] },
  { category: 'Electronics', product: 'Dell XPS 15 Laptop', unit: 'units', qty: [50, 250] },
  { category: 'Electronics', product: 'Bose QuietComfort Headphones', unit: 'units', qty: [150, 800] },
  { category: 'Textile', product: 'Cotton Fabric Rolls', unit: 'rolls', qty: [200, 900] },
  { category: 'Textile', product: 'Denim Jeans', unit: 'pcs', qty: [500, 3000] },
  { category: 'Textile', product: 'Batik Textile Bundles', unit: 'bundles', qty: [100, 500] },
  { category: 'Coffee Beans', product: 'Arabica Coffee Beans', unit: 'sacks (60kg)', qty: [200, 900] },
  { category: 'Coffee Beans', product: 'Robusta Coffee Beans', unit: 'sacks (60kg)', qty: [200, 900] },
  { category: 'Rubber', product: 'Natural Rubber Sheets', unit: 'bales', qty: [150, 700] },
  { category: 'Rubber', product: 'Rubber Vehicle Tires', unit: 'units', qty: [200, 1200] },
  { category: 'Machinery Parts', product: 'CNC Machine Spare Parts', unit: 'crates', qty: [20, 150] },
  { category: 'Machinery Parts', product: 'Diesel Engine Components', unit: 'crates', qty: [15, 100] },
  { category: 'Palm Oil Products', product: 'Crude Palm Oil (CPO)', unit: 'drums', qty: [100, 600] },
  { category: 'Palm Oil Products', product: 'Palm Kernel Oil', unit: 'drums', qty: [100, 600] },
  { category: 'Furniture', product: 'Teak Wood Dining Set', unit: 'sets', qty: [20, 120] },
  { category: 'Furniture', product: 'Rattan Chairs', unit: 'pcs', qty: [100, 500] },
  { category: 'Ceramics', product: 'Ceramic Floor Tiles', unit: 'boxes', qty: [300, 1500] },
  { category: 'Ceramics', product: 'Porcelain Tableware Sets', unit: 'sets', qty: [100, 600] },
  { category: 'Rice', product: 'Premium White Rice', unit: 'sacks (25kg)', qty: [400, 2000] },
  { category: 'Frozen Seafood', product: 'Frozen Shrimp', unit: 'cartons', qty: [150, 800] },
  { category: 'Frozen Seafood', product: 'Frozen Tuna Loin', unit: 'cartons', qty: [100, 600] },
]

export const PRODUCT_CATEGORIES: string[] = Array.from(new Set(PRODUCT_CATALOG.map((p) => p.category)))

export function skuFromProduct(product: string, index: number): string {
  const initials = product
    .replace(/["().]/g, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()
  return `SKU-${initials}-${index.toString().padStart(2, '0')}`
}
