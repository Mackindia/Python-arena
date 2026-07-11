importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise;
let currentResolve = null;

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  self.postMessage({ type: "ready" });
}

pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  const { id, python, inputResponse } = event.data;
  
  if (inputResponse !== undefined && currentResolve) {
    currentResolve(inputResponse);
    currentResolve = null;
    return;
  }

  if (!python) return;

  await pyodideReadyPromise;

  try {
    self.pyodide.setStdout({ batched: (msg) => self.postMessage({ id, type: "stdout", text: msg + "\n" }) });
    self.pyodide.setStderr({ batched: (msg) => self.postMessage({ id, type: "stderr", text: msg + "\n" }) });

    self.pyodide.globals.set("__input_handler__", (prompt) => {
      return new Promise((resolve) => {
        currentResolve = resolve;
        self.postMessage({ id, type: "input_request", prompt: prompt || "" });
      });
    });

    await self.pyodide.loadPackagesFromImports(python);

    const transformedLines = python.split('\n').map(l => {
      let transformed = l.replace(/\binput\s*\(/g, 'await __pyinput(');
      transformed = transformed.replace(/await\s+await\s+__pyinput/g, 'await __pyinput');
      return '    ' + transformed;
    });

    await self.pyodide.runPythonAsync(`
import builtins

async def __pyinput(p=""):
    return await __input_handler__(str(p))

async def __main__():
${transformedLines.join('\n')}
`);

    await self.pyodide.runPythonAsync('await __main__()');


    self.postMessage({ id, type: "done" });
  } catch (error) {
    self.postMessage({ id, type: "error", error: error.message });
  }
};
