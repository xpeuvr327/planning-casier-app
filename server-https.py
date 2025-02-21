from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

# Create SSL context
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile="localhost.pem", keyfile="localhost-key.pem")  # Include the keyfile!

# Set up the server
httpd = HTTPServer(('localhost', 4443), SimpleHTTPRequestHandler)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

# Start the server
print("Serving on https://localhost:4443")
httpd.serve_forever()
