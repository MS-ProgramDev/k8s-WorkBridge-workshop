import requests
import json
import sys
import time
import random

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

def test_send_direct_message(token):
    print("\nTest 2: Send Direct Message API")
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
        "content": "Hello from the test script!",
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
        
    message_id = response_data["id"]
    print(f"Direct message sent successfully. Message ID: {message_id}")
    return True

def test_get_messages(token):
    print("\nTest 3: Get Messages API")
    if not token:
        print("Cannot run test: No authentication token available")
        return False
    
    url = "http://localhost:8000/chat/messages/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Get messages request failed: {str(e)}")
        return False
    
    if response.status_code != 200:
        print(f"Get messages failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    response_data = response.json()
    
    # Check that we received a list
    if not isinstance(response_data, list):
        print(f"Expected a list of messages, got: {type(response_data)}")
        return False
    
    print(f"Successfully retrieved {len(response_data)} messages")
    return True

def test_create_group(token):
    print("\nTest 4: Create Group API")
    if not token:
        print("Cannot run test: No authentication token available")
        return None
    
    url = "http://localhost:8000/chat/groups/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Create a random group name to avoid conflicts
    group_name = f"Test Group {random.randint(1000, 9999)}"
    payload = {
        "name": group_name
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Create group request failed: {str(e)}")
        return None
    
    if response.status_code != 200:
        print(f"Create group failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return None
    
    response_data = response.json()
    
    # Validate the response fields
    required_fields = ["id", "name", "created_at"]
    missing_fields = [field for field in required_fields if field not in response_data]
    
    if missing_fields:
        print(f"Response missing required fields: {missing_fields}")
        return None
    
    group_id = response_data["id"]
    print(f"Group '{group_name}' created successfully. Group ID: {group_id}")
    return group_id

def test_join_group(token, group_id):
    print(f"\nTest 5: Join Group API (Group ID: {group_id})")
    if not token or not group_id:
        print("Cannot run test: No authentication token or group ID available")
        return False
    
    url = f"http://localhost:8000/chat/groups/{group_id}/join"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Join group request failed: {str(e)}")
        return False
    
    if response.status_code != 200:
        print(f"Join group failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print(f"Successfully joined group {group_id}")
    return True

def test_send_group_message(token, group_id):
    print(f"\nTest 6: Send Group Message API (Group ID: {group_id})")
    if not token or not group_id:
        print("Cannot run test: No authentication token or group ID available")
        return False
    
    url = "http://localhost:8000/chat/messages/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "recipient_id": str(group_id),  # Group ID must be a string
        "content": f"Hello group {group_id} from the test script!",
        "is_group": True
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Send group message request failed: {str(e)}")
        return False
    
    if response.status_code != 200:
        print(f"Send group message failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    response_data = response.json()
    
    # Validate the response fields
    required_fields = ["id", "sender_id", "recipient_id", "content", "timestamp", "is_group"]
    missing_fields = [field for field in required_fields if field not in response_data]
    
    if missing_fields:
        print(f"Response missing required fields: {missing_fields}")
        return False
    
    message_id = response_data["id"]
    print(f"Group message sent successfully. Message ID: {message_id}")
    return True

def test_get_group_messages(token, group_id):
    print(f"\nTest 7: Get Group Messages API (Group ID: {group_id})")
    if not token or not group_id:
        print("Cannot run test: No authentication token or group ID available")
        return False
    
    url = f"http://localhost:8000/chat/groups/{group_id}/messages"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Get group messages request failed: {str(e)}")
        return False
    
    if response.status_code != 200:
        print(f"Get group messages failed with status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    response_data = response.json()
    
    # Check that we received a list
    if not isinstance(response_data, list):
        print(f"Expected a list of messages, got: {type(response_data)}")
        return False
    
    print(f"Successfully retrieved {len(response_data)} group messages")
    return True

def run_tests():
    # Run all tests
    print("=== STARTING WORKBRIDGE API TESTS ===")
    
    # Login test
    token = test_login()
    
    # Direct messaging tests
    direct_message_result = test_send_direct_message(token)
    get_messages_result = test_get_messages(token)
    
    # Group chat tests
    group_id = test_create_group(token)
    join_group_result = test_join_group(token, group_id)
    group_message_result = test_send_group_message(token, group_id)
    get_group_messages_result = test_get_group_messages(token, group_id)
    
    # Summary
    print("\n=== TEST SUMMARY ===")
    login_status = "PASSED" if token else "FAILED"
    direct_message_status = "PASSED" if direct_message_result else "FAILED"
    get_messages_status = "PASSED" if get_messages_result else "FAILED"
    create_group_status = "PASSED" if group_id else "FAILED"
    join_group_status = "PASSED" if join_group_result else "FAILED"
    group_message_status = "PASSED" if group_message_result else "FAILED"
    get_group_messages_status = "PASSED" if get_group_messages_result else "FAILED"
    
    print(f"1. Login Test: {login_status}")
    print(f"2. Send Direct Message Test: {direct_message_status}")
    print(f"3. Get Messages Test: {get_messages_status}")
    print(f"4. Create Group Test: {create_group_status}")
    print(f"5. Join Group Test: {join_group_status}")
    print(f"6. Send Group Message Test: {group_message_status}")
    print(f"7. Get Group Messages Test: {get_group_messages_status}")
    
    # Return exit code based on test results
    all_tests_passed = all([
        token, 
        direct_message_result, 
        get_messages_result,
        group_id,
        join_group_result,
        group_message_result,
        get_group_messages_result
    ])
    
    if all_tests_passed:
        print("\n[SUCCESS] All tests passed successfully!")
        return 0
    else:
        print("\n[FAILED] Some tests failed. See summary above for details.")
        return 1

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)