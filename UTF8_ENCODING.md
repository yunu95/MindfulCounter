# UTF-8 Encoding Standards for MindfulCounter

## Overview

This project uses **UTF-8 encoding (without BOM)** for all text files. UTF-8 is the universal standard for handling international characters and special symbols (including Sanskrit diacritics used in the counter names).

## Why UTF-8?

- **Universal Compatibility**: Works across all browsers, editors, and systems
- **Special Characters**: Properly encodes Sanskrit text, emojis, and international characters
- **No BOM Issues**: UTF-8 without BOM prevents parsing issues in web browsers
- **JavaScript Native**: JavaScript/Node.js defaults to UTF-8

## Files Covered

All source files in this project are UTF-8 encoded:
- `*.js` - JavaScript files
- `*.json` - Manifest and configuration files
- `*.html` - HTML templates
- `*.css` - Stylesheets
- `*.md` - Documentation

## Enforcing UTF-8

### VS Code Configuration

The `.vscode/settings.json` file includes:
```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false
}
```

This ensures all new files are created as UTF-8.

### EditorConfig

The `.editorconfig` file enforces UTF-8 across different editors:
```ini
[*]
charset = utf-8
```

### When Adding New Files

1. **Always** create new files with UTF-8 encoding
2. If opening an existing file with encoding issues, use VS Code's "Reopen with Encoding" and select UTF-8
3. Files converted from other encodings may show `?` characters?these need to be re-entered with correct UTF-8 characters

## Handling Special Characters

### Sanskrit Counter Names Example

Correct UTF-8 representation:
```javascript
'mana (???)': 0
'dvesa (?????)': 0
'tanha (?????)': 0
'viksepa (???????)': 0
'bhaya (??)': 0
'prapanca (???????)': 0
```

If characters appear as `?` or garbled text:
1. The file may have been created in a different encoding
2. Use the conversion script: `convert-to-utf8.ps1` (or see "Converting Files" below)
3. Re-enter the text in VS Code with UTF-8 encoding active

## Converting Files to UTF-8

### PowerShell Script

```powershell
Get-ChildItem -Path "." -Recurse -File | Where-Object {$_.Extension -match '\.(js|json|html|css|md)$'} | ForEach-Object {
  $content = Get-Content -Path $_.FullName -Raw
  Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline
  Write-Host "Converted: $($_.Name)"
}
```

### Manual Conversion (VS Code)

1. Open file in VS Code
2. Click encoding indicator in bottom-right (shows current encoding)
3. Select "Reopen with Encoding..."
4. Choose the original encoding
5. Once loaded, save with UTF-8: Click encoding, select "Save with Encoding..." ¡æ UTF-8

## Troubleshooting

### Garbled Text in Console Output

Some terminals may not display Unicode correctly. This is a terminal issue, not a file encoding issue. The data is still correctly UTF-8 encoded.

### Browser Display Issues

If special characters don't display in the extension:
1. Verify `<meta charset="utf-8">` is in HTML files
2. Confirm CSS files don't have conflicting encoding declarations
3. Check Chrome DevTools ¡æ Elements ¡æ Document encoding

### Git Encoding Issues

Ensure `.gitattributes` doesn't override UTF-8:
```
* text=auto
*.js text eol=lf
*.json text eol=lf
```

## References

- [UTF-8 on Wikipedia](https://en.wikipedia.org/wiki/UTF-8)
- [MDN: Character encodings](https://developer.mozilla.org/en-US/docs/Glossary/character_encoding)
- [VS Code Encoding Settings](https://code.visualstudio.com/docs/editor/codebasics#_file-encoding)
