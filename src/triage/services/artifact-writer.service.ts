import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ArtifactWriterService {
  writeJson(filePath: string, data: unknown): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    fs.renameSync(tmp, filePath);
  }

  writeText(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  appendJsonl(filePath: string, record: unknown): void {
    fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf-8');
  }

  appendLog(filePath: string, message: string): void {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(filePath, line, 'utf-8');
  }
}
