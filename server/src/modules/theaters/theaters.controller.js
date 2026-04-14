import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getTheatersPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "theaters module is scaffolded",
    data: { module: "theaters", next: "Implement service and database logic" },
  });
});
