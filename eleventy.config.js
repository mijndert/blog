import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything"
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img"
import { DateTime } from "luxon";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function(eleventyConfig) {
	// this shows dates on posts
  eleventyConfig.addFilter("postDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED)
  })

	// create a posts collection
	eleventyConfig.addCollection("posts", (collectionApi) =>
		collectionApi.getFilteredByGlob("src/posts/*.md")
	);

	// creates a gallery collection
	eleventyConfig.addCollection("gallery", () => {
		const galleryPath = path.resolve(__dirname, "src/img/gallery");
		try {
			const files = fs.readdirSync(galleryPath);
			return files
				.map((file) => {
					console.log(`Adding picture to gallery: ${file}`);
					return {
						name: file.split(".")[0],
						src: `/img/gallery/${file}`,
					};
				});
		} catch (error) {
			console.error(`Error reading gallery directory: ${error.message}`);
			return [];
		}
	});

	// tags configuration
	eleventyConfig.addCollection("tagsList", function(collectionApi) {
    let tagsSet = new Set();
    collectionApi.getAll().forEach(item => {
      if ("tags" in item.data) {
        let tags = item.data.tags;
        tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return [...tagsSet].sort();
  });
	eleventyConfig.addFilter("filterByTag", (posts, tag) => {
		return posts.filter(post => post.data.tags && post.data.tags.includes(tag));
	});

	// copy assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/favicon/");
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': '/robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'src/CNAME': '/CNAME' });

	// plugins
  eleventyConfig.addPlugin(embeds);
  eleventyConfig.addPlugin(syntaxHighlight);
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
			base: "https://mijndertstuij.nl/",
			author: {
				name: "Mijndert Stuij",
				email: "mijndert@mijndertstuij.nl",
			}
		}
	});
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		extensions: "html",
		widths: [800, 500, 300],
		defaultAttributes: {
			sizes: "90vw",
			loading: "lazy",
			decoding: "async",
		},
	});
  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist",
    },
  };
};
