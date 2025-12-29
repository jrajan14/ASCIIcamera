#📷 ASCII Camera — Browser-Based Real-Time ASCII Art

A real-time ASCII camera web app that converts your live camera feed into animated ASCII art directly in the browser.
No installs. No backend. Just grant camera access and enjoy the terminal-style visuals.

Built entirely with web technologies and deployed via GitHub Pages.

✨ Features

🎥 Live Camera → ASCII Conversion
Real-time transformation of your webcam feed into ASCII art.

📐 Multiple Resolution Modes

Ultra Low

Low

Medium

High

Ultra High

Native (camera resolution)

🎨 ASCII Styles

Simple

Detailed

Blocks

Inverse

Binary

🖼️ Capture Frames

Freeze the current ASCII frame

Save as an image

Copy raw ASCII text

Print to PDF (preserves ASCII formatting)

🧾 Printable ASCII Output

Generates clean, monospaced ASCII PDFs

Perfect for posters, zines, or archival prints

📊 Real-Time Status Panel

Camera status

Frame rate (FPS)

ASCII resolution (rows × columns)

Last capture timestamp

🌐 Runs Fully in the Browser

No server

No uploads

Works offline after load

🚀 Live Demo

👉 Open ASCII Camera

⚠️ Requires browser camera permission
Best experienced on desktop browsers (Chrome / Firefox recommended)

🛠️ How It Works

Captures live video using the Web Media API

Downscales frames based on selected resolution

Converts pixel brightness into ASCII characters

Renders output using a monospaced grid for accuracy

Applies style filters for different artistic effects

Everything runs locally — your camera feed never leaves your machine.

📸 Permissions

This app requires camera access to function.

The camera is accessed only in your browser

No data is recorded, stored, or transmitted

All processing is done locally in real time

🖨️ Printing & Export

Save Image → exports the rendered ASCII frame

Print PDF → generates a print-ready document with ASCII text

Copy Text → copies raw ASCII characters exactly as displayed

🧪 Tested On

Chrome (Windows / Linux)

Firefox (Windows / Linux)

Chromium-based browsers

📦 Deployment

This project is deployed using GitHub Pages.

To run locally:

git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
# open index.html in your browser


Note: Camera access requires a secure context
(localhost or HTTPS)

🧠 Inspiration

Inspired by:

Terminal aesthetics

Retro computing

ASCII art culture

Real-time media processing in the browser

📄 License

MIT License
Feel free to fork, modify, and build on top of it.

⭐ If You Like It

Star the repo ⭐

Share the demo

Remix the styles

Print your ASCII frames 😄
