export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  burgers: '/assets/images/fastfood_burger_showcase_1792492325630.jpg',
  pizzas: '/assets/images/fastfood_stonebaked_pizza_1792492327282.jpg',
  pizza: '/assets/images/fastfood_stonebaked_pizza_1792492327282.jpg',
  drinks: '/assets/images/drinks_beverages_showcase_1794393636290.jpg',
  desserts: '/assets/images/dessert_cakes_showcase_1794393637175.jpg',
  salads: '/assets/images/fresh_caesar_salad_1794393636950.jpg',
  chicken: '/assets/images/fastfood_crispy_chicken_1792492326694.jpg',
  shawarma: '/assets/images/fastfood_shawarma_wrap_1792492327241.jpg',
  fries: '/assets/images/fastfood_loaded_fries_1792492328422.jpg',
};

export const DEFAULT_FALLBACK_IMAGE = '/assets/images/fastfood_burger_showcase_1792492325630.jpg';

export function getFallbackImageForCategory(categoryId?: string): string {
  if (categoryId && CATEGORY_IMAGE_MAP[categoryId.toLowerCase()]) {
    return CATEGORY_IMAGE_MAP[categoryId.toLowerCase()];
  }
  return DEFAULT_FALLBACK_IMAGE;
}

export function resolveMenuItemImage(item: { imageUrl?: string; categoryId?: string }): string {
  if (
    item.imageUrl &&
    (item.imageUrl.startsWith('data:image/') ||
      item.imageUrl.startsWith('http://') ||
      item.imageUrl.startsWith('https://') ||
      item.imageUrl.startsWith('/assets/'))
  ) {
    return item.imageUrl;
  }
  return getFallbackImageForCategory(item.categoryId);
}
