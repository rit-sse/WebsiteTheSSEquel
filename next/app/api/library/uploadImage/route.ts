
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

    if(!/^[\d-]+$/.test(ISBN)) {
        return new Response("Invalid ISBN Format", { status: 400 });
    }

    try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const imagePath = `./public/library-assets/${ISBN || `image_${Date.now()}`}.png`;
        writeFileSync(imagePath, buffer);
        return Response.json({ message: "Image uploaded successfully" });
    } catch (e) {
        console.error("Error uploading image:", e);
        return new Response("Failed to upload image", { status: 500 });
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

    if(!/^[\d-]+$/.test(ISBN)) {
        return new Response("Invalid ISBN Format", { status: 400 });
    }

    try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const imagePath = `./public/library-assets/${ISBN || `image_${Date.now()}`}.jpg`;
        writeFileSync(imagePath, buffer);
        return Response.json({ message: "Image uploaded successfully", imageUrl: `/library-assets/${ISBN}.jpg` });
    } catch (e) {
        console.error("Error uploading image:", e);
        return new Response("Failed to upload image", { status: 500 });
    }

}