import createAxios from "./createAxios";

export const axios = async (url, method, body) => {
  try {
    const axios = createAxios();
    let response;
    switch (method.toUpperCase()) {
      case "GET":
        response = await axios.get(url);
        break;
      case "POST":
        response = await axios.post(url, body);
        break;
      case "PUT":
        response = await axios.put(url, body);
        break;
      case "PATCH":
        response = await axios.patch(url, body);
        break;
      case "DELETE":
        response = await axios.delete(url);
        break;
      default:
        throw new Error("예외가 발생");
    }

    const { data, status } = response;
    return { data, status };
  } catch (err) {
    // err.response가 undefined일 수 있으므로 안전하게 처리
    if (err.response) {
      const { data, status } = err.response;
      return { data, status };
    } else {
      // 네트워크 오류나 서버 연결 실패 등의 경우
      console.error("API 요청 실패:", err.message);
      return { data: null, status: 500 };
    }
  }
};
