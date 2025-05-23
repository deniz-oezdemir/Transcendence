"""
Django settings for django_project project.

Generated by 'django-admin startproject' using Django 5.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import os
from pathlib import Path


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-(l+v@)wa2lzzm#92g!=u1!5$$5)f(0h++c+7e2(cvhs(=5ui^s"
# SECRET_KEY = os.getenv("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
# DEBUG = os.getenv("DEBUG")

# SECURE_SSL_REDIRECT = True
# # SESSION_COOKIE_SECURE = True
# # CSRF_COOKIE_SECURE = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "nginx", "*"]

# CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://nginx:8000",
]

CSRF_TRUSTED_ORIGINS = ["http://localhost:8000", "http://nginx:8000"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "accounts",
    "rest_framework",
    "drf_spectacular",
    "rest_framework.authtoken",
    "corsheaders",
]

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:8005",  # Frontend application URL
# ]
CORS_ALLOW_ALL_ORIGINS = True

# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://localhost:8005",
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:8005"
# ]

# CORS_ALLOW_METHODS = [
#     'DELETE',
#     'GET',
#     'OPTIONS',
#     'PATCH',
#     'POST',
#     'PUT',
# ]

# CORS_ALLOW_HEADERS = [
#     'accept',
#     'accept-encoding',
#     'authorization',
#     'content-type',
#     'dnt',
#     'origin',
#     'user-agent',
#     'x-csrftoken',
#     'x-requested-with',
# ]

CSRF_TRUSTED_ORIGINS = ["http://localhost:8000", "https://localhost:8443"]

ROOT_URLCONF = "django_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "django_project.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "accounts"),
        "USER": os.getenv("POSTGRES_USER", "accounts"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "accounts"),
        "HOST": os.getenv("POSTGRES_HOST", "accounts-postgres"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",  # Default authentication backend
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "CET"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.CustomUser"  # points to my custom user model

# Uploaded avatars
# MEDIA_ROOT = '/usr/share/nginx/static/'  # physical directory where files are stored.
MEDIA_ROOT = "/usr/share/nginx/images/"  # physical directory where files are stored.
MEDIA_URL = "/avatars/"  # public URL where Nginx will serve the media files

NGINX_STORAGE_URL = "https://nginx:8443"
NGINX_PUBLIC_URL = "https://localhost:8443"

# APPEND_SLASH=False
# """
# Django settings for django_project project.

# Generated by 'django-admin startproject' using Django 5.1.5.

# For more information on this file, see
# https://docs.djangoproject.com/en/5.1/topics/settings/

# For the full list of settings and their values, see
# https://docs.djangoproject.com/en/5.1/ref/settings/
# """

# import os
# from pathlib import Path
# import socket
# # hostname = socket.gethostname()
# # local_ip = socket.gethostbyname(hostname)


# # Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR = Path(__file__).resolve().parent.parent
# # Get the base URL from environment or default to localhost
# BASE_URL = os.getenv('BASE_URL')

# # Quick-start development settings - unsuitable for production
# # See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# # SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = "django-insecure-(l+v@)wa2lzzm#92g!=u1!5$$5)f(0h++c+7e2(cvhs(=5ui^s"
# # SECRET_KEY = os.getenv("SECRET_KEY")

# # SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = os.getenv("DEBUG")

# SECURE_SSL_REDIRECT = True
# # # SESSION_COOKIE_SECURE = True
# # # CSRF_COOKIE_SECURE = True
# # SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ALLOWED_HOSTS = ["*"]
# CSRF_TRUSTED_ORIGINS = [
#     "http://localhost:8000",
#     "https://localhost:8443",
#     "http://nginx:8000",
#     "https://nginx:8443",
#     BASE_URL,
#     BASE_URL.replace('http:', 'https:'),
# ]
# CORS_ALLOW_ALL_ORIGINS = True
# # ALLOWED_HOSTS = [
# #     "localhost",
# #     "127.0.0.1",
# #     "nginx",
# #     hostname,
# #     local_ip,
# # ]

# # CORS_ALLOWED_ORIGINS = [
# #     "http://localhost:8000",
# #     "https://localhost:8443",
# #     "http://nginx:8000",
# #     "https://nginx:8443",
# #     # BASE_URL,
# #     # BASE_URL.replace('http:', 'https:'),
# # ]

# # CSRF_TRUSTED_ORIGINS = [
# #     "http://localhost:8000",
# #     "https://localhost:8443",
# #     "http://nginx:8000",
# #     "https://nginx:8443",
# #     # BASE_URL,
# #     # BASE_URL.replace('http:', 'https:'),
# # ]

# # Application definition

# INSTALLED_APPS = [
#     "django.contrib.admin",
#     "django.contrib.auth",
#     "django.contrib.contenttypes",
#     "django.contrib.sessions",
#     "django.contrib.messages",
#     "django.contrib.staticfiles",
#     "accounts",
#     "rest_framework",
#     "drf_spectacular",
#     "rest_framework.authtoken",
#     "corsheaders",
# ]

# REST_FRAMEWORK = {
#     "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
#     "DEFAULT_AUTHENTICATION_CLASSES": [
#         "rest_framework.authentication.TokenAuthentication",
#     ],
#     "DEFAULT_PERMISSION_CLASSES": [
#         "rest_framework.permissions.IsAuthenticated",
#     ],
# }

# MIDDLEWARE = [
#     "corsheaders.middleware.CorsMiddleware",
#     "django.middleware.common.CommonMiddleware",
#     "django.middleware.security.SecurityMiddleware",
#     "django.contrib.sessions.middleware.SessionMiddleware",
#     "django.middleware.csrf.CsrfViewMiddleware",
#     "django.contrib.auth.middleware.AuthenticationMiddleware",
#     "django.contrib.messages.middleware.MessageMiddleware",
#     "django.middleware.clickjacking.XFrameOptionsMiddleware",
# ]


# ROOT_URLCONF = "django_project.urls"

# TEMPLATES = [
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",
#         "DIRS": [],
#         "APP_DIRS": True,
#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.debug",
#                 "django.template.context_processors.request",
#                 "django.contrib.auth.context_processors.auth",
#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = "django_project.wsgi.application"


# # Database
# # https://docs.djangoproject.com/en/5.1/ref/settings/#databases


# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": os.getenv("POSTGRES_DB", "accounts"),
#         "USER": os.getenv("POSTGRES_USER", "accounts"),
#         "PASSWORD": os.getenv("POSTGRES_PASSWORD", "accounts"),
#         "HOST": os.getenv("POSTGRES_HOST", "accounts-postgres"),
#         "PORT": os.getenv("POSTGRES_PORT", "5432"),
#     }
# }


# # Password validation
# # https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
#     },
# ]

# AUTHENTICATION_BACKENDS = [
#     "django.contrib.auth.backends.ModelBackend",  # Default authentication backend
# ]

# # Internationalization
# # https://docs.djangoproject.com/en/5.1/topics/i18n/

# LANGUAGE_CODE = "en-us"

# TIME_ZONE = "CET"

# USE_I18N = True

# USE_TZ = True


# # Static files (CSS, JavaScript, Images)
# # https://docs.djangoproject.com/en/5.1/howto/static-files/

# STATIC_URL = "static/"

# # Default primary key field type
# # https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# AUTH_USER_MODEL = "accounts.CustomUser"  # points to my custom user model

# # Uploaded avatars
# # MEDIA_ROOT = '/usr/share/nginx/static/'  # physical directory where files are stored.
# MEDIA_ROOT = "/usr/share/nginx/images/"  # physical directory where files are stored.
# MEDIA_URL = "/avatars/"  # public URL where Nginx will serve the media files

# NGINX_STORAGE_URL = "https://nginx:8443"
# # NGINX_PUBLIC_URL = "https://localhost:8443"
# # Update your NGINX public URL to use the dynamic hostname
# # NGINX_PUBLIC_URL = BASE_URL

# # APPEND_SLASH=False
