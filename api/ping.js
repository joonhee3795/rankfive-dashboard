// GET /api/ping — 환경변수 설정 상태 확인 (값은 절대 노출 안 함)

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    env: {
      gemini:           Boolean(process.env.GEMINI_API_KEY),
      kakao:            Boolean(process.env.KAKAO_REST_API_KEY),
      naver_ad_api:     Boolean(process.env.NAVER_AD_API_KEY),
      naver_ad_secret:  Boolean(process.env.NAVER_AD_SECRET_KEY),
      naver_ad_customer:Boolean(process.env.NAVER_AD_CUSTOMER_ID),
      database:         Boolean(process.env.DATABASE_URL),
    },
    time: new Date().toISOString(),
  });
}
