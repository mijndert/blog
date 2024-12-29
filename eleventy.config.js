import pluginRss from "@11ty/eleventy-plugin-rss";
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
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(embeds);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		extensions: "html",
		defaultAttributes: {
			loading: "lazy",
			decoding: "async",
			sizes: "auto",
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
