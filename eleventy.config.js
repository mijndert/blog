const dateFilter = require("./src/filters/date-filter.js");
const w3DateFilter = require("./src/filters/w3-date-filter.js");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const embeds = require("eleventy-plugin-embed-everything");
const { eleventyImagePlugin } = require("@11ty/eleventy-img");

module.exports = (eleventyConfig) => {
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
