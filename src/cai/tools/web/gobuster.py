"""
gobuster tool for directory/file, DNS, and vhost brute-forcing.
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
def gobuster(mode: str, args: str, ctf=None) -> str:
    """
    Gobuster tool to brute-force URIs (dir), DNS subdomains (dns), or virtual hosts (vhost).

    Args:
        mode: Gobuster mode: "dir", "dns", "fuzz", or "vhost"
        args: Additional arguments (e.g., "-u http://localhost:8080 -w wordlist.txt")

    Returns:
        str: The output from gobuster execution
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

    command = f'gobuster {mode} {args}'
    return run_command(command, ctf=ctf)
