import React, { useState, useMemo, useEffect } from 'react';
import { X, Calculator, ShoppingBag, Search, Plus, Minus } from 'lucide-react';
import { Dish, MealPlan } from '../types';

interface MealCreatorProps {
  dishes: Dish[];
  initialData?: MealPlan | null; // Added for edit mode
  onSave: (meal: Omit<MealPlan, 'id'>) => void;
  onCancel: () => void;
}

export const MealCreator: React.FC<MealCreatorProps> = ({ dishes, initialData, onSave, onCancel }) => {
  const [name, setName] = useState('');
  // Map of DishID -> Quantity
  const [selectedDishes, setSelectedDishes] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [promoPrice1, setPromoPrice1] = useState<number | ''>('');
  const [promoPrice2, setPromoPrice2] = useState<number | ''>('');

  // Initialize state if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPromoPrice1(initialData.promoPrice1);
      setPromoPrice2(initialData.promoPrice2);
      
      // Reconstruct dish map from flat array
      const dishMap = new Map<string, number>();
      initialData.dishIds.forEach(id => {
        dishMap.set(id, (dishMap.get(id) || 0) + 1);
      });
      setSelectedDishes(dishMap);
    }
  }, [initialData]);

  // Filter dishes based on search
  const filteredDishes = useMemo(() => {
    return dishes.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [dishes, searchTerm]);

  // Calculate stats in real-time
  const { totalCost, totalOriginalPrice } = Array.from(selectedDishes.entries()).reduce<{ totalCost: number; totalOriginalPrice: number }>(
    (acc, [id, qty]) => {
      const dish = dishes.find((d) => d.id === id);
      if (dish) {
        acc.totalCost += dish.cost * qty;
        acc.totalOriginalPrice += (dish.price || 0) * qty;
      }
      return acc;
    },
    { totalCost: 0, totalOriginalPrice: 0 }
  );

  const calculateMargin = (price: number | '') => {
    const p = typeof price === 'number' ? price : 0;
    if (p <= 0) return 0;
    return ((p - totalCost) / p) * 100;
  };

  const calculateDiscount = (price: number | '') => {
    const p = typeof price === 'number' ? price : 0;
    if (p <= 0 || totalOriginalPrice <= 0) return 0;
    return (p / totalOriginalPrice) * 10;
  };

  const toggleDish = (id: string) => {
    const newMap = new Map(selectedDishes);
    if (newMap.has(id)) {
      newMap.delete(id);
    } else {
      newMap.set(id, 1);
    }
    setSelectedDishes(newMap);
  };

  const updateQuantity = (id: string, delta: number) => {
    const newMap = new Map<string, number>(selectedDishes);
    const currentQty = newMap.get(id) || 0;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
      newMap.delete(id);
    } else {
      newMap.set(id, newQty);
    }
    setSelectedDishes(newMap);
  };

  const handleSave = () => {
    if (!name || selectedDishes.size === 0 || !promoPrice1) {
      alert("请填写套餐名称、选择至少一个菜品并设置秒杀价 1");
      return;
    }

    // Convert Map (ID -> Qty) to flat Array of IDs (['id1', 'id1', 'id2'])
    const dishIds: string[] = [];
    selectedDishes.forEach((qty, id) => {
      for (let i = 0; i < qty; i++) {
        dishIds.push(id);
      }
    });

    onSave({
      name,
      dishIds,
      standardPrice: 0, 
      promoPrice1: Number(promoPrice1) || 0,
      promoPrice2: Number(promoPrice2) || 0,
    });
  };

  // Get list of selected dishes for display
  const selectedDishesList = Array.from(selectedDishes.entries()).map(([id, qty]) => {
    const dish = dishes.find(d => d.id === id);
    return dish ? { ...dish, qty } : null;
  }).filter(Boolean) as (Dish & { qty: number })[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-accent" />
              {initialData ? '编辑团购套餐 (Edit Meal Plan)' : '新建团购套餐 (Create Meal Plan)'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">选择菜品组合，设定价格并分析毛利</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Dish Selection */}
          <div className="w-full md:w-1/2 bg-slate-50 p-6 overflow-y-auto custom-scrollbar border-r border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                选择菜品 (Select Dishes)
              </h3>
              <span className="text-xs text-slate-400 font-normal">已选品种: {selectedDishes.size}</span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索菜品名称..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto pr-1">
              {filteredDishes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  未找到匹配菜品
                </div>
              ) : (
                filteredDishes.map(dish => {
                  const qty = selectedDishes.get(dish.id) || 0;
                  const isSelected = qty > 0;
                  
                  return (
                    <div 
                      key={dish.id} 
                      className={`flex flex-col p-3 rounded-lg border transition-all ${
                        isSelected 
                        ? 'bg-white border-accent shadow-sm ring-1 ring-accent' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Checkbox and Info */}
                      <div className="flex items-center cursor-pointer" onClick={() => toggleDish(dish.id)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent text-white' : 'bg-white border-slate-300'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="ml-3 flex-1 flex justify-between items-center">
                          <span className={`text-sm ${isSelected ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                            {dish.name}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-mono text-slate-400">
                              {dish.price ? `¥${dish.price}` : '-'} / <span className="font-bold text-slate-500">¥{dish.cost}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Quantity Controls (Only if selected) */}
                      {isSelected && (
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 animate-in slide-in-from-top-1">
                           <span className="text-xs text-slate-400 font-medium pl-1">数量 (Qty):</span>
                           <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateQuantity(dish.id, -1); }}
                               className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                             >
                               <Minus className="w-3 h-3" />
                             </button>
                             <span className="w-6 text-center text-sm font-bold text-slate-800">{qty}</span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateQuantity(dish.id, 1); }}
                               className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                             >
                               <Plus className="w-3 h-3" />
                             </button>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Pricing & Analysis */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar bg-white">
            <div className="space-y-6">
              
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">套餐名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                  placeholder="例如：双人超值烤肉餐"
                />
              </div>

              {/* Selected Dishes & Cost Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-2">已选菜品清单</span>
                <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto custom-scrollbar">
                   {selectedDishesList.length > 0 ? (
                    selectedDishesList.map(item => (
                       <span key={item.id} className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-1">
                         {item.name}
                         {item.qty > 1 && <span className="bg-emerald-100 text-emerald-700 px-1 rounded text-[10px]">x{item.qty}</span>}
                       </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">请选择左侧菜品...</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">组合总原价 (Value)</span>
                    <span className="text-lg font-bold font-mono text-slate-600">¥{totalOriginalPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">组合总成本 (Cost)</span>
                    <span className="text-lg font-bold font-mono text-slate-800">¥{totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 gap-6">
                
                {/* Promo Price 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                  <label className="block text-sm font-bold text-purple-700 mb-2">秒杀价 1</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                      <input
                        type="number"
                        value={promoPrice1}
                        onChange={(e) => setPromoPrice1(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <span className={`text-xl font-bold font-mono ${calculateMargin(promoPrice1) < 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {calculateMargin(promoPrice1).toFixed(1)}%
                      </span>
                      {promoPrice1 && totalOriginalPrice > 0 && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          {calculateDiscount(promoPrice1).toFixed(1)}折
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Promo Price 2 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                  <label className="block text-sm font-bold text-amber-700 mb-2">秒杀价 2</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                      <input
                        type="number"
                        value={promoPrice2}
                        onChange={(e) => setPromoPrice2(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <span className={`text-xl font-bold font-mono ${calculateMargin(promoPrice2) < 15 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {calculateMargin(promoPrice2).toFixed(1)}%
                      </span>
                      {promoPrice2 && totalOriginalPrice > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {calculateDiscount(promoPrice2).toFixed(1)}折
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {initialData ? '更新配置' : '保存套餐配置'}
          </button>
        </div>
      </div>
    </div>
  );
};