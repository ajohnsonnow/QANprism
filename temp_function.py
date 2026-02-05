def validate_coordinates(lat, lng):
    """Validate latitude and longitude coordinates."""
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        raise ValueError("Coordinates must be numeric")
    
    if not (-90 <= lat <= 90):
        raise ValueError("Latitude must be between -90 and 90")
    if not (-180 <= lng <= 180):
        raise ValueError("Longitude must be between -180 and 180")
    
    return lat, lng
