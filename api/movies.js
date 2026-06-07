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
      const startDateStr = page.properties['시청일']?.date?.start;
      const endDateStr = page.properties['시청일']?.date?.end;
      const files = page.properties['포스터']?.files;
      const posterUrl = files?.[0]?.file?.url || files?.[0]?.external?.url;

      if (startDateStr && posterUrl) {
        if (!endDateStr) {
          // 종료일이 없으면 시작일 하루만 등록
          posterData[startDateStr] = posterUrl;
        } else {
          // 종료일이 있으면 시작일부터 종료일까지 루프 돌면서 날짜 다 채우기
          let current = new Date(startDateStr);
          const end = new Date(endDateStr);
          
          while (current <= end) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const dateKey = `${yyyy}-${mm}-${dd}`;
            
            posterData[dateKey] = posterUrl;
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });

    return res.status(200).json(posterData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
