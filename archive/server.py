import os
import http.server

os.chdir("/Users/anacristinavaldesmarcos/Documents/meal-menu")

handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(("", 3000), handler)
print("Serving at http://localhost:3000")
httpd.serve_forever()
