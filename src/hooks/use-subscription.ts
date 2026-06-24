// 구독 상태 훅
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "@/types";

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();
      setSubscription((data as Subscription) ?? null);
      setLoading(false);
    };
    run();
  }, []);

  const isPaid =
    subscription?.status === "active" && subscription.plan !== "free";

  return { subscription, loading, isPaid };
}
