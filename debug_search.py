from ddgs import DDGS
import json

def test_search():
    query = "React Native jobs in Remote"
    print(f"Testing query: {query}")
    
    try:
        results = DDGS().text(query, max_results=10)
        print(f"Found {len(results)} results")
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_search()
