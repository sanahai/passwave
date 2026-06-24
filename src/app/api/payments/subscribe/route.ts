// 정기결제 실행 — 저장된 빌링키로 결제 요청
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requestBilling } from "@/lib/toss";

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  pro: { amount: 9900, name: "PassWave Pro 월 구독" },
  premium: { amount: 19900, name: "PassWave Premium 월 구독" },
};

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { plan } = await request.json();
  const planInfo = PLAN_PRICES[plan as string];
  if (!planInfo) {
    return NextResponse.json(
      { error: "유효하지 않은 플랜입니다." },
      { status: 400 }
    );
  }

  // 저장된 빌링키 조회
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, billing_key")
    .eq("user_id", user.id)
    .single();

  if (!subscription?.billing_key) {
    return NextResponse.json(
      { error: "등록된 결제수단이 없습니다." },
      { status: 400 }
    );
  }

  const orderId = `passwave_${user.id.slice(0, 8)}_${Date.now()}`;

  // Toss 정기결제 실행
  const result = await requestBilling(
    subscription.billing_key,
    user.id,
    planInfo.amount,
    orderId,
    planInfo.name
  );

  const paid = result.status === "DONE";

  // 결제 내역 기록
  await supabase.from("payments").insert({
    user_id: user.id,
    subscription_id: subscription.id,
    amount: planInfo.amount,
    toss_payment_key: result.paymentKey ?? null,
    toss_order_id: orderId,
    status: paid ? "paid" : "failed",
    paid_at: paid ? new Date().toISOString() : null,
  });

  if (!paid) {
    return NextResponse.json(
      { error: result.message || "결제에 실패했습니다." },
      { status: 400 }
    );
  }

  // 구독 갱신
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await supabase
    .from("subscriptions")
    .update({
      plan,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  return NextResponse.json({ success: true, orderId });
}
