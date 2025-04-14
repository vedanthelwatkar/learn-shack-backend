import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "ap-south-1" });

export const getS3 = async (req, res) => {
  const { bucketName, prefix } = req.body;

  if (!bucketName || !prefix) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: bucketName and prefix",
    });
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const result = await s3.send(command);

    if (!result || !result.Contents || result.Contents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No files found in the specified folder.",
      });
    }

    const fileUrls = result.Contents.filter((obj) => obj.Key) // optionally filter out folders if needed
      .map((obj) => ({
        key: obj.Key,
        url: `https://${bucketName}.s3.ap-south-1.amazonaws.com/${obj.Key}`,
      }));

    return res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: fileUrls,
    });
  } catch (error) {
    console.error("Error fetching files from S3:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch files from S3",
      error: error.message || "Internal Server Error",
    });
  }
};
