import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getShowsPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "shows module is scaffolded",
    data: { module: "shows", next: "Implement service and database logic" },
  });
});
