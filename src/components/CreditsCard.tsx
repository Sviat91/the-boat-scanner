import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CreditsData {
  free_credits: number;
  paid_credits: number;
  subscribed_until: string | null;
}

const CreditsCard = () => {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_credits");
      if (error) {
        console.error("Error fetching credits:", error);
      } else {
        setData(data as CreditsData);
      }
      setLoading(false);
    };

    fetchCredits();
  }, []);

  const total = (data?.free_credits || 0) + (data?.paid_credits || 0);

  return (
    <Card className="w-full max-w-xl mx-auto p-6 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl rounded-xl space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Your available search credits (1 credit = 1 search)
      </h2>
      {loading ? (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="text-gray-700 dark:text-gray-300 space-y-1">
          {data && data.free_credits > 0 && data.paid_credits > 0 ? (
            <>
              <p>Free credits: {data.free_credits}</p>
              <p>Paid credits: {data.paid_credits}</p>
            </>
          ) : (
            <p>Available credits: {total}</p>
          )}
        </div>
      )}
      <Button onClick={() => console.log("Buy credits clicked")}>
        Buy credits
      </Button>
    </Card>
  );
};

export default CreditsCard;
