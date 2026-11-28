from rest_framework import serializers
from repo.models import (
    Repository,
    UploadSession,
    Blob,
    Manifest,
    RepositoryManifest,
    Tag,
)


class RepositorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Repository model.
    Includes computed counts for related tags and manifests.
    """
    tag_count = serializers.SerializerMethodField()
    manifest_count = serializers.SerializerMethodField()

    class Meta:
        model = Repository
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "tag_count",
            "manifest_count",
            "created_at",
            "updated_at",'markdown'
        ]

    def get_tag_count(self, obj):
        return obj.tags.count()

    def get_manifest_count(self, obj):
        return obj.manifests.count()


class UploadSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for the UploadSession model.
    repo_name is a read-only convenience field derived from the FK.
    """
    repo_name = serializers.CharField(source="repo.name", read_only=True)

    class Meta:
        model = UploadSession
        fields = [
            "id",
            "repo",
            "repo_name",
            "offset",
            "status",
            "created_at",
            "updated_at",
        ]


class BlobSerializer(serializers.ModelSerializer):
    """
    Serializer for the Blob model.
    storage_path is intentionally exposed for admin/debug purposes
    but can be hidden by overriding fields in a subclass if needed.
    """

    class Meta:
        model = Blob
        fields = [
            "digest",
            "size",
            "created_at",
        ]


class ManifestSerializer(serializers.ModelSerializer):
    """
    Serializer for the Manifest model.
    'content' is intentionally excluded – it is a large binary field
    served correctly only by the streaming pull endpoint.
    """

    class Meta:
        model = Manifest
        fields = [
            "digest",
            "media_type",
            "created_at",
        ]


class RepositoryManifestSerializer(serializers.ModelSerializer):
    """
    Serializer for the RepositoryManifest join model.
    Exposes denormalized name fields for convenient reading.
    """
    repository_name = serializers.CharField(source="repository.name", read_only=True)
    manifest_digest = serializers.CharField(source="manifest.digest", read_only=True)
    manifest_media_type = serializers.CharField(source="manifest.media_type", read_only=True)

    class Meta:
        model = RepositoryManifest
        fields = [
            "id",
            "repository",
            "repository_name",
            "manifest",
            "manifest_digest",
            "manifest_media_type",
        ]


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tag model.
    Includes denormalized fields for the linked manifest digest.
    """
    repository_name = serializers.CharField(source="repository.name", read_only=True)
    manifest_digest = serializers.CharField(source="manifest.digest", read_only=True)
    manifest_media_type = serializers.CharField(source="manifest.media_type", read_only=True)

    class Meta:
        model = Tag
        fields = [
            "id",
            "repository",
            "repository_name",
            "name",
            "manifest",
            "manifest_digest",
            "manifest_media_type",
            "updated_at",
        ]
        
