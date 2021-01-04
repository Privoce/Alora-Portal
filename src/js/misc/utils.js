const getFaviconUrl = url => `chrome://favicon/size/512@1x/${url}`;

const getDomain = url => url.split("/")[2].split(":")[0].split("?")[0];

export {
    getFaviconUrl, getDomain,
};
