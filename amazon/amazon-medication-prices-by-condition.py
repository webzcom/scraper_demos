import csv
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# Set up headless Chrome
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# URL to Amazon Pharmacy search results
#search_url = "https://www.amazon.com/s?k=high+blood+pressure&i=amazon-pharmacy&ref=sf_highbloodpressure"
#search_url = "https://www.amazon.com/s?k=high+cholesterol&i=amazon-pharmacy&ref=sf_highcholesterol"
#search_url = "https://www.amazon.com/s?k=depression&i=amazon-pharmacy&ref=sf_depression"
search_url = "https://www.amazon.com/s?k=anxiety&i=amazon-pharmacy&ref=sf_anxiety"
#search_url = "https://www.amazon.com/s?k=acid+reflux&i=amazon-pharmacy&ref=sf_acidreflux"
#search_url = "https://www.amazon.com/s?k=birth+control&i=amazon-pharmacy&ref=sf_birthcontrol"
#search_url = "https://www.amazon.com/s?k=diabetes&i=amazon-pharmacy&ref=sf_diabetes"
#search_url = "https://www.amazon.com/s?k=hypothyroidism&i=amazon-pharmacy&ref=sf_hypothyroidism"
#search_url = "https://www.amazon.com/s?k=allergies&i=amazon-pharmacy&ref=sf_allergies"
#search_url = "https://www.amazon.com/s?k=asthma&i=amazon-pharmacy&ref=sf_asthma"
#search_url = "https://www.amazon.com/s?k=hair+loss&i=amazon-pharmacy&ref=sf_hairloss"

category = search_url.split('_')[-1]
driver.get(search_url)
time.sleep(3)

# Step 1: Collect drug detail links
drug_links = []
product_elements = driver.find_elements(By.XPATH, "//a[@class='a-link-normal s-no-outline']")
for elem in product_elements:
    href = elem.get_attribute("href")
    if href and "amazon.com" in href:
        drug_links.append(href)

print(f"Collected {len(drug_links)} drug links")

# Step 2: Visit each drug link and collect information
drug_data = []

for link in drug_links[:100]:  # Limit for demonstration
    if ".com/r?aid" not in link:
        driver.get(link)
        time.sleep(3)

        # Basic Info
        try:
            drug_name = driver.find_element(By.TAG_NAME, "h1").text.strip()
        except:
            drug_name = "N/A"

        def try_get_by_xpath(xpath):
            try:
                return driver.find_element(By.XPATH, xpath).text.strip()
            except:
                return "N/A"

        def try_get_by_id(element_id):
            try:
                return driver.find_element(By.ID, element_id).text.strip()
            except:
                return "N/A"


        def format_price(price):
            try:
                price = price.replace("\n", "").replace("$", "")
                price_int = int(price)
                price_float = float(price_int / 100)
                formatted_price = f"{price_float:.2f}"
                print(formatted_price)
                return formatted_price        
            except:
                return ""

        form = try_get_by_id("form-box-item")
        strength = try_get_by_id("strength-box-item")
        frequency = try_get_by_id("frequency-box-item")
        supply = try_get_by_id("supply-box-item")
        
        # Pricing Info
        no_insurance_price = try_get_by_id("insurance-estimate-median-price")
        insurance_price = try_get_by_id("extended-supply-price-label")  # spelling from your message
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        print(drug_name)
        no_insurance_price_formatted = format_price(no_insurance_price)
        insurance_price_formatted = format_price(insurance_price)
        link = link.split('?')[0]

        drug_data.append({
            "Drug Name": drug_name,
            "Price URL": link,
            "Form": form,
            "Strength": strength,
            "Frequency": frequency,
            "Supply": supply,
            "Average Insurance Price": insurance_price_formatted,
            "Buy Without Insurance": no_insurance_price_formatted,
            "Time Stamp": timestamp
        })

# Step 3: Save to CSV
csv_filename = f"amazon_drugs_{category}.csv"
with open(csv_filename, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=["Drug Name", "Price URL", "Form", "Strength", "Frequency", "Supply", "Average Insurance Price", "Buy Without Insurance", "Time Stamp"])
    writer.writeheader()
    writer.writerows(drug_data)

print(f"\nSaved {len(drug_data)} drug entries to {csv_filename}")
driver.quit()
