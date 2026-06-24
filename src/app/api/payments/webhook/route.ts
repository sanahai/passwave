// Toss 웹훅 수신 — 결제 상태 변경 통지를 처리
// 서비스 롤 키로 RLS 우회하여 결제/구독 상태를 갱신한다.
import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  // Toss 웹훅 이벤트 타입: PAYMENT_STATUS_CHANGED 등
  const eventType: string = payload.eventType ?? "";
  const data = payload.data ?? {};

  const supabase = await createServiceSupabase();

  if (eventType === "PAYMENT_STATUS_CHANGED" && data.orderId) {
    const newStatus =
      data.status === "DONE"
        ? "paid"
        : data.status === "CANCELED"
        ? "cancelled"
        : "failed";

    await supabase
      .from("payments")
      .update({
        status: newStatus,
        toss_payment_key: data.paymentKey ?? null,
        paid_at: newStatus === "paid" ? new Date().toISOString() : null,
      })
      .eq("toss_order_id", data.orderId);
  }

  // Toss는 200 응답을 받아야 재전송을 멈춘다.
  return NextResponse.json({ received: true });
}
