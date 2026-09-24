"""
ffuf (Fast Web Fuzzer) tool for web fuzzing and discovery.
"""

import os
import re
from cai.tools.common import run_command
from cai.sdk.agents import function_tool

def _get_default_wordlist() -> str:
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "wordlists", "common.txt")),
        os.path.join(os.getcwd(), "wordlists", "common.txt"),
        os.path.expanduser(r"~\wordlists\common.txt"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return candidates[0]

@function_tool
def ffuf(args: str, target_url: str = "", ctf=None) -> str:
    """
    Fast web fuzzer (ffuf) to discover hidden files, directories, vhosts, or fuzz HTTP parameters.

    Args:
        args: Command-line arguments for ffuf (e.g., "-w wordlist.txt -u http://localhost:8080/FUZZ -mc 200,301")
        target_url: Optional base target URL if not already in args

    Returns:
        str: The output from ffuf execution
    """
    default_wl = _get_default_wordlist()
    # Fix placeholder wordlists like /path/to/wordlist or non-existent linux paths on Windows
    if os.path.isfile(default_wl):
        m = re.search(r'-w\s+([^\s]+)', args)
        if m:
            wl = m.group(1).strip('"\'')
            if not os.path.exists(wl) or wl.startswith(("/", "/usr", "/path", "/opt")):
                args = args.replace(m.group(0), f'-w "{default_wl}"')
        elif "-w" not in args:
            args = f'{args} -w "{default_wl}"'

    if target_url and "-u " not in args and " -u" not in args:
        command = f'ffuf {args} -u {target_url}'
    else:
        command = f'ffuf {args}'
    return run_command(command, ctf=ctf)
