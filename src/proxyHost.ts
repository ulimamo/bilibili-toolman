import path from 'path';
import { stat as _stat, writeFile, readFile } from 'fs/promises';
import axios from 'axios'
type HostItem = [string, { stats: any; uri: string }][];

class Storage {
    fileName = path.join(__dirname, 'config.json');
    checking;
    constructor() {
        this.checking = this.checkFile();
    }
    async checkFile() {
        try {
            let stat = await _stat(this.fileName);
            if (stat.isFile()) return;
            return writeFile(this.fileName, '{}', 'utf-8');
        } catch (err) {
            return writeFile(this.fileName, '{}', 'utf-8');
        }
    }
    async get(key: string) {
        await this.checking;
        let data = await readFile(this.fileName, 'utf-8');
        let obj = JSON.parse(data);
        return obj[key];
    }
    async set(key: string, value: unknown) {
        await this.checking;
        let data = await readFile(this.fileName, 'utf-8');
        let obj = JSON.parse(data);
        obj[key] = value;
        this.checking = writeFile(this.fileName, JSON.stringify(obj, null, 2), 'utf-8');
    }
}

async function filterHosts() {
    const url = 'https://api.invidious.io/instances.json?pretty=1&sort_by=type,users';
    const res = await axios.get<HostItem>(url).then((res) => res.data);
    return res.filter((i) => i[1].stats).map((i) => i[1].uri);
}