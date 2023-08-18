const puppeteer = require ('puppeteer');
const fs = require('fs');
const dir = './screenshots/';

function createPath(url){
    let path;
    path = url.split('.com')[1];
    if(path[0] == '/') {
        path = path.substring(1);
    }
    if(path[path.length-1] == '/') {
        path = path.slice(0, -1);
    }
    path = path.replace(/\//g, '.')
    path = `${dir}${path}.png`
    return path;
}

async function screenshotPage(url) {
    console.log("1!");
    const browser = await puppeteer.launch({
        headless: false,
        timeout: 100000,
        defaultViewport: {
            width: 1400,
            height: 0
        }
    });
    console.log("2!");
    const page = await browser.newPage();
    var path = createPath(url);
    await page.goto(url, {
        waitUntil: 'networkidle2'
    })
    console.log("3!");
    // upated this?
    // await page.waitFor(500);
    console.log('path!', path);
    await page.screenshot({path: path, fullPage: true});
    console.log("4!");
    browser.close();
}


async function screenshotPages(pageArray) {
    if (!fs.existsSync(dir)){
        console.log("directory does not exist!!!");
        fs.mkdirSync(dir);
    }
    for (const file of pageArray) {
        console.log("in here!");
        await screenshotPage(file)
    }
}

var pages = ['https://www.capitalone.com/about/', 'https://www.capitalone.com/help-center', 'https://www.capitalone.com/digital/facts2019/faq']
screenshotPages(pages);