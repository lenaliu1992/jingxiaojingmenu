import { AppData, PersistentDish, PersistentMealPlan, Dish, MealPlan, ValidationError, LoadResult } from '../types';

// 当前数据版本
const DATA_VERSION = '1.0.0';

/**
 * 导出数据为 JSON 文件
 */
export const exportToJson = (dishes: Dish[], meals: MealPlan[]): void => {
  const appData: AppData = {
    version: DATA_VERSION,
    appVersion: '1.0.0',
    savedAt: new Date().toISOString(),
    metadata: {
      totalDishes: dishes.length,
      totalMeals: meals.length,
    },
    data: {
      dishes: dishes.map(d => ({
        ...d,
        _source: 'user' as const,
      })),
      meals: meals.map(m => ({
        ...m,
        _source: 'user' as const,
      })),
    },
  };

  const jsonString = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `菜品毛利数据_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * 验证数据格式
 */
export const validateAppData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.version) {
    errors.push({
      field: 'version',
      expected: 'string',
      actual: typeof data.version,
      message: '缺少数据版本号',
    });
  }

  if (!data.data || typeof data.data !== 'object') {
    errors.push({
      field: 'data',
      expected: 'object',
      actual: typeof data.data,
      message: '缺少 data 字段',
    });
    return errors;
  }

  if (!Array.isArray(data.data.dishes)) {
    errors.push({
      field: 'data.dishes',
      expected: 'array',
      actual: typeof data.data.dishes,
      message: '菜品数据格式错误',
    });
  }

  if (!Array.isArray(data.data.meals)) {
    errors.push({
      field: 'data.meals',
      expected: 'array',
      actual: typeof data.data.meals,
      message: '套餐数据格式错误',
    });
  }

  return errors;
};

/**
 * 从 JSON 文件导入数据
 */
export const importFromJson = async (file: File): Promise<LoadResult> => {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);

    const errors = validateAppData(jsonData);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: jsonData };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'file',
        expected: 'valid JSON',
        actual: error,
        message: `文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }],
    };
  }
};

/**
 * 合并初始数据和用户数据
 */
export const mergeData = (
  initialDishes: Dish[],
  userDishes: PersistentDish[],
  initialMeals: MealPlan[],
  userMeals: PersistentMealPlan[]
): { dishes: Dish[]; meals: MealPlan[] } => {

  // 1. 菜品合并
  const mergedDishes = new Map<string, PersistentDish>();

  // 1.1 添加用户菜品
  userDishes.forEach(dish => {
    if (!dish._deleted) {
      mergedDishes.set(dish.id, dish);
    }
  });

  // 1.2 添加新的初始菜品（不在用户数据中的）
  initialDishes.forEach(initDish => {
    const matchedUserDish = userDishes.find(
      d => d._initialId === initDish.id || d.id === initDish.id
    );

    if (!matchedUserDish) {
      // 新增的初始菜品
      mergedDishes.set(initDish.id, {
        ...initDish,
        _source: 'initial',
        _initialId: initDish.id,
      });
    }
  });

  // 2. 套餐合并（类似逻辑）
  const mergedMeals = new Map<string, PersistentMealPlan>();

  userMeals.forEach(meal => {
    if (!meal._deleted) {
      mergedMeals.set(meal.id, meal);
    }
  });

  initialMeals.forEach(initMeal => {
    const matchedUserMeal = userMeals.find(
      m => m._initialId === initMeal.id || m.id === initMeal.id
    );

    if (!matchedUserMeal) {
      mergedMeals.set(initMeal.id, {
        ...initMeal,
        _source: 'initial',
        _initialId: initMeal.id,
      });
    }
  });

  // 3. 清理元数据（移除内部字段）
  const cleanDishes = Array.from(mergedDishes.values()).map(({ _source, _initialId, _deleted, ...dish }) => dish);
  const cleanMeals = Array.from(mergedMeals.values()).map(({ _source, _initialId, _deleted, ...meal }) => meal);

  return {
    dishes: cleanDishes,
    meals: cleanMeals,
  };
};
