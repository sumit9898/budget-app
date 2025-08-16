// pages2pdf.js (CommonJS + CLI wrapper)
const { execFile } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const appleScript = `
on run argv
  if (count of argv) is not 2 then error "Usage: pages2pdf <input.pages> <output.pdf>"
  set inPath to item 1 of argv
  set outPath to item 2 of argv
  tell application "Pages"
    set doc to open POSIX file inPath
    delay 0.2
    export doc to POSIX file outPath as PDF
    close doc without saving
  end tell
end run
`;

function pagesToPdf(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const absIn = path.resolve(inputPath);
    const absOut = path.resolve(outputPath);
    // write a temp AppleScript next to this file
    const scriptPath = path.join(__dirname, ".pages2pdf.applescript");
    fs.writeFileSync(scriptPath, appleScript, { encoding: "utf8" });
    execFile(
      "osascript",
      [scriptPath, absIn, absOut],
      { timeout: 60_000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve({ stdout });
      }
    );
  });
}

// Example usage:
// pagesToPdf("/Users/you/file.pages", "/Users/you/file.pdf").then(() => console.log("done"));

// Export for programmatic use
module.exports = { pagesToPdf };

// Allow running as a CLI: `node example.js <input.pages> <output.pdf>`
if (require.main === module) {
  const [, , inputArg, outputArg] = process.argv;
  const inputPath = inputArg || path.join(__dirname, "samples", "sample.pages");
  const outputPath = outputArg || path.join(__dirname, "samples", "sample.pdf");

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  pagesToPdf(inputPath, outputPath)
    .then(() => {
      console.log(`Converted to: ${outputPath}`);
    })
    .catch((err) => {
      console.error("Conversion failed:", err.message);
      process.exit(1);
    });
}
