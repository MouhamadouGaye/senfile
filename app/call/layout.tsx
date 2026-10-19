import type { ReactNode } from "react";
import "./meeting.css";

export default function MeetingLayout({ children }: { children: ReactNode }) {
  return <div className="meeting-layout">{children}</div>;
}
