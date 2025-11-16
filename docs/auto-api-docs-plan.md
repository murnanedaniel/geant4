# Auto API Documentation Generation Plan

## Overview

This document outlines a comprehensive strategy for automatically generating API documentation for Geant4's C++ codebase, supplementing the manually written high-level documentation.

## Goals

1. **Reduce manual documentation effort** for the 500+ classes across 23 source modules
2. **Maintain consistency** in API reference formatting
3. **Keep documentation in sync** with code changes
4. **Preserve human insight** by combining auto-generated structure with manual enhancements

## Proposed Solution: Hybrid Approach

### Architecture

```
C++ Source Files (*.hh, *.cc)
        ↓
    Doxygen Parser
        ↓
    XML Output
        ↓
Custom Python/Node.js Converter
        ↓
  Markdown Files
        ↓
Manual Enhancement Layer
        ↓
  VitePress Site
```

## Phase 1: Doxygen Integration

### Why Doxygen?

- **Industry standard** for C++ API documentation
- **Robust C++ parsing** handles complex templates, macros, inheritance
- **XML output** is machine-parseable for custom processing
- **Already used** in many C++ scientific computing projects
- **Extracts** comments, signatures, relationships automatically

### Setup

```bash
# Install Doxygen
sudo apt-get install doxygen graphviz

# Create Doxyfile configuration
cd /path/to/geant4
doxygen -g docs/Doxyfile
```

### Configuration (Doxyfile)

```doxyfile
# Project settings
PROJECT_NAME           = "Geant4"
PROJECT_NUMBER         = "11.4.0"
PROJECT_BRIEF          = "Particle simulation toolkit"

# Input settings
INPUT                  = source/
FILE_PATTERNS          = *.hh *.h *.cc
RECURSIVE              = YES
EXCLUDE_PATTERNS       = */test/* */examples/*

# Output settings
GENERATE_HTML          = NO
GENERATE_LATEX         = NO
GENERATE_XML           = YES
XML_OUTPUT             = docs/doxygen-xml

# Extraction settings
EXTRACT_ALL            = YES
EXTRACT_PRIVATE        = NO
EXTRACT_STATIC         = YES
EXTRACT_LOCAL_CLASSES  = NO

# Parsing settings
ENABLE_PREPROCESSING   = YES
MACRO_EXPANSION        = YES
EXPAND_ONLY_PREDEF     = NO
```

### Execution

```bash
# Generate XML from C++ headers
doxygen docs/Doxyfile

# Output: docs/doxygen-xml/ directory with XML files
```

## Phase 2: XML to Markdown Conversion

### Custom Converter Tool

Create a Node.js/Python script to convert Doxygen XML to VitePress-compatible Markdown.

**Technology Stack Options:**

#### Option A: Node.js
```javascript
// packages: xml2js, fs, path
// Advantages: Same ecosystem as VitePress, easier integration
```

#### Option B: Python
```python
# packages: lxml, jinja2, markdown
# Advantages: Better XML parsing, mature templating
```

**Recommended: Python** for robust XML processing

### Converter Features

```python
# doxygen_to_markdown.py

import xml.etree.ElementTree as ET
from pathlib import Path
import jinja2

class DoxygenConverter:
    def __init__(self, xml_dir, output_dir, template_dir):
        self.xml_dir = Path(xml_dir)
        self.output_dir = Path(output_dir)
        self.templates = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir)
        )

    def convert_class(self, xml_file):
        """Convert a single class XML to Markdown"""
        tree = ET.parse(xml_file)
        root = tree.getroot()

        # Extract metadata
        class_data = {
            'name': root.find('.//compoundname').text,
            'brief': self.extract_brief(root),
            'detailed': self.extract_detailed(root),
            'location': self.extract_location(root),
            'members': self.extract_members(root),
            'inheritance': self.extract_inheritance(root),
            'methods': self.extract_methods(root),
        }

        # Render template
        template = self.templates.get_template('class.md.j2')
        markdown = template.render(**class_data)

        # Write output
        output_file = self.output_dir / f"{class_data['name'].lower()}.md"
        output_file.write_text(markdown)

        return class_data

    def extract_methods(self, root):
        """Extract all public methods with signatures"""
        methods = []
        for member in root.findall('.//memberdef[@kind="function"][@prot="public"]'):
            methods.append({
                'name': member.find('name').text,
                'type': member.find('type').text,
                'brief': member.find('briefdescription'),
                'detailed': member.find('detaileddescription'),
                'params': self.extract_params(member),
                'return': self.extract_return(member),
                'location': f"{member.find('location').get('file')}:{member.find('location').get('line')}"
            })
        return methods
```

### Jinja2 Template (class.md.j2)

```jinja2
# {{ "{{" }} name {{ "}}" }}

**File**: `{{ "{{" }} location.file {{ "}}" }}`

## Overview

{{ "{{" }} brief {{ "}}" }}

{{ "{{" }} detailed {{ "}}" }}

## Class Hierarchy

{{ "{%" }} if inheritance.bases {{ "%}" }}
**Inherits from**:
{{ "{%" }} for base in inheritance.bases {{ "%}" }}
- [{{ "{{" }} base.name {{ "}}" }}](./{{ "{{" }} base.name|lower {{ "}}" }}.md)
{{ "{%" }} endfor {{ "%}" }}
{{ "{%" }} endif {{ "%}" }}

{{ "{%" }} if inheritance.derived {{ "%}" }}
**Derived classes**:
{{ "{%" }} for derived in inheritance.derived {{ "%}" }}
- [{{ "{{" }} derived.name {{ "}}" }}](./{{ "{{" }} derived.name|lower {{ "}}" }}.md)
{{ "{%" }} endfor {{ "%}" }}
{{ "{%" }} endif {{ "%}" }}

## Public Methods

{{ "{%" }} for method in methods {{ "%}" }}
### {{ "{{" }} method.name {{ "}}" }}

(C++ signature would be here)

{{ "{{" }} method.brief {{ "}}" }}

{{ "{%" }} if method.params {{ "%}" }}
**Parameters**:
{{ "{%" }} for param in method.params {{ "%}" }}
- `{{ "{{" }} param.name {{ "}}" }}` ({{ "{{" }} param.type {{ "}}" }}): {{ "{{" }} param.description {{ "}}" }}
{{ "{%" }} endfor {{ "%}" }}
{{ "{%" }} endif {{ "%}" }}

{{ "{%" }} if method.return {{ "%}" }}
**Returns**: {{ "{{" }} method.return {{ "}}" }}
{{ "{%" }} endif {{ "%}" }}

**Location**: {{ "{{" }} method.location {{ "}}" }}

---
{{ "{%" }} endfor {{ "%}" }}

## See Also

{{ "{%" }} for related in related_classes {{ "%}" }}
- [{{ "{{" }} related {{ "}}" }}](./{{ "{{" }} related|lower {{ "}}" }}.md)
{{ "{%" }} endfor {{ "%}" }}
```

## Phase 3: Manual Enhancement Layer

### Workflow

1. **Auto-generate** base documentation from Doxygen XML
2. **Manual review** adds:
   - Usage examples
   - Physics context
   - Best practices
   - Common pitfalls
   - Performance notes
3. **Protect manual content** with special markers:

```markdown
<!-- AUTO-GENERATED: START -->
... auto-generated content ...
<!-- AUTO-GENERATED: END -->

<!-- MANUAL-CONTENT: START -->
## Usage Example

```cpp
// Human-written example code
auto* runManager = new G4RunManager();
runManager->Initialize();
```
<!-- MANUAL-CONTENT: END -->
```

### Regeneration Script

```bash
#!/bin/bash
# regenerate-docs.sh

# Run Doxygen
doxygen docs/Doxyfile

# Convert to Markdown (preserves MANUAL-CONTENT sections)
python docs/scripts/doxygen_to_markdown.py \
    --xml-dir docs/doxygen-xml \
    --output-dir docs/modules \
    --templates docs/templates \
    --preserve-manual

# Report statistics
echo "Updated $(find docs/modules -name '*.md' -mmin -5 | wc -l) files"
```

## Phase 4: CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/update-api-docs.yml
name: Update API Documentation

on:
  push:
    branches: [main, master]
    paths:
      - 'source/**/*.hh'
      - 'source/**/*.cc'
  workflow_dispatch:

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Doxygen
        run: sudo apt-get install -y doxygen graphviz

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Python dependencies
        run: |
          pip install lxml jinja2 click pyyaml

      - name: Generate Doxygen XML
        run: doxygen docs/Doxyfile

      - name: Convert to Markdown
        run: |
          python docs/scripts/doxygen_to_markdown.py \
            --xml-dir docs/doxygen-xml \
            --output-dir docs/modules \
            --templates docs/templates \
            --preserve-manual

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'docs: Auto-update API documentation from source changes'
          title: 'Auto-update API Documentation'
          body: |
            Automated API documentation update triggered by source code changes.

            **Changes detected in**: ${{ github.event.head_commit.message }}

            Please review auto-generated content before merging.
          branch: auto-docs-update
          labels: documentation, automated
```

## Phase 5: Advanced Features

### 1. Cross-Reference Resolution

```python
def resolve_type_links(type_string, known_classes):
    """Convert type names to markdown links"""
    for class_name in known_classes:
        if class_name in type_string:
            link = f"[{class_name}](./{class_name.lower()}.md)"
            type_string = type_string.replace(class_name, link)
    return type_string
```

### 2. Inheritance Diagrams

```python
def generate_inheritance_mermaid(class_data):
    """Generate Mermaid diagram for class hierarchy"""
    return f"""
```mermaid
classDiagram
    {' '.join([f'{base} <|-- {class_data["name"]}' for base in class_data['bases']])}
    {' '.join([f'{class_data["name"]} <|-- {derived}' for derived in class_data['derived']])}
```
"""
```

### 3. Method Categorization

```python
# Group methods by functionality
METHOD_CATEGORIES = {
    'Initialization': ['Initialize', 'Init', 'Setup', 'Construct'],
    'Accessors': ['Get', 'Set', 'Is', 'Has'],
    'Lifecycle': ['Create', 'Delete', 'Destroy', 'Clear'],
    'Operations': ['Process', 'Execute', 'Run', 'Compute'],
}

def categorize_methods(methods):
    categorized = {cat: [] for cat in METHOD_CATEGORIES}
    categorized['Other'] = []

    for method in methods:
        matched = False
        for category, keywords in METHOD_CATEGORIES.items():
            if any(kw in method['name'] for kw in keywords):
                categorized[category].append(method)
                matched = True
                break
        if not matched:
            categorized['Other'].append(method)

    return {k: v for k, v in categorized.items() if v}  # Remove empty categories
```

## Implementation Timeline

### Week 1: Setup
- [ ] Install and configure Doxygen
- [ ] Generate initial XML output
- [ ] Verify XML structure and completeness

### Week 2: Converter Development
- [ ] Develop basic XML parser
- [ ] Create Jinja2 templates
- [ ] Test on 2-3 sample classes

### Week 3: Enhancement
- [ ] Add cross-reference resolution
- [ ] Implement method categorization
- [ ] Create inheritance diagrams
- [ ] Add template customization options

### Week 4: Integration
- [ ] Integrate with existing manual docs
- [ ] Set up manual content preservation
- [ ] Create regeneration scripts
- [ ] Document the workflow

### Week 5: CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Test automated PR creation
- [ ] Set up review process

### Week 6: Rollout
- [ ] Generate docs for all modules
- [ ] Review and enhance critical classes
- [ ] Update contribution guidelines
- [ ] Train team on workflow

## Benefits

1. **Consistency**: All 500+ classes documented uniformly
2. **Accuracy**: Auto-sync with code changes reduces drift
3. **Efficiency**: 80% of boilerplate generated automatically
4. **Quality**: Humans focus on examples and context, not structure
5. **Scalability**: Handles future class additions automatically
6. **Discoverability**: Complete API surface documented

## Limitations & Mitigations

| Limitation | Mitigation |
|------------|-----------|
| No semantic understanding | Manual enhancement for context |
| Comments may be incomplete | Require comment standards in contribution guide |
| Template/macro complexity | Careful Doxygen configuration |
| Initial setup time | Phased rollout, start with key modules |
| Maintenance overhead | Automated CI/CD workflow |

## Alternative Approaches Considered

### 1. Clang LibTooling
**Pros**: Direct AST access, no comment parsing
**Cons**: Complex setup, C++-only, harder to customize

### 2. Manual-only Documentation
**Pros**: Full control, rich context
**Cons**: Unsustainable for 500+ classes, drift from code

### 3. Sphinx + Breathe
**Pros**: Python ecosystem, good Doxygen integration
**Cons**: RST format, harder VitePress integration, heavier tooling

### 4. TypeDoc-style (JSDoc for C++)
**Pros**: Inline documentation
**Cons**: No mature C++ tooling exists

## Recommendation

**Proceed with Doxygen + Custom Converter** approach:
- Proven technology (Doxygen)
- Flexible output (custom Markdown)
- Preserves manual enhancements
- Integrates with existing VitePress workflow
- CI/CD friendly

## Next Steps

1. ✅ Create this plan document
2. ⏳ Set up Doxygen locally and generate test XML
3. ⏳ Build MVP converter for one module (materials or run)
4. ⏳ Compare auto-generated vs. manual documentation quality
5. ⏳ Refine templates and categorization
6. ⏳ Implement preservation of manual content
7. ⏳ Roll out to additional modules
8. ⏳ Set up CI/CD automation

## References

- [Doxygen Manual](https://www.doxygen.nl/manual/)
- [Breathe Documentation](https://breathe.readthedocs.io/)
- [VitePress Guide](https://vitepress.dev/)
- [Jinja2 Documentation](https://jinja.palletsprojects.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
