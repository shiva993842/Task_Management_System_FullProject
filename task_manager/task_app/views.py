from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count
from .models import Task
from .serializers import TaskSerializer
from datetime import datetime

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Task.objects.all()

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.filter(user=user)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
            
        # Filter by priority
        priority_param = self.request.query_params.get('priority', None)
        if priority_param and priority_param != 'all':
            queryset = queryset.filter(priority=priority_param)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get task statistics for the current user
        """
        user_tasks = self.get_queryset()
        stats = {
            'total': user_tasks.count(),
            'completed': user_tasks.filter(status='completed').count(),
            'pending': user_tasks.filter(status='pending').count(),
            'in_progress': user_tasks.filter(status='in-progress').count()
        }
        return Response(stats)

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get completed tasks with completion dates"""
        completed_tasks = self.get_queryset().filter(
            status='completed'
        ).order_by('-completed_at')
        
        tasks_data = [{
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None
        } for task in completed_tasks]
        
        return Response(tasks_data)

    def perform_update(self, serializer):
        """Update completion date when task is marked as completed"""
        if serializer.validated_data.get('status') == 'completed':
            serializer.save(completed_at=datetime.now())
        else:
            serializer.save()
