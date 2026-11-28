from rest_framework import status
from rest_framework.response import Response
from repo import models
import os,re,hashlib
from django.db import transaction
from django.conf import settings
from urllib.parse import unquote
from accounts.common import BaseCliView


class CheckRepo(BaseCliView):
    def get(self,request,repository):
        repo = models.Repository.objects.filter(name=repository,created_by=request.user).exists()
        if not repo:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_200_OK)


class Check_Blob(BaseCliView):
    """
    Check if a blob exists or not
    """
    def get(self,request,repository,digest):
        blob = models.Blob.objects.filter(digest=digest,session__repo__name=repository,session__repo__created_by=request.user).first()
        if not blob:
            return Response(status=status.HTTP_404_NOT_FOUND)

        return Response(
            status=status.HTTP_200_OK,
            headers={
                "Docker-Content-Digest": blob.digest,
                "Content-Length": str(blob.size),
                "Docker-Distribution-API-Version": "registry/2.0",
            }
        )

class BlobUploadViewSet(BaseCliView):

    def post(self, request, repository=None):
        repository=unquote(repository)
        # print("========== DOCKER UPLOAD REQUEST ==========")
        repo=models.Repository.objects.filter(name=repository,created_by=request.user).first()
        if not repo:
            return Response({"error": "Repository not found"},status=status.HTTP_404_NOT_FOUND)
        session = models.UploadSession.objects.create(repo=repo,offset=0,status="pending")

        return Response(
        status=status.HTTP_202_ACCEPTED,
        headers={
            "Location": f"push/{repository}/blobs/uploads/{session.id}",
            "Docker-Upload-UUID": str(session.id),
            "Range": "0-0",
            "Docker-Distribution-API-Version": "registry/2.0",
        }
    )

    def patch(self, request, repository=None, upload_uuid=None):
        print("\n========== PATCH UPLOAD ==========")

        session = models.UploadSession.objects.filter(
            id=upload_uuid,
            repo__name=repository,repo__created_by=request.user
        ).first()

        if not session:
            return Response(
                {"error": "Upload session not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != "pending":
            return Response(
                {"error": "Upload session is not pending"},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_path = session.get_temp_path()
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)

        received_bytes = 0
        raw_request = request._request

        with open(temp_path, "ab") as temp_file:
            while True:
                chunk = raw_request.read(1024 * 1024)

                if not chunk:
                    break

                temp_file.write(chunk)
                received_bytes += len(chunk)

        session.offset = os.path.getsize(temp_path)
        session.save(update_fields=["offset", "updated_at"])
        return Response(
            {"message": "Chunk received"},
            status=status.HTTP_202_ACCEPTED,
            headers={
                "Location": f"push/{repository}/blobs/uploads/{upload_uuid}",
                "Docker-Upload-UUID": str(upload_uuid),
                "Range": f"0-{session.offset - 1}" if session.offset else "0-0",
                "Docker-Distribution-API-Version": "registry/2.0",
            }
        )

    def put(self,request, repository, upload_uuid):
        repository=unquote(repository)
        upload_uuid=unquote(upload_uuid)
        print("\n========== FINALIZE BLOB UPLOAD ==========")

        # 1. Find upload session
        session = models.UploadSession.objects.filter(
            id=upload_uuid,
            repo__name=repository,repo__created_by=request.user
        ).first()

        if not session:
            return Response(
                {"error": "Upload session not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != "pending":
            return Response({"error": "Upload session is not pending"},status=status.HTTP_400_BAD_REQUEST)
        # 2. Get expected digest
        expected_digest = unquote(request.query_params.get("digest",""))
        if not expected_digest or not re.fullmatch(r"sha256:[a-f0-9]{64}", expected_digest):
            return Response({"error": "Invalid SHA-256 digest"},status=status.HTTP_400_BAD_REQUEST)
        # 3. Handle temporary file
        if not os.path.exists(session.get_temp_path()):
            if session.offset == 0:
                # Allow a valid empty blob
                os.makedirs(os.path.dirname(session.get_temp_path()), exist_ok=True)
                open(session.get_temp_path(), "ab").close()
            else:
                return Response(
                    {"error": "Temporary upload file not found"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # 4. Calculate SHA-256
        sha256 = hashlib.sha256()
        file_size = 0

        with open(session.get_temp_path(), "rb") as temp_file:
            while chunk := temp_file.read(1024 * 1024):
                sha256.update(chunk)
                file_size += len(chunk)

        calculated_digest = f"sha256:{sha256.hexdigest()}"
        # 5. Verify digest
        if calculated_digest != expected_digest:
            return Response(
                {
                    "error": "Digest mismatch",
                    "expected": expected_digest,
                    "calculated": calculated_digest,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. Move to permanent blob storage
        digest_hex = sha256.hexdigest()

        blob_dir = os.path.join(
            settings.MEDIA_ROOT,
            "registry",
            "blobs",
            "sha256",
            digest_hex[:2],
        )

        os.makedirs(blob_dir, exist_ok=True)

        storage_path = os.path.join(blob_dir, digest_hex)

        # 7. Register blob and complete session
        try:
            with transaction.atomic():

                existing_blob = models.Blob.objects.filter(
                    digest=expected_digest,session__repo__name=repository,session__repo__created_by=request.user
                ).first()

                if existing_blob:
                    # Blob already exists: deduplication
                    os.remove(session.get_temp_path())
                    storage_path = existing_blob.storage_path

                else:
                    # Atomic rename when source and destination
                    # are on the same filesystem.
                    os.replace(session.get_temp_path(), storage_path)

                    models.Blob.objects.create(
                        digest=expected_digest,
                        size=file_size,
                        storage_path=storage_path,
                        session=session
                    )

                session.status = "completed"
                session.save(update_fields=["status", "updated_at"])

        except Exception:
            raise

        print("Blob stored:", storage_path)

        # 8. Return success
        return Response(
            status=status.HTTP_201_CREATED,
            headers={
                "Location": f"push/{repository}/blobs/{expected_digest}",
                "Docker-Content-Digest": expected_digest,
                "Docker-Distribution-API-Version": "registry/2.0",
            }
        )



class ManifestUploadViewSet(BaseCliView):

    def put(self, request, repository=None, reference=None):
        # Find repository
        print("the repo is ",repository)
        repo = models.Repository.objects.filter(name=repository).first()

        if not repo:
            return Response(
                {"error": "Repository not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Read exact manifest bytes
        content = request.body

        if not content:
            return Response(
                {"error": "Empty manifest"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate digest from original bytes
        digest = "sha256:" + hashlib.sha256(content).hexdigest()

        media_type = request.content_type or (
            "application/vnd.oci.image.manifest.v1+json"
        )

        with transaction.atomic():
            manifest, _ = models.Manifest.objects.get_or_create(
                digest=digest,
                defaults={
                    "media_type": media_type,
                    "content": content,
                }
            )

            models.RepositoryManifest.objects.get_or_create(
                repository=repo,
                manifest=manifest,
            )

            # Update existing tag or create a new one
            if not reference.startswith("sha256:"):
                models.Tag.objects.update_or_create(
                    repository=repo,
                    name=reference,
                    defaults={"manifest": manifest},
                )

        return Response(
            status=status.HTTP_201_CREATED,
            headers={
                "Docker-Content-Digest": digest,
                "Location": f"push/{repository}/manifests/{reference}",
            }
        )