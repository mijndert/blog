import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img"

export default async function(eleventyConfig) {

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