import * as querystring from "node:querystring";
import { inspect } from "node:util";

const keys = new Set();
const debug = (obj: any) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc: any, [key, value]) => {
      keys.add(key);
      if (!value) return acc;
      acc[key] = inspect(value, { depth: null });
      return acc;
    }, {}),
    "<br/>",
    ": ",
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value;
      },
    }
  );

export { debug };
