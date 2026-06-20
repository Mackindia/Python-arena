"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const mockActivityData = [
  { name: 'Mon', logins: 120, lessonViews: 340, quizAttempts: 45 },
  { name: 'Tue', logins: 150, lessonViews: 410, quizAttempts: 65 },
  { name: 'Wed', logins: 180, lessonViews: 450, quizAttempts: 80 },
  { name: 'Thu', logins: 160, lessonViews: 380, quizAttempts: 55 },
  { name: 'Fri', logins: 190, lessonViews: 520, quizAttempts: 95 },
  { name: 'Sat', logins: 80, lessonViews: 120, quizAttempts: 20 },
  { name: 'Sun', logins: 110, lessonViews: 200, quizAttempts: 30 },
];

const mockGradeDistribution = [
  { name: 'A (90-100%)', value: 35 },
  { name: 'B (80-89%)', value: 45 },
  { name: 'C (70-79%)', value: 15 },
  { name: 'D/F (<70%)', value: 5 },
];

const COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f87171'];

export default function AnalyticsDashboardClient({ initialStats }: { initialStats: any }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 font-semibold">
        {[
          { label: "Total Users", value: initialStats.totalUsers, color: "text-cyan-400" },
          { label: "Active Students", value: initialStats.activeStudents, color: "text-blue-400" },
          { label: "Published Courses", value: initialStats.publishedCourses, color: "text-emerald-400" },
          { label: "Question Bank", value: initialStats.quizCount, color: "text-amber-400" },
          { label: "Avg Quiz Score", value: `${initialStats.averageQuiz}%`, color: "text-fuchsia-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-lg backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Platform Engagement</h3>
            <p className="text-xs text-slate-400">Logins & Lesson Views over the past week</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="lessonViews" name="Lesson Views" stroke="#818cf8" fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="logins" name="Daily Logins" stroke="#22d3ee" fillOpacity={1} fill="url(#colorLogins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Quiz Attempt Volume</h3>
            <p className="text-xs text-slate-400">Total assessments submitted daily</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="quizAttempts" name="Quiz Attempts" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Grade Distribution</h3>
            <p className="text-xs text-slate-400">Performance split across recent quizzes</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockGradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockGradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent System Logs</h3>
            <p className="text-xs text-slate-400">Automated platform activity events</p>
          </div>
          <div className="space-y-4 mt-6">
            {[
              { time: "10 mins ago", event: "Timetable updated for Class 11", type: "system" },
              { time: "45 mins ago", event: "New lesson 'Python Arrays' published", type: "content" },
              { time: "2 hours ago", event: "15 new students imported via CSV", type: "user" },
              { time: "3 hours ago", event: "Database backup completed successfully", type: "system" },
              { time: "5 hours ago", event: "Question paper generated for Math", type: "ai" },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-4 text-sm border-b border-white/5 pb-3 last:border-0">
                <span className="text-xs text-slate-500 whitespace-nowrap min-w-[80px]">{log.time}</span>
                <span className="text-slate-300">{log.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
