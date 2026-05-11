/**
 * Progress Tracking Utilities
 * Helper functions for lesson progress operations, completion checks, and state management
 */

// ============================================================================
// Mark Lesson Complete
// ============================================================================

export async function markLessonComplete(
  subject: string,
  classSlug: string,
  lesson: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch("/api/lms/progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        class: classSlug,
        lesson,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to mark lesson complete",
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: "Lesson marked as complete",
      ...data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Progress Formatting Utilities
// ============================================================================

export function formatProgressPercentage(
  completed: number,
  total: number
): string {
  if (total === 0) return "0%";
  const percent = Math.round((completed / total) * 100);
  return `${percent}%`;
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 80) return "text-green-400";
  if (percentage >= 60) return "text-blue-400";
  if (percentage >= 40) return "text-yellow-400";
  if (percentage >= 20) return "text-orange-400";
  return "text-red-400";
}

export function getProgressBgGradient(percentage: number): string {
  if (percentage >= 80) return "from-green-500 to-green-400";
  if (percentage >= 60) return "from-blue-500 to-blue-400";
  if (percentage >= 40) return "from-yellow-500 to-yellow-400";
  if (percentage >= 20) return "from-orange-500 to-orange-400";
  return "from-red-500 to-red-400";
}

// ============================================================================
// Lesson Completion Status
// ============================================================================

export function getLessonCompletionStatus(
  percentage: number
): "not-started" | "in-progress" | "completed" {
  if (percentage === 0) return "not-started";
  if (percentage === 100) return "completed";
  return "in-progress";
}

export function getCompletionBadgeText(
  percentage: number
): string {
  const status = getLessonCompletionStatus(percentage);
  if (status === "not-started") return "Not Started";
  if (status === "in-progress") return `${percentage}% Complete`;
  return "Completed";
}

// ============================================================================
// Date/Time Utilities for Progress
// ============================================================================

export function formatCompletedDate(dateString: string | null): string {
  if (!dateString) return "Not completed";

  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function getTimeToComplete(
  completedLessons: number,
  totalLessons: number,
  lastActivityDate: string | null
): string | null {
  if (completedLessons >= totalLessons || !lastActivityDate) {
    return null;
  }

  const remaining = totalLessons - completedLessons;
  // Assume 2 days per lesson average
  const daysNeeded = remaining * 2;

  if (daysNeeded < 1) return "Less than a day";
  if (daysNeeded === 1) return "About a day";
  if (daysNeeded < 7) return `About ${Math.round(daysNeeded)} days`;
  if (daysNeeded < 30) return `About ${Math.round(daysNeeded / 7)} weeks`;

  return `About ${Math.round(daysNeeded / 30)} months`;
}

// ============================================================================
// Progress Analytics Utilities
// ============================================================================

export function calculateDailyAverageRate(
  activityByDate: Record<string, number>
): number {
  const dates = Object.keys(activityByDate);
  if (dates.length === 0) return 0;

  const total = Object.values(activityByDate).reduce((a, b) => a + b, 0);
  return Math.round(total / dates.length * 10) / 10;
}

export function getLongestStreak(
  activityByDate: Record<string, number>
): number {
  const dates = Object.keys(activityByDate).sort();
  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const previous = new Date(dates[i - 1]);

    const dayDiff =
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function getLastNDaysActivity(
  activityByDate: Record<string, number>,
  days: number
): Record<string, number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return Object.fromEntries(
    Object.entries(activityByDate).filter(([dateStr]) => {
      const date = new Date(dateStr);
      return date >= cutoffDate;
    })
  );
}

// ============================================================================
// Class/Subject Progress Comparisons
// ============================================================================

export type ProgressComparison = {
  behind: boolean;
  percentageDiff: number;
  lessonsAhead: number;
  lessonsApprox: string;
};

export function compareProgressToAverage(
  userPercentage: number,
  averagePercentage: number,
  totalLessons: number
): ProgressComparison {
  const diff = userPercentage - averagePercentage;
  const behind = diff < 0;
  const lessonsDiff = Math.abs(Math.round((diff / 100) * totalLessons));

  return {
    behind,
    percentageDiff: Math.abs(diff),
    lessonsAhead: behind ? -lessonsDiff : lessonsDiff,
    lessonsApprox: behind
      ? `${lessonsDiff} lessons behind`
      : `${lessonsDiff} lessons ahead`,
  };
}

// ============================================================================
// Progress Milestone Detection
// ============================================================================

export type Milestone = {
  name: string;
  achieved: boolean;
  completionPercentage: number;
  emoji: string;
};

export function getMilestones(
  completedLessons: number,
  totalLessons: number
): Milestone[] {
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return [
    {
      name: "Getting Started",
      achieved: completedLessons >= 1,
      completionPercentage: 0,
      emoji: "🚀",
    },
    {
      name: "Quarter Way",
      achieved: percentage >= 25,
      completionPercentage: 25,
      emoji: "📈",
    },
    {
      name: "Halfway There",
      achieved: percentage >= 50,
      completionPercentage: 50,
      emoji: "⚡",
    },
    {
      name: "Almost Done",
      achieved: percentage >= 75,
      completionPercentage: 75,
      emoji: "🎯",
    },
    {
      name: "Mastered",
      achieved: percentage === 100,
      completionPercentage: 100,
      emoji: "🏆",
    },
  ];
}

// ============================================================================
// Suggested Next Steps
// ============================================================================

export function getSuggestedNextSteps(
  completedPercentage: number,
  lastActivityDate: string | null,
  hasStreak: number
): string[] {
  const suggestions: string[] = [];

  if (completedPercentage === 0) {
    suggestions.push("Start with the first lesson in the reading panel");
  }

  if (completedPercentage > 0 && completedPercentage < 25) {
    suggestions.push("Keep building momentum - you're off to a great start!");
  }

  if (completedPercentage >= 25 && completedPercentage < 50) {
    suggestions.push("You're making good progress - continue with the next lesson");
  }

  if (completedPercentage >= 50 && completedPercentage < 75) {
    suggestions.push(
      "More than halfway there! Keep up the consistency to reach the end"
    );
  }

  if (completedPercentage >= 75 && completedPercentage < 100) {
    suggestions.push("You're almost done - finish strong!");
  }

  if (completedPercentage === 100) {
    suggestions.push("Congratulations on completing all lessons!");
  }

  if (lastActivityDate) {
    const lastDate = new Date(lastActivityDate);
    const daysSinceActivity = Math.floor(
      (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity > 7) {
      suggestions.push(
        `You haven't been active for ${daysSinceActivity} days. Return to continue your progress!`
      );
    } else if (daysSinceActivity === 0) {
      suggestions.push("Great job staying active today!");
    }
  }

  if (hasStreak > 5) {
    suggestions.push(`🔥 Amazing ${hasStreak}-day streak! Don't break it!`);
  }

  return suggestions;
}
