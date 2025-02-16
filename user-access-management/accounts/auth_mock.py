
# def mock_authenticate_user(username: str, password: str) -> Optional[User]:
#     return User.objects.get(username=username) if User.objects.filter(username=username, password=password).exists() else None

def mock_authenticate_user():
    return {"user_id": 1, "username": "testuser", "password": "testpassword"}
