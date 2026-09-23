import { useEffect, useId, useRef, useState } from "react";
import Cropper from "react-easy-crop";

import { getCroppedImage } from "../utils/cropImage.js";
import "./PhotoCropper.css";

/**
 * Choose and crop a photo, then pass the finished JPEG File to onSave.
 * onSave may be async (for example, an API upload).
 */
const PhotoCropper = ({
    onSave,
    buttonText = "Change photo",
    changeButtonText = "Another photo",
    title = "Adjust photo",
    aspect = 1,
    cropShape = "round",
    disabled = false,
}) => {
    const titleId = useId();
    const fileInputRef = useRef(null);
    const triggerRef = useRef(null);
    const cancelRef = useRef(null);
    const dialogRef = useRef(null);

    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [hasSavedPhoto, setHasSavedPhoto] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [savedFileName, setSavedFileName] = useState("");

    // Revoke each temporary image URL when the image changes or the component unmounts.
    useEffect(() => {
        if (!imageSrc) return undefined;
        return () => URL.revokeObjectURL(imageSrc);
    }, [imageSrc]);

    useEffect(() => {
        if (imageSrc) cancelRef.current?.focus();
    }, [imageSrc]);

    const closeEditor = () => {
        if (saving) return;
        setImageSrc(null);
        setCroppedAreaPixels(null);
        setSelectedFileName("");
        setError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        triggerRef.current?.focus();
    }

    const handleDialogKeyDown = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeEditor();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = Array.from(
            dialogRef.current?.querySelectorAll(
                'button:not([disabled]), input:not([disabled])'
            ) ?? []
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    const handleFileSelected = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            event.target.value = "";
            return;
        }

        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
        setSelectedFileName(file.name);
        setError("");
        setImageSrc(URL.createObjectURL(file));
    }

    const  handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels || saving) return;

        try {
            setSaving(true);
            setError("");

            const blob = await getCroppedImage(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            const croppedFile = new File([blob], "cropped-photo.jpg", {
                type: "image/jpeg",
            });

            await onSave(croppedFile);

            setHasSavedPhoto(true);
            setSavedFileName(selectedFileName);
            setSelectedFileName("");
            setImageSrc(null);
            setCroppedAreaPixels(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            triggerRef.current?.focus();
        } catch (saveError) {
            setError(saveError?.message || "Could not save the photo.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="photo-cropper">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelected}
            />
            <button
                ref={triggerRef}
                type="button"
                className="photo-cropper-trigger"
                disabled={disabled || saving}
                title={savedFileName || undefined}
                onClick={() => fileInputRef.current?.click()}
            >
                {hasSavedPhoto
                    ? `${changeButtonText} (${savedFileName})`
                    : buttonText}
            </button>

            {!imageSrc && error && (
                <p className="photo-cropper-error" role="alert">{error}</p>
            )}

            {imageSrc && (
                <div className="photo-cropper-overlay">
                    <div
                        ref={dialogRef}
                        className="photo-cropper-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        onKeyDown={handleDialogKeyDown}
                    >
                        <h2 id={titleId}>{title}</h2>

                        <div className="photo-cropper-area">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspect}
                                cropShape={cropShape}
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                            />
                        </div>

                        <label>
                            Zoom
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.01"
                                value={zoom}
                                onChange={(event) => setZoom(Number(event.target.value))}
                            />
                        </label>

                        <label>
                            Rotate
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                step="1"
                                value={rotation}
                                onChange={(event) => setRotation(Number(event.target.value))}
                            />
                        </label>

                        {error && (
                            <p className="photo-cropper-error" role="alert">{error}</p>
                        )}

                        <div className="photo-cropper-actions">
                            <button
                                ref={cancelRef}
                                type="button"
                                disabled={saving}
                                onClick={closeEditor}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving || !croppedAreaPixels}
                                onClick={handleSave}
                            >
                                {saving ? "Saving..." : "Save photo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default PhotoCropper;