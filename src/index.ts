/* eslint-disable camelcase */
/* eslint-disable no-cond-assign */
/* eslint-disable no-await-in-loop */
import RSSParser from 'rss-parser';
import { uploadWss } from './wss';
import { glob } from './glob';
import { sendMail } from './mail';
import { IEmailInfo } from './types';
import { download } from './download';
import dayjs from 'dayjs';

import dotenv from 'dotenv';
dotenv.config();

interface VideoItem {
    title: string;
    isoDate: string;
    id: string;
    author: string;
}

const parser = new RSSParser({
    timeout: 1000 * 5,
    maxRedirects: 3,
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const CHECK_ABOVE = Number(process.env.CHECK_ABOVE) || 1;

async function getData(url: string): Promise<VideoItem[]> {
    const data = await parser.parseURL(url);
    return data.items.map(({ title = '', isoDate = '', id = '', author = '' }) => ({
        title,
        isoDate,
        id: id.replace('yt:video:', ''),
        author,
    }));
}

async function main() {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

    let list = await getData(url);
    const lastDay = dayjs().add(-CHECK_ABOVE, 'day');
    list = list.filter((item) => {
        let uploadDate = dayjs(item.isoDate);
        // 默认一天内
        return uploadDate.isAfter(lastDay);
    });
    let item;
    while ((item = list.pop())) {
        await download(item.id);
        let list = await glob(item.id);
        if(list.length === 0) continue;
        const urlList = await Promise.all(list.map((filePath) => uploadWss(filePath)));
        if(urlList.length === 0) continue;
        const emailInfo: IEmailInfo = {
            subject: `youtube 视频更新 ${item.author}`,
            content: [
                `标题：${item.title}`,
                `youtube: ${item.author}`,
                `时间：${item.isoDate}`,
                `链接：https://www.youtube.com/watch?v=${item.id}`,
                `文件：${urlList.join('\n')}`,
            ].join('\n'),
        };
        await sendMail(emailInfo);
    }
    process.exit(0);
}

main();
