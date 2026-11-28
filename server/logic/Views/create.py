"""
Only create operations are defined here.
URL prefix: /logic/views/create/<basename>/
"""

from rest_framework.response import Response
from accounts.common import BaseClass
from repo.models import Repository
from .serializer import RepositorySerializer


# ---------------------------------------------------------------------------
# Repository – Create
# ---------------------------------------------------------------------------

class MyRepository(BaseClass):
    """
    POST /logic/views/create/my-repository/
    """

    def create(self, request):
        name = request.data.get("name")
        description = request.data.get("description", "")
        icon = request.FILES.get("icon")

        if not name or not name.strip():
            return Response({"RES": False, "msg": "Repository name must not be empty.", "data": ""})

        name = name.strip()
        name = f"{request.user.username}/{name.strip()}"

        if Repository.objects.filter(name=name,created_by=request.user).exists():
            return Response({"RES": False, "msg": f"A repository named '{name}' already exists.", "data": ""})

        repo = Repository.objects.create(name=name, description=description, icon=icon,created_by=request.user)
        serializer = RepositorySerializer(repo)
        return Response({"RES": True, "msg": "Repository created.", "data": serializer.data})

class DeleteMyRepository(BaseClass):
    """
    POST /logic/views/create/delete-my-repository/
    """

    def create(self, request):
        print(request.data)
        return Response({"RES": True, "msg": "Deleted Repository."})
