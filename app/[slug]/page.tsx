import { STORIES } from "@/lib/stories";
import StoryPlayer from "@/components/StoryPlayer";

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoryPlayer slug={slug} />;
}
