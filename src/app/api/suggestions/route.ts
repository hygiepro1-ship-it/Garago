import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAdminNewSuggestion } from "@/lib/email";
import { clientIp, isRateLimited, isValidEmail, cleanText } from "@/lib/abuse";

// Validate: no URLs, emails, phone numbers in suggestion content
function validateContent(text: string): string | null {
  if (!text?.trim()) return "Le contenu est requis.";
  if (text.trim().length < 10) return "La suggestion doit contenir au moins 10 caractères.";
  if (text.length > 2000) return "La suggestion ne peut pas dépasser 2000 caractères.";
  if (/(https?:\/\/|www\.)/i.test(text)) return "Les liens ne sont pas autorisés.";
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { content, authorName, authorEmail, _hp } = body;

  // Honeypot — bots fill this hidden field, humans don't
  if (_hp) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const err = validateContent(content);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  if (authorEmail && !isValidEmail(String(authorEmail).trim())) return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
  // Chaque suggestion déclenche un courriel à l'administrateur : on limite le débit par IP.
  if (await isRateLimited(`sg:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de suggestions. Réessayez plus tard." }, { status: 429 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      content:     content.trim(),
      authorName:  cleanText(authorName, 80)  || null,
      authorEmail: authorEmail ? String(authorEmail).trim().toLowerCase() : null,
    },
  });

  // Notification email à l'admin — await obligatoire (Vercel coupe après la réponse)
  if (!process.env.ADMIN_EMAIL) {
    console.error("[SUGGESTION] ADMIN_EMAIL non configuré dans les variables d'environnement Vercel.");
  } else if (!process.env.RESEND_API_KEY) {
    console.error("[SUGGESTION] RESEND_API_KEY non configuré.");
  } else {
    try {
      await sendAdminNewSuggestion({
        content:     suggestion.content,
        authorName:  suggestion.authorName,
        authorEmail: suggestion.authorEmail,
      });
      console.log("[SUGGESTION] Email admin envoyé à", process.env.ADMIN_EMAIL);
    } catch (e) {
      console.error("[SUGGESTION] Erreur envoi email admin:", e);
    }
  }

  return NextResponse.json(suggestion, { status: 201 });
}
