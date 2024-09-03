import puppeteer from "puppeteer";

let browser;

async function startBrowser() {
    browser = await puppeteer.launch({ headless: false });
}

async function search(query) {
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

    await page.waitForSelector('div.MjjYud');

    const firstResultUrl = await page.evaluate(() => {
        const values = document.getElementsByClassName('MjjYud')[0].querySelectorAll("a")[0].getAttribute("href")
        if (!values) return null;
        return values; 
    });

    await page.close();
    return firstResultUrl;
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
    }
}

process.on('exit', closeBrowser);
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);


export default {
    search,
    closeBrowser,
    startBrowser
};