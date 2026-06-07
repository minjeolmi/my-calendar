export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    const posterData = {};
    data.results.forEach(page => {
      const date = page.properties['시청일']?.date?.start;
      const files = page.properties['포스터']?.files;
      const posterUrl = files?.[0]?.file?.url || files?.[0]?.external?.url;

      if (date && posterUrl) {
        posterData[date] = posterUrl;
      }
    });

    return res.status(200).json(posterData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}