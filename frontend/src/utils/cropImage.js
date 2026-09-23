function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
}


export async function getCroppedImage(imageSrc, croppedAreaPixels, rotation = 0) {
    const image = await createImage(imageSrc);
    const radians = rotation * Math.PI / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const boundingWidth = image.width * cos + image.height * sin;
    const boundingHeight = image.width * sin + image.height * cos;
    const canvas = document.createElement("canvas");

    canvas.width = boundingWidth;
    canvas.height = boundingHeight;

    const context = canvas.getContext("2d");

    context.translate(boundingWidth / 2, boundingHeight / 2);
    context.rotate(radians);
    context.translate(-image.width / 2, -image.height / 2);
    context.drawImage(image, 0, 0);

    const outputCanvas = document.createElement("canvas");

    outputCanvas.width = croppedAreaPixels.width;
    outputCanvas.height = croppedAreaPixels.height;

    const outputContext = outputCanvas.getContext("2d");

    outputContext.drawImage(
        canvas,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
    );


    return new Promise((resolve, reject) => {
        outputCanvas.toBlob(blob => {
                if (!blob) { reject(new Error("Failed to crop image."));
                    return;
                }
                resolve(blob);
            },
            "image/jpeg",
            0.9
        );

    });
}