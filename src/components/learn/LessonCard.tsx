import Link from "next/link";

type LessonCardProps = {
  subjectSlug: string;
  classSlug: string;
  lesson: {
    slug: string;
    title: string;
    description: string;
    thumbnail: string;
    progress?: number;
    published: boolean;
  };
};

export default function LessonCard({
  subjectSlug,
  classSlug,
  lesson,
}: LessonCardProps) {
  const lessonPath = `/lms/${subjectSlug}/${classSlug}/${lesson.slug}`;
  const progress = lesson.progress ?? 0;

  return (
    <Link
      href={lessonPath}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_16px_60px_rgba(2,6,23,0.25)] transition hover:border-cyan-400/50 hover:shadow-[0_16px_60px_rgba(2,6,23,0.45)]"
    >
      {/* Thumbnail */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-800">
        {lesson.thumbnail ? (
          <>
            <img
              src={lesson.thumbnail}
              alt={lesson.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/60 group-hover:to-slate-950/40 transition" />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center">
            <svg className="h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Published Badge */}
        {lesson.published && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-cyan-500/90 px-2 py-1 text-xs font-semibold text-slate-950">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Published
          </div>
        )}

        {/* Status Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <div className="flex items-center gap-2 text-cyan-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-semibold">View lesson</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white group-hover:text-cyan-200 transition line-clamp-2">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs font-semibold text-cyan-300">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
