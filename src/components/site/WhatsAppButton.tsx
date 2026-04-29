import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function WhatsAppButton() {
  const [number, setNumber] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["whatsapp_number", "whatsapp_message"])
      .then(({ data }) => {
        const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
        setNumber(map.whatsapp_number || null);
        setMessage(map.whatsapp_message || "");
      });
  }, []);

  if (!number) return null;
  const href = `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.72_0.18_152)] text-white shadow-luxe transition-transform hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
