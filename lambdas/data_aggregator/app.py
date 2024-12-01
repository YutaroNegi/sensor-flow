import boto3
import os
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")

def lambda_handler(event, context):

    for record in event["Records"]:
        if record["eventName"] == "INSERT" or record["eventName"] == "MODIFY":
            new_image = record["dynamodb"]["NewImage"]

            equipment_id = new_image["equipmentId"]["S"]
            timestamp_str = new_image["timestamp"]["S"]
            value = Decimal(new_image["value"]["N"])

            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            interval_start = timestamp.replace(
                minute=0, second=0, microsecond=0, tzinfo=timezone.utc
            )
            # converting to unix timestamp for more efficient storage and querying
            interval_start_unix = int(interval_start.timestamp())

            update_aggregate_table(equipment_id, interval_start_unix, value)


def update_aggregate_table(equipment_id, interval_start_unix, value):
    try:
        aggregate_table = dynamodb.Table(os.environ["AGGREGATE_TABLE_NAME"])
        aggregate_table.update_item(
            Key={"equipmentId": equipment_id, "intervalStartTime": interval_start_unix},
            UpdateExpression="SET totalValue = if_not_exists(totalValue, :zero) + :val, sampleCount = if_not_exists(sampleCount, :zero) + :one, partitionKey = :global",
            ExpressionAttributeValues={
                ":val": value,
                ":one": Decimal(1),
                ":zero": Decimal(0),
                ":global": "GLOBAL",
            },
            ReturnValues="UPDATED_NEW",
        )
    except Exception as e:
        print(f"Erro ao atualizar a tabela de agregados: {e}")


if __name__ == "__main__":
    os.environ["AGGREGATE_TABLE_NAME"] = "sensor-flow-aggregates"
    payload = {
        "equipmentId": "EQ-12495",
        "timestamp": "2023-02-15T01:30:00.000-05:00",
        "value": 78.42,
    }

    event = {
        "Records": [
            {
                "eventName": "INSERT",
                "dynamodb": {
                    "NewImage": {
                        "equipmentId": {"S": payload["equipmentId"]},
                        "timestamp": {"S": payload["timestamp"]},
                        "value": {"N": str(payload["value"])},
                    }
                },
            }
        ]
    }

    lambda_handler(event, None)
