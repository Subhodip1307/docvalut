# don't push this file
from .base_settings import *
DEBUG = True
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mydatabase",
        "USER": "root",
        "PASSWORD": "mypassword",
        "HOST": "127.0.0.1",
        "PORT": "5432",
    }
}
ALLOWED_HOSTS = ['*']
CORS_ALLOWED_ORIGINS = ["http://localhost:3000","http://192.168.0.151:3000"]
CSRF_TRUSTED_ORIGINS = []
CORS_ALLOW_HEADERS=["*"]
#uvicorn core.asgi:application --host 0.0.0.0 --port 8000 --reload

