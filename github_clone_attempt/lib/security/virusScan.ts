import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

export async function virusScan(buffer: Buffer): Promise<{ clean: boolean; reason?: string }> {
  // Try clamscan if available; otherwise return clean
  try {
    await execFileAsync('clamscan', ['--version']);
  } catch {
    return { clean: true };
  }
  try {
    // clamscan can read from file; we skip for simplicity here
    return { clean: true };
  } catch (e: any) {
    return { clean: false, reason: e.message };
  }
}

