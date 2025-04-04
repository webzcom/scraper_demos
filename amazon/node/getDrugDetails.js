// getDrugDetails.js
import puppeteer from 'puppeteer';

export async function getDrugDetails(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#insurance-estimate-median-price', { timeout: 10000 });

    const result = await page.evaluate(() => {
      const getText = (id) => {
        const el = document.querySelector(`#${id}`);
        return el ? el.innerText.trim() : null;
      };

      return {
        price: getText('insurance-estimate-median-price'),
        form: getText('form-box-item'),
        strength: getText('strength-box-item'),
        frequency: getText('frequency-box-item'),
        supply: getText('supply-box-item'),
      };
    });

    return result;
  } catch (error) {
    console.error('❌ Error scraping drug details:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}
