# BabyStore

## Image folders

- Put original images into `images/products/source/`
- Small images are created in `images/products/thumbs/`
- Large optimized images are created in `images/products/full/`

## Run resize script

- You can right-click resize_images.ps1 and choose Run with PowerShell.

Or run it manually:

- Open PowerShell in the project folder:

```powershell
cd C:\Projects\BabyStore
```

```powershell
powershell -ExecutionPolicy Bypass -File .\resize_images.ps1
```

## How to add a product

- Add a new item to `products.js`

## Example

```javascript
{
    id: 9,
    price: 90,
    category: "toys",
    image: "images/products/thumbs/toy9.jpg",
    fullImage: "images/products/full/toy9.jpg"
}
```

## Put original image here

```text
images/products/source/toy9.jpg
```

## Run
You can right-click resize_images.ps1 and choose Run with PowerShell.

Or run it manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\resize_images.ps1
```

## Check that these files were created

```text
images/products/thumbs/toy9.jpg
images/products/full/toy9.jpg
```

## Rules

- `id` must be unique
- `category` must be `toys`, `clothes`, or `accessories`
- file names must match exactly
- put original files into `source`
- use `thumbs` for card image
- use `full` for popup image
```