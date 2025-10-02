"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLLMConfig = exports.getLLMConfig = exports.DEFAULT_LLM_SYSTEM_PROMPT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.DEFAULT_LLM_SYSTEM_PROMPT = `You are an OCR assistant. Analyze the provided image and respond strictly in JSON.

Return JSON with this exact structure:
{
    "ocr_text": "string",
    "suggested_tags": ["string", ...]
}

Guidelines:
- suggested_tags must be an array of concise lowercase tags (maximum 5 entries).
- Preserve line breaks inside ocr_text.
- Use empty string for ocr_text when no text is detected and an empty array for suggested_tags.
- Do not include any explanation or commentary outside the JSON response.
- Do not return HTML or markdown formatting.`;
const decodeSystemPrompt = (value) => {
    if (typeof value !== 'string') {
        return exports.DEFAULT_LLM_SYSTEM_PROMPT;
    }
    const unescaped = value.replace(/\\n/g, '\n');
    return unescaped.trim().length === 0 ? exports.DEFAULT_LLM_SYSTEM_PROMPT : unescaped;
};
let llmConfig = {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    systemPrompt: decodeSystemPrompt(process.env.LLM_SYSTEM_PROMPT)
};
const getLLMConfig = () => llmConfig;
exports.getLLMConfig = getLLMConfig;
const updateLLMConfig = (config) => {
    const updates = {};
    if (config.baseUrl !== undefined) {
        updates.baseUrl = config.baseUrl;
        process.env.LLM_BASE_URL = config.baseUrl;
    }
    if (config.apiKey !== undefined) {
        updates.apiKey = config.apiKey;
        process.env.LLM_API_KEY = config.apiKey;
    }
    if (config.model !== undefined) {
        updates.model = config.model;
        process.env.LLM_MODEL = config.model;
    }
    if (config.systemPrompt !== undefined) {
        const normalizedPrompt = decodeSystemPrompt(config.systemPrompt);
        updates.systemPrompt = normalizedPrompt;
        process.env.LLM_SYSTEM_PROMPT = normalizedPrompt.replace(/\r?\n/g, '\\n');
    }
    if (Object.keys(updates).length === 0) {
        return;
    }
    llmConfig = { ...llmConfig, ...updates };
    persistLLMConfig({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
        systemPrompt: updates.systemPrompt
    });
};
exports.updateLLMConfig = updateLLMConfig;
const ENV_PATH = path_1.default.resolve(__dirname, '../../.env');
const persistLLMConfig = (updates) => {
    const rawEntries = [
        ['LLM_BASE_URL', updates.baseUrl],
        ['LLM_API_KEY', updates.apiKey],
        ['LLM_MODEL', updates.model],
        ['LLM_SYSTEM_PROMPT', updates.systemPrompt]
    ];
    const entries = rawEntries.filter((entry) => typeof entry[1] === 'string');
    if (entries.length === 0) {
        return;
    }
    try {
        const raw = fs_1.default.existsSync(ENV_PATH) ? fs_1.default.readFileSync(ENV_PATH, 'utf8') : '';
        const lines = raw ? raw.split(/\r?\n/) : [];
        const lineIndex = new Map();
        lines.forEach((line, index) => {
            const match = line.match(/^([^=#\s]+)\s*=\s*(.*)$/);
            if (match) {
                lineIndex.set(match[1], index);
            }
        });
        entries.forEach(([key, value]) => {
            const sanitized = value.replace(/\r?\n/g, '\\n');
            const existingIndex = lineIndex.get(key);
            if (existingIndex !== undefined) {
                lines[existingIndex] = `${key}=${sanitized}`;
            }
            else {
                lines.push(`${key}=${sanitized}`);
            }
        });
        fs_1.default.writeFileSync(ENV_PATH, lines.join('\n'));
    }
    catch (error) {
        console.error('Failed to persist LLM config to .env:', error);
    }
};
