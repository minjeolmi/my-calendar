export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_QUOTES_DATABASE_ID;

  try {
    // 1. 독서 데이터베이스의 모든 페이지 가져오기
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

    // 2. 한국 표준시(KST) 기준 오늘 날짜 문자열 생성 (매일 밤 12시에 변경됨)
    const now = new Date();
    const kstDateStr = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10); 
    
    // 3. 날짜 문자열을 고유 숫자로 치환해서 고정 랜덤 인덱스 추출
    let hash = 0;
    for (let i = 0; i < kstDateStr.length; i++) {
      hash = kstDateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pages.length;
    const selectedPage = pages[index];

    // 4. 선택된 페이지의 속성값 (제목인 페이지 번호, 책 제목, 글쓴이) 추출
    let titlePropName = Object.keys(selectedPage.properties).find(key => selectedPage.properties[key].type === 'title');
    const pageNumText = selectedPage.properties[titlePropName]?.title?.[0]?.plain_text || "";
    const bookTitle = selectedPage.properties['책 제목']?.rich_text?.[0]?.plain_text || "";
    const author = selectedPage.properties['글쓴이']?.rich_text?.[0]?.plain_text || "";

    // 5. 선택된 페이지의 하단 본문(Block) 내용들 긁어오기
    const blockResponse = await fetch(`https://api.notion.com/v1/blocks/${selectedPage.id}/children?page_size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28'
      }
    });
    const blockData = await blockResponse.json();
    
    // 본문 내용 중 일반 텍스트 문단(paragraph)만 추출해서 줄바꿈으로 합치기
    let quoteText = "";
    if (blockData.results) {
      quoteText = blockData.results
        .filter(block => block.type === 'paragraph')
        .map(block => block.paragraph.rich_text.map(t => t.plain_text).join(''))
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
