import fg from 'fast-glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function glob(id: string) {
    const list = await fg(path.join(__dirname, 'video', `${id}*`));
    return list;
}