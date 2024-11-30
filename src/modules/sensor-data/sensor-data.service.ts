import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDB, S3 } from 'aws-sdk';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SensorDataService {
  private tableName: string;
  private s3BucketName: string;

  constructor(
    private configService: ConfigService,
    @Inject('DynamoDBDocumentClient') private dynamoDb: DynamoDB.DocumentClient,
    @Inject('S3Client') private s3: S3,
  ) {
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME');
    this.s3BucketName = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async createSensorData(
    createSensorDataDto: CreateSensorDataDto,
  ): Promise<any> {
    const id = uuidv4();
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: {
        id,
        equipmentId: createSensorDataDto.equipmentId,
        timestamp: createSensorDataDto.timestamp,
        value: createSensorDataDto.value,
        register_time: new Date().toISOString(),
      },
    };

    try {
      await this.dynamoDb.put(params).promise();
      return { message: 'Data saved successfully', id };
    } catch (error) {
      throw new Error(`Error saving data to DynamoDB: ${error.message}`);
    }
  }

  async uploadCsvFile(file: Express.Multer.File): Promise<any> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const params: S3.PutObjectRequest = {
      Bucket: this.s3BucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.putObject(params).promise();
      return { message: 'File uploaded successfully', fileName };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error uploading file to S3: ${error.message}`,
      );
    }
  }
}
