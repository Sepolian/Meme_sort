import React, { useState, useEffect } from 'react';
import { getLLMConfig, updateLLMConfig } from '../services/api';

const Settings: React.FC = () => {
    const [config, setConfig] = useState({
        baseUrl: '',
        model: '',
        apiKey: '',
        systemPrompt: '',
        hasApiKey: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await getLLMConfig();
            setConfig(prev => ({
                ...prev,
                baseUrl: data.baseUrl || '',
                model: data.model || '',
                systemPrompt: data.systemPrompt || '',
                hasApiKey: data.hasApiKey || false
            }));
        } catch (error) {
            console.error('Error loading config:', error);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const updateData: any = {
                baseUrl: config.baseUrl,
                model: config.model,
                systemPrompt: config.systemPrompt
            };

            if (config.apiKey) {
                updateData.apiKey = config.apiKey;
            }

            await updateLLMConfig(updateData);
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });

            // Reload config to get updated hasApiKey status
            await loadConfig();

            // Clear API key field for security
            setConfig(prev => ({ ...prev, apiKey: '' }));
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        if (message) setMessage(null);
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                <h2>Settings</h2>

                <form onSubmit={handleSave} className="settings-form">
                    <div className="settings-section">
                        <h3>LLM Configuration</h3>
                        <p className="section-description">
                            Configure your LLM provider for advanced OCR functionality
                        </p>

                        <div className="form-group">
                            <label htmlFor="baseUrl">Base URL</label>
                            <input
                                id="baseUrl"
                                type="url"
                                value={config.baseUrl}
                                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="form-input"
                            />
                            <small className="input-help">
                                OpenAI compatible API endpoint
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="model">Model</label>
                            <input
                                id="model"
                                type="text"
                                value={config.model}
                                onChange={(e) => handleInputChange('model', e.target.value)}
                                placeholder="gemini-2.5-pro"
                                className="form-input"
                            />
                            <small className="input-help">
                                Model name that supports vision (e.g., gemini-2.5-pro, gemini-2.5-flash)
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="apiKey">
                                API Key
                                {config.hasApiKey && <span className="api-key-status">Set</span>}
                            </label>
                            <input
                                id="apiKey"
                                type="password"
                                value={config.apiKey}
                                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                                placeholder={config.hasApiKey ? "••••••••••••••••" : "Enter your API key"}
                                className="form-input"
                            />
                            <small className="input-help">
                                {config.hasApiKey
                                    ? "Leave empty to keep current key, or enter a new one to replace it"
                                    : "Your API key for accessing the LLM service"
                                }
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="systemPrompt">System Prompt</label>
                            <textarea
                                id="systemPrompt"
                                value={config.systemPrompt}
                                onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                                placeholder="Customize the instructions sent to the LLM"
                                className="form-input"
                                rows={8}
                            />
                            <small className="input-help">
                                Multiline instructions sent as the system prompt for OCR responses. Leave empty to revert to the default.
                            </small>
                        </div>
                    </div>

                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={saving}
                            className="save-button"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;