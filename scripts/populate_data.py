# Copyright (C) 2026 Oleh Prypin

import csv
import datetime
import gzip
import io
import json
import os
import pathlib
import re
import sys
import time
import urllib.request

wanted_color_ids = [71, 135, 7, 80, 179, 1000, 72, 15, 0, 8, 28, 323, 378, 118, 31, 212]
wanted_colors_map = {color: i for i, color in enumerate(wanted_color_ids)}

with open('src/related-parts-data.ts', encoding='utf-8') as f:
    all_words = set(re.findall(r"(?<![ (\[#'])\b[0-9]\w+\b", f.read()))


def ensure_download(name: str) -> pathlib.Path:
    tmp_path = pathlib.Path(f'.{name}.csv.gz.part')
    dest_path = pathlib.Path(f'.{name}.csv.gz')

    if dest_path.is_file():
        mtime = datetime.datetime.fromtimestamp(dest_path.stat().st_mtime, tz=datetime.timezone.utc)
        if datetime.datetime.now(datetime.timezone.utc) - mtime < datetime.timedelta(days=1):
            return dest_path

    url = f'https://cdn.rebrickable.com/media/downloads/{name}.csv.gz'
    print(f'Downloading {url}', file=sys.stderr)
    urllib.request.urlretrieve(f'{url}?{time.time()}', tmp_path)
    tmp_path.rename(dest_path)
    return dest_path


part_urls: dict[str, tuple[int, str]] = {}
with ensure_download('inventory_parts').open('rb') as compressed:
    with gzip.GzipFile(fileobj=compressed) as uncompressed:
        for row in csv.DictReader(io.TextIOWrapper(uncompressed, encoding='utf-8')):
            part_num = row['part_num']
            img_url = row['img_url']
            color_id = int(row['color_id'])
            if part_num not in all_words:
                continue
            img_url_suffix = img_url.removeprefix('https://cdn.rebrickable.com/media/parts/')
            if img_url_suffix == img_url:
                continue
            wanted_colors_index = wanted_colors_map.get(color_id, 100000 + color_id)
            existing = part_urls.get(part_num)
            if existing is None or wanted_colors_index < existing[0]:
                part_urls[part_num] = (wanted_colors_index, img_url_suffix)

output = {part_num: img_url for part_num, (_, img_url) in part_urls.items()}

os.makedirs('dist', exist_ok=True)
with open('dist/parts-images.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=1, sort_keys=True)
