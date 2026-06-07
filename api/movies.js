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

    // 🚨 노션이 에러를 반환했을 경우, 멈추지 말고 노션의 진짜 에러 메시지를 화면에 출력
    if (data.object === 'error') {
      return res.status(data.status).json({ 
        error: "노션 API가 에러를 뱉었습니다", 
        code: data.code, 
        message: data.message 
      });
    }

    if (!data.results) {
      return res.status(500).json({ error: "노션에서 results 데이터를 받지 못했습니다.", rawData: data });
    }

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
