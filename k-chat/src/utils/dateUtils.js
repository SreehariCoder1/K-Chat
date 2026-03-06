export const formatDateLabel = (dateString) => {
  if (!dateString) return "Today";
  const date = new Date(dateString);
  const today = new Date();

  // Set times to 00:00:00 for accurate day comparison
  const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const targetDate = resetTime(date);
  const currentDate = resetTime(today);

  const diffTime = Math.abs(currentDate - targetDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

export const formatTime = (dateString) => {
  if (!dateString)
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
