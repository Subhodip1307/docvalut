from django.db import models
import  uuid,os
from django.conf import settings
#TODO: Create an api for cli to push all digest of all layers to store them in a model
class Repository(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid7,editable=False)
    name=models.CharField(max_length=100)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    icon=models.ImageField(null=True,blank=True,upload_to='repo_icons/%Y/%m/%d/')
    description = models.TextField(blank=True, default="")
    markdown=models.TextField(blank=True,null=True)
    created_by=models.ForeignKey("accounts.User",on_delete=models.CASCADE)
    
class UploadSession(models.Model):
    ROLE_CHOICES = [
        ("aborted", "Aborted"),
        ("pending", "Pending"),
        ("completed", "Completed"),
    ]
    id = models.UUIDField(primary_key=True,default=uuid.uuid7,editable=False)
    repo=models.ForeignKey(Repository,on_delete=models.CASCADE)
    offset=models.BigIntegerField(default=0)#Number of bytes received
    status=models.CharField(choices=ROLE_CHOICES,max_length=20)
    # temp_path=models.CharField(max_length=500)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def get_upload_path(self):
        return os.path.join(settings.MEDIA_ROOT, "registry", "uploads")

    def get_temp_path(self):
        return os.path.join(self.get_upload_path(), str(self.id))


    
class Blob(models.Model):
    session=models.ForeignKey(UploadSession,on_delete=models.CASCADE)
    digest = models.CharField(max_length=71, primary_key=True)
    size = models.BigIntegerField()
    storage_path = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)


class Manifest(models.Model):
    digest = models.CharField(max_length=71, primary_key=True)
    media_type = models.CharField(max_length=255)
    content = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)


class RepositoryManifest(models.Model):
    repository = models.ForeignKey(Repository,on_delete=models.CASCADE,related_name="manifests")
    manifest = models.ForeignKey(Manifest,on_delete=models.CASCADE,related_name="repositories")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["repository", "manifest"],
                name="unique_repository_manifest"
            )
        ]


class Tag(models.Model):
    repository = models.ForeignKey(Repository,on_delete=models.CASCADE,related_name="tags")
    name = models.CharField(max_length=128)
    manifest = models.ForeignKey(Manifest,on_delete=models.PROTECT,related_name="tags")
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["repository", "name"],
                name="unique_repository_tag"
            )
        ]