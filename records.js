import fs from "fs";
import path from 'path';
import { glob } from 'glob';
import { readFile } from "node:fs/promises";
import { ATapult } from "./src/index.js";
import frontmatter from 'front-matter';
import slugify from 'slugify';

const parsedPosts = async ( filePath ) => {
  const directoryPath = process.cwd() + filePath;
  const files = await glob( directoryPath + '**/*.md', { withFileTypes: true })
  return files.map( file => {
    const filePath = path.join( file.path, file.name );
    const content = fs.readFileSync(filePath, 'utf8');
    // Make sure to include the path in the returned object:
    return { ...frontmatter( content ), 'path' : filePath };
  });
}

const publicationRecord = {
  url: new URL( "https://wil.to/posts" ),
  publishedAt: new Date( "2026-01-01" ), // Required to generate a consistent TID!
  name: "I’m Mat Marquis and I believe in the web.",
  description: "I’m a guest author for Piccalil.li and CSS-Tricks, but every so often I put something up right here on my own blog.",
  basicTheme: {
    // Note: Bluesky enforces AA-level color contrast — if you don't meet it, it fails silently.
    background: { b: 255, g: 255, r: 255 },
    foreground: {  b: 63,  g: 7, r: 18 },
    accent: { b: 20, g: 40, r: 220 }, // Button background
    accentForeground: { b: 255, g: 255, r: 255 }, // Button text color
  },
  icon: {
    blob: await readFile( `${ process.cwd() }/atproto/icon.png` ),
    mimeType: "image/png",
  }
};

const documentRecords = await parsedPosts( '/src/posts/' )
  .then( posts => {
    const filterDrafts = posts.filter( post => post.attributes.draft !== true && post.attributes.external === undefined );

    return filterDrafts.map( ( post ) => ({
        title: post.attributes.title,
        description: post.attributes.description,
        publishedAt: new Date( post.attributes.date ),
        path: post.attributes.permalink ? 
          post.attributes.permalink.replace( /\/?posts/gi, '' ).replace( 'index.html', '' ) : 
          `/${ slugify( post.attributes.title, { lower: true, strict: true }) }/`
      })
    );
  });

await ATapult({
  credentials: {
    identifier: "wil.to",
    password: process.env.ATPROTO_PASSWORD
  },
  url: new URL( "https://bsky.social" )
}, publicationRecord, documentRecords );
