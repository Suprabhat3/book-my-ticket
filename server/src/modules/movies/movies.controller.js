import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getMoviesPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "movies module is scaffolded",
    data: { module: "movies", next: "Implement service and database logic" },
  });
});
