import { useEffect, useState } from "react";

import Cropper from "react-easy-crop";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { updateCurrentUserProfile, uploadCurrentUserAvatar, removeCurrentUserAvatar } from "../api/User.js";

import { getCroppedImage } from "../utils/cropImage.js";
import "./ProfilePage.css";

const ProfilePage = () => {

    const { user, refreshProfile } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!user)
            return;
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setPhone(user.phone || "");
    }, [user]);

    const handleImageSelected = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setError("");
    };

    const handleCropComplete = (_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const handleSaveAvatar = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            return;
        }
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);
            const croppedFile = new File([croppedBlob], "profile.jpg",
                {
                    type: "image/jpeg"
                }
            );

            await uploadCurrentUserAvatar(croppedFile);
            await refreshProfile();
            URL.revokeObjectURL(imageSrc);
            setImageSrc(null);
            setSuccess("Profile photo updated.");
        }
        catch (error) {
            console.error(error);
            setError(error.message || "Failed to update profile photo.");
        }
        finally {
            setSaving(false);
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");
            await removeCurrentUserAvatar();
            await refreshProfile();
            setSuccess("Profile photo removed.");
        }
        catch (error) {
            console.error(error);
            setError(error.message || "Failed to remove profile photo.");
        }
        finally {
            setSaving(false);
        }
    };

    const handleProfileSave = async event => {
        event.preventDefault();
        try {
            setSaving(true);
            setError("");
            setSuccess("");
            await updateCurrentUserProfile({ firstName, lastName, phone });
            await refreshProfile();
            setSuccess("Profile updated.");
        }
        catch (error) {
            console.error(error);
            setError(error.message || "Failed to update profile.");
        }
        finally {
            setSaving(false);
        }
    };


    if (!user) {
        return null;
    }
    return (

        <main className="profile-page page-footer-space">
            <div className="profile-card">
                <header className="profile-header">
                    <h1>Personal Info</h1>
                </header>

                <section className="profile-section">
                    {/* 
                    <h2>
                        Profile photo
                    </h2> */}
                    <div className="profile-avatar-row">
                        <div className="profile-avatar">
                            {user.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt="Profile" />
                            ) : (
                                <FaUser />
                            )}
                        </div>

                        <div className="profile-avatar-actions">
                            <label className="profile-upload-button">
                                Change photo
                                <input type="file" accept="image/*" hidden onChange={handleImageSelected} />
                            </label>
                            {
                                user.profileImageUrl && (
                                    <button type="button" onClick={handleRemoveAvatar} disabled={saving}>
                                        Remove Photo
                                    </button>
                                )
                            }
                        </div>
                    </div>
                </section>

                <section className="profile-section">
                    <h2>Personal information</h2>
                    <form onSubmit={handleProfileSave}>
                        <div className="profile-field">
                            <label>First name</label>
                            <input type="text" value={firstName} onChange={event => setFirstName(event.target.value)} />
                        </div>
                        <div className="profile-field">
                            <label>Last name</label>
                            <input type="text" value={lastName} onChange={event => setLastName(event.target.value)} />
                        </div>
                        <div className="profile-field">
                            <label>Email</label>
                            <input type="email" value={user.email || ""} disabled />
                        </div>
                        <div className="profile-field">
                            <label>Phone</label>
                            <input type="tel" value={phone} onChange={event => setPhone(event.target.value)} />
                        </div>

                        <button type="submit" disabled={saving} className="profile-save-button">
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </form>
                </section>

                {
                    error && (
                        <p className="profile-error">{error}</p>
                    )
                }

                {/* {success && (

                    <p className="profile-success">
                        {success}
                    </p>

                )} */}
            </div>
            {imageSrc && (
                <div className="profile-crop-overlay">
                    <div className="profile-crop-modal">
                        <h2>Adjust profile photo</h2>
                        <div className="profile-crop-area">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={handleCropComplete}
                            />
                        </div>

                        <label>
                            Zoom
                            <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} />
                        </label>

                        <label>
                            Rotate
                            <input type="range" min="-180" max="180" step="1" value={rotation} onChange={event => setRotation(Number(event.target.value))} />
                        </label>

                        <div className="profile-crop-actions">
                            <button type="button" onClick={() => {
                                URL.revokeObjectURL(imageSrc);
                                setImageSrc(null);
                            }}
                            >
                                Cancel
                            </button>

                            <button type="button" onClick={handleSaveAvatar} disabled={saving}>
                                {saving ? "Saving..." : "Save photo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};


export default ProfilePage;