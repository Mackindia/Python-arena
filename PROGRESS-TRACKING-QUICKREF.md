# Progress Tracking System - Quick Reference

## 🚀 Quick Start

### 1. Mark a Lesson Complete (Frontend)

```typescript
import { markLessonComplete } from "@/lib/progress-utils";

const result = await markLessonComplete(
  "physics",        // subject
  "class-11",       // class
  "lesson-1"        // lesson
);

if (result.success) {
  console.log("✓ Lesson marked complete!");
}
```

### 2. Fetch User Progress (Hook)

```typescript
import { useProgressDashboard } from "@/src/hooks/useProgress";

export function Dashboard() {
  const { dashboard, loading } = useProgressDashboard();
  
  return <div>{dashboard?.overallPercentage}% complete</div>;
}
```

### 3. Get Class Progress (Hook)

```typescript
import { useClassProgress } from "@/src/hooks/useProgress";

const { progress } = useClassProgress("class-11");
// progress.completedLessons, progress.percentage, progress.lessons
```

### 4. Add Progress Tracker to Lesson

```typescript
import { LessonProgressTracker } from "@/src/components/learn/LessonProgressTracker";

<LessonProgressTracker
  lessonSlug="lesson-1"
  lessonTitle="Newton's Laws"
  subjectSlug="physics"
  classSlug="class-11"
  isCompleted={false}
  onComplete={() => refetch()}
/>
```

### 5. Display Full Dashboard

```typescript
import { ProgressDashboard } from "@/src/components/learn/ProgressDashboard";

<ProgressDashboard />
```

---

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/lms/progress/complete` | POST | Mark lesson complete |
| `/api/lms/progress/dashboard` | GET | User's complete progress |
| `/api/lms/progress/class/[slug]` | GET | Class-level progress |
| `/api/lms/progress/subject/[slug]` | GET | Subject-level progress |
| `/api/lms/progress/analytics` | GET | Activity analytics |

---

## 🪝 Frontend Hooks

### useProgressDashboard()
```typescript
const { dashboard, loading, error, refetch } = useProgressDashboard();
// dashboard: UserProgressDashboard | null
// dashboard.overallPercentage, subjects[], recentActivity[], stats{}
```

### useClassProgress(classSlug)
```typescript
const { progress, loading, error } = useClassProgress("class-11");
// progress.completedLessons, totalLessons, percentage, lessons[]
```

### useSubjectProgress(subjectSlug)
```typescript
const { progress, loading } = useSubjectProgress("physics");
// progress.completedLessons, totalLessons, classes[]
```

### useProgressAnalytics()
```typescript
const { analytics } = useProgressAnalytics();
// analytics.totalCompleted, completionRatePercent, lessonsPerWeek, activityByDate{}
```

---

## 🎨 Components

### ProgressDashboard
Complete dashboard with subject selection and stats.
```typescript
<ProgressDashboard />
// Features: Overall stats, subject selection, class breakdown, recent activity
```

### LessonProgressTracker
Mark a lesson as complete in lesson viewer.
```typescript
<LessonProgressTracker
  lessonSlug="..."
  lessonTitle="..."
  subjectSlug="..."
  classSlug="..."
  isCompleted={false}
  onComplete={() => {}}
/>
```

---

## 🛠️ Utility Functions

### Marking Progress
```typescript
import { markLessonComplete } from "@/lib/progress-utils";

await markLessonComplete(subject, classSlug, lessonSlug);
```

### Formatting
```typescript
import {
  formatProgressPercentage,      // "42%"
  getProgressColor,              // "text-cyan-400"
  getProgressBgGradient,         // "from-cyan-500 to-cyan-400"
  formatCompletedDate,           // "Today at 10:30 AM"
  getTimeToComplete,             // "About 2 weeks"
} from "@/lib/progress-utils";
```

### Analytics
```typescript
import {
  calculateDailyAverageRate,     // 2.5 lessons/day
  getLongestStreak,              // 7 days
  compareProgressToAverage,      // { behind: false, lessonsAhead: 5 }
  getMilestones,                 // [{ name: "Halfway", achieved: true }]
  getSuggestedNextSteps,         // ["Continue with next lesson"]
} from "@/lib/progress-utils";
```

---

## 📝 Types

### ClassProgress
```typescript
{
  classId: string;
  classSlug: string;
  className: string;
  subjectId: string;
  subjectSlug: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  lessons: LessonProgressItem[];
  lastActivityAt: string | null;
}
```

### UserProgressDashboard
```typescript
{
  userId: string;
  totalCompletedLessons: number;
  totalLessons: number;
  overallPercentage: number;
  streak: number;
  lastActivityAt: string | null;
  subjects: SubjectProgress[];
  recentActivity: Array<{ lessonTitle: string; completedAt: string }>;
  stats: {
    averageCompletionRate: number;
    fasterThanAverage: boolean;
    estimatedCompletion: string | null;
  };
}
```

---

## 🔌 Integration Patterns

### Pattern 1: Lesson Viewer Integration
```typescript
// app/learn/[subject]/[class]/[lesson]/page.tsx
export default function LessonPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  return (
    <>
      <PDFViewer pdfUrl="..." />
      <LessonProgressTracker
        isCompleted={false}
        onComplete={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
}
```

### Pattern 2: Class Overview
```typescript
// app/learn/[subject]/[class]/page.tsx
export default function ClassPage({ params }: Props) {
  const { progress } = useClassProgress(await params.class);
  
  return (
    <div>
      <ProgressBar percentage={progress.percentage} />
      <LessonList lessons={progress.lessons} />
    </div>
  );
}
```

### Pattern 3: Dashboard Page
```typescript
// app/dashboard/page.tsx
import { ProgressDashboard } from "@/src/components/learn/ProgressDashboard";

export default function Page() {
  return <ProgressDashboard />;
}
```

---

## 🐛 Common Patterns

### Check if Lesson is Complete
```typescript
import { getLessonCompletionStatus } from "@/lib/progress-utils";

const status = getLessonCompletionStatus(progress.percentage);
// "not-started" | "in-progress" | "completed"
```

### Show Completion Badge
```typescript
import { getCompletionBadgeText, getProgressColor } from "@/lib/progress-utils";

const text = getCompletionBadgeText(85); // "85% Complete"
const color = getProgressColor(85);      // "text-blue-400"

<span className={color}>{text}</span>
```

### Compare Performance
```typescript
const comparison = compareProgressToAverage(75, 60, 48);
// { behind: false, percentageDiff: 15, lessonsAhead: 7 }

if (!comparison.behind) {
  console.log(`You're ${comparison.lessonsAhead} lessons ahead!`);
}
```

### Get Suggestions
```typescript
const suggestions = getSuggestedNextSteps(45, lastActivityDate, 3);
suggestions.forEach(msg => console.log(msg));
```

---

## 💾 MongoDB Queries (Backend)

### Create/Update Progress
```typescript
await LessonProgressModel.updateOne(
  { userId, lesson: lessonId },
  {
    $set: {
      userId,
      lesson: lessonId,
      completed: true,
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
  },
  { upsert: true }
);
```

### Get User's Completed Lessons
```typescript
const completed = await LessonProgressModel.countDocuments({
  userId,
  completed: true,
});
```

### Get Class Progress (Aggregation)
```typescript
const stats = await LessonProgressModel.aggregate([
  { $match: { userId, class: classId } },
  { $group: { _id: null, count: { $sum: 1 } } },
]);
```

---

## ⚡ Performance Tips

1. **Use Lean Queries** - All read operations use `.lean()` for speed
2. **Index on (userId, lesson)** - Critical for upsert operations
3. **Aggregate at Database** - Use MongoDB aggregation, not in-memory loops
4. **Cache Dashboard** - Consider Redis for top-level dashboard data
5. **Pagination** - For large activity histories, implement date-range filtering

---

## 🔐 Authentication

All progress APIs require Clerk authentication:
```typescript
const authUser = await currentUser();
if (!authUser?.id) {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
```

The `userId` is automatically injected from Clerk's `authUser.id`.

---

## 📋 Checklist for Integration

- [ ] Create `/app/dashboard/page.tsx` with `<ProgressDashboard />`
- [ ] Add `<LessonProgressTracker />` to lesson viewer
- [ ] Add `<useClassProgress>` hook to class overview
- [ ] Update lesson sidebar to show completion badges
- [ ] Add "Recent Activity" section to dashboard
- [ ] Test marking lessons complete
- [ ] Verify MongoDB indexes are created
- [ ] Test with multiple users
- [ ] Monitor API performance

---

## 📞 Support

For issues or questions about the progress tracking system:
1. Check [PROGRESS-TRACKING-SYSTEM.md](./PROGRESS-TRACKING-SYSTEM.md) for detailed docs
2. Review integration examples in [PROGRESS-TRACKING-EXAMPLES.tsx](./PROGRESS-TRACKING-EXAMPLES.tsx)
3. Check database schema in MongoDB Atlas
4. Verify Clerk authentication is configured

---

**Last Updated**: 2024-01-15
**Version**: 1.0
**Status**: ✅ Production Ready
