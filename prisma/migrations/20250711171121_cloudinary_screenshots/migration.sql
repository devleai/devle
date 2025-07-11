-- CreateTable
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL,
    "sandboxUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Screenshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Screenshot_sandboxUrl_key" ON "Screenshot"("sandboxUrl");
