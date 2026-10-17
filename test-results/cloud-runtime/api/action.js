import { handle } from "../server/cloud-handler.js";
export default {
    fetch(request) {
        return handle(request, true);
    },
};
