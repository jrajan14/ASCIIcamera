class ASCIICamera {
    constructor() {
        // DOM Elements
        this.video = document.getElementById('video');
        this.cameraSelect = document.getElementById('cameraSelect');
        this.asciiOutput = document.getElementById('asciiOutput');
        this.startButton = document.getElementById('startCamera');
        this.stopButton = document.getElementById('stopCamera');
        this.resolutionSelect = document.getElementById('resolution');
        this.asciiStyleSelect = document.getElementById('asciiStyle');
        this.toggleVideoButton = document.getElementById('toggleVideo');
        this.captureFrameButton = document.getElementById('captureFrame');
        this.saveImageButton = document.getElementById('saveImage');
        this.printButton = document.getElementById('printAscii');
        this.copyButton = document.getElementById('copyClipboard');
        this.refreshCamerasButton = document.getElementById('refreshCameras');
        
        // Modal elements
        this.captureModal = document.getElementById('captureModal');
        this.capturedAscii = document.getElementById('capturedAscii');
        this.saveCaptureButton = document.getElementById('saveCapture');
        this.copyCaptureButton = document.getElementById('copyCapture');
        this.printCaptureButton = document.getElementById('printCapture');
        this.downloadTextButton = document.getElementById('downloadText');
        this.closeModalButton = document.getElementById('closeModal');
        
        // Info elements
        this.status = document.getElementById('status');
        this.videoResolution = document.getElementById('videoResolution');
        this.asciiResolution = document.getElementById('asciiResolution');
        this.frameRate = document.getElementById('frameRate');
        this.asciiSize = document.getElementById('asciiSize');
        this.lastCapture = document.getElementById('lastCapture');
        
        // Variables
        this.stream = null;
        this.availableCameras = [];
        this.selectedCameraId = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.animationId = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.showVideo = true;
        this.isProcessing = false;
        this.capturedAsciiText = null;
        this.currentAsciiText = null;
        
        // ASCII Character Sets
        this.asciiChars = {
            simple: '@%#*+=-:. ',
            detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
            blocks: '█▓▒░ ',
            inverse: ' .:-=+*#%@',
            binary: '01',
        };
        
        // Resolution presets - Adjusted for 16:9 aspect ratio and character aspect ratio
        // ASCII characters are roughly 2:1 (height:width), so we adjust target dimensions
        this.resolutions = {
            'ultra-low': { width: 40, height: 22 },   // 16:9 adjusted for character aspect
            'low': { width: 60, height: 34 },
            'medium': { width: 100, height: 56 },
            'high': { width: 140, height: 79 },
            'ultra': { width: 180, height: 101 }, 
            'native': { width: 0, height: 0 }        // Will be calculated
        };
        
        this.aspectRatio = 16 / 9; // Default 16:9
        this.characterAspectRatio = 2.0; // ASCII characters are about 2x taller than wide
        
        this.bindEvents();
        this.updateDisplayInfo();
    }
    
    bindEvents() {
        this.cameraSelect.addEventListener('change', () => this.onCameraChange());
        this.startButton.addEventListener('click', () => this.startCamera());
        this.stopButton.addEventListener('click', () => this.stopCamera());
        this.resolutionSelect.addEventListener('change', () => this.updateResolution());
        this.asciiStyleSelect.addEventListener('change', () => this.updateAsciiStyle());
        this.toggleVideoButton.addEventListener('click', () => this.toggleVideo());
        this.captureFrameButton.addEventListener('click', () => this.captureFrame());
        this.saveImageButton.addEventListener('click', () => this.saveAsImage());
        this.printButton.addEventListener('click', () => this.printAscii());
        this.copyButton.addEventListener('click', () => this.copyToClipboard());
        
        // Modal events
        this.refreshCamerasButton.addEventListener('click', () => this.refreshCameras());
        this.saveCaptureButton.addEventListener('click', () => this.saveCaptureAsImage());
        this.copyCaptureButton.addEventListener('click', () => this.copyCaptureToClipboard());
        this.printCaptureButton.addEventListener('click', () => this.printCapture());
        this.downloadTextButton.addEventListener('click', () => this.downloadAsText());
        this.closeModalButton.addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        this.captureModal.addEventListener('click', (e) => {
            if (e.target === this.captureModal) {
                this.closeModal();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.captureFrame();
            }
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    async enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            // Clear existing options except the first one
            while (this.cameraSelect.options.length > 1) {
                this.cameraSelect.remove(1);
            }
            
            // Add camera options
            this.availableCameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                
                // Try to get a meaningful label
                let label = camera.label || `Camera ${index + 1}`;
                
                // Determine camera type
                if (camera.label) {
                    if (camera.label.toLowerCase().includes('back') || 
                        camera.label.toLowerCase().includes('rear')) {
                        label = '📷 Back Camera';
                    } else if (camera.label.toLowerCase().includes('front')) {
                        label = '📱 Front Camera';
                    } else if (camera.label.toLowerCase().includes('external')) {
                        label = '🔌 External Camera';
                    }
                }
                
                option.textContent = label;
                this.cameraSelect.appendChild(option);
            });
            
            // If only one camera, auto-select it
            if (this.availableCameras.length === 1) {
                this.cameraSelect.value = this.availableCameras[0].deviceId;
                this.selectedCameraId = this.availableCameras[0].deviceId;
            }
            
            return this.availableCameras;
        } catch (error) {
            console.error('Error enumerating cameras:', error);
            return [];
        }
    }

    onCameraChange() {
        this.selectedCameraId = this.cameraSelect.value;
        
        // If camera is running, restart it with the new selection
        if (this.stream) {
            this.stopCamera();
            setTimeout(() => {
                this.startCamera();
            }, 100);
        }
    }

    async refreshCameras() {
        this.showAlert('Refreshing camera list...', 'info');
        await this.enumerateCameras();
        this.showAlert('Camera list updated!', 'success');
    }

    async startCamera() {
        try {
            this.status.textContent = 'Requesting camera access...';
            this.status.className = 'status-indicator loading';
            
            // First, enumerate cameras if we haven't already
            if (this.availableCameras.length === 0) {
                await this.enumerateCameras();
            }
            
            // Build constraints based on selected camera
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    aspectRatio: 16/9
                }
            };
            
            // If a specific camera is selected, use it
            if (this.selectedCameraId) {
                constraints.video.deviceId = { exact: this.selectedCameraId };
            } else {
                // No camera selected, try to get the environment (back) camera first
                constraints.video.facingMode = 'environment';
            }
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play().then(resolve);
                };
            });
            
            // Update camera select to show which camera is active
            if (this.selectedCameraId) {
                const selectedCamera = this.availableCameras.find(cam => cam.deviceId === this.selectedCameraId);
                if (selectedCamera) {
                    let label = selectedCamera.label || 'Selected Camera';
                    if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
                        label = '📷 Back Camera';
                    } else if (label.toLowerCase().includes('front')) {
                        label = '📱 Front Camera';
                    }
                    this.cameraSelect.querySelector(`option[value="${this.selectedCameraId}"]`).textContent = `${label} ✓`;
                }
            }
            
            // Get actual video dimensions and calculate aspect ratio
            const videoWidth = this.video.videoWidth;
            const videoHeight = this.video.videoHeight;
            this.aspectRatio = videoWidth / videoHeight;
            
            console.log(`Camera resolution: ${videoWidth}x${videoHeight} (${this.aspectRatio.toFixed(2)}:1)`);
            this.videoResolution.textContent = `${videoWidth}×${videoHeight}`;
            
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.saveImageButton.disabled = false;
            this.cameraSelect.disabled = true; // Disable camera selection while camera is active
            this.status.textContent = 'Active';
            this.status.className = 'status-indicator active';
            
            this.updateToggleVideoButton();
            this.startRendering();
            this.startFPSCounter();
            
        } catch (error) {
            this.status.textContent = `Error: ${error.message}`;
            this.status.className = 'status-indicator';
            console.error('Camera error:', error);
            
            // If specific camera failed, try to get any camera
            if (this.selectedCameraId && error.name === 'OverconstrainedError') {
                this.showAlert('Selected camera not available. Trying any available camera...', 'warning');
                this.selectedCameraId = null;
                this.cameraSelect.value = '';
                setTimeout(() => this.startCamera(), 1000);
            }
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.video.srcObject = null;
        this.asciiOutput.textContent = '';
        
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
        this.saveImageButton.disabled = true;
        this.cameraSelect.disabled = false; // Enable camera selection when camera stops
        
        // Reset camera labels
        this.resetCameraLabels();
        
        this.status.textContent = 'Stopped';
        this.status.className = 'status-indicator';
        this.frameRate.textContent = '-';
        this.videoResolution.textContent = '-';
    }
    
    resetCameraLabels() {
        // Reset all camera labels to remove checkmarks
        const options = this.cameraSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value) {
                const camera = this.availableCameras.find(cam => cam.deviceId === option.value);
                if (camera) {
                    let label = camera.label || `Camera ${Array.from(options).indexOf(option)}`;
                    if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
                        label = '📷 Back Camera';
                    } else if (label.toLowerCase().includes('front')) {
                        label = '📱 Front Camera';
                    } else if (label.toLowerCase().includes('external')) {
                        label = '🔌 External Camera';
                    }
                    option.textContent = label;
                }
            }
        });
    }

    updateToggleVideoButton() {
        this.toggleVideoButton.innerHTML = this.showVideo ? 
            '<i class="fas fa-eye-slash"></i> Hide Video' : 
            '<i class="fas fa-eye"></i> Show Video';
    }
    
    toggleVideo() {
        this.showVideo = !this.showVideo;
        this.video.style.display = this.showVideo ? 'block' : 'none';
        this.updateToggleVideoButton();
    }
    
    startRendering() {
        const render = (timestamp) => {
            if (!this.stream || this.isProcessing) {
                this.animationId = requestAnimationFrame(render);
                return;
            }
            
            // Calculate FPS
            if (this.lastFrameTime) {
                const delta = timestamp - this.lastFrameTime;
                this.fps = Math.round(1000 / delta);
            }
            this.lastFrameTime = timestamp;
            
            // Process frame
            this.processFrame();
            
            // Update display info
            this.updateDisplayInfo();
            
            this.animationId = requestAnimationFrame(render);
        };
        
        this.animationId = requestAnimationFrame(render);
    }
    
    startFPSCounter() {
        setInterval(() => {
            if (this.fps > 0) {
                this.frameRate.textContent = `${this.fps} FPS`;
            }
        }, 1000);
    }
    
    calculateTargetDimensions() {
        const resolution = this.resolutionSelect.value;
        
        if (resolution === 'native') {
            // For native resolution, we need to consider character aspect ratio
            // We want to maintain the video's aspect ratio in the final ASCII output
            const maxWidth = 240; // Maximum characters width for performance
            
            // Calculate width based on video aspect ratio and character aspect
            let targetWidth = Math.min(this.video.videoWidth / 8, maxWidth);
            // Adjust height for character aspect ratio (characters are taller)
            let targetHeight = Math.round(targetWidth / this.aspectRatio * this.characterAspectRatio);
            
            return { width: Math.round(targetWidth), height: targetHeight };
        } else {
            // Use preset resolution (already adjusted for 16:9 and character aspect)
            return this.resolutions[resolution];
        }
    }
    
    processFrame() {
        if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA || !this.video.videoWidth) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            // Calculate target dimensions considering aspect ratio
            const { width: targetWidth, height: targetHeight } = this.calculateTargetDimensions();
            
            // Set canvas dimensions
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
            
            // Draw video to canvas with correct aspect ratio
            this.ctx.imageSmoothingEnabled = false;
            
            // Calculate source aspect ratio
            const sourceAspect = this.video.videoWidth / this.video.videoHeight;
            const targetAspect = targetWidth / targetHeight;
            
            let sx, sy, sWidth, sHeight;
            
            if (sourceAspect > targetAspect) {
                // Source is wider - crop sides
                sHeight = this.video.videoHeight;
                sWidth = sHeight * targetAspect;
                sx = (this.video.videoWidth - sWidth) / 2;
                sy = 0;
            } else {
                // Source is taller - crop top/bottom
                sWidth = this.video.videoWidth;
                sHeight = sWidth / targetAspect;
                sx = 0;
                sy = (this.video.videoHeight - sHeight) / 2;
            }
            
            // Draw the image with cropping to maintain aspect ratio
            this.ctx.drawImage(
                this.video,
                sx, sy, sWidth, sHeight,
                0, 0, targetWidth, targetHeight
            );
            
            // Convert to ASCII
            const asciiArt = this.convertToAscii(targetWidth, targetHeight);
            
            // Store current ASCII
            this.currentAsciiText = asciiArt;
            
            // Update output with aspect ratio correction
            this.asciiOutput.textContent = asciiArt;
            this.asciiOutput.classList.add('aspect-corrected');
            
            // Update ASCII resolution display
            const lines = asciiArt.split('\n').filter(line => line.length > 0);
            if (lines.length > 0) {
                const asciiWidth = lines[0].length;
                const asciiHeight = lines.length;
                this.asciiResolution.textContent = `${asciiWidth}×${asciiHeight}`;
            }
            
        } catch (error) {
            console.error('Frame processing error:', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    convertToAscii(width, height) {
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const style = this.asciiStyleSelect.value;
        const chars = this.asciiChars[style] || this.asciiChars.detailed;
        
        let asciiArt = '';
        
        // For binary style, we can add simple dithering for better visual effect
        if (style === 'binary') {
            // Create a copy of the image data for dithering
            const ditheredData = new Uint8ClampedArray(data);
            
            // Simple Floyd-Steinberg dithering for better binary representation
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    
                    // Get old pixel value (brightness)
                    const oldR = ditheredData[idx];
                    const oldG = ditheredData[idx + 1];
                    const oldB = ditheredData[idx + 2];
                    const oldBrightness = 0.299 * oldR + 0.587 * oldG + 0.114 * oldB;
                    
                    // Determine new pixel value (0 or 255)
                    const newBrightness = oldBrightness > 127 ? 255 : 0;
                    
                    // Calculate quantization error
                    const error = oldBrightness - newBrightness;
                    
                    // Update pixel
                    const factor = newBrightness / 255;
                    ditheredData[idx] = factor * 255;
                    ditheredData[idx + 1] = factor * 255;
                    ditheredData[idx + 2] = factor * 255;
                    
                    // Distribute error to neighboring pixels (Floyd-Steinberg)
                    if (x + 1 < width) {
                        const rightIdx = idx + 4;
                        ditheredData[rightIdx] = Math.min(255, Math.max(0, ditheredData[rightIdx] + error * 7/16));
                    }
                    if (y + 1 < height) {
                        const downIdx = idx + width * 4;
                        if (x > 0) {
                            const downLeftIdx = downIdx - 4;
                            ditheredData[downLeftIdx] = Math.min(255, Math.max(0, ditheredData[downLeftIdx] + error * 3/16));
                        }
                        ditheredData[downIdx] = Math.min(255, Math.max(0, ditheredData[downIdx] + error * 5/16));
                        if (x + 1 < width) {
                            const downRightIdx = downIdx + 4;
                            ditheredData[downRightIdx] = Math.min(255, Math.max(0, ditheredData[downRightIdx] + error * 1/16));
                        }
                    }
                }
            }
            
            // Convert dithered image to binary
            for (let y = 0; y < height; y++) {
                let line = '';
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const brightness = 0.299 * ditheredData[idx] + 0.587 * ditheredData[idx + 1] + 0.114 * ditheredData[idx + 2];
                    line += brightness > 127 ? '1' : '0';
                }
                asciiArt += line + '\n';
            }
        } else {
            // Normal ASCII conversion for other styles
            for (let y = 0; y < height; y++) {
                let line = '';
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    
                    // Calculate brightness (perceptual luminance)
                    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                    const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
                    
                    line += chars[charIndex];
                }
                asciiArt += line + '\n';
            }
        }
        
        return asciiArt;
    }
    
    updateResolution() {
        const resolution = this.resolutionSelect.value;
        const preset = this.resolutions[resolution];
        
        if (resolution === 'native') {
            this.currentResolution.textContent = 'Native (Full)';
        } else {
            this.currentResolution.textContent = `${preset.width}×${preset.height}`;
        }
    }
    
    updateAsciiStyle() {
        // Style will be applied on next render
    }
    
    updateDisplayInfo() {
        if (this.currentAsciiText) {
            const lines = this.currentAsciiText.split('\n').filter(line => line.length > 0);
            if (lines.length > 0) {
                const asciiWidth = lines[0].length;
                const asciiHeight = lines.length;
                this.asciiSize.textContent = `${asciiWidth}×${asciiHeight} chars`;
            }
        }
    }
    
    captureFrame() {
        if (!this.stream || !this.currentAsciiText) {
            this.showAlert('No camera feed available!', 'error');
            return;
        }
        
        this.capturedAsciiText = this.currentAsciiText;
        this.capturedAscii.textContent = this.capturedAsciiText;
        
        // Format timestamp
        const now = new Date();
        const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.lastCapture.textContent = timestamp;
        
        // Show modal
        this.captureModal.style.display = 'flex';
        
        this.showAlert('Frame captured!', 'success');
    }
    
    closeModal() {
        this.captureModal.style.display = 'none';
    }
    
    async copyToClipboard() {
        if (!this.currentAsciiText) {
            this.showAlert('No ASCII art to copy!', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.currentAsciiText);
            this.showAlert('ASCII art copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showAlert('Failed to copy. Please select and copy manually.', 'error');
        }
    }
    
    async copyCaptureToClipboard() {
        if (!this.capturedAsciiText) {
            this.showAlert('No captured frame to copy!', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.capturedAsciiText);
            this.showAlert('Captured frame copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showAlert('Failed to copy. Please select and copy manually.', 'error');
        }
    }
    
    saveAsImage() {
        if (!this.currentAsciiText) {
            this.showAlert('No ASCII art to save!', 'error');
            return;
        }
        
        this.captureFrame();
        setTimeout(() => {
            this.saveCaptureAsImage();
        }, 100);
    }
    
    saveCaptureAsImage() {
        if (!this.capturedAsciiText) {
            this.showAlert('No captured frame to save!', 'error');
            return;
        }
        
        // Create a canvas to render the ASCII art as an image
        const lines = this.capturedAsciiText.split('\n').filter(line => line.length > 0);
        if (lines.length === 0) return;
        
        const asciiWidth = lines[0].length;
        const asciiHeight = lines.length;
        
        // Create canvas with appropriate size
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate canvas size (each character as 8x16 pixels)
        const charWidth = 8;
        const charHeight = 16;
        canvas.width = asciiWidth * charWidth + 40; // Add padding
        canvas.height = asciiHeight * charHeight + 40;
        
        // Fill background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw ASCII text
        ctx.font = `${charHeight}px 'Courier New', monospace`;
        ctx.fillStyle = '#00ff00';
        ctx.textBaseline = 'top';
        
        // Add title and timestamp
        const now = new Date();
        const timestamp = now.toLocaleString();
        ctx.fillText(`ASCII Camera - ${timestamp}`, 20, 10);
        
        // Draw ASCII art
        for (let y = 0; y < asciiHeight; y++) {
            ctx.fillText(lines[y], 20, 30 + y * charHeight);
        }
        
        // Convert to data URL and download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ascii-camera-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        this.showAlert('Image saved successfully!', 'success');
    }
    
    printAscii() {
        if (!this.currentAsciiText) {
            this.showAlert('No ASCII art to print!', 'error');
            return;
        }
        
        this.captureFrame();
        setTimeout(() => {
            this.printCapture();
        }, 100);
    }
    
    printCapture() {
        if (!this.capturedAsciiText) {
            this.showAlert('No captured frame to print!', 'error');
            return;
        }
        
        // Create a printable window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ASCII Camera Print</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        background: white;
                        color: black;
                        padding: 20px;
                    }
                    pre {
                        font-size: 4px;
                        line-height: 1;
                        white-space: pre;
                        margin: 0;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ASCII Camera Capture</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
                <pre>${this.capturedAsciiText}</pre>
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Auto-print after a short delay
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    
    downloadAsText() {
        if (!this.capturedAsciiText) {
            this.showAlert('No captured frame to download!', 'error');
            return;
        }
        
        const blob = new Blob([this.capturedAsciiText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `ascii-camera-${Date.now()}.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showAlert('Text file downloaded!', 'success');
    }
    
    showAlert(message, type = 'info') {
        // Remove existing alert
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Create alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            background: ${type === 'error' ? 'var(--error-color)' : 
                        type === 'success' ? 'var(--success-color)' : 'var(--surface-light)'};
            color: ${type === 'error' || type === 'success' ? 'white' : 'var(--text-color)'};
            border: 2px solid ${type === 'error' ? 'var(--error-color)' : 
                              type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
            z-index: 10000;
            font-weight: bold;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.opacity = '0';
                alert.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 500);
            }
        }, 3000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const asciiCamera = new ASCIICamera();
    
    // Add global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });
});
