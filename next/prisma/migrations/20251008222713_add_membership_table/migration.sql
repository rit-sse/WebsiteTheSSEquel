-- CreateTable
CREATE TABLE "Memberships" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "date_given" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memberships_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Memberships" ADD CONSTRAINT "Memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
