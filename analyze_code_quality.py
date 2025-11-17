#!/usr/bin/env python3
"""
Geant4 Code Quality Analyzer

Deeper analysis of poorly-documented files to identify:
- Magic numbers
- Outdated code patterns
- Code complexity
- Last modified dates (if available in comments)
"""

import os
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import json

class CodeQualityAnalyzer:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.stats = {
            'magic_numbers': {
                'files_with_magic_numbers': 0,
                'total_magic_numbers': 0
            },
            'complexity': {
                'very_complex': 0,
                'complex': 0,
                'moderate': 0,
                'simple': 0
            },
            'age_indicators': {
                'very_old': 0,  # Pre-2010
                'old': 0,       # 2010-2015
                'recent': 0,    # 2016-2020
                'modern': 0     # 2021+
            },
            'code_smells': {
                'todo_comments': 0,
                'fixme_comments': 0,
                'hack_comments': 0,
                'deprecated': 0,
                'long_functions': 0,
                'deep_nesting': 0
            },
            'examples': defaultdict(list)
        }

        # Magic number pattern (numeric literals that aren't 0, 1, -1, 2, or simple powers)
        self.magic_number_pattern = re.compile(
            r'(?<![a-zA-Z0-9_])'  # Not preceded by alphanumeric
            r'(?:'
            r'(?:0x[0-9a-fA-F]+)|'  # Hex literals
            r'(?:\d{3,}(?:\.\d+)?)|'  # Numbers with 3+ digits
            r'(?:\d+\.\d{3,})'  # Decimals with 3+ decimal places
            r')'
            r'(?![a-zA-Z0-9_e])'  # Not followed by alphanumeric or 'e' (for scientific notation)
        )

        # Year patterns in comments
        self.year_pattern = re.compile(r'(?:19|20)\d{2}')

        # Code smell patterns
        self.todo_pattern = re.compile(r'//.*?TODO|/\*.*?TODO.*?\*/', re.IGNORECASE)
        self.fixme_pattern = re.compile(r'//.*?FIXME|/\*.*?FIXME.*?\*/', re.IGNORECASE)
        self.hack_pattern = re.compile(r'//.*?HACK|/\*.*?HACK.*?\*/', re.IGNORECASE)
        self.deprecated_pattern = re.compile(r'deprecated|obsolete', re.IGNORECASE)

    def analyze_file(self, filepath):
        """Analyze a single file for code quality indicators."""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            return None

        result = {
            'file': str(filepath),
            'issues': []
        }

        # Count magic numbers (exclude common constants and in comments)
        lines = content.split('\n')
        code_only = []
        for line in lines:
            # Remove comments
            line_code = re.sub(r'//.*$', '', line)
            line_code = re.sub(r'/\*.*?\*/', '', line_code)
            code_only.append(line_code)

        code_text = '\n'.join(code_only)
        magic_numbers = self.magic_number_pattern.findall(code_text)

        # Filter out common patterns
        filtered_magic = [m for m in magic_numbers if m not in ['100', '1000', '0x00', '0xff']]

        if len(filtered_magic) >= 5:  # File has significant magic numbers
            self.stats['magic_numbers']['files_with_magic_numbers'] += 1
            self.stats['magic_numbers']['total_magic_numbers'] += len(filtered_magic)
            result['issues'].append(f"Contains {len(filtered_magic)} magic numbers")

            if len(self.stats['examples']['magic_numbers']) < 5:
                self.stats['examples']['magic_numbers'].append({
                    'file': str(filepath.relative_to(self.root_dir)),
                    'count': len(filtered_magic),
                    'samples': filtered_magic[:5]
                })

        # Measure complexity (simple heuristic based on control structures)
        control_keywords = len(re.findall(r'\b(if|for|while|switch|case)\b', content))
        lines_of_code = len([l for l in lines if l.strip() and not l.strip().startswith('//')])

        complexity = control_keywords / max(lines_of_code / 100, 1)

        if complexity > 15:
            self.stats['complexity']['very_complex'] += 1
            result['issues'].append("Very complex (high cyclomatic complexity)")
        elif complexity > 10:
            self.stats['complexity']['complex'] += 1
            result['issues'].append("Complex code")
        elif complexity > 5:
            self.stats['complexity']['moderate'] += 1
        else:
            self.stats['complexity']['simple'] += 1

        # Check for age indicators in comments
        years = self.year_pattern.findall(content)
        if years:
            years_int = [int(y) for y in years]
            oldest_year = min(years_int)
            newest_year = max(years_int)

            if oldest_year < 2010:
                self.stats['age_indicators']['very_old'] += 1
                result['issues'].append(f"Contains references to {oldest_year} (likely old code)")
            elif oldest_year < 2016:
                self.stats['age_indicators']['old'] += 1
                result['issues'].append(f"References year {oldest_year}")
            elif oldest_year < 2021:
                self.stats['age_indicators']['recent'] += 1
            else:
                self.stats['age_indicators']['modern'] += 1

        # Check for code smells
        todos = len(self.todo_pattern.findall(content))
        if todos > 0:
            self.stats['code_smells']['todo_comments'] += todos
            result['issues'].append(f"Contains {todos} TODO comment(s)")

        fixmes = len(self.fixme_pattern.findall(content))
        if fixmes > 0:
            self.stats['code_smells']['fixme_comments'] += fixmes
            result['issues'].append(f"Contains {fixmes} FIXME comment(s)")

        hacks = len(self.hack_pattern.findall(content))
        if hacks > 0:
            self.stats['code_smells']['hack_comments'] += hacks
            result['issues'].append(f"Contains {hacks} HACK comment(s)")

        deprecated = len(self.deprecated_pattern.findall(content))
        if deprecated > 0:
            self.stats['code_smells']['deprecated'] += 1
            result['issues'].append("Contains deprecated/obsolete markers")

            if len(self.stats['examples']['deprecated']) < 5:
                self.stats['examples']['deprecated'].append({
                    'file': str(filepath.relative_to(self.root_dir))
                })

        # Check for long functions (more than 100 lines)
        function_pattern = re.compile(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', re.DOTALL)
        functions = function_pattern.findall(content)
        long_funcs = [f for f in functions if f.count('\n') > 100]
        if long_funcs:
            self.stats['code_smells']['long_functions'] += len(long_funcs)
            result['issues'].append(f"Contains {len(long_funcs)} very long function(s) (>100 lines)")

        # Check for deep nesting
        max_nesting = 0
        current_nesting = 0
        for char in content:
            if char == '{':
                current_nesting += 1
                max_nesting = max(max_nesting, current_nesting)
            elif char == '}':
                current_nesting -= 1

        if max_nesting > 6:
            self.stats['code_smells']['deep_nesting'] += 1
            result['issues'].append(f"Deep nesting detected (max depth: {max_nesting})")

            if len(self.stats['examples']['deep_nesting']) < 5:
                self.stats['examples']['deep_nesting'].append({
                    'file': str(filepath.relative_to(self.root_dir)),
                    'depth': max_nesting
                })

        return result

    def analyze_from_json(self, json_file):
        """Analyze files categorized as poorly documented."""
        with open(json_file, 'r') as f:
            data = json.load(f)

        poorly_doc_files = data['files_by_category']['poorly_documented']

        print(f"Analyzing {len(poorly_doc_files)} poorly documented files...")
        print()

        for i, file_info in enumerate(poorly_doc_files):
            if i % 1000 == 0:
                print(f"  Progress: {i}/{len(poorly_doc_files)}")

            filepath = Path(file_info['file'])
            if filepath.exists():
                self.analyze_file(filepath)

    def generate_report(self):
        """Generate detailed quality report."""
        print("=" * 80)
        print("GEANT4 CODE QUALITY DEEP DIVE")
        print("=" * 80)
        print()

        print("MAGIC NUMBERS")
        print("-" * 80)
        print(f"Files with magic numbers:    {self.stats['magic_numbers']['files_with_magic_numbers']:,}")
        print(f"Total magic numbers found:   {self.stats['magic_numbers']['total_magic_numbers']:,}")
        if self.stats['examples']['magic_numbers']:
            print("\nExamples:")
            for ex in self.stats['examples']['magic_numbers'][:3]:
                print(f"  {ex['file']}: {ex['count']} magic numbers")
                print(f"    Samples: {', '.join(ex['samples'][:5])}")
        print()

        print("CODE COMPLEXITY")
        print("-" * 80)
        total = sum(self.stats['complexity'].values())
        print(f"Very complex files:          {self.stats['complexity']['very_complex']:,} "
              f"({100*self.stats['complexity']['very_complex']/max(total,1):.1f}%)")
        print(f"Complex files:               {self.stats['complexity']['complex']:,} "
              f"({100*self.stats['complexity']['complex']/max(total,1):.1f}%)")
        print(f"Moderate complexity:         {self.stats['complexity']['moderate']:,} "
              f"({100*self.stats['complexity']['moderate']/max(total,1):.1f}%)")
        print(f"Simple files:                {self.stats['complexity']['simple']:,} "
              f"({100*self.stats['complexity']['simple']/max(total,1):.1f}%)")
        print()

        print("CODE AGE INDICATORS")
        print("-" * 80)
        total_age = sum(self.stats['age_indicators'].values())
        print(f"Very old (pre-2010):         {self.stats['age_indicators']['very_old']:,} "
              f"({100*self.stats['age_indicators']['very_old']/max(total_age,1):.1f}%)")
        print(f"Old (2010-2015):             {self.stats['age_indicators']['old']:,} "
              f"({100*self.stats['age_indicators']['old']/max(total_age,1):.1f}%)")
        print(f"Recent (2016-2020):          {self.stats['age_indicators']['recent']:,} "
              f"({100*self.stats['age_indicators']['recent']/max(total_age,1):.1f}%)")
        print(f"Modern (2021+):              {self.stats['age_indicators']['modern']:,} "
              f"({100*self.stats['age_indicators']['modern']/max(total_age,1):.1f}%)")
        print()

        print("CODE SMELLS")
        print("-" * 80)
        print(f"TODO comments:               {self.stats['code_smells']['todo_comments']:,}")
        print(f"FIXME comments:              {self.stats['code_smells']['fixme_comments']:,}")
        print(f"HACK comments:               {self.stats['code_smells']['hack_comments']:,}")
        print(f"Deprecated/obsolete:         {self.stats['code_smells']['deprecated']:,}")
        print(f"Very long functions:         {self.stats['code_smells']['long_functions']:,}")
        print(f"Deep nesting issues:         {self.stats['code_smells']['deep_nesting']:,}")

        if self.stats['examples']['deep_nesting']:
            print("\nDeep nesting examples:")
            for ex in self.stats['examples']['deep_nesting'][:3]:
                print(f"  {ex['file']}: depth {ex['depth']}")
        print()

        print("=" * 80)

if __name__ == '__main__':
    analyzer = CodeQualityAnalyzer('/home/user/geant4')

    print("Performing deep code quality analysis on poorly documented files...")
    print()

    analyzer.analyze_from_json('doc_analysis_results.json')
    analyzer.generate_report()

    with open('code_quality_results.json', 'w') as f:
        json.dump(analyzer.stats, f, indent=2, default=str)

    print("Detailed results saved to: code_quality_results.json")
