import path from 'path';
import { execa } from 'execa';
import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const reg = /公共链接：(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*))/;

export async function uploadWss(filePath: string) {
    let lp = execa(`python3`, [`${path.resolve(__dirname, './python/wss.py')}`, `upload`, `${filePath}`], {
        stdout: process.stdout,
        stderr: process.stderr,
    });
    const logPath = path.resolve(__dirname, './log', filePath);
    lp.pipeStdout?.(fs.createWriteStream(logPath, 'utf-8'));
    await lp;
    let out = fs.readFileSync(logPath, 'utf-8')
    let link = reg.exec(out)?.[1];
    console.log('wss out: ', out);
    console.log('wss link: ', link);
    if(link) return link;
    throw Error('上传失败');
}