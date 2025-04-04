// main.js
import { getDrugDetails } from './getDrugDetails.js';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';

const url = 'https://pharmacy.amazon.com/Hydralazine-Oral-Tablet/dp/B084BWZFWZ';
const outputFile = 'drug-data.csv';

// Initialize the CSV writer
const csvWriter = createObjectCsvWriter({
  path: outputFile,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'price', title: 'Price' },
    { id: 'form', title: 'Form' },
    { id: 'strength', title: 'Strength' },
    { id: 'frequency', title: 'Frequency' },
    { id: 'supply', title: 'Supply' },
    { id: 'timestamp', title: 'Timestamp' }
  ],
  append: fs.existsSync(outputFile) // Only append if file exists
});

async function run() {
  const details = await getDrugDetails(url);

  if (!details) {
    console.error('No drug details found.');
    return;
  }

  const timestamp = new Date().toISOString();

  console.log('💊 Scraped Drug Details:', details);

  await csvWriter.writeRecords([
    {
      url,
      price: details.price,
      form: details.form,
      strength: details.strength,
      frequency: details.frequency,
      supply: details.supply,
      timestamp
    }
  ]);

  console.log(`✅ Data saved to ${outputFile}`);
}

run();
