import React, { useState } from 'react';
import { X, Check, CheckSquare, Square } from 'lucide-react';
import { MealPlanAnalysis, Dish } from '../types';

interface ExportSelectionDialogProps {
  meals: MealPlanAnalysis[];
  dishes: Dish[];
  onExport: (selectedMeals: MealPlanAnalysis[]) => void;
  onClose: () => void;
}

export const ExportSelectionDialog: React.FC<ExportSelectionDialogProps> = ({
  meals,
  dishes,
  onExport,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 计算选中状态
  const allSelected = meals.length > 0 && selectedIds.size === meals.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;

  // 切换单个套餐选中状态
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(meals.map(m => m.id)));
    }
  };

  // 获取套餐的菜品信息
  const getMealDishInfo = (meal: MealPlanAnalysis) => {
    const dishCounts = meal.dishIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueDishCount = Object.keys(dishCounts).length;
    const totalDishCount = meal.dishIds.length;

    return { uniqueDishCount, totalDishCount };
  };

  // 处理导出
  const handleExport = () => {
    const selectedMeals = meals.filter(m => selectedIds.has(m.id));
    onExport(selectedMeals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">选择要导出的套餐</h2>
            <p className="text-sm text-slate-500 mt-1">
              已选择 {selectedCount} / {meals.length} 个套餐
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-4 h-4" />
                取消全选
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                全选
              </>
            )}
          </button>
        </div>

        {/* Content - 套餐列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {meals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              暂无套餐可导出
            </div>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => {
                const { uniqueDishCount, totalDishCount } = getMealDishInfo(meal);
                const isSelected = selectedIds.has(meal.id);

                return (
                  <div
                    key={meal.id}
                    onClick={() => toggleSelect(meal.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent/5 border-accent'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md border-2 border-slate-300" />
                      )}
                    </div>

                    {/* 套餐信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{meal.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>{uniqueDishCount} 种菜品</span>
                        <span>•</span>
                        <span>共 {totalDishCount} 份</span>
                        <span>•</span>
                        <span className="font-medium text-accent">
                          秒杀价 ¥{meal.promoPrice1.toFixed(0)}
                        </span>
                        {meal.promoPrice2 && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-amber-600">
                              特价 ¥{meal.promoPrice2.toFixed(0)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={selectedCount === 0}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              selectedCount > 0
                ? 'bg-accent hover:bg-accent/90'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            导出 {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
