import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img"
import { createHash } from "crypto";
import { readFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, basename } from "path";

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3);
}

function generateOgSvg(title) {
  const lines = wrapText(title, 28);
  const lineHeight = 76;
  const startY = 240;
  const titleLines = lines.map((line, i) =>
    `<text x="80" y="${startY + i * lineHeight}" font-family="sans-serif" font-size="64" font-weight="800" fill="#1A1A1A">${escapeXml(line)}</text>`
  ).join('\n    ');

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#F2F0EC"/>
    <circle cx="104" cy="108" r="24" fill="#0B4DC7"/>
    ${titleLines}
    <text x="80" y="568" font-family="sans-serif" font-size="28" font-weight="500" fill="#696969">mijndertstuij.nl</text>
    <text x="1120" y="568" font-family="sans-serif" font-size="28" font-weight="500" fill="#696969" text-anchor="end">Mijndert Stuij</text>
  </svg>`;
}

export default async function(eleventyConfig) {

  // Cache-busting filter: appends a content hash to asset URLs
  eleventyConfig.addFilter("cacheBust", (url) => {
    const filePath = `src${url}`;
    try {
      const content = readFileSync(filePath);
      const hash = createHash("md5").update(content).digest("hex").slice(0, 8);
      return `${url}?v=${hash}`;
    } catch {
      return url;
    }
  });

  // Add a filter to format dates
  eleventyConfig.addFilter("postDate", dateObj => {
    const date = new Date(dateObj);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // ISO date filter for structured data and OG tags
  eleventyConfig.addFilter("isoDate", dateObj => {
    return new Date(dateObj).toISOString();
  });

	// Create a collection for all posts
	eleventyConfig.addCollection("posts", (collectionApi) => {
		return collectionApi.getFilteredByGlob(["src/posts/*.md", "src/weeknotes/*.md"])
	});

  // Create a week notes collection
  eleventyConfig.addCollection("weeknotes", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/weeknotes/*.md")
  });

  // Create a collection for all posts except week notes
  eleventyConfig.addCollection("blogposts", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
  });

	// Create a tags collection
	eleventyConfig.addCollection("tagsList", function(collectionApi) {
    let tagsSet = new Set();
    collectionApi.getAll().forEach(item => {
      if ("tags" in item.data) {
        let tags = item.data.tags;
        tags.filter(tag => tag !== "page").forEach(tag => tagsSet.add(tag));
      }
    });
    return [...tagsSet].sort();
  });
	eleventyConfig.addFilter("filterByTag", (posts, tag) => {
		return posts.filter(post => post.data.tags && post.data.tags.includes(tag));
	});

  // Related posts filter: finds posts sharing the most tags with the current post
  eleventyConfig.addFilter("relatedPosts", (pageUrl, tags, collection) => {
    if (!tags || !tags.length) return [];
    return collection
      .filter(p => p.url !== pageUrl && p.data.tags)
      .map(p => ({
        post: p,
        shared: p.data.tags.filter(t => tags.includes(t)).length
      }))
      .filter(p => p.shared > 0)
      .sort((a, b) => b.shared - a.shared || b.post.date - a.post.date)
      .slice(0, 2)
      .map(p => p.post);
  });

  // Stats helpers
  eleventyConfig.addFilter("wordCount", (content) => {
    return (content || "").split(/\s+/).filter(Boolean).length;
  });

  eleventyConfig.addFilter("postsPerYear", (collection) => {
    const counts = {};
    for (const post of collection) {
      const year = post.date.getFullYear();
      counts[year] = (counts[year] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[0] - a[0]);
  });

  eleventyConfig.addFilter("topTags", (tagsList, collection) => {
    return tagsList
      .map(tag => ({
        tag,
        count: collection.filter(p => p.data.tags && p.data.tags.includes(tag)).length
      }))
      .sort((a, b) => b.count - a.count);
  });

  eleventyConfig.addFilter("totalWords", (collection) => {
    let total = 0;
    for (const post of collection) {
      const raw = readFileSync(post.inputPath, "utf-8");
      // Strip frontmatter and HTML tags, then count words
      const text = raw.replace(/^---[\s\S]*?---/, "").replace(/<[^>]*>/g, "");
      total += text.split(/\s+/).filter(Boolean).length;
    }
    return Math.round(total / 1000);
  });

  // Watch non-template files
  eleventyConfig.addWatchTarget("./src/_data");

  // Embeds plugin
  eleventyConfig.addPlugin(embeds);

  // Syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // RSS feed for all posts
  eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed.xml",
		collection: {
			name: "posts"
		},
		metadata: {
			language: "en",
			title: "Mijndert Stuij",
			subtitle: "Lead platform engineer. Runner. Minimalist.",
			base: "https://mijndertstuij.nl",
			author: {
				name: "Mijndert Stuij",
				email: "mijndert@mijndertstuij.nl",
			}
		}
	});

  // RSS feed for week notes
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/weeknotes-feed.xml",
    collection: {
      name: "weeknotes"
    },
    metadata: {
      language: "en",
      title: "Mijndert - Week Notes",
      subtitle: "Weekly notes and updates",
      base: "https://mijndertstuij.nl",
      author: {
        name: "Mijndert Stuij",
        email: "mijndert@mijndertstuij.nl",
      }
    }
  });

  // RSS feed for all posts excluding week notes
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/posts-feed.xml",
    collection: {
      name: "blogposts"
    },
    metadata: {
      language: "en",
      title: "Mijndert Stuij - Blog posts",
      subtitle: "Articles excluding week notes",
      base: "https://mijndertstuij.nl",
      author: {
        name: "Mijndert Stuij",
        email: "mijndert@mijndertstuij.nl",
      }
    }
  });

  // Image transformation
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		extensions: "html",
		widths: [800, 500, 300],
		defaultAttributes: {
			sizes: "90vw",
			loading: "lazy",
			decoding: "async",
		},
	});

  // Generate OG images after build
  eleventyConfig.on('eleventy.after', async ({ dir }) => {
    const sharp = (await import('sharp')).default;
    const ogDir = join(dir.output, 'og');
    if (!existsSync(ogDir)) {
      mkdirSync(ogDir, { recursive: true });
    }

    const contentDirs = [join(dir.input, 'posts'), join(dir.input, 'weeknotes')];
    for (const contentDir of contentDirs) {
      if (!existsSync(contentDir)) continue;
      const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const slug = basename(file, '.md');
        const content = readFileSync(join(contentDir, file), 'utf-8');
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '') : slug;
        const svg = generateOgSvg(title);
        await sharp(Buffer.from(svg)).png().toFile(join(ogDir, `${slug}.png`));
      }
    }

    // Default OG image for non-post pages
    const defaultSvg = generateOgSvg('Mijndert Stuij');
    await sharp(Buffer.from(defaultSvg)).png().toFile(join(ogDir, 'default.png'));
  });

  // Copy assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/favicon/");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy({ 'src/CNAME': '/CNAME' });

  // Set templating engine and input/output directories
  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist",
    },
  };

}