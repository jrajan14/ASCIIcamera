# 📷 ASCII Camera

A **real-time browser-based ASCII camera** that converts your live webcam feed into animated ASCII art.  
No installs, no backend — everything runs locally in your browser.

Built with web technologies and deployed using **GitHub Pages**.

---

## ✨ Features

- 🎥 **Live Camera to ASCII**
  - Real-time conversion of webcam video into ASCII art

- 📐 **Resolution Modes**
  - Ultra Low  
  - Low  
  - Medium  
  - High  
  - Ultra High  
  - Native (camera resolution)

- 🎨 **ASCII Styles**
  - Simple  
  - Detailed  
  - Blocks  
  - Inverse  
  - Binary  

- 🖼️ **Frame Capture**
  - Capture the current ASCII frame
  - Save as an image
  - Copy raw ASCII text
  - Print as a **PDF** with preserved formatting

- 📊 **Real-Time Status Info**
  - Camera status
  - Frame rate (FPS)
  - ASCII output size (rows × columns)
  - Last capture timestamp

- 🌐 **Fully Client-Side**
  - No servers
  - No uploads
  - Works offline after loading

---

## 🚀 Live Demo
https://jrajan14.github.io/ASCIIcamera/

👉 ****

> ⚠️ Camera permission is required  
> Best viewed on desktop browsers (Chrome / Firefox recommended)

---

## 🛠️ How It Works

1. Captures live video using the **Web Media API**
2. Downscales frames based on the selected resolution
3. Maps pixel brightness to ASCII characters
4. Renders output using a monospaced grid
5. Applies visual styles for different artistic effects

All processing happens locally in real time.

---

## 📸 Camera Permissions

This app requires access to your camera.

- Camera data is processed **only in your browser**
- No video, images, or data are uploaded or stored
- No analytics or tracking

---

## 🖨️ Export & Print

- **Save Image**  
  Exports the rendered ASCII frame as an image

- **Print PDF**  
  Generates a print-ready PDF containing the ASCII text

- **Copy ASCII**  
  Copies the raw ASCII characters exactly as displayed

---

## 🧪 Tested Browsers

- Google Chrome (Desktop)
- Mozilla Firefox (Desktop)
- Chromium-based browsers

---

## 📦 Running Locally
- Download the repo and open index.html
