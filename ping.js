// GET /api/ping
// 백엔드 함수가 살아있는지 확인 + GEMINI_API_KEY 환경변수가 들어있는지만 체크(값은 노출 X)

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
}
