import path from 'path';
import { execa } from 'execa';
import fs from 'fs-extra';
import stream from 'stream';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const reg = /公共链接：(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*))/m;

export async function uploadWss(filePath: string) {
    let lp = execa(`python3`, [`${path.resolve(__dirname, './python/wss.py')}`, `upload`, `${filePath}`], {
        stderr: process.stderr,
    });
    let wt = new stream.Writable();
    const chunks: Buffer[] = [];
    wt._write = (chunk, encoding, done) => {
        chunks.push(Buffer.from(chunk))
        console.log(chunk.toString('utf8'));
        done();
    }
    lp.pipeStdout?.(wt);
    await lp;
    let out = Buffer.concat(chunks).toString('utf8');
    let link = reg.exec(out)?.[1];
    console.log('wss out: ', out);
    console.log('wss link: ', link);
    if(link) return link;
    throw Error('上传失败');
}