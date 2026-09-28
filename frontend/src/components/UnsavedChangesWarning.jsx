import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

import "./UnsavedChangesWarning.css";


const UnsavedChangesWarning = ({
    when,
    title = "Leave this page?",
    message = "You have unsaved changes. Your changes will be lost if you leave this page."
}) => {

    const blocker = useBlocker(when);


    /*
     * React Router navigation is handled by useBlocker().
     *
     * beforeunload also protects against:
     * - refreshing the browser
     * - closing the tab
     * - typing another URL
     */
    useEffect(() => {

        const handleBeforeUnload = (event) => {

            if (!when) {
                return;
            }

            event.preventDefault();

            event.returnValue = "";
        };


        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );


        return () => {

            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );

        };

    }, [when]);


    if (blocker.state !== "blocked") {
        return null;
    }


    return (

        <div className="unsaved-changes-overlay">

            <div className="unsaved-changes-modal">

                <h2>
                    {title}
                </h2>

                <p>
                    {message}
                </p>


                <div className="unsaved-changes-actions">

                    <button
                        type="button"
                        className="unsaved-changes-stay"
                        onClick={
                            () =>
                                blocker.reset()
                        }
                    >
                        Stay
                    </button>


                    <button
                        type="button"
                        className="unsaved-changes-leave"
                        onClick={
                            () =>
                                blocker.proceed()
                        }
                    >
                        Leave Without Saving
                    </button>

                </div>

            </div>

        </div>

    );
};


export default UnsavedChangesWarning;