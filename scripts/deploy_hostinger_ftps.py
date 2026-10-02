#!/usr/bin/env python3
"""Publish only the four public IW-Fox preview assets to a scoped FTP account."""

from ftplib import FTP_TLS
from hashlib import sha256
from io import BytesIO
import os
from pathlib import Path
import ssl


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ("style.css", "app.js", "fox-copy-hero.svg", "index.html")


def main():
    host = os.environ["IW_FOX_FTP_HOST"]
    user = os.environ["IW_FOX_FTP_USER"]
    password = os.environ["IW_FOX_FTP_PASSWORD"]
    if not all((host, user, password)) or "/" in host or ":" in host:
        raise SystemExit("Invalid IW-Fox deployment settings")

    # This account's home must be limited to public_html/iw-fox in hPanel.
    with FTP_TLS(context=ssl.create_default_context(), timeout=30) as ftp:
        ftp.connect(host, 21)
        ftp.login(user, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        for name in ASSETS:
            local = (ROOT / name).read_bytes()
            with BytesIO(local) as source:
                ftp.storbinary(f"STOR {name}", source)
            received = bytearray()
            ftp.retrbinary(f"RETR {name}", received.extend)
            if sha256(local).digest() != sha256(received).digest():
                raise SystemExit(f"Upload verification failed: {name}")
            print(f"Verified {name}")


if __name__ == "__main__":
    main()
