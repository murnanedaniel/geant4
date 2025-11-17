# Documentation Guidelines for Geant4 Documentation

This file contains important guidelines to prevent common errors when writing documentation for this project.

## VitePress/Vue HTML Parsing Issues

### Problem: Template Parameters in Markdown

VitePress uses Vue for rendering, which parses angle brackets (`<>`) as HTML tags even inside backticks in regular markdown text. This causes build errors like:

```
Element is missing end tag
```

###Solution: Escape Template Parameters

When writing C++ template types outside of code fences (```) in regular markdown text:

**❌ WRONG:**
```markdown
**Base Classes:** `std::vector<G4double>`
This class extends `std::vector<G4double>` with additional methods.
```

**✅ CORRECT:**
```markdown
**Base Classes:** `std::vector&lt;G4double&gt;`
This class extends `std::vector&lt;G4double&gt;` with additional methods.
```

**Inside code fences, NO escaping needed:**
```markdown
\`\`\`cpp
std::vector<G4double> vec;  // This is fine!
G4ParticleTable* GetTable<Type>();  // This is also fine!
\`\`\`
```

### Quick Rule

- **Inside** triple-backtick code blocks (```): Use `<` and `>` normally
- **Outside** code blocks (inline code with single backticks): Use `&lt;` and `&gt;`

## File Naming Conventions

### Problem: Case-Sensitive Duplicates

Having both `G4Allocator.md` and `g4allocator.md` causes build errors because VitePress gets confused about which file to load.

### Solution: Use Lowercase Filenames

**Always use lowercase for documentation filenames:**

**❌ WRONG:**
```
docs/modules/global/api/G4Allocator.md
docs/modules/global/api/G4UnitsTable.md
```

**✅ CORRECT:**
```
docs/modules/global/api/g4allocator.md
docs/modules/global/api/g4unitstable.md
```

### Navigation Config

In `.vitepress/config.js`, always reference files with lowercase paths:

```javascript
{ text: 'G4Allocator', link: '/modules/global/api/g4allocator' }  // ✅ Correct
{ text: 'G4Allocator', link: '/modules/global/api/G4Allocator' }  // ❌ Wrong
```

## Merge Conflict Resolution

### Problem: Leftover Conflict Markers

Merge conflict markers left in code cause build failures:

```
<<<<<<< HEAD
some code
=======
other code
>>>>>>> origin/master
```

### Solution: Always Clean Up Merge Markers

1. After resolving conflicts, search for conflict markers:
   ```bash
   grep -r "^<<<<<<< \|^=======\|^>>>>>>>" docs/
   ```

2. Remove ALL markers before committing
3. Test build before pushing

## Build Memory Issues

### Problem: JavaScript Heap Out of Memory

Large documentation sets (>150,000 lines) can exceed Node.js default heap limits.

### Solution: Increase Node Heap Size

Always build with increased memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run docs:build
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "docs:build": "NODE_OPTIONS='--max-old-space-size=4096' vitepress build"
  }
}
```

## Checklist Before Committing Documentation

- [ ] All template parameters in inline code use `&lt;` and `&gt;`
- [ ] No uppercase filenames in `docs/modules/*/api/`
- [ ] All links in `.vitepress/config.js` use lowercase paths
- [ ] No merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] Build succeeds with `NODE_OPTIONS="--max-old-space-size=4096" npm run docs:build`
- [ ] No duplicate sections in `.vitepress/config.js`

## Testing

Before pushing documentation changes:

```bash
# Install dependencies
npm install

# Build with increased memory
NODE_OPTIONS="--max-old-space-size=4096" npm run docs:build

# Check for errors
echo $?  # Should be 0
```

## Common Errors Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Element is missing end tag` | Template parameters not escaped | Use `&lt;` and `&gt;` |
| `Cannot find module` | Case mismatch or duplicate files | Use lowercase filenames |
| `Heap out of memory` | Large documentation set | Increase Node heap size |
| `Unexpected ">>>"` | Merge conflict marker | Remove all conflict markers |
