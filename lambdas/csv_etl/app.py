import boto3
import pandas as pd
import os
import json
from datetime import datetime
from decimal import Decimal
from urllib.parse import unquote_plus
from botocore.exceptions import ClientError
import io
from unittest.mock import Mock
import uuid

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, context):
    DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE")

    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = unquote_plus(event["Records"][0]["s3"]["object"]["key"])
    print(f"file: s3://{bucket}/{key}")

    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response["Body"].read().decode("utf-8")

        df = pd.read_csv(io.StringIO(content))

        table = dynamodb.Table(DYNAMODB_TABLE)

        for index, row in df.iterrows():
            equipment_id = row.get("equipmentId")
            timestamp = row.get("timestamp")
            value = row.get("value")
            register_time = datetime.now().isoformat()

            if pd.isnull(equipment_id) or pd.isnull(timestamp) or pd.isnull(value):
                print(f"line {index} malformed: {row.to_dict()}")
                continue

            try:
                table.put_item(
                    Item={
                        "id": str(uuid.uuid4()),
                        "equipmentId": str(equipment_id),
                        "value": Decimal(str(value)),
                        "timestamp": str(timestamp),
                        "registerTime": register_time,
                    }
                )
                print(f"Item inserted: {equipment_id}, {timestamp}, {value}")
            except Exception as e:
                print(f"Error inserting item into DynamoDB: {e}")
                continue

        return {
            "statusCode": 200,
            "body": json.dumps(
                "File processed and data successfully inserted into DynamoDB."
            ),
        }
    except Exception as e:
        print(f"General error: {e}")
        return {"statusCode": 500, "body": json.dumps("Internal server error.")}


if __name__ == "__main__":
    os.environ["DYNAMODB_TABLE"] = "sensor-flow-table"

    test_event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "sensor-flow-data"},
                    "object": {"key": "5312b9d4-3662-4f4e-89a6-53141b3bd9d7-radix.csv"},
                }
            }
        ]
    }

    def mock_get_object(Bucket, Key):
        csv_content = '''"equipmentId","timestamp","value"
"EQ-12492","2023-01-12T01:30:00.000-05:00","78.8"
"EQ-12495","2023-02-12T01:30:00.000-05:00","8.8"'''
        return {"Body": io.BytesIO(csv_content.encode("utf-8"))}

    s3_client.get_object = Mock(side_effect=mock_get_object)
    lambda_handler(test_event, None)
