const fs = require('fs');
const path = require('path');
const axios = require('axios');

const csvFilesDirectory = './csvFiles'; // Directory containing CSV files
const htmlOutputDirectory = './html-files'; // Directory to save HTML content

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

// Function to retrieve HTML content and save to files
async function retrieveAndSaveHTML(parsedData) {
  for (const entry of parsedData) {
    const { pageUrl, uniqueCount, channel } = entry;
    const url = new URL(pageUrl);
    const pathSegments = url.pathname.split('/').filter(segment => segment !== ''); // Remove empty segments
    const pathForFilename = `_${pathSegments.join('_')}_`; // Convert to _path_path_ format

    try {
      const response = await axios.get(pageUrl);
      const htmlContent = response.data;

      const channelDirectory = path.join(htmlOutputDirectory, channel);
      if (!fs.existsSync(channelDirectory)) {
        fs.mkdirSync(channelDirectory);
      }

      const htmlFilePath = path.join(channelDirectory, `${pathForFilename}.html`);
      fs.writeFileSync(htmlFilePath, htmlContent);

      console.log(`HTML content saved: ${htmlFilePath}`);
    } catch (error) {
      console.error(`Error retrieving HTML content from '${pageUrl}':`, error);
    }
  }
}

if (!fs.existsSync(htmlOutputDirectory)) {
  fs.mkdirSync(htmlOutputDirectory);
}

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
      await retrieveAndSaveHTML(parsedData);
    }
  })();
});
