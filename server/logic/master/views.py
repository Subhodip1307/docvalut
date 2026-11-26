"""
views.py – Read-only ViewSets for the Docker/OCI registry management API.

All ViewSets extend BaseClass (TokenAuthentication + IsAuthenticated).
Only list and retrieve operations are defined here.
Create operations live in create.py.

URL prefix: /logic/master/view/<basename>/
"""
import json
from rest_framework.response import Response
from accounts.common import BaseClass
from repo.models import (Repository,Blob,Manifest,RepositoryManifest,Tag)
from .serializer import (RepositorySerializer,BlobSerializer,ManifestSerializer,RepositoryManifestSerializer,TagSerializer)


# ---------------------------------------------------------------------------
# Repository – Read
# ---------------------------------------------------------------------------

class MyRepository(BaseClass):
    """
    Read operations for Repositories.

    list     GET  /logic/master/view/my-repository/
    retrieve GET  /logic/master/view/my-repository/<id>/
    """

    def list(self, request):
        repos = Repository.objects.filter(created_by=request.user).order_by("-created_at")
        serializer = RepositorySerializer(repos, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})

    def retrieve(self, request, pk=None):
        try:
            repo = Repository.objects.get(id=pk)
        except Repository.DoesNotExist:
            return Response({"RES": False, "msg": "Repository not found.", "data": ""})
        serializer = RepositorySerializer(repo)
        return Response({"RES": True, "msg": "", "data": serializer.data})

class BlobViewSet(BaseClass):
    """
    Read operations for Blobs.

    list     GET  /logic/master/view/blobs/     [?repo=<uuid>]
    retrieve GET  /logic/master/view/blobs/<digest>/
    """

    def list(self, request):
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

    def retrieve(self, request, pk=None):
        try:
            blob = Blob.objects.get(digest=pk)
        except Blob.DoesNotExist:
            return Response({"RES": False, "msg": "Blob not found.", "data": ""})
        serializer = BlobSerializer(blob)
        return Response({"RES": True, "msg": "", "data": serializer.data})


# ---------------------------------------------------------------------------
# Manifest – Read
# ---------------------------------------------------------------------------

class ManifestViewSet(BaseClass):
    """
    Read operations for Manifests.

    list     GET  /logic/master/view/manifests/     [?repo=<uuid>]
    retrieve GET  /logic/master/view/manifests/<digest>/
    """

    def list(self, request):
        repo_id = request.query_params.get("repo")
        if repo_id:
            qs = Manifest.objects.filter(repositories__repository_id=repo_id)
        else:
            qs = Manifest.objects.all().order_by("-created_at")
        serializer = ManifestSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})

    def retrieve(self, request, pk=None):
        try:
            manifest = Manifest.objects.get(digest=pk)
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

    list     GET  /logic/master/view/repository-manifests/     [?repo=<uuid>]
    """

    def list(self, request):
        qs = RepositoryManifest.objects.all().select_related("repository", "manifest")
        repo_id = request.query_params.get("repo")
        if repo_id:
            qs = qs.filter(repository_id=repo_id)
        serializer = RepositoryManifestSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})


# ---------------------------------------------------------------------------
# Tag – Read
# ---------------------------------------------------------------------------

class TagViewSet(BaseClass):
    """
    Read operations for Tags.

    list     GET  /logic/master/view/tags/     [?repo=<uuid>]
    retrieve GET  /logic/master/view/tags/<id>/
    """

    def list(self, request):
        qs = Tag.objects.all().select_related("repository", "manifest").order_by("name")
        repo_id = request.query_params.get("repo")
        if repo_id:
            qs = qs.filter(repository_id=repo_id)
        serializer = TagSerializer(qs, many=True)
        return Response({"RES": True, "msg": "", "data": serializer.data})

    def retrieve(self, request, pk=None):
        try:
            tag = Tag.objects.select_related("repository", "manifest").get(id=pk)
        except Tag.DoesNotExist:
            return Response({"RES": False, "msg": "Tag not found.", "data": ""})
        serializer = TagSerializer(tag)
        return Response({"RES": True, "msg": "", "data": serializer.data})
