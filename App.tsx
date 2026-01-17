import React, { useState, useMemo, useEffect } from 'react';
import { DishLibrary } from './components/DishLibrary';
import { MealCreator } from './components/MealCreator';
import { MealCard } from './components/MealCard';
import { ImportResultDialog } from './components/ImportResultDialog';
import { DataPersistenceControls } from './components/DataPersistenceControls';
import { LoadResultDialog } from './components/LoadResultDialog';
import { DishImportResultDialog } from './components/DishImportResultDialog';
import { Dish, MealPlan, MealPlanAnalysis, ImportResult, LoadResult } from './types';
import { exportToExcel, importFromExcel, importDishesFromExcel } from './services/excelService';
import { exportToJson, importFromJson as importDataFromJson, mergeData } from './services/dataPersistenceService';
import { dishesApi, mealsApi } from './services/api';
import { Plus, Download, Upload, ChefHat, LayoutGrid, List, RefreshCw } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Data from image
const INITIAL_DISHES: Dish[] = [
  { id: '1', name: '馋嘴土豆片', price: 29, cost: 5.8 },
  { id: '2', name: '撒娇辣子鸡', price: 58, cost: 13.85 },
  { id: '3', name: '手打鱼丸', price: 58, cost: 14.75 },
  { id: '4', name: '外婆红烧肉', price: 68, cost: 18.05 },
  { id: '5', name: '云南油焖鸡', price: 68, cost: 19.5 },
  { id: '6', name: '麻辣干锅鸭头', price: 78, cost: 23 },
  { id: '7', name: '手撕包菜', price: 22, cost: 6.6 },
  { id: '8', name: '梅菜扣肉', price: 48, cost: 14.65 },
  { id: '9', name: '静小静炒鸡', price: 68, cost: 21.8 },
  { id: '10', name: '有机花菜', price: 18, cost: 6 },
  { id: '11', name: '泉水玉米饭', price: 3, cost: 1 },
  { id: '12', name: '小炒黄牛肉', price: 58, cost: 19.8 },
  { id: '13', name: '超级海鲜桶（小份）', price: 98, cost: 35.5 },
  { id: '14', name: '海鲜毛血旺（小份）', price: 68, cost: 25 },
  { id: '15', name: '银耳汤', price: 5, cost: 1.85 },
  { id: '16', name: '小米虾滑', price: 38, cost: 14.5 },
  { id: '17', name: '蛋黄焗玉米', price: 22, cost: 8.5 },
  { id: '18', name: '螺丝椒炒云南土腊肠', price: 38, cost: 14.85 },
  { id: '19', name: '黑鸭煲', price: 42, cost: 16.5 },
  { id: '20', name: '辣子鸡', price: 58, cost: 22.8 },
  { id: '21', name: '清蒸蟹（大份）', price: 198, cost: 78 },
  { id: '22', name: '秘制蟹（小份）', price: 105, cost: 41.5 },
  { id: '23', name: '爆炒卤肥肠', price: 56, cost: 22.18 },
  { id: '24', name: '秘制虾尾', price: 108, cost: 42.95 },
  { id: '25', name: '招牌巴厘香蟹（大份）', price: 198, cost: 79.5 },
  { id: '26', name: '山楂小排', price: 68, cost: 27.5 },
  { id: '27', name: '梅干菜烧鸡爪', price: 56, cost: 22.8 },
  { id: '28', name: '蒜蓉粉丝虾', price: 48, cost: 19.55 },
  { id: '29', name: '沸腾鱼（小份）', price: 62, cost: 25.5 },
  { id: '30', name: '秘制蟹（大份）', price: 198, cost: 83 },
  { id: '31', name: '花生煲鸡爪', price: 56, cost: 23.5 },
  { id: '32', name: '金汤肥牛（大份）', price: 98, cost: 41.8 },
  { id: '33', name: '柠檬酸菜鱼（大份）', price: 90, cost: 38.5 },
  { id: '34', name: '清蒸蟹（小份）', price: 105, cost: 45.5 },
  { id: '35', name: '吮指猪蹄', price: 68, cost: 29.8 },
  { id: '36', name: '沸腾鱼（大份）', price: 90, cost: 39.5 },
  { id: '37', name: '超级海鲜桶（大份）', price: 168, cost: 74 },
  { id: '38', name: '脱骨金沙带鱼（小份）', price: 49, cost: 21.75 },
  { id: '39', name: '酱汁笋尖', price: 32, cost: 14.5 },
  { id: '40', name: '胶原海笋', price: 15, cost: 6.85 },
  { id: '41', name: '干锅鹿茸菌', price: 48, cost: 22.5 },
  { id: '42', name: '西红柿炖牛腩', price: 68, cost: 32 },
  { id: '43', name: '黄焖山羊排', price: 78, cost: 36.8 },
  { id: '44', name: '脱骨金沙带鱼（大份）', price: 90, cost: 43.15 },
  { id: '45', name: '泼辣肥牛', price: 78, cost: 39.2 },
  { id: '46', name: '招牌巴厘香蟹（小份）', price: 105, cost: 54 },
  { id: '47', name: '蒜蓉油麦菜', price: 16, cost: 8.35 },
  { id: '48', name: '蒜蓉深海黄鱼', price: 22, cost: 14.45 }
];

// 数据迁移函数：将旧数据中 promoPrice2 === 0 的转为 undefined
const migrateMealData = (meals: MealPlan[]): MealPlan[] => {
  return meals.map(meal => ({
    ...meal,
    // 如果 promoPrice2 为 0 或不存在，设为 undefined
    promoPrice2: (meal.promoPrice2 || 0) > 0 ? meal.promoPrice2 : undefined,
  }));
};

const INITIAL_MEALS: MealPlan[] = migrateMealData([
  {
    id: 'm1',
    name: '超值双人餐 (示例)',
    dishIds: ['2', '12', '10', '11'],
    standardPrice: 128,
    promoPrice1: 99,
    promoPrice2: 88
  }
]);

export default function App() {
  // API 配置
  const useApi = import.meta.env.VITE_USE_API === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 数据状态
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [meals, setMeals] = useState<MealPlan[]>(INITIAL_MEALS);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [importDialog, setImportDialog] = useState<{
    show: boolean;
    result: ImportResult | null;
  }>({ show: false, result: null });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [loadResult, setLoadResult] = useState<{ result: LoadResult; fileName: string } | null>(null);
  const [dishImportResult, setDishImportResult] = useState<{
    success: boolean;
    dishCount: number;
    errors: string[];
  } | null>(null);
  const [isImportingDishes, setIsImportingDishes] = useState(false);

  const loadFromApi = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dishesData, mealsData] = await Promise.all([
        dishesApi.getAll(),
        mealsApi.getAll(),
      ]);

      // API 层已经处理了字段名转换，直接使用
      setDishes(dishesData);
      setMeals(mealsData);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('加载数据失败:', err);
      setError(err.message);
      // 如果 API 失败，回退到本地数据
      setDishes(INITIAL_DISHES);
      setMeals(INITIAL_MEALS);
    } finally {
      setLoading(false);
    }
  };

  // 从 API 加载初始数据
  useEffect(() => {
    if (useApi) {
      loadFromApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 追踪数据变更
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [dishes, meals]);

  // 页面关闭提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 更新页面标题
  useEffect(() => {
    const prefix = hasUnsavedChanges ? '* ' : '';
    document.title = `${prefix}MarginMaster - 餐饮团购毛利测算系统`;
  }, [hasUnsavedChanges]);

  // Derived State: Calculate analytics for all meals
  const analyzedMeals: MealPlanAnalysis[] = useMemo(() => {
    // 按 order 字段排序，如果没有 order 则放在最后
    const sortedMeals = [...meals].sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      return orderA - orderB;
    });

    return sortedMeals.map(meal => {
      let totalCost = 0;
      let totalOriginalPrice = 0;

      meal.dishIds.forEach(id => {
        const dish = dishes.find(d => d.id === id);
        if (dish) {
          totalCost += dish.cost || 0;
          totalOriginalPrice += dish.price || 0;
        }
      });

      const calcMargin = (price: number, cost: number) => {
        if (price <= 0) return 0;
        return ((price - cost) / price) * 100;
      };

      return {
        ...meal,
        totalCost,
        totalOriginalPrice,
        standardProfit: meal.standardPrice - totalCost,
        standardMargin: calcMargin(meal.standardPrice, totalCost),
        promoProfit1: meal.promoPrice1 - totalCost,
        promoMargin1: calcMargin(meal.promoPrice1, totalCost),
        // 只有当 promoPrice2 存在时才计算相关指标
        promoProfit2: meal.promoPrice2 !== undefined
          ? meal.promoPrice2 - totalCost
          : undefined,
        promoMargin2: meal.promoPrice2 !== undefined
          ? calcMargin(meal.promoPrice2, totalCost)
          : undefined,
      };
    });
  }, [meals, dishes]);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = meals.findIndex((item) => item.id === active.id);
      const newIndex = meals.findIndex((item) => item.id === over.id);

      // 乐观更新：先更新 UI
      const newItems = arrayMove(meals, oldIndex, newIndex);
      const reorderedMeals = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));
      setMeals(reorderedMeals);

      // 同步到后端
      if (useApi) {
        try {
          const mealOrders = reorderedMeals.map(m => ({
            id: m.id,
            sort_order: m.order || 0,
          }));
          await mealsApi.reorder(mealOrders);
        } catch (err: any) {
          alert(`排序失败: ${err.message}`);
          // 回滚到原状态
          setMeals(meals);
        }
      } else {
        setHasUnsavedChanges(true);
      }
    }
  };

  // 创建可排序的套餐卡片组件
  const SortableMealCard = ({ meal, index }: { meal: MealPlanAnalysis; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: meal.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <MealCard
          meal={meal}
          dishes={dishes}
          onDelete={handleDeleteMeal}
          onEdit={openCreatorForEdit}
          dragHandleProps={{
            ...attributes,
            ...listeners,
          }}
        />
      </div>
    );
  };

  const handleAddDish = async (name: string, cost: number, price?: number) => {
    if (useApi) {
      try {
        const newDish = await dishesApi.create({ name, cost, price });
        setDishes([newDish, ...dishes]);
      } catch (err: any) {
        alert(`创建菜品失败: ${err.message}`);
      }
    } else {
      const newDish: Dish = {
        id: Date.now().toString(),
        name,
        cost,
        price
      };
      setDishes([newDish, ...dishes]);
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (meals.some(m => m.dishIds.includes(id))) {
      alert("无法删除：该菜品已被包含在现有套餐中，请先修改或删除对应套餐。");
      return;
    }
    if (useApi) {
      try {
        await dishesApi.delete(id);
        setDishes(dishes.filter(d => d.id !== id));
      } catch (err: any) {
        alert(`删除菜品失败: ${err.message}`);
      }
    } else {
      setDishes(dishes.filter(d => d.id !== id));
    }
  };

  const handleUpdateDish = async (id: string, name: string, cost: number, price?: number) => {
    if (useApi) {
      try {
        const updatedDish = await dishesApi.update(id, { name, cost, price });
        // API 返回的数据格式已经是正确的（Dish 类型），直接使用
        setDishes(dishes.map(d =>
          d.id === id ? updatedDish : d
        ));
      } catch (err: any) {
        alert(`更新菜品失败: ${err.message}`);
      }
    } else {
      setDishes(dishes.map(d =>
        d.id === id
          ? { ...d, name, cost, price }
          : d
      ));
    }
  };

  const handleSaveMeal = async (mealData: Omit<MealPlan, 'id'>) => {
    if (useApi) {
      try {
        if (editingMeal) {
          // Update existing
          const updatedMeal = await mealsApi.update(editingMeal.id, {
            name: mealData.name,
            dish_ids: mealData.dishIds,
            standard_price: mealData.standardPrice,
            promo_price1: mealData.promoPrice1,
            promo_price2: mealData.promoPrice2,
            sort_order: mealData.order,
          });
          setMeals(meals.map(m => m.id === editingMeal.id ? updatedMeal : m));
        } else {
          // Create new
          const newMeal = await mealsApi.create({
            name: mealData.name,
            dish_ids: mealData.dishIds,
            standard_price: mealData.standardPrice,
            promo_price1: mealData.promoPrice1,
            promo_price2: mealData.promoPrice2,
            sort_order: mealData.order,
          });
          setMeals([newMeal, ...meals]);
        }
        closeCreator();
      } catch (err: any) {
        alert(`保存套餐失败: ${err.message}`);
      }
    } else {
      if (editingMeal) {
        // Update existing
        setMeals(meals.map(m => m.id === editingMeal.id ? { ...mealData, id: editingMeal.id } : m));
      } else {
        // Create new
        const newMeal: MealPlan = {
          ...mealData,
          id: Date.now().toString(),
        };
        setMeals([newMeal, ...meals]);
      }
      closeCreator();
    }
  };

  const openCreatorForEdit = (meal: MealPlan) => {
    setEditingMeal(meal);
    setIsCreatorOpen(true);
  };

  const closeCreator = () => {
    setIsCreatorOpen(false);
    setEditingMeal(null);
  }

  const handleDeleteMeal = async (id: string) => {
    if (window.confirm("确定要删除这个套餐方案吗?")) {
      if (useApi) {
        try {
          await mealsApi.delete(id);
          setMeals(meals.filter(m => m.id !== id));
        } catch (err: any) {
          alert(`删除套餐失败: ${err.message}`);
        }
      } else {
        setMeals(meals.filter(m => m.id !== id));
      }
    }
  };

  const handleExport = () => {
    if (analyzedMeals.length === 0) {
      alert('没有套餐数据可以导出，请先创建套餐');
      return;
    }
    try {
      exportToExcel(analyzedMeals, dishes);
    } catch (error) {
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('导出错误:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 调用导入函数
    const result = await importFromExcel(file, dishes);

    // 显示结果对话框
    setImportDialog({ show: true, result });

    // 如果成功，添加套餐
    if (result.success && result.meals.length > 0) {
      if (useApi) {
        // API 模式：逐个保存到数据库
        try {
          const createdMeals: MealPlan[] = [];
          for (const meal of result.meals) {
            const createdMeal = await mealsApi.create({
              name: meal.name,
              dish_ids: meal.dishIds,
              standard_price: meal.standardPrice,
              promo_price1: meal.promoPrice1,
              promo_price2: meal.promoPrice2,
              sort_order: meal.order || 0,
            });
            createdMeals.push(createdMeal);
          }
          setMeals([...createdMeals, ...meals]);
        } catch (err: any) {
          alert(`导入套餐失败: ${err.message}`);
        }
      } else {
        // 本地模式：直接添加到状态
        const newMeals: MealPlan[] = result.meals.map(meal => ({
          ...meal,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        setMeals([...newMeals, ...meals]);
      }
    }

    // 重置文件输入
    e.target.value = '';
  };

  // 保存数据到本地文件
  const handleSaveData = () => {
    exportToJson(dishes, meals);
    setHasUnsavedChanges(false);
    setLastSaveTime(new Date());
  };

  // 从本地文件加载数据
  const handleLoadData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importDataFromJson(file);

    setLoadResult({ result, fileName: file.name });

    if (result.success && result.data) {
      // 合并数据
      const { dishes: mergedDishes, meals: mergedMeals } = mergeData(
        INITIAL_DISHES,
        result.data.data.dishes,
        INITIAL_MEALS,
        result.data.data.meals
      );

      if (useApi) {
        // API 模式：保存到数据库
        try {
          // 批量创建菜品
          await dishesApi.batchCreate(
            mergedDishes.map(d => ({
              name: d.name,
              cost: d.cost,
              price: d.price,
            }))
          );

          // 批量创建套餐
          for (const meal of mergedMeals) {
            await mealsApi.create({
              name: meal.name,
              dish_ids: meal.dishIds,
              standard_price: meal.standardPrice,
              promo_price1: meal.promoPrice1,
              promo_price2: meal.promoPrice2,
              sort_order: meal.order || 0,
            });
          }

          // 重新加载数据
          await loadFromApi();
        } catch (err: any) {
          alert(`加载数据失败: ${err.message}`);
        }
      } else {
        // 本地模式：直接更新状态
        setDishes(mergedDishes);
        setMeals(mergedMeals);
        setHasUnsavedChanges(false);
      }
    }

    // 重置文件输入
    e.target.value = '';
  };

  // 导入菜品库
  const handleImportDishes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 开始导入
    setIsImportingDishes(true);
    setDishImportResult(null); // 清除之前的结果

    try {
      // 步骤 1: 解析 Excel
      const excelResult = await importDishesFromExcel(file);

      // 如果 Excel 解析失败，立即显示错误
      if (!excelResult.success || excelResult.dishes.length === 0) {
        setDishImportResult({
          success: false,
          dishCount: 0,
          errors: excelResult.errors,
        });
        return;
      }

      // 步骤 2: 保存到后端/存储
      if (useApi) {
        // API 模式：先保存再显示成功
        try {
          const createdDishes = await dishesApi.batchCreate(
            excelResult.dishes.map(d => ({
              name: d.name,
              cost: d.cost,
              price: d.price,
            }))
          );

          // 只有 API 成功后才显示成功弹窗
          setDishes(createdDishes);
          setMeals([]);
          setDishImportResult({
            success: true,
            dishCount: createdDishes.length,
            errors: [],
          });
        } catch (err: any) {
          // API 失败：显示详细错误，而不是成功
          setDishImportResult({
            success: false,
            dishCount: 0,
            errors: [
              `Excel 解析成功（${excelResult.dishes.length} 个菜品），但保存到服务器失败`,
              `错误详情: ${err.message || '未知错误'}`,
              '请检查网络连接或联系管理员'
            ],
          });
        }
      } else {
        // 本地模式：立即显示成功（因为没有 API 调用）
        setDishes(excelResult.dishes);
        setMeals([]);
        setHasUnsavedChanges(true);
        setDishImportResult({
          success: true,
          dishCount: excelResult.dishes.length,
          errors: [],
        });
      }
    } catch (err: any) {
      // 捕获意外错误
      setDishImportResult({
        success: false,
        dishCount: 0,
        errors: [`导入过程发生错误: ${err.message || '未知错误'}`],
      });
    } finally {
      // 总是清除加载状态和文件输入
      setIsImportingDishes(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar: Dish Library */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-200 bg-white z-10 hidden md:block">
        <div className="h-full p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700">菜品库</h2>
            <button
              onClick={() => {
                if (!isImportingDishes) {
                  document.getElementById('dish-import-input')?.click();
                }
              }}
              disabled={isImportingDishes}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isImportingDishes
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              }`}
              title={isImportingDishes ? '正在导入...' : '从 Excel 导入菜品'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isImportingDishes ? 'animate-spin' : ''}`} />
              <span>{isImportingDishes ? '导入中...' : '导入'}</span>
            </button>
            <input
              id="dish-import-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportDishes}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <DishLibrary
              dishes={dishes}
              onAddDish={handleAddDish}
              onDeleteDish={handleDeleteDish}
              onUpdateDish={handleUpdateDish}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">MarginMaster</h1>
              <p className="text-xs text-slate-500 font-medium">餐饮团购毛利测算系统</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* View Toggles (Visual only for now) */}
             <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
             </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-accent hover:border-accent transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">导出 Excel</span>
            </button>
            <button
              onClick={() => document.getElementById('excel-upload-input')?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-600 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">导入 Excel</span>
            </button>
            <input
              id="excel-upload-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />

            {/* Data Persistence Controls */}
            <DataPersistenceControls
              hasUnsavedChanges={hasUnsavedChanges}
              onSave={handleSaveData}
              onLoad={handleLoadData}
            />
            <button 
              onClick={() => setIsCreatorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新建套餐</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          
          {/* Empty State */}
          {meals.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ChefHat className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-lg font-medium">还没有创建任何套餐</p>
              <p className="text-sm">点击右上角 "新建套餐" 开始测算</p>
            </div>
          )}

          {/* Grid Layout */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={analyzedMeals.map(meal => meal.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {analyzedMeals.map((meal, index) => (
                  <SortableMealCard
                    key={meal.id}
                    meal={meal}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

      </main>

      {/* Modal */}
      {isCreatorOpen && (
        <MealCreator
          dishes={dishes}
          initialData={editingMeal}
          onSave={handleSaveMeal}
          onCancel={closeCreator}
        />
      )}

      {/* Import Result Dialog */}
      {importDialog.show && importDialog.result && (
        <ImportResultDialog
          result={importDialog.result}
          onClose={() => setImportDialog({ show: false, result: null })}
        />
      )}

      {/* Load Result Dialog */}
      {loadResult && (
        <LoadResultDialog
          result={loadResult.result}
          fileName={loadResult.fileName}
          onClose={() => setLoadResult(null)}
        />
      )}

      {/* Dish Import Result Dialog */}
      {dishImportResult && (
        <DishImportResultDialog
          success={dishImportResult.success}
          dishCount={dishImportResult.dishCount}
          errors={dishImportResult.errors}
          onClose={() => setDishImportResult(null)}
        />
      )}
    </div>
  );
}