import { apiClient } from './client';
import { Dish, DuplicateCheckResult, BatchImportResult } from '../../types';
import { toCamelCase } from './utils';

export interface CreateDishRequest {
  name: string;
  cost: number;
  price?: number;
}

export interface UpdateDishRequest {
  name?: string;
  cost?: number;
  price?: number;
  category?: string; // 分类名称
}

export const dishesApi = {
  /**
   * 获取所有菜品
   */
  getAll: async (options?: { includeDeleted?: boolean; search?: string }): Promise<Dish[]> => {
    const response = await apiClient.get('/dishes', { params: options });
    return response.data.map(toCamelCase);
  },

  /**
   * 获取单个菜品
   */
  getById: async (id: string): Promise<Dish> => {
    const response = await apiClient.get(`/dishes/${id}`);
    return toCamelCase(response.data);
  },

  /**
   * 创建菜品
   */
  create: async (data: CreateDishRequest): Promise<Dish> => {
    const response = await apiClient.post('/dishes', data);
    return toCamelCase(response.data);
  },

  /**
   * 更新菜品
   */
  update: async (id: string, data: UpdateDishRequest): Promise<Dish> => {
    const response = await apiClient.put(`/dishes/${id}`, data);
    return toCamelCase(response.data);
  },

  /**
   * 删除菜品
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/dishes/${id}`);
  },

  /**
   * 批量创建菜品
   */
  batchCreate: async (dishes: CreateDishRequest[]): Promise<Dish[]> => {
    const response = await apiClient.post('/dishes/batch', { dishes });
    return response.data.map(toCamelCase);
  },

  /**
   * 检查菜品是否重复
   */
  checkDuplicate: async (name: string, excludeId?: string): Promise<DuplicateCheckResult> => {
    const response = await apiClient.post('/dishes/check-duplicate', { name, excludeId });
    return toCamelCase(response.data);
  },

  /**
   * 批量导入菜品（支持重复处理策略）
   */
  batchImport: async (
    request: {
      dishes: CreateDishRequest[];
      strategy: 'skip' | 'update' | 'create_all';
    }
  ): Promise<BatchImportResult> => {
    const response = await apiClient.post('/dishes/batch/import', request);
    return toCamelCase(response.data);
  },
};
