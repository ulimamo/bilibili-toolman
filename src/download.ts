import youtubeDl from "youtube-dl-exec";
import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export function download(id: string) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    return youtubeDl(
        url,
        {
            // dumpSingleJson: true,
            noSimulate: true,
            // listFormats: true,
            noCheckCertificates: true,
            noWarnings: true,
            progress: true,
            // preferFreeFormats: true,
            // checkAllFormats: true,
            formatSort: 'ext',
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            output: path.join(__dirname, 'video', `${id}.%(ext)s`),
            subLang: 'zh.*',
            subFormat: 'srt',
            writeSub: true,
        } as Record<string, any>,
        { stdout: process.stdout, stderr: process.stderr },
    );
}