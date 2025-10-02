"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const database_1 = require("../config/database");
class Tag {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    static async create(name) {
        const db = (0, database_1.getDb)();
        const normalized = name.trim();
        const id = (0, crypto_1.randomUUID)();
        const statement = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
        statement.run(id, normalized);
        return new Tag(id, normalized);
    }
    static async findById(id) {
        const db = (0, database_1.getDb)();
        const row = db
            .prepare('SELECT id, name FROM tags WHERE id = ?')
            .get(id);
        return row ? new Tag(row.id, row.name) : null;
    }
    static async findByName(name) {
        const db = (0, database_1.getDb)();
        const row = db
            .prepare('SELECT id, name FROM tags WHERE name = ?')
            .get(name.trim());
        return row ? new Tag(row.id, row.name) : null;
    }
    static async findOrCreateByName(name) {
        const existing = await this.findByName(name);
        if (existing) {
            return existing;
        }
        return this.create(name);
    }
    static async getAll() {
        const db = (0, database_1.getDb)();
        const rows = db
            .prepare('SELECT id, name FROM tags ORDER BY name ASC')
            .all();
        return rows.map((row) => new Tag(row.id, row.name));
    }
}
exports.default = Tag;
