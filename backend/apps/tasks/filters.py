import django_filters

from .models import Task


class TaskFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    city = django_filters.CharFilter(field_name="city", lookup_expr="iexact")
    min_budget = django_filters.NumberFilter(field_name="budget", lookup_expr="gte")
    max_budget = django_filters.NumberFilter(field_name="budget", lookup_expr="lte")

    class Meta:
        model = Task
        fields = ["category", "city", "min_budget", "max_budget"]