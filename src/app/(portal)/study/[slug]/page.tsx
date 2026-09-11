import StudyCategoryView from "@/components/study/StudyCategoryView";

export default async function StudyCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StudyCategoryView slug={slug} />;
}
