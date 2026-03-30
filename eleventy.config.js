import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img"
import { createHash } from "crypto";
import { readFileSync } from "fs";

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