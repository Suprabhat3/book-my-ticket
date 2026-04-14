ALTER TABLE "ShowSeat"
ADD COLUMN "lockedByUserId" TEXT;

CREATE INDEX "ShowSeat_showId_lockedByUserId_idx"
ON "ShowSeat"("showId", "lockedByUserId");
