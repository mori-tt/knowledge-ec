import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import yaml from "js-yaml";
import {
  GitHubItem,
  Article,
  Book,
  ParsedMarkdown,
  ArticleFrontMatter,
  BookConfig,
} from "../types/github";

// 今回使用するコンテンツのリポジトリ
const REPO_OWNER = "b13o";
const REPO_NAME = "dummy-ec-content";

// GitHub API URL
const RAW_CONTENT_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// リポジトリのコンテンツを取得する
export async function fetchDirectoryContents(
  path: string
): Promise<GitHubItem[]> {
  const response = await fetch(`${API_URL}/${path}`, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return await response.json();
}

// ファイルの内容を取得する
export async function fetchFileContent(path: string) {
  const response = await fetch(`${RAW_CONTENT_URL}/${path}`, {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  return await response.text();
}

// YAMLファイルをパースする
export function parseYaml<T>(content: string): T {
  try {
    return yaml.load(content) as T;
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error}`);
  }
}

// Markdownをパースして、フロントマターとHTML化した内容を返す
export async function parseMarkdown(markdown: string): Promise<ParsedMarkdown> {
  // gray-matterでフロントマターを解析
  const { data, content } = matter(markdown);

  // remarkでMarkdownをHTMLに変換
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(content);

  return {
    frontMatter: data as ArticleFrontMatter,
    content: processedContent.toString(),
  };
}

// 記事一覧を取得
export async function fetchArticles(): Promise<Article[]> {
  const contents = await fetchDirectoryContents("articles");

  // .keepファイルやディレクトリを除外
  const articleFiles = contents.filter(
    (item: GitHubItem) =>
      item.type === "file" &&
      item.name.endsWith(".md") &&
      !item.name.startsWith(".")
  );

  // 各記事のデータを取得
  const articles = await Promise.all(
    articleFiles.map(async (file) => {
      const markdown = await fetchFileContent(`articles/${file.name}`);

      const { frontMatter, content } = await parseMarkdown(markdown);

      return {
        id: file.name.replace(".md", ""),
        title: frontMatter.title || "タイトルなし",
        tags: frontMatter.topics || [],
        price: frontMatter.price || 0,
        isPaid: !!frontMatter.price && frontMatter.price > 0,
        emoji: frontMatter.emoji || "📝",
        createdAt: frontMatter.published_at || new Date().toISOString(),
        updatedAt:
          frontMatter.updated_at ||
          frontMatter.published_at ||
          new Date().toISOString(),
        content: content,
      };
    })
  );

  // nullを除外して返す
  return articles.filter((article) => article !== null);
}

// 本の一覧を取得
export async function fetchBooks(): Promise<Book[]> {
  const contents = await fetchDirectoryContents("books");

  // ディレクトリのみを取得
  const bookDirectories = contents.filter((item) => item.type === "dir");

  // 各本のメタデータを取得
  const books = await Promise.all(
    bookDirectories.map(async (dir) => {
      // config.yamlファイルを取得
      const configContent = await fetchFileContent(
        `books/${dir.name}/config.yaml`
      );

      if (!configContent) {
        return null;
      }

      // YAML形式の設定ファイルをパース
      const config = parseYaml<BookConfig>(configContent);

      // 表紙画像のパス
      const coverImagePath = `${RAW_CONTENT_URL}/books/${dir.name}/cover.png`;

      // 章の一覧を取得
      const chapterContents = await fetchDirectoryContents(`books/${dir.name}`);
      const chapters = chapterContents
        .filter(
          (item) =>
            item.type === "file" &&
            item.name.endsWith(".md") &&
            !item.name.startsWith(".")
        )
        .sort((a, b) => {
          // ファイル名の数字部分で並べる（1.intro.md, 2.setup.md など）
          const aNum = parseInt(a.name.split(".")[0]) || 0;
          const bNum = parseInt(b.name.split(".")[0]) || 0;
          return aNum - bNum;
        });

      return {
        id: dir.name,
        title: config.title || dir.name,
        description: config.summary || "",
        tags: config.topics || [],
        price: config.price || 0,
        isPaid: !!config.price && config.price > 0,
        coverImage: coverImagePath,
        chapterCount: chapters.length,
        createdAt: config.published_at || new Date().toISOString(),
        updatedAt:
          config.updated_at || config.published_at || new Date().toISOString(),
      };
    })
  );

  // nullを除外して返す
  return books.filter((book) => book !== null);
}

// 特定の本の詳細を取得
export async function fetchBook(slug: string): Promise<Book | null> {
  // configファイルを取得
  const configContent = await fetchFileContent(`books/${slug}/config.yaml`);

  if (!configContent) {
    return null;
  }

  // YAML形式の設定ファイルをパース
  const config = parseYaml<BookConfig>(configContent);

  // 本のディレクトリ内の章を取得
  const contents = await fetchDirectoryContents(`books/${slug}`);

  // Markdownファイルのみをフィルタリング
  const chapterFiles = contents
    .filter(
      (item) =>
        item.type === "file" &&
        item.name.endsWith(".md") &&
        !item.name.startsWith(".")
    )
    .sort((a, b) => {
      // ファイル名の数字部分でソート
      const aNum = parseInt(a.name.split(".")[0]) || 0;
      const bNum = parseInt(b.name.split(".")[0]) || 0;
      return aNum - bNum;
    });

  if (chapterFiles.length === 0) {
    return null;
  }

  // 各章の内容を取得
  const chapters = await Promise.all(
    chapterFiles.map(async (file, index: number) => {
      const markdown = await fetchFileContent(`books/${slug}/${file.name}`);

      if (!markdown) {
        return null;
      }

      const { frontMatter, content } = await parseMarkdown(markdown);

      // チャプターのスラッグは、ファイル名から拡張子を除いたもの
      const chapterSlug = file.name.replace(".md", "");

      return {
        slug: chapterSlug,
        title: frontMatter.title || `Chapter ${index + 1}`,
        content: content,
        order: index,
      };
    })
  );

  return {
    id: slug,
    title: config.title || slug,
    description: config.summary || "",
    tags: config.topics || [],
    price: config.price || 0,
    isPaid: !!config.price && config.price > 0,
    coverImage: `${RAW_CONTENT_URL}/books/${slug}/cover.png`,
    chapters: chapters.filter((chapter) => chapter !== null),
    chapterCount: chapters.length,
    createdAt: config.published_at || new Date().toISOString(),
    updatedAt:
      config.updated_at || config.published_at || new Date().toISOString(),
  };
}
