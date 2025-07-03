"use client";
import { axios } from "@/libs/axios/axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext();
export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const { data, status } = await axios("/common/me", "get");
      if (status === 200) {
        setUser(data);
      }
    };

    fetchData();
  }, []);

  const value = { user, setUser };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
