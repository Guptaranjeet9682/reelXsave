// Fixed Download Functionality for Reel X Save
class ReelXSave {
    constructor() {
        this.API_URL = '/.netlify/functions/download?url=';
        this.currentData = null;
        this.init();
    }

    init() {
        this.elements = {
            form: document.getElementById('downloadForm'),
            urlInput: document.getElementById('urlInput'),
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
        console.log('Reel X Save initialized');
    }

    bindEvents() {
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.elements.retryBtn.addEventListener('click', () => this.handleRetry());
        this.elements.downloadVideo.addEventListener('click', () => this.downloadVideo());
        this.elements.downloadAudio.addEventListener('click', () => this.downloadAudio());
        this.elements.copyLink.addEventListener('click', () => this.copyLink());
    }

    async handleSubmit(e) {
        e.preventDefault();
        const url = this.elements.urlInput.value.trim();
        
        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid Instagram URL');
            return;
        }

        await this.fetchReelData(url);
    }

    isValidUrl(url) {
        const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(reel|p|stories)\/([^\/?#&]+).*/;
        return instagramRegex.test(url);
    }

    async fetchReelData(url) {
        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            console.log('Fetching from:', this.API_URL + encodeURIComponent(url));
            
            const response = await fetch(this.API_URL + encodeURIComponent(url));
            
            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.result || !data.result.url) {
                throw new Error('No video URL found in response');
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
        this.elements.reelTitle.textContent = 'Instagram Video Ready to Download';
        this.elements.reelDuration.textContent = `Duration: ${this.currentData.duration}`;
        this.elements.reelSize.textContent = `Size: ${this.currentData.size}`;
        
        this.showResults();
        this.showMessage('Video loaded successfully! Ready to download.');
    }

    downloadVideo() {
        if (!this.currentData) return;
        
        this.downloadFile(this.currentData.url, 'reel_x_save_video', this.currentData.extension);
        this.showMessage('Video download started!');
    }

    downloadAudio() {
        if (!this.currentData) return;
        
        this.downloadFile(this.currentData.url, 'reel_x_save_audio', 'mp3');
        this.showMessage('Audio download started!');
    }

    copyLink() {
        if (!this.currentData) return;
        
        navigator.clipboard.writeText(this.currentData.url).then(() => {
            this.showMessage('Download link copied to clipboard!');
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

    // UI Methods
    showLoading() {
        this.elements.loader.classList.remove('hidden');
        this.elements.downloadBtn.disabled = true;
        this.elements.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    }

    hideLoading() {
        this.elements.loader.classList.add('hidden');
        this.elements.downloadBtn.disabled = false;
        this.elements.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Instagram Video Now';
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
        this.elements.results.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideResults() {
        this.elements.results.classList.add('hidden');
    }

    showMessage(message) {
        alert(message); // Simple alert for now
    }

    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Network error: Please check your internet connection and try again.';
        } else if (error.message.includes('CORS')) {
            return 'Browser security error: Please try refreshing the page.';
        } else {
            return error.message || 'Failed to download video. Please check the URL and try again.';
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReelXSave();
});
