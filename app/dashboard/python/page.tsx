"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

// Types
interface PythonProgram {
  _id: string;
  title: string;
  pythonCode: string;
}

export default function PythonEditorPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [programs, setPrograms] = useState<PythonProgram[]>([]);
  const [activeProgram, setActiveProgram] = useState<PythonProgram | null>(null);
  
  const [title, setTitle] = useState("Untitled Python Project");
  const [pythonCode, setPythonCode] = useState("print('Hello, Python Arena!')");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPrograms();
    }
  }, [isLoaded, isSignedIn]);

  // Initialize Web Worker
  useEffect(() => {
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const initWorker = () => {
    setIsPyodideLoading(true);
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, text, error } = e.data;
      if (type === "ready") {
        setIsPyodideLoading(false);
      } else if (type === "stdout" || type === "stderr") {
        setOutput((prev) => prev + text);
      } else if (type === "done") {
        setIsRunning(false);
      } else if (type === "error") {
        setOutput((prev) => prev + "\n" + error);
        setIsRunning(false);
      }
    };
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/python-programs");
      const data = await res.json();
      if (res.ok) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error("Failed to load programs");
    }
  };

  const loadProgram = (prog: PythonProgram) => {
    setActiveProgram(prog);
    setTitle(prog.title);
    setPythonCode(prog.pythonCode || "");
    setOutput("");
    setSaveStatus("saved");
  };

  const handleNew = () => {
    setActiveProgram(null);
    setTitle("New Python Project");
    setPythonCode("print('Hello, Python Arena!')");
    setOutput("");
    setSaveStatus("saved");
  };

  // Internal save logic to be used by explicit save and auto-save
  const saveProgramData = async (currentTitle: string, currentCode: string, showToast = false) => {
    setSaveStatus("saving");
    const payload = {
      id: activeProgram?._id,
      title: currentTitle,
      pythonCode: currentCode,
    };

    try {
      const res = await fetch("/api/python-programs", {
        method: activeProgram ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (showToast) toast.success("Saved successfully!");
        setSaveStatus("saved");
        // Update active program if it's a new one
        if (!activeProgram) {
            setActiveProgram(data.program);
            fetchPrograms();
        } else {
            // Update programs list silently
            setPrograms(prev => prev.map(p => p._id === data.program._id ? data.program : p));
        }
      } else {
        if (showToast) toast.error("Failed to save.");
        setSaveStatus("unsaved");
      }
    } catch (error) {
      if (showToast) toast.error("Network error.");
      setSaveStatus("unsaved");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    await saveProgramData(title, pythonCode, true);
    setIsLoading(false);
  };

  // Auto-Save Logic
  useEffect(() => {
    // Don't trigger on initial load or if already saved
    if (saveStatus !== "unsaved") return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(() => {
        saveProgramData(title, pythonCode, false);
    }, 5000); // 5 seconds debounce

    return () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, pythonCode, saveStatus]);

  const handleCodeChange = (value: string | undefined) => {
    setPythonCode(value || "");
    setSaveStatus("unsaved");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSaveStatus("unsaved");
  };

  const runCode = () => {
    if (!workerRef.current || isPyodideLoading) {
        toast.error("Environment is still loading, please wait...");
        return;
    }
    setIsRunning(true);
    setOutput("");
    
    workerRef.current.postMessage({ id: Date.now(), python: pythonCode });
  };

  const stopExecution = () => {
    if (workerRef.current) {
        workerRef.current.terminate();
    }
    setIsRunning(false);
    setOutput(prev => prev + "\n\n[Execution Terminated]");
    
    // Restart the worker for the next run
    initWorker();
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Please log in to access the editor.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900 p-4 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Python Projects</h2>
          <button 
            onClick={handleNew}
            className="rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-cyan-500"
          >
            + New
          </button>
        </div>
        
        <div className="space-y-2">
          {programs.length === 0 ? (
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
          <div className="flex items-center space-x-4 w-1/2">
            <input 
              type="text" 
              value={title}
              onChange={handleTitleChange}
              className="border-b border-transparent bg-transparent text-lg font-bold text-white transition focus:border-cyan-500 outline-none flex-1"
            />
            {saveStatus === "saving" && <span className="text-xs text-slate-400">Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-emerald-400">Saved</span>}
            {saveStatus === "unsaved" && <span className="text-xs text-amber-400">Unsaved changes</span>}
          </div>
          
          <div className="flex space-x-3">
              {isRunning ? (
                <button 
                  onClick={stopExecution}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 flex items-center shadow-lg shadow-red-900/20"
                >
                  ⏹ Stop Execution
                </button>
              ) : (
                <button 
                  onClick={runCode}
                  disabled={isPyodideLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 flex items-center shadow-lg shadow-blue-900/20"
                >
                  {isPyodideLoading ? "Loading Environment..." : "▶ Run Code"}
                </button>
              )}
              
              <button 
                onClick={handleSave}
                disabled={isLoading || saveStatus === "saved"}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Project"}
              </button>
          </div>
        </div>

        {/* Editor and Output Split */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Code Editor */}
          <div className="flex w-1/2 flex-col border-r border-slate-800 bg-[#1e1e1e]">
            {/* Tab */}
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button 
                className="px-6 py-2 text-sm font-medium border-b-2 border-cyan-500 text-cyan-400"
              >
                main.py
              </button>
            </div>
            
            {/* Monaco Editor */}
            <div className="flex-1 pt-4">
              <Editor
                height="100%"
                theme="vs-dark"
                language="python"
                value={pythonCode}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  padding: { top: 16 },
                }}
              />
            </div>
          </div>

          {/* Terminal Output */}
          <div className="flex w-1/2 flex-col bg-slate-950">
            <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Terminal Output
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400 whitespace-pre-wrap">
                {output || <span className="text-slate-600">No output yet. Click "Run Code" to execute.</span>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
