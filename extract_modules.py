#!/usr/bin/env python3
"""
Script to extract code from editor.js into modules
This will help systematically modularize the codebase
"""

import re
import os

def extract_functions(file_path):
    """Extract all functions and their code from editor.js"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find function definitions
    pattern = r'^function\s+(\w+)|^const\s+(\w+)\s*=\s*(?:function|\(|=>)|^let\s+(\w+)\s*=\s*(?:function|\(|=>)|^var\s+(\w+)\s*=\s*(?:function|\(|=>)'
    
    functions = []
    lines = content.split('\n')
    
    current_function = None
    brace_count = 0
    start_line = 0
    
    for i, line in enumerate(lines):
        # Check if this is a function start
        match = re.search(pattern, line)
        if match:
            if current_function:
                functions.append((current_function, start_line, i))
            func_name = match.group(1) or match.group(2) or match.group(3) or match.group(4)
            current_function = func_name
            start_line = i
            brace_count = line.count('{') - line.count('}')
            continue
        
        if current_function:
            brace_count += line.count('{') - line.count('}')
            if brace_count == 0 and line.strip():
                functions.append((current_function, start_line, i+1))
                current_function = None
    
    return functions, lines

if __name__ == '__main__':
    file_path = 'public/editor.js'
    functions, lines = extract_functions(file_path)
    print(f"Found {len(functions)} functions")
    
    # Group by module
    modules = {
        'constants': [],
        'utils': [],
        'state': [],
        'canvas': [],
        'drawing': [],
        'effects': [],
        'selection': [],
        'zoom': [],
        'midi': [],
        'blockchain': [],
        'ui': [],
        'history': []
    }
    
    # Simple heuristics for grouping
    for func_name, start, end in functions[:50]:  # First 50 for testing
        code = '\n'.join(lines[start:end])
        print(f"{func_name}: lines {start}-{end}")
