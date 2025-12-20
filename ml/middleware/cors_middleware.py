def get_cors_config():
    """CORS middleware configuration"""
    return {
        "allow_origins": ["*"],  # Allows all origins
        "allow_credentials": True,
        "allow_methods": ["*"],  # Allows all methods
        "allow_headers": ["*"],  # Allows all headers
    }
