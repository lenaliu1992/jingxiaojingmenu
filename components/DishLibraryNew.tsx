import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Search, Edit, X, Check, Filter, Settings } from 'lucide-react';
import { Dish, DishCategory, DISH_CATEGORIES, DishCategoryData } from '../types';
import { CategoryManagementDialog } from './CategoryManagementDialog';
import { categoriesApi } from '../services/api/categoriesApi';

interface DishLibraryProps {
  dishes: Dish[];
  onAddDish: (name: string, cost: number, price?: number, category?: DishCategory) => void;
  onDeleteDish: (id: string) => void;
  onUpdateDish: (id: string, name: string, cost: number, price?: number, category?: DishCategory) => void;
}

export const DishLibraryNew: React.FC<DishLibraryProps> = ({
  dishes,
  onAddDish,
  onDeleteDish,
  onUpdateDish,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | 'all'>('all');
  const [categories, setCategories] = useState<DishCategoryData[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; cost: string; price: string; category: DishCategory }>({
    name: '',
    cost: '',
    price: '',
    category: '其他',
  });

  // 批量操作状态
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [batchCategory, setBatchCategory] = useState<string>('');

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoriesApi.getAll();
        setCategories(cats);
      } catch (err: any) {
        console.error('加载分类失败:', err);
        // 如果API失败，使用默认分类
        const defaultCategories = Object.entries(DISH_CATEGORIES).map(([name, config], index) => ({
          id: `cat_${index + 1}`,
          name,
          icon: config.icon,
          color: config.color,
          description: config.description,
          sortOrder: index + 1,
          createdAt: Date.now() / 1000,
          updatedAt: Date.now() / 1000,
          source: 'initial' as const,
        }));
        setCategories(defaultCategories);
      }
    };
    loadCategories();
  }, []);

  // 新增菜品表单
  const [newDish, setNewDish] = useState({
    name: '',
    cost: '',
    price: '',
    category: '其他' as DishCategory,
  });

  // 过滤和分组菜品
  const { filteredDishes } = useMemo(() => {
    let filtered = dishes;

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.categoryName === selectedCategory);
    }

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return {
      filteredDishes: filtered,
    };
  }, [dishes, selectedCategory, searchTerm]);

  // 计算毛利率
  const calculateMargin = (cost: number, price?: number) => {
    if (!price) return null;
    return ((price - cost) / price) * 100;
  };

  // 批量更新分类
  const handleBatchUpdateCategory = () => {
    if (!batchCategory) return;

    selectedDishIds.forEach(id => {
      const dish = dishes.find(d => d.id === id);
      if (dish) {
        onUpdateDish(id, dish.name, dish.cost, dish.price, batchCategory as DishCategory);
      }
    });

    setSelectedDishIds(new Set());
    setBatchCategory('');
  };

  // 获取毛利率样式
  const getMarginStyle = (margin: number) => {
    if (margin >= 60) return 'margin-high';
    if (margin >= 40) return 'margin-medium';
    return 'margin-low';
  };

  // 开始编辑
  const handleStartEdit = (dish: Dish) => {
    setEditingDishId(dish.id);
    setEditForm({
      name: dish.name,
      cost: dish.cost.toString(),
      price: dish.price?.toString() || '',
      category: dish.categoryName || '其他',
    });
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.cost || !editingDishId) return;

    onUpdateDish(
      editingDishId,
      editForm.name,
      parseFloat(editForm.cost),
      editForm.price ? parseFloat(editForm.price) : undefined,
      editForm.category
    );

    setEditingDishId(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingDishId(null);
  };

  // 添加新菜品
  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.name.trim() || !newDish.cost) return;

    onAddDish(
      newDish.name,
      parseFloat(newDish.cost),
      newDish.price ? parseFloat(newDish.price) : undefined,
      newDish.category
    );

    setNewDish({ name: '', cost: '', price: '', category: '其他' });
  };

  return (
    <div className="dish-library">
      {/* 头部操作栏 */}
      <div className="library-header">
        <div className="header-title">
          <h2>菜品库</h2>
          <span className="dish-count">共 {dishes.length} 道菜品</span>
        </div>

        <div className="header-actions">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="btn btn-secondary"
            title="管理分类"
          >
            <Settings size={16} />
            分类设置
          </button>
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="搜索菜品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="library-content">
        {/* 左侧分类导航 */}
        <aside className="category-sidebar">
          <div className="category-header">
            <Filter size={18} />
            <span>菜品分类</span>
          </div>

          <div className="category-list">
            <button
              className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="category-icon">📋</span>
              <span className="category-name">全部菜品</span>
              <span className="category-count">{dishes.length}</span>
            </button>

            {categories.map((category) => {
              const count = dishes.filter(d => d.categoryId === category.id).length;

              return (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.name as DishCategory)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 右侧菜品列表 */}
        <main className="dish-main">
          {/* 快速添加表单 */}
          <div className="quick-add-form card animate-fadeIn">
            <form onSubmit={handleAddDish} className="add-form">
              <input
                type="text"
                placeholder="菜品名称"
                value={newDish.name}
                onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                className="input input-name"
                required
              />

              <select
                value={newDish.category}
                onChange={(e) => setNewDish({ ...newDish, category: e.target.value as DishCategory })}
                className="input input-category"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="成本"
                value={newDish.cost}
                onChange={(e) => setNewDish({ ...newDish, cost: e.target.value })}
                step="0.01"
                min="0"
                className="input input-cost"
                required
              />

              <input
                type="number"
                placeholder="售价（可选）"
                value={newDish.price}
                onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                step="0.01"
                min="0"
                className="input input-price"
              />

              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                添加
              </button>
            </form>
          </div>

          {/* 菜品表格 */}
          <div className="dish-table-container card animate-slideIn">
            {/* 批量操作工具栏 */}
            {selectedDishIds.size > 0 && (
              <div className="batch-toolbar card animate-fadeIn">
                <div className="batch-toolbar-content">
                  <span className="batch-info">
                    已选择 <strong>{selectedDishIds.size}</strong> 道菜品
                  </span>
                  <div className="batch-actions">
                    <select
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value)}
                      className="batch-category-select"
                    >
                      <option value="">选择新分类...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleBatchUpdateCategory}
                      disabled={!batchCategory}
                      className="btn btn-primary"
                    >
                      批量修改分类
                    </button>
                    <button
                      onClick={() => setSelectedDishIds(new Set())}
                      className="btn btn-secondary"
                    >
                      取消选择
                    </button>
                  </div>
                </div>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedDishIds.size === filteredDishes.length && filteredDishes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDishIds(new Set(filteredDishes.map(d => d.id)));
                        } else {
                          setSelectedDishIds(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th>菜品名称</th>
                  <th>分类</th>
                  <th>成本</th>
                  <th>售价</th>
                  <th>毛利率</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <div className="empty-content">
                        <p>暂无菜品数据</p>
                        <span className="empty-hint">请添加菜品或切换分类</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDishes.map((dish) => {
                    const isEditing = editingDishId === dish.id;
                    const margin = calculateMargin(dish.cost, dish.price);
                    const category = categories.find(c => c.name === (dish.categoryName || '其他'));

                    return (
                      <tr key={dish.id} className={`${isEditing ? 'editing' : ''} ${selectedDishIds.has(dish.id) ? 'selected' : ''}`}>
                        {isEditing ? (
                          <>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedDishIds.has(dish.id)}
                                onChange={() => {
                                  const newSelected = new Set(selectedDishIds);
                                  if (newSelected.has(dish.id)) {
                                    newSelected.delete(dish.id);
                                  } else {
                                    newSelected.add(dish.id);
                                  }
                                  setSelectedDishIds(newSelected);
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="input input-inline"
                                autoFocus
                              />
                            </td>
                            <td>
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as DishCategory })}
                                className="input input-inline"
                              >
                                {categories.map((category) => (
                                  <option key={category.id} value={category.name}>
                                    {category.icon} {category.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.cost}
                                onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                                step="0.01"
                                min="0"
                                className="input input-inline input-number"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                step="0.01"
                                min="0"
                                className="input input-inline input-number"
                                placeholder="可选"
                              />
                            </td>
                            <td>
                              <div className="edit-actions">
                                <button
                                  onClick={handleSaveEdit}
                                  className="btn btn-icon btn-ghost btn-success"
                                  title="保存"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="btn btn-icon btn-ghost btn-danger"
                                  title="取消"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                            <td></td>
                          </>
                        ) : (
                          <>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedDishIds.has(dish.id)}
                                onChange={() => {
                                  const newSelected = new Set(selectedDishIds);
                                  if (newSelected.has(dish.id)) {
                                    newSelected.delete(dish.id);
                                  } else {
                                    newSelected.add(dish.id);
                                  }
                                  setSelectedDishIds(newSelected);
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="dish-name">
                              {dish.name}
                            </td>
                            <td>
                              <span className="category-badge" style={{ backgroundColor: (category?.color || '#6b7280') + '20', color: category?.color || '#6b7280' }}>
                                {category?.icon || '🍽️'} {category?.name || '其他'}
                              </span>
                            </td>
                            <td className="cost">
                              ¥{dish.cost.toFixed(2)}
                            </td>
                            <td className="price">
                              {dish.price ? `¥${dish.price.toFixed(2)}` : '-'}
                            </td>
                            <td className="margin">
                              {margin !== null ? (
                                <div className="margin-cell">
                                  <div className={`margin-indicator ${getMarginStyle(margin)}`}>
                                    {margin.toFixed(1)}%
                                  </div>
                                  <div className="margin-bar">
                                    <div
                                      className="margin-bar-fill"
                                      style={{
                                        width: `${Math.min(margin, 100)}%`,
                                        backgroundColor:
                                          margin >= 60
                                            ? '#10b981'
                                            : margin >= 40
                                            ? '#f59e0b'
                                            : '#ef4444',
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="actions text-right">
                              <button
                                onClick={() => handleStartEdit(dish)}
                                className="btn btn-icon btn-ghost"
                                title="编辑"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => onDeleteDish(dish.id)}
                                className="btn btn-icon btn-ghost btn-danger"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* 分类管理弹窗 */}
      {categoryModalOpen && (
        <CategoryManagementDialog
          onClose={() => setCategoryModalOpen(false)}
          onUpdate={async () => {
            // 重新加载分类
            const cats = await categoriesApi.getAll();
            setCategories(cats);
          }}
        />
      )}
    </div>
  );
};
