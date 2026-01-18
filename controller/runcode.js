const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ===========================
// TEMP DIR
// ===========================
const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// ===========================
// MAIN CONTROLLER
// ===========================
const runCode = (req, res) => {
  const { language, code, input } = req.body || {};

  if (!language || !code) {
    return res.status(400).json({
      output: "language and code are required",
      status: "error",
    });
  }

  switch (language) {
    case "javascript":
      return runJavaScript(code, input, res);
    case "typescript":
      return runTypeScript(code, input, res);
    case "java":
      return runJava(code, input, res);
    case "python":
      return runPython(code, input, res);
    default:
      return res.json({
        output: "Language not supported",
        status: "error",
      });
  }
};

// ===========================
// JAVASCRIPT
// ===========================
const runJavaScript = (code, input, res) => {
  const file = path.join(tempDir, "main.js");
  fs.writeFileSync(file, code);
  handleProcessIO(spawn("node", [file]), input, res);
};

// ===========================
// TYPESCRIPT
// ===========================
const runTypeScript = (code, input, res) => {
  const file = path.join(tempDir, "main.ts");
  fs.writeFileSync(file, code);
  handleProcessIO(
    spawn("npx", ["ts-node", "--transpile-only", file]),
    input,
    res
  );
};

// ===========================
// JAVA (EB ZIP SAFE – AMAZON CORRETTO)
// ===========================
const runJava = (code, input, res) => {
  if (!/public\s+class\s+Main/.test(code)) {
    return res.json({
      output: "Error: public class Main not found",
      status: "error",
    });
  }

  const javaFile = path.join(tempDir, "Main.java");
  fs.writeFileSync(javaFile, code);

  // ✅ Correct paths for Amazon Linux + Corretto
  const JAVAC = "javac";
  const JAVA = "java";

  const compile = spawn(JAVAC, ["Main.java"], { cwd: tempDir });

  let compileError = "";

  compile.stderr.on("data", (d) => {
    compileError += d.toString();
  });

  compile.on("error", (err) => {
    return res.status(500).json({
      output: "Java compiler error",
      details: err.message,
      status: "error",
    });
  });

  compile.on("close", (status) => {
    if (status !== 0) {
      return res.json({
        output: simplifyJavaError(compileError),
        status: "error",
      });
    }

    const run = spawn(JAVA, ["Main"], { cwd: tempDir });

    run.on("error", (err) => {
      return res.status(500).json({
        output: "Java runtime error",
        details: err.message,
        status: "error",
      });
    });

    handleProcessIO(run, input, res);
  });
};

// ===========================
// PYTHON
// ===========================
const runPython = (code, input, res) => {
  const file = path.join(tempDir, "script.py");
  fs.writeFileSync(file, code);
  handleProcessIO(spawn("python3", [file]), input, res, true);
};

// ===========================
// COMMON PROCESS HANDLER
// ===========================
function handleProcessIO(child, input, res, isPython = false) {
  let output = "";
  let error = "";

  try {
    child.stdin.write((input || "") + "\n");
    child.stdin.end();
  } catch (e) {
    return res.status(500).json({
      output: "Failed to write input",
      status: "error",
    });
  }

  child.stdout.on("data", (d) => (output += d.toString()));
  child.stderr.on("data", (d) => (error += d.toString()));

  child.on("error", (err) => {
    return res.status(500).json({
      output: "Runtime error",
      details: err.message,
      status: "error",
    });
  });

  child.on("close", () => {
    if (error) {
      return res.json({
        output: isPython ? simplifyPythonError(error) : error,
        status: "error",
      });
    }

    res.json({
      output: output || "No output",
      status: "success",
    });
  });
}

// ===========================
// ERROR HELPERS (NO CRASH)
// ===========================
function simplifyJavaError(rawError) {
  if (!rawError) return "Compilation failed";

  return (
    rawError
      .split("\n")
      .filter((line) => line.includes("error"))
      .map((line) => {
        const match = line.match(/Main\.java:(\d+): error: (.*)/);
        if (match) return `Line ${match[1]}: ${match[2]}`;
        return line;
      })
      .join("\n") || rawError
  );
}

function simplifyPythonError(rawError) {
  if (!rawError) return "Python error";

  const lines = rawError.split("\n");
  let lineNo = "";
  let msg = "";

  for (const line of lines) {
    const m = line.match(/line (\d+)/);
    if (m) lineNo = m[1];
    if (line.includes("Error")) msg = line.trim();
  }

  return lineNo ? `Line ${lineNo}: ${msg}` : rawError;
}

// ===========================
module.exports = runCode;
