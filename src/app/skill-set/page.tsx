import type { Metadata } from "next";
import { Suspense } from "react";
import SkillSetFinder from "@/components/SkillSetFinder";

export const metadata: Metadata = {
  title: "Find your skill set",
  description:
    "Describe what you are building and get a short list of Claude Code skills, plugins and collections that fit together.",
};

export default function SkillSetPage() {
  return (
    <main className="flex-1">
      <Suspense fallback={null}>
        <SkillSetFinder />
      </Suspense>
    </main>
  );
}
