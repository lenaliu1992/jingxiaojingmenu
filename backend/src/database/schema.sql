-- ==================== 菜品表 ====================
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost REAL NOT NULL,
  price REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  source TEXT CHECK(source IN ('initial', 'user')) DEFAULT 'user'
);

CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_deleted ON dishes(deleted_at);

-- ==================== 套餐表 ====================
CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  standard_price REAL NOT NULL,
  promo_price1 REAL NOT NULL,
  promo_price2 REAL,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  source TEXT CHECK(source IN ('initial', 'user')) DEFAULT 'user'
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_order ON meal_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_meal_plans_deleted ON meal_plans(deleted_at);

-- ==================== 套餐菜品关联表 ====================
CREATE TABLE IF NOT EXISTS meal_dishes (
  id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL,
  dish_id TEXT NOT NULL,
  dish_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (meal_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  UNIQUE(meal_id, dish_id, dish_order)
);

CREATE INDEX IF NOT EXISTS idx_meal_dishes_meal_id ON meal_dishes(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_dishes_dish_id ON meal_dishes(dish_id);

-- ==================== 系统配置表 ====================
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 初始化数据
INSERT OR IGNORE INTO app_metadata (key, value, updated_at) VALUES
  ('db_version', '1.0.0', strftime('%s', 'now')),
  ('data_version', '1.0.0', strftime('%s', 'now'));
