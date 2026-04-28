# Migrate Library Book Cover Images to S3

## Context

The library system previously stored book cover images as local files in
`next/public/library-assets/{ISBN}.jpg`. The code has been updated to store
images in S3 under the key prefix `uploads/library-books/{ISBN}/`. Existing
books in the database still have their `image` field set to a local path like
`/library-assets/9780131103627.jpg` and their `imageKey` field is `NULL`.

This script needs to run **once** on the eggs server (or any machine with access
to the env vars and the repo's `public/library-assets/` directory) to upload the
existing images to S3 and update the database.

## Prerequisites

The following environment variables must be set (they should already be in the
server's `.env`):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_REGION`
- `AWS_S3_BUCKET_NAME`
- `DATABASE_URL` (PostgreSQL connection string)

## Steps

### 1. Run the Prisma migration (if not already applied)

```bash
cd next
npx prisma migrate deploy
```

This applies the `20260316000000_add_textbook_image_key` migration that adds
the `imageKey` column to the `Textbooks` table.

### 2. Upload images and update the database

Run this Node.js script from the `next/` directory:

```bash
node -e "
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'library-assets');

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.AWS_S3_BUCKET_NAME;
const prisma = new PrismaClient();

async function main() {
  // Get all books that don't have an imageKey yet
  const books = await prisma.textbooks.findMany({
    where: { imageKey: null },
    select: { ISBN: true, image: true },
  });

  console.log('Found ' + books.length + ' books without S3 imageKey');

  for (const book of books) {
    // Try to find the local file
    // image field is like '/library-assets/9780131103627.jpg'
    const filename = book.image ? path.basename(book.image) : book.ISBN + '.jpg';
    const localPath = path.join(ASSETS_DIR, filename);

    if (!fs.existsSync(localPath)) {
      console.log('SKIP ' + book.ISBN + ' — no local file at ' + localPath);
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);
    const ext = path.extname(filename).slice(1) || 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const key = 'uploads/library-books/' + book.ISBN + '/' + Date.now() + '-cover.' + ext;

    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'no-store, max-age=0',
    }));

    // Update database
    await prisma.textbooks.update({
      where: { ISBN: book.ISBN },
      data: { imageKey: key },
    });

    console.log('OK ' + book.ISBN + ' -> ' + key);
  }

  console.log('Done!');
  await prisma.\$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
"
```

### 3. Verify

After running, confirm that:

1. All books now have an `imageKey` value:
   ```sql
   SELECT "ISBN", "imageKey" FROM "Textbooks";
   ```
2. The images are accessible via the proxy:
   ```
   curl -I https://sse.rit.edu/api/aws/image?key=uploads/library-books/<ISBN>/<timestamp>-cover.jpg
   ```
3. The catalog pages display the book covers correctly.

### 4. (Optional) Clean up local assets

Once confirmed working, the files in `next/public/library-assets/` can be
removed from the repo since they're now served from S3. The `localPatterns`
entry for `/library-assets/**` in `next.config.js` can also be removed at that
point.

## Existing local image files

These are the files currently in `next/public/library-assets/`:

- `9780131103627.jpg`
- `9780201633610.jpg`
- `9781305251809.jpg`
- `9781556159006.jpg`
