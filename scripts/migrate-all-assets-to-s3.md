# Migrate All Static Assets to S3

## Context

The website repo stores static images in `next/public/` that are served locally
by Next.js. In production (eggs server), these assets need to live in S3 so the
standalone Docker build can serve them. The upload infrastructure already exists
in the codebase — this is a **one-time migration** to seed S3 with the existing
files.

There are three categories of assets to migrate:

| Category | Local path | S3 key prefix | Count | Notes |
|---|---|---|---|---|
| **Library book covers** | `next/public/library-assets/*.jpg` | `uploads/library-books/{ISBN}/` | 4 | Also requires DB update (`imageKey` column) |
| **Library/mentor portal icons** | `next/public/library-icons/*.png` | `uploads/library-icons/` | 16 | Referenced as `/library-icons/*.png` in code |
| **General site images** | `next/public/images/**` | `uploads/images/` | ~36 | Hero images, event photos, sponsor logos, etc. |

After this migration, newly uploaded images (book covers, profile pictures) will
go to S3 automatically via the existing upload code. Only these legacy files need
the manual push.

---

## Agent Prompt (for an agent with shell access to the eggs server)

> **Task:** Upload all static image assets from the SSE website repo to the
> project's S3 bucket, and update the database for library book covers.
>
> ### Environment
>
> You have access to the eggs server. The following environment variables are
> already set in the server's `.env` (source it or export them):
>
> - `AWS_ACCESS_KEY_ID`
> - `AWS_SECRET_ACCESS_KEY`
> - `AWS_S3_REGION`
> - `AWS_S3_BUCKET_NAME`
> - `DATABASE_URL` (PostgreSQL connection string)
>
> The repo is cloned on the server. The `next/` directory contains the app.
> All commands below should be run from the `next/` directory.
>
> ### Prerequisites
>
> Make sure the AWS CLI v2 and Node.js 20+ are available, or install them:
>
> ```bash
> # Verify
> aws --version
> node --version
> ```
>
> Export the env vars so both `aws` CLI and Node can use them:
>
> ```bash
> source .env  # or export them manually
> ```
>
> ---
>
> ### Step 1: Upload library-icons to S3
>
> These 16 PNG icons are used by the mentor portal UI. They must land at
> `uploads/library-icons/{filename}` in the bucket so the app can serve them.
>
> ```bash
> for file in public/library-icons/*.png; do
>   filename=$(basename "$file")
>   key="uploads/library-icons/$filename"
>   aws s3 cp "$file" "s3://$AWS_S3_BUCKET_NAME/$key" \
>     --content-type "image/png" \
>     --cache-control "public, max-age=31536000, immutable"
>   echo "Uploaded $key"
> done
> ```
>
> **Expected files:** book.png, category.png, checkmark.png, database.png,
> error.png, explore.png, information.png, openfile.png, pencil.png,
> pinned.png, pinsmall.png, search-web.png, search.png, trash-it.png,
> underconstruction.png, world.png
>
> ---
>
> ### Step 2: Upload general site images to S3
>
> These are event photos, project images, sponsor logos, etc. used across the
> site. They must land at `uploads/images/{relative-path}` preserving the
> subdirectory structure (e.g. `sponsors/gcis.png` → `uploads/images/sponsors/gcis.png`).
>
> ```bash
> cd public/images
> find . -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" \) | while read file; do
>   # Strip leading ./
>   relpath="${file#./}"
>   key="uploads/images/$relpath"
>   
>   # Detect content type
>   ext="${file##*.}"
>   case "$ext" in
>     jpg|jpeg) ct="image/jpeg" ;;
>     png)      ct="image/png" ;;
>     gif)      ct="image/gif" ;;
>     svg)      ct="image/svg+xml" ;;
>     *)        ct="application/octet-stream" ;;
>   esac
>   
>   aws s3 cp "$file" "s3://$AWS_S3_BUCKET_NAME/$key" \
>     --content-type "$ct" \
>     --cache-control "public, max-age=31536000, immutable"
>   echo "Uploaded $key"
> done
> cd ../..
> ```
>
> Also upload the root-level public images (kitty cats, puppers, talks, etc.):
>
> ```bash
> for file in public/*.jpg public/*.png public/*.svg; do
>   [ -f "$file" ] || continue
>   filename=$(basename "$file")
>   # Skip Next.js/Vercel built-in assets
>   case "$filename" in next.svg|vercel.svg|favicon.ico) continue ;; esac
>   key="uploads/root/$filename"
>   
>   ext="${filename##*.}"
>   case "$ext" in
>     jpg|jpeg) ct="image/jpeg" ;;
>     png)      ct="image/png" ;;
>     svg)      ct="image/svg+xml" ;;
>     *)        ct="application/octet-stream" ;;
>   esac
>   
>   aws s3 cp "$file" "s3://$AWS_S3_BUCKET_NAME/$key" \
>     --content-type "$ct" \
>     --cache-control "public, max-age=31536000, immutable"
>   echo "Uploaded $key"
> done
> ```
>
> ---
>
> ### Step 3: Upload library book covers and update the database
>
> This uploads the 4 book cover JPEGs and sets the `imageKey` column in the
> `Textbooks` table so the app resolves them from S3 instead of the local path.
>
> ```bash
> node -e "
> const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
> const { PrismaClient } = require('@prisma/client');
> const fs = require('fs');
> const path = require('path');
>
> const ASSETS_DIR = path.join(__dirname, 'public', 'library-assets');
>
> const s3 = new S3Client({
>   region: process.env.AWS_S3_REGION,
>   credentials: {
>     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
>     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
>   },
> });
> const bucket = process.env.AWS_S3_BUCKET_NAME;
> const prisma = new PrismaClient();
>
> async function main() {
>   const books = await prisma.textbooks.findMany({
>     where: { imageKey: null },
>     select: { ISBN: true, image: true },
>   });
>
>   console.log('Found ' + books.length + ' books without S3 imageKey');
>
>   for (const book of books) {
>     const filename = book.image ? path.basename(book.image) : book.ISBN + '.jpg';
>     const localPath = path.join(ASSETS_DIR, filename);
>
>     if (!fs.existsSync(localPath)) {
>       console.log('SKIP ' + book.ISBN + ' — no local file at ' + localPath);
>       continue;
>     }
>
>     const fileBuffer = fs.readFileSync(localPath);
>     const ext = path.extname(filename).slice(1) || 'jpg';
>     const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
>     const key = 'uploads/library-books/' + book.ISBN + '/' + Date.now() + '-cover.' + ext;
>
>     await s3.send(new PutObjectCommand({
>       Bucket: bucket,
>       Key: key,
>       Body: fileBuffer,
>       ContentType: contentType,
>       CacheControl: 'no-store, max-age=0',
>     }));
>
>     await prisma.textbooks.update({
>       where: { ISBN: book.ISBN },
>       data: { imageKey: key },
>     });
>
>     console.log('OK ' + book.ISBN + ' -> ' + key);
>   }
>
>   console.log('Done!');
>   await prisma.\$disconnect();
> }
>
> main().catch(e => { console.error(e); process.exit(1); });
> "
> ```
>
> ---
>
> ### Step 4: Verify
>
> 1. **Library icons** — confirm they exist in S3:
>    ```bash
>    aws s3 ls "s3://$AWS_S3_BUCKET_NAME/uploads/library-icons/" | wc -l
>    # Should be 16
>    ```
>
> 2. **General images** — spot-check a few:
>    ```bash
>    aws s3 ls "s3://$AWS_S3_BUCKET_NAME/uploads/images/" --recursive | head -20
>    ```
>
> 3. **Book covers** — verify DB was updated:
>    ```bash
>    node -e "
>    const { PrismaClient } = require('@prisma/client');
>    const prisma = new PrismaClient();
>    prisma.textbooks.findMany({ select: { ISBN: true, imageKey: true } })
>      .then(rows => { console.table(rows); prisma.\$disconnect(); });
>    "
>    ```
>
> 4. **HTTP check** — confirm the image proxy works:
>    ```bash
>    curl -sI "https://sse.rit.edu/api/aws/image?key=uploads/library-icons/world.png" | head -5
>    # Should return 200 with content-type: image/png
>    ```

---

## Code Changes Required After Migration

After the S3 upload is done, the **codebase** needs updates so the mentor portal
icons (and other images) are loaded from S3 instead of the local `/library-icons/`
path. See the companion document below.

---

## Migration Plan: Library Icons → S3

The mentor portal icons are currently hardcoded as local paths like
`/library-icons/world.png` across 8 files (22 references total). After uploading
them to `uploads/library-icons/` in S3, the code needs to serve them through the
existing `/api/aws/image` proxy.

### Option A: Proxy rewrite (zero code changes)

Add a Next.js rewrite in `next.config.js` so `/library-icons/:path*` is
transparently proxied to the S3 image API:

```js
async rewrites() {
    return [
        {
            source: "/library-icons/:path*",
            destination: "/api/aws/image?key=uploads/library-icons/:path*",
        },
    ];
},
```

This means all existing `<Image src="/library-icons/world.png" .../>` references
keep working with no component changes. The Next.js Image component will need
the `localPatterns` entry for `/library-icons/**` removed and a `remotePatterns`
or `unoptimized` adjustment since the source is now a rewrite to an API route.

### Option B: Update all references (more explicit)

Create a helper and update all 22 references:

```ts
// lib/iconUtils.ts
export function libraryIcon(name: string): string {
  return `/api/aws/image?key=${encodeURIComponent(`uploads/library-icons/${name}`)}`;
}
```

Then replace `"/library-icons/world.png"` → `{libraryIcon("world.png")}` in each
file.

### Recommendation

**Option A** is the simplest path — one config change, zero component edits, and
the icons work immediately after the S3 upload. Option B is cleaner long-term but
touches 8 files.

### Files referencing `/library-icons/`

| File | References |
|---|---|
| `next/app/library/mentorportal/layout.tsx` | 5 |
| `next/app/library/mentorportal/editbook/page.tsx` | 4 |
| `next/app/library/mentorportal/addbook/page.tsx` | 4 |
| `next/components/library/mentorportal/category.tsx` | 4 |
| `next/app/library/mentorportal/page.tsx` | 2 |
| `next/app/library/mentorportal/category/page.tsx` | 1 |
| `next/app/library/mentorportal/exam-management/page.tsx` | 1 |
| `next/components/library/mentorportal/newcategory.tsx` | 1 |
