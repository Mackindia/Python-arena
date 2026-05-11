# Lesson Navigation System

A comprehensive, production-ready navigation system for LMS lessons with sidebar chapter navigation, previous/next buttons, progress tracking, and breadcrumb navigation.

## 🎯 Components

### 1. **LessonNavigationSidebar**
`src/components/learn/LessonNavigationSidebar.tsx`

Sticky sidebar that displays:
- Overall course progress percentage
- Completed vs total lessons
- Expandable chapters with lessons
- Current lesson highlighting with ring indicator
- Completion checkmarks for finished lessons
- Quick stats (completed/remaining lessons)

**Props:**
```typescript
{
  chapters: Chapter[];           // Array of chapters with lessons
  currentChapterName: string;    // Current chapter name
  currentLessonSlug: string;     // Current lesson slug
  basePath: string;              // Base URL path
  classSlug: string;             // Class slug
  subjectSlug: string;           // Subject slug
}
```

**Features:**
- ✅ Sticky positioning (stays visible while scrolling)
- ✅ Progress bar with gradient
- ✅ Expandable chapter sections
- ✅ Current lesson highlighting
- ✅ Completion status indicators
- ✅ Responsive design

---

### 2. **LessonNavigationFooter**
`src/components/learn/LessonNavigationFooter.tsx`

Bottom navigation between lessons with:
- Previous lesson button (shows first lesson message if at start)
- Next lesson button (shows completion message if at end)
- Hover effects with gradient overlays
- Status indicators for edge cases

**Props:**
```typescript
{
  previousLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
  basePath: string;
}
```

**Features:**
- ✅ Two-column grid layout
- ✅ Gradient hover effects
- ✅ Smart disabled states
- ✅ Lesson title preview
- ✅ Next lesson accent (cyan)

---

### 3. **ProgressTracker**
`src/components/learn/ProgressTracker.tsx`

Lesson progress display with:
- Overall lesson completion percentage
- Checkpoint checklist (overview, PDF, quiz, exercises)
- Completion badge for finished lessons
- Checkpoint summary stats
- Next steps guidance

**Props:**
```typescript
{
  lessonTitle: string;
  completionPercentage?: number;
  checkpoints?: Checkpoint[];
  isLessonCompleted?: boolean;
}
```

**Features:**
- ✅ Animated progress bar
- ✅ Checkpoint tracking
- ✅ Status badges
- ✅ Guidance messages
- ✅ Customizable checkpoints

---

### 4. **LessonBreadcrumb**
`src/components/learn/LessonBreadcrumb.tsx`

Breadcrumb navigation showing lesson path:
- Subject > Class > Chapter > Lesson
- Clickable parents (back navigation)
- Current lesson highlighted

**Props:**
```typescript
{
  items: BreadcrumbItem[];
}
```

**Features:**
- ✅ Responsive horizontal layout
- ✅ Slash separator between items
- ✅ Cyan color for links
- ✅ Scrollable on mobile

---

## 📦 Utility Functions

`src/lib/lesson-navigation.ts` provides 12+ helper functions:

### Progress Calculation
- `calculateOverallProgress(chapters)` - Course-wide progress stats
- `calculateChapterProgress(chapter)` - Chapter-specific progress
- `calculateLessonCompletion(checkpoints)` - Completion % from checkpoints

### Navigation
- `findLessonPosition(chapters, slug)` - Next/previous lesson and position
- `isFirstLesson(chapters, slug)` - Check if first in chapter
- `isLastLesson(chapters, slug)` - Check if last in chapter

### Data Generation
- `generateBreadcrumbs(...)` - Create breadcrumb array
- `createDefaultCheckpoints(content)` - Generate checkpoint list
- `updateCheckpoint(checkpoints, id, completed)` - Update checkpoint status

### Utilities
- `validateLessonNavigation(chapters)` - Validate data structure
- `groupLessonsByCompletion(chapters)` - Group by status
- `getLessonsByChapter(chapters, name)` - Filter by chapter
- `filterLessonsByQuery(chapters, query)` - Search lessons
- `formatLessonPath(...)` - Format for logging/analytics

---

## 🔗 Type Definitions

All types exported from `lesson-navigation.ts`:

```typescript
type Lesson = {
  slug: string;
  title: string;
  completed?: boolean;
  progress?: number;
  description?: string;
};

type Chapter = {
  name: string;
  lessons: Lesson[];
};

type Checkpoint = {
  id: string;
  title: string;
  completed: boolean;
  icon?: string;
};

type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};
```

---

## 📊 Data Flow

```
Lesson Page Route
    ↓
Fetch lesson data & chapters
    ↓
Calculate navigation positions
    ↓
Render:
  ├─ Breadcrumb (top)
  ├─ Main content (center)
  ├─ Sidebar navigation (right)
  │   └─ Progress tracker
  ├─ Footer navigation (bottom)
  └─ Quiz/interactions
```

---

## 🎨 Design System

### Colors (Dark Theme)
- Background: `slate-950`
- Cards: `slate-900`, `slate-800`
- Text: `slate-200`, `slate-300`, `slate-400`
- Borders: `white/10`, `white/15`
- Accent: `cyan-400`, `cyan-300`
- Success: `emerald-400`

### Layout
- Sidebar: `sticky top-6` (desktop only)
- Footer: Two-column grid on desktop, stacked on mobile
- Progress bar: Gradient `cyan-400 to blue-500`

### Animations
- Progress bar: `transition-all duration-500`
- Hover effects: `transition` with gradient overlays
- Checkpoints: Smooth state transitions

---

## 💻 Integration Example

### Complete Lesson Page Setup

```tsx
import { calculateOverallProgress, findLessonPosition, createDefaultCheckpoints } from "@/src/lib/lesson-navigation";
import LessonNavigationSidebar from "@/src/components/learn/LessonNavigationSidebar";
import LessonNavigationFooter from "@/src/components/learn/LessonNavigationFooter";
import LessonBreadcrumb from "@/src/components/learn/LessonBreadcrumb";
import ProgressTracker from "@/src/components/learn/ProgressTracker";

export default async function LessonPage({ params }) {
  const { subject, classSlug, lesson } = await params;
  
  // Fetch lesson data
  const chapters = await fetchChaptersWithLessons(classSlug);
  const lessonData = await fetchLesson(lesson);
  const completionState = await fetchCompletionState(userId, lesson);

  // Calculate navigation
  const position = findLessonPosition(chapters, lesson);
  const progress = calculateOverallProgress(chapters);
  const checkpoints = createDefaultCheckpoints({
    hasPdf: !!lessonData.pdfUrl,
    hasQuiz: true,
  });

  return (
    <main>
      {/* Breadcrumb Navigation */}
      <LessonBreadcrumb items={generateBreadcrumbs(...)} />

      <div className="grid lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <article>
          <h1>{lessonData.title}</h1>
          {/* PDF Viewer, Quiz, etc. */}
          
          {/* Footer Navigation */}
          <LessonNavigationFooter
            previousLesson={position.previous}
            nextLesson={position.next}
            basePath={`/lms/${subject}/${classSlug}`}
          />
        </article>

        {/* Sidebar Navigation */}
        <aside>
          <LessonNavigationSidebar
            chapters={chapters}
            currentChapterName={position.chapterName}
            currentLessonSlug={lesson}
            basePath={`/lms/${subject}/${classSlug}`}
            classSlug={classSlug}
            subjectSlug={subject}
          />
          
          <ProgressTracker
            lessonTitle={lessonData.title}
            completionPercentage={completionState.percentage}
            checkpoints={checkpoints}
            isLessonCompleted={completionState.completed}
          />
        </aside>
      </div>
    </main>
  );
}
```

---

## 📱 Responsive Behavior

| Screen | Layout | Features |
|--------|--------|----------|
| Mobile | Single column | Breadcrumb, content, footer nav (no sidebar) |
| Tablet | Single column + sidebar | All visible, sidebar scrolls |
| Desktop | Two columns | Sidebar sticky, full height |

---

## 🧪 Testing Utilities

### Validate Navigation Data
```typescript
const validation = validateLessonNavigation(chapters);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### Test Progress Calculation
```typescript
const progress = calculateOverallProgress(chapters);
assert(progress.percentage >= 0 && progress.percentage <= 100);
```

### Test Position Finding
```typescript
const pos = findLessonPosition(chapters, "lesson-slug");
assert(pos.current !== null);
assert(pos.previous || !isFirstLesson(chapters, "lesson-slug"));
```

---

## 🎯 All Requirements Met

| Requirement | Status | Component |
|---|---|---|
| Next lesson button | ✅ | LessonNavigationFooter |
| Previous lesson button | ✅ | LessonNavigationFooter |
| Sidebar chapter navigation | ✅ | LessonNavigationSidebar |
| Current lesson highlighting | ✅ | LessonNavigationSidebar (ring indicator) |
| Progress-ready structure | ✅ | ProgressTracker + utilities |
| Responsive design | ✅ | All components |

---

## 📋 Usage Checklist

- [ ] Import navigation components
- [ ] Fetch lesson chapters/hierarchy
- [ ] Calculate navigation positions using utilities
- [ ] Render breadcrumb at top
- [ ] Render main content
- [ ] Render sidebar (desktop only)
- [ ] Render footer navigation
- [ ] Test on mobile/tablet/desktop
- [ ] Verify progress calculation
- [ ] Test checkpoint updates

---

## 🚀 Performance Tips

1. **Memoize calculations** - Use `useMemo` for progress calculations
2. **Lazy load chapters** - Load current chapter lessons immediately, others on demand
3. **Cache chapter data** - Fetch once, reuse across page
4. **Optimize sidebar** - Only expand current chapter by default
5. **Use React.memo** - Memoize navigation items to prevent re-renders

---

## 🔮 Future Enhancements

- Lesson search within chapter navigation
- Progress sync with backend
- Lesson recommendations based on performance
- Chapter completion badges
- Suggested next chapter indicators
- Lesson time estimates
- Difficulty levels
- Related lessons suggestions

---

## 📞 Quick Reference

### Import All Components
```tsx
import LessonNavigationSidebar from "@/src/components/learn/LessonNavigationSidebar";
import LessonNavigationFooter from "@/src/components/learn/LessonNavigationFooter";
import ProgressTracker from "@/src/components/learn/ProgressTracker";
import LessonBreadcrumb from "@/src/components/learn/LessonBreadcrumb";
import * as navigationUtils from "@/src/lib/lesson-navigation";
```

### Import Types
```tsx
import type {
  Lesson,
  Chapter,
  Checkpoint,
  BreadcrumbItem,
  NavItem,
} from "@/src/lib/lesson-navigation";
```

### Import Utilities
```tsx
import {
  calculateOverallProgress,
  findLessonPosition,
  createDefaultCheckpoints,
} from "@/src/lib/lesson-navigation";
```

---

## 🎉 Summary

A complete, production-ready lesson navigation system featuring:
- ✅ Four reusable components
- ✅ 12+ utility functions
- ✅ Full TypeScript support
- ✅ Dark theme styling
- ✅ Responsive design
- ✅ Progress tracking
- ✅ Breadcrumb navigation
- ✅ Chapter/lesson exploration
