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
  promoPrice2?: number; // 可选，undefined 表示未设置
  order?: number; // 排序顺序（可选）
}

export interface MealPlanAnalysis extends MealPlan {
  totalCost: number;
  totalOriginalPrice: number; // Sum of dish.price
  standardMargin: number; // percentage
  promoMargin1: number; // percentage
  promoMargin2?: number; // percentage，可选
  standardProfit: number;
  promoProfit1: number;
  promoProfit2?: number; // 可选
}

export interface CalculatedDish extends Dish {
  quantity?: number; // For future expansion, currently 1
}

// Excel 导入相关类型
export interface ImportResult {
  success: boolean;
  meals: Omit<MealPlan, 'id'>[];
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  type: 'MISSING_DISH' | 'INVALID_DATA' | 'MISSING_REQUIRED_FIELD';
  mealName?: string;
  dishName?: string;
  message: string;
  row?: number;
}

export interface ImportWarning {
  type: 'PRICE_MISMATCH' | 'COST_MISMATCH';
  mealName?: string;
  dishName?: string;
  message: string;
  expected?: number;
  actual?: number;
}

// 数据持久化相关类型
export interface AppData {
  version: string;           // 数据格式版本 (如 "1.0.0")
  appVersion: string;        // 保存时的应用版本
  savedAt: string;           // ISO 8601 时间戳
  metadata: {
    totalDishes: number;
    totalMeals: number;
  };
  data: {
    dishes: PersistentDish[];
    meals: PersistentMealPlan[];
  };
}

export interface PersistentDish extends Dish {
  _source?: 'initial' | 'user';  // 数据来源
  _initialId?: string;            // 对应初始数据的 ID
  _deleted?: boolean;             // 标记为已删除
}

export interface PersistentMealPlan extends MealPlan {
  _source?: 'initial' | 'user';
  _initialId?: string;
  _deleted?: boolean;
}

export interface ValidationError {
  field: string;
  expected: string;
  actual: any;
  message: string;
}

export interface LoadResult {
  success: boolean;
  data?: AppData;
  errors?: ValidationError[];
  warnings?: string[];
}