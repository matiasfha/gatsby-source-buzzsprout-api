"use strict";

/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */
const {
  createFilePath,
  createRemoteFileNode,
} = require(`gatsby-source-filesystem`);

const fetch = require("node-fetch");

const NODE_TYPE = "PodcastEpisode";

exports.onPreInit = () => console.log("Loaded gatsby-starter-plugin");

const createNodesFromSourceData = ({ sourceData, name, hepers }) => {
  console.log(`Creating nodes for ${name}`);
  const { createContentDigest, createNode, createNodeId } = helpers;
  sourceData.forEach((episode) =>
    createNode({
      ...episode,
      slug: episode.title.split(" ").join("-"),
      podcastName: name,
      id: createNodeId(`${NODE_TYPE}-${episode.id}`),
      // hashes the inputs into an ID
      parent: null,
      internal: {
        type: `${NODE_TYPE}${name}`,
        content: JSON.stringify(episode),
        contentDigest: createContentDigest(episode),
      },
    })
  );
};

exports.sourceNodes = async (
  { actions, createContentDigest, createNodeId, getNodesByType },
  { token, podcastId, name }
) => {
  if (!name) {
    throw new Error("Buzzsprout Source: name is required.");
  }

  if (!token) {
    throw new Error("Buzzsprout Source: token is required");
  }

  if (!podcastId) {
    throw new Error("Buzzsprout Source: podcastId is required");
  }

  const { createNode, touchNode } = actions;
  const helpers = {
    ...actions,
    createContentDigest,
    createNodeId,
  };
  // touch nodes to ensure they aren't garbage collected
  getNodesByType(`${NODE_TYPE}${name}`).forEach((node) =>
    touchNode({ nodeId: node.id })
  );

  let response;
  const cacheKey = `Cache-${name}`;
  let sourceData = await cache.get(cacheKey);
  if (!sourceData) {
    console.log("Not using cache, fetching data from api");
    response = await fetch(
      `https://www.buzzsprout.com/api/${podcastId}/episodes.json`,
      {
        headers: {
          Authorization: `Token token=${token}`,
        },
      }
    );
    sourceData = await response.json(); // loop through data returned from the api and create Gatsby nodes for them
  }

  // Fire interval once a week to get latest data
  setInterval(() => {
    createNodesFromSourceData({
      sourceData,
      name,
      helpers,
    });
  }, 604800000);

  createNodesFromSourceData({
    sourceData,
    name,
    helpers,
  });

  return;
};

exports.onCreateNode = async ({
  node,
  actions: { createNode },
  createNodeId,
  getCache,
}) => {
  if (node.podcastName != null) {
    try {
      const fileNode = await createRemoteFileNode({
        url: node.artwork_url,
        parentNodeId: node.id,
        createNode,
        createNodeId,
        getCache,
      });

      if (fileNode) {
        node.remoteImage___NODE = fileNode.id;
      }
    } catch (e) {
      console.error(e);
    }
  }
};

