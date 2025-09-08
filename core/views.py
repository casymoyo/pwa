from django.shortcuts import render 
from rest_framework.viewsets import  viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timesince
from .serializers import TaskSerializer
from .models import Task, SyncLog
from django.utils import timezone
from loguru import logger
from rest_framework.permissions import IsAuthenticated

class TaskView(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter()
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """ handled bulk sync operations """
        client_data = request.data.get('data', [])
        last_sync = request.data.get('last_sync')
        
        
        # server changes since last sync
        if last_sync:
            server_changes = Task.objects.filter(
                user=request.user,
                updated_at__gt=last_sync
            )
        else:
            server_changes = Task.objects.filter(user=request.user)
        
        
        #process client changes
        conflicts = []
        for item in client_data:
            try:
                if item['operation'] == 'create':
                    task = Task.objects.create(
                        id=item['id'],
                        title=item['title'],
                        description=item['description'],
                        completed=item['completed'],
                        user=request.user
                    )
                    
                    logger.succes(f'Task created: {task.id}')
                    
                elif item['operation'] == 'update':
                    task = Task.objects.get(id=item['id'], user=request.user)
                    # Check for conflicts
                    if task.updated_at > item['client_updated_at']:
                        conflicts.append({
                            'id': item['id'],
                            'server_version': TaskSerializer(task).data,
                            'client_version': item
                        })
                        continue
                    
                    task.title = item['title']
                    task.description = item['description']
                    task.completed = item['completed']
                    task.save()
                    
                    logger.info(f'Task updated: {task.id}')
                    
                elif item['operation'] == 'delete':
                    Task.objects.filter(id=item['id'], user=request.user).delete()
                    
                # Log successful sync
                SyncLog.objects.create(
                    user=request.user,
                    operation=item['operation'],
                    model_name='Task',
                    object_id=item['id']
                )
                
            except Exception as e:
                # Log failed sync
                SyncLog.objects.create(
                    user=request.user,
                    operation=item['operation'],
                    model_name='Task',
                    object_id=item['id'],
                    success=False,
                    error_message=str(e)
                )
                logger.error(f'Error syncing: {e}')
                
        return Response({
            'server_changes': TaskSerializer(server_changes, many=True).data,
            'conflicts': conflicts,
            'sync_timestamp': timezone.now().isoformat()
        })