// next.config.js
const withLess = require('@zeit/next-less')

const withMDX = require("@zeit/next-mdx")({
  extension: /\.mdx?$/,
  options: {}
});

module.exports = withLess(withMDX({
  pageExtensions: ["js", "jsx", "md", "mdx"],
  cssModules: true
}));
