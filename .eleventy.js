const dateFilter = require("./src/filters/date-filter.js");
const w3DateFilter = require("./src/filters/w3-date-filter.js");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const readingTime = require('eleventy-plugin-reading-time');

module.exports = (config) => {
  config.addFilter("dateFilter", dateFilter);
  config.addFilter("w3DateFilter", w3DateFilter);
  config.addFilter("head", (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });
  config.addPassthroughCopy("css");
  config.addPlugin(pluginRss);
  config.addPlugin(readingTime);
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
