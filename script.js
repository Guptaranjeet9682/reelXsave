// API Configuration
const API_URL = 'https://instadownload.ytansh038.workers.dev/?url=';

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
    reelViews: document.getElementById('reelViews'),
    reelDate: document.getElementById('reelDate'),
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
let selectedQuality = null;

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
    
    // Load from cache if available
    loadFromCache();
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

// Fetch Reel Data - UPDATED FOR YOUR API
async function fetchReelData(url) {
    showLoader();
    hideError();
    hideResults();

    try {
        // Add loading animation
        elements.downloadBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Fetching...';
        
        const response = await fetch(API_URL + encodeURIComponent(url));
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();

        console.log('API Response:', data); // For debugging

        // Check if API returned error
        if (data.error) {
            throw new Error(data.error || 'API returned an error');
        }

        // Check if we have valid result data
        if (!data.result || !data.result.url) {
            throw new Error('No video URL found in the response');
        }

        processReelData(data);
        saveToCache(data, url);
        
    } catch (err) {
        console.error('Fetch error:', err);
        showError(err.message || 'Failed to download reel. Please check the URL and try again.');
    } finally {
        hideLoader();
    }
}

// Process and Display Results - UPDATED FOR YOUR API
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
        size: result.formattedSize || result.size || '--',
        downloadUrl: result.url,
        extension: result.extension || 'mp4',
        qualities: [{
            url: result.url,
            quality: result.quality || 'hd',
            size: result.formattedSize,
            extension: result.extension
        }]
    };

    displayResults();
}

// Display Results
function displayResults() {
    if (!currentReelData) return;

    // Set default thumbnail since API doesn't provide one
    elements.reelThumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%239ca3af">Instagram Reel</text></svg>';
    elements.reelThumbnail.classList.remove('hidden');

    // Set content information
    elements.reelTitle.textContent = currentReelData.title;
    elements.reelAuthor.textContent = currentReelData.author;
    elements.reelDuration.textContent = `${currentReelData.duration}`;
    elements.reelViews.textContent = currentReelData.size ? `Size: ${currentReelData.size}` : '--';
    elements.reelDate.textContent = `Quality: ${currentReelData.quality}`;

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
            ${quality.quality?.toUpperCase() || `Quality ${index + 1}`}
            ${quality.size ? `<br><span class="text-xs opacity-75">${quality.size}</span>` : ''}
        `;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuality = quality;
        });
        
        elements.qualityOptions.appendChild(btn);
    });
    
    // Set first quality as default
    selectedQuality = currentReelData.qualities[0];
}

// Download Handlers
function handleDownloadHd() {
    if (!currentReelData) return;
    
    const quality = selectedQuality || currentReelData.qualities[0];
    const filename = `instagram_reel_${Date.now()}`;
    downloadFile(quality.url, filename, quality.extension || 'mp4');
    showToast('Download started!');
    
    // Track download
    trackDownload('video');
}

function handleDownloadAudio() {
    if (!currentReelData) return;
    
    const quality = selectedQuality || currentReelData.qualities[0];
    const filename = `instagram_audio_${Date.now()}`;
    
    // For audio download, we use the same URL but suggest .mp3 extension
    // Note: This will download the video as MP3 filename, but content remains video
    // In a real implementation, you'd need server-side audio extraction
    downloadFile(quality.url, filename, 'mp3');
    showToast('Audio download started!');
    
    // Track download
    trackDownload('audio');
}

function handleCopyLink() {
    if (!currentReelData) return;
    
    const quality = selectedQuality || currentReelData.qualities[0];
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

function formatNumber(num) {
    if (!num) return '--';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
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

// Cache Management
function saveToCache(data, url) {
    try {
        const cache = {
            data: data,
            url: url,
            timestamp: Date.now()
        };
        localStorage.setItem('instaSave_cache', JSON.stringify(cache));
    } catch (e) {
        console.warn('Could not save to cache');
    }
}

function loadFromCache() {
    try {
        const cache = JSON.parse(localStorage.getItem('instaSave_cache'));
        if (cache && (Date.now() - cache.timestamp) < 30 * 60 * 1000) {
            elements.urlInput.value = cache.url;
            showToast('Previous session restored');
        }
    } catch (e) {
        // Cache is invalid
    }
}

// Download Tracking (analytics)
function trackDownload(type) {
    // In a real app, you'd send this to analytics
    console.log(`Download tracked: ${type}`);
    const downloads = parseInt(localStorage.getItem('download_count') || '0');
    localStorage.setItem('download_count', (downloads + 1).toString());
}

// Add some interactive effects
document.addEventListener('mousemove', function(e) {
    const cards = document.querySelectorAll('.feature-card, .quality-btn');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Allow default paste behavior in input field
        return;
    }
    
    if (e.key === 'Escape') {
        hideError();
    }
});

// Add error boundary for unhandled errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showError('An unexpected error occurred. Please refresh the page.');
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
}
