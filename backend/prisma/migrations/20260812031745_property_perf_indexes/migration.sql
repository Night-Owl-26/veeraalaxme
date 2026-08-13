-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "Property_vastuScore_idx" ON "Property"("vastuScore");

-- CreateIndex
CREATE INDEX "Property_price_idx" ON "Property"("price");

-- CreateIndex
CREATE INDEX "Property_status_createdAt_idx" ON "Property"("status", "createdAt");
