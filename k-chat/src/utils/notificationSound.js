let isUnlocked = false;

// Create a single shared Audio instance
export const notificationAudio =
  typeof window !== "undefined"
    ? new Audio("/assets/unread-message.mp3")
    : null;

export const initAudioUnlocker = () => {
  if (typeof window === "undefined" || !notificationAudio) return;

  const unlockAudio = () => {
    if (isUnlocked) return;

    notificationAudio.volume = 0;
    const playPromise = notificationAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          notificationAudio.pause();
          notificationAudio.currentTime = 0;
          notificationAudio.volume = 1; // restore volume
          isUnlocked = true;

          document.removeEventListener("click", unlockAudio);
          document.removeEventListener("keydown", unlockAudio);
          document.removeEventListener("touchstart", unlockAudio);
        })
        .catch((err) => {
          console.warn("Audio unlock failed, will try again:", err);
        });
    }
  };

  // Attach to common user interaction events
  document.addEventListener("click", unlockAudio);
  document.addEventListener("keydown", unlockAudio);
  document.addEventListener("touchstart", unlockAudio);
};

export const playNotificationSound = () => {
  if (!notificationAudio) return;

  // Reset time if it was already playing
  notificationAudio.currentTime = 0;

  const playPromise = notificationAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("Audio play failed (maybe no interaction yet):", err);
    });
  }
};
