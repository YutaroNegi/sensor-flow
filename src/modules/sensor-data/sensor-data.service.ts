import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDB } from 'aws-sdk';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

@Injectable()
export class SensorDataService {
  private dynamoDb: DynamoDB.DocumentClient;
  private tableName: string;

  constructor(private configService: ConfigService) {
    this.dynamoDb = new DynamoDB.DocumentClient({
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME');
  }

  async createSensorData(createSensorDataDto: CreateSensorDataDto): Promise<any> {
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: {
        equipmentId: createSensorDataDto.equipmentId,
        timestamp: createSensorDataDto.timestamp,
        value: createSensorDataDto.value,
        register_time: new Date().toISOString(),
      },
    };

    try {
      await this.dynamoDb.put(params).promise();
      return { message: 'Data saved successfully' };
    } catch (error) {
      throw new Error(`Error saving data to DynamoDB: ${error.message}`);
    }
  }
}