import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { resolveBookImage } from "@/lib/s3Utils";
import { s3Service } from "@/lib/services/s3Service";
import { normalizeToS3Key } from "@/lib/s3Utils";

function hasPrivilegedAccess(auth: any): boolean {
  return Boolean(auth?.isOfficer || auth?.isMentor);
}

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/library/[isbn]");

    // Get query parameters
    let isbn = request.nextUrl.searchParams.get("isbn") || "";
    let id = request.nextUrl.searchParams.get("id") || "";
    let getCount = request.nextUrl.searchParams.get("count") === "true";

    if (isbn && isbn.trim() !== "") {
      // Get book details by ISBN
      const book = await prisma.textbooks.findFirst({
        where: {
          ISBN: isbn,
        },
        select: {
          id: true,
          ISBN: true,
          name: true,
          authors: true,
          image: true,
          imageKey: true,
          description: true,
          publisher: true,
          edition: true,
          keyWords: true,
          classInterest: true,
          yearPublished: true,
        },
      });

      // If book not found, return 404
      if (!book) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
        });
      }

      const resolvedImage = resolveBookImage(book.imageKey, book.image);
      const { imageKey, ...bookWithoutKey } = book;
      const bookResponse = {
        ...bookWithoutKey,
        image: resolvedImage ?? book.image,
      };

      // If the user requested count information, fetch the stock number and overall count
      if (getCount) {
        // Get the number of copies currently in stock (not checked out)
        const stockNumber = await prisma.textbookCopies.count({
          where: {
            ISBN: isbn,
            checkedOut: false,
          },
        });

        // Get the total number of copies (both checked out and in stock)
        const overallCount = await prisma.textbookCopies.count({
          where: {
            ISBN: isbn,
          },
        });

        // Combine the book details with the count information in the response
        const response = {
          ...bookResponse,
          stockNumber: stockNumber,
          overallCount: overallCount,
        };

        return new Response(JSON.stringify(response), { status: 200 });
      }

      return new Response(JSON.stringify(bookResponse), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        error: "ISBN or ID parameter required",
      }),
      { status: 404 }
    );
  } catch (e) {
    console.error("Error fetching book:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch book" }), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/library/[isbn]");
  try {
    // Authentication check
    const auth = await resolveAuthLevelFromRequest(request, {
      includeProfileComplete: true,
    });
    if (!auth.isOfficer && !auth.isMentor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    const {
      ISBN,
      name,
      authors,
      description,
      publisher,
      edition,
      keyWords,
      classInterest,
      yearPublished,
      imageKey,
    } = body;

    if (!ISBN || !name) {
      return new Response('"ISBN" and "name" are required', { status: 400 });
    }

    if (!/^[\d-]+$/.test(ISBN)) {
      return new Response("Invalid ISBN Format", { status: 400 });
    }

    try {
      const newBook = await prisma.textbooks.create({
        data: {
          ISBN,
          name,
          authors: authors || "",
          image: imageKey ? "" : `/library-assets/${ISBN}.jpg`,
          imageKey: imageKey || null,
          description: description || "",
          publisher: publisher || "",
          edition: edition || "",
          keyWords: keyWords || "",
          classInterest: classInterest || "",
          yearPublished: yearPublished || "",
        },
      });

      const resolvedImage = resolveBookImage(newBook.imageKey, newBook.image);
      const { imageKey: _key, ...bookWithoutKey } = newBook;

      return new Response(
        JSON.stringify({
          ...bookWithoutKey,
          image: resolvedImage ?? newBook.image,
        }),
        { status: 200 }
      );
    } catch (e) {
      console.error("Error creating book:", e);
      return new Response(JSON.stringify({ error: "Failed to create book" }), {
        status: 500,
      });
    }
  } catch (e) {
    console.error("Error processing request:", e);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  console.log("PUT /api/library/[isbn]");
  try {
    // Authentication check
    const authLevel = await resolveAuthLevelFromRequest(request, {
      includeProfileComplete: true,
    });
    if (!authLevel.isOfficer && !authLevel.isMentor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    const {
      ISBN,
      name,
      authors,
      image,
      imageKey,
      description,
      publisher,
      edition,
      keyWords,
      classInterest,
      yearPublished,
    } = body;

    if (!ISBN || !name || !authors) {
      return new Response('"ISBN", "name", and "authors" are required', {
        status: 400,
      });
    }

    if (!/^[\d-]+$/.test(ISBN)) {
      return new Response("Invalid ISBN Format", { status: 400 });
    }

    try {
      const data: any = {
        name,
        authors,
        image: image || "",
        description,
        publisher,
        edition,
        keyWords,
        classInterest,
        yearPublished,
      };

      if (imageKey !== undefined) {
        data.imageKey = imageKey || null;
      }

      const updatedBook = await prisma.textbooks.upsert({
        where: { ISBN: ISBN },
        update: data,
        create: {
          ISBN,
          ...data,
        },
      });

      const resolvedImage = resolveBookImage(
        updatedBook.imageKey,
        updatedBook.image
      );
      const { imageKey: _key, ...bookWithoutKey } = updatedBook;

      return new Response(
        JSON.stringify({
          ...bookWithoutKey,
          image: resolvedImage ?? updatedBook.image,
        }),
        { status: 200 }
      );
    } catch (e) {
      console.error("Error updating/creating book:", e);
      return new Response("Failed to update/create book", { status: 500 });
    }
  } catch (e) {
    console.error("Error processing request:", e);
    return new Response("Failed to process request", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log("DELETE /api/library/[isbn]");
  try {
    // Authentication check
    const authLevel = await resolveAuthLevelFromRequest(request, {
      includeProfileComplete: true,
    });
    if (!authLevel.isOfficer && !authLevel.isMentor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    // Get ISBN from request body
    const { ISBN } = body;

    // If ISBN is not provided, return an error
    if (!ISBN) {
      return new Response('"ISBN" is required', { status: 400 });
    }
    if (!/^[\d-]+$/.test(ISBN)) {
      return new Response("Invalid ISBN Format", { status: 400 });
    }

    try {
      // Look up the book to get its S3 key before deleting
      const book = await prisma.textbooks.findUnique({
        where: { ISBN },
        select: { imageKey: true },
      });

      // Erase all records of the book in textbookCopies and textbooks tables
      await prisma.textbookCopies.deleteMany({
        where: { ISBN: ISBN },
      });
      await prisma.textbooks.delete({
        where: { ISBN: ISBN },
      });

      // Clean up S3 image if it exists
      if (book?.imageKey) {
        const s3Key = normalizeToS3Key(book.imageKey);
        if (s3Key) {
          try {
            await s3Service.deleteObject(s3Key);
          } catch (err) {
            console.error("Failed to delete S3 book image:", err);
          }
        }
      }

      return new Response(
        JSON.stringify({ message: "Book deleted successfully" }),
        { status: 200 }
      );
    } catch (e) {
      console.error("Error deleting book:", e);
      return new Response(JSON.stringify({ error: "Failed to delete book" }), {
        status: 500,
      });
    }
  } catch (e) {
    console.error("Error processing request:", e);
    return new Response(
      JSON.stringify({ error: `Failed to process request.` }),
      { status: 500 }
    );
  }
}
