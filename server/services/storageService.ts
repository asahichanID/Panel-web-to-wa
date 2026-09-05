import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import AdmZip from 'adm-zip';
import { FileItem } from '../types.js';

const execFileAsync = promisify(execFile);

export class StorageService {
  public readonly projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(process.cwd(), 'bot_project');
  }

  public async init(): Promise<void> {
    if (!fs.existsSync(this.projectRoot)) {
      await fs.promises.mkdir(this.projectRoot, { recursive: true });
    }

    // Check if empty, seed standard starter bot files
    const items = await fs.promises.readdir(this.projectRoot);
    if (items.length === 0) {
      await this.seedStarterBot();
    }
  }

  private async seedStarterBot(): Promise<void> {
    const starterPackageJson = {
      name: 'by-shiro-anna-bot',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
      },
      dependencies: {
        '@sairidev/baileys-new': '^6.6.0',
      },
    };

    const starterIndexJs = `/**
 * BY SHIRO ANNA - WhatsApp Bot Engine
 * Powered by @sairidev/baileys-new & Custom Node.js
 */
import os from 'os';

console.log('==============================================');
console.log('⚡ BY SHIRO ANNA - WhatsApp Bot Daemon Started');
console.log('⚡ Time:', new Date().toISOString());
console.log('⚡ Engine:', process.env.BOT_ENGINE || 'baileys-default');
console.log('⚡ Node Version:', process.version);
console.log('⚡ Platform:', os.platform(), os.arch());
console.log('==============================================');

console.log('[SYSTEM] Initializing multi-device session...');
console.log('[SYSTEM] Multi-device engine ready.');
console.log('[SYSTEM] Listening for commands. Type "ping", "status", or "help".');

let heartbeatCount = 0;
const heartbeat = setInterval(() => {
  heartbeatCount++;
  const memMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  if (heartbeatCount % 6 === 0) {
    console.log(\`[DAEMON] Active | Heartbeat #\${heartbeatCount} | Heap: \${memMb} MB | Uptime: \${Math.round(process.uptime())}s\`);
  }
}, 5000);

process.stdin.setEncoding('utf-8');
process.stdin.on('data', (raw) => {
  const line = raw.toString().trim();
  if (!line) return;

  console.log(\`[STDIN] > \${line}\`);
  if (line === 'ping') {
    console.log('[BOT] PONG! Bot response time: 2ms. Connection active.');
  } else if (line === 'status') {
    console.log(\`[BOT] Status: ONLINE | PID: \${process.pid} | Uptime: \${Math.round(process.uptime())}s\`);
  } else if (line === 'help') {
    console.log('[BOT] Available commands: ping, status, help, info');
  } else if (line === 'info') {
    console.log(\`[BOT] Bot Name: \${process.env.BOT_NAME || 'BY SHIRO ANNA'} | Engine: \${process.env.BOT_ENGINE || 'default'}\`);
  } else {
    console.log(\`[BOT] Received input: "\${line}"\`);
  }
});

process.on('SIGTERM', () => {
  console.log('[DAEMON] Received SIGTERM signal. Gracefully disconnecting...');
  clearInterval(heartbeat);
  process.exit(0);
});
`;

    const starterReadme = `# BY SHIRO ANNA - Bot Project
Welcome to your bot workspace!

- Edit \`index.js\` to add your bot commands.
- Modify \`package.json\` to add packages or dependencies.
- Use the **FILES** tab to upload, download, or edit files.
- Control process lifecycle with **DASHBOARD** (Start / Stop / Restart).
`;

    await fs.promises.writeFile(
      path.join(this.projectRoot, 'package.json'),
      JSON.stringify(starterPackageJson, null, 2),
      'utf-8'
    );
    await fs.promises.writeFile(path.join(this.projectRoot, 'index.js'), starterIndexJs, 'utf-8');
    await fs.promises.writeFile(path.join(this.projectRoot, 'README.md'), starterReadme, 'utf-8');
  }

  public resolveSafe(relPath: string = ''): string {
    const clean = path.normalize('/' + relPath.replace(/\0/g, ''));
    const resolved = path.resolve(this.projectRoot, '.' + clean);

    if (!resolved.startsWith(this.projectRoot)) {
      throw new Error('Security Error: Attempted directory traversal outside project root.');
    }
    return resolved;
  }

  public async listFiles(relDir: string = '/'): Promise<FileItem[]> {
    const targetDir = this.resolveSafe(relDir);

    if (!fs.existsSync(targetDir)) {
      return [];
    }

    const stat = await fs.promises.stat(targetDir);
    if (!stat.isDirectory()) {
      throw new Error('Target is not a directory');
    }

    const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
    const items: FileItem[] = [];

    for (const entry of entries) {
      try {
        const fullPath = path.join(targetDir, entry.name);
        const fileStat = await fs.promises.stat(fullPath);
        const relFilePath = '/' + path.relative(this.projectRoot, fullPath).replace(/\\/g, '/');

        items.push({
          name: entry.name,
          path: relFilePath,
          isDirectory: entry.isDirectory(),
          size: fileStat.size,
          modified: fileStat.mtime.toISOString(),
        });
      } catch (err) {
        // Ignore unreadable entries
      }
    }

    // Sort: directories first, then alphabetically
    return items.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });
  }

  public async readFile(relPath: string): Promise<string> {
    const fullPath = this.resolveSafe(relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relPath}`);
    }
    const stat = await fs.promises.stat(fullPath);
    if (stat.isDirectory()) {
      throw new Error(`Cannot read directory as text file: ${relPath}`);
    }
    return await fs.promises.readFile(fullPath, 'utf-8');
  }

  public async writeFile(relPath: string, content: string): Promise<void> {
    const fullPath = this.resolveSafe(relPath);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      await fs.promises.mkdir(parent, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, content, 'utf-8');
  }

  public async saveUploadedFile(
    relDir: string,
    fileName: string,
    data: Buffer | string,
    isBase64: boolean = false
  ): Promise<string> {
    const targetDir = this.resolveSafe(relDir);
    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const cleanName = path.basename(fileName);
    const destination = path.join(targetDir, cleanName);

    if (Buffer.isBuffer(data)) {
      await fs.promises.writeFile(destination, data);
    } else if (isBase64) {
      const buffer = Buffer.from(data, 'base64');
      await fs.promises.writeFile(destination, buffer);
    } else {
      await fs.promises.writeFile(destination, data, 'utf-8');
    }

    return '/' + path.relative(this.projectRoot, destination).replace(/\\/g, '/');
  }

  public async createFolder(relDir: string, folderName: string): Promise<string> {
    const targetDir = this.resolveSafe(relDir);
    const cleanName = path.basename(folderName);
    const fullPath = path.join(targetDir, cleanName);

    // Verify it doesn't escape
    this.resolveSafe(path.relative(this.projectRoot, fullPath));

    await fs.promises.mkdir(fullPath, { recursive: true });
    return '/' + path.relative(this.projectRoot, fullPath).replace(/\\/g, '/');
  }

  public async deleteItem(relPath: string): Promise<void> {
    const fullPath = this.resolveSafe(relPath);

    // Guard against deleting project root itself via deleteItem
    if (fullPath === this.projectRoot) {
      throw new Error('Cannot delete project root directly. Use deleteAll instead.');
    }

    if (fs.existsSync(fullPath)) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    }
  }

  public async deleteAll(): Promise<void> {
    if (!fs.existsSync(this.projectRoot)) {
      await fs.promises.mkdir(this.projectRoot, { recursive: true });
      return;
    }

    const entries = await fs.promises.readdir(this.projectRoot);
    for (const entry of entries) {
      const entryPath = path.join(this.projectRoot, entry);
      await fs.promises.rm(entryPath, { recursive: true, force: true });
    }
  }

  public async deleteMultiple(relPaths: string[]): Promise<number> {
    let deletedCount = 0;
    for (const relPath of relPaths) {
      try {
        await this.deleteItem(relPath);
        deletedCount++;
      } catch (err) {
        console.error(`Failed deleting ${relPath}:`, err);
      }
    }
    return deletedCount;
  }

  public async moveItem(sourceRelPath: string, destRelDir: string): Promise<string> {
    const src = this.resolveSafe(sourceRelPath);
    if (src === this.projectRoot) {
      throw new Error('Tidak dapat memindahkan root project.');
    }

    if (!fs.existsSync(src)) {
      throw new Error(`File atau folder asal tidak ditemukan: ${sourceRelPath}`);
    }

    const destDir = this.resolveSafe(destRelDir);
    if (!fs.existsSync(destDir)) {
      await fs.promises.mkdir(destDir, { recursive: true });
    }

    const itemName = path.basename(src);
    const destination = path.join(destDir, itemName);

    // Prevent moving a folder inside its own child
    if (destination.startsWith(src + path.sep)) {
      throw new Error('Tidak dapat memindahkan folder ke dalam subfoldernya sendiri.');
    }

    if (src === destination) {
      return '/' + path.relative(this.projectRoot, destination).replace(/\\/g, '/');
    }

    try {
      // If destination already exists, remove it first so rename succeeds cleanly
      if (fs.existsSync(destination)) {
        await fs.promises.rm(destination, { recursive: true, force: true });
      }
      await fs.promises.rename(src, destination);
    } catch (err) {
      // Fallback for cross-device or permission limits
      await fs.promises.cp(src, destination, { recursive: true, force: true });
      await fs.promises.rm(src, { recursive: true, force: true });
    }

    return '/' + path.relative(this.projectRoot, destination).replace(/\\/g, '/');
  }

  public async moveItems(sourceRelPaths: string[], destRelDir: string): Promise<{ count: number; moved: string[] }> {
    const moved: string[] = [];
    for (const src of sourceRelPaths) {
      try {
        const res = await this.moveItem(src, destRelDir);
        moved.push(res);
      } catch (err) {
        console.error(`Error moving ${src} to ${destRelDir}:`, err);
      }
    }
    return { count: moved.length, moved };
  }

  public async moveAllFromDirectoryToRoot(sourceRelDir: string, deleteFolderAfter: boolean = false): Promise<{ count: number; moved: string[] }> {
    const cleanDir = path.normalize('/' + sourceRelDir.replace(/\0/g, ''));
    if (cleanDir === '/' || cleanDir === '.') {
      throw new Error('Anda sudah berada di root directory.');
    }

    const srcDir = this.resolveSafe(sourceRelDir);
    if (!fs.existsSync(srcDir)) {
      throw new Error(`Folder tidak ditemukan: ${sourceRelDir}`);
    }

    const stat = await fs.promises.stat(srcDir);
    if (!stat.isDirectory()) {
      throw new Error(`Path bukan folder: ${sourceRelDir}`);
    }

    const entries = await fs.promises.readdir(srcDir);
    const moved: string[] = [];

    for (const entry of entries) {
      const entryRelPath = path.posix.join(sourceRelDir, entry);
      try {
        const res = await this.moveItem(entryRelPath, '/');
        moved.push(res);
      } catch (err) {
        console.error(`Gagal memindahkan ${entry} ke root:`, err);
      }
    }

    if (deleteFolderAfter) {
      try {
        await fs.promises.rm(srcDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Gagal menghapus folder kosong ${srcDir}:`, err);
      }
    }

    return { count: moved.length, moved };
  }

  public async unarchive(
    archiveRelPath: string,
    targetRelDir?: string
  ): Promise<{ success: boolean; message: string; count: number; targetDir: string }> {
    const fullArchivePath = this.resolveSafe(archiveRelPath);
    if (!fs.existsSync(fullArchivePath)) {
      throw new Error(`File arsip tidak ditemukan: ${archiveRelPath}`);
    }

    const stat = await fs.promises.stat(fullArchivePath);
    if (stat.isDirectory()) {
      throw new Error(`Target adalah folder, bukan file arsip.`);
    }

    // Default destination: if targetRelDir given, use it; otherwise use directory containing the archive
    const targetDirRel = targetRelDir && targetRelDir.trim() !== ''
      ? targetRelDir.trim()
      : path.posix.dirname(archiveRelPath);

    const fullTargetDir = this.resolveSafe(targetDirRel);
    if (!fs.existsSync(fullTargetDir)) {
      await fs.promises.mkdir(fullTargetDir, { recursive: true });
    }

    const lowerName = path.basename(fullArchivePath).toLowerCase();
    let extractedCount = 0;

    if (lowerName.endsWith('.zip')) {
      try {
        const zip = new AdmZip(fullArchivePath);
        const entries = zip.getEntries();
        extractedCount = entries.length;

        // Verify zip-slip security check for every entry
        for (const entry of entries) {
          const entryDest = path.resolve(fullTargetDir, entry.entryName);
          if (!entryDest.startsWith(this.projectRoot)) {
            throw new Error(`Security Violation: File di dalam zip mencoba keluar dari workspace (${entry.entryName})`);
          }
        }

        zip.extractAllTo(fullTargetDir, true);
      } catch (admErr: any) {
        // Fallback to system unzip command if AdmZip fails
        console.warn('[STORAGE] AdmZip failed, falling back to unzip CLI:', admErr.message);
        try {
          await execFileAsync('unzip', ['-o', '-q', fullArchivePath, '-d', fullTargetDir]);
          const afterEntries = await fs.promises.readdir(fullTargetDir);
          extractedCount = afterEntries.length;
        } catch (unzipErr: any) {
          throw new Error(`Gagal mengekstrak zip: ${unzipErr.message || admErr.message}`);
        }
      }
    } else if (lowerName.endsWith('.tar.gz') || lowerName.endsWith('.tgz')) {
      try {
        await execFileAsync('tar', ['-xzf', fullArchivePath, '-C', fullTargetDir]);
        const entries = await fs.promises.readdir(fullTargetDir);
        extractedCount = entries.length;
      } catch (tarErr: any) {
        throw new Error(`Gagal mengekstrak tar.gz: ${tarErr.message}`);
      }
    } else if (lowerName.endsWith('.tar')) {
      try {
        await execFileAsync('tar', ['-xf', fullArchivePath, '-C', fullTargetDir]);
        const entries = await fs.promises.readdir(fullTargetDir);
        extractedCount = entries.length;
      } catch (tarErr: any) {
        throw new Error(`Gagal mengekstrak tar: ${tarErr.message}`);
      }
    } else if (lowerName.endsWith('.gz')) {
      try {
        // Decompress single gz file
        const outName = path.basename(fullArchivePath).replace(/\.gz$/i, '');
        const outPath = path.join(fullTargetDir, outName);
        await execFileAsync('gzip', ['-dkfc', fullArchivePath]);
        extractedCount = 1;
      } catch (gzErr: any) {
        throw new Error(`Gagal mengekstrak gz: ${gzErr.message}`);
      }
    } else {
      throw new Error('Format arsip tidak didukung. Harap gunakan file .zip, .tar, .tar.gz, atau .tgz');
    }

    return {
      success: true,
      message: `Berhasil mengekstrak arsip ke ${targetDirRel || '/'} (${extractedCount} entri).`,
      count: extractedCount,
      targetDir: targetDirRel || '/',
    };
  }
}
