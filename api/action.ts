import { handle } from "../server/cloud-handler.js";
export default {
  fetch(request: Request) {
    return handle(request, true);
  },
};
