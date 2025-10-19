class InstaDownloader {
    constructor() {
        // Use Netlify function instead of direct API
        this.API_URL = '/.netlify/functions/download?url=';
        this.currentData = null;
        this.init();
    }

    init() {
        this.elements = {
            form: document.getElementById('downloadForm'),
            urlInput: document.getElementById('urlInput'),
            pasteBtn: document.getElementById('pasteBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            loader: document.getElementById('loader'),
            error: document.getElementById('error'),
            errorText: document.getElementById('errorText'),
            retryBtn: document.getElementById('retryBtn'),
            results: document.getElementById('results'),
            reelTitle: document.getElementById('reelTitle'),
            reelDuration: document.getElementById('reelDuration'),
            reelSize: document.getElementById('reelSize'),
            downloadVideo: document.getElementById('downloadVideo'),
            downloadAudio: document.getElementById('downloadAudio'),
            copyLink: document.getElementById('copyLink')
        };

        this.bindEvents();
        console.log('InstaDownloader initialized with Netlify function');
    }

    bindEvents() {
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.elements.pasteBtn.addEventListener('click', () => this.handlePaste());
        this.elements.retryBtn.addEventListener('click', () => this.handleRetry());
        this.elements.downloadVideo.addEventListener('click', () => this.downloadVideo());
        this.elements.downloadAudio.addEventListener('click', () => this.downloadAudio());
        this.elements.copyLink.addEventListener('click', () => this.copyLink());
    }

    async handleSubmit(e) {
        e.preventDefault();
        const url = this.elements.urlInput.value.trim();
        
        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid Instagram Reel URL');
            return;
        }

        await this.fetchReelData(url);
    }

    async handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            if (this.isValidUrl(text)) {
                this.elements.urlInput.value = text;
                this.showMessage('URL pasted successfully!');
            } else {
                this.showError('Clipboard does not contain a valid Instagram URL');
            }
        } catch (err) {
            this.showError('Cannot access clipboard. Please paste manually.');
        }
    }

    isValidUrl(url) {
        return url.includes('instagram.com/reel/') || url.includes('instagram.com/p/');
    }

    async fetchReelData(url) {
        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            console.log('Fetching from Netlify function:', this.API_URL + encodeURIComponent(url));
            
            const response = await fetch(this.API_URL + encodeURIComponent(url));

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server returned ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.result || !data.result.url) {
                throw new Error('No video found in the response');
            }

            this.processData(data);
            
        } catch (error) {
            console.error('Fetch error:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.hideLoading();
        }
    }

    processData(data) {
        const result = data.result;
        
        this.currentData = {
            url: result.url,
            duration: result.duration || 'Unknown',
            size: result.formattedSize || this.formatBytes(result.size) || 'Unknown',
            quality: result.quality || 'HD',
            extension: result.extension || 'mp4'
        };

        this.displayResults();
    }

    displayResults() {
        this.elements.reelTitle.textContent = 'Instagram Reel';
        this.elements.reelDuration.textContent = `Duration: ${this.currentData.duration}`;
        this.elements.reelSize.textContent = `Size: ${this.currentData.size}`;
        
        this.showResults();
        this.showMessage('Reel loaded successfully!');
    }

    downloadVideo() {
        if (!this.currentData) return;
        
        this.downloadFile(this.currentData.url, 'instagram_reel', this.currentData.extension);
        this.showMessage('Video download started!');
    }

    downloadAudio() {
        if (!this.currentData) return;
        
        this.downloadFile(this.currentData.url, 'instagram_audio', 'mp3');
        this.showMessage('Audio download started!');
    }

    copyLink() {
        if (!this.currentData) return;
        
        navigator.clipboard.writeText(this.currentData.url).then(() => {
            this.showMessage('Link copied to clipboard!');
        }).catch(() => {
            this.showError('Failed to copy link');
        });
    }

    downloadFile(url, filename, extension) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${Date.now()}.${extension}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleRetry() {
        const url = this.elements.urlInput.value.trim();
        if (url) {
            this.fetchReelData(url);
        }
    }

    // UI Helper Methods
    showLoading() {
        this.elements.loader.classList.remove('hidden');
        this.elements.downloadBtn.disabled = true;
        this.elements.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    }

    hideLoading() {
        this.elements.loader.classList.add('hidden');
        this.elements.downloadBtn.disabled = false;
        this.elements.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Reel';
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.error.classList.remove('hidden');
    }

    hideError() {
        this.elements.error.classList.add('hidden');
    }

    showResults() {
        this.elements.results.classList.remove('hidden');
    }

    hideResults() {
        this.elements.results.classList.add('hidden');
    }

    showMessage(message) {
        // Simple alert for now
        alert(message);
    }

    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Network error: Please check your internet connection and try again.';
        } else if (error.message.includes('CORS')) {
            return 'CORS error: Please try again with the Netlify function.';
        } else {
            return error.message || 'Failed to download reel. Please try again.';
        }
    }

    formatBytes(bytes) {
        if (!bytes) return null;
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new InstaDownloader();
});
