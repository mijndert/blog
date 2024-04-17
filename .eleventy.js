const dateFilter = require("./src/filters/date-filter.js");
const w3DateFilter = require("./src/filters/w3-date-filter.js");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const embeds = require("eleventy-plugin-embed-everything");
const htmlmin = require("html-minifier");

module.exports = (config) => {
  config.addFilter("dateFilter", dateFilter);
  config.addFilter("w3DateFilter", w3DateFilter);
  config.addPassthroughCopy("css");
  config.addPassthroughCopy("src/favicon/");
  config.addPassthroughCopy({ 'src/robots.txt': '/robots.txt' });
  config.addPassthroughCopy({ 'src/CNAME': '/CNAME' });
  config.addPlugin(pluginRss);
  config.addPlugin(embeds);
  config.addTransform("htmlmin", function (content) {
		if ((this.page.outputPath || "").endsWith(".html")) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
			});

			return minified;
		}
  	return content;
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
