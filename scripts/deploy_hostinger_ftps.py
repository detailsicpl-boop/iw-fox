#!/usr/bin/env python3
"""Publish only the four public IW-Fox preview assets to a scoped FTP account."""

from ftplib import FTP_TLS
from hashlib import sha256
from io import BytesIO
import os
from pathlib import Path
import ssl
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ("style.css", "app.js", "fox-copy-hero.svg", "index.html")
PINNED_IP = "148.135.141.151"
PINNED_CERT_SHA256 = "79a7c9aeaad8855c82f58598597b931b10429afec6234b621588f4e937b36dee"


class PinnedFTP_TLS(FTP_TLS):
    def _check_peer(self, connection):
        if sha256(connection.getpeercert(binary_form=True)).hexdigest() != PINNED_CERT_SHA256:
            raise ssl.SSLError("FTP server certificate changed; stop deployment")

    def ntransfercmd(self, cmd, rest=None):
        connection, size = super().ntransfercmd(cmd, rest)
        self._check_peer(connection)
        return connection, size



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

    # The scoped FTP account's home must be public_html/iw-fox.
    # The IP's certificate is issued for *.hstgr.io, so validate the CA chain
    # and pin the observed server certificate before sending credentials.
    pinned = host == PINNED_IP
    context = ssl.create_default_context()
    if pinned:
        context.check_hostname = False
    client = PinnedFTP_TLS if pinned else FTP_TLS
    with client(context=context, timeout=30) as ftp:
        ftp.connect(host, 21)
        if pinned:
            ftp.auth()
            ftp._check_peer(ftp.sock)
            ftp.login(user, password, secure=False)
        else:
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
