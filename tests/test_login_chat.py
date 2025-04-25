import requests
import json
import sys
import time

def test_login():
    print("Test 1: Login API")
    url = "http://localhost:8000/auth/login"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "email": "user@example.com",
        "password": "string"
    }
    
    # Retry logic for login
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            break
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                print(f"Login attempt {attempt+1} failed: {str(e)}. Retrying in 3 seconds...")
                time.sleep(3)
            else:
                print(f"All login attempts failed: {str(e)}")
                return None
    
    if response.status_code != 200:
        print(f"Login failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return None
    
    response_data = response.json()
    
    if "access_token" not in response_data or "token_type" not in response_data:
        print("Login response missing token data")
        print(f"Response: {response_data}")
        return None
        
    token = response_data["access_token"]
    print(f"Login successful. Token received.")
    return token

def test_send_message(token):
    print("\\nTest 2: Send Message API")
    if not token:
        print("Cannot run test: No authentication token available")
        return False
        
    url = "http://localhost:8000/chat/messages/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "recipient_id": "user2@example.com",
        "content": "Hello!123",
        "is_group": False
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Send message request failed: {str(e)}")
        return False
    
    if response.status_code != 200:
        print(f"Send message failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    response_data = response.json()
    
    # Validate the response fields
    required_fields = ["id", "sender_id", "recipient_id", "content", "timestamp", "is_group"]
    missing_fields = [field for field in required_fields if field not in response_data]
    
    if missing_fields:
        print(f"Response missing required fields: {missing_fields}")
        return False
        
    if response_data["sender_id"] != "user@example.com" or response_data["recipient_id"] != "user2@example.com":
        print(f"Sender or recipient mismatch in response")
        return False
        
    if response_data["content"] != "Hello!123":
        print(f"Message content mismatch in response")
        return False
    
    print(f"Message sent successfully. Message ID: {response_data['id']}")
    return True

def run_tests():
    # Run all tests
    token = test_login()
    message_result = test_send_message(token)
    
    # Summary
    print("\\n--- TEST SUMMARY ---")
    login_status = "PASSED" if token else "FAILED"
    message_status = "PASSED" if message_result else "FAILED"
    
    print(f"Login Test: {login_status}")
    print(f"Send Message Test: {message_status}")
    
    # Return exit code based on test results
    if token and message_result:
        return 0
    else:
        return 1

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)