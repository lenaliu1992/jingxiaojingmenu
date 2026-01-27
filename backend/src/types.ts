// 菜品类型
export interface Dish {
  id: string;
  name: string;
  cost: number;
  price?: number;
  category_id?: string;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  source: 'initial' | 'user';
}

// 菜品分类类型
export interface DishCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  source: 'initial' | 'user';
}

// 套餐类型
export interface MealPlan {
  id: string;
  name: string;
  standard_price: number;
  promo_price1: number;
  promo_price2?: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  source: 'initial' | 'user';
  dishIds?: string[];
  dishes?: Dish[];
}

// 套餐菜品关联
export interface MealDish {
  id: string;
  meal_id: string;
  dish_id: string;
  dish_order: number;
  created_at: number;
}

// API 响应格式
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 创建菜品请求
export interface CreateDishRequest {
  name: string;
  cost: number;
  price?: number;
  category_id?: string;
}

// 更新菜品请求
export interface UpdateDishRequest {
  name?: string;
  cost?: number;
  price?: number;
  category?: string;
  category_id?: string;
}

// 创建分类请求
export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// 更新分类请求
export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

// 删除分类请求
export interface DeleteCategoryRequest {
  replace_with?: string;
}

// 创建套餐请求
export interface CreateMealRequest {
  name: string;
  dish_ids: string[];
  standard_price: number;
  promo_price1: number;
  promo_price2?: number;
  sort_order?: number;
}

// 更新套餐请求
export interface UpdateMealRequest {
  name?: string;
  dish_ids?: string[];
  standard_price?: number;
  promo_price1?: number;
  promo_price2?: number;
  sort_order?: number;
}

// 批量排序请求
export interface ReorderMealsRequest {
  meal_orders: Array<{ id: string; sort_order: number }>;
}

// 重复检查结果
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDish?: Dish;
}

// 批量导入请求
export interface BatchImportRequest {
  dishes: CreateDishRequest[];
  strategy: 'skip' | 'update' | 'create_all';
}

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
