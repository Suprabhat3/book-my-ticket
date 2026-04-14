import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getCitiesPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "cities module is scaffolded",
    data: { module: "cities", next: "Implement service and database logic" },
  });
});
