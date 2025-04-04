import puppeteer from 'puppeteer';

const url = 'https://pharmacy.amazon.com/Hydralazine-Oral-Tablet/dp/B084BWZFWZ';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a realistic User-Agent to avoid being blocked
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Navigate to the page
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait for the element to appear in the DOM
  //await page.waitForSelector('#insurance-estimate-median-price', { timeout: 10000 });

  // Extract the price value
  const price = await page.$eval('#insurance-estimate-median-price', el => el.childNodes[0].textContent.trim());


 
  console.log('Insurance Estimate Median Price:', price);

  await browser.close();
})();
