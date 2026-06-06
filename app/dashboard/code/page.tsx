"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import MediaLibrary from "@/src/components/media/MediaLibrary";

// Types
interface Program {
  _id: string;
  title: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

export default function CodeEditorPage() {
  const searchParams = useSearchParams();
  const adminProgramId = searchParams.get("adminProgramId");

  const { isLoaded, isSignedIn } = useUser();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  
  const [title, setTitle] = useState("Untitled Project");
  const [htmlCode, setHtmlCode] = useState("<h1>Hello World!</h1>\n<p>Start typing your HTML here...</p>");
  const [cssCode, setCssCode] = useState("h1 {\n  color: #0ea5e9;\n}");
  const [jsCode, setJsCode] = useState("");
  
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "media">("html");

  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();

    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (adminProgramId) {
        fetchAdminProgram(adminProgramId);
      } else {
        fetchPrograms();
      }
    }
  }, [isLoaded, isSignedIn, adminProgramId]);

  const fetchAdminProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/programs/${id}?type=web`);
      const data = await res.json();
      if (res.ok && data.program) {
        loadProgram(data.program);
      } else {
        toast.error("Failed to load user program");
      }
    } catch (error) {
      toast.error("Failed to fetch admin program");
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      const data = await res.json();
      if (res.ok) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error("Failed to load programs");
    }
  };

  const loadProgram = (prog: Program) => {
    setActiveProgram(prog);
    setTitle(prog.title);
    setHtmlCode(prog.htmlCode || "");
    setCssCode(prog.cssCode || "");
    setJsCode(prog.jsCode || "");
  };

  const handleNew = () => {
    setActiveProgram(null);
    setTitle("New Project");
    setHtmlCode("<h1>Hello World!</h1>");
    setCssCode("");
    setJsCode("");
  };

  const handleSave = async () => {
    setIsLoading(true);
    const payload: any = {
      id: activeProgram?._id,
      title,
      htmlCode,
      cssCode,
      jsCode,
    };

    if (adminProgramId) {
      payload.type = "web";
    }

    try {
      const endpoint = adminProgramId ? "/api/admin/programs" : "/api/programs";
      const method = adminProgramId ? "PUT" : (activeProgram ? "PUT" : "POST");

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Saved successfully!");
        if (!adminProgramId) fetchPrograms();
        setActiveProgram(data.program || activeProgram);
      } else {
        toast.error("Failed to save.");
      }
    } catch (error) {
      toast.error("Network error.");
    }
    setIsLoading(false);
  };

  const combinedOutput = `
    <html>
      <head>
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>${jsCode}</script>
      </body>
    </html>
  `;

  if (!isLoaded || !isSignedIn) {
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Please log in to access the editor.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900 p-4 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{adminProgramId ? "Admin Mode" : "My Projects"}</h2>
          {!adminProgramId && (
            <button 
              onClick={handleNew}
              className="rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-cyan-500"
            >
              + New
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {adminProgramId ? (
            <p className="text-sm text-amber-400">Viewing a student's program.</p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-slate-500">No projects yet.</p>
          ) : (
            programs.map(prog => (
              <div 
                key={prog._id} 
                onClick={() => loadProgram(prog)}
                className={`cursor-pointer rounded p-3 text-sm transition ${activeProgram?._id === prog._id ? 'border border-cyan-700 bg-cyan-900/40 text-cyan-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {prog.title}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-b border-transparent bg-transparent text-lg font-bold text-white transition focus:border-cyan-500 outline-none"
          />
          
          <div className="flex items-center space-x-3">
            {currentTime && (
              <div className="bg-black/30 border border-cyan-500/20 px-4 py-2 rounded-xl text-cyan-300 font-mono text-sm shadow-lg">
                🕒 {currentTime}
              </div>
            )}
            
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Project"}
            </button>
          </div>
        </div>

        {/* Editor and Preview Split */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Code Editor */}
          <div className="flex w-1/2 flex-col border-r border-slate-800 bg-[#1e1e1e]">
            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button 
                onClick={() => setActiveTab("html")}
                className={`px-6 py-2 text-sm font-medium ${activeTab === 'html' ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                HTML
              </button>
              <button 
                onClick={() => setActiveTab("css")}
                className={`px-6 py-2 text-sm font-medium ${activeTab === 'css' ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                CSS
              </button>
              <button 
                onClick={() => setActiveTab("js")}
                className={`px-6 py-2 text-sm font-medium ${activeTab === 'js' ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                JS
              </button>
              <button 
                onClick={() => setActiveTab("media")}
                className={`px-6 py-2 text-sm font-medium ${activeTab === 'media' ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                Media
              </button>
            </div>
            
            {/* Monaco Editor or Media Library */}
            <div className="flex-1 pt-4">
              {activeTab === "media" ? (
                <div className="h-full p-6 overflow-y-auto">
                  <MediaLibrary />
                </div>
              ) : (
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={activeTab === "html" ? "html" : activeTab === "css" ? "css" : "javascript"}
                  value={activeTab === "html" ? htmlCode : activeTab === "css" ? cssCode : jsCode}
                  onChange={(value) => {
                    if (activeTab === "html") setHtmlCode(value || "");
                    if (activeTab === "css") setCssCode(value || "");
                    if (activeTab === "js") setJsCode(value || "");
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    padding: { top: 16 },
                  }}
                />
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex w-1/2 flex-col bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Preview
            </div>
            <iframe
              title="preview"
              srcDoc={combinedOutput}
              className="h-full w-full flex-1 border-none bg-white"
              sandbox="allow-scripts"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
