import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Projects & Gallery",
  description:
    "From raw logs to finished dining tables — explore Timber spaces, custom builds and the craft behind every piece.",
  path: "/projects",
});

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
