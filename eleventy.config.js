import pluginRss from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything"
import { eleventyImagePlugin } from "@11ty/eleventy-img"
import { DateTime } from "luxon";

export default async function(eleventyConfig) {
  eleventyConfig.addFilter("postDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED)
  })
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("src/favicon/");
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': '/robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'src/CNAME': '/CNAME' });
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(embeds);
  eleventyConfig.addPlugin(eleventyImagePlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [368, 736, 900],
    defaultAttributes: {
        sizes: "auto",
        loading: "lazy",
        decoding: "async",
    },
    filenameFormat: function (id, src, width, format) {
        let filename = path.basename(src, path.extname(src));
        return `${filename}-${width}.${format}`;
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
