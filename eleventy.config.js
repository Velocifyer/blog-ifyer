const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { IdAttributePlugin } = require("@11ty/eleventy");
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const { HtmlBasePlugin } = require("@11ty/eleventy");
const MarkdownItGitHubAlertsModule = require("markdown-it-github-alerts");
const MarkdownItGitHubAlerts = MarkdownItGitHubAlertsModule.default ?? MarkdownItGitHubAlertsModule;
const htmlmin = require("html-minifier-terser");


const metadata = {
  language: "en",
  title: "Blog-Ifyer",
  subtitle: "Velocifyer's Blog.",
  base: "https://blog.velocifyer.com",
  author: { name: "Velocifyer" },
};
const collection = { name: "post", limit: 50 };


module.exports = async function(eleventyConfig) {


	eleventyConfig.addPlugin(HtmlBasePlugin);

  	eleventyConfig.setDynamicPermalinks(false); 

  	eleventyConfig.addPassthroughCopy("Assets/**");
   	eleventyConfig.addPassthroughCopy("cursorlag/");
    eleventyConfig.addPassthroughCopy("Posts/Archives/**");
    eleventyConfig.addPassthroughCopy("_redirects");
    eleventyConfig.addPassthroughCopy("LICENSE");
    eleventyConfig.addFilter("dateTimes", function (dates) {
        return dates.map(date => {
            return `<time datetime="${date}">${date}</time>`;
        }).join(", ");
    });
	eleventyConfig.addPassthroughCopy("node_modules/@fontsource-variable/google-sans-flex/**");
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }   // makes scrollable code blocks keyboard-accessible
	});
	eleventyConfig.addWatchTarget("**/*.css");
	eleventyConfig.addPassthroughCopy("node_modules/prismjs/themes/*.css");
	eleventyConfig.addPassthroughCopy("node_modules/@zachleat/heading-anchors/*");
	eleventyConfig.addPassthroughCopy("robots.txt");

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/Posts/feed.atom",   // <-- put your OLD Atom URL here
		collection,
		metadata,
	});

	eleventyConfig.addPlugin(feedPlugin, {
		type: "rss",
		outputPath: "/Posts/Feeds/rss.xml",
		collection,
		metadata,
	});

	eleventyConfig.addPlugin(feedPlugin, {
		type: "json",
		outputPath: "/Posts/Feeds/feed.json",
		collection,
		metadata,
	});

	eleventyConfig.amendLibrary("md", (mdLib) => {
		mdLib.use(MarkdownItGitHubAlerts);
		console.log("[alerts]", mdLib.render("> [!NOTE]\n> hi\n"));
	});
	eleventyConfig.addPlugin(IdAttributePlugin, {
		// slugify: eleventyConfig.getFilter("slugify"), // default
		// selector: "h1,h2,h3,h4,h5,h6",                // default
	});

	// Minify
	eleventyConfig.addTransform("htmlmin", async function (content) {
		if (process.env.ELEVENTY_ENV !== "production") {
			return content;
		}

		if ((this.page.outputPath || "").endsWith(".html")) {
			return await htmlmin.minify(content, { /* options */ });
		}

		return content;
	});

	return {

	};
};