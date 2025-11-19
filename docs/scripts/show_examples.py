#!/usr/bin/env python3
"""Show concrete examples from each documentation category."""

import json
from pathlib import Path

def show_examples():
    with open('doc_analysis_results.json', 'r') as f:
        data = json.load(f)

    print("=" * 80)
    print("CONCRETE EXAMPLES FROM EACH CATEGORY")
    print("=" * 80)
    print()

    # Well-documented examples
    well_doc = sorted(data['files_by_category']['well_documented'],
                     key=lambda x: x['quality_score'], reverse=True)[:5]

    print("1. WELL-DOCUMENTED FILES (Top 5 by quality score)")
    print("-" * 80)
    for i, f in enumerate(well_doc, 1):
        rel_path = Path(f['file']).relative_to('/home/user/geant4')
        print(f"{i}. {rel_path}")
        print(f"   Quality Score: {f['quality_score']}")
        print(f"   Classes: {f['classes']} (documented: {f['documented_classes']})")
        print(f"   Functions: {f['functions']} (documented: {f['documented_functions']})")
        print(f"   Doc blocks: {f['doc_blocks']}, Params: {f['param_count']}, Returns: {f['return_count']}")
        print()

    # Partially documented examples
    partial_doc = sorted(data['files_by_category']['partially_documented'],
                        key=lambda x: x['quality_score'], reverse=True)[:5]

    print("2. PARTIALLY DOCUMENTED FILES (Top 5)")
    print("-" * 80)
    for i, f in enumerate(partial_doc, 1):
        rel_path = Path(f['file']).relative_to('/home/user/geant4')
        print(f"{i}. {rel_path}")
        print(f"   Quality Score: {f['quality_score']}")
        print(f"   Classes: {f['classes']} (documented: {f['documented_classes']})")
        print(f"   Functions: {f['functions']} (documented: {f['documented_functions']})")
        print(f"   Doc blocks: {f['doc_blocks']}")
        print()

    # Poorly documented examples with different issues
    poor_doc = data['files_by_category']['poorly_documented']

    # Find examples with different characteristics
    print("3. POORLY DOCUMENTED FILES (Examples by issue type)")
    print("-" * 80)

    # Large files with no docs
    large_no_docs = [f for f in poor_doc if f['classes'] + f['functions'] > 20 and f['doc_blocks'] == 0]
    if large_no_docs:
        f = large_no_docs[0]
        rel_path = Path(f['file']).relative_to('/home/user/geant4')
        print(f"Large file with zero documentation:")
        print(f"  {rel_path}")
        print(f"  Classes: {f['classes']}, Functions: {f['functions']}, Doc blocks: 0")
        print()

    # Files with some code but minimal docs
    minimal_docs = [f for f in poor_doc if f['doc_blocks'] > 0 and f['doc_blocks'] < 3][:3]
    if minimal_docs:
        print("Files with minimal documentation:")
        for f in minimal_docs:
            rel_path = Path(f['file']).relative_to('/home/user/geant4')
            print(f"  {rel_path}")
            print(f"    Doc blocks: {f['doc_blocks']}, Classes: {f['classes']}, Functions: {f['functions']}")
        print()

    print("=" * 80)

    # Summary statistics
    print("\nSUMMARY STATISTICS")
    print("-" * 80)
    print(f"Total files analyzed: {data['total_files']:,}")
    print(f"Total classes: {data['total_classes']:,}")
    print(f"Total functions: {data['total_functions']:,}")
    print()
    print(f"Well-documented files: {len(well_doc)} ({100*len(data['files_by_category']['well_documented'])/data['total_files']:.1f}%)")
    print(f"Partially documented: {len(data['files_by_category']['partially_documented'])} ({100*len(data['files_by_category']['partially_documented'])/data['total_files']:.1f}%)")
    print(f"Poorly documented: {len(data['files_by_category']['poorly_documented'])} ({100*len(data['files_by_category']['poorly_documented'])/data['total_files']:.1f}%)")

if __name__ == '__main__':
    show_examples()
