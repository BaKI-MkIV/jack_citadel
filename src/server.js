const express = require('express');
const fs = require('fs').promises; /* <- async */
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; /* <- hardcode port */
const ROOT_DIR = path.resolve(__dirname, '..');

// Middleware
app.use(cors());
app.use(express.json());

// Пути
const JSONS_DIR = path.join(ROOT_DIR, 'jsons');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');

// === API: /api/type/title ===
app.get('/api/:category/:file', async (req, res) => {
    const { category, file } = req.params;
    const filePath = path.join(JSONS_DIR, category, `${file}.json`);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('JSON not found:', filePath);
        res.status(404).json({ error: 'Not found' });
    }
});

// === Изображения ===
app.use('/assets', express.static(ASSETS_DIR));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API: http://localhost:${PORT}`);
    console.log(`Images: http://localhost:${PORT}/images/curator-empire.jpg`);
});