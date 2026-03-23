from pathlib import Path
from PIL import Image, ImageOps

SOURCE_DIR = Path("images/products/full")
THUMBS_DIR = Path("images/products/thumbs")

THUMB_SIZE = (400, 400)
JPEG_QUALITY = 72

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

THUMBS_DIR.mkdir(parents=True, exist_ok=True)

for file_path in SOURCE_DIR.iterdir():
    if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        continue

    with Image.open(file_path) as img:
        img = img.convert("RGB")
        thumb = ImageOps.fit(img, THUMB_SIZE, Image.Resampling.LANCZOS)

        output_path = THUMBS_DIR / f"{file_path.stem}.jpg"
        thumb.save(output_path, "JPEG", quality=JPEG_QUALITY, optimize=True)

print("Done")
