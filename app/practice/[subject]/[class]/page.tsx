import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import PracticeResourceModel from "@/models/practice/PracticeResource";

export const dynamic = "force-dynamic";

type Params = { subject: string; class: string };

type ResourceItem = {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  fileUrl: string;
  createdAt: string;
};

function formatType(resourceType: string) {
  return resourceType
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getClassResources(subjectSlug: string, classSlug: string): Promise<{
  subjectName: string;
  className: string;
  resources: ResourceItem[];
} | null> {
  await connectDB();

  const subject = await SubjectModel.findOne({ slug: subjectSlug }).select("_id name").lean();
  if (!subject?._id) return null;

  const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id name").lean();
  if (!classDoc?._id) return null;

  const resources = await PracticeResourceModel.find({
    subject: subject._id,
    class: classDoc._id,
    published: true,
  })
    .select("_id title description resourceType fileUrl createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return {
    subjectName: String((subject as { name?: string }).name || "Subject"),
    className: String((classDoc as { name?: string }).name || "Class"),
    resources: resources.map((resource) => {
      const item = resource as {
        _id?: unknown;
        title?: string;
        description?: string;
        resourceType?: string;
        fileUrl?: string;
        createdAt?: string | Date;
        updatedAt?: string | Date;
      };
      const dateValue = item.createdAt || item.updatedAt;
      return {
        id: String(item._id),
        title: item.title || "Untitled Resource",
        description: item.description || "",
        resourceType: item.resourceType || "question-paper",
        fileUrl: item.fileUrl || "",
        createdAt: dateValue
          ? new Date(dateValue).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : "",
      };
    }),
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;
  const data = await getClassResources(subject, classSlug);

  return {
    title: `${data?.subjectName || "Subject"} ${data?.className || "Class"} Practice Question Papers`,
    description: "View, print, and download class-wise practice question papers.",
    alternates: { canonical: `/practice/${subject}/${classSlug}` },
  };
}

export default async function PracticeClassPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const data = await getClassResources(subject, classSlug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/practice" className="hover:text-cyan-300">Practice Question Paper</Link>
          <span>/</span>
          <Link href={`/practice/${subject}`} className="hover:text-cyan-300">{data.subjectName}</Link>
          <span>/</span>
          <span className="text-slate-200">{data.className}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{data.subjectName} - {data.className}</h1>
        <p className="mt-2 text-slate-300">Question papers and important PDFs. Newest resources appear first.</p>

        <div className="mt-8 space-y-4">
          {data.resources.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No resources are published for this class yet.
            </div>
          ) : (
            data.resources.map((resource) => {
              const viewerUrl = `/pdf/view?url=${encodeURIComponent(resource.fileUrl)}&title=${encodeURIComponent(resource.title)}`;
              const printUrl = `/api/pdf-view?url=${encodeURIComponent(resource.fileUrl)}`;
              const downloadUrl = `/api/pdf-view?download=1&url=${encodeURIComponent(resource.fileUrl)}`;

              return (
                <article key={resource.id} className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{resource.title}</h2>
                      <p className="mt-1 text-xs text-cyan-300">{formatType(resource.resourceType)}</p>
                      {resource.description && <p className="mt-2 text-sm text-slate-300">{resource.description}</p>}
                    </div>
                    {resource.createdAt && <p className="text-xs text-slate-500">{resource.createdAt}</p>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={viewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                    >
                      View
                    </a>
                    <a
                      href={printUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                      Print
                    </a>
                    <a
                      href={downloadUrl}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                      Download
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
