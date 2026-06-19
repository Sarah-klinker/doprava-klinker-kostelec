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
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Kalkulacka dopravy bezi na http://localhost:{PORT}")
        print("Pro pristup z jineho pocitace pouzijte IP serveru misto localhost.")
        print("Ukonceni: Ctrl+C")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
