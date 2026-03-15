import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from database import init_db, insert_notice, get_unsent_notices
from dotenv import load_dotenv

load_dotenv()

LOGIN_URL = "https://paravi.ruh.ac.lk/fosmis2019/login.php"
NOTICE_URL = "https://paravi.ruh.ac.lk/fosmis2019/forms/form_53_a.php"
DOWNLOAD_DIR = "downloads"

USERNAME = os.getenv("SITE_USERNAME")
PASSWORD = os.getenv("SITE_PASSWORD")

VALID_EXTS = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".txt", ".html"]

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def safe_filename(url):
    name = os.path.basename(url)
    name = re.sub(r"[\\/:*?\"<>|&=]", "_", name)
    return name


def login():
    session = requests.Session()
    payload = {"uname": USERNAME, "upwd": PASSWORD}
    headers = {"User-Agent": "Mozilla/5.0"}
    response = session.post(LOGIN_URL, data=payload, headers=headers)

    if "Sign In" not in response.text:
        print("✅ Login successful!")
        return session
    else:
        print("❌ Login failed.")
        return None


def scrape_and_download():
    init_db()
    session = login()
    if not session:
        return

    print("🔍 Checking for new notices...")
    response = session.get(NOTICE_URL)
    soup = BeautifulSoup(response.text, "html.parser")

    new_count = 0

    for link in soup.find_all("a", href=True):
        href = link["href"]

        if not any(href.lower().endswith(ext) or "form_53_a.php" in href for ext in VALID_EXTS):
            continue

        full_url = urljoin(NOTICE_URL, href)
        filename = safe_filename(href)
        filepath = os.path.join(DOWNLOAD_DIR, filename)
        title = link.get_text(strip=True) or filename

        try:
            print(f"⬇ Downloading: {filename}")
            file_resp = session.get(full_url)

            # Handle HTML -> TXT conversion
            final_filepath = filepath
            final_filename = filename

            if filename.lower().endswith(".html"):
                page_soup = BeautifulSoup(file_resp.content, "html.parser")
                notice_div = page_soup.find("div", id="m")
                raw = notice_div if notice_div else page_soup
                for tag in raw(["script", "style"]):
                    tag.decompose()
                text = "\n".join(
                    [line.strip() for line in raw.get_text(separator="\n").split("\n")]
                )
                final_filename = filename.rsplit(".", 1)[0] + ".txt"
                final_filepath = os.path.join(DOWNLOAD_DIR, final_filename)
                with open(final_filepath, "w", encoding="utf-8") as tf:
                    tf.write(text)
                print(f"📝 Converted to text: {final_filename}")
            else:
                with open(final_filepath, "wb") as f:
                    f.write(file_resp.content)

            # Save to DB — returns True if it's a new notice
            is_new = insert_notice(title, full_url, final_filepath)
            if is_new:
                print(f"✅ New notice saved to DB: {title}")
                new_count += 1

        except Exception as e:
            print(f"❌ Error with {filename}: {e}")

    print(f"✅ Done. {new_count} new notice(s) found.")


if __name__ == "__main__":
    scrape_and_download()
