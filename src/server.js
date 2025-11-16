const express = require('express');
const fs = require('fs').promises;
const fsWatch = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// === Папки ===
const ROOT_DIR = path.resolve(__dirname, '..');
const JSONS_DIR = path.join(ROOT_DIR, 'jsons');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'images');

// === Middleware ===
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// === Кэш для JSON ===
const jsonCache = new Map();

// === Авто-инвалидатор кэша ===
fsWatch.watch(JSONS_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const filePath = path.join(JSONS_DIR, filename);
    const normalizedPath = path.normalize(filePath);

    if (jsonCache.has(normalizedPath)) {
        console.log(`JSON изменён, кэш очищен: ${filename}`);
        jsonCache.delete(normalizedPath);
    }
});

async function getJson(filePath) {
    const normalizedPath = path.normalize(filePath);

    if (!normalizedPath.startsWith(JSONS_DIR)) {
        throw new Error('Invalid path');
    }

    if (jsonCache.has(normalizedPath)) {
        return jsonCache.get(normalizedPath);
    }

    const data = await fs.readFile(normalizedPath, 'utf8');
    const json = JSON.parse(data);

    jsonCache.set(normalizedPath, json);
    return json;
}

app.get('/api/categories/pages', async (req, res) => {
    try {
        const json = await getJson(path.join(JSONS_DIR, 'categories', 'pages.json'));
        res.json(json);
    } catch (err) {
        if (err.message === 'Invalid path') res.status(400).json({ error: err.message });
        else res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/:category/:file', async (req, res) => {
    const { category, file } = req.params;
    try {
        const json = await getJson(path.join(JSONS_DIR, category, `${file}.json`));
        res.json(json);
    } catch (err) {
        if (err.code === 'ENOENT') res.status(404).json({ error: 'File not found' });
        else if (err.message === 'Invalid path') res.status(400).json({ error: err.message });
        else res.status(500).json({ error: 'Server error' });
    }
});

// === Статика ===
app.use('/assets', express.static(ASSETS_DIR, { maxAge: '1d' }));

// === Health-check ===
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// === Запуск ===
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API running: http://localhost:${PORT}`);
    console.log(`Assets available: http://localhost:${PORT}/assets/curator-empire.jpg`);
});
