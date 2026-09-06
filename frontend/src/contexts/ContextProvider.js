import React, { createContext, useContext, useState, useEffect } from 'react';

const StateContext = createContext();

const initialState = {
  chat: false,
  cart: false,
  userProfile: false,
  notification: false,
};

export const ContextProvider = ({ children }) => {
  // Initialize screenSize with actual window width instead of undefined
  const [screenSize, setScreenSize] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [currentColor, setCurrentColor] = useState('#4049f9');
  const [currentMode, setCurrentMode] = useState('Light');
  const [themeSettings, setThemeSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState(true); // Start with true for desktop
  const [isClicked, setIsClicked] = useState(initialState);

  // Handle initial activeMenu state based on screen size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      setScreenSize(width);
      // Set activeMenu based on initial screen size
      // On mobile, start with menu closed; on desktop, start with menu open
      setActiveMenu(width > 900);
    }
  }, []); // Run only once on mount

  const setMode = (e) => {
    setCurrentMode(e.target.value);
    localStorage.setItem('themeMode', e.target.value);
  };

  const setColor = (color) => {
    setCurrentColor(color);
    localStorage.setItem('colorMode', color);
  };

  const handleClick = (clicked) => {
    setIsClicked((prevState) => ({
      ...initialState,
      [clicked]: !prevState[clicked], // Toggle clicked element
    }));
  };

  return (
    <StateContext.Provider
      value={{
        currentColor,
        currentMode,
        activeMenu,
        screenSize,
        setScreenSize,
        handleClick,
        isClicked,
        initialState,
        setIsClicked,
        setActiveMenu,
        setCurrentColor,
        setCurrentMode,
        setMode,
        setColor,
        themeSettings,
        setThemeSettings
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);