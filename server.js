const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static('public'));

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'Warframe Market API Proxy is running!' });
});

// Route pour les statistiques d'items
app.get('/api/items/:itemName/statistics', async (req, res) => {
    try {
        const response = await fetch(
            `https://api.warframe.market/v1/items/${req.params.itemName}/statistics`,
            {
                headers: {
                    'Platform': 'pc',
                    'Accept': 'application/json'
                }
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour la liste des items
app.get('/api/items', async (req, res) => {
    try {
        const response = await fetch(
            'https://api.warframe.market/v1/items',
            {
                headers: {
                    'Platform': 'pc',
                    'Accept': 'application/json'
                }
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});