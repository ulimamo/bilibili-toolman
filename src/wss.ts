import path from 'path';
import { execa } from 'execa';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const reg = /公共链接：(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*))/;

export async function uploadWss(filePath: string) {
    let result = await execa(`python3`, [`${path.resolve(__dirname, './python/wss.py')}`, `upload`, `${filePath}`], {
        stdout: process.stdout,
        stderr: process.stderr,
    });
    let out = result.stdout;
    let link = reg.exec(out)?.[1];
    if(link) return link;
    throw Error('上传失败');
}