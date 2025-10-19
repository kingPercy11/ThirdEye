import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in .env file")
    exit(1)

print("Configuring Gemini API...")
genai.configure(api_key=GEMINI_API_KEY)

print("\n" + "=" * 80)
print("AVAILABLE GEMINI MODELS")
print("=" * 80)

try:
    models = genai.list_models()
    
    print("\nAll Available Models:")
    print("-" * 80)
    
    for idx, m in enumerate(models, 1):
        print(f"\n[{idx}] Model Name: {m.name}")
        print(f"    Display Name: {m.display_name}")
        print(f"    Supported Methods: {', '.join(m.supported_generation_methods)}")
        if hasattr(m, 'description'):
            print(f"    Description: {m.description}")
    
    print("\n" + "=" * 80)
    
    # Filter for content generation models
    print("\nMODELS SUPPORTING 'generateContent':")
    print("-" * 80)
    
    content_models = [m for m in models if 'generateContent' in m.supported_generation_methods]
    
    if content_models:
        for idx, m in enumerate(content_models, 1):
            print(f"{idx}. {m.name}")
        
        print(f"\n✓ Found {len(content_models)} models supporting generateContent")
        print("\nRecommended model currently used in analyse.py:")
        print("  - genai.GenerativeModel('gemini-2.5-pro-preview-03-25')")
        print("\nOther available models:")
        for m in content_models[:5]:  # Show top 5
            model_id = m.name.split('/')[-1]
            if model_id != 'gemini-2.5-pro-preview-03-25':
                print(f"  - genai.GenerativeModel('{model_id}')")
    else:
        print("⚠️ No models found supporting generateContent")
    
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ Error listing models: {e}")
    print("\nTroubleshooting:")
    print("1. Check if your GEMINI_API_KEY is valid")
    print("2. Ensure you have internet connection")
    print("3. Verify the API key has proper permissions")
