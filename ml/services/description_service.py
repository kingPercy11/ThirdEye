from config.gemini import model_gemini, GEMINI_API_KEY
from urllib.parse import urlparse

def get_website_description(url: str, title: str = "") -> str:
    # Fallback: extract domain and use title if Gemini fails
    try:
        domain = urlparse(url).netloc.replace('www.', '')
    except:
        domain = url
    
    # If no Gemini API key, use fallback immediately
    if not GEMINI_API_KEY:
        return f"{title if title else domain}" if title else f"Website: {domain}"
    
    try:
        prompt = f"Give a 4-5 sentence description using keywords of what this website is doing or telling us based on its URL and title and its contents. URL: {url}, Title: {title if title else 'Unknown'}. Only return the description, nothing else."
        response = model_gemini.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        error_msg = str(e)
        
        # Handle rate limiting - use fallback description
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            print(f"⚠️ Rate limit reached for {url}. Using fallback description.")
            # Use title as description if available, otherwise use domain
            if title and title.strip():
                return title
            else:
                return f"Website: {domain}"
        
        # Other errors - log and use fallback
        print(f"Error getting description for {url}: {e}")
        if title and title.strip():
            return title
        else:
            return f"Website: {domain}"
