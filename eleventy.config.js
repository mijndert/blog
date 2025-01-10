import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything"
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img"
import { DateTime } from "luxon";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

export default async function(eleventyConfig) {
  eleventyConfig.addFilter("postDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED)
  })
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/favicon/");
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': '/robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'src/CNAME': '/CNAME' });
  eleventyConfig.addPlugin(embeds);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed.xml",
		collection: {
			name: "post",
			limit: 25,
		},
		metadata: {
			language: "en",
			title: "Mijndert Stuij",
			subtitle: "Senior DevOps Engineer. Runner. Minimalist.",
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
