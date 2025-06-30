export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price?: number;
  currency?: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SWHu085giVe5E9',
    priceId: 'price_1RbFKe6jkH9kw0I9LodvGwBV',
    name: 'SuperNote Premium',
    description: 'Đồng bộ dữ liệu note lên server',
    mode: 'payment',
    price: 100, // $1.00 in cents
    currency: 'usd',
  },
];

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find((product) => product.id === id);
}

export function getProductByPriceId(
  priceId: string,
): StripeProduct | undefined {
  return stripeProducts.find((product) => product.priceId === priceId);
}
