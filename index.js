const Axios = require('axios');
const { Telegraf } = require('telegraf');
const cheerio = require('cheerio');
const qs = require('qs');
require("dotenv").config();
const express = require('express');
const app = express();
const port = 3000;

// Server setup to confirm it's running
app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const bot = new Telegraf(process.env.TOKEN);

bot.command('start', (ctx) => {
    ctx.reply('Welcome to the TikTok Downloader Bot! Send me a TikTok video URL, and I will provide download links.');
});

bot.on('text', async (ctx) => {
    const tikTokUrl = ctx.message.text;

    try {
        const downloadLinks = await tiktokdownload(tikTokUrl);
        const responseMessage = generateResponseMessage(downloadLinks);
        ctx.reply(responseMessage);
    } catch (error) {
        ctx.reply(`Error: ${error.message}`);
    }
});

bot.launch();

async function tiktokdownload(url) {
    try {
        const response = await Axios.get('https://ttdownloader.com/');
        const html = response.data;
        const $ = cheerio.load(html);
        const cookie = response.headers['set-cookie'].join('');

        const token = $('#token').val();
        const dataPost = {
            url: url,
            format: '',
            token: token,
        };

        const searchResponse = await Axios.post('https://ttdownloader.com/search/', qs.stringify(dataPost), {
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'origin': 'https://ttdownloader.com',
                'referer': 'https://ttdownloader.com/',
                'cookie': cookie,
            },
        });

        const searchData = searchResponse.data;
        const $search = cheerio.load(searchData);

        const result = {
            nowm: $search('#results-list > div:nth-child(2) > div.download > a').attr('href'),
            wm: $search('#results-list > div:nth-child(3) > div.download > a').attr('href'),
            audio: $search('#results-list > div:nth-child(4) > div.download > a').attr('href'),
        };

        return result;
    } catch (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
}

function generateResponseMessage(downloadLinks) {
    return `
    KSK donate me 1$
    Download Links:
    - No Watermark: ${downloadLinks.nowm || 'N/A'}
    - With Watermark: ${downloadLinks.wm || 'N/A'}
    - Audio: ${downloadLinks.audio || 'N/A'}
    `;
}
