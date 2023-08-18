const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const screenshotDirectory = './screenshots'; // Change this to your desired directory
const csvFilesDirectory = './csvFiles'; // Directory containing CSV files



// this method uses csv from the csvFiles folders

// Function to parse CSV and return data as an array of objects
function parseCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n');
  let headerProcessed = false;
  const data = [];

  for (const line of lines) {
    if (!headerProcessed) {
      headerProcessed = true;
      continue;
    }

    const [/*timestamp,*/ pageUrl, uniqueCount, channel] = line.split(',').map(item => item.trim());
    if (/*timestamp &&*/ pageUrl && uniqueCount && channel) {
      data.push({ /*timestamp,*/ pageUrl, uniqueCount, channel });
    }
  }

  return data;
}

// Function to take screenshots based on parsed data
async function takeScreenshots(parsedData) {
  const browser = await puppeteer.launch({ headless: "new" });

  try {
    const page = await browser.newPage();

    for (const entry of parsedData) {
      const { pageUrl, uniqueCount, channel } = entry;
      const url = new URL(pageUrl);
      const pathSegments = url.pathname.split('/').filter(segment => segment !== '');
      const pathForFilename = `_${pathSegments.join('_')}_`;
      const screenshotFilename = `${uniqueCount}${pathForFilename}.png`;
      const channelDirectory = path.join(screenshotDirectory, channel);

      if (!fs.existsSync(channelDirectory)) {
        fs.mkdirSync(channelDirectory);
      }

      const screenshotPath = path.join(channelDirectory, screenshotFilename);

      await page.goto(pageUrl,{
        waitUntil: 'networkidle2'
      });
      await page.setViewport({
        width: 1440, // Adjust width as needed
        height: await page.evaluate(() => document.body.scrollHeight)
      });

      await autoScroll(page);

      await page.screenshot({ path: screenshotPath });

      console.log(`Screenshot saved: ${screenshotPath}`);
    }
  } catch (error) {
    console.error('Error while taking screenshots:', error);
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

// const csvFiles = process.argv.slice(2);

// if (csvFiles.length === 0) {
//   console.log("Usage: node script_name.js <csv_file1> <csv_file2> ...");
// } else {
//   (async () => {
//     for (const file of csvFiles) {
//       const parsedData = parseCSV(file);
//       await takeScreenshots(parsedData);
//     }
//   })();
// }

fs.readdir(csvFilesDirectory, (err, files) => {
    if (err) {
      console.error('Error reading CSV files directory:', err);
      return;
    }
  
    const csvFiles = files.filter(file => file.endsWith('.csv'));
  
    if (csvFiles.length === 0) {
      console.log("No CSV files found in the csvFiles directory.");
      return;
    }
  
    (async () => {
      for (const file of csvFiles) {
        const filePath = path.join(csvFilesDirectory, file);
        const parsedData = parseCSV(filePath);
        await takeScreenshots(parsedData);
      }
    })();
  });