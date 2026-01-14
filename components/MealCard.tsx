import React from 'react';
import { Trash2, Edit, AlertTriangle } from 'lucide-react';
import { MealPlanAnalysis, Dish } from '../types';

interface MealCardProps {
  meal: MealPlanAnalysis;
  dishes: Dish[];
  onDelete: (id: string) => void;
  onEdit: (meal: MealPlanAnalysis) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, dishes, onDelete, onEdit }) => {
  // Group dishes by ID to count quantities
  // Fixed: Removed generic type argument from reduce to avoid "Untyped function calls" error.
  // Using 'as Record<string, number>' on the initial value ensures correct type inference.
  const dishCounts = meal.dishIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 flex flex-col">
      <div className="p-5 border-b border-slate-50 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{meal.name}</h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(dishCounts).map(([id, count]) => {
              const dish = dishes.find(d => d.id === id);
              if (!dish) return null;
              return (
                <span key={id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                  {dish.name}
                  {/* Fixed: Cast count to number to resolve 'operator > cannot be applied to unknown and number' error */}
                  {(count as number) > 1 && <span className="bg-slate-200 px-1 rounded-md text-[10px] font-bold text-slate-700">x{count}</span>}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(meal)}
            className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(meal.id)}
            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div className="flex justify-between items-center text-slate-500 pb-2 border-b border-dashed border-slate-100 col-span-2">
          <span>总成本 (Total Cost)</span>
          <span className="font-mono font-medium text-slate-700">¥{meal.totalCost.toFixed(2)}</span>
        </div>

        {/* Standard Price Section Removed as requested */}

        {/* Promo 1 */}
        {meal.promoPrice1 > 0 && (
           <div className="col-span-2 flex justify-between items-center py-2 bg-purple-50/50 rounded-lg px-3 -mx-2">
             <div className="flex flex-col">
                <span className="text-xs text-purple-400">秒杀价 1</span>
                <span className="font-bold text-purple-800 text-lg">¥{meal.promoPrice1.toFixed(0)}</span>
             </div>
             {/* Profit Removed */}
             <div className="flex flex-col text-right">
                <span className="text-xs text-purple-400">毛利率</span>
                <span className={`font-bold text-lg ${meal.promoMargin1 < 20 ? 'text-rose-500' : 'text-purple-600'}`}>{meal.promoMargin1.toFixed(1)}%</span>
             </div>
           </div>
        )}

        {/* Promo 2 */}
        {meal.promoPrice2 > 0 && (
           <div className="col-span-2 flex justify-between items-center py-2 bg-amber-50/50 rounded-lg px-3 -mx-2">
             <div className="flex flex-col">
                <span className="text-xs text-amber-400">秒杀价 2</span>
                <span className="font-bold text-amber-800 text-lg">¥{meal.promoPrice2.toFixed(0)}</span>
             </div>
             {/* Profit Removed */}
             <div className="flex flex-col text-right">
                <span className="text-xs text-amber-400">毛利率</span>
                <span className={`font-bold text-lg ${meal.promoMargin2 < 15 ? 'text-rose-500' : 'text-amber-600'}`}>{meal.promoMargin2.toFixed(1)}%</span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};