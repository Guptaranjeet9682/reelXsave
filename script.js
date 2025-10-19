// API Configuration - DIRECT API CALL (No proxy needed)
const API_BASE = 'https://instadownload.ytansh038.workers.dev/';

// DOM Elements
const elements = {
    form: document.getElementById('downloadForm'),
    urlInput: document.getElementById('urlInput'),
    pasteBtn: document.getElementById('pasteBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    loader: document.getElementById('loader'),
    error: document.getElementById('error'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    results: document.getElementById('results'),
    reelThumbnail: document.getElementById('reelThumbnail'),
    reelTitle: document.getElementById('reelTitle'),
    reelAuthor: document.getElementById('reelAuthor'),
    reelDuration: document.getElementById('reelDuration'),
    reelSize: document.getElementById('reelSize'),
    reelQuality: document.getElementById('reelQuality'),
    qualityOptions: document.getElementById('qualityOptions'),
    downloadHd: document.getElementById('downloadHd'),
    downloadAudio: document.getElementById('downloadAudio'),
    copyLink: document.getElementById('copyLink'),
    shareBtn: document.getElementById('shareBtn'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// Global State
let currentReelData = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Event Listeners
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.pasteBtn.addEventListener('click', handlePaste);
    elements.retryBtn.addEventListener('click', handleRetry);
    elements.downloadHd.addEventListener('click', handleDownloadHd);
    elements.downloadAudio.addEventListener('click', handleDownloadAudio);
    elements.copyLink.addEventListener('click', handleCopyLink);
    elements.shareBtn.addEventListener('click', handleShare);
    
    console.log('App initialized successfully');
}

// Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const url = elements.urlInput.value.trim();
    
    if (!isValidInstagramUrl(url)) {
        showError('Please enter a valid Instagram Reel URL');
        return;
    }

    await fetchReelData(url);
}

// Paste from Clipboard
async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        if (isValidInstagramUrl(text)) {
            elements.urlInput.value = text;
            showToast('URL pasted successfully!');
        } else {
            showError('Clipboard does not contain a valid Instagram URL');
        }
    } catch (err) {
        showError('Cannot access clipboard. Please paste manually.');
    }
}

// Validate Instagram URL
function isValidInstagramUrl(url) {
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(reel|p|stories)\/([^\/?#&]+).*/;
    return instagramRegex.test(url);
}

// Fetch Reel Data - COMPLETELY FIXED FOR YOUR API
async function fetchReelData(url) {
    showLoader();
    hideError();
    hideResults();

    try {
        // Show loading state
        elements.downloadBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Fetching...';
        elements.downloadBtn.disabled = true;

        console.log('Fetching from URL:', API_BASE + '?url=' + encodeURIComponent(url));
        
        const response = await fetch(API_BASE + '?url=' + encodeURIComponent(url));
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        // Check if API returned error
        if (data.error) {
            throw new Error(data.error || 'API returned an error');
        }

        // Check if we have valid result data (YOUR API STRUCTURE)
        if (!data.result || !data.result.url) {
            throw new Error('No video URL found in the response');
        }

        processReelData(data);
        
    } catch (err) {
        console.error('Fetch error:', err);
        showError(err.message || 'Failed to download reel. Please check the URL and try again.');
    } finally {
        hideLoader();
    }
}

// Process and Display Results - UPDATED FOR YOUR API STRUCTURE
function processReelData(data) {
    const result = data.result;
    
    if (!result || !result.url) {
        showError('No video found in this reel');
        return;
    }

    currentReelData = {
        title: 'Instagram Reel',
        author: 'Instagram User',
        duration: result.duration || '--',
        quality: result.quality || 'HD',
        size: result.formattedSize || formatBytes(result.size) || '--',
        downloadUrl: result.url,
        extension: result.extension || 'mp4',
        qualities: [{
            url: result.url,
            quality: result.quality || 'hd',
            size: result.formattedSize || formatBytes(result.size),
            extension: result.extension || 'mp4'
        }]
    };

    displayResults();
}

// Display Results
function displayResults() {
    if (!currentReelData) return;

    // Set default thumbnail
    elements.reelThumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%239ca3af">Instagram Reel Preview</text></svg>';
    elements.reelThumbnail.classList.remove('hidden');

    // Set content information
    elements.reelTitle.textContent = currentReelData.title;
    elements.reelAuthor.textContent = currentReelData.author;
    elements.reelDuration.textContent = `${currentReelData.duration}`;
    elements.reelSize.textContent = `Size: ${currentReelData.size}`;
    elements.reelQuality.textContent = `Quality: ${currentReelData.quality}`;

    // Create quality options
    createQualityOptions();
    
    showResults();
    showToast('Reel loaded successfully!');
}

// Create Quality Selection Buttons
function createQualityOptions() {
    elements.qualityOptions.innerHTML = '';
    
    currentReelData.qualities.forEach((quality, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `quality-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `
            <i class="fas fa-video mr-2"></i>
            ${quality.quality?.toUpperCase() || 'HD'}
            ${quality.size ? `<br><span class="text-xs opacity-75">${quality.size}</span>` : ''}
        `;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        
        elements.qualityOptions.appendChild(btn);
    });
}

// Download Handlers
function handleDownloadHd() {
    if (!currentReelData) return;
    
    const quality = currentReelData.qualities[0];
    const filename = `instagram_reel_${Date.now()}`;
    downloadFile(quality.url, filename, quality.extension);
    showToast('Download started!');
    
    // Track download
    trackDownload('video');
}

function handleDownloadAudio() {
    if (!currentReelData) return;
    
    const quality = currentReelData.qualities[0];
    const filename = `instagram_audio_${Date.now()}`;
    
    // For audio download, we use the same URL but suggest .mp3 extension
    downloadFile(quality.url, filename, 'mp3');
    showToast('Audio download started!');
    
    // Track download
    trackDownload('audio');
}

function handleCopyLink() {
    if (!currentReelData) return;
    
    const quality = currentReelData.qualities[0];
    navigator.clipboard.writeText(quality.url).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(() => {
        showError('Failed to copy link');
    });
}

function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Instagram Reel',
            text: 'Check out this Instagram Reel',
            url: window.location.href
        }).catch(() => {
            handleCopyLink();
        });
    } else {
        handleCopyLink();
    }
}

function handleRetry() {
    const url = elements.urlInput.value.trim();
    if (url) {
        fetchReelData(url);
    }
}

// Utility Functions
function downloadFile(url, filename, extension) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(filename)}.${extension}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function formatBytes(bytes) {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// UI Control Functions
function showLoader() {
    elements.loader.classList.remove('hidden');
    elements.downloadBtn.disabled = true;
}

function hideLoader() {
    elements.loader.classList.add('hidden');
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Now';
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.error.classList.remove('hidden');
    
    // Add shake animation
    elements.error.style.animation = 'none';
    setTimeout(() => {
        elements.error.style.animation = 'shake 0.5s ease-in-out';
    }, 10);
}

function hideError() {
    elements.error.classList.add('hidden');
}

function showResults() {
    elements.results.classList.remove('hidden');
    setTimeout(() => {
        elements.results.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 300);
}

function hideResults() {
    elements.results.classList.add('hidden');
}

function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('translate-x-full');
    
    setTimeout(() => {
        elements.toast.classList.add('translate-x-full');
    }, 3000);
}

// Download Tracking
function trackDownload(type) {
    console.log(`Download tracked: ${type}`);
    const downloads = parseInt(localStorage.getItem('download_count') || '0');
    localStorage.setItem('download_count', (downloads + 1).toString());
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideError();
    }
});

// Error boundary for unhandled errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Test function to debug API
window.debugAPI = function(url) {
    console.log('Testing API with URL:', url);
    fetchReelData(url);
};
