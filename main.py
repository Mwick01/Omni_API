#!/usr/bin/env python3
"""
Main entry point for the Notice Bot.
1. Runs the scraper to check for new notices
2. Calls the WhatsApp sender (Node.js) to dispatch unsent notices
"""

import subprocess
import sys
from scraper import scrape_and_download

def run_whatsapp_sender():
    print("\n📲 Starting WhatsApp sender...")
    result = subprocess.run(
        ["node", "whatsapp_sender.js"],
        capture_output=False,
        text=True
    )
    if result.returncode != 0:
        print(f"❌ WhatsApp sender exited with code {result.returncode}")
        sys.exit(result.returncode)

if __name__ == "__main__":
    print("=" * 50)
    print("🤖 Notice Bot Starting")
    print("=" * 50)

    print("\n📡 Step 1: Scraping notices...")
    scrape_and_download()

    print("\n📲 Step 2: Sending to WhatsApp...")
    run_whatsapp_sender()

    print("\n✅ Notice Bot finished.")
