from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import pandas as pd
import time

# Testing values
counterValue = 0
outputLimit = 5

# Setup headless Chrome browser
options = Options()
options.headless = True
driver_path = ""  # Update this path
driver = webdriver.Chrome(service=Service(driver_path), options=options)

# Step 1: Load RxPass drug list page
base_url = "https://pharmacy.amazon.com/rxpass#all-rxpass-meds"
driver.get(base_url)
time.sleep(5)

# Scroll down to load all drugs (adjust if needed)
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
time.sleep(5)

# Step 2: Collect all drug detail links
drug_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/dp/')]")
unique_links = list(set(link.get_attribute("href") for link in drug_links))

print(f"Found {len(unique_links)} drugs.")

drug_data = []

# Step 3: Visit each drug page and extract detailed info
for url in unique_links:
    driver.get(url)
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


    # Drug details (labels may vary — update as needed)
    #form = try_get_by_xpath("//div[contains(text(), 'Form')]/following-sibling::div")
    #strength = try_get_by_xpath("//div[contains(text(), 'Strength')]/following-sibling::div")
    #frequency = try_get_by_xpath("//div[contains(text(), 'Frequency')]/following-sibling::div")
    #supply = try_get_by_xpath("//div[contains(text(), 'Supply')]/following-sibling::div")

    form = try_get_by_id("form-box-item")
    strength = try_get_by_id("strength-box-item")
    frequency = try_get_by_id("frequency-box-item")
    supply = try_get_by_id("supply-box-item")
    
    
    
    # Pricing Info
    no_insurance_price = try_get_by_id("insurance-estimate-median-price")
    insurance_price = try_get_by_id("extended-supply-price-label")  # spelling from your message

    no_insurance_price_formatted = format_price(no_insurance_price)
    insurance_price_formatted = format_price(insurance_price)

    print(drug_name)

    drug_data.append({
        "Drug Name": drug_name,
        "Price URL": url,
        "Form": form,
        "Strength": strength,
        "Frequency": frequency,
        "Supply": supply,
        "Average Insurance Price": insurance_price_formatted,
        "Buy Without Insurance": no_insurance_price_formatted
    })

driver.quit()

# Step 4: Export to Excel
df = pd.DataFrame(drug_data)
df.to_excel("Amazon_RxPass_Drug_Details.xlsx", index=False)
print("Exported drug details to Amazon_RxPass_Drug_Details.xlsx")
