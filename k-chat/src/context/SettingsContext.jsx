import { createContext, useState, useEffect } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const getInitialState = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [soundEnabled, setSoundEnabled] = useState(() =>
    getInitialState("kchat_soundEnabled", true),
  );
  const [incomingMessageSound, setIncomingMessageSound] = useState(() =>
    getInitialState("kchat_incomingMessageSound", true),
  );
  const [senderEffectSound, setSenderEffectSound] = useState(() =>
    getInitialState("kchat_senderEffectSound", true),
  );
  const [receiverEffectSound, setReceiverEffectSound] = useState(() =>
    getInitialState("kchat_receiverEffectSound", true),
  );

  useEffect(() => {
    localStorage.setItem("kchat_soundEnabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(
      "kchat_incomingMessageSound",
      JSON.stringify(incomingMessageSound),
    );
  }, [incomingMessageSound]);

  useEffect(() => {
    localStorage.setItem(
      "kchat_senderEffectSound",
      JSON.stringify(senderEffectSound),
    );
  }, [senderEffectSound]);

  useEffect(() => {
    localStorage.setItem(
      "kchat_receiverEffectSound",
      JSON.stringify(receiverEffectSound),
    );
  }, [receiverEffectSound]);

  return (
    <SettingsContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        incomingMessageSound,
        setIncomingMessageSound,
        senderEffectSound,
        setSenderEffectSound,
        receiverEffectSound,
        setReceiverEffectSound,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
