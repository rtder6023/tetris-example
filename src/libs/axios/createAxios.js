import axios from "axios";

export default function createAxios() {
  return axios.create({
    baseURL: "http://localhost:8081/api",
    withCredentials: true,
    timeout: 5000,
  });
}
