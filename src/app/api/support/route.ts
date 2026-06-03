import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_TYPES = ["DRIVER", "GARAGE"];

function validate(question: string, type: string): string | null {
  if (!question?.trim())                return "La question est requise.";
  if (question.trim().length < 10)      return "La question doit contenir au moins 10 caractères.";
  if (question.length > 2000)           return "La question ne peut pas dépasser 2 000 caractères.";
  if (/(https?:\/\/|www\.)/i.test(question)) return "Les liens ne sont pas autorisés.";
  if (!VALID_TYPES.includes(type))      return "Type invalide.";
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, question, authorName, authorEmail } = body;

  const err = validate(question, type);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const record = await prisma.supportQuestion.create({
    data: {
      type,
      question:    question.trim(),
      authorName:  authorName?.trim()  || null,
      authorEmail: authorEmail?.trim() || null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
