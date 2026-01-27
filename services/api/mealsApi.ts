import { apiClient } from './client';
import { MealPlan } from '../../types';
import { toCamelCase } from './utils';

export interface CreateMealRequest {
  name: string;
  dish_ids: string[];
  standard_price: number;
  promo_price1: number;
  promo_price2?: number;
  sort_order?: number;
}

export interface UpdateMealRequest {
  name?: string;
  dish_ids?: string[];
  standard_price?: number;
  promo_price1?: number;
  promo_price2?: number;
  sort_order?: number;
}

export const mealsApi = {
  /**
   * 获取所有套餐（含菜品）
   */
  getAll: async (options?: { includeDishes?: boolean }): Promise<MealPlan[]> => {
    const response = await apiClient.get('/meals', {
      params: { include_dishes: true, ...options },
    });
    return response.data.map(toCamelCase);
  },

  /**
   * 获取单个套餐
   */
  getById: async (id: string): Promise<MealPlan> => {
    const response = await apiClient.get(`/meals/${id}`);
    return toCamelCase(response.data);
  },

  /**
   * 创建套餐
   */
  create: async (data: CreateMealRequest): Promise<MealPlan> => {
    const response = await apiClient.post('/meals', data);
    return toCamelCase(response.data);
  },

  /**
   * 更新套餐
   */
  update: async (id: string, data: UpdateMealRequest): Promise<MealPlan> => {
    const response = await apiClient.put(`/meals/${id}`, data);
    return toCamelCase(response.data);
  },

  /**
   * 删除套餐
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/meals/${id}`);
  },

  /**
   * 批量排序
   */
  reorder: async (mealOrders: Array<{ id: string; sort_order: number }>): Promise<void> => {
    await apiClient.put('/meals/reorder', { meal_orders: mealOrders });
  },
};
