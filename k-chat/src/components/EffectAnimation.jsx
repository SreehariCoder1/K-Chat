import { useEffect, useRef } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import styles from "../styles/EffectAnimation.module.css";

const EffectAnimation = ({ onDone, role, effect }) => {
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    const soundVar = `VITE_${effect}_SOUND_URL`;
    const soundUrl = import.meta.env[soundVar];

    let shouldPlaySound = true;
    try {
      const soundEnabled = JSON.parse(
        localStorage.getItem("kchat_soundEnabled") ?? "true",
      );
      if (!soundEnabled) {
        shouldPlaySound = false;
      } else if (role === "sender") {
        shouldPlaySound = JSON.parse(
          localStorage.getItem("kchat_senderEffectSound") ?? "true",
        );
      } else if (role === "receiver") {
        shouldPlaySound = JSON.parse(
          localStorage.getItem("kchat_receiverEffectSound") ?? "true",
        );
      }
    } catch {
      // default true
    }

    if (soundUrl && shouldPlaySound) {
      const audio = new Audio(soundUrl);
      audio.volume = 1;
      audio.play().catch(() => {});
    }
    const timer = setTimeout(onDone, 10000);
    return () => clearTimeout(timer);
  }, [effect, onDone, role]);

  const handleLottieEvent = (event) => {
    if (event === "complete") {
      onDone();
    }
  };

  const posClass =
    role === "sender" ? styles.overlaySender : styles.overlayReceiver;

  const animVar = `VITE_${effect}_ANIM_URL`;
  const animUrl = import.meta.env[animVar];

  return (
    <div className={`${styles.overlay} ${posClass}`} onClick={onDone}>
      {animUrl ? (
        <Player
          src={animUrl}
          autoplay
          keepLastFrame={false}
          style={{ width: "100%", height: "100%" }}
          onEvent={handleLottieEvent}
        />
      ) : (
        <div>Effect Animation Missing</div>
      )}
    </div>
  );
};

export default EffectAnimation;
