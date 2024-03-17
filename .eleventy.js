const dateFilter = require("./src/filters/date-filter.js");
const w3DateFilter = require("./src/filters/w3-date-filter.js");

module.exports = config => {
  config.addFilter("dateFilter", dateFilter);
  config.addFilter("w3DateFilter", w3DateFilter);
  config.addPassthroughCopy("css");
  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
      output: 'dist'
    }
  };
};