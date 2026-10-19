import { NextResponse, type NextRequest } from "next/server";
import { getMeeting, deleteMeeting, addAttendee } from "@/lib/db";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const meeting = await getMeeting(params.id);
  if (!meeting) {
    return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
  }
  return NextResponse.json(meeting);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Inscrit un participant (nom + email) à la réunion
  const body = (await request.json()) as { name?: string; email?: string };
  const { name, email } = body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  const meeting = await addAttendee(params.id, {
    name: name?.trim() || "Invité",
    email: email.trim(),
  });
  if (!meeting) {
    return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
  }
  return NextResponse.json(meeting);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const ok = await deleteMeeting(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
