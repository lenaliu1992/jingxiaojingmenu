export interface Dish {
  id: string;
  name: string;
  cost: number;
  price?: number; // Original a la carte price (reference selling price)
  categoryId?: string; // 菜品分类ID
  categoryName?: string; // 菜品分类名称（用于显示和筛选）
  category?: DishCategoryData; // 菜品分类对象（可选，关联数据）
}

// 菜品分类数据
export interface DishCategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  source: 'initial' | 'user';
}

// 菜品分类枚举（保留用于向后兼容）
export type DishCategory =
  | '主食'      // 主食类
  | '青菜'      // 青菜类
  | '荤菜'      // 荤菜类
  | '汤类'      // 汤类
  | '饮品'      // 饮品类
  | '小吃'      // 小吃类
  | '海鲜'      // 海鲜类
  | '其他';     // 其他

// 菜品分类配置（默认配置，用于向后兼容）
/**
 * @deprecated 使用从API获取的分类数据
 */
export const DISH_CATEGORIES: Record<DishCategory, { icon: string; color: string; description: string }> = {
  '主食': { icon: '🍚', color: '#10b981', description: '米饭、面食等主食' },
  '青菜': { icon: '🥬', color: '#22c55e', description: '各类蔬菜菜品' },
  '荤菜': { icon: '🍖', color: '#ef4444', description: '肉类菜品' },
  '汤类': { icon: '🍲', color: '#f59e0b', description: '各种汤品' },
  '饮品': { icon: '🥤', color: '#3b82f6', description: '饮料、茶水' },
  '小吃': { icon: '🍢', color: '#8b5cf6', description: '小食、零食' },
  '海鲜': { icon: '🦐', color: '#06b6d4', description: '海鲜类菜品' },
  '其他': { icon: '🍽️', color: '#6b7280', description: '其他菜品' },
};

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

// 重复检查结果
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDish?: Dish;
}

// 导入策略
export type DishImportStrategy = 'skip' | 'update' | 'create_all';

// 批量导入结果
export interface BatchImportResult {
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
  };
  created: Dish[];
  updated: Dish[];
  skipped: string[];
}