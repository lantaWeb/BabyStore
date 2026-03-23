from pathlib import Path
from PIL import Image, ImageOps

SOURCE_DIR = Path("images/products/source")
FULL_DIR = Path("images/products/full")
THUMBS_DIR = Path("images/products/thumbs")

THUMB_SIZE = (400, 400)
FULL_MAX_SIZE = (1400, 1400)

THUMB_QUALITY = 72
FULL_QUALITY = 82

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

FULL_DIR.mkdir(parents=True, exist_ok=True)
THUMBS_DIR.mkdir(parents=True, exist_ok=True)

for file_path in SOURCE_DIR.iterdir():
    if not file_path.is_file() or file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        continue

    with Image.open(file_path) as img:
        img = img.convert("RGB")

        thumb = ImageOps.fit(img, THUMB_SIZE, Image.Resampling.LANCZOS)
        thumb_output = THUMBS_DIR / f"{file_path.stem}.jpg"
        thumb.save(thumb_output, "JPEG", quality=THUMB_QUALITY, optimize=True)

        full = img.copy()
        full.thumbnail(FULL_MAX_SIZE, Image.Resampling.LANCZOS)
        full_output = FULL_DIR / f"{file_path.stem}.jpg"
        full.save(full_output, "JPEG", quality=FULL_QUALITY, optimize=True)

print("Done")
