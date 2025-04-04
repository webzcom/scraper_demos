import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
// import sql from 'mssql'; // Uncomment later for DB connection


// Amazon Drug Category Pages
const categoryUrls = [
    'https://www.amazon.com/s?k=high+blood+pressure&i=amazon-pharmacy&ref=sf_highbloodpressure',
    'https://www.amazon.com/s?k=high+cholesterol&i=amazon-pharmacy&ref=sf_highcholesterol',
    'https://www.amazon.com/s?k=depression&i=amazon-pharmacy&ref=sf_depression',
    'https://www.amazon.com/s?k=anxiety&i=amazon-pharmacy&ref=sf_anxiety',
    'https://www.amazon.com/s?k=acid+reflux&i=amazon-pharmacy&ref=sf_acidreflux',
    'https://www.amazon.com/s?k=birth+control&i=amazon-pharmacy&ref=sf_birthcontrol',
    'https://www.amazon.com/s?k=diabetes&i=amazon-pharmacy&ref=sf_diabetes',
    'https://www.amazon.com/s?k=hypothyroidism&i=amazon-pharmacy&ref=sf_hypothyroidism',
    'https://www.amazon.com/s?k=allergies&i=amazon-pharmacy&ref=sf_allergies',
    'https://www.amazon.com/s?k=asthma&i=amazon-pharmacy&ref=sf_asthma',
    'https://www.amazon.com/s?k=hair+loss&i=amazon-pharmacy&ref=sf_hairloss'
    // Add more as needed
  ];
  

// CSV file info
const outputFile = 'amazon-pharmacy-drugs.csv';

// Delete existing file at start
if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

// CSV Writer Setup
const csvWriter = createObjectCsvWriter({
  path: outputFile,
  header: [
    { id: 'name', title: 'Name' },
    { id: 'url', title: 'URL' },
    { id: 'priceWithoutInsurance', title: 'Price Without Insurance' },
    { id: 'priceWithInsurance', title: 'Price With Insurance' },
    { id: 'form', title: 'Form' },
    { id: 'strength', title: 'Strength' },
    { id: 'supply', title: 'Supply' },
    { id: 'timestamp', title: 'Timestamp' }
  ],
  append: fs.existsSync(outputFile)
});


// Retry HTTP connection 3 times before giving up 
async function safeGoto(page, url, retries = 3) {
    for (let i = 1; i <= retries; i++) {
      try {
        console.log(`🌐 Navigating to ${url} (attempt ${i})`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        return true; // success
      } catch (err) {
        console.warn(`⚠️ Failed to load ${url} on attempt ${i}: ${err.message}`);
        if (i === retries) {
          console.error(`❌ Gave up after ${retries} attempts: ${url}`);
          return false;
        }
  
        // Wait before retrying
        const wait = 1500 * i;
        console.log(`⏳ Retrying in ${wait}ms...`);
        await new Promise(res => setTimeout(res, wait));
      }
    }
  }
  

  async function extractDrugDetails(page, url) {
    const success = await safeGoto(page, url);
    if (!success) return null;
  
    try {
      const data = await page.evaluate(() => {
        const get = (id) => {
          const el = document.querySelector(`#${id}`);
          const first = el?.querySelector(':scope > *');
          return first ? first.textContent.trim() : el?.textContent.trim() || null;
        };
  
        const nameEl = document.querySelector('#productTitle') || document.querySelector('h1');
        const name = nameEl?.textContent.trim() || null;
  
        return {
          name,
          priceWithoutInsurance: get('retail-estimate-price'),
          priceWithInsurance: get('insurance-estimate-median-price'),
          form: get('form-box-item'),
          strength: get('strength-box-item'),
          supply: get('supply-box-item'),
        };
      });
  
      return { ...data, url };
    } catch (err) {
      console.error(`❌ Failed to extract data from ${url}: ${err.message}`);
      return null;
    }
  }
  
  
  // Get the list of drug page URLs that need to be scraped before scraping them
  async function getDrugUrls(page, categoryUrl) {
    const allLinks = new Set();
    let pageNumber = 1;
  
    while (true) {
      const pageUrl = `${categoryUrl}&page=${pageNumber}`;
      console.log(`📄 Visiting: ${pageUrl}`);
  
      const success = await safeGoto(page, pageUrl);
      if (!success) break;
  
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a.a-link-normal.s-no-outline'))
          .map(el => el.href)
          .filter(href => href.includes('/dp/'))
          .map(link => link.split('?')[0]);
      });
  
      if (links.length === 0) {
        console.log(`⛔ No results on page ${pageNumber}, stopping.`);
        break;
      }
  
      links.forEach(link => allLinks.add(link));
      pageNumber++;
  
      await new Promise(res => setTimeout(res, 1000)); // delay between pages
    }
  
    return [...allLinks];
  }
  
 
  
  // Run the application
  async function run() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...');
  
    const timestamp = new Date().toISOString();
    const results = [];
  
    for (const categoryUrl of categoryUrls) {
      console.log(`🔍 Starting category: ${categoryUrl}`);
      const drugUrls = await getDrugUrls(page, categoryUrl);
  
      for (const url of drugUrls) {
        console.log(`🧪 Scraping: ${url}`);
        const details = await extractDrugDetails(page, url);
        if (details?.name) {
          results.push({ ...details, url, timestamp });
        } else {
          console.warn(`⚠️ Skipped: ${url}`);
        }
      }
    }
  
    await csvWriter.writeRecords(results);
    console.log(`✅ Saved ${results.length} records to CSV`);
  
    await browser.close();
  }
  
  

// Placeholder for future DB insert
// async function insertToDatabase(details) {
//   const config = {
//     user: 'your_username',
//     password: 'your_password',
//     server: 'your_server',
//     database: 'your_database',
//     options: {
//       encrypt: true,
//       trustServerCertificate: true
//     }
//   };

//   await sql.connect(config);
//   const request = new sql.Request();
//   request.input('name', sql.NVarChar, details.name);
//   request.input('priceWithoutInsurance', sql.NVarChar, details.priceWithoutInsurance);
//   request.input('priceWithInsurance', sql.NVarChar, details.priceWithInsurance);
//   request.input('form', sql.NVarChar, details.form);
//   request.input('strength', sql.NVarChar, details.strength);
//   request.input('supply', sql.NVarChar, details.supply);
//   request.input('timestamp', sql.DateTime, new Date(details.timestamp));

//   await request.query(`
//     INSERT INTO DrugInfo (Name, PriceWithoutInsurance, PriceWithInsurance, Form, Strength, Supply, Timestamp)
//     VALUES (@name, @priceWithoutInsurance, @priceWithInsurance, @form, @strength, @supply, @timestamp)
//   `);
// }

run();
