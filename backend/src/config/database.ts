import DatabaseConstructor from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

type DatabaseInstance = InstanceType<typeof DatabaseConstructor>;

let db: DatabaseInstance | null = null;

const connectDatabase = (): DatabaseInstance => {
    if (db) {
        return db;
    }

    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'database.sqlite');
    db = new DatabaseConstructor(dbPath);
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

    console.log(`SQLite database initialized at ${dbPath}`);
    return db;
};

const getDb = (): DatabaseInstance => {
    if (!db) {
        throw new Error('Database connection has not been initialized. Call connectDatabase() first.');
    }
    return db;
};

export { connectDatabase, getDb };