const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// temp folder path
const tempDir = path.join(__dirname, "..", "temp");

// temp folder create cheyyali (if not exists)
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

/**
 * MAIN CONTROLLER
 * POST /run
 * body: { language, code }
 */
const runCode = (req,res) => {
  const{language,code}=req.body
  switch (language) {
    case "javascript":
      return runJavaScript(code, res);

    case "typescript":
      return runTypeScript(code, res);

    case "java":
      return runJava(code, res);

    case "python":
      return runPython(code, res);

    case "html":
    case "css":
      return res.json({
        output: "HTML/CSS execution is not supported. Use Preview mode.",
        status: "info"
      });

    default:
      return res.json({
        output: "Language not supported",
        status: "error"
      });
  }
};
const runJavaScript = (code, res) => {
  const file = path.join(tempDir, "main.js");
  fs.writeFileSync(file, code);

  exec(`node ${file}`, { timeout: 3000 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({
        output: stderr || err.message,
        status: "error"
      });
    }
    res.json({ output: stdout, status: "success" });
  });
};
 const runTypeScript = (code, res) => {
  const file = path.join(tempDir, "main.ts");
  fs.writeFileSync(file, code);

  exec(
    `npx ts-node --transpile-only ${file}`,
    { timeout: 5000 },
    (error, stdout, stderr) => {
      if (error) {
        return res.json({
          output: stderr || error.message || "TypeScript compilation error",
          status: "error",
        });
      }

      res.json({
        output: stdout || "Program executed successfully",
        status: "success",
      });
    }
  );
};


/**
 * JAVA COMPILE & RUN
 */
function simplifyJavaError(rawError) {
  return rawError
    .split("\n")
    .filter(line => line.includes("error"))
    .map(line => {
      // extract line number
      const match = line.match(/Main\.java:(\d+): error: (.*)/);
      if (match) {
        return `Line ${match[1]}: ${match[2]}`;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");
}

const runJava = (code, res) => {
  if (!code || typeof code !== "string") {
    return res.json({
      output: "No code provided",
      status: "error"
    });
  }

  

  const javaFile = path.join(tempDir, "Main.java");
  fs.writeFileSync(javaFile, code);

  const command = `javac ${javaFile} && java -cp ${tempDir} Main`;

  exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
     
    console.error("JAVA EXEC ERROR:", error); // 🔥 IMPORTANT
    console.error("STDERR:", stderr);
      const outputErr = simplifyJavaError(stderr || error.message);

      return res.json({
        output: outputErr,
        status: "error",
      });
    }
    const hasMainClass = /public\s+class\s+Main/.test(code);

  if (!hasMainClass) {
    return res.json({
      output: "public class Main not found",
      status: "error"
    });
  }
    res.json({
      output: stdout,
      status: "success",
    });
  });
};


/**
 * PYTHON RUN
 */
function simplifyPythonError(rawError) {
  if (!rawError) return "Unknown error";

  const lines = rawError.split("\n");

  let lineNumber = "";
  let errorType = "";
  let message = "";

  for (let line of lines) {
    // extract line number
    const lineMatch = line.match(/line\s+(\d+)/);
    if (lineMatch) {
      lineNumber = lineMatch[1];
    }

    // extract error type + message
    if (line.includes("Error")) {
      const parts = line.split(":");
      errorType = parts[0].trim();
      message = parts.slice(1).join(":").trim();
    }
  }

  if (!errorType) {
    return rawError;
  }

  return `Line ${lineNumber}: ${errorType} - ${message}`;
}

const runPython = (code, res) => {
  const pythonFile = path.join(tempDir, "script.py");

  // Python code write
  fs.writeFileSync(pythonFile, code);

  const command = `python ${pythonFile}`;

  exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
        const operror=simplifyPythonError(stderr || error.message)
      return res.json({
        output: operror,
        status: "error",
      });
    }

    res.json({
      output: stdout,
      status: "success",
    });
  });
};

module.exports = runCode;
