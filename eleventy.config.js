module.exports = function(eleventyConfig) {
  eleventyConfig.setDynamicPermalinks(false); 

  eleventyConfig.addPassthroughCopy("Assets/");
   eleventyConfig.addPassthroughCopy("cursorlag/");
  eleventyConfig.addPassthroughCopy("Posts/Archives/cursorlag/");
    eleventyConfig.addPassthroughCopy("Posts/Archives/");
    eleventyConfig.addPassthroughCopy("404.html");
    eleventyConfig.addPassthroughCopy("_redirects");
    eleventyConfig.addPassthroughCopy(".domains");
    eleventyConfig.addPassthroughCopy("LICENSE");
  return {

  };
};