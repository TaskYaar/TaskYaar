from django.test import TestCase


class TaskApiTests(TestCase):
    def test_create_and_list(self):
        resp = self.client.post(
            "/api/tasks/", {"title": "First task"}, content_type="application/json"
        )
        self.assertEqual(resp.status_code, 201)
        resp = self.client.get("/api/tasks/")
        self.assertEqual(len(resp.json()), 1)

    def test_health(self):
        self.assertEqual(self.client.get("/api/health/").json(), {"status": "ok"})
