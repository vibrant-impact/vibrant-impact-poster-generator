
const fetch = require('node-fetch');
const ZENQUOTES_KEY = process.env.ZENQUOTES_API_KEY; 
const BASE_URL_ZEN = 'https://zenquotes.io/api';

module.exports = async (req, res) => {
    const tag = req.query.tag || 'inspiration';

    if (!ZENQUOTES_KEY) {
        return res.status(500).json({ error: 'API key not configured.' });
    }

    try {
        const zenUrl = `${BASE_URL_ZEN}/quotes/${tag}?apikey=${ZENQUOTES_KEY}`;
        const response = await fetch(zenUrl);
        const data = await response.json();
        res.status(200).json(data);
    }   catch (error) {
            console.error("ZenQuotes Fetch Error:", error);
            res.status(500).json({ error: 'Failed to fetch external quotes.' });
        }
};