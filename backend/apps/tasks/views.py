from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import services
from .filters import TaskFilter
from .models import Category, Task
from .permissions import IsOwnerOrReadOnly
from .serializers import CategorySerializer, TaskSerializer


class TaskPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    pagination_class = TaskPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "budget"]
    ordering = ["-created_at"]
    # No PUT and no DELETE: tasks are edited with PATCH and cancelled, never deleted.
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Task.objects.select_related("owner", "category")
        if self.action == "list":
            return queryset.filter(status=Task.Status.OPEN)  # public browse: open tasks only
        if self.action == "mine":
            return queryset.filter(owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        # The owner always comes from the login, never from the request body.
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        serializer.instance = services.update_task(
            task=serializer.instance, validated_data=serializer.validated_data
        )

    @action(detail=False, methods=["get"])
    def mine(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        task = self.get_object()  # object permission: only the owner passes
        task = services.cancel_task(task=task)
        return Response(self.get_serializer(task).data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = None