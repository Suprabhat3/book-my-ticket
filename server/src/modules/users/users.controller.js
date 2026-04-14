import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getUsersPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "users module is scaffolded",
    data: { module: "users", next: "Implement service and database logic" },
  });
});
