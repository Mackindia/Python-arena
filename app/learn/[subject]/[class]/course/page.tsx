import { redirect } from "next/navigation";

type Params = { subject: string; class: string };

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  redirect(`/learn/${subject}/${classSlug}`);
}
