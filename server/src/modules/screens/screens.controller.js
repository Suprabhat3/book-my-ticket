import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getScreensPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "screens module is scaffolded",
    data: { module: "screens", next: "Implement service and database logic" },
  });
});
