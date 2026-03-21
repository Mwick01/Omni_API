#!/usr/bin/env python3
from scraper import scrape_and_download
from whatsapp_sender import send_notices

if __name__ == "__main__":
    print("=" * 50)
    print("🤖 RUH Notice Bot (Green API)")
    print("=" * 50)

    scrape_and_download()
    send_notices()

    print("\n✅ Done.")
