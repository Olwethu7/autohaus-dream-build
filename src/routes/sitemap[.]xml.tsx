import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE = process.env.SITE_URL || "https://mlgautohaus.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = ["/", "/about", "/catalogue", "/finance", "/sell", "/test-drive", "/contact"];
        const { data: vehicles } = await supabaseAdmin
          .from("vehicles")
          .select("id, updated_at")
          .eq("sold", false);

        const urls = [
          ...staticPaths.map(
            (p) => `<url><loc>${SITE}${p}</loc><changefreq>weekly</changefreq></url>`
          ),
          ...((vehicles ?? []).map(
            (v) =>
              `<url><loc>${SITE}/vehicle/${v.id}</loc><lastmod>${new Date(v.updated_at).toISOString()}</lastmod></url>`
          )),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
