const BACK_END_URL = process.env.REACT_APP_BACK_END_URL ?? "http://localhost:8000";

export const login = async (values) => {
  return await fetch(`${BACK_END_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });
};

export const register = async (values) => {
  return await fetch(`${BACK_END_URL}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });
};
