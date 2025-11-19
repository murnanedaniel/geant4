#!/usr/bin/env python3
"""
Documentation Link Checker
Validates all internal links in the Geant4 documentation
"""

import re
import os
from pathlib import Path
from collections import defaultdict

def find_markdown_files(docs_dir):
    """Find all markdown files in the docs directory"""
    md_files = []
    for root, dirs, files in os.walk(docs_dir):
        # Skip node_modules and .vitepress/dist
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', '.vitepress']]
        for file in files:
            if file.endswith('.md'):
                md_files.append(os.path.join(root, file))
    return md_files

def extract_links(file_path, docs_dir):
    """Extract all internal links from a markdown file"""
    links = []
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all markdown links [text](url)
    # Match both absolute (/...) and relative (../) links
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    matches = re.findall(pattern, content)

    for text, url in matches:
        # Skip external links
        if url.startswith('http://') or url.startswith('https://'):
            continue
        # Skip anchors only
        if url.startswith('#'):
            continue
        # Skip mailto links
        if url.startswith('mailto:'):
            continue

        links.append((text, url))

    return links

def resolve_link(source_file, link_url, docs_dir):
    """Resolve a link to an absolute file path"""
    # Remove anchor from URL
    url_parts = link_url.split('#')
    file_url = url_parts[0]
    anchor = url_parts[1] if len(url_parts) > 1 else None

    if not file_url:
        # Just an anchor reference, skip
        return None, anchor

    # Handle absolute links (starting with /)
    if file_url.startswith('/'):
        # Remove leading slash and resolve from docs root
        file_url = file_url.lstrip('/')
        target = os.path.join(docs_dir, file_url)
    else:
        # Relative link - resolve from source file directory
        source_dir = os.path.dirname(source_file)
        target = os.path.normpath(os.path.join(source_dir, file_url))

    # Add .md extension if not present and no extension
    if not os.path.splitext(target)[1]:
        target = target + '.md'

    return target, anchor

def check_file_exists(file_path):
    """Check if a file exists"""
    return os.path.exists(file_path) and os.path.isfile(file_path)

def main():
    docs_dir = '/home/user/geant4/docs'

    print("="*80)
    print("Documentation Link Checker")
    print("="*80)

    md_files = find_markdown_files(docs_dir)
    print(f"\nFound {len(md_files)} markdown files")

    broken_links = []
    total_links = 0

    for md_file in md_files:
        links = extract_links(md_file, docs_dir)

        for link_text, link_url in links:
            total_links += 1
            target_file, anchor = resolve_link(md_file, link_url, docs_dir)

            if target_file and not check_file_exists(target_file):
                rel_source = os.path.relpath(md_file, docs_dir)
                broken_links.append({
                    'source': rel_source,
                    'link_text': link_text,
                    'link_url': link_url,
                    'resolved': target_file
                })

    print(f"Total internal links checked: {total_links}")
    print(f"Broken links found: {len(broken_links)}")

    if broken_links:
        print("\n" + "="*80)
        print("BROKEN LINKS")
        print("="*80)

        # Group by source file
        by_source = defaultdict(list)
        for link in broken_links:
            by_source[link['source']].append(link)

        for source in sorted(by_source.keys()):
            print(f"\n{source}:")
            for link in by_source[source]:
                print(f"  ❌ [{link['link_text']}]({link['link_url']})")
                print(f"     Resolved to: {link['resolved']}")
    else:
        print("\n✅ All internal links are valid!")

    return len(broken_links)

if __name__ == '__main__':
    exit(main())
