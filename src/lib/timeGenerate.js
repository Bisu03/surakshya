
export const formattedTime = () => {
    const options = { timeZone: "Asia/Kolkata", hour: "numeric", minute: "numeric", hour12: true };
    return new Date().toLocaleTimeString("en-IN", options);
}