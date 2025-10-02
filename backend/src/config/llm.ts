import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export interface LLMConfig {
    baseUrl: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
}

export const DEFAULT_LLM_SYSTEM_PROMPT = `You are an OCR assistant. Analyze the provided image and respond strictly in JSON.

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

const decodeSystemPrompt = (value?: string): string => {
    if (typeof value !== 'string') {
        return DEFAULT_LLM_SYSTEM_PROMPT;
    }

    const unescaped = value.replace(/\\n/g, '\n');
    return unescaped.trim().length === 0 ? DEFAULT_LLM_SYSTEM_PROMPT : unescaped;
};

let llmConfig: LLMConfig = {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    systemPrompt: decodeSystemPrompt(process.env.LLM_SYSTEM_PROMPT)
};

export const getLLMConfig = (): LLMConfig => llmConfig;

export const updateLLMConfig = (config: Partial<LLMConfig>): void => {
    const updates: Partial<LLMConfig> = {};

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

const ENV_PATH = path.resolve(__dirname, '../../.env');

const persistLLMConfig = (updates: Partial<LLMConfig>): void => {
    const rawEntries: Array<[string, string | undefined]> = [
        ['LLM_BASE_URL', updates.baseUrl],
        ['LLM_API_KEY', updates.apiKey],
        ['LLM_MODEL', updates.model],
        ['LLM_SYSTEM_PROMPT', updates.systemPrompt]
    ];

    const entries: Array<[string, string]> = rawEntries.filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
    );

    if (entries.length === 0) {
        return;
    }

    try {
        const raw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
        const lines = raw ? raw.split(/\r?\n/) : [];
        const lineIndex = new Map<string, number>();

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
            } else {
                lines.push(`${key}=${sanitized}`);
            }
        });

        fs.writeFileSync(ENV_PATH, lines.join('\n'));
    } catch (error) {
        console.error('Failed to persist LLM config to .env:', error);
    }
};