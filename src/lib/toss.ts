// Toss Payments API 유틸
const TOSS_SECRET = process.env.TOSS_SECRET_KEY!;
const TOSS_BASE_URL = "https://api.tosspayments.com/v1";

// Base64 인코딩된 시크릿키 (Toss 인증 방식)
const authHeader =
  "Basic " + Buffer.from(TOSS_SECRET + ":").toString("base64");

export async function issueBillingKey(authKey: string, customerKey: string) {
  const res = await fetch(`${TOSS_BASE_URL}/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
  });
  return res.json();
}

export async function requestBilling(
  billingKey: string,
  customerKey: string,
  amount: number,
  orderId: string,
  orderName: string
) {
  const res = await fetch(`${TOSS_BASE_URL}/billing/${billingKey}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
    }),
  });
  return res.json();
}
