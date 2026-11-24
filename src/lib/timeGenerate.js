
export const formattedTime = () => {
    const options = { timeZone: "Asia/Kolkata", hour: "numeric", minute: "numeric", hour12: true };
    return new Date().toLocaleTimeString("en-IN", options);
}

const TIME_PATTERN = /^(\d{1,2})[:.](\d{2})(?::\d{2})?(?:\s*([ap])\.?\s*m\.?)?$/i;

// Normalise a typed / time-picker / stored time to the same "h:mm am" style that
// formattedTime() produces: "15:30" -> "3:30 pm", "09:05" -> "9:05 am",
// "3:30PM" -> "3:30 pm". Anything unrecognised is returned unchanged.
export const formatTime = (value) => {
    if (value === null || value === undefined) return value;
    const text = String(value).replace(/ /g, " ").trim();
    const match = text.match(TIME_PATTERN);
    if (!match) return text;

    const hour = Number(match[1]);
    const minute = match[2];
    const meridiem = match[3]?.toLowerCase();
    if (Number(minute) > 59) return text;
    if (meridiem) {
        return hour >= 1 && hour <= 12 ? `${hour}:${minute} ${meridiem}m` : text;
    }
    if (hour > 23) return text;
    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "pm" : "am"}`;
}

// <input type="time"> only accepts 24-hour "HH:mm"; convert a stored time for it.
// Returns "" when the value is not a recognisable time.
export const toTimeInput = (value) => {
    const match = String(formatTime(value) ?? "").match(/^(1[0-2]|[1-9]):(\d{2}) ([ap])m$/);
    if (!match) return "";
    const hour = (Number(match[1]) % 12) + (match[3] === "p" ? 12 : 0);
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
}
