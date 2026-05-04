import { createFileRoute } from "@tanstack/react-router";
import { submitTestDrive } from "@/server/forms.functions";

export const Route = createFileRoute("/api/submit-test-drive")({
  POST: async ({ request }) => {
    try {
      const formData = await request.json();
      const result = await submitTestDrive({ data: formData });
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("API error:", error);
      return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
});
