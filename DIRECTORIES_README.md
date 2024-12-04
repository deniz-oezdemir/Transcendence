### Directory Structure

```
project-root/
│
├── docker-compose.yml
├── .env
├── README.md
│
├── django-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── django_service/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   ├── ...
│   ├── ...
│
├── other-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── other_service/
│   │   ├── __init__.py
│   │   ├── ...
│   ├── ...
│
├── shared/
│   ├── __init__.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── logger.py
│   │   └── ...
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   └── ...
│   ├── constants/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   └── ...
│   └── ...
│
└── scripts/
    ├── init_db.sh
    ├── start_services.sh
    ├── ...
```

### Explanation and Usage

#### Root Directory
- **docker-compose.yml**: Defines and runs multi-container Docker applications.
- **.env**: Contains environment variables for configuration.
- **README.md**: Project documentation.

#### Service Directories (django-service, other-service)
- **Dockerfile**: Dockerfile for building the service's Docker image.
- **requirements.txt**: Python dependencies for the service.
- **manage.py**: Django management script (for Django services).
- **main.py**: Entry point for non-Django services (e.g., Flask, FastAPI).
- **django_service/**, **other_service/**: Application code for the service, including settings, URLs, and WSGI configuration.

#### Shared Directory (shared/)
- **shared/__init__.py**: Makes the `shared` directory a Python package.
- **shared/utils/**: Contains utility functions and common code.
  - **common.py**: Common utility functions.
  - **logger.py**: Logging setup and utilities.
- **shared/models/**: Contains shared data models.
  - **base.py**: Base model definitions.
  - **user.py**: User model shared across services.
- **shared/constants/**: Contains shared constants and settings.
  - **settings.py**: Common settings and constants.

#### Scripts Directory (scripts/)
- **init_db.sh**: Script to initialize the database.
- **start_services.sh**: Script to start the services.
- Other utility scripts.

### Using the Shared Directory

To use the shared code in your microservices, follow these steps:

1. **Include `shared` in the Python Path**:
   Modify the `PYTHONPATH` environment variable to include the `shared` directory. This can be done in the Dockerfile or in the service's entry script.

   **Example Dockerfile Modification for Django Service**:
   ```Dockerfile
   # Dockerfile for django-service
   FROM python:3.9-slim

   # Set environment variables
   ENV PYTHONDONTWRITEBYTECODE 1
   ENV PYTHONUNBUFFERED 1

   # Set work directory
   WORKDIR /usr/src/app

   # Install dependencies
   COPY requirements.txt /usr/src/app/
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy project
   COPY . /usr/src/app/
   COPY ../shared /usr/src/shared

   # Set PYTHONPATH
   ENV PYTHONPATH="/usr/src/shared:/usr/src/app"

   # Expose port
   EXPOSE 8000

   # Run the application
   CMD ["gunicorn", "--bind", "0.0.0.0:8000", "django_service.wsgi:application"]
   ```

   **Example Dockerfile Modification for Other Service**:
   ```Dockerfile
   # Dockerfile for other-service
   FROM python:3.9-slim

   # Set environment variables
   ENV PYTHONDONTWRITEBYTECODE 1
   ENV PYTHONUNBUFFERED 1

   # Set work directory
   WORKDIR /usr/src/app

   # Install dependencies
   COPY requirements.txt /usr/src/app/
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy project
   COPY . /usr/src/app/
   COPY ../shared /usr/src/shared

   # Set PYTHONPATH
   ENV PYTHONPATH="/usr/src/shared:/usr/src/app"

   # Expose port
   EXPOSE 5000

   # Run the application
   CMD ["python", "main.py"]
   ```

2. **Import Shared Modules**:
   Use standard Python import statements to access shared modules in your service code.

   **Example Usage in Django Service**:
   ```python
   # django_service/some_module.py
   from shared.utils.common import some_utility_function
   from shared.models.user import User

   def some_function():
       some_utility_function()
       user = User()
       ...
   ```

   **Example Usage in Other Service**:
   ```python
   # other_service/some_module.py
   from shared.utils.common import some_utility_function
   from shared.models.user import User

   def some_function():
       some_utility_function()
       user = User()
       ...

