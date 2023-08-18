const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const screenshotDirectory = './screenshots'; // Change this to your desired directory

async function processCSVFile(filePath) {
  const filename = path.basename(filePath);
  const browser = await puppeteer.launch({ headless: "new" });

  try {
    const page = await browser.newPage();

    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');
    let headerProcessed = false;

    for (const line of lines) {
      if (!headerProcessed) {
        headerProcessed = true;
        continue;
      }

      const [pageUrl, uniqueCount, channel] = line.split(',').map(item => item.trim());
      if (pageUrl && uniqueCount && channel) {
        try {
          const screenshotFilename = `${uniqueCount}_${channel}_${path.basename(pageUrl)}.png`;
          const channelDirectory = path.join(screenshotDirectory, channel);

          if (!fs.existsSync(channelDirectory)) {
            fs.mkdirSync(channelDirectory);
          }

          const screenshotPath = path.join(channelDirectory, screenshotFilename);

          await page.goto(pageUrl, {
            waitUntil: 'networkidle2'
          });

          // Adjust the viewport size to match the page's scroll height
          await page.setViewport({
            width: 1440, // Adjust width as needed
            height: await page.evaluate(() => document.body.scrollHeight)
          });

          // Scroll the page to capture the entire content
          await autoScroll(page);

          await page.screenshot({ path: screenshotPath });

          console.log(`Screenshot saved: ${screenshotPath}`);
        } catch (error) {
          console.error(`Error processing URL '${pageUrl}' in ${filename}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  } finally {
    await browser.close();
  }
}

// Function to scroll the page
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

if (!fs.existsSync(screenshotDirectory)) {
  fs.mkdirSync(screenshotDirectory);
}

const csvFiles = process.argv.slice(2);

if (csvFiles.length === 0) {
  console.log("Usage: node script_name.js <csv_file1> <csv_file2> ...");
} else {
  (async () => {
    for (const file of csvFiles) {
      await processCSVFile(file);
    }
  })();
}
