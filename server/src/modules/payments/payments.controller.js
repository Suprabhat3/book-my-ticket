import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/utils/api-response.js";

export const getPaymentsPlaceholder = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "payments module is scaffolded",
    data: { module: "payments", next: "Implement service and database logic" },
  });
});
