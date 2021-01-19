export const fetchLastEditorId = () => localStorage.getItem("lastEditor");
export const setLastEditorId = id => localStorage.setItem("lastEditor", id);
export const resetLastEditorId = () => localStorage.removeItem("lastEditor");

export const save = (data, key) => {
  return new Promise((resolve) => {
    const obj = {};
    obj[key] = data;
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}

export const update = (data, key) => {
  return new Promise((resolve, reject) => {
    restore(key).then((it) => {
      save(Object.assign(it[key], data), key).then(() => resolve());
    });
  });
}

export const restore = (key) => {
  // TODO: Err handler
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => {
      resolve(res);
    });
  });
}


export const remove = (key) => {
  // TODO: Err handler
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], (res) => {
      resolve(res);
    });
  });
}
