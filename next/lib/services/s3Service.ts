import {
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getBucketName } from "@/lib/S3Client";

export interface IS3Service {
  listObjects(prefix: string): Promise<string[]>;
  getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  getSignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

export class S3Service implements IS3Service {
  private client = getS3Client();
  private bucket = getBucketName();

  async listObjects(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });
    const response = await this.client.send(command);
    return response.Contents?.map((obj) => obj.Key!) ?? [];
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
      CacheControl: "no-store, max-age=0",
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }
}

// Default instance, swap in tests via constructor or mock
export const s3Service = new S3Service();