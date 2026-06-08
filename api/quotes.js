export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_QUOTES_DATABASE_ID;

  try {
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    const dbData = await dbResponse.json();

    if (dbData.object === 'error') {
      return res.status(dbData.status).json({ error: dbData.message });
    }

    const pages = dbData.results;
    if (!pages || pages.length === 0) {
      return res.status(200).json({ quote: "등록된 구절이 없습니다.", page: "", book: "" });
    }

    const now = new Date();
    const kstDateStr = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10); 
    
    let hash = 0;
    for (let i = 0; i < kstDateStr.length; i++) {
      hash = kstDateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pages.length;
    const selectedPage = pages[index];

    let titlePropName = Object.keys(selectedPage.properties).find(key => selectedPage.properties[key].type === 'title');
    const pageNumText = selectedPage.properties[titlePropName]?.title?.[0]?.plain_text || "";
    const bookTitle = selectedPage.properties['책 제목']?.rich_text?.[0]?.plain_text || "";
    const author = selectedPage.properties['글쓴이']?.rich_text?.[0]?.plain_text || "";

    const blockResponse = await fetch(`https://api.notion.com/v1/blocks/${selectedPage.id}/children?page_size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28'
      }
    });
    const blockData = await blockResponse.json();
    
    let quoteText = "";
    if (blockData.results) {
      quoteText = blockData.results
        .map(block => {
          // 일반 문단, 인용구, 콜아웃 블록 텍스트 전부 대응하도록 수정
          if (block.type === 'paragraph') {
            return block.paragraph.rich_text.map(t => t.plain_text).join('');
          }
          if (block.type === 'quote') {
            return block.quote.rich_text.map(t => t.plain_text).join('');
          }
          if (block.type === 'callout') {
            return block.callout.rich_text.map(t => t.plain_text).join('');
          }
          return null;
        })
        .filter(text => text !== null && text.trim() !== "")
        .join('\n\n');
    }

    if (!quoteText) quoteText = "본문 내용이 비어있는 페이지입니다.";

    return res.status(200).json({
      quote: quoteText,
      page: pageNumText,
      book: bookTitle,
      author: author
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
