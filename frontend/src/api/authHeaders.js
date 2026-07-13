// This function gets the stored token of the user and return Auth header "Authorization: `Bearer ${token}" that backend needs
export function getTokenforAuthHeader() {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}