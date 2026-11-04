import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // Use environment variable for API URL

const apiRequest = axios.create({
    baseURL: API_URL, // Set base URL from environment variables
    withCredentials: true,
});

export default apiRequest;
