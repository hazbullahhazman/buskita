import { handle } from "../server/cloud-handler";
export default {
  fetch(request: Request) {
    return handle(request, true);
  },
};
