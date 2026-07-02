"""Simple HTTP server for the shipping calculator (Chrome on server)."""

import http.server
import socketserver
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
APP_DIR = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)


def main() -> None:
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Kalkulacka dopravy bezi na http://localhost:{PORT}")
            print("Pro pristup z jineho pocitace pouzijte IP serveru misto localhost.")
            print("Ukonceni: Ctrl+C")
            httpd.serve_forever()
    except OSError as exc:
        if getattr(exc, "winerror", None) == 10048 or exc.errno in (48, 98):
            print(f"Chyba: port {PORT} je obsazeny.", file=sys.stderr)
            print(f"Zkuste jiny port: py -3 server.py {PORT + 1}", file=sys.stderr)
            print("Nebo ukoncete predchozi server (Ctrl+C v tom okne).", file=sys.stderr)
        else:
            raise
        sys.exit(1)


if __name__ == "__main__":
    main()
