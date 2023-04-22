const href =
  "https://6e12-109-198-9-3.ngrok-free.app/interaction/callback/google?state=6eyVovwAQdgICHxTi6c7T%7Cf60a7e62aab3ab4e3d767c79ae5a161a3faf8f0c51a6a2b88d5924680da8ac38&code=4%2F0AVHEtk7bBqg9185TOBcqPAexN6csui5Jj5lubiZ8s3We8uN_hxcrhgig0ciZ3Bga-vt9Zg&scope=email+profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&authuser=0&hd=mvpworkshop.co&prompt=none";

//parse query string to object
// do it in ejs style
const queryObject = (url) =>
  url
    .slice(href.indexOf("?") + 1)
    .split("&")
    .map((queryParam) => {
      let kvp = queryParam.split("=");
      return { key: kvp[0], value: kvp[1] };
    })
    .reduce((queryObject, kvp) => {
      queryObject[kvp.key] = kvp.value;
      return queryObject;
    }, {});

console.log(queryObject);
