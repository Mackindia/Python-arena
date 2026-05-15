importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise;

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  self.postMessage({ type: "ready" });
}

pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  const { id, python } = event.data;
  
  if (!python) return;

  await pyodideReadyPromise;

  try {
    self.pyodide.setStdout({ batched: (msg) => self.postMessage({ id, type: "stdout", text: msg + "\n" }) });
    self.pyodide.setStderr({ batched: (msg) => self.postMessage({ id, type: "stderr", text: msg + "\n" }) });

    await self.pyodide.runPythonAsync(python);
    self.postMessage({ id, type: "done" });
  } catch (error) {
    self.postMessage({ id, type: "error", error: error.message });
  }
};
