import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const AI_DEFAULT_LIMIT = 50;

async function getQuota(associationId: string): Promise<{ limit: number; used: number; remaining: number }> {
  const today = new Date().toISOString().substring(0, 10);
  const [limitSetting, usage] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "ai_daily_limit", associationId } },
    }),
    prisma.aiUsage.findUnique({
      where: { associationId_date: { associationId, date: today } },
    }),
  ]);
  const limit = parseInt(limitSetting?.value ?? String(AI_DEFAULT_LIMIT), 10);
  const used  = usage?.count ?? 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

async function incrementUsage(associationId: string): Promise<void> {
  const today = new Date().toISOString().substring(0, 10);
  await prisma.aiUsage.upsert({
    where:  { associationId_date: { associationId, date: today } },
    create: { associationId, date: today, count: 1 },
    update: { count: { increment: 1 } },
  });
}

const GROQ_MODEL = "llama-3.3-70b-versatile";

async function callAI(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Groq] HTTP ${res.status}:`, err);
    if (res.status === 401) throw new Error("GROQ_API_KEY is invalid");
    if (res.status === 429) throw new Error("quota exceeded");
    throw new Error(`Groq API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json() as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!ctx.associationId) return NextResponse.json({ success: false, error: "No association context" }, { status: 400 });
  const associationId: string = ctx.associationId;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const { type } = body;

  // ── Enabled check ──────────────────────────────────────────────────────────
  const enabledSetting = await prisma.siteSettings.findUnique({
    where: { key_associationId: { key: "ai_enabled", associationId } },
  });
  if (enabledSetting?.value === "false") {
    return NextResponse.json({
      success: false,
      error: "AI generation is disabled for your account. Contact your platform admin to enable it.",
    }, { status: 403 });
  }

  // ── Quota check ────────────────────────────────────────────────────────────
  const quota = await getQuota(associationId);
  if (quota.remaining <= 0) {
    return NextResponse.json({
      success: false,
      error: `Daily AI quota reached (${quota.limit} generations/day). Contact your platform admin to increase the limit.`,
      quota,
    }, { status: 429 });
  }

  try {
    // ── Bio ──────────────────────────────────────────────────────────────────────
    if (type === "bio") {
      const name         = String(body.name         ?? "");
      const role         = String(body.role         ?? "");
      const venue        = String(body.venue        ?? "");
      const organization = String(body.organization ?? "");

      if (!name || !role) {
        return NextResponse.json({ success: false, error: "Name and role are required to generate a bio." }, { status: 400 });
      }

      const prompt = [
        `Write a concise professional biography (2–4 sentences) for a committee member of EVA Nepal (Event and Venue Association Nepal), an industry body for event venues in Kathmandu, Nepal.`,
        ``,
        `Name: ${name}`,
        `Role: ${role}`,
        venue        ? `Venue: ${venue}`               : null,
        organization ? `Organization: ${organization}` : null,
        ``,
        `Instructions:`,
        `- Write in third person.`,
        `- Focus on their professional role and contribution to the events industry.`,
        `- Keep it formal but approachable.`,
        `- Do NOT invent specific achievements, qualifications, or dates not provided.`,
        `- Return only the biography text — no headings, no labels, no extra commentary.`,
      ].filter((l) => l !== null).join("\n");

      const text = await callAI(prompt, 400);
      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { text }, remaining: quota.remaining - 1 });
    }

    // ── News ─────────────────────────────────────────────────────────────────────
    if (type === "news") {
      const title    = String(body.title    ?? "");
      const category = String(body.category ?? "announcement");
      const keywords = String(body.keywords ?? "").trim();

      if (!title) {
        return NextResponse.json({ success: false, error: "Article title is required." }, { status: 400 });
      }

      const prompt = [
        `Write a professional news article for EVA Nepal (Event and Venue Association Nepal), an industry body for event venues in Kathmandu, Nepal, established in 2011 with 150+ member venues.`,
        ``,
        `Article Title: ${title}`,
        `Category: ${category}`,
        keywords ? `Key points to include: ${keywords}` : null,
        ``,
        `You MUST output exactly two sections using these exact labels (plain text, no markdown, no bold):`,
        ``,
        `EXCERPT:`,
        `[A 1-2 sentence preview, max 160 characters, engaging and self-contained]`,
        ``,
        `CONTENT:`,
        `[The full article body in 3-4 paragraphs in formal English.${keywords ? " Incorporate the provided key points naturally." : " Do not invent specific dates, names, or statistics."} Start with a strong opening sentence.]`,
        ``,
        `Important: Output only EXCERPT: and CONTENT: as plain labels. Do not use **EXCERPT**, ## EXCERPT, or any other formatting for the labels.`,
      ].filter((l) => l !== null).join("\n");

      const raw = await callAI(prompt, 1200);

      // Parse EXCERPT / CONTENT — handles plain "EXCERPT:" and markdown variants "**EXCERPT**" / "## EXCERPT"
      const excerptMatch = raw.match(/(?:\*{0,2}EXCERPT\*{0,2}|##\s*EXCERPT)[:\s]*([\s\S]*?)(?=(?:\*{0,2}CONTENT\*{0,2}|##\s*CONTENT)|$)/i);
      const contentMatch = raw.match(/(?:\*{0,2}CONTENT\*{0,2}|##\s*CONTENT)[:\s]*([\s\S]*)$/i);

      const excerpt = excerptMatch ? excerptMatch[1].trim() : "";
      const content = contentMatch ? contentMatch[1].trim() : raw;

      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { excerpt, content }, remaining: quota.remaining - 1 });
    }

    // ── Agenda ───────────────────────────────────────────────────────────────────
    if (type === "agenda") {
      const title       = String(body.title       ?? "");
      const meetingType = String(body.meetingType ?? "committee");
      const description = String(body.description ?? "");
      const venue       = String(body.venue       ?? "");

      if (!title) {
        return NextResponse.json({ success: false, error: "Meeting title is required." }, { status: 400 });
      }

      const typeLabels: Record<string, string> = {
        agm:       "Annual General Meeting (AGM)",
        picnic:    "Picnic / Social Event",
        program:   "Program",
        committee: "Committee Meeting",
        special:   "Special Meeting",
      };
      const typeLabel = typeLabels[meetingType] ?? meetingType;

      const prompt = [
        `Suggest 5–7 agenda items for the following EVA Nepal (Event and Venue Association Nepal) meeting.`,
        ``,
        `Meeting Title: ${title}`,
        `Meeting Type: ${typeLabel}`,
        venue       ? `Venue: ${venue}`             : null,
        description ? `Description: ${description}` : null,
        ``,
        `For each agenda item output exactly two lines:`,
        `ITEM: [concise title, 5–10 words]`,
        `DESC: [one-sentence description of what will be discussed or decided]`,
        ``,
        `Rules:`,
        `- Only suggest items appropriate for an industry association meeting.`,
        `- For AGMs include standard items: call to order, minutes of last meeting, chairman's address, treasurer's report, committee reports, election of office bearers, any other business.`,
        `- Do not add numbering, bullet points, or any text other than the ITEM/DESC pairs.`,
      ].filter((l) => l !== null).join("\n");

      const raw = await callAI(prompt, 800);

      // Parse ITEM / DESC pairs
      const items: { title: string; description: string }[] = [];
      let pending: { title: string; description: string } | null = null;
      for (const line of raw.split("\n")) {
        const itemMatch = line.match(/^ITEM:\s*(.+)/i);
        const descMatch = line.match(/^DESC:\s*(.+)/i);
        if (itemMatch) {
          if (pending) items.push(pending);
          pending = { title: itemMatch[1].trim(), description: "" };
        } else if (descMatch && pending) {
          pending.description = descMatch[1].trim();
        }
      }
      if (pending) items.push(pending);

      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { items }, remaining: quota.remaining - 1 });
    }

    // ── Meeting description ───────────────────────────────────────────────────────
    if (type === "meeting") {
      const title       = String(body.title       ?? "");
      const meetingType = String(body.meetingType ?? "committee");
      const venue       = String(body.venue       ?? "").trim();

      if (!title) {
        return NextResponse.json({ success: false, error: "Meeting title is required." }, { status: 400 });
      }

      const typeLabels: Record<string, string> = {
        agm:       "Annual General Meeting (AGM)",
        picnic:    "Picnic / Social Event",
        program:   "Program",
        committee: "Committee Meeting",
        special:   "Special Meeting",
      };
      const typeLabel = typeLabels[meetingType] ?? meetingType;

      const prompt = [
        `Write a concise meeting description (2–3 sentences) for an EVA Nepal (Event and Venue Association Nepal) meeting notice.`,
        ``,
        `Meeting Title: ${title}`,
        `Meeting Type: ${typeLabel}`,
        venue ? `Venue: ${venue}` : null,
        ``,
        `Instructions:`,
        `- Write in a professional, formal tone suitable for an industry association.`,
        `- Briefly describe the purpose, what will be discussed, and why members should attend.`,
        `- Do NOT invent specific dates, times, names, or statistics not provided.`,
        `- Return only the description text — no headings, no labels, no extra commentary.`,
      ].filter((l) => l !== null).join("\n");

      const text = await callAI(prompt, 300);
      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { text }, remaining: quota.remaining - 1 });
    }

    // ── Meeting Minutes ───────────────────────────────────────────────────────────
    if (type === "minutes") {
      const title       = String(body.title       ?? "");
      const meetingType = String(body.meetingType ?? "committee");
      const venue       = String(body.venue       ?? "").trim();
      const scheduledAt = String(body.scheduledAt ?? "").trim();
      const agendaItems = Array.isArray(body.agendaItems) ? body.agendaItems as { title: string; description: string | null; outcome: string | null }[] : [];

      if (!title) {
        return NextResponse.json({ success: false, error: "Meeting title is required." }, { status: 400 });
      }

      const typeLabels: Record<string, string> = {
        agm:       "Annual General Meeting (AGM)",
        picnic:    "Picnic / Social Event",
        program:   "Program",
        committee: "Committee Meeting",
        special:   "Special Meeting",
      };
      const typeLabel = typeLabels[meetingType] ?? meetingType;

      const agendaSection = agendaItems.length > 0
        ? agendaItems.map((item, i) => {
            const lines = [`${i + 1}. ${item.title}`];
            if (item.description) lines.push(`   Context: ${item.description}`);
            if (item.outcome) lines.push(`   Outcome/Decision: ${item.outcome}`);
            return lines.join("\n");
          }).join("\n")
        : "No agenda items recorded.";

      const prompt = [
        `Draft formal meeting minutes for the following EVA Nepal (Event and Venue Association Nepal) meeting.`,
        ``,
        `Meeting Title: ${title}`,
        `Meeting Type: ${typeLabel}`,
        venue       ? `Venue: ${venue}` : null,
        scheduledAt ? `Date: ${scheduledAt}` : null,
        ``,
        `Agenda Items:`,
        agendaSection,
        ``,
        `Instructions:`,
        `- Write in formal third-person past tense (e.g., "The chairperson opened the meeting…").`,
        `- Structure with these sections: Heading (with meeting name, date, venue), Opening, Agenda Discussion (one paragraph per item), Decisions/Resolutions, Closing.`,
        `- For each agenda item, write a brief paragraph summarising discussion points and any decision or action taken. Use the outcome field if provided.`,
        `- Do NOT invent names, figures, or facts not provided. Use "[Name]" or "[TBD]" as placeholders where specific details are missing.`,
        `- Keep language professional and concise. Suitable for official association records.`,
        `- Return only the minutes text — no meta-commentary.`,
      ].filter((l) => l !== null).join("\n");

      const text = await callAI(prompt, 1500);
      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { text }, remaining: quota.remaining - 1 });
    }

    // ── Event description ─────────────────────────────────────────────────────
    if (type === "event") {
      const title     = String(body.title     ?? "").trim();
      const eventType = String(body.eventType ?? "").trim();
      const location  = String(body.location  ?? "").trim();
      const date      = String(body.date      ?? "").trim();
      const attendees = String(body.attendees ?? "").trim();
      const keywords  = String(body.keywords  ?? "").trim();

      if (!title) {
        return NextResponse.json({ success: false, error: "Event title is required." }, { status: 400 });
      }

      const typeLabels: Record<string, string> = {
        networking:  "Networking Event",
        training:    "Training & Workshop",
        meeting:     "Meeting",
        exhibition:  "Exhibition",
        conference:  "Conference",
      };
      const typeLabel = typeLabels[eventType] ?? eventType;

      const contextLines = [
        title     ? `Event Title: ${title}`                   : null,
        typeLabel ? `Event Type: ${typeLabel}`                : null,
        date      ? `Date: ${date}`                          : null,
        location  ? `Location: ${location}`                  : null,
        attendees ? `Expected Attendance: ${attendees} people` : null,
        keywords  ? `Key themes / talking points: ${keywords}` : null,
      ].filter(Boolean).join("\n");

      const prompt = [
        `Write a compelling event description (2–3 paragraphs) for the following EVA Nepal (Event and Venue Association Nepal) event.`,
        ``,
        contextLines,
        ``,
        `Instructions:`,
        `- If "Key themes / talking points" are provided, use them as the CORE content of the description — elaborate each theme into natural sentences that explain what attendees will experience or gain. Do NOT just list them; weave them into the narrative.`,
        `- Write in a professional, engaging tone suitable for a public event announcement.`,
        `- Paragraph 1: Introduce the event — what it is, when, and where.`,
        `- Paragraph 2: Describe what the event will cover or involve, drawing on the key themes.`,
        `- Paragraph 3: A closing sentence on why members or attendees should come.`,
        `- Do NOT invent specific names, statistics, or sponsors not provided.`,
        `- Return only the description text — no headings, no labels, no bullet points.`,
      ].filter((l) => l !== null).join("\n");

      const text = await callAI(prompt, 600);
      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { text }, remaining: quota.remaining - 1 });
    }

    // ── Translate ─────────────────────────────────────────────────────────────
    if (type === "translate") {
      const text       = String(body.text       ?? "").trim();
      const targetLang = String(body.targetLang ?? "ne").trim();

      if (!text) {
        return NextResponse.json({ success: false, error: "Text is required for translation." }, { status: 400 });
      }

      const langNames: Record<string, string> = { ne: "Nepali (Devanagari script)" };
      const langLabel = langNames[targetLang] ?? targetLang;

      const prompt = [
        `Translate the following text into ${langLabel}. Preserve the paragraph structure.`,
        `Return only the translated text — no labels, no explanations, no original text.`,
        ``,
        text,
      ].join("\n");

      const translated = await callAI(prompt, 1000);
      await incrementUsage(associationId);
      return NextResponse.json({ success: true, data: { text: translated }, remaining: quota.remaining - 1 });
    }

    return NextResponse.json({ success: false, error: "Unknown generation type." }, { status: 400 });

  } catch (err) {
    console.error("[AI Generate]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not configured") || message.includes("invalid")) {
      return NextResponse.json({ success: false, error: "AI generation is not configured. Ask your admin to add the GROQ_API_KEY to the server environment." }, { status: 503 });
    }
    if (message.includes("quota") || message.includes("429")) {
      return NextResponse.json({ success: false, error: "AI quota exceeded. Please wait a minute and try again, or upgrade your Gemini API plan." }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
