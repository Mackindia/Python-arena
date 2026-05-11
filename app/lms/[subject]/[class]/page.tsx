import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import ClassLessonsLayout from "@/src/components/learn/ClassLessonsLayout";

type Params = {
  subject: string;
  class: string;
};

async function getClassLessonsData(subjectSlug: string, classSlug: string) {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("_id slug name").lean();

  if (!subject) {
    return null;
  }

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id })
    .select("_id slug name subject")
    .lean();

  if (!classRecord) {
    return null;
  }

  const lessons = await LessonModel.find({ class: classRecord._id, published: true })
    .select("slug title description thumbnail thumbnailUrl published createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return {
    subject: {
      name: subject.name,
      slug: subject.slug,
    },
    class: {
      name: classRecord.name,
      slug: classRecord.slug,
    },
    lessons: lessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description || "",
      thumbnail: (lesson.thumbnailUrl as string | undefined) || (lesson.thumbnail as string | undefined) || "",
      published: lesson.published || false,
    })),
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;
  const data = await getClassLessonsData(subject, classSlug);

  if (!data) {
    return {
      title: "Class Not Found | Python Arena LMS",
      description: "The requested class could not be found.",
    };
  }

  return {
    title: `${data.class.name} | ${data.subject.name} | Python Arena LMS`,
    description: `Explore lessons in ${data.class.name} under ${data.subject.name} in Python Arena LMS.`,
    alternates: {
      canonical: `/lms/${subject}/${classSlug}`,
    },
  };
}

export default async function ClassLessonsPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const data = await getClassLessonsData(subject, classSlug);

  if (!data) {
    notFound();
  }

  return (
    <ClassLessonsLayout
      subjectSlug={subject}
      classSlug={classSlug}
      subject={data.subject}
      class={data.class}
      lessons={data.lessons}
    />
  );
}
