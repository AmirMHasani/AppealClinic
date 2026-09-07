import { getSession } from "@/lib/auth/session";
import { getCase, getSettings } from "@/lib/db";
import { letterToDocxBuffer } from "@/lib/export/docx";
import { generateAppeal } from "@/lib/generator/generateAppeal";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  let c = await getCase(id);
  if (!c) return new Response("Not found", { status: 404 });

  let md = c.letter_markdown;
  if (!md) {
    const result = await generateAppeal(c, await getSettings());
    md = result.letter_markdown;
  }

  const buf = await letterToDocxBuffer(md);
  const filename = `appeal-${c.meta.internal_case_id || id}.docx`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
