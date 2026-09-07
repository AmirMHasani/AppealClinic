import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from "docx";
import { FOOTER } from "@/lib/generator/generateAppeal";

/** Very small markdown → docx conversion for our letter shape. */
export async function letterToDocxBuffer(markdown: string): Promise<Buffer> {
  const lines = markdown.split("\n");
  const children: Paragraph[] = [];

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          text: line.replace(/^## /, ""),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }
    if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          text: line.replace(/^### /, ""),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      continue;
    }
    if (line.startsWith("| ")) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, font: "Courier New", size: 18 })],
          spacing: { after: 40 },
        })
      );
      continue;
    }
    if (line.trim() === "---") {
      children.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999" },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }
    if (line.startsWith("> ")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^> /, ""),
              italics: true,
            }),
          ],
          indent: { left: 360 },
          spacing: { after: 80 },
        })
      );
      continue;
    }

    // bold **segments**
    const parts: TextRun[] = [];
    const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|[^*]+/g;
    let m: RegExpExecArray | null;
    const cleaned = line.replace(/\*\*/g, "**");
    while ((m = re.exec(cleaned))) {
      if (m[1]) parts.push(new TextRun({ text: m[1], bold: true }));
      else if (m[2]) parts.push(new TextRun({ text: m[2], italics: true }));
      else parts.push(new TextRun({ text: m[0] }));
    }
    if (!parts.length && line.length === 0) {
      children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
    } else {
      children.push(
        new Paragraph({
          children: parts.length ? parts : [new TextRun(line)],
          spacing: { after: 80 },
        })
      );
    }
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: FOOTER, italics: true, size: 18, color: "666666" })],
      spacing: { before: 400 },
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
