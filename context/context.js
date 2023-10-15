'use client'

import React, { createContext, useState, useContext } from 'react';

const context = createContext();

const useStateContext = () => {
    return useContext(context);
};


const ContextProvider = ({ children }) => {
    const [replying, setReplying] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)
    return (
        <context.Provider value={{ replying, setReplying, replyingTo, setReplyingTo }}>
            {children}
        </context.Provider>
    );
};

export { useStateContext, ContextProvider };
