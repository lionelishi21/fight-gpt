"""Frame data scraper for Fight GPT.

Fetches character frame data from community-maintained wikis (Dustloop by default)
and stores the parsed move metadata in MongoDB so downstream analysis modules can
reason about startup frames, advantage, and other properties.
"""

from __future__ import annotations

import argparse
import datetime as dt
import logging
import os
import sys
from typing import Dict, Iterable, List, Optional

import requests
from bs4 import BeautifulSoup, Tag
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from requests import Response

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
LOGGER = logging.getLogger("frame-scraper")

DEFAULT_GAME_ID = "sf6"

GAME_ROSTERS: Dict[str, List[str]] = {
    "sf6": [
        "Ryu",
        "Ken",
        "Chun-Li",
        "Guile",
        "Cammy",
        "Zangief",
        "Dhalsim",
        "Blanka",
        "E. Honda",
        "JP",
        "Juri",
        "Luke",
        "Jamie",
        "Kimberly",
        "Manon",
        "Marisa",
        "Lily",
        "Dee Jay",
        "Rashid",
        "A.K.I.",
        "Ed",
        "Akuma",
    ],
}

DEFAULT_BASE_URL = "https://wiki.supercombo.gg/w/Street_Fighter_6/{character_slug}"
REQUEST_TIMEOUT = 30
HEADERS = {
    "User-Agent": "FightGPT Frame Scraper/0.1 (+https://fightgpt.ai)",
    "Accept-Language": "en-US,en;q=0.9",
}


class FrameDataScraperError(Exception):
    """Domain-specific error for scraper failures."""


def get_mongo_collection() -> Collection:
    mongo_uri = os.getenv(
        "MONGO_URI",
        "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    )
    db_name = os.getenv("MONGO_DB_NAME", "fight_gpt_db")
    collection_name = os.getenv("MONGO_FRAME_COLLECTION", "frame_data")

    if not mongo_uri:
        raise FrameDataScraperError("MONGO_URI environment variable must be set.")

    client = MongoClient(mongo_uri)
    LOGGER.info("Connected to MongoDB database '%s', collection '%s'", db_name, collection_name)
    return client[db_name][collection_name]


def slugify_character(character: str) -> str:
    """Convert character name into Dustloop slug (spaces to underscores, preserve punctuation)."""
    return character.strip().replace(" ", "_")


def fetch_character_page(url: str) -> Response:
    try:
        response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response
    except requests.RequestException as exc:  # pragma: no cover - network specific
        raise FrameDataScraperError(f"Failed to fetch frame data page: {exc}") from exc


def extract_table_name(table: Tag) -> str:
    heading = table.find_previous(["h1", "h2", "h3", "h4"])
    if heading:
        return heading.get_text(strip=True)
    if table.has_attr("id"):
        return table["id"]
    return "Frame Data"


def sanitize_header(text: str) -> str:
    return (
        text.replace("\n", " ")
        .replace("\xa0", " ")
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("/", "_")
    )


def sanitize_cell(text: str) -> str:
    return text.replace("\n", " ").replace("\xa0", " ").strip()


def table_to_moves(table: Tag) -> List[Dict[str, str]]:
    header_cells = table.find_all("th")
    headers = [sanitize_header(cell.get_text()) for cell in header_cells]
    headers = [header for header in headers if header]  # remove empty headers

    moves: List[Dict[str, str]] = []
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if not cells or len(cells) < 2:  # skip header or malformed rows
            continue

        values = [sanitize_cell(cell.get_text()) for cell in cells]
        # align header length with values length
        if len(values) > len(headers):
            # If there are more values than headers, extend headers with generic keys
            headers.extend([f"column_{idx}" for idx in range(len(headers), len(values))])

        move_entry = {
            headers[idx]: values[idx] if idx < len(values) else ""
            for idx in range(len(headers))
        }
        # Filter out empty moves (e.g., summary rows)
        if any(value for value in move_entry.values()):
            moves.append(move_entry)

    if not moves:
        raise FrameDataScraperError("No move rows parsed from frame data table.")

    return moves


def parse_frame_data(html: str) -> List[Dict[str, object]]:
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.select("table.wikitable")

    if not tables:
        raise FrameDataScraperError("No frame data tables with class 'wikitable' found.")

    parsed_tables: List[Dict[str, object]] = []

    for table in tables:
        try:
            moves = table_to_moves(table)
        except FrameDataScraperError as exc:
            LOGGER.debug("Skipping table due to parsing error: %s", exc)
            continue

        parsed_tables.append(
            {
                "section": extract_table_name(table),
                "moves": moves,
            }
        )

    if not parsed_tables:
        raise FrameDataScraperError("All tables failed to parse; no frame data captured.")

    return parsed_tables


def upsert_frame_data(
    collection: Collection,
    *,
    game_id: str,
    character_id: str,
    source_url: str,
    tables: List[Dict[str, object]],
) -> None:
    document = {
        "game_id": game_id,
        "character_id": character_id,
        "source_url": source_url,
        "tables": tables,
        "scraped_at": dt.datetime.utcnow(),
    }

    try:
        collection.update_one(
            {"game_id": game_id, "character_id": character_id},
            {"$set": document},
            upsert=True,
        )
    except PyMongoError as exc:
        raise FrameDataScraperError(f"Failed to upsert frame data: {exc}") from exc


def scrape_character(
    collection: Collection,
    *,
    game_id: str,
    character: str,
    base_url_template: str,
) -> None:
    character_slug = slugify_character(character)
    url = base_url_template.format(character_slug=character_slug)

    LOGGER.info("Scraping %s (%s) from %s", character, game_id, url)
    response = fetch_character_page(url)
    tables = parse_frame_data(response.text)
    upsert_frame_data(
        collection,
        game_id=game_id,
        character_id=character_slug.lower(),
        source_url=url,
        tables=tables,
    )
    LOGGER.info("Stored frame data for %s (%s)", character, game_id)


def parse_arguments(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape fighting game frame data into MongoDB.")
    parser.add_argument(
        "--game",
        default=DEFAULT_GAME_ID,
        help="Game identifier (default: sf6)",
    )
    parser.add_argument(
        "--characters",
        nargs="+",
        default=None,
        help="Character names to scrape (default: game roster)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Scrape the entire roster for the selected game",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("FRAME_DATA_BASE_URL", DEFAULT_BASE_URL),
        help="Template URL for character pages (use {character_slug} placeholder).",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_arguments(argv)
    try:
        collection = get_mongo_collection()
        roster = GAME_ROSTERS.get(args.game.lower())

        characters: List[str] = []
        if args.all:
            if not roster:
                raise FrameDataScraperError(
                    f"No roster defined for game '{args.game}'. Provide --characters explicitly."
                )
            characters.extend(roster)

        if args.characters:
            characters.extend(args.characters)

        if not characters:
            if roster:
                characters = roster
            else:
                raise FrameDataScraperError(
                    "No characters specified and no default roster available for this game."
                )

        # Preserve order while removing duplicates
        seen = set()
        ordered_characters = []
        for char in characters:
            if char not in seen:
                ordered_characters.append(char)
                seen.add(char)

        for character in ordered_characters:
            scrape_character(
                collection,
                game_id=args.game,
                character=character,
                base_url_template=args.base_url,
            )
    except FrameDataScraperError as exc:
        LOGGER.error("Frame data scraping failed: %s", exc)
        return 1
    except Exception as exc:  # pragma: no cover - safety net
        LOGGER.exception("Unexpected error during scraping: %s", exc)
        return 1

    LOGGER.info("Completed frame data scraping job.")
    return 0


if __name__ == "__main__":
    sys.exit(main())