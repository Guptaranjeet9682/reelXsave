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

// Fetch Reel Data
async function fetchReelData(url) {
    showLoader();
    hideError();
    hideResults();

    try {
        // Simulate API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const response = await fetch(API_URL + encodeURIComponent(url));
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch reel data');
        }

        processReelData(data);
        saveToCache(data, url);
        
    } catch (err) {
        console.error('Fetch error:', err);
        showError('Failed to download reel. Please check the URL and try again.');
    } finally {
        hideLoader();
    }
}

// Process and Display Results
function processReelData(data) {
    // Get download URL (handle different response formats)
    const downloadUrl = data.video || data.url || 
                       (data.media && data.media[0] && data.media[0].url) || 
                       (data.media && data.media.url);

    if (!downloadUrl) {
        showError('No video found in this reel');
        return;
    }

    currentReelData = {
        ...data,
        downloadUrl: downloadUrl,
        qualities: data.media || [{ url: downloadUrl, quality: 'hd' }]
    };

    displayResults();
}

// Display Results
function displayResults() {
    if (!currentReelData) return;

    // Set thumbnail with fallback
    if (currentReelData.thumbnail || currentReelData.image) {
        elements.reelThumbnail.src = currentReelData.thumbnail || currentReelData.image;
        elements.reelThumbnail.classList.remove('hidden');
    } else {
        elements.reelThumbnail.classList.add('hidden');
    }

    // Set content information
    elements.reelTitle.textContent = currentReelData.title || 'Instagram Reel';
    elements.reelAuthor.textContent = currentReelData.author || currentReelData.username || 'Unknown User';
    elements.reelDuration.textContent = currentReelData.duration ? `${currentReelData.duration} seconds` : '-- seconds';
    elements.reelViews.textContent = currentReelData.views ? `${formatNumber(currentReelData.views)} views` : '-- views';
    elements.reelDate.textContent = currentReelData.date || new Date().toLocaleDateString();

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
        btn.className = `quality-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `
            <i class="fas fa-video mr-2"></i>
            ${quality.quality?.toUpperCase() || `Quality ${index + 1}`}
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
    if (!selectedQuality) return;
    
    const quality = selectedQuality || currentReelData.qualities[0];
    downloadFile(quality.url, 'instagram_reel_hd', 'mp4');
    showToast('HD download started!');
}

function handleDownloadAudio() {
    if (!selectedQuality) return;
    
    const quality = selectedQuality || currentReelData.qualities[0];
    // In a real implementation, you'd convert to MP3
    downloadFile(quality.url, 'instagram_audio', 'mp3');
    showToast('Audio download started!');
}

function handleCopyLink() {
    if (!selectedQuality) return;
    
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
            title: 'Check out this Instagram Reel',
            url: window.location.href
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
    elements.downloadBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Processing...';
}

function hideLoader() {
    elements.loader.classList.add('hidden');
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Now';
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.error.classList.remove('hidden');
    elements.error.classList.add('animate-shake');
}

function hideError() {
    elements.error.classList.add('hidden');
}

function showResults() {
    elements.results.classList.remove('hidden');
    elements.results.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const cache = {
        data: data,
        url: url,
        timestamp: Date.now()
    };
    localStorage.setItem('instaSave_cache', JSON.stringify(cache));
}

function loadFromCache() {
    try {
        const cache = JSON.parse(localStorage.getItem('instaSave_cache'));
        if (cache && (Date.now() - cache.timestamp) < 30 * 60 * 1000) { // 30 minutes
            elements.urlInput.value = cache.url;
            showToast('Previous session restored');
        }
    } catch (e) {
        // Cache is invalid
    }
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
    if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        handlePaste();
    }
    
    if (e.key === 'Escape') {
        hideError();
        hideResults();
    }
});
