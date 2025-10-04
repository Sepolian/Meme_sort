"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.connectDatabase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let db = null;
const connectDatabase = () => {
    if (db) {
        return db;
    }
    const dataDir = path_1.default.join(__dirname, '../../data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path_1.default.join(dataDir, 'database.sqlite');
    db = new better_sqlite3_1.default(dbPath);
    db.pragma('foreign_keys = ON');
    db.exec(`
        CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            ocr_text TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS image_tags (
            image_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (image_id, tag_id),
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
        CREATE INDEX IF NOT EXISTS idx_image_tags_image ON image_tags(image_id);
        CREATE INDEX IF NOT EXISTS idx_image_tags_tag ON image_tags(tag_id);
    `);
    try {
        db.exec('ALTER TABLE images ADD COLUMN vector TEXT');
    }
    catch (e) {
        if (!e.message.includes('duplicate column name')) {
            throw e;
        }
    }
    console.log(`SQLite database initialized at ${dbPath}`);
    return db;
};
exports.connectDatabase = connectDatabase;
const getDb = () => {
    if (!db) {
        throw new Error('Database connection has not been initialized. Call connectDatabase() first.');
    }
    return db;
};
exports.getDb = getDb;
