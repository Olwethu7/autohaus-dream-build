import { createFileRoute } from "@tanstack/react-router";
import { submitSellRequest } from "@/server/forms.functions";

export const Route = createFileRoute("/api/submit-sell")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.json();
          const result = await submitSellRequest({ data: formData });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("submit-sell error:", error);
          return new Response(
            JSON.stringify({ ok: false, error: "Server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
