import pluginRss from "@11ty/eleventy-plugin-rss";
import dateFilter from "./src/filters/date-filter.js"
import w3DateFilter from"./src/filters/w3-date-filter.js"
import embeds from "eleventy-plugin-embed-everything"
import { eleventyImagePlugin } from "@11ty/eleventy-img"

export default async function(eleventyConfig) {
  eleventyConfig.addFilter("dateFilter", dateFilter);
  eleventyConfig.addFilter("w3DateFilter", w3DateFilter);
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
