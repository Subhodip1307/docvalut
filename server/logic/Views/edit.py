"""
Only edit operations are defined here.
URL prefix: /logic/views/edit/<basename>/
"""
from rest_framework.response import Response
from accounts.common import BaseClass
from repo import models

class RepositoryMarkdown(BaseClass):
    """
    POST /logic/views/edit/markdown/
    """
    def create(self, request):
        markdown = request.data.get("markdown")
        repo_id=request.data.get("repo_id")        
        a=models.Repository.objects.get(pk=repo_id)
        a.markdown=markdown
        a.save()
        return Response({"RES": True, "msg": "Markdown Saved"})

class RepositoryIcon(BaseClass):
    """
    POST /logic/views/edit/repo-icon/
    """
    def create(self, request):
        icon = request.FILES.get("icon")
        repo_id=request.data.get("repo_id")        
        a=models.Repository.objects.get(pk=repo_id)
        old_path=a.icon
        a.icon=icon
        a.save()
        if old_path:
            old_path.delete(save=False)
        return Response({"RES": True, "msg": "Markdown Saved"})

