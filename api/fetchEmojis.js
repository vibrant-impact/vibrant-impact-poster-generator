
export default async function handler(req, res) {
    const { query } = req.query;
    const url = `https://api.api-ninjas.com/v1/emoji?name=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': process.env.API_NINJAS_KEY, 
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        res.status(200).json(data);
    }   catch (error) {
            res.status(500).json({ error: "Failed to fetch from API Ninjas" });
        }
}