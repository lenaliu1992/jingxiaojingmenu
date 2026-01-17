import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../data/margin-master.db');
const SCHEMA_PATH = join(__dirname, '../database/schema.sql');

let db: Database | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * 初始化数据库连接
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  // 初始化 sql.js
  SQL = await initSqlJs();

  // 尝试从文件加载数据库
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ 数据库已从文件加载');
  } else {
    // 创建新数据库
    db = new SQL.Database();
    console.log('✅ 新数据库已创建');

    // 读取并执行 schema
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    db.run(schema);
    console.log('✅ 数据库表结构已初始化');

    // 保存到文件
    saveDatabase();
  }

  return db;
}

/**
 * 保存数据库到文件
 */
export function saveDatabase(): void {
  if (!db) {
    throw new Error('数据库未初始化');
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}

/**
 * 执行查询并返回结果
 */
export function executeQuery<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const results: T[] = [];

  const stmt = db.prepare(sql);
  stmt.bind(params);

  while (stmt.step()) {
    const row = stmt.getAsObject() as T;
    results.push(row);
  }

  stmt.free();
  return results;
}

/**
 * 执行更新操作（INSERT/UPDATE/DELETE）
 */
export function executeUpdate(sql: string, params: any[] = []): void {
  const db = getDatabase();
  db.run(sql, params);
}

/**
 * 执行更新操作并返回最后插入的 ID
 */
export function executeInsert(sql: string, params: any[] = []): any {
  const db = getDatabase();
  db.run(sql, params);

  // sql.js 使用 lastInsertRowId 获取最后插入的行 ID
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const result = stmt.getAsObject() as { id: number };
  stmt.free();

  return result.id;
}

/**
 * 获取当前时间戳（秒）
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 优雅关闭数据库
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('✅ 数据库已关闭');
  }
}
