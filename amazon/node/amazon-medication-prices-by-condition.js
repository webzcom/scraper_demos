//const axios = require('axios');
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer'; 
//const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// const mysql = require('mysql2'); // Scaffold for later SQL use

const START_URL = 'https://www.amazon.com/s?k=high+blood+pressure&i=amazon-pharmacy&ref=sf_highbloodpressure';

const csvWriter = createObjectCsvWriter({
  path: 'drug_data.csv',
  header: [
    { id: 'drugName', title: 'Drug Name' },
    { id: 'form', title: 'Form' },
    { id: 'strength', title: 'Strength' },
    { id: 'no_insurance_price', title: 'Price w/o Insurance' },
    { id: 'insurance_price', title: 'Price w/ Insurance' },
    { id: 'supply', title: 'Supply (Days)' },
    { id: 'url', title: 'URL' },
  ]
});

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
    }
  });
   
  return cheerio.load(data);
}

async function extractDrugLinks($) {
  const links = [];
  $('a.a-link-normal.s-no-outline').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/dp/')) {
      //const fullUrl = `https://www.amazon.com${href}`;
      const fullUrl = `${href}`;
      links.push(fullUrl);
    }
  });
  return [...new Set(links)];
}

async function extractDrugDetails(url) {
  try {
    const $ = await fetchHTML(url);

    const drugName = $('h1.pui-heading').first().text().trim();
    //const form = $('span:contains("Form")').next().text().trim() || '';
    //const strength = $('span:contains("Strength")').next().text().trim() || '';
    //const price = $('#corePrice_feature_div span.a-price span.a-offscreen').first().text().trim() || '';
    //const supplyMatch = $('span:contains("supply")').text().match(/(\d+)[ -]?day/i);
    //const supply = supplyMatch ? supplyMatch[1] : '';


    const form = $('#form-box-item').text().trim();
    const strength = $('#strength-box-item').text().trim();
    const frequency = $('#frequency-box-item').text().trim();
    const supply = $('#supply-box-item').text().trim();

    // Pricing info
    const no_insurance_price = $('#insurance-estimate-median-price').text().trim();
    console.log('Median Price:', no_insurance_price);
    const insurance_price = $('#extended-supply-price-label').text().trim();
  
    console.log('Drug Name:', drugName);
    console.log('Form:', form);
    console.log('Strength:', strength);
    console.log('Frequency:', frequency);
    console.log('Supply:', supply);

    return { drugName, form, strength, no_insurance_price, insurance_price, supply, url };
  } catch (err) {
    console.error(`Error scraping ${url}:`, err.message);
    return null;
  }
}

(async () => {
  try {
    const $ = await fetchHTML(START_URL);
    const drugLinks = await extractDrugLinks($);
    console.log(`Found ${drugLinks.length} drug links.`);

    console.log(drugLinks);

    const results = [];

    for (const link of drugLinks) {
      const data = await extractDrugDetails(link);
      if (data) {
        results.push(data);
        console.log(`Scraped: ${data.name}`);
      }
      await new Promise(res => setTimeout(res, 1000)); // polite delay
    }

    await csvWriter.writeRecords(results);
    console.log(`Finished writing ${results.length} entries to drug_data.csv`);

    // Scaffold for future SQL connection
    /*
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'your_user',
      password: 'your_password',
      database: 'your_database'
    });

    connection.connect();

    for (const drug of results) {
      const query = `INSERT INTO Drugs (Name, Form, Strength, Price, Supply, Url)
                     VALUES (?, ?, ?, ?, ?, ?)`;
      const values = [drug.name, drug.form, drug.strength, drug.price, drug.supply, drug.url];
      connection.query(query, values, (err) => {
        if (err) console.error('Insert error:', err.message);
      });
    }

    connection.end();
    */

  } catch (err) {
    console.error('Error:', err.message);
  }
})();
