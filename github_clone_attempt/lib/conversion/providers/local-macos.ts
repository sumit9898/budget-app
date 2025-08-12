import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { promisify } from 'util';
import { inferTypeFromName } from '@/lib/conversion/mappings';

const execFileAsync = promisify(execFile);

// Convert using installed iWork apps on macOS via AppleScript.
export async function convertLocalMacOS(
  inputBuffer: Buffer,
  inputName: string,
  targetExt: string,
): Promise<Buffer> {
  if (process.platform !== 'darwin') {
    throw new Error('Local macOS conversion requires macOS');
  }

  const kind = inferTypeFromName(inputName); // pages | numbers | keynote
  const appName = kind === 'pages' ? 'Pages' : kind === 'numbers' ? 'Numbers' : 'Keynote';

  const exportAs = (() => {
    const t = targetExt.toLowerCase();
    if (kind === 'pages') {
      if (t === 'pdf') return 'PDF';
      if (t === 'docx') return 'Microsoft Word';
      if (t === 'rtf') return 'RTF';
    } else if (kind === 'numbers') {
      if (t === 'pdf') return 'PDF';
      if (t === 'xlsx') return 'Excel';
      if (t === 'csv') return 'CSV';
    } else if (kind === 'keynote') {
      if (t === 'pdf') return 'PDF';
      if (t === 'pptx') return 'Microsoft PowerPoint';
    }
    throw new Error(`Unsupported export: ${kind} -> ${targetExt}`);
  })();

  const tmpBase = await fs.mkdtemp(path.join(tmpdir(), 'iwork-conv-'));
  const inputPath = path.join(tmpBase, inputName);
  const outName = inputName.replace(/\.[^.]+$/, '') + `.${targetExt}`;
  const outputPath = path.join(tmpBase, outName);
  await fs.writeFile(inputPath, inputBuffer);

  // AppleScript to open, export, and close the document
  const esc = (s: string) => s.replace(/"/g, '\\"');
  const script = `
set inFile to POSIX file "${esc(inputPath)}"
set outFile to POSIX file "${esc(outputPath)}"
tell application "${appName}"
  activate
  set doc to open inFile
  delay 0.5
  export doc to outFile as ${exportAs}
  close doc saving no
end tell
`;

  await execFileAsync('osascript', ['-e', script]);
  // Wait up to 5s for the exported file to appear (some apps finish async)
  const start = Date.now();
  let data: Buffer | null = null;
  while (Date.now() - start < 5000) {
    try {
      data = await fs.readFile(outputPath);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!data) throw new Error('Export did not produce an output file');
  // Cleanup best-effort
  fs.rm(tmpBase, { recursive: true, force: true }).catch(() => {});
  return data;
}
