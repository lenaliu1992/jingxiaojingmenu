import React, { useState } from 'react';
import { Plus, Trash2, Search, Package, Edit, X, Check } from 'lucide-react';
import { Dish } from '../types';

interface DishLibraryProps {
  dishes: Dish[];
  onAddDish: (name: string, cost: number, price?: number) => void;
  onDeleteDish: (id: string) => void;
  onUpdateDish: (id: string, name: string, cost: number, price?: number) => void;
}

export const DishLibrary: React.FC<DishLibraryProps> = ({
  dishes,
  onAddDish,
  onDeleteDish,
  onUpdateDish
}) => {
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 编辑状态
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCost) return;
    onAddDish(
      newName,
      parseFloat(newCost),
      newPrice ? parseFloat(newPrice) : undefined
    );
    setNewName('');
    setNewCost('');
    setNewPrice('');
  };

  const handleEdit = (dish: Dish) => {
    setEditingDishId(dish.id);
    setEditName(dish.name);
    setEditCost(dish.cost.toString());
    setEditPrice(dish.price ? dish.price.toString() : '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editCost || !editingDishId) return;
    onUpdateDish(
      editingDishId,
      editName,
      parseFloat(editCost),
      editPrice ? parseFloat(editPrice) : undefined
    );
    setEditingDishId(null);
    setEditName('');
    setEditCost('');
    setEditPrice('');
  };

  const handleCancelEdit = () => {
    setEditingDishId(null);
    setEditName('');
    setEditCost('');
    setEditPrice('');
  };

  const filteredDishes = dishes.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          菜品库 (Dish Library)
        </h2>
        <p className="text-xs text-slate-500 mt-1">输入菜品基础成本</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Add New Dish Form */}
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="菜品名称 (Name)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="¥原价(Price)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              step="0.01"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <input
              type="number"
              placeholder="¥成本(Cost)"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              step="0.01"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> 添加菜品
          </button>
        </form>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索菜品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-200 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {filteredDishes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              暂无菜品数据
            </div>
          ) : (
            filteredDishes.map(dish => (
              <div
                key={dish.id}
                className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {editingDishId === dish.id ? (
                  // 编辑表单
                  <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        step="0.01"
                        placeholder="原价"
                        className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      />
                      <input
                        type="number"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        step="0.01"
                        placeholder="成本"
                        className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1 bg-accent text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> 保存
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> 取消
                      </button>
                    </div>
                  </form>
                ) : (
                  // 显示模式
                  <>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{dish.name}</span>
                      <div className="flex gap-3 text-xs mt-0.5">
                        <span className="text-slate-500">原: ¥{dish.price ? dish.price.toFixed(1) : '-'}</span>
                        <span className="text-slate-500 font-bold">本: ¥{dish.cost.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(dish)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-accent hover:bg-emerald-50 rounded-md transition-all"
                        title="编辑"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteDish(dish.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
        <p className="text-xs text-center text-slate-400">
          共 {dishes.length} 个基础菜品
        </p>
      </div>
    </div>
  );
};
