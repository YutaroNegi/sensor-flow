import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDB } from 'aws-sdk';
import { GetSensorAggregatedDto } from './dto/create-aggregated.dto';

@Injectable()
export class SensorAggregatedService {
  private tableName: string;

  constructor(
    private configService: ConfigService,
    @Inject('DynamoDBDocumentClient') private dynamoDb: DynamoDB.DocumentClient,
  ) {
    this.tableName = this.configService.get<string>(
      'DYNAMODB_AGGREGATE_TABLE_NAME',
    );
  }

  async get(query: GetSensorAggregatedDto): Promise<any> {
    const { interval } = query;

    const intervalMap: Record<string, number> = {
      '24h': 24,
      '48h': 48,
      '1w': 168,
      '1m': 720,
    };

    const hours = intervalMap[interval];
    if (!hours) {
      throw new Error(
        'Invalid interval provided. Use "24h", "48h", "1w", or "1m".',
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const startTime = now - hours * 3600;

    try {
      let items: DynamoDB.DocumentClient.ItemList = [];
      let lastEvaluatedKey: DynamoDB.DocumentClient.Key | undefined = undefined;
      let params: DynamoDB.DocumentClient.QueryInput;

      params = {
        TableName: this.tableName,
        IndexName: 'partitionKey-intervalStartTime-index',
        KeyConditionExpression:
          '#partitionKey = :partitionKey AND #intervalStartTime >= :startTime',
        ExpressionAttributeNames: {
          '#partitionKey': 'partitionKey',
          '#intervalStartTime': 'intervalStartTime',
        },
        ExpressionAttributeValues: {
          ':partitionKey': 'GLOBAL',
          ':startTime': startTime,
        },
      };

      do {
        if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await this.dynamoDb.query(params).promise();

        items = items.concat(result.Items || []);
        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      const totalValue = items.reduce(
        (sum, item) => sum + (item.totalValue || 0),
        0,
      );
      const totalCount = items.reduce(
        (sum, item) => sum + (item.sampleCount || 0),
        0,
      );
      const average = totalCount > 0 ? totalValue / totalCount : 0;

      return {
        average,
        totalCount,
        items,
      };
    } catch (error) {
      throw new Error(
        `Error retrieving aggregated sensor data in DynamoDB: ${error.message}`,
      );
    }
  }
}
