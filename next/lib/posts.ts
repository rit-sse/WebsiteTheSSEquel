import path from 'path';
import fs from 'fs/promises';
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

const postsDirectory = path.join(process.cwd(), 'app', 'about', 'posts');
export async function getPostData(filename: string) {
  try {
    const fullPath = path.join(postsDirectory, filename);
    const markdown = await fs.readFile(fullPath, 'utf8');

    // Use remark to convert markdown into HTML string
    // const htmlContent = await remark().use(html).process(markdown);
    const htmlContent = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown)
    return {
      props: {
        htmlContent: htmlContent.toString(),
      },
    };
  } catch (error) {
    // Handle errors here, e.g., log them or throw a custom error
    console.error('Error reading or processing the file:', error);
    throw error;
  }
}