from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import Category, Task

LIST = "/api/tasks/"


def make_user(email, full_name="Test User"):
    return User.objects.create_user(email=email, password="Str0ng!pass123", full_name=full_name)


class TaskApiTests(APITestCase):
    def setUp(self):
        self.owner = make_user("owner@example.com", "Asha Patil")
        self.other = make_user("other@example.com", "Ravi Shah")
        self.errands = Category.objects.create(name="Errands", slug="errands")
        self.tech = Category.objects.create(name="Tech help", slug="tech-help")
        self.payload = {
            "category": "errands",
            "title": "Pick up a parcel",
            "description": "From the post office near the station.",
            "budget": 200,
            "city": "Mumbai",
            "area": "Borivali",
        }

    def make_task(self, **overrides):
        data = dict(
            owner=self.owner,
            category=self.errands,
            title="Task",
            description="Details",
            budget=300,
            city="Mumbai",
        )
        data.update(overrides)
        return Task.objects.create(**data)

    def login(self, user):
        self.client.force_authenticate(user=user)

    # ---- login required
    def test_anonymous_cannot_list_or_create(self):
        self.assertEqual(self.client.get(LIST).status_code, 401)
        self.assertEqual(self.client.post(LIST, self.payload, format="json").status_code, 401)

    def test_anonymous_cannot_see_categories(self):
        self.assertEqual(self.client.get("/api/categories/").status_code, 401)

    # ---- create
    def test_create_sets_owner_from_login_and_ignores_owner_and_status_in_body(self):
        self.login(self.owner)
        body = {**self.payload, "owner": str(self.other.pk), "status": "done"}
        response = self.client.post(LIST, body, format="json")
        self.assertEqual(response.status_code, 201)
        task = Task.objects.get(pk=response.data["id"])
        self.assertEqual(task.owner, self.owner)
        self.assertEqual(task.status, Task.Status.OPEN)
        self.assertEqual(len(response.data["id"]), 36)  # UUID

    def test_task_response_hides_owner_email_and_phone(self):
        self.login(self.owner)
        response = self.client.post(LIST, self.payload, format="json")
        self.assertEqual(set(response.data["owner"]), {"id", "full_name"})

    def test_create_rejects_bad_budget(self):
        self.login(self.owner)
        for budget in (0, -5):
            response = self.client.post(LIST, {**self.payload, "budget": budget}, format="json")
            self.assertEqual(response.status_code, 400, budget)
            self.assertIn("budget", response.data)

    def test_create_rejects_past_schedule(self):
        self.login(self.owner)
        past = (timezone.now() - timedelta(hours=1)).isoformat()
        response = self.client.post(LIST, {**self.payload, "scheduled_for": past}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("scheduled_for", response.data)

    def test_create_rejects_unknown_or_inactive_category(self):
        self.login(self.owner)
        self.assertEqual(
            self.client.post(LIST, {**self.payload, "category": "nope"}, format="json").status_code,
            400,
        )
        Category.objects.filter(slug="errands").update(is_active=False)
        self.assertEqual(self.client.post(LIST, self.payload, format="json").status_code, 400)

    # ---- browse
    def test_list_shows_only_open_tasks_and_is_paginated(self):
        self.make_task(title="Open one")
        self.make_task(title="Cancelled one", status=Task.Status.CANCELLED)
        self.login(self.other)
        response = self.client.get(LIST)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Open one")

    def test_list_filters_by_category_city_and_budget(self):
        self.make_task(title="A", category=self.errands, city="Mumbai", budget=100)
        self.make_task(title="B", category=self.tech, city="Pune", budget=500)
        self.login(self.other)

        def titles(query):
            return {t["title"] for t in self.client.get(f"{LIST}?{query}").data["results"]}

        self.assertEqual(titles("category=tech-help"), {"B"})
        self.assertEqual(titles("city=mumbai"), {"A"})
        self.assertEqual(titles("min_budget=200"), {"B"})
        self.assertEqual(titles("max_budget=200"), {"A"})
        self.assertEqual(titles("search=B"), {"B"})

    def test_mine_returns_only_my_tasks_including_cancelled(self):
        self.make_task(title="Mine open")
        self.make_task(title="Mine cancelled", status=Task.Status.CANCELLED)
        self.make_task(title="Not mine", owner=self.other)
        self.login(self.owner)
        titles = {t["title"] for t in self.client.get(f"{LIST}mine/").data["results"]}
        self.assertEqual(titles, {"Mine open", "Mine cancelled"})

    # ---- edit
    def test_owner_can_edit_own_open_task(self):
        task = self.make_task()
        self.login(self.owner)
        response = self.client.patch(f"{LIST}{task.pk}/", {"title": "New title"}, format="json")
        self.assertEqual(response.status_code, 200)
        task.refresh_from_db()
        self.assertEqual(task.title, "New title")

    def test_other_user_cannot_edit_task(self):
        task = self.make_task()
        self.login(self.other)
        response = self.client.patch(f"{LIST}{task.pk}/", {"title": "Hacked"}, format="json")
        self.assertEqual(response.status_code, 403)
        task.refresh_from_db()
        self.assertEqual(task.title, "Task")

    def test_cannot_change_status_by_editing(self):
        task = self.make_task()
        self.login(self.owner)
        self.client.patch(f"{LIST}{task.pk}/", {"status": "done"}, format="json")
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.OPEN)

    def test_cannot_edit_task_that_is_not_open(self):
        task = self.make_task(status=Task.Status.IN_PROGRESS)
        self.login(self.owner)
        response = self.client.patch(f"{LIST}{task.pk}/", {"title": "x"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_delete_and_put_are_not_allowed(self):
        task = self.make_task()
        self.login(self.owner)
        self.assertEqual(self.client.delete(f"{LIST}{task.pk}/").status_code, 405)
        self.assertEqual(self.client.put(f"{LIST}{task.pk}/", self.payload, format="json").status_code, 405)

    # ---- cancel
    def test_owner_can_cancel_open_task(self):
        task = self.make_task()
        self.login(self.owner)
        response = self.client.post(f"{LIST}{task.pk}/cancel/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "cancelled")

    def test_other_user_cannot_cancel_task(self):
        task = self.make_task()
        self.login(self.other)
        self.assertEqual(self.client.post(f"{LIST}{task.pk}/cancel/").status_code, 403)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.OPEN)

    def test_cannot_cancel_twice(self):
        task = self.make_task()
        self.login(self.owner)
        self.client.post(f"{LIST}{task.pk}/cancel/")
        self.assertEqual(self.client.post(f"{LIST}{task.pk}/cancel/").status_code, 400)

    def test_cancel_requires_post(self):
        task = self.make_task()
        self.login(self.owner)
        self.assertEqual(self.client.get(f"{LIST}{task.pk}/cancel/").status_code, 405)