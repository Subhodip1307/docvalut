"""
Only Read-only operations are defined here.
URL prefix: /logic/views/view/<basename>/
"""
import json
from rest_framework.response import Response
from accounts.common import BaseClass
from repo.models import (Repository,Blob,Manifest,RepositoryManifest,Tag)
from .serializer import (RepositorySerializer,BlobSerializer,ManifestSerializer,RepositoryManifestSerializer,TagSerializer)
from rest_framework.pagination import PageNumberPagination

# ---------------------------------------------------------------------------
# Repository – Read
# ---------------------------------------------------------------------------

class MyRepository(BaseClass):
    """
    Read operations for Repositories.

    list     GET  /logic/views/view/my-repository/?page=<>&size=<>
    retrieve GET  /logic/views/view/my-repository/<id>/
    """

    def list(self, request):
        paginator = PageNumberPagination()
        paginator.page_size = request.GET.get("size",10)
        repos = Repository.objects.filter(created_by=request.user).order_by("-created_at")
        page = paginator.paginate_queryset(repos, request)
        serializer = RepositorySerializer(page, many=True)
        return Response({
        "RES": True,
        "data": serializer.data,
        "count": paginator.page.paginator.count,
        "next": paginator.get_next_link(),
        "previous": paginator.get_previous_link()
        })

    def retrieve(self, request, pk=None):
        try:
            repo = Repository.objects.get(id=pk,created_by=request.user)
        except Repository.DoesNotExist:
            return Response({"RES": False, "msg": "Repository not found.", "data": ""})
        serializer = RepositorySerializer(repo)
        return Response({"RES": True, "msg": "", "data": serializer.data})

class BlobViewSet(BaseClass):
    """
    Read operations for Blobs.

    list     GET  /logic/views/view/blobs/     [?repo=<uuid>]
    retrieve GET  /logic/views/view/blobs/<digest>/
    """

    def list(self, request):
        #TODO: need to check this api
        repo_id = request.query_params.get("repo")
        repo_manifests = RepositoryManifest.objects.filter(repository__created_by=request.user,
            repository_id=repo_id
        ).select_related("manifest")
        blob_digests = set()
        for rm in repo_manifests:
            try:
                manifest_data = json.loads(bytes(rm.manifest.content))
                config_digest = manifest_data.get("config", {}).get("digest")
                if config_digest:
                    blob_digests.add(config_digest)
                for layer in manifest_data.get("layers", []):
                    layer_digest = layer.get("digest")
                    if layer_digest:
                        blob_digests.add(layer_digest)
            except Exception:
                continue
        qs = Blob.objects.filter(digest__in=blob_digests)
        serializer = BlobSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})



class ManifestViewSet(BaseClass):
    """
    Read operations for Manifests.

    list     GET  /logic/views/view/manifests/     [?repo=<uuid>]
    retrieve GET  /logic/views/view/manifests/<digest>/
    """

    def list(self, request):
        repo_id = request.query_params.get("repo")
        qs = Manifest.objects.filter(repositories__repository_id=repo_id,repositories__repository__created_by=request.user)
        serializer = ManifestSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})

    def retrieve(self, request, pk=None):
        try:
           manifest= Manifest.objects.get(digest=pk,repositories__repository__created_by=request.user)
        except Manifest.DoesNotExist:
            return Response({"RES": False, "msg": "Manifest not found.", "data": ""})
        serializer = ManifestSerializer(manifest)
        return Response({"RES": True, "msg": "", "data": serializer.data})


# ---------------------------------------------------------------------------
# RepositoryManifest – Read
# ---------------------------------------------------------------------------

class RepositoryManifestViewSet(BaseClass):
    """
    Read operations for RepositoryManifest (repo <-> manifest links).

    list     GET  /logic/views/view/repository-manifests/     [?repo=<uuid>]
    """

    def list(self, request):
        repo_id = request.query_params.get("repo")
        qs = RepositoryManifest.objects.filter(repository__created_by=request.user,repository_id=repo_id).select_related("repository", "manifest")
        serializer = RepositoryManifestSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})


# ---------------------------------------------------------------------------
# Tag – Read
# ---------------------------------------------------------------------------

class TagViewSet(BaseClass):
    """
    Read operations for Tags.

    list     GET  /logic/views/view/tags/     [?repo=<uuid>]
    retrieve GET  /logic/views/view/tags/<id>/
    """

    def list(self, request):
        repo_id = request.query_params.get("repo")
        qs = Tag.objects.filter(repository_id=repo_id,repository__created_by=request.user).select_related("repository", "manifest").order_by("name")
        serializer = TagSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})

    def retrieve(self, request, pk=None):
        try:
            tag = Tag.objects.select_related("repository", "manifest").get(id=pk,repository__created_by=request.user)
        except Tag.DoesNotExist:
            return Response({"RES": False, "msg": "Tag not found.", "data": ""})
        serializer = TagSerializer(tag)
        return Response({"RES": True, "msg": "", "data": serializer.data})
