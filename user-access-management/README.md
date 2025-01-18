# Accounts App API
A backend service built with Django and Django REST Framework (DRF) to manage user accounts, including functionalities for registration, login, avatar upload and more.

## Features
- User registration (sign-up).
- User login/logout.
- Avatar upload with default fallback.
- Username and password validation.
- Manage user accounts (e.g., delete, update profile).

## Prerequisites
Make sure the following are installed on your system:

- Python 3.8+
- Pip
- ~~PostgreSQL~~ --> currently using Django's default SQLite3
- Virtualenv (optional, but recommended for isolating dependencies)

## Setup Instructions

1. Clone the Repository
git clone <repository_url>
cd <repository_folder>

2. Create & activate a Virtual Environment
python -m venv .venv
source .venv/bin/activate  # On Linux/Mac
venv\Scripts\activate     # On Windows

3. Install Dependencies
pip install -r requirements.txt

4. ~~Configure the Database~~
- Install PostgreSQL and create a database:
createdb users_db
- Update settings.py with your database credentials:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'users_db',
        'USER': '<your_db_user>',
        'PASSWORD': '<your_db_password>',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

5. Apply Migrations
Run the migrations to create the database schema:
python manage.py makemigrations
python manage.py migrate

6. Create a Superuser (Optional)
For accessing the admin panel:
python manage.py createsuperuser

7. Run the Development Server
python manage.py runserver
Access the API locally at: http://127.0.0.1:8000/

### **API Endpoints**

| Endpoint           | Method | Description                         |
| ------------------ | ------ | ----------------------------------- |
| `/register/`       | POST   | Register a new user.                |
| `/login/`          | POST   | Login an existing user.             |
| `/logout/`         | POST   | Logout the current user.            |
| `/profile/`        | GET    | Retrieve user profile information.  |
| `/profile/update/` | PUT    | Update user profile (e.g., avatar). |
| `/profile/delete/` | DELETE | Delete the user account.            |


## Testing the API
Using Postman, cURL or DRF interface on the browser

#### **Register a User**
Endpoint: POST /register/
- Body:
```json
{
    "username": "testuser",
    "password": "strongpassword123",
    "avatar_url": null
}
```

#### **Login a User**
Endpoint: POST /login/
- Body:
```json
{
    "username": "testuser",
    "password": "strongpassword123"
}
```

#### **Logout a User**
Endpoint: POST /logout/
- Headers:
  - Authorization: (session token)

- Body:
```json
{}
```

#### **See Profile**
Endpoint: GET /profile/
- Headers:
  - Authorization: (session token)

#### **Update Profile**
Endpoint: PUT /profile/update/
- Headers:
  - Authorization: (session token)
- Body:
```json
{
    "avatar_url": "(binary file of the image)"
}
```
- Body:
```json
{
    "password": "oldpassword123",
    "new_password": "strongerpassword123"
}
```

#### **Delete Account**
Endpoint: DELETE /profile/delete/
- Headers:
  - Authorization: (session token)

## TO DO:
- Implement remaining endpoints (login, logout etc with Authorization token)
- Switch to PostgeSQL
- For deployment:
    - Use a production server like Gunicorn or uWSGI.
    - Use nginx for reverse proxying.
    - Set DEBUG = False in settings.py and configure ALLOWED_HOSTS.
