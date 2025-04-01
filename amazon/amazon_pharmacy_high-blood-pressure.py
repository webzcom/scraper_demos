from playwright.sync_api import sync_playwright
import csv

def scrape_amazon_search():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        url = "https://www.amazon.com/s?k=high+blood+pressure&i=amazon-pharmacy&ref=sf_highbloodpressure"
        page.goto(url, timeout=60000)
        page.wait_for_timeout(5000)

        products = page.query_selector_all('div.s-main-slot div[data-component-type="s-search-result"]')

        data = []

        for index, product in enumerate(products):
            try:
                title_el = product.query_selector('h2 a span')
                title = title_el.inner_text().strip() if title_el else "No title"

                link_el = product.query_selector('h2 a')
                href = link_el.get_attribute('href') if link_el else ""
                full_link = "https://www.amazon.com" + href if href.startswith('/') else href

                price_el = product.query_selector('span.a-price > span.a-offscreen')
                price = price_el.inner_text().strip() if price_el else "No price listed"

                print(f"{index+1}. {title} - {price} - {full_link}")
                data.append([title, price, full_link])
            except Exception as e:
                print(f"Error on product {index+1}: {e}")

        # Save to CSV
        with open("amazon_pharmacy_search_results.csv", "w", newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Title", "Price", "Link"])
            writer.writerows(data)

        browser.close()

if __name__ == "__main__":
    scrape_amazon_search()
