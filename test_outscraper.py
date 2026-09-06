import os
import json
import urllib.request
import urllib.parse

def get_env_var(file_path, var_name):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith(f"{var_name}="):
                    return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return None

# Load from .env in the same directory
API_KEY = get_env_var(".env", "OUTSCRAPER_API_KEY")

def test_outscraper_url(google_maps_url):
    print(f"Testing URL: {google_maps_url}")
    print("-" * 40)
    
    if not API_KEY or API_KEY == "salamSALAMsadTaSAlam78223877098394haksKK":
        print("❌ Your OUTSCRAPER_API_KEY in .env seems to be fake/invalid.")
        print("Please replace it with your real Outscraper API Key.")
        return

    url = "https://api.outscraper.cloud/google-maps-search"
    
    params = {
        "query": google_maps_url,
        "limit": 1,
        "async": "false"
    }
    
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    
    req = urllib.request.Request(full_url)
    req.add_header("X-API-KEY", API_KEY)
    
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            print(f"Status Code: {status_code}")
            
            raw_data = response.read().decode('utf-8')
            data = json.loads(raw_data)
            
            print("Response JSON:")
            if "data" in data and len(data["data"]) > 0:
                results = data["data"][0]
                if len(results) > 0:
                    place = results[0]
                    place_id = place.get("place_id")
                    name = place.get("name")
                    print(f"Name: {name}")
                    print(f"Place ID: {place_id}")
                    
                    if place_id:
                        review_link = f"https://search.google.com/local/writereview?placeid={place_id}"
                        print(f"\n✅ Converted Review Link: {review_link}")
                    else:
                        print("❌ No place_id found in the response.")
                else:
                    print("❌ No places found for this URL.")
            else:
                print("Response:", data)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print("Error details:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # You can change this URL to any Google Maps URL to test
    sample_url = "https://maps.app.goo.gl/9Nq1rGvw1Hq5U18g6"
    test_outscraper_url(sample_url)
