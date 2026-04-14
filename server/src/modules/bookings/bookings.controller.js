import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getBookingsPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "bookings module is scaffolded",
    data: { module: "bookings", next: "Implement service and database logic" },
  });
});
