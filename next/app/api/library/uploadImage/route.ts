
import { NextRequest } from "next/server";
import { getAuth } from "../authTools";
import { writeFileSync, readFileSync, existsSync } from "fs";
export async function POST(request: NextRequest) {
    console.log("POST /api/library/uploadImage");

    const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    if (!authToken) {
        return new Response("Unauthorized", { status: 401 });
    }
    const auth = await getAuth(authToken);
    if (!auth.isOfficer && !auth.isMentor) {
        return new Response("Unauthorized", { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    }

    const { imageData, ISBN } = body;
    if (!imageData) {
        return new Response('"imageData" is required', { status: 400 });
    }

    try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const imagePath = `./public/library-assets/${ISBN || `image_${Date.now()}`}.png`;
        writeFileSync(imagePath, buffer);
        return Response.json({ message: "Image uploaded successfully" });
    } catch (e) {
        return new Response(`Failed to upload image: ${e}`, { status: 500 });
    }

}
export async function PUT(request: NextRequest) {
    console.log("PUT /api/library/uploadImage");

    const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    if (!authToken) {
        return new Response("Unauthorized", { status: 401 });
    }
    const auth = await getAuth(authToken);
    if (!auth.isOfficer && !auth.isMentor) {
        return new Response("Unauthorized", { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    }

    const { imageData, ISBN } = body;
    if (!imageData) {
        return new Response('"imageData" is required', { status: 400 });
    }
    if (!ISBN) {
        return new Response('"ISBN" is required for updating image', { status: 400 });
    }

    try {
        if (existsSync(process.cwd() + "/public/library-assets/" + ISBN + ".png") || existsSync(process.cwd() + "/public/library-assets/" + ISBN + ".jpg") || existsSync(process.cwd() + "/public/library-assets/" + ISBN + ".jpeg")) {
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const imagePath = `./public/library-assets/${ISBN || `image_${Date.now()}`}.jpg`;
            writeFileSync(imagePath, buffer);
        } else {
            return new Response(`Image with ISBN ${ISBN} does not exist`, { status: 404 });
        }
        return Response.json({ message: "Image uploaded successfully", imageUrl: `/library-assets/${ISBN}.jpg` });
    } catch (e) {
        return new Response(`Failed to upload image: ${e}`, { status: 500 });
    }

}