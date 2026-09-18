import { useEffect } from "react";

const useDocumentTitle = (title) => {
    useEffect(() => {
        document.title = `${title} - VSA`;
    }, [title]);
};

export default useDocumentTitle;