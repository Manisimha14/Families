import axios from "axios";

const createApi = (baseURL) =>
  axios.create({
    baseURL: baseURL || undefined,
    timeout: 10000,
    withCredentials: true,
  });

const apiUrl = import.meta.env.VITE_API_URL;

export const authinstance = createApi(apiUrl ? `${apiUrl}/api/users` : "/api/users");
export const postInstance = createApi(apiUrl ? `${apiUrl}/api/post` : "/api/post");
export const storyInstance = createApi(apiUrl ? `${apiUrl}/api/story` : "/api/story");
