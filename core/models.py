from django.db import models
from django.contrib.auth.models import User
import uuid

class SyncableModel(models.Model):
    """Base model for offline-syncable entities"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_synced = models.BooleanField(default=False)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
        

class Task(SyncableModel):
    title = models.CharField(max_length=200)
    description = models.TextField()
    completed = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    

class SyncLog(models.Model):
    """Track sync operations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    operation = models.CharField(max_length=20)  # 'create', 'update', 'delete'
    model_name = models.CharField(max_length=50)
    object_id = models.UUIDField()
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(null=True, blank=True)