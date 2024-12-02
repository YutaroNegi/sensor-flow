from locust import HttpUser, task, between
import random
from datetime import datetime, timezone, timedelta

class SensorDataUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def send_sensor_data(self):
        sensor_data = {
            "equipmentId": f"EQ-{random.randint(10000, 99999)}",
            "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=random.randint(0, 60))).isoformat(),
            "value": round(random.uniform(20.0, 100.0), 2)
        }

        with self.client.post("/sensor-data", json=sensor_data, catch_response=True) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"Failed to send data: {response.status_code}")
