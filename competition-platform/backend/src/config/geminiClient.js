const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let genAI = null;
let models = [];

// List of free-tier models to fallback on (excluding deep-reasoning PRO models to avoid rate limit bottlenecks)
const DEFAULT_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash"
];

if (process.env.GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Add custom primary/fallback models if provided, then append defaults
        const configuredModels = [];
        if (process.env.GEMINI_MODEL) configuredModels.push(process.env.GEMINI_MODEL);
        if (process.env.GEMINI_FALLBACK_MODEL) configuredModels.push(process.env.GEMINI_FALLBACK_MODEL);
        
        // Merge and deduplicate
        const modelNames = [...new Set([...configuredModels, ...DEFAULT_MODELS])];
        
        models = modelNames.map(name => {
            const m = genAI.getGenerativeModel({ model: name });
            m.modelName = name; // store name for logging
            return m;
        });
        
        console.log(`[Gemini] Client initialized with fallback models: ${modelNames.join(', ')}`);
    } catch (err) {
        console.warn('[Gemini] Failed to initialize client. Ensure GEMINI_API_KEY is valid.', err.message);
    }
} else {
    console.warn('[Gemini] GEMINI_API_KEY is missing. System will gracefully degrade to rule-based fallback.');
}

const generateContentWithFallback = async (request) => {
    if (models.length === 0) return null;
    
    let lastError = null;
    
    for (let i = 0; i < models.length; i++) {
        try {
            const result = await models[i].generateContent(request);
            return result;
        } catch (err) {
            console.warn(`[Gemini] Model ${models[i].modelName} failed: ${err.message}. Trying next fallback...`);
            lastError = err;
        }
    }
    
    throw lastError; // throw if all models failed
};

module.exports = {
    models,
    generateContentWithFallback
};
