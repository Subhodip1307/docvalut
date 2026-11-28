app_name="logic"
from django.urls import path,include
from logic.Views import urls as Views_urls

urlpatterns = [
   path('views/',include(Views_urls),name="views"),#logic/views/
]
