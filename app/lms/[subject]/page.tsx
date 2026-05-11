import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import SubjectOverviewLayout from "@/src/components/learn/SubjectOverviewLayout";

type Params = {
  subject: string;
};

async function getSubjectData(subjectSlug: string) {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("name slug description").lean();

  if (!subject) {
    return null;
  }

  const classes = await ClassModel.find({ subject: subject._id })
    .select("slug name")
    .sort({ name: 1 })
    .lean();

  return {
    subject,
    classes,
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject } = await params;
  const subjectData = await getSubjectData(subject);

  if (!subjectData) {
    return {
      title: "Subject Not Found | Python Arena LMS",
      description: "The requested subject could not be found.",
    };
  }

  return {
    title: `${subjectData.subject.name} | Python Arena LMS`,
    description:
      subjectData.subject.description ||
      `Explore ${subjectData.subject.name} classes and lessons in Python Arena LMS.`,
    alternates: {
      canonical: `/lms/${subject}`,
    },
  };
}

export default async function SubjectOverviewPage({ params }: { params: Promise<Params> }) {
  const { subject } = await params;
  const subjectData = await getSubjectData(subject);

  if (!subjectData) {
    notFound();
  }

  return (
    <SubjectOverviewLayout
      subject={{
        name: subjectData.subject.name,
        slug: subjectData.subject.slug,
        description: subjectData.subject.description || "",
      }}
      classes={subjectData.classes}
    />
  );
}
