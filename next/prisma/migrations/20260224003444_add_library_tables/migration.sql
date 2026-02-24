-- CreateTable
CREATE TABLE "BookCategory" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,
    "books" INTEGER[],

    CONSTRAINT "BookCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Textbooks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "edition" TEXT NOT NULL,
    "ISBN" TEXT NOT NULL,
    "keyWords" TEXT NOT NULL,
    "classInterest" TEXT NOT NULL,
    "yearPublished" TEXT NOT NULL,

    CONSTRAINT "Textbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookCopies" (
    "id" SERIAL NOT NULL,
    "ISBN" TEXT NOT NULL,
    "checkedOut" BOOLEAN NOT NULL,
    "user_id" INTEGER,

    CONSTRAINT "TextbookCopies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Textbooks_ISBN_key" ON "Textbooks"("ISBN");

-- AddForeignKey
ALTER TABLE "TextbookCopies" ADD CONSTRAINT "TextbookCopies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookCopies" ADD CONSTRAINT "TextbookCopies_ISBN_fkey" FOREIGN KEY ("ISBN") REFERENCES "Textbooks"("ISBN") ON DELETE RESTRICT ON UPDATE CASCADE;
