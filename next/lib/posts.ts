import path from 'path';
import fs from 'fs/promises';
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'
import remarkGfm from 'remark-gfm'

const postsDirectory = path.join(process.cwd(), 'app', 'about', 'posts');
export async function getPostData(url: string) {
  try {
    const markdown = await fetch(url)

    // This content is fetched server-side from the SSE governing-docs repo and
    // sanitized before rendering, so the downstream dangerouslySetInnerHTML
    // calls only receive trusted, cleaned HTML.
    const htmlContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(await markdown.text())

    //console.dir(htmlContent)
    return {
      props: {
        htmlContent: htmlContent.value,
      },
    };
  } catch (error) {
    // Handle errors here, e.g., log them or throw a custom error
    console.error('Error reading or processing the file:', error);
    throw error;
  }
}
