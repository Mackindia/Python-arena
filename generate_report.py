"""
Python Arena - Project Report PDF Generator
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
import os
from datetime import datetime

OUTPUT_FILE = os.path.join(r"D:\downloads data\data", "Python_Arena_Project_Report.pdf")

PRIMARY = HexColor("#1e3a5f")
SECONDARY = HexColor("#2563eb")
ACCENT = HexColor("#059669")
TABLE_HEADER = HexColor("#1e3a5f")
TABLE_ALT = HexColor("#e8eef6")
BORDER_COLOR = HexColor("#cbd5e1")


def build_styles():
    s = getSampleStyleSheet()

    CT = ParagraphStyle('CT', parent=s['Title'], fontName='Helvetica-Bold', fontSize=28,
        textColor=PRIMARY, alignment=TA_CENTER, spaceAfter=6, leading=34)
    CS = ParagraphStyle('CS', parent=s['Normal'], fontName='Helvetica', fontSize=14,
        textColor=SECONDARY, alignment=TA_CENTER, spaceAfter=4, leading=18)
    CI = ParagraphStyle('CI', parent=s['Normal'], fontName='Helvetica', fontSize=11,
        textColor=grey, alignment=TA_CENTER, spaceAfter=3)
    ST = ParagraphStyle('ST', parent=s['Heading1'], fontName='Helvetica-Bold', fontSize=16,
        textColor=PRIMARY, spaceBefore=18, spaceAfter=8, leading=20)
    SS = ParagraphStyle('SS', parent=s['Heading2'], fontName='Helvetica-Bold', fontSize=12,
        textColor=SECONDARY, spaceBefore=12, spaceAfter=6, leading=15)
    BT = ParagraphStyle('BT', parent=s['Normal'], fontName='Helvetica', fontSize=10,
        textColor=black, spaceAfter=4, leading=14, alignment=TA_JUSTIFY)
    BL = ParagraphStyle('BL', parent=s['Normal'], fontName='Helvetica', fontSize=10,
        textColor=black, spaceAfter=2, leading=13, leftIndent=16, bulletIndent=6)
    SM = ParagraphStyle('SM', parent=s['Normal'], fontName='Helvetica', fontSize=8,
        textColor=grey, alignment=TA_CENTER)
    CB = ParagraphStyle('CB', parent=s['Normal'], fontName='Courier', fontSize=8,
        textColor=HexColor("#1a1a1a"), backColor=HexColor("#f5f5f5"),
        spaceBefore=4, spaceAfter=4, leftIndent=12, leading=11)

    return {'CT': CT, 'CS': CS, 'CI': CI, 'ST': ST, 'SS': SS, 'BT': BT, 'BL': BL, 'SM': SM, 'CB': CB}


def make_table(headers, rows, col_widths=None):
    data = [headers] + rows
    if col_widths is None:
        w = 480 / len(headers)
        col_widths = [w] * len(headers)
    style_list = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_list.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT))
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle(style_list))
    return t


def P(text, style, **kwargs):
    return Paragraph(text, style, **kwargs)


def build_pdf():
    st = build_styles()
    doc = SimpleDocTemplate(
        OUTPUT_FILE, pagesize=A4,
        topMargin=0.75*inch, bottomMargin=0.75*inch,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        title="Python Arena - Project Report", author="Doon Scholars",
    )
    S = []
    bt = st['BT']
    bl = st['BL']

    # ════════════════════ COVER PAGE ════════════════════
    S.append(Spacer(1, 80))
    S.append(HRFlowable(width="60%", thickness=2, color=PRIMARY, spaceAfter=12))
    S.append(P("PYTHON ARENA", st['CT']))
    S.append(P("Doon Scholars AI Educational Platform", st['CS']))
    S.append(Spacer(1, 8))
    S.append(HRFlowable(width="40%", thickness=1, color=SECONDARY, spaceAfter=20))
    S.append(P("Complete Technical Project Report", st['CI']))
    S.append(Spacer(1, 30))
    S.append(make_table(
        ["Field", "Details"],
        [
            ["Project Name", "Python Arena (Doon Scholars)"],
            ["Repository", "github.com/Mackindia/Python-arena.git"],
            ["Type", "Full-Stack Educational Technology Platform"],
            ["Domain", "AI-powered LMS + School Timetable Automation"],
            ["Report Date", datetime.now().strftime("%B %d, %Y")],
        ],
        col_widths=[140, 340]
    ))
    S.append(PageBreak())

    # ════════════════════ TOC ════════════════════
    S.append(P("Table of Contents", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))
    for item in [
        "1.  What This Project Does",
        "2.  Technology Stack",
        "3.  System Architecture",
        "4.  RAG System",
        "5.  Features Breakdown",
        "6.  Database Models",
        "7.  API Endpoints",
        "8.  Git Workflow and Deployment",
        "9.  Project Folder Structure",
        "10. Environment Configuration",
        "11. How to Run Locally",
        "12. Key Statistics",
        "13. Current Development Status",
    ]:
        S.append(P(item, bt))
    S.append(PageBreak())

    # ════════════════════ 1. WHAT THIS PROJECT DOES ════════════════════
    S.append(P("1. What This Project Does", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))
    S.append(P(
        "Python Arena is a <b>dual-component educational platform</b> built for Doon Scholars school. "
        "It provides:", bt))
    for b in [
        "AI-powered Learning Management System (LMS) - students learn subjects, take quizzes, track progress, and interact with an AI Teacher Assistant that generates study materials from uploaded textbooks.",
        "School Timetable Scheduler - manages class schedules, teacher assignments, load balancing, and teacher relief (substitute) management.",
        "Exam Intelligence System - analyzes past question papers, generates new papers following CBSE patterns, and predicts important questions.",
        "Real-time Communication - threaded chat between students, teachers, and admins with online presence detection and read receipts.",
    ]:
        S.append(P(b, bl, bulletText='\u2022'))
    S.append(PageBreak())

    # ════════════════════ 2. TECHNOLOGY STACK ════════════════════
    S.append(P("2. Technology Stack", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("2.1 Frontend - Next.js Web Application", st['SS']))
    S.append(make_table(
        ["Technology", "Purpose"],
        [
            ["Next.js 16.2.5", "React framework with App Router for SSR, ISR, API routes"],
            ["React 19.2.4", "UI component library"],
            ["TypeScript 5", "Type-safe JavaScript"],
            ["Tailwind CSS 4", "Utility-first CSS styling"],
            ["shadcn/ui (Radix)", "Reusable UI component library"],
            ["Framer Motion", "Page transitions and animations"],
            ["Monaco Editor", "In-browser Python code editor"],
            ["TipTap", "Rich text editor for documents"],
            ["Recharts", "Data visualization charts"],
            ["Pyodide", "Python interpreter in browser via Web Worker"],
            ["react-pdf", "PDF viewer component"],
            ["Lucide React", "Icon library"],
        ],
        col_widths=[140, 340]
    ))
    S.append(Spacer(1, 8))

    S.append(P("2.2 Backend - Python AI Engine", st['SS']))
    S.append(make_table(
        ["Technology", "Purpose"],
        [
            ["FastAPI", "High-performance Python web framework for AI endpoints"],
            ["Uvicorn", "ASGI server for FastAPI"],
            ["LangChain", "AI orchestration framework for RAG pipeline"],
            ["Google Gemini", "LLM for generating notes, MCQs, worksheets (2.5-flash, 2.5-pro, 2.0-flash-lite)"],
            ["FAISS", "Vector database for fast similarity search"],
            ["Sentence-Transformers", "Text to embeddings for semantic search (all-MiniLM-L6-v2)"],
            ["Cross-Encoder", "Reranks search results for accuracy (ms-marco-MiniLM-L-6-v2)"],
            ["PyMuPDF", "PDF text extraction"],
            ["Tesseract OCR", "Optical character recognition for scanned PDFs"],
            ["python-docx / reportlab", "DOCX and PDF export generation"],
        ],
        col_widths=[160, 320]
    ))
    S.append(Spacer(1, 8))

    S.append(P("2.3 Database and Storage", st['SS']))
    S.append(make_table(
        ["Technology", "Purpose"],
        [
            ["MongoDB Atlas", "Primary database (cloud-hosted)"],
            ["Mongoose ODM", "MongoDB schema modeling and validation"],
            ["Redis (ioredis)", "Caching layer for performance"],
            ["Cloudinary", "Cloud storage for PDFs, images, documents"],
        ],
        col_widths=[140, 340]
    ))
    S.append(Spacer(1, 8))

    S.append(P("2.4 Authentication and Security", st['SS']))
    S.append(make_table(
        ["Technology", "Purpose"],
        [
            ["Clerk", "Primary authentication (sign-in, sign-up, sessions)"],
            ["RBAC", "4 roles: super_admin, admin, teacher, student"],
            ["Middleware", "Route protection via Next.js middleware"],
            ["User Approval System", "Admin-controlled signup approval"],
        ],
        col_widths=[140, 340]
    ))
    S.append(Spacer(1, 8))

    S.append(P("2.5 Deployment", st['SS']))
    S.append(make_table(
        ["Technology", "Purpose"],
        [
            ["Railway", "Cloud deployment for the full platform"],
            ["Vercel", "Alternative deployment for Next.js frontend"],
            ["Docker", "Containerized deployment for Python AI backend"],
        ],
        col_widths=[140, 340]
    ))
    S.append(PageBreak())

    # ════════════════════ 3. ARCHITECTURE ════════════════════
    S.append(P("3. System Architecture", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))
    S.append(P(
        "The platform runs as <b>three microservices</b> that communicate with each other:", bt))
    S.append(Spacer(1, 4))
    S.append(make_table(
        ["Service", "Port", "Tech Stack", "Responsibility"],
        [
            ["Next.js Frontend", "3000", "Next.js 16, React 19, MongoDB, Clerk", "UI, API routes, auth, LMS"],
            ["Python AI Backend", "8000", "FastAPI, FAISS, LangChain, Gemini", "RAG, AI generation, exam intelligence"],
            ["MongoDB Atlas", "27017", "Mongoose ODM, cloud database", "All persistent data storage"],
        ],
        col_widths=[100, 50, 160, 170]
    ))
    S.append(Spacer(1, 8))

    S.append(P("3.1 Data Flow for AI Features", st['SS']))
    steps = [
        "<b>Step 1:</b>  Student uploads a textbook PDF through the web interface",
        "<b>Step 2:</b>  Next.js sends the PDF to the Python backend via API proxy",
        "<b>Step 3:</b>  Python backend extracts text, splits into chunks (1000 characters each)",
        "<b>Step 4:</b>  Chunks are converted to embeddings using Sentence-Transformers",
        "<b>Step 5:</b>  Embeddings are stored in FAISS vector database",
        "<b>Step 6:</b>  When student asks a question, FAISS finds the most relevant chunks",
        "<b>Step 7:</b>  Cross-Encoder reranks results for accuracy",
        "<b>Step 8:</b>  Google Gemini generates an answer using the retrieved context",
        "<b>Step 9:</b>  Answer goes through quality validation (up to 3 retry attempts)",
        "<b>Step 10:</b>  Final answer is returned to the student's browser",
    ]
    for step in steps:
        S.append(P(step, bl))
    S.append(PageBreak())

    # ════════════════════ 4. RAG SYSTEM ════════════════════
    S.append(P("4. RAG System - Retrieval-Augmented Generation", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("4.1 What is RAG?", st['SS']))
    S.append(P(
        "RAG is an AI technique where the system first <b>retrieves</b> relevant information from a "
        "knowledge base (textbook PDFs), then <b>augments</b> the AI prompt with that information, "
        "and finally <b>generates</b> an accurate, grounded answer. This prevents the AI from making "
        "up information (hallucination).", bt))

    S.append(P("4.2 Types of RAG Used in This Project", st['SS']))
    S.append(make_table(
        ["RAG Type", "Implementation", "Where Used"],
        [
            ["Basic RAG", "FAISS similarity search + Gemini", "/ask endpoint - simple Q&A"],
            ["Multi-Book RAG", "Separate FAISS index per book", "/educational/search"],
            ["Metadata-Filtered RAG", "Filters by class, subject, chapter", "All educational endpoints"],
            ["MMR RAG", "Maximal Marginal Relevance", "Retriever with fetch_k=20, k=6"],
            ["Reranked RAG", "Cross-Encoder reranking", "All generation endpoints"],
            ["Grounded RAG + Validation", "Output validated, retry on failure", "Notes, MCQs, worksheets"],
            ["OCR-Enhanced RAG", "Tesseract OCR for scanned PDFs", "Exam paper solving"],
            ["CBSE-Pattern RAG", "Pattern-aware generation", "Paper generation"],
        ],
        col_widths=[130, 180, 170]
    ))
    S.append(Spacer(1, 8))

    S.append(P("4.3 RAG Pipeline Details", st['SS']))
    S.append(P("<b>Step 1 - Book Ingestion:</b>", bt))
    for b in [
        "PDF uploaded, PyMuPDF extracts text, chapter auto-detection from headings",
        "Text split into 1000-character chunks with 200-character overlap",
        "Each chunk gets metadata: book_id, book_name, chapter, subject, class_level",
        "Chunks embedded using all-MiniLM-L6-v2 (384-dimensional vectors)",
        "Stored in FAISS index with SHA256 deduplication",
    ]:
        S.append(P(b, bl, bulletText='\u2022'))

    S.append(P("<b>Step 2 - Query Processing:</b>", bt))
    for b in [
        "User query embedded using same model",
        "FAISS similarity search retrieves top 20 candidates",
        "Metadata filters applied (book, chapter, subject, class)",
        "MMR selection picks 6 diverse, relevant chunks",
        "Cross-Encoder reranks by relevance score",
    ]:
        S.append(P(b, bl, bulletText='\u2022'))

    S.append(P("<b>Step 3 - Generation:</b>", bt))
    for b in [
        "Retrieved context injected into prompt template",
        "Google Gemini generates structured output (JSON)",
        "Quality validation: text grounding, difficulty distribution, Bloom's taxonomy",
        "Failed validation triggers retry with feedback (up to 3 attempts)",
        "Quality score calculated (deductive from 100)",
    ]:
        S.append(P(b, bl, bulletText='\u2022'))
    S.append(PageBreak())

    # ════════════════════ 5. FEATURES BREAKDOWN ════════════════════
    S.append(P("5. Features Breakdown", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("5.1 Student Features", st['SS']))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Dashboard", "Personalized view with courses, quiz scores, progress, streak days"],
            ["Learn Module", "Browse subjects, classes, lessons with PDF viewer, notes, quizzes"],
            ["LMS", "Full course management with lessons, quizzes, progress, bookmarks"],
            ["Educational AI Tools", "11 tools: Notes, MCQs, Question Bank, Worksheets, Lesson Plans, Concept Maps, Bloom's, Paper Solver, Paper Generator, Most Important Questions, Search"],
            ["Python Code Editor", "In-browser Python editor powered by Pyodide"],
            ["Practice Papers", "Subject-wise practice question papers"],
            ["Chat with Admin", "Threaded messaging with read receipts and online presence"],
            ["Online Class", "View upcoming online classes with Google Meet links"],
            ["Announcements", "Scrolling notice board with categorized alerts"],
            ["Resources", "PDF viewer for study materials"],
        ],
        col_widths=[110, 370]
    ))
    S.append(Spacer(1, 6))

    S.append(P("5.2 Teacher Features", st['SS']))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Teacher Panel", "Dedicated teacher dashboard"],
            ["Lesson Management", "Create, edit, publish lessons with TipTap rich text editor"],
            ["Quiz Creation", "Build quizzes with multiple choice questions"],
            ["Timetable View", "View personal teaching schedule"],
            ["Relief Dashboard", "Manage substitute teaching assignments"],
            ["Comment Moderation", "Approve/reject student comments on lessons"],
        ],
        col_widths=[110, 370]
    ))
    S.append(Spacer(1, 6))

    S.append(P("5.3 Admin Features", st['SS']))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Admin Dashboard", "Server-rendered stats with user counts, course activity"],
            ["User Management", "CRUD operations, approval system, CSV teacher import"],
            ["Course Management", "Create subjects, classes, lessons, quizzes"],
            ["Timetable Management", "Full CRUD with freeze/unfreeze, version tracking"],
            ["Announcements", "Create targeted announcements (role/class-based)"],
            ["Message Center", "View all chat threads, respond to students"],
            ["Content Moderation", "Moderate comments, manage blocked users"],
            ["Analytics", "Charts and metrics for platform usage"],
            ["Private Vault", "Private PDFs and notes with timestamps"],
            ["Document Writer", "Rich text document editor"],
            ["Ebook Extractor", "Extract pages from ebooks for lesson content"],
            ["AI Model Intelligence", "Model routing, workflow engine, performance monitoring"],
            ["Engine Status Monitor", "Traffic signal visual showing all service health"],
            ["Command Center", "Admin-only dashboard with 27 service controls"],
            ["Server Console", "Live terminal output panel with start/stop buttons"],
        ],
        col_widths=[130, 350]
    ))
    S.append(Spacer(1, 6))

    S.append(P("5.4 Exam Intelligence System", st['SS']))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Paper Solver", "Upload scanned/typed paper, AI extracts questions, generates answers"],
            ["Pattern Analysis", "Statistical + LLM analysis of exam patterns"],
            ["Paper Generator", "Generate papers following CBSE patterns with 6 profiles"],
            ["Cross-Paper Analysis", "Compare papers, predict repeat questions"],
            ["Most Important Questions", "Frequency + marks-based importance ranking"],
            ["CBSE Profiles", "Predefined patterns: cbse_80, cbse_40, cbse_100"],
            ["Export", "Export solved papers to PDF, DOCX, or plain text"],
        ],
        col_widths=[130, 350]
    ))
    S.append(Spacer(1, 6))

    S.append(P("5.5 Timetable System", st['SS']))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Mastersheet", "Complete school timetable overview"],
            ["Class Timetables", "Individual class schedule views"],
            ["Teacher View", "Teacher-specific schedule"],
            ["Load Master", "Teacher workload management and visualization"],
            ["Relief Management", "Substitute teacher assignment with shift queues"],
            ["Freeze System", "Lock/unlock timetable, version tracking"],
            ["Online Scheduler", "Schedule management through web interface"],
            ["CSV Import", "Import timetable from Excel/CSV files"],
        ],
        col_widths=[130, 350]
    ))
    S.append(PageBreak())

    # ════════════════════ 6. DATABASE MODELS ════════════════════
    S.append(P("6. Database Models (30+ Collections)", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("6.1 Core User Models", st['SS']))
    S.append(make_table(
        ["Model", "Purpose", "Key Fields"],
        [
            ["User", "All platform users", "clerkId, fullName, role, status, group, enrolledCourses, progress, streakDays"],
            ["Teacher", "Teacher information", "teacher_id, teacher_name, meet_link"],
            ["OnlinePresence", "Online status tracking", "userId, lastSeen (60s TTL auto-cleanup)"],
            ["BlockedUser", "User blocking", "userId, reason"],
        ],
        col_widths=[90, 120, 270]
    ))
    S.append(Spacer(1, 6))

    S.append(P("6.2 LMS and Content Models", st['SS']))
    S.append(make_table(
        ["Model", "Purpose", "Key Fields"],
        [
            ["Course", "Course definitions", "title, slug, subject, classLevel, chapters[], difficulty"],
            ["Lesson", "Learning content", "title, slug, content (HTML), courseId, chapterSlug, order"],
            ["Subject", "LMS subjects", "name, slug, description"],
            ["Class", "LMS classes", "name, slug, linked to subject"],
            ["Quiz", "Quiz questions", "courseId, lessonId, question, options[], answer, difficulty"],
            ["QuizResult", "Quiz scores", "userId, score, accuracy, chapter, weakTopics[]"],
            ["Enrollment", "Course enrollment", "userId, courseId, progress, completedChapters[]"],
            ["LessonProgress", "Completion tracking", "userId, lessonId, completed, completedAt"],
            ["Resource", "Study materials", "title, kind, url, courseId"],
        ],
        col_widths=[90, 120, 270]
    ))
    S.append(Spacer(1, 6))

    S.append(P("6.3 Communication Models", st['SS']))
    S.append(make_table(
        ["Model", "Purpose", "Key Fields"],
        [
            ["Message", "Chat threads", "userId, messages[] (senderRole, text, readBy[]), status"],
            ["Announcement", "Platform announcements", "title, message, targetRoles[], level"],
            ["Comment", "Lesson comments", "lessonPath, userId, message, status"],
            ["Media", "File uploads", "userId, fileName, fileUrl, fileType"],
        ],
        col_widths=[90, 120, 270]
    ))
    S.append(Spacer(1, 6))

    S.append(P("6.4 Timetable Models", st['SS']))
    S.append(make_table(
        ["Model", "Purpose", "Key Fields"],
        [
            ["Timetable", "Class schedules", "class, section, day, period_no, subject, teacher_id"],
            ["TimetableLock", "Freeze system", "status (draft/frozen), frozenAt, version"],
            ["Period", "Time periods", "period_no, start_time, end_time"],
        ],
        col_widths=[90, 120, 270]
    ))
    S.append(Spacer(1, 6))

    S.append(P("6.5 Other Models", st['SS']))
    other_models = [
        "ActiveSession - Online class sessions",
        "Attendance - Student attendance records",
        "PythonProgram - Stored Python code",
        "Program - HTML/CSS/JS programs",
        "Settings - Platform key-value settings",
        "ResetRequest - Password reset tokens",
        "DocumentTemplate - Document templates (syllabus, holiday-homework, question-paper)",
        "DocumentInstance - Generated documents",
        "PrivateNote - Admin private notes",
        "PrivatePdf - Admin private PDFs",
        "AINews - AI news articles",
        "PracticeResource - Practice papers",
    ]
    for m in other_models:
        S.append(P(m, bl, bulletText='\u2022'))
    S.append(PageBreak())

    # ════════════════════ 7. API ENDPOINTS ════════════════════
    S.append(P("7. API Endpoints (137+ Routes)", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("7.1 Next.js API Routes (29 route groups)", st['SS']))
    S.append(make_table(
        ["Route Group", "Endpoints", "Purpose"],
        [
            ["/api/auth/*", "login, logout, status, me", "Authentication"],
            ["/api/user/*, /api/users/*", "profile, list, update", "User management"],
            ["/api/admin/*", "users, courses, lessons, timetable, upload", "Admin operations"],
            ["/api/lms/*", "subjects, classes, lessons, quiz, progress", "LMS features"],
            ["/api/messages/*", "list, send, online", "Chat messaging"],
            ["/api/ai/*", "[...path] catch-all proxy", "Proxies to Python backend"],
            ["/api/announcements/*", "list, create, delete", "Announcements"],
            ["/api/comments/*", "list, create, moderate", "Comments"],
            ["/api/search/*", "search", "Global search"],
            ["/api/online-class/*", "sessions, join, leave", "Online classes"],
            ["/api/servers/*", "status, start, stop", "Server management"],
            ["/api/reset-password/*", "request, approve, reject", "Password resets"],
        ],
        col_widths=[140, 180, 160]
    ))
    S.append(Spacer(1, 6))

    S.append(P("7.2 Python FastAPI Endpoints (37 routes)", st['SS']))
    S.append(P("<b>Core Routes (13):</b>", bt))
    S.append(make_table(
        ["Method", "Endpoint", "Purpose"],
        [
            ["POST", "/ask", "Ask AI teacher a question"],
            ["POST", "/upload", "Upload PDF for text extraction"],
            ["POST", "/generate/notes", "Generate study notes"],
            ["POST", "/generate/mcqs", "Generate multiple choice questions"],
            ["POST", "/generate/worksheet", "Generate teacher-ready worksheet"],
            ["POST", "/generate/case-studies", "Generate classroom case studies"],
            ["POST", "/generate/question-bank", "Generate large question bank"],
            ["POST", "/books/index", "Index a book into FAISS"],
            ["GET", "/books/list", "List all indexed books"],
            ["DELETE", "/books/{book_id}", "Remove book from registry"],
            ["POST", "/retrieve/context", "Metadata-aware retrieval"],
            ["GET", "/models", "List available Gemini models"],
            ["GET", "/models/budget/{task}", "Token budget for a model"],
        ],
        col_widths=[60, 160, 260]
    ))
    S.append(Spacer(1, 6))

    S.append(P("<b>Educational Routes (13):</b>", bt))
    S.append(make_table(
        ["Method", "Endpoint", "Purpose"],
        [
            ["POST", "/educational/books/upload", "Upload and index a book"],
            ["GET", "/educational/books", "List all books"],
            ["POST", "/educational/search", "Search with filters"],
            ["POST", "/educational/search/global", "Global search across books"],
            ["POST", "/educational/generate/notes", "Generate educational notes"],
            ["POST", "/educational/generate/mcq", "Generate MCQs"],
            ["POST", "/educational/generate/question-bank", "Generate question bank"],
            ["POST", "/educational/generate/worksheet", "Generate worksheet"],
            ["POST", "/educational/generate/lesson-plan", "Generate lesson plan"],
            ["POST", "/educational/generate/bloom", "Bloom's taxonomy analysis"],
            ["POST", "/educational/generate/concept-map", "Generate concept map"],
        ],
        col_widths=[60, 200, 220]
    ))
    S.append(Spacer(1, 6))

    S.append(P("<b>Exam Intelligence Routes (13):</b>", bt))
    S.append(make_table(
        ["Method", "Endpoint", "Purpose"],
        [
            ["POST", "/exam/solve-paper", "Upload and solve question paper"],
            ["POST", "/exam/solve-topic", "Generate and solve topic questions"],
            ["POST", "/exam/generate-paper", "Generate paper with CBSE pattern"],
            ["POST", "/exam/analyze-pattern", "Analyze exam pattern"],
            ["POST", "/exam/save-paper", "Save solved paper"],
            ["GET", "/exam/papers", "List saved papers"],
            ["DELETE", "/exam/papers/{id}", "Delete paper"],
            ["POST", "/exam/analyze-cross-paper", "Cross-paper analysis"],
            ["POST", "/exam/export", "Export to PDF/DOCX"],
            ["GET", "/exam/cbse-profiles", "List CBSE profiles"],
            ["GET", "/exam/most-important", "Most important questions"],
        ],
        col_widths=[60, 190, 230]
    ))
    S.append(PageBreak())

    # ════════════════════ 8. GIT WORKFLOW ════════════════════
    S.append(P("8. Git Workflow and Deployment", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("8.1 Repository Structure", st['SS']))
    S.append(P("<b>Repository:</b>  https://github.com/Mackindia/Python-arena.git", bt))
    S.append(make_table(
        ["Branch", "Purpose"],
        [
            ["main", "Production code (Vercel/Railway deploys from here)"],
            ["staging", "Pre-production testing"],
            ["backup/pre-relief-features", "Feature backup"],
            ["railway/fix-deploy-a3e360", "Railway deployment fixes"],
        ],
        col_widths=[180, 300]
    ))
    S.append(Spacer(1, 6))

    S.append(P("8.2 How Code Gets Pushed", st['SS']))
    push_steps = [
        "<b>Local Development:</b> Code is edited in D:\\downloads data\\data\\ folder",
        "<b>Git Add:</b> Files are staged with git add files",
        "<b>Git Commit:</b> Changes committed with conventional messages (feat:, fix:, Security:, Performance:, chore:)",
        "<b>Git Push:</b> Pushed to origin main on GitHub",
        "<b>Auto-Deploy:</b> Railway/Vercel detects push and deploys automatically",
    ]
    for i, step in enumerate(push_steps, 1):
        S.append(P(f"{i}. {step}", bl))
    S.append(Spacer(1, 6))

    S.append(P("8.3 Recent Commits", st['SS']))
    S.append(make_table(
        ["Commit", "Message"],
        [
            ["0c22cbd", "fix: rebuild Vite timetable bundle with Teacher Relief Dashboard"],
            ["4050a06", "feat: Teacher Relief Dashboard + Multi-Teacher Fix + Import Fix"],
            ["80c7a92", "fix: Chat widget message alignment and color fixes"],
            ["19a0785", "Security: route all AI calls through authenticated proxy"],
            ["fdb15ad", "chore: save remaining session work - ai-teacher fixes"],
            ["e26be51", "feat: Add freeze/unfreeze UI with password protection"],
            ["7bfc6f2", "fix: enforce freeze lock on all timetable write/sync routes"],
            ["9b79558", "feat: Add frozen timetable system"],
            ["bf424cd", "Add user approval system for controlled signups"],
            ["180fda2", "Performance: dynamic imports, ISR pages, Redis caching"],
        ],
        col_widths=[70, 410]
    ))
    S.append(PageBreak())

    # ════════════════════ 9. FOLDER STRUCTURE ════════════════════
    S.append(P("9. Project Folder Structure", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))
    S.append(make_table(
        ["Directory", "Purpose"],
        [
            ["app/", "Next.js App Router (80+ pages)"],
            ["app/api/", "100+ serverless API routes"],
            ["app/admin/", "Admin panel (25+ pages)"],
            ["app/learn/", "Student learning module"],
            ["app/lms/", "LMS module"],
            ["app/educational-ai/", "AI tools module (15+ pages)"],
            ["app/online-class/", "Online class system"],
            ["src/components/", "100+ React components"],
            ["src/components/ui/", "Reusable UI primitives"],
            ["src/hooks/", "Custom React hooks"],
            ["src/models/", "TypeScript models (30+)"],
            ["src/lib/", "Client-side utilities, AI engines"],
            ["src/sections/", "Landing page sections"],
            ["src/validators/", "Zod validation schemas"],
            ["lib/", "Server-side library (mongodb, rbac, educational-ai)"],
            ["models/", "Mongoose models (20+)"],
            ["ai-teacher/", "Python FastAPI AI backend (46 Python files)"],
            ["ai-teacher/app/core/", "LLM, PDF processor, generators"],
            ["ai-teacher/app/retrieval/", "FAISS indexer, retriever, reranker"],
            ["ai-teacher/app/educational_ai/", "Educational intelligence engine"],
            ["ai-teacher/app/question_paper/", "Exam intelligence system"],
            ["ai-teacher/faiss_index/", "FAISS vector indexes"],
            ["ebook-extractor/", "Ebook page extraction tools"],
            ["VS CODE Final TT project/", "Standalone timetable app (Vite+React)"],
            ["components/", "Legacy React components"],
            ["context/", "React Context providers"],
            ["data/", "Static data (timetables, teachers, load_master)"],
            ["public/", "Static assets"],
            ["scripts/", "Build/seed scripts (23 files)"],
        ],
        col_widths=[200, 280]
    ))
    S.append(PageBreak())

    # ════════════════════ 10. ENVIRONMENT ════════════════════
    S.append(P("10. Environment Configuration", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))
    S.append(make_table(
        ["Variable", "Purpose", "Service"],
        [
            ["MONGODB_URI", "MongoDB Atlas connection string", "Database"],
            ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "Clerk public key", "Auth"],
            ["CLERK_SECRET_KEY", "Clerk secret key", "Auth"],
            ["CLOUDINARY_CLOUD_NAME", "Cloudinary cloud name", "File Storage"],
            ["CLOUDINARY_API_KEY", "Cloudinary API key", "File Storage"],
            ["CLOUDINARY_API_SECRET", "Cloudinary API secret", "File Storage"],
            ["GEMINI_API_KEY", "Google Gemini API key", "AI Generation"],
            ["AI_BACKEND_URL", "Python FastAPI backend URL", "AI Backend"],
            ["NEXT_PUBLIC_APP_URL", "Application URL", "Deployment"],
            ["REDIS_URL", "Redis connection string (optional)", "Caching"],
        ],
        col_widths=[200, 180, 100]
    ))
    S.append(PageBreak())

    # ════════════════════ 11. HOW TO RUN ════════════════════
    S.append(P("11. How to Run Locally", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))

    S.append(P("Step 1: Start Next.js Frontend", st['SS']))
    S.append(P("npm install", st['CB']))
    S.append(P("npm run dev", st['CB']))
    S.append(P("Opens at http://localhost:3000", bt))

    S.append(P("Step 2: Start Python AI Backend", st['SS']))
    S.append(P("cd ai-teacher", st['CB']))
    S.append(P("pip install -r requirements.txt", st['CB']))
    S.append(P("python main.py", st['CB']))
    S.append(P("Opens at http://127.0.0.1:8000", bt))

    S.append(P("Step 3: Start Timetable App (Optional)", st['SS']))
    S.append(P("cd timetable-web-app", st['CB']))
    S.append(P("npm install", st['CB']))
    S.append(P("npm run dev", st['CB']))
    S.append(P("Opens at http://localhost:5173", bt))
    S.append(PageBreak())

    # ════════════════════ 12. KEY STATISTICS ════════════════════
    S.append(P("12. Key Statistics", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))
    S.append(make_table(
        ["Metric", "Count"],
        [
            ["Total Pages (Frontend)", "80+"],
            ["Total API Endpoints", "137+"],
            ["React Components", "100+"],
            ["MongoDB Models", "30+"],
            ["Python Files (AI Backend)", "46"],
            ["FAISS Indexes", "2 (single-book + multi-book)"],
            ["AI Generation Features", "15+"],
            ["Admin Pages", "25+"],
            ["Recent Git Commits", "20+"],
        ],
        col_widths=[240, 240]
    ))
    S.append(PageBreak())

    # ════════════════════ 13. CURRENT STATUS ════════════════════
    S.append(P("13. Current Development Status", st['ST']))
    S.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceAfter=8))
    S.append(P(
        "The platform is <b>actively being developed and maintained</b>. "
        "Current areas of work:", bt))
    for b in [
        "Chat System - Fixing message alignment and color issues between user and admin panels",
        "Teacher Relief Dashboard - Managing substitute teacher assignments",
        "Timetable Freeze System - Preventing accidental timetable changes",
        "User Approval System - Controlled signup process",
        "Performance Optimization - Dynamic imports, ISR pages, Redis caching",
        "Security Hardening - Routing AI calls through authenticated proxy",
    ]:
        S.append(P(b, bl, bulletText='\u2022'))

    S.append(Spacer(1, 30))
    S.append(HRFlowable(width="60%", thickness=1, color=PRIMARY, spaceAfter=8))
    S.append(P(f"Report Generated: {datetime.now().strftime('%B %d, %Y')}", st['SM']))
    S.append(P("Repository: https://github.com/Mackindia/Python-arena.git", st['SM']))
    S.append(P("Local Path: D:\\downloads data\\data\\", st['SM']))

    doc.build(S)
    print(f"PDF generated successfully: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")


if __name__ == "__main__":
    build_pdf()
