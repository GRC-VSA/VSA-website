import { createContext, useContext, useState, useEffect } from "react";
import { getQuestionTypes } from "../api/Question";
const QuestionTypesContext = createContext(null);


export const QuestionTypesProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [questionTypes, setQuestionTypes] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchQuestionTypes = async () => {
            try {
                setIsLoading(true);
                const data = await getQuestionTypes();
                setQuestionTypes(data);
                setError(null);
            }
            catch (err) {
                const errorMessage = "Failed to fetch Question Types in Context";
                console.log(errorMessage, err);
                setError(errorMessage);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchQuestionTypes();
    }, []);

    return (
        <QuestionTypesContext.Provider value={{questionTypes, isLoading, error}}>
            {children}
        </QuestionTypesContext.Provider>
    )
}

export const useQuestionTypes = () => {
    return useContext(QuestionTypesContext);
}