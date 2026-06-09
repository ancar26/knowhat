export type OFFProduct = {
  name: string;
  brand: string;
  ingredients: string;
  nutrients: {
    calories?: number;
    sugar?: number;
    fat?: number;
    saturatedFat?: number;
    protein?: number;
    salt?: number;
    fiber?: number;
  };
  allergens: string[];
  nutriscore?: string;
};

export async function fetchOFFProduct(barcode: string): Promise<OFFProduct | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;
  const p = json.product;
  return {
    name: p.product_name || p.product_name_en || '',
    brand: p.brands || '',
    ingredients: p.ingredients_text || p.ingredients_text_en || '',
    nutrients: {
      calories: p.nutriments?.['energy-kcal_100g'],
      sugar: p.nutriments?.sugars_100g,
      fat: p.nutriments?.fat_100g,
      saturatedFat: p.nutriments?.['saturated-fat_100g'],
      protein: p.nutriments?.proteins_100g,
      salt: p.nutriments?.salt_100g,
      fiber: p.nutriments?.fiber_100g,
    },
    allergens: (p.allergens_tags || [])
      .map((t: string) => t.replace(/^en:/, ''))
      .filter(Boolean),
    nutriscore: p.nutriscore_grade,
  };
}
