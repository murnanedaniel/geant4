#!/usr/bin/env python3
"""
Geant4 Documentation Coverage Analyzer

This script analyzes C++ source files to assess documentation quality.
It categorizes files into:
- Well-documented: Good coverage of classes/functions with detailed comments
- Partially documented: Some documentation but incomplete
- Poorly documented: Minimal or no documentation
"""

import os
import re
from pathlib import Path
from collections import defaultdict
import json

class DocAnalyzer:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.stats = {
            'total_files': 0,
            'total_classes': 0,
            'total_functions': 0,
            'documented_classes': 0,
            'documented_functions': 0,
            'files_by_category': {
                'well_documented': [],
                'partially_documented': [],
                'poorly_documented': []
            },
            'module_stats': defaultdict(lambda: {
                'files': 0,
                'classes': 0,
                'functions': 0,
                'doc_classes': 0,
                'doc_functions': 0,
                'well_doc': 0,
                'partial_doc': 0,
                'poor_doc': 0
            })
        }

        # Regex patterns
        self.class_pattern = re.compile(r'^\s*class\s+(\w+)', re.MULTILINE)
        self.function_pattern = re.compile(
            r'^\s*(?:virtual\s+)?(?:static\s+)?(?:inline\s+)?'
            r'(?:const\s+)?(?:\w+(?:\s*\*|\s+&|\s+))\s+'
            r'(\w+)\s*\([^)]*\)\s*(?:const)?(?:\s*override)?(?:\s*final)?;?',
            re.MULTILINE
        )
        # Doxygen-style comments
        self.doc_block_pattern = re.compile(
            r'/\*\*.*?\*/',
            re.DOTALL
        )
        # C++ style doc comments
        self.doc_line_pattern = re.compile(r'^\s*///.*$', re.MULTILINE)
        # Brief description pattern
        self.brief_pattern = re.compile(r'\\brief|@brief|///<')
        # Detailed patterns for quality assessment
        self.param_pattern = re.compile(r'\\param|@param')
        self.return_pattern = re.compile(r'\\return|@return')

    def analyze_file(self, filepath):
        """Analyze a single C++ file for documentation quality."""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            return None

        # Count classes and functions
        classes = self.class_pattern.findall(content)
        functions = self.function_pattern.findall(content)

        # Filter out common non-function matches
        functions = [f for f in functions if f not in ['if', 'while', 'for', 'switch', 'return']]

        # Find all documentation blocks
        doc_blocks = self.doc_block_pattern.findall(content)
        doc_lines = self.doc_line_pattern.findall(content)

        # Combine all documentation
        all_docs = '\n'.join(doc_blocks + doc_lines)

        # Count documented items (heuristic: doc block within 5 lines before class/function)
        lines = content.split('\n')
        documented_classes = 0
        documented_functions = 0

        # Find positions of documentation
        doc_positions = set()
        for i, line in enumerate(lines):
            if '/**' in line or '///' in line:
                # Mark next few lines as having documentation
                for j in range(i, min(i + 10, len(lines))):
                    doc_positions.add(j)

        # Check which classes/functions have documentation
        for match in self.class_pattern.finditer(content):
            line_num = content[:match.start()].count('\n')
            if line_num in doc_positions or (line_num - 1) in doc_positions or (line_num - 2) in doc_positions:
                documented_classes += 1

        for match in self.function_pattern.finditer(content):
            line_num = content[:match.start()].count('\n')
            if line_num in doc_positions or (line_num - 1) in doc_positions or (line_num - 2) in doc_positions:
                documented_functions += 1

        # Calculate documentation quality metrics
        total_items = len(classes) + len(functions)
        documented_items = documented_classes + documented_functions

        # Count quality indicators
        brief_count = len(self.brief_pattern.findall(all_docs))
        param_count = len(self.param_pattern.findall(all_docs))
        return_count = len(self.return_pattern.findall(all_docs))

        doc_chars = len(all_docs)
        code_chars = len(content)

        # Calculate documentation ratio
        doc_ratio = documented_items / total_items if total_items > 0 else 0

        # Quality assessment
        quality_score = 0
        if doc_ratio > 0.7:
            quality_score += 30
        elif doc_ratio > 0.4:
            quality_score += 15
        elif doc_ratio > 0.1:
            quality_score += 5

        # Bonus for detailed documentation
        if param_count > 0:
            quality_score += 20
        if return_count > 0:
            quality_score += 20
        if brief_count > 0:
            quality_score += 15

        # Bonus for reasonable doc/code ratio
        if code_chars > 0:
            doc_code_ratio = doc_chars / code_chars
            if doc_code_ratio > 0.1:
                quality_score += 15

        # Categorize
        if quality_score >= 60:
            category = 'well_documented'
        elif quality_score >= 25:
            category = 'partially_documented'
        else:
            category = 'poorly_documented'

        return {
            'file': str(filepath),
            'classes': len(classes),
            'functions': len(functions),
            'documented_classes': documented_classes,
            'documented_functions': documented_functions,
            'doc_blocks': len(doc_blocks),
            'doc_lines': len(doc_lines),
            'brief_count': brief_count,
            'param_count': param_count,
            'return_count': return_count,
            'doc_ratio': doc_ratio,
            'quality_score': quality_score,
            'category': category,
            'file_size': code_chars
        }

    def analyze_directory(self, directory, module_name='root'):
        """Recursively analyze all C++ files in a directory."""
        dir_path = self.root_dir / directory if directory else self.root_dir

        # Find all .hh and .cc files
        for ext in ['.hh', '.cc', '.h', '.hpp', '.cpp']:
            for filepath in dir_path.rglob(f'*{ext}'):
                # Skip external dependencies and examples
                if 'externals' in filepath.parts or 'examples' in filepath.parts:
                    continue

                result = self.analyze_file(filepath)
                if result:
                    self.stats['total_files'] += 1
                    self.stats['total_classes'] += result['classes']
                    self.stats['total_functions'] += result['functions']
                    self.stats['documented_classes'] += result['documented_classes']
                    self.stats['documented_functions'] += result['documented_functions']

                    category = result['category']
                    self.stats['files_by_category'][category].append(result)

                    # Module stats
                    if 'source' in filepath.parts:
                        idx = filepath.parts.index('source')
                        if len(filepath.parts) > idx + 1:
                            mod = filepath.parts[idx + 1]
                        else:
                            mod = 'other'
                    else:
                        mod = 'other'

                    ms = self.stats['module_stats'][mod]
                    ms['files'] += 1
                    ms['classes'] += result['classes']
                    ms['functions'] += result['functions']
                    ms['doc_classes'] += result['documented_classes']
                    ms['doc_functions'] += result['documented_functions']

                    if category == 'well_documented':
                        ms['well_doc'] += 1
                    elif category == 'partially_documented':
                        ms['partial_doc'] += 1
                    else:
                        ms['poor_doc'] += 1

    def generate_report(self):
        """Generate a comprehensive documentation report."""
        total = self.stats['total_files']
        well = len(self.stats['files_by_category']['well_documented'])
        partial = len(self.stats['files_by_category']['partially_documented'])
        poor = len(self.stats['files_by_category']['poorly_documented'])

        print("=" * 80)
        print("GEANT4 DOCUMENTATION COVERAGE ANALYSIS")
        print("=" * 80)
        print()

        print("OVERALL STATISTICS")
        print("-" * 80)
        print(f"Total files analyzed:        {total:,}")
        print(f"Total classes found:         {self.stats['total_classes']:,}")
        print(f"Total functions found:       {self.stats['total_functions']:,}")
        print(f"Documented classes:          {self.stats['documented_classes']:,} "
              f"({100*self.stats['documented_classes']/max(self.stats['total_classes'],1):.1f}%)")
        print(f"Documented functions:        {self.stats['documented_functions']:,} "
              f"({100*self.stats['documented_functions']/max(self.stats['total_functions'],1):.1f}%)")
        print()

        print("DOCUMENTATION QUALITY BREAKDOWN")
        print("-" * 80)
        print(f"Well-documented files:       {well:,} ({100*well/max(total,1):.1f}%)")
        print(f"  - Comprehensive documentation with details")
        print()
        print(f"Partially documented files:  {partial:,} ({100*partial/max(total,1):.1f}%)")
        print(f"  - Some documentation but incomplete or vague")
        print()
        print(f"Poorly documented files:     {poor:,} ({100*poor/max(total,1):.1f}%)")
        print(f"  - Minimal or no documentation")
        print()

        print("MODULE-LEVEL BREAKDOWN")
        print("-" * 80)
        print(f"{'Module':<25} {'Files':<8} {'Well':<8} {'Partial':<8} {'Poor':<8} {'Doc %':<8}")
        print("-" * 80)

        # Sort modules by file count
        sorted_modules = sorted(self.stats['module_stats'].items(),
                               key=lambda x: x[1]['files'], reverse=True)

        for module, stats in sorted_modules:
            if stats['files'] == 0:
                continue
            total_items = stats['classes'] + stats['functions']
            doc_items = stats['doc_classes'] + stats['doc_functions']
            doc_pct = 100 * doc_items / max(total_items, 1)

            print(f"{module:<25} {stats['files']:<8} {stats['well_doc']:<8} "
                  f"{stats['partial_doc']:<8} {stats['poor_doc']:<8} {doc_pct:<7.1f}%")

        print()
        print("=" * 80)

        return {
            'summary': {
                'well_documented_pct': 100 * well / max(total, 1),
                'partially_documented_pct': 100 * partial / max(total, 1),
                'poorly_documented_pct': 100 * poor / max(total, 1),
                'class_documentation_pct': 100 * self.stats['documented_classes'] / max(self.stats['total_classes'], 1),
                'function_documentation_pct': 100 * self.stats['documented_functions'] / max(self.stats['total_functions'], 1)
            }
        }

if __name__ == '__main__':
    analyzer = DocAnalyzer('/home/user/geant4')
    print("Analyzing Geant4 source code documentation...")
    print("This may take a few minutes...")
    print()

    analyzer.analyze_directory('source')
    report = analyzer.generate_report()

    # Save detailed results to JSON
    with open('doc_analysis_results.json', 'w') as f:
        json.dump(analyzer.stats, f, indent=2, default=str)

    print("\nDetailed results saved to: doc_analysis_results.json")
