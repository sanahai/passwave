// 빌링키 발급 (카드 등록 후 호출됨)
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { issueBillingKey } from "@/lib/toss";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { authKey, customerKey } = await request.json();

  // 1. Toss에서 빌링키 발급
  const result = await issueBillingKey(authKey, customerKey);

  if (result.billingKey) {
    // 2. 구독 정보에 빌링키 저장
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan: "pro",
        status: "active",
        billing_key: result.billingKey,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "user_id" }
    );

    // 3. 첫 결제 실행
    // (실제로는 Toss 위젯에서 첫 결제까지 같이 처리할 수도 있음)
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: result.message }, { status: 400 });
}
