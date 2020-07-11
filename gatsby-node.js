"use strict";

/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
const {
  createFilePath,
  createRemoteFileNode
} = require(`gatsby-source-filesystem`);

const fetch = require("node-fetch");

const NODE_TYPE = "PodcastEpisode";

exports.onPreInit = () => console.log("Loaded gatsby-starter-plugin");

exports.sourceNodes = async ({
  actions,
  createContentDigest,
  createNodeId
}, {
  token,
  podcastId,
  name
}) => {
  if (!name) {
    throw new Error("Buzzsprout Source: name is required.");
  }

  if (!token) {
    throw new Error("Buzzsprout Source: token is required");
  }

  if (!podcastId) {
    throw new Error("Buzzsprout Source: podcastId is required");
  }

  const response = await fetch(`https://www.buzzsprout.com/api/${podcastId}/episodes.json`, {
    headers: {
      Authorization: `Token token=${token}`
    }
  });
  const episodes = await response.json(); // loop through data returned from the api and create Gatsby nodes for them

  episodes.forEach(episode => actions.createNode({ ...episode,
    slug: episode.title.split(" ").join("-"),
    podcastName: name,
    id: createNodeId(`${NODE_TYPE}-${episode.id}`),
    // hashes the inputs into an ID
    parent: null,
    internal: {
      type: `${NODE_TYPE}${name}`,
      content: JSON.stringify(episode),
      contentDigest: createContentDigest(episode)
    }
  }));
};

exports.onCreateNode = async ({
  node,
  actions: {
    createNode
  },
  createNodeId,
  getCache
}) => {
  if (node.podcastName != null) {
    try {
      const fileNode = await createRemoteFileNode({
        url: node.artwork_url,
        parentNodeId: node.id,
        createNode,
        createNodeId,
        getCache
      });

      if (fileNode) {
        node.remoteImage___NODE = fileNode.id;
      }
    } catch (e) {
      console.error(e);
    }
  }
};