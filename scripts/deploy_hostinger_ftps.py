#!/usr/bin/env python3
"""Publish only the four public IW-Fox preview assets to a scoped FTP account."""

from ftplib import FTP_TLS
from hashlib import sha256
from io import BytesIO
import os
from pathlib import Path
import ssl
import subprocess
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ("style.css", "app.js", "fox-copy-hero.svg", "index.html")


def ftp_hostname(value):
    """Accept a bare host, host:21, or ftp(s) URL with no remote path."""
    raw = value.strip()
    if not raw or any(char.isspace() for char in raw):
        raise ValueError("FTP host is missing or contains spaces")
    parsed = urlsplit(raw if "://" in raw else "//" + raw)
    if parsed.scheme and parsed.scheme.lower() not in ("ftp", "ftps"):
        raise ValueError("FTP host scheme must be ftp or ftps")
    if parsed.username or parsed.password or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        raise ValueError("FTP host must not contain credentials, a path, query, or fragment")
    try:
        hostname, port = parsed.hostname, parsed.port
    except ValueError as exc:
        raise ValueError("FTP host or port is invalid") from exc
    if not hostname or (port is not None and port != 21):
        raise ValueError("FTP host must use port 21")
    return hostname


def main():
    user = os.environ.get("IW_FOX_FTP_USER", "")
    password = os.environ.get("IW_FOX_FTP_PASSWORD", "")
    if not user or not password:
        raise SystemExit("Missing IW-Fox FTP username or password")
    try:
        host = ftp_hostname(os.environ.get("IW_FOX_FTP_HOST", ""))
    except ValueError as exc:
        raise SystemExit(f"Invalid IW-Fox FTP host format: {exc}") from None

    # This account's home must be limited to public_html/iw-fox in hPanel.
    with FTP_TLS(context=ssl.create_default_context(), timeout=30) as ftp:
        ftp.connect(host, 21)
        print("FTP server greeting:", ftp.getwelcome(), flush=True)
        try:
            ftp.login(user, password)
        except ssl.SSLCertVerificationError:
            probe = subprocess.run(
                ["openssl", "s_client", "-starttls", "ftp", "-connect", f"{host}:21", "-showcerts"],
                input="", text=True, capture_output=True, timeout=15, check=False,
            )
            cert = subprocess.run(
                ["openssl", "x509", "-noout", "-subject", "-ext", "subjectAltName"],
                input=probe.stdout, text=True, capture_output=True, timeout=5, check=False,
            )
            fingerprint = subprocess.run(
                ["openssl", "x509", "-noout", "-fingerprint", "-sha256"],
                input=probe.stdout, text=True, capture_output=True, timeout=5, check=False,
            )
            print("FTP certificate fingerprint:", fingerprint.stdout if fingerprint.returncode == 0 else "unavailable", flush=True)
            print("FTP TLS certificate names (public server metadata):", flush=True)
            print(cert.stdout if cert.returncode == 0 else "Certificate details unavailable", flush=True)
            raise
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
