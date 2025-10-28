# Business Logo for Receipts

## How to Add Your Business Logo

To use your business logo in the receipts, follow these steps:

### Option 1: Business Logo (Recommended)
1. Save your business logo as `business-logo.png` in this directory (`assets/`)
2. Recommended size: 512x512 pixels
3. Format: PNG with transparent background
4. The receipt will automatically use this logo

### Option 2: Generic Logo
1. Save your logo as `logo.png` in this directory (`assets/`)
2. This will be used if `business-logo.png` is not found

### Option 3: App Icon (Fallback)
The system will fall back to `icon.png` if neither business logo is found.

## Logo Priority

The receipt system looks for logos in this order:
1. **`business-logo.png`** ← Use this for your business logo
2. **`logo.png`** ← Alternative option
3. **`icon.png`** ← Default fallback (app icon)

## Logo Requirements

- **Format**: PNG (preferred) or JPG
- **Recommended Size**: 512x512 pixels
- **Aspect Ratio**: Square (1:1) works best
- **Background**: Transparent recommended for PNG
- **File Size**: Keep under 500KB for best performance

## How to Replace the Logo

### Linux/Mac:
```bash
# Copy your logo to the assets folder
cp /path/to/your/logo.png assets/business-logo.png

# Or use logo.png
cp /path/to/your/logo.png assets/logo.png
```

### Example File Structure:
```
assets/
  ├── business-logo.png  ← Your business logo (highest priority)
  ├── logo.png           ← Alternative logo
  ├── icon.png           ← App icon (fallback)
  └── README-LOGO.md     ← This file
```

## Testing Your Logo

After adding your logo:
1. Restart the application
2. Go to Payments page
3. Download any receipt
4. Check the PDF to see your logo at the top

The console will show which logo file is being used:
```
Using logo: /path/to/assets/business-logo.png
```

## Tips

- Use a high-quality logo for professional appearance
- Square logos work best in the receipt header
- Transparent backgrounds look more professional
- Test the receipt after adding the logo

---

**Need help?** Check the console logs when generating a receipt to see which logo file is being loaded.
