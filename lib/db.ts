// import { promises as fs } from "fs";
// import path from "path";
// import type { Attendee, Meeting } from "./types";

// const DB_PATH = path.join(process.cwd(), "data", "meetings.json");

// async function readAll(): Promise<Meeting[]> {
//   try {
//     const raw = await fs.readFile(DB_PATH, "utf-8");
//     return JSON.parse(raw) as Meeting[];
//   } catch (err) {
//     if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
//     throw err;
//   }
// }

// async function writeAll(meetings: Meeting[]): Promise<void> {
//   await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
//   await fs.writeFile(DB_PATH, JSON.stringify(meetings, null, 2), "utf-8");
// }

// export async function listMeetings(hostEmail?: string | null): Promise<Meeting[]> {
//   const all = await readAll();
//   if (!hostEmail) return all;
//   return all.filter((m) => m.hostEmail.toLowerCase() === hostEmail.toLowerCase());
// }

// export async function getMeeting(id: string): Promise<Meeting | null> {
//   const all = await readAll();
//   return all.find((m) => m.id === id) || null;
// }

// export async function createMeeting(meeting: Meeting): Promise<Meeting> {
//   const all = await readAll();
//   all.push(meeting);
//   await writeAll(all);
//   return meeting;
// }

// export async function deleteMeeting(id: string): Promise<boolean> {
//   const all = await readAll();
//   const next = all.filter((m) => m.id !== id);
//   await writeAll(next);
//   return next.length !== all.length;
// }

// export async function addAttendee(id: string, attendee: Attendee): Promise<Meeting | null> {
//   const all = await readAll();
//   const meeting = all.find((m) => m.id === id);
//   if (!meeting) return null;
//   meeting.attendees = meeting.attendees || [];
//   const already = meeting.attendees.find(
//     (a) => a.email.toLowerCase() === attendee.email.toLowerCase()
//   );
//   if (!already) meeting.attendees.push(attendee);
//   await writeAll(all);
//   return meeting;
// }

import { Pool } from "pg";
import type { Attendee, Meeting } from "./types";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://editor_user:Postgres.2424@host.docker.internal:5432/editor_db";
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

let initialized = false;
let initializing: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (initialized) return;

  if (!initializing) {
    initializing = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS meetings (
          id TEXT PRIMARY KEY,
          host_email TEXT NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS meetings_host_email_idx
        ON meetings (host_email)
      `);

      initialized = true;
    })().finally(() => {
      initializing = null;
    });
  }

  await initializing;
}

export async function listMeetings(
  hostEmail?: string | null,
): Promise<Meeting[]> {
  await ensureTable();

  if (!hostEmail) {
    const result = await pool.query<{ data: Meeting }>(`
      SELECT data
      FROM meetings
      ORDER BY created_at DESC
    `);

    return result.rows.map((row) => row.data);
  }

  const result = await pool.query<{ data: Meeting }>(
    `
      SELECT data
      FROM meetings
      WHERE LOWER(host_email) = LOWER($1)
      ORDER BY created_at DESC
    `,
    [hostEmail],
  );

  return result.rows.map((row) => row.data);
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  await ensureTable();

  const result = await pool.query<{ data: Meeting }>(
    `
      SELECT data
      FROM meetings
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0]?.data ?? null;
}

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  await ensureTable();

  await pool.query(
    `
      INSERT INTO meetings (
        id,
        host_email,
        data
      )
      VALUES ($1, $2, $3::jsonb)
    `,
    [meeting.id, meeting.hostEmail, JSON.stringify(meeting)],
  );

  return meeting;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  await ensureTable();

  const result = await pool.query(
    `
      DELETE FROM meetings
      WHERE id = $1
    `,
    [id],
  );

  return result.rowCount === 1;
}

export async function addAttendee(
  id: string,
  attendee: Attendee,
): Promise<Meeting | null> {
  await ensureTable();

  const result = await pool.query<{ data: Meeting }>(
    `
      SELECT data
      FROM meetings
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (!result.rows[0]) {
    return null;
  }

  const meeting = result.rows[0].data;

  meeting.attendees = meeting.attendees || [];

  const already = meeting.attendees.some(
    (a) => a.email.toLowerCase() === attendee.email.toLowerCase(),
  );

  if (!already) {
    meeting.attendees.push(attendee);
  }

  await pool.query(
    `
      UPDATE meetings
      SET
        data = $1::jsonb,
        host_email = $2
      WHERE id = $3
    `,
    [JSON.stringify(meeting), meeting.hostEmail, id],
  );

  return meeting;
}
