"""
urls.py – URL routing for the logic/master management API.

Two routers:
  View_Router   → read (list/retrieve) ViewSets from views.py
  Create_Router → create (POST) ViewSets from create.py
"""

from rest_framework.routers import SimpleRouter
from django.urls import path, include
from . import views
from . import create

# ---------------------------------------------------------------------------
# View_Router – Read-only ViewSets (views.py)
# ---------------------------------------------------------------------------

View_Router = SimpleRouter()

View_Router.register("my-repository",views.MyRepository,basename="my-repository")
# View_Router.register("upload-sessions",views.UploadSessionViewSet,basename="upload-sessions",)
View_Router.register("blobs",views.BlobViewSet,basename="blobs",)
View_Router.register("manifests",views.ManifestViewSet,basename="manifests")
View_Router.register("repository-manifests",views.RepositoryManifestViewSet,basename="repository-manifests",)
View_Router.register("tags",views.TagViewSet,basename="tags",)
# ---------------------------------------------------------------------------
# Create_Router – Create-only ViewSets (create.py)
# ---------------------------------------------------------------------------

Create_Router = SimpleRouter()

Create_Router.register("my-repository",create.MyRepository,basename="create-my-repository",)
Create_Router.register("delete-my-repository",create.DeleteMyRepository,basename="delete-my-repository",)



urlpatterns = [
    path("view/", include(View_Router.urls), name="master_view"),
    path("create/", include(Create_Router.urls), name="master_create"),
]
