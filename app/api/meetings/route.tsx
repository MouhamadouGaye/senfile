import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { createMeeting, listMeetings } from "@/lib/db";
import type { CreateMeetingInput, Meeting } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hostEmail = searchParams.get("hostEmail");
  const meetings = await listMeetings(hostEmail);
  return NextResponse.json(meetings);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateMeetingInput;
  const {
    title,
    hostName,
    hostEmail,
    date,
    time,
    duration,
    description,
    instant,
  } = body;

  if (!hostEmail || !/^\S+@\S+\.\S+$/.test(hostEmail)) {
    return NextResponse.json(
      {
        error:
          "Une adresse email valide est requise pour planifier une réunion.",
      },
      { status: 400 },
    );
  }

  const meeting: Meeting = {
    id: nanoid(10),
    title: title?.trim() || "Réunion sans titre",
    hostName: hostName?.trim() || "Organisateur",
    hostEmail: hostEmail.trim(),
    date: date || null,
    time: time || null,
    duration: duration || 30,
    description: description?.trim() || "",
    instant: Boolean(instant),
    createdAt: Date.now(),
    attendees: [],
  };

  await createMeeting(meeting);
  return NextResponse.json(meeting, { status: 201 });
}
