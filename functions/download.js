exports.handler = async function(event, context) {
    // CORS headers set karein
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { url } = event.queryStringParameters;
        
        if (!url) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'URL parameter is required' })
            };
        }

        // Validate Instagram URL
        const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(reel|p|stories)\/([^\/?#&]+).*/;
        if (!instagramRegex.test(url)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid Instagram URL' })
            };
        }

        // Call the actual API
        const apiUrl = `https://instadownload.ytansh038.workers.dev/?url=${encodeURIComponent(url)}`;
        console.log('Calling API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error in function:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch reel data: ' + error.message 
            })
        };
    }
};
