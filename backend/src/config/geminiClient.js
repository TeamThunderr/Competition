const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// List of free-tier models to fallback on (excluding deep-reasoning PRO models to avoid rate limit bottlenecks)
const DEFAULT_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash"
];

// Array of { keyIndex, genAI, models: [] }
const clientPool = [];
let currentClientIndex = 0;

// Read API keys (supports single or comma-separated list)
const apiKeysEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
if (apiKeysEnv) {
    const apiKeys = apiKeysEnv.split(',').map(k => k.trim()).filter(k => k);
    
    // Add custom primary/fallback models if provided, then append defaults
    const configuredModels = [];
    if (process.env.GEMINI_MODEL) configuredModels.push(process.env.GEMINI_MODEL);
    if (process.env.GEMINI_FALLBACK_MODEL) configuredModels.push(process.env.GEMINI_FALLBACK_MODEL);
    
    const modelNames = [...new Set([...configuredModels, ...DEFAULT_MODELS])];

    apiKeys.forEach((key, index) => {
        try {
            const genAI = new GoogleGenerativeAI(key);
            const models = modelNames.map(name => {
                const m = genAI.getGenerativeModel({ model: name });
                m.modelName = name; // store name for logging
                return m;
            });
            clientPool.push({ keyIndex: index + 1, genAI, models });
        } catch (err) {
            console.warn(`[Gemini] Failed to initialize client for key ${index + 1}.`, err.message);
        }
    });

    if (clientPool.length > 0) {
        console.log(`[Gemini] Client pool initialized with ${clientPool.length} keys and fallback models: ${modelNames.join(', ')}`);
    } else {
        console.warn('[Gemini] All keys failed to initialize. System will gracefully degrade to rule-based fallback.');
    }
} else {
    console.warn('[Gemini] GEMINI_API_KEY(S) missing. System will gracefully degrade to rule-based fallback.');
}

const generateContentWithFallback = async (request) => {
    if (clientPool.length === 0) return null;
    
    let lastError = null;
    
    // Try each client in the pool (Round Robin + Failover)
    for (let c = 0; c < clientPool.length; c++) {
        const poolIndex = (currentClientIndex + c) % clientPool.length;
        const client = clientPool[poolIndex];
        
        for (let i = 0; i < client.models.length; i++) {
            try {
                // If it succeeds, update currentClientIndex to the next client for load balancing
                const result = await client.models[i].generateContent(request);
                currentClientIndex = (poolIndex + 1) % clientPool.length; 
                return result;
            } catch (err) {
                console.warn(`[Gemini] Key ${client.keyIndex} -> Model ${client.models[i].modelName} failed: ${err.message}.`);
                lastError = err;
                
                // If it's an API key quota error (429) or invalid key, break inner loop to try next key immediately
                if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('API key not valid') || err.message.includes('exhausted')) {
                    console.warn(`[Gemini] Key ${client.keyIndex} hit quota/invalid limit. Failing over to next key...`);
                    break; 
                }
                // Otherwise (e.g. 500 error on specific model), continue inner loop to try next model on same key
            }
        }
    }
    
    throw lastError; // throw if all keys and all models failed
};

module.exports = {
    generateContentWithFallback
};
