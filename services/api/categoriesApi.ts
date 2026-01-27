import { apiClient } from './client';
import { DishCategoryData } from '../../types';
import { toCamelCase } from './utils';

export const categoriesApi = {
  getAll: async (): Promise<DishCategoryData[]> => {
    const response = await apiClient.get('/categories');
    return response.data.map(toCamelCase);
  },

  create: async (data: {
    name: string;
    icon?: string;
    color?: string;
    description?: string;
  }): Promise<DishCategoryData> => {
    const response = await apiClient.post('/categories', data);
    return toCamelCase(response.data);
  },

  update: async (
    id: string,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      description?: string;
    }
  ): Promise<DishCategoryData> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return toCamelCase(response.data);
  },

  delete: async (id: string, replaceWith?: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`, {
      data: { replace_with: replaceWith },
    });
  },

  reorder: async (orders: Array<{ id: string; sort_order: number }>): Promise<void> => {
    await apiClient.post('/categories/reorder', { orders });
  },
};
