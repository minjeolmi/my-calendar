<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notion Quotes Widget</title>
  <style>
    /* --- 기본 스타일 (라이트 모드 기준) --- */
    body {
      background-color: #ffffff; /* 노션 라이트모드 배경색 */
      color: #37352f; /* 노션 라이트모드 기본 글자색 */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    body::-webkit-scrollbar { display: none; }
    
    .quote-container {
      max-width: 650px;
      width: 100%;
      text-align: left;
      border-left: 3px solid #e3e2e0; /* 노션 라이트모드 회색 인용선 */
      padding-left: 20px;
      box-sizing: border-box;
    }
    .quote-text {
      font-size: 15px;
      line-height: 1.65;
      margin-bottom: 14px;
      white-space: pre-wrap;
      color: #37352f;
      letter-spacing: -0.01em;
    }
    .quote-info {
      font-size: 13px;
      color: #787774; /* 노션 라이트모드 옅은 폰트색 */
      font-weight: 500;
    }

    /* --- 컴퓨터/폰 시스템 설정이 다크 모드일 때 자동으로 전환 --- */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #191919; /* 노션 다크모드 배경색 */
      }
      .quote-container {
        border-left: 3px solid #444444; /* 다크모드 인용선 */
      }
      .quote-text {
        color: #e3e3e3; /* 다크모드 글자색 */
      }
      .quote-info {
        color: #757575;
      }
    }
  </style>
</head>
<body>
  <div class="quote-container">
    <div class="quote-text" id="quote">오늘의 문장을 가져오는 중...</div>
    <div class="quote-info" id="info"></div>
  </div>

  <script>
    async function loadDailyQuote() {
      try {
        const response = await fetch('https://my-calendar-six-zeta.vercel.app/api/quotes');
        const data = await response.json();
        
        if (data.error) {
          document.getElementById('quote').innerText = "데이터 로드 실패: " + data.error;
          return;
        }
        
        document.getElementById('quote').innerText = data.quote;
        
        let infoStr = "";
        if (data.book) infoStr += ` - ${data.book}`;
        if (data.page) infoStr += ` (${data.page})`;
        if (data.author) infoStr += ` , ${data.author}`;
        
        document.getElementById('info').innerText = infoStr;
      } catch (err) {
        document.getElementById('quote').innerText = "서버와 연결할 수 없습니다.";
      }
    }
    loadDailyQuote();
  </script>
</body>
</html>
'.'
