export interface Dish {
  id: string;
  name: string;
  cost: number;
  price?: number; // Original a la carte price (reference selling price)
}

export interface MealPlan {
  id: string;
  name: string;
  dishIds: string[]; // References Dish.id
  standardPrice: number;
  promoPrice1: number;
  promoPrice2: number;
}

export interface MealPlanAnalysis extends MealPlan {
  totalCost: number;
  totalOriginalPrice: number; // Sum of dish.price
  standardMargin: number; // percentage
  promoMargin1: number; // percentage
  promoMargin2: number; // percentage
  standardProfit: number;
  promoProfit1: number;
  promoProfit2: number;
}

export interface CalculatedDish extends Dish {
  quantity?: number; // For future expansion, currently 1
}